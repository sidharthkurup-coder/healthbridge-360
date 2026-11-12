import { describe, it, expect } from 'vitest';
import {
  computeResolutionAnalytics,
  ComplaintTimeRecord,
} from '../resolution-analytics';

describe('Resolution Analytics Algorithm', () => {
  const refDate = new Date(Date.UTC(2026, 10, 12, 12, 0, 0));

  it('correctly calculates resolution rate and excludes unresolved cases from turnaround averages', () => {
    const records: ComplaintTimeRecord[] = [
      {
        id: 'c1',
        category: 'SEWAGE_OVERFLOW',
        status: 'RESOLVED',
        submittedAt: '2026-11-10T08:00:00Z',
        acknowledgedAt: '2026-11-10T09:00:00Z', // 1 hr
        assignedAt: '2026-11-10T10:00:00Z',
        resolvedAt: '2026-11-10T14:00:00Z', // 4 hrs from assign, 6 hrs total
        reopenCount: 0,
      },
      {
        id: 'c2',
        category: 'BLOCKED_DRAINAGE',
        status: 'RESOLVED',
        submittedAt: '2026-11-11T08:00:00Z',
        acknowledgedAt: '2026-11-11T10:00:00Z', // 2 hrs
        assignedAt: '2026-11-11T12:00:00Z',
        resolvedAt: '2026-11-11T16:00:00Z', // 4 hrs from assign, 8 hrs total
        reopenCount: 1, // Reopened case
      },
      {
        id: 'c3',
        category: 'UNHYGIENIC_PUBLIC_AREA',
        status: 'IN_PROGRESS',
        submittedAt: '2026-11-11T12:00:00Z',
        acknowledgedAt: '2026-11-11T13:00:00Z', // 1 hr
        assignedAt: '2026-11-11T14:00:00Z',
        resolvedAt: null, // NOT resolved! Must not affect completed turnaround average
        reopenCount: 0,
      },
    ];

    const result = computeResolutionAnalytics(records, refDate);
    expect(result.totalComplaints).toBe(3);
    expect(result.resolvedComplaints).toBe(2);
    expect(result.inProgressComplaints).toBe(1);
    expect(result.resolutionRatePercentage).toBe(66.7);
    expect(result.reopenedRatePercentage).toBe(33.3);

    // Acknowledgement times: c1=1hr, c2=2hr, c3=1hr => avg (1+2+1)/3 = 1.33 hrs -> 1.3 hrs
    expect(result.averageAcknowledgementTimeHours).toBe(1.3);

    // Assignment to resolution times: c1=(14-10)=4h, c2=(16-12)=4h => avg 4.0 hrs (c3 excluded!)
    expect(result.averageAssignmentToResolutionHours).toBe(4.0);

    // Total resolution times: c1=(14-8)=6h, c2=(16-8)=8h => avg 7.0 hrs (c3 excluded!)
    expect(result.averageTotalResolutionTimeHours).toBe(7.0);

    // Pending age: c3 submitted 2026-11-11 12:00, refDate 2026-11-12 12:00 => 24.0 hours
    expect(result.averagePendingAgeHours).toBe(24.0);
  });

  it('safely handles empty complaints list with professional zero/null metrics', () => {
    const result = computeResolutionAnalytics([], refDate);
    expect(result.totalComplaints).toBe(0);
    expect(result.resolvedComplaints).toBe(0);
    expect(result.resolutionRatePercentage).toBe(0);
    expect(result.averageAcknowledgementTimeHours).toBeNull();
    expect(result.averageAssignmentToResolutionHours).toBeNull();
    expect(result.averagePendingAgeHours).toBeNull();
  });
});
