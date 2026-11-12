import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ambulanceStatusSchema = z.object({
  ambulanceId: z.string().min(1),
  status: z.enum(['AVAILABLE', 'ON_DUTY', 'MAINTENANCE', 'OFFLINE']),
});

export async function GET() {
  try {
    const ambulances = await prisma.ambulanceService.findMany({
      orderBy: { vehicleNumber: 'asc' },
    });
    return NextResponse.json({ success: true, ambulances });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch ambulances' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMERGENCY_COORDINATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Emergency Coordinator or Admin required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = ambulanceStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ambulance status payload' }, { status: 400 });
    }

    const { ambulanceId, status } = parsed.data;
    const updated = await prisma.ambulanceService.update({
      where: { id: ambulanceId },
      data: {
        status,
        lastStatusUpdate: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AMBULANCE_STATUS_UPDATED',
        entityType: 'AmbulanceService',
        entityId: ambulanceId,
        details: JSON.stringify({ vehicleNumber: updated.vehicleNumber, status }),
      },
    });

    return NextResponse.json({ success: true, ambulance: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update ambulance status' }, { status: 500 });
  }
}
