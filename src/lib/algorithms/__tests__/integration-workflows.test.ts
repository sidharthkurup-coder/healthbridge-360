import { describe, it, expect } from 'vitest';
import {
  calculateMedicineStock,
  planStockDeductionFEFO,
  BatchItem,
} from '../medicine-inventory';
import {
  analyzeSectionWaterSupply,
  assessWaterQuality,
  WaterRecordInput,
  WaterQualityInput,
} from '../water-distribution';
import { prioritizeComplaint } from '../complaint-prioritization';
import { computeResolutionAnalytics, ComplaintTimeRecord } from '../resolution-analytics';

describe('HealthBridge 360 Full Cross-Module Integration Workflows', () => {
  const referenceDate = new Date(Date.UTC(2026, 10, 12, 12, 0, 0));

  it('Module 2 -> Module 6: FEFO stock deduction triggers low stock alerts that reflect in intelligence', () => {
    // Initial inventory
    const batches: BatchItem[] = [
      { id: 'b1', batchNumber: 'PARA-EARLY', currentQuantity: 40, expiryDate: '2026-12-01' },
      { id: 'b2', batchNumber: 'PARA-LATE', currentQuantity: 80, expiryDate: '2027-06-01' },
      { id: 'b3', batchNumber: 'PARA-EXP', currentQuantity: 50, expiryDate: '2026-05-01' }, // expired
    ];

    const initialStock = calculateMedicineStock(batches, 50, referenceDate);
    expect(initialStock.totalAvailableStock).toBe(120);
    expect(initialStock.totalExpiredStock).toBe(50);
    expect(initialStock.stockStatus).toBe('ADEQUATE');

    // Deduct 80 units
    const plan = planStockDeductionFEFO(batches, 80, referenceDate);
    expect(plan.success).toBe(true);
    expect(plan.allocations[0].batchId).toBe('b1');
    expect(plan.allocations[0].deductedQuantity).toBe(40);
    expect(plan.allocations[1].batchId).toBe('b2');
    expect(plan.allocations[1].deductedQuantity).toBe(40);

    // Update batch quantities
    const updatedBatches: BatchItem[] = [
      { id: 'b1', batchNumber: 'PARA-EARLY', currentQuantity: 0, expiryDate: '2026-12-01' },
      { id: 'b2', batchNumber: 'PARA-LATE', currentQuantity: 40, expiryDate: '2027-06-01' },
      { id: 'b3', batchNumber: 'PARA-EXP', currentQuantity: 50, expiryDate: '2026-05-01' },
    ];

    const newStock = calculateMedicineStock(updatedBatches, 50, referenceDate);
    expect(newStock.totalAvailableStock).toBe(40);
    expect(newStock.isLowStock).toBe(true);
    expect(newStock.stockStatus).toBe('LOW_STOCK');
  });

  it('Module 4: 5-section water comparison computes accurate flow metrics and separates missing sensors', () => {
    const section1Records: WaterRecordInput[] = [
      {
        id: 'r1',
        sectionId: 1,
        supplyDate: '2026-11-10',
        actualDurationMinutes: 120,
        quantitySuppliedKL: 65,
        flowRateLpm: 540,
        pressureBar: 2.1,
        interruptionOccurred: false,
        status: 'COMPLETED',
      },
      {
        id: 'r2',
        sectionId: 1,
        supplyDate: '2026-11-11',
        actualDurationMinutes: 130,
        quantitySuppliedKL: 70,
        flowRateLpm: null, // missing sensor
        pressureBar: 2.2,
        interruptionOccurred: true,
        interruptionReason: 'Voltage sag',
        status: 'PARTIAL',
      },
    ];

    const section4Records: WaterRecordInput[] = [
      {
        id: 'r3',
        sectionId: 4,
        supplyDate: '2026-11-10',
        actualDurationMinutes: 110,
        quantitySuppliedKL: 55,
        flowRateLpm: null,
        pressureBar: null,
        interruptionOccurred: false,
        status: 'COMPLETED',
      },
    ];

    const allRecords = [...section1Records, ...section4Records];
    const sec1Analysis = analyzeSectionWaterSupply(1, allRecords, referenceDate);
    const sec4Analysis = analyzeSectionWaterSupply(4, allRecords, referenceDate);

    expect(sec1Analysis.totalMeasuredVolumeKL).toBe(135);
    expect(sec1Analysis.averageFlowRateLpm).toBe(540); // Not diluted by null!
    expect(sec1Analysis.interruptionRatePercentage).toBe(50.0);

    expect(sec4Analysis.totalMeasuredVolumeKL).toBe(55);
    expect(sec4Analysis.averageFlowRateLpm).toBeNull();
    expect(sec4Analysis.hasMissingMeasurements).toBe(true);
  });

  it('Module 4: Never declares water safe with missing parameters or unverified status', () => {
    const incompleteReport: WaterQualityInput = {
      id: 'q1',
      sectionId: 1,
      testDate: '2026-11-10',
      verificationStatus: 'VERIFIED',
      phValue: 7.2,
      tdsPpm: 320,
      fluorideMgL: 0.8,
      sodiumMgL: null, // Missing sodium! Never infer from TDS!
      microbialColiformColonies: 0,
    };

    const assessment = assessWaterQuality(incompleteReport);
    expect(assessment.hasIncompleteParameters).toBe(true);
    expect(assessment.overallPotabilityStatus).toBe('INCOMPLETE_DATA');
  });

  it('Module 5 -> Module 6: Complaint prioritization and resolution turnaround pipeline', () => {
    // 1. Prioritize critical water contamination
    const priority = prioritizeComplaint({
      category: 'SUSPECTED_WATER_CONTAMINATION',
      affectedHouseholds: 30,
      submittedAt: new Date(Date.UTC(2026, 10, 11, 8, 0, 0)),
      referenceDate,
    });
    expect(priority.priority).toBe('CRITICAL');
    expect(priority.requiresEmergencyEscalation).toBe(true);

    // 2. Feed complaints into Resolution Analytics
    const records: ComplaintTimeRecord[] = [
      {
        id: 'c1',
        category: 'SUSPECTED_WATER_CONTAMINATION',
        status: 'RESOLVED',
        submittedAt: '2026-11-10T08:00:00Z',
        acknowledgedAt: '2026-11-10T08:30:00Z',
        assignedAt: '2026-11-10T09:00:00Z',
        resolvedAt: '2026-11-10T12:00:00Z',
        reopenCount: 0,
      },
      {
        id: 'c2',
        category: 'SEWAGE_OVERFLOW',
        status: 'RESOLVED',
        submittedAt: '2026-11-11T09:00:00Z',
        acknowledgedAt: '2026-11-11T09:30:00Z',
        assignedAt: '2026-11-11T10:00:00Z',
        resolvedAt: '2026-11-11T14:00:00Z',
        reopenCount: 1,
      },
      {
        id: 'c3',
        category: 'BLOCKED_DRAINAGE',
        status: 'IN_PROGRESS',
        submittedAt: '2026-11-12T06:00:00Z',
        acknowledgedAt: '2026-11-12T07:00:00Z',
        assignedAt: '2026-11-12T08:00:00Z',
        resolvedAt: null,
        reopenCount: 0,
      },
    ];

    const analytics = computeResolutionAnalytics(records, referenceDate);
    expect(analytics.totalComplaints).toBe(3);
    expect(analytics.resolvedComplaints).toBe(2);
    expect(analytics.resolutionRatePercentage).toBe(66.7);
    expect(analytics.reopenedRatePercentage).toBe(33.3);
    expect(analytics.averageTotalResolutionTimeHours).toBe(4.5); // (4h + 5h)/2
  });
});
