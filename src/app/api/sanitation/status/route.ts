import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { prioritizeComplaint } from '@/lib/algorithms/complaint-prioritization';

const updateStatusSchema = z.object({
  complaintId: z.string().min(1),
  status: z.enum(['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED']),
  comment: z.string().min(2, 'Comment or reason is required'),
  assignedDepartment: z.string().optional(),
  assignedToUserId: z.string().optional(),
  resolutionEvidenceUrl: z.string().optional(),
  resolutionNotes: z.string().optional(),
  reopenReason: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update status payload' }, { status: 400 });
    }

    const {
      complaintId,
      status,
      comment,
      assignedDepartment,
      assignedToUserId,
      resolutionEvidenceUrl,
      resolutionNotes,
      reopenReason,
    } = parsed.data;

    const existing = await prisma.sanitationComplaint.findUnique({
      where: { id: complaintId },
      include: { resident: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const now = new Date();
    const updateData: any = {};
    let targetStatus = status;

    // Handle Reopen Flow
    if (status === 'REOPENED') {
      // Reopening is permitted by the reporter or admin
      if (user.role === 'RESIDENT' && existing.residentId !== user.id) {
        return NextResponse.json({ error: 'You may only reopen your own complaints' }, { status: 403 });
      }

      const newReopenCount = existing.reopenCount + 1;
      // Recalculate priority with reopened penalty boost!
      const recalculatedPriority = prioritizeComplaint({
        category: existing.category,
        affectedHouseholds: existing.affectedHouseholds,
        submittedAt: existing.submittedAt,
        reopenCount: newReopenCount,
      });

      targetStatus = 'UNDER_REVIEW'; // Move back to review
      updateData.status = targetStatus;
      updateData.reopenCount = newReopenCount;
      updateData.reopenReason = reopenReason || comment;
      updateData.reopenedAt = now;
      updateData.priorityScore = recalculatedPriority.score;
      updateData.calculatedPriority = recalculatedPriority.priority;
      updateData.priorityReason = recalculatedPriority.summaryExplanation;
    } else {
      // Regular staff advancement
      if (user.role === 'RESIDENT') {
        return NextResponse.json({ error: 'Residents cannot perform staff status advancements' }, { status: 403 });
      }

      updateData.status = targetStatus;

      if (targetStatus === 'UNDER_REVIEW' && !existing.acknowledgedAt) {
        updateData.acknowledgedAt = now;
      } else if (targetStatus === 'ASSIGNED') {
        updateData.assignedAt = now;
        if (assignedDepartment) updateData.assignedDepartment = assignedDepartment;
        if (assignedToUserId) updateData.assignedToUserId = assignedToUserId;
      } else if (targetStatus === 'RESOLVED') {
        updateData.resolvedAt = now;
        if (resolutionEvidenceUrl) updateData.resolutionEvidenceUrl = resolutionEvidenceUrl;
        if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.sanitationComplaint.update({
        where: { id: complaintId },
        data: updateData,
      });

      await tx.statusHistory.create({
        data: {
          complaintId,
          fromStatus: existing.status,
          toStatus: targetStatus,
          changedByUserId: user.id,
          changedByName: user.name,
          comment,
        },
      });

      return c;
    });

    // Notify resident of the change
    await prisma.notification.create({
      data: {
        userId: existing.residentId,
        title: `Sanitation Complaint ${targetStatus}`,
        message: `Your complaint for ${existing.category.replace(/_/g, ' ')} has transitioned to ${targetStatus}.${
          comment ? ` Remarks: ${comment}` : ''
        }`,
        category: 'SANITATION',
        link: '/sanitation',
      },
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: any) {
    console.error('Error updating sanitation status:', error);
    return NextResponse.json({ error: error.message || 'Status transition failed' }, { status: 500 });
  }
}
