import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const updateStatusSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(['ACKNOWLEDGED', 'CONTACTED', 'DISPATCHED', 'RESOLVED', 'UNAVAILABLE', 'CANCELLED']),
  responderNotes: z.string().min(2),
  assignedAmbulanceId: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMERGENCY_COORDINATOR' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Only Emergency Coordinators can update dispatch status' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update status payload' }, { status: 400 });
    }

    const { requestId, status, responderNotes, assignedAmbulanceId } = parsed.data;

    const existing = await prisma.emergencyRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Emergency request not found' }, { status: 404 });
    }

    let existingLogs = [];
    try {
      existingLogs = JSON.parse(existing.responseLog || '[]');
    } catch {
      existingLogs = [];
    }

    const now = new Date();
    existingLogs.push({
      status,
      timestamp: now.toISOString(),
      note: responderNotes,
      officer: user.name,
    });

    const updateData: any = {
      status,
      responderNotes,
      responseLog: JSON.stringify(existingLogs),
    };

    if (assignedAmbulanceId) {
      updateData.assignedAmbulanceId = assignedAmbulanceId;
      // Mark ambulance as ON_DUTY if dispatched
      if (status === 'DISPATCHED') {
        await prisma.ambulanceService.update({
          where: { id: assignedAmbulanceId },
          data: { status: 'ON_DUTY', lastStatusUpdate: now },
        });
      } else if (status === 'RESOLVED' || status === 'CANCELLED') {
        await prisma.ambulanceService.update({
          where: { id: assignedAmbulanceId },
          data: { status: 'AVAILABLE', lastStatusUpdate: now },
        });
      }
    }

    if (status === 'ACKNOWLEDGED' && !existing.acknowledgedAt) {
      updateData.acknowledgedAt = now;
    } else if (status === 'DISPATCHED' && !existing.dispatchedAt) {
      updateData.dispatchedAt = now;
    } else if (status === 'RESOLVED' && !existing.resolvedAt) {
      updateData.resolvedAt = now;
    }

    const updated = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    // Notify resident if linked
    if (existing.residentId) {
      await prisma.notification.create({
        data: {
          userId: existing.residentId,
          title: `Emergency Dispatch Status: ${status}`,
          message: `Your emergency ticket status is now ${status}. Responder Note: ${responderNotes}`,
          category: 'EMERGENCY',
          link: '/emergency',
        },
      });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Error updating emergency status:', error);
    return NextResponse.json({ error: error.message || 'Failed to update emergency ticket' }, { status: 500 });
  }
}
