import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { prioritizeComplaint } from '@/lib/algorithms/complaint-prioritization';

export const dynamic = 'force-dynamic';

const createComplaintSchema = z.object({
  category: z.enum([
    'SUSPECTED_WATER_CONTAMINATION',
    'SEWAGE_OVERFLOW',
    'STAGNANT_WASTEWATER',
    'BLOCKED_DRAINAGE',
    'UNHYGIENIC_PUBLIC_AREA',
    'IMPROPER_WASTE_DISPOSAL',
  ]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(3),
  sectionId: z.coerce.number().min(1).max(5),
  photoUrl: z.string().optional().nullable(),
  affectedHouseholds: z.coerce.number().int().min(1).default(1),
  isNearSensitiveFacility: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const isStaffOrAdmin = user && user.role !== 'RESIDENT';

    const complaints = await prisma.sanitationComplaint.findMany({
      where: isStaffOrAdmin ? {} : user ? { residentId: user.id } : {},
      include: {
        resident: { select: { name: true, phone: true } },
        assignedToUser: { select: { name: true, role: true } },
        statusLogs: { orderBy: { timestamp: 'asc' } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Failed to retrieve sanitation complaints' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createComplaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid complaint data' }, { status: 400 });
    }

    const {
      category,
      description,
      location,
      sectionId,
      photoUrl,
      affectedHouseholds,
      isNearSensitiveFacility,
    } = parsed.data;

    // Run deterministic, explainable priority algorithm
    const priorityResult = prioritizeComplaint({
      category,
      affectedHouseholds,
      submittedAt: new Date(),
      reopenCount: 0,
      isNearSensitiveFacility,
    });

    const complaint = await prisma.$transaction(async (tx) => {
      const created = await tx.sanitationComplaint.create({
        data: {
          residentId: user.id,
          category,
          description,
          location,
          sectionId,
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop',
          affectedHouseholds,
          priorityScore: priorityResult.score,
          calculatedPriority: priorityResult.priority,
          priorityReason: priorityResult.summaryExplanation,
          status: 'SUBMITTED',
        },
      });

      // Initial status log
      await tx.statusHistory.create({
        data: {
          complaintId: created.id,
          fromStatus: 'NONE',
          toStatus: 'SUBMITTED',
          changedByUserId: user.id,
          changedByName: user.name,
          comment: `Initial complaint logged. Priority calculated as ${priorityResult.priority} (${priorityResult.score}/100).`,
        },
      });

      return created;
    });

    // Notify Water & Sanitation Officers
    const officers = await prisma.user.findMany({
      where: { role: { in: ['WATER_SANITATION_OFFICER', 'ADMIN'] } },
      select: { id: true },
    });

    for (const off of officers) {
      await prisma.notification.create({
        data: {
          userId: off.id,
          title: `New Sanitation Complaint [${priorityResult.priority}]`,
          message: `${category.replace(/_/g, ' ')} at ${location} (Section ${sectionId}). Affected: ${affectedHouseholds} homes.`,
          category: 'SANITATION',
          link: '/sanitation',
        },
      });
    }

    return NextResponse.json({
      success: true,
      complaint,
      priorityResult,
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ error: 'Failed to record complaint' }, { status: 500 });
  }
}
