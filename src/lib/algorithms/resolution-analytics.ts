/**
 * Resolution Analytics Algorithm
 * 
 * Rules:
 * 1. Time from submission to acknowledgement (hours).
 * 2. Time from assignment to resolution (hours).
 * 3. Pending age for active complaints (days/hours).
 * 4. Reopened issue rate (% of cases with reopenCount > 0).
 * 5. Resolution percentage (% resolved out of total non-cancelled cases).
 * 6. Exclude unresolved cases from completed-resolution averages!
 * 7. Correctly handle missing or out-of-order timestamps without crashing or negative times.
 */

export interface ComplaintTimeRecord {
  id: string;
  category: string;
  status: string; // SUBMITTED, UNDER_REVIEW, ASSIGNED, IN_PROGRESS, RESOLVED, CANCELLED
  submittedAt: Date | string;
  acknowledgedAt?: Date | string | null;
  assignedAt?: Date | string | null;
  resolvedAt?: Date | string | null;
  reopenCount?: number;
}

export interface ResolutionAnalyticsSummary {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  cancelledComplaints: number;
  
  resolutionRatePercentage: number;
  reopenedRatePercentage: number;
  totalReopenedCases: number;
  
  // Completed case turnaround averages (in hours)
  averageAcknowledgementTimeHours: number | null; // null if no records acknowledged
  averageAssignmentToResolutionHours: number | null; // null if no resolved records with assignedAt
  averageTotalResolutionTimeHours: number | null; // null if no resolved records with submittedAt
  
  // Pending case aging
  averagePendingAgeHours: number | null;
  oldestPendingAgeDays: number | null;
  
  // Category breakdown
  categoryMetrics: Record<string, {
    total: number;
    resolved: number;
    pending: number;
    avgResolutionHours: number | null;
  }>;
}

export function parseNullableDate(val?: Date | string | null): Date | null {
  if (!val) return null;
  const d = typeof val === 'string' ? new Date(val) : val;
  return isNaN(d.getTime()) ? null : d;
}

export function computeResolutionAnalytics(
  records: ComplaintTimeRecord[],
  referenceDate: Date = new Date()
): ResolutionAnalyticsSummary {
  if (records.length === 0) {
    return {
      totalComplaints: 0,
      resolvedComplaints: 0,
      pendingComplaints: 0,
      inProgressComplaints: 0,
      cancelledComplaints: 0,
      resolutionRatePercentage: 0,
      reopenedRatePercentage: 0,
      totalReopenedCases: 0,
      averageAcknowledgementTimeHours: null,
      averageAssignmentToResolutionHours: null,
      averageTotalResolutionTimeHours: null,
      averagePendingAgeHours: null,
      oldestPendingAgeDays: null,
      categoryMetrics: {},
    };
  }

  const totalComplaints = records.length;
  let resolvedComplaints = 0;
  let inProgressComplaints = 0;
  let cancelledComplaints = 0;
  let pendingComplaints = 0;
  let reopenedCasesCount = 0;

  const ackTimesHours: number[] = [];
  const assignToResolveTimesHours: number[] = [];
  const totalResolveTimesHours: number[] = [];
  const pendingAgesHours: number[] = [];

  const categoryMap: Record<string, { total: number; resolved: number; pending: number; resolveTimes: number[] }> = {};

  for (const record of records) {
    const subDate = parseNullableDate(record.submittedAt);
    const ackDate = parseNullableDate(record.acknowledgedAt);
    const assignDate = parseNullableDate(record.assignedAt);
    const resolveDate = parseNullableDate(record.resolvedAt);

    if (!categoryMap[record.category]) {
      categoryMap[record.category] = { total: 0, resolved: 0, pending: 0, resolveTimes: [] };
    }
    categoryMap[record.category].total++;

    if ((record.reopenCount || 0) > 0) {
      reopenedCasesCount++;
    }

    if (record.status === 'RESOLVED') {
      resolvedComplaints++;
      categoryMap[record.category].resolved++;

      // Turnaround calculation: ONLY for completed resolved cases!
      if (subDate && resolveDate && resolveDate >= subDate) {
        const totalHours = (resolveDate.getTime() - subDate.getTime()) / (1000 * 60 * 60);
        totalResolveTimesHours.push(totalHours);
        categoryMap[record.category].resolveTimes.push(totalHours);
      }

      if (assignDate && resolveDate && resolveDate >= assignDate) {
        const assignHours = (resolveDate.getTime() - assignDate.getTime()) / (1000 * 60 * 60);
        assignToResolveTimesHours.push(assignHours);
      }
    } else if (record.status === 'CANCELLED') {
      cancelledComplaints++;
    } else {
      // Pending or In Progress
      if (record.status === 'IN_PROGRESS' || record.status === 'ASSIGNED') {
        inProgressComplaints++;
      } else {
        pendingComplaints++;
      }
      categoryMap[record.category].pending++;

      if (subDate) {
        const ageHours = Math.max(0, (referenceDate.getTime() - subDate.getTime()) / (1000 * 60 * 60));
        pendingAgesHours.push(ageHours);
      }
    }

    // Acknowledgement time (can occur in resolved or in-progress)
    if (subDate && ackDate && ackDate >= subDate) {
      const ackHours = (ackDate.getTime() - subDate.getTime()) / (1000 * 60 * 60);
      ackTimesHours.push(ackHours);
    }
  }

  const effectiveTotal = Math.max(1, totalComplaints - cancelledComplaints);
  const resolutionRatePercentage = Number(((resolvedComplaints / effectiveTotal) * 100).toFixed(1));
  const reopenedRatePercentage = Number(((reopenedCasesCount / totalComplaints) * 100).toFixed(1));

  const averageAcknowledgementTimeHours = ackTimesHours.length > 0
    ? Number((ackTimesHours.reduce((a, b) => a + b, 0) / ackTimesHours.length).toFixed(1))
    : null;

  const averageAssignmentToResolutionHours = assignToResolveTimesHours.length > 0
    ? Number((assignToResolveTimesHours.reduce((a, b) => a + b, 0) / assignToResolveTimesHours.length).toFixed(1))
    : null;

  const averageTotalResolutionTimeHours = totalResolveTimesHours.length > 0
    ? Number((totalResolveTimesHours.reduce((a, b) => a + b, 0) / totalResolveTimesHours.length).toFixed(1))
    : null;

  const averagePendingAgeHours = pendingAgesHours.length > 0
    ? Number((pendingAgesHours.reduce((a, b) => a + b, 0) / pendingAgesHours.length).toFixed(1))
    : null;

  const oldestPendingAgeDays = pendingAgesHours.length > 0
    ? Number((Math.max(...pendingAgesHours) / 24).toFixed(1))
    : null;

  const categoryMetrics: ResolutionAnalyticsSummary['categoryMetrics'] = {};
  for (const [cat, data] of Object.entries(categoryMap)) {
    categoryMetrics[cat] = {
      total: data.total,
      resolved: data.resolved,
      pending: data.pending,
      avgResolutionHours: data.resolveTimes.length > 0
        ? Number((data.resolveTimes.reduce((a, b) => a + b, 0) / data.resolveTimes.length).toFixed(1))
        : null,
    };
  }

  return {
    totalComplaints,
    resolvedComplaints,
    pendingComplaints,
    inProgressComplaints,
    cancelledComplaints,
    resolutionRatePercentage,
    reopenedRatePercentage,
    totalReopenedCases: reopenedCasesCount,
    averageAcknowledgementTimeHours,
    averageAssignmentToResolutionHours,
    averageTotalResolutionTimeHours,
    averagePendingAgeHours,
    oldestPendingAgeDays,
    categoryMetrics,
  };
}
