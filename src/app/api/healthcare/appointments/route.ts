import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const appointmentCreateSchema = z.object({
  doctorId: z.string().min(1),
  healthCenterId: z.string().min(1),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  timeSlot: z.string().min(1),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  priority: z.enum(['NORMAL', 'URGENT', 'SENIOR_CITIZEN', 'MATERNAL']).default('NORMAL'),
});

const appointmentUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']),
  staffNotes: z.string().optional(),
  rescheduledDate: z.string().optional(),
  rescheduledSlot: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const isStaffOrAdmin = user.role !== 'RESIDENT';
    const appointments = await prisma.appointment.findMany({
      where: isStaffOrAdmin ? {} : { residentId: user.id },
      include: {
        resident: { select: { id: true, name: true, phone: true, email: true, sectionId: true } },
        doctor: true,
        healthCenter: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = appointmentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid booking data' }, { status: 400 });
    }

    const { doctorId, healthCenterId, appointmentDate, timeSlot, reason, priority } = parsed.data;

    // Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { healthCenter: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Selected doctor not found' }, { status: 404 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        residentId: user.id,
        doctorId,
        healthCenterId,
        appointmentDate,
        timeSlot,
        reason,
        priority,
        status: 'PENDING',
      },
      include: {
        doctor: true,
        healthCenter: true,
      },
    });

    // Create confirmation notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Appointment Request Submitted',
        message: `Your booking request with ${doctor.name} for ${appointmentDate} (${timeSlot}) is under review by Kantheru OPD desk.`,
        category: 'HEALTHCARE',
        link: '/healthcare',
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json({ error: 'Failed to submit appointment' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = appointmentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const { id, status, staffNotes, rescheduledDate, rescheduledSlot } = parsed.data;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { resident: true, doctor: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Role check: Resident can only CANCEL their own appointment.
    // Staff/Admin can change status to APPROVED, REJECTED, RESCHEDULED, COMPLETED.
    if (user.role === 'RESIDENT') {
      if (existing.residentId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (status !== 'CANCELLED') {
        return NextResponse.json({ error: 'Residents may only cancel bookings' }, { status: 403 });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        staffNotes: staffNotes || existing.staffNotes,
        rescheduledDate: rescheduledDate || existing.rescheduledDate,
        rescheduledSlot: rescheduledSlot || existing.rescheduledSlot,
      },
    });

    // Notify resident of the status change
    await prisma.notification.create({
      data: {
        userId: existing.residentId,
        title: `Appointment ${status}`,
        message: `Your appointment with ${existing.doctor.name} on ${existing.appointmentDate} was marked as ${status}.${
          staffNotes ? ` Note: ${staffNotes}` : ''
        }`,
        category: 'HEALTHCARE',
        link: '/healthcare',
      },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
