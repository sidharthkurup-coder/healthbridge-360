import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  callerName: z.string().min(2),
  callerPhone: z.string().min(10),
  patientCondition: z.string().min(5),
  locationDescription: z.string().min(5),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  locationConsentGiven: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  try {
    const isCoordinatorOrAdmin = user && (user.role === 'EMERGENCY_COORDINATOR' || user.role === 'ADMIN');

    const [requests, ambulances, facilities, contacts] = await Promise.all([
      prisma.emergencyRequest.findMany({
        where: isCoordinatorOrAdmin ? {} : user ? { residentId: user.id } : { residentId: 'NONE' },
        include: {
          assignedAmbulance: true,
          resident: { select: { name: true, phone: true } },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.ambulanceService.findMany({
        orderBy: { status: 'asc' },
      }),
      prisma.hospitalFacility.findMany({
        orderBy: { distanceKm: 'asc' },
      }),
      prisma.emergencyContact.findMany({
        orderBy: { operational24x7: 'desc' },
      }),
    ]);

    return NextResponse.json({
      requests,
      ambulances,
      facilities,
      contacts,
    });
  } catch (error) {
    console.error('Error fetching emergency data:', error);
    return NextResponse.json({ error: 'Failed to retrieve emergency data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid emergency request payload' }, { status: 400 });
    }

    const {
      callerName,
      callerPhone,
      patientCondition,
      locationDescription,
      latitude,
      longitude,
      locationConsentGiven,
    } = parsed.data;

    const initialLog = [
      {
        status: 'SUBMITTED',
        timestamp: new Date().toISOString(),
        note: 'Emergency incident submitted via HealthBridge portal. Awaiting phone triage verification.',
      },
    ];

    const emergencyReq = await prisma.emergencyRequest.create({
      data: {
        residentId: user?.id || null,
        callerName,
        callerPhone,
        patientCondition,
        locationDescription,
        latitude: locationConsentGiven ? latitude : null,
        longitude: locationConsentGiven ? longitude : null,
        locationConsentGiven,
        status: 'SUBMITTED',
        responseLog: JSON.stringify(initialLog),
      },
    });

    // Alert emergency coordinators
    const coordinators = await prisma.user.findMany({
      where: { role: { in: ['EMERGENCY_COORDINATOR', 'ADMIN'] } },
      select: { id: true },
    });

    for (const coord of coordinators) {
      await prisma.notification.create({
        data: {
          userId: coord.id,
          title: `NEW EMERGENCY: ${patientCondition.slice(0, 30)}...`,
          message: `Caller: ${callerName} (${callerPhone}) at ${locationDescription}. Immediate phone triage required.`,
          category: 'EMERGENCY',
          link: '/emergency',
        },
      });
    }

    return NextResponse.json({
      success: true,
      request: emergencyReq,
      notice: 'Emergency ticket logged. If this is a life-threatening crisis, call 108 directly without waiting.',
    });
  } catch (error) {
    console.error('Error creating emergency request:', error);
    return NextResponse.json({ error: 'Failed to record emergency request' }, { status: 500 });
  }
}
