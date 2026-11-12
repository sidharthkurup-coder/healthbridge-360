import { describe, it, expect } from 'vitest';
import { prioritizeComplaint } from '../complaint-prioritization';

describe('Deterministic Complaint Prioritisation Algorithm', () => {
  const refDate = new Date(Date.UTC(2026, 10, 12, 12, 0, 0));

  it('escalates suspected water contamination to CRITICAL priority with emergency escalation flag', () => {
    const result = prioritizeComplaint({
      category: 'SUSPECTED_WATER_CONTAMINATION',
      affectedHouseholds: 25,
      submittedAt: new Date(Date.UTC(2026, 10, 12, 6, 0, 0)),
      referenceDate: refDate,
    });

    expect(result.priority).toBe('CRITICAL');
    expect(result.requiresEmergencyEscalation).toBe(true);
    expect(result.targetResponseHours).toBeLessThanOrEqual(4);
    expect(result.summaryExplanation).toContain('SUSPECTED WATER CONTAMINATION');
    expect(result.score).toBeGreaterThanOrEqual(65);
  });

  it('boosts priority when a complaint is reopened after failed resolution', () => {
    const freshComplaint = prioritizeComplaint({
      category: 'BLOCKED_DRAINAGE',
      affectedHouseholds: 2,
      submittedAt: new Date(Date.UTC(2026, 10, 12, 10, 0, 0)),
      reopenCount: 0,
      referenceDate: refDate,
    });

    const reopenedComplaint = prioritizeComplaint({
      category: 'BLOCKED_DRAINAGE',
      affectedHouseholds: 2,
      submittedAt: new Date(Date.UTC(2026, 10, 12, 10, 0, 0)),
      reopenCount: 2, // Reopened twice
      referenceDate: refDate,
    });

    expect(reopenedComplaint.score).toBeGreaterThan(freshComplaint.score);
    const reopenFactor = reopenedComplaint.factorBreakdowns.find(f => f.factor.includes('Recurrence'));
    expect(reopenFactor).toBeDefined();
    expect(reopenFactor?.scoreAdded).toBe(15);
  });

  it('increases priority with unresolved aging days', () => {
    const newSubmission = prioritizeComplaint({
      category: 'IMPROPER_WASTE_DISPOSAL',
      affectedHouseholds: 1,
      submittedAt: new Date(Date.UTC(2026, 10, 12, 11, 0, 0)), // 1 hour ago
      referenceDate: refDate,
    });

    const agedSubmission = prioritizeComplaint({
      category: 'IMPROPER_WASTE_DISPOSAL',
      affectedHouseholds: 1,
      submittedAt: new Date(Date.UTC(2026, 10, 8, 11, 0, 0)), // 4 days ago
      referenceDate: refDate,
    });

    expect(agedSubmission.score).toBeGreaterThan(newSubmission.score);
  });

  it('provides transparent, explainable breakdown for every score component', () => {
    const result = prioritizeComplaint({
      category: 'SEWAGE_OVERFLOW',
      affectedHouseholds: 10,
      submittedAt: new Date(Date.UTC(2026, 10, 11, 12, 0, 0)), // 1 day ago
      reopenCount: 1,
      isNearSensitiveFacility: true,
      referenceDate: refDate,
    });

    expect(result.factorBreakdowns.length).toBeGreaterThanOrEqual(4);
    expect(result.factorBreakdowns.some(f => f.factor.includes('Public Health'))).toBe(true);
    expect(result.factorBreakdowns.some(f => f.factor.includes('Community Footprint'))).toBe(true);
    expect(result.factorBreakdowns.some(f => f.factor.includes('Unresolved Duration'))).toBe(true);
    expect(result.factorBreakdowns.some(f => f.factor.includes('High-Vulnerability Proximity'))).toBe(true);
    expect(result.summaryExplanation).toBeTruthy();
  });
});
