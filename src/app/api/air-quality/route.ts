import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateCpcbAqi, prioritizeAirIncident } from '@/lib/algorithms/air-quality';

export const dynamic = 'force-dynamic';

const readingSchema = z.object({
  type: z.literal('READING'),
  sectionId: z.coerce.number().int().min(1).max(5),
  monitoringPoint: z.string().min(3),
  recordedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pm25UgM3: z.coerce.number().min(0).nullable().optional(),
  pm10UgM3: z.coerce.number().min(0).nullable().optional(),
  no2UgM3: z.coerce.number().min(0).nullable().optional(),
  so2UgM3: z.coerce.number().min(0).nullable().optional(),
  coMgM3: z.coerce.number().min(0).nullable().optional(),
  notes: z.string().optional(),
});

const incidentSchema = z.object({
  type: z.literal('INCIDENT'),
  sectionId: z.coerce.number().int().min(1).max(5),
  category: z.enum([
    'GARBAGE_PLASTIC_BURNING',
    'STUBBLE_CROP_BURNING',
    'INDUSTRIAL_BRICK_KILN_SMOKE',
    'CONSTRUCTION_ROAD_DUST',
    'VEHICULAR_CONGESTION',
  ]),
  location: z.string().min(3),
  description: z.string().min(8),
  affectedHouseholds: z.coerce.number().int().min(1).default(5),
  isNearSensitiveFacility: z.boolean().default(false),
});

const updateIncidentSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['REPORTED', 'WATER_SPRINKLER_DISPATCHED', 'ENFORCEMENT_ACTION', 'RESOLVED']),
  actionNotes: z.string().optional(),
});

export async function GET() {
  try {
    const [readings, incidents, sections] = await Promise.all([
      prisma.airQualityReading.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { recordedByUser: { select: { name: true, role: true } } },
      }),
      prisma.airPollutionIncident.findMany({
        orderBy: [{ severityScore: 'desc' }, { createdAt: 'desc' }],
        include: { reporter: { select: { name: true, phone: true } } },
      }),
      prisma.waterSection.findMany({ orderBy: { id: 'asc' } }),
    ]);

    const sectionSummaries = [1, 2, 3, 4, 5].map((secId) => {
      const secMeta = sections.find((s) => s.id === secId);
      const latest = readings.find((r) => r.sectionId === secId) || null;
      const assessment = latest
        ? calculateCpcbAqi({
            pm25UgM3: latest.pm25UgM3,
            pm10UgM3: latest.pm10UgM3,
            no2UgM3: latest.no2UgM3,
            so2UgM3: latest.so2UgM3,
            coMgM3: latest.coMgM3,
          })
        : calculateCpcbAqi({});

      const activeIncidentsCount = incidents.filter(
        (inc) => inc.sectionId === secId && inc.status !== 'RESOLVED'
      ).length;

      return {
        sectionId: secId,
        sectionName: secMeta?.name || `Section ${secId}`,
        latestReading: latest,
        assessment,
        activeIncidentsCount,
      };
    });

    const validAqis = sectionSummaries
      .map((s) => s.assessment.aqi)
      .filter((v): v is number => v !== null);
    const villageAverageAqi =
      validAqis.length > 0
        ? Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length)
        : null;

    return NextResponse.json({
      readings,
      incidents,
      sectionSummaries,
      villageAverageAqi,
    });
  } catch (error) {
    console.error('Error loading air quality data:', error);
    return NextResponse.json({ error: 'Failed to load air quality data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body?.type === 'READING') {
      if (user.role !== 'WATER_SANITATION_OFFICER' && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Unauthorized: Environmental/Sanitation Officer or Admin required to log station readings' },
          { status: 403 }
        );
      }

      const parsed = readingSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid sensor reading' }, { status: 400 });
      }

      const { sectionId, monitoringPoint, recordedDate, pm25UgM3, pm10UgM3, no2UgM3, so2UgM3, coMgM3, notes } =
        parsed.data;

      const assessment = calculateCpcbAqi({ pm25UgM3, pm10UgM3, no2UgM3, so2UgM3, coMgM3 });

      const created = await prisma.airQualityReading.create({
        data: {
          sectionId,
          monitoringPoint,
          recordedDate,
          pm25UgM3: pm25UgM3 ?? null,
          pm10UgM3: pm10UgM3 ?? null,
          no2UgM3: no2UgM3 ?? null,
          so2UgM3: so2UgM3 ?? null,
          coMgM3: coMgM3 ?? null,
          calculatedAqi: assessment.aqi,
          aqiCategory: assessment.category,
          dominantPollutant: assessment.dominantPollutant,
          recordedById: user.id,
          notes,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AIR_QUALITY_LOGGED',
          entityType: 'AirQualityReading',
          entityId: created.id,
          details: JSON.stringify({ sectionId, aqi: assessment.aqi, category: assessment.category }),
        },
      });

      return NextResponse.json({ success: true, reading: created, assessment });
    }

    const parsedIncident = incidentSchema.safeParse({ ...body, type: 'INCIDENT' });
    if (!parsedIncident.success) {
      return NextResponse.json(
        { error: parsedIncident.error.errors[0]?.message || 'Invalid air pollution report' },
        { status: 400 }
      );
    }

    const { sectionId, category, location, description, affectedHouseholds, isNearSensitiveFacility } =
      parsedIncident.data;
    const priorityResult = prioritizeAirIncident({ category, affectedHouseholds, isNearSensitiveFacility });

    const incident = await prisma.airPollutionIncident.create({
      data: {
        reporterId: user.id,
        sectionId,
        category,
        location,
        description,
        affectedHouseholds,
        isNearSensitiveFacility,
        severityScore: priorityResult.severityScore,
        priority: priorityResult.priority,
        recommendedUnit: priorityResult.recommendedUnit,
        status: 'REPORTED',
      },
    });

    const officers = await prisma.user.findMany({
      where: { role: { in: ['WATER_SANITATION_OFFICER', 'ADMIN'] } },
      select: { id: true },
    });

    if (officers.length > 0) {
      await prisma.notification.createMany({
        data: officers.map((off) => ({
          userId: off.id,
          title: `Clean Air Alert (${priorityResult.priority}): Section ${sectionId}`,
          message: `${category.replace(/_/g, ' ')} reported at ${location}. Recommended: ${priorityResult.recommendedUnit}.`,
          category: 'SANITATION',
          link: '/air-quality',
        })),
      });
    }

    return NextResponse.json({ success: true, incident, priorityResult });
  } catch (error: any) {
    console.error('Error in POST /api/air-quality:', error);
    return NextResponse.json({ error: error.message || 'Air quality operation failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'WATER_SANITATION_OFFICER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Officer or Admin required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateIncidentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }

    const { id, status, actionNotes } = parsed.data;
    const existing = await prisma.airPollutionIncident.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const updated = await prisma.airPollutionIncident.update({
      where: { id },
      data: {
        status,
        actionNotes: actionNotes || existing.actionNotes,
        resolvedAt: status === 'RESOLVED' ? new Date() : existing.resolvedAt,
      },
    });

    await prisma.notification.create({
      data: {
        userId: existing.reporterId,
        title: `Air Pollution Action: ${status.replace(/_/g, ' ')}`,
        message: `Your Section ${existing.sectionId} clean air report is now ${status.replace(/_/g, ' ')}.${actionNotes ? ` (${actionNotes})` : ''}`,
        category: 'SANITATION',
        link: '/air-quality',
      },
    });

    return NextResponse.json({ success: true, incident: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}
