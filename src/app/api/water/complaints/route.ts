import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const complaintSchema = z.object({
  sectionId: z.coerce.number().min(1).max(5),
  issueType: z.enum(['SUPPLY_INTERRUPTION', 'LOW_PRESSURE', 'CONTAMINATED_WATER', 'ODOR_TASTE', 'PIPELINE_LEAKAGE']),
  description: z.string().min(5),
  affectedHouseholds: z.coerce.number().int().min(1).default(1),
});

export async function GET() {
  try {
    const complaints = await prisma.waterComplaint.findMany({
      include: {
        resident: { select: { name: true, phone: true } },
        section: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch water complaints' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = complaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid complaint data' }, { status: 400 });
    }

    const complaint = await prisma.waterComplaint.create({
      data: {
        residentId: user.id,
        ...parsed.data,
        status: 'SUBMITTED',
      },
    });

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record complaint' }, { status: 500 });
  }
}

const updateComplaintSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED']),
  adminNotes: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'WATER_SANITATION_OFFICER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized: Water Officer or Admin role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateComplaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid complaint update payload' }, { status: 400 });
    }

    const { id, status, adminNotes } = parsed.data;
    const existing = await prisma.waterComplaint.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Water complaint not found' }, { status: 404 });
    }

    const updated = await prisma.waterComplaint.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || existing.adminNotes,
        resolvedAt: status === 'RESOLVED' ? new Date() : existing.resolvedAt,
      },
    });

    await prisma.notification.create({
      data: {
        userId: existing.residentId,
        title: `Water Complaint ${status}`,
        message: `Your Section ${existing.sectionId} water report is now ${status}.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
        category: 'WATER',
        link: '/water',
      },
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update water complaint' }, { status: 500 });
  }
}
