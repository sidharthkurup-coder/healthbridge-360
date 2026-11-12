import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { analyzeSectionWaterSupply, WaterRecordInput } from '@/lib/algorithms/water-distribution';

export const dynamic = 'force-dynamic';

const supplyRecordSchema = z.object({
  sectionId: z.coerce.number().min(1).max(5),
  supplyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  actualStartTime: z.string().min(1),
  actualEndTime: z.string().min(1),
  actualDurationMinutes: z.coerce.number().int().positive(),
  quantitySuppliedKL: z.coerce.number().positive(),
  flowRateLpm: z.coerce.number().nullable().optional(),
  pressureBar: z.coerce.number().nullable().optional(),
  interruptionOccurred: z.boolean().default(false),
  interruptionReason: z.string().optional().nullable(),
  status: z.enum(['COMPLETED', 'PARTIAL', 'CANCELLED']).default('COMPLETED'),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const [sections, records, schedules] = await Promise.all([
      prisma.waterSection.findMany({
        orderBy: { id: 'asc' },
      }),
      prisma.waterSupplyRecord.findMany({
        orderBy: { supplyDate: 'desc' },
        include: {
          section: true,
          recordedByUser: { select: { name: true, role: true } },
        },
      }),
      prisma.waterSupplySchedule.findMany({
        orderBy: { sectionId: 'asc' },
      }),
    ]);

    // Format records for algorithm analysis
    const recordInputs: WaterRecordInput[] = records.map((r) => ({
      id: r.id,
      sectionId: r.sectionId,
      supplyDate: r.supplyDate,
      actualDurationMinutes: r.actualDurationMinutes,
      quantitySuppliedKL: r.quantitySuppliedKL,
      flowRateLpm: r.flowRateLpm,
      pressureBar: r.pressureBar,
      interruptionOccurred: r.interruptionOccurred,
      interruptionReason: r.interruptionReason,
      status: r.status,
    }));

    // Run five-section comparative analysis algorithm
    const sectionAnalyses = sections.map((sec) => {
      return analyzeSectionWaterSupply(sec.id, recordInputs, new Date());
    });

    return NextResponse.json({
      sections,
      schedules,
      records,
      sectionAnalyses,
    });
  } catch (error) {
    console.error('Error fetching water supply data:', error);
    return NextResponse.json({ error: 'Failed to retrieve water supply data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'WATER_SANITATION_OFFICER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Water Officer or Admin role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = supplyRecordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid supply record data' }, { status: 400 });
    }

    const newRecord = await prisma.waterSupplyRecord.create({
      data: {
        ...parsed.data,
        recordedByUserId: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'WATER_SUPPLY_LOGGED',
        entityType: 'WaterSupplyRecord',
        entityId: newRecord.id,
        details: JSON.stringify({
          sectionId: newRecord.sectionId,
          date: newRecord.supplyDate,
          quantityKL: newRecord.quantitySuppliedKL,
          duration: newRecord.actualDurationMinutes,
        }),
      },
    });

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error) {
    console.error('Error creating water supply record:', error);
    return NextResponse.json({ error: 'Failed to log water supply record' }, { status: 500 });
  }
}
