import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const scheduleUpdateSchema = z.object({
  sectionId: z.coerce.number().int().min(1).max(5),
  scheduledStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
  scheduledEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'),
  targetQuantityKL: z.coerce.number().positive(),
  isActive: z.boolean().default(true),
});

function calcDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 120;
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'WATER_SANITATION_OFFICER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Water Officer or Admin role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = scheduleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid schedule configuration' }, { status: 400 });
    }

    const { sectionId, scheduledStartTime, scheduledEndTime, targetQuantityKL, isActive } = parsed.data;
    const durationMinutes = calcDurationMinutes(scheduledStartTime, scheduledEndTime);

    const existing = await prisma.waterSupplySchedule.findMany({
      where: { sectionId },
    });

    if (existing.length > 0) {
      await prisma.waterSupplySchedule.updateMany({
        where: { sectionId },
        data: {
          scheduledStartTime,
          scheduledEndTime,
          durationMinutes,
          targetQuantityKL,
          isActive,
        },
      });
    } else {
      await prisma.waterSupplySchedule.create({
        data: {
          sectionId,
          dayOfWeek: 1,
          scheduledStartTime,
          scheduledEndTime,
          durationMinutes,
          targetQuantityKL,
          isActive,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'WATER_SCHEDULE_CONFIGURED',
        entityType: 'WaterSection',
        entityId: String(sectionId),
        details: JSON.stringify({ scheduledStartTime, scheduledEndTime, durationMinutes, targetQuantityKL, isActive }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error configuring water schedule:', error);
    return NextResponse.json({ error: error.message || 'Failed to update schedule' }, { status: 500 });
  }
}
