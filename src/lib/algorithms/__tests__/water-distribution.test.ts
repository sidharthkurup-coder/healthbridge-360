import { describe, it, expect } from 'vitest';
import {
  analyzeSectionWaterSupply,
  assessWaterQuality,
  WaterRecordInput,
  WaterQualityInput,
} from '../water-distribution';

describe('Water Distribution & Safety Algorithms', () => {
  const refDate = new Date(Date.UTC(2026, 10, 12));

  it('calculates section metrics and separates missing flow rate and pressure from zeros', () => {
    const records: WaterRecordInput[] = [
      {
        id: 'r1',
        sectionId: 1,
        supplyDate: '2026-11-10',
        actualDurationMinutes: 120,
        quantitySuppliedKL: 60.5,
        flowRateLpm: 500,
        pressureBar: 2.1,
        interruptionOccurred: false,
        status: 'COMPLETED',
      },
      {
        id: 'r2',
        sectionId: 1,
        supplyDate: '2026-11-11',
        actualDurationMinutes: 150,
        quantitySuppliedKL: 75.0,
        flowRateLpm: null, // missing flow sensor reading
        pressureBar: null, // missing gauge reading
        interruptionOccurred: true,
        interruptionReason: 'Transformer voltage fluctuation',
        status: 'PARTIAL',
      },
    ];

    const analysis = analyzeSectionWaterSupply(1, records, refDate);
    expect(analysis.totalRecords).toBe(2);
    expect(analysis.totalSupplyDurationMinutes).toBe(270);
    expect(analysis.averageSupplyDurationMinutes).toBe(135);
    expect(analysis.totalMeasuredVolumeKL).toBe(135.5);
    expect(analysis.interruptionCount).toBe(1);
    expect(analysis.interruptionRatePercentage).toBe(50.0);

    // Missing data handling: Only 1 record had flow rate, so average must be 500, NOT 250!
    expect(analysis.recordsWithFlowRateCount).toBe(1);
    expect(analysis.averageFlowRateLpm).toBe(500);

    // Days since last recorded supply (last date 2026-11-11, refDate 2026-11-12 => 1 day)
    expect(analysis.daysSinceLastRecordedSupply).toBe(1);
    expect(analysis.hasMissingMeasurements).toBe(false); // At least 1 measurement was logged
  });

  it('correctly handles an empty section with professional missing state', () => {
    const analysis = analyzeSectionWaterSupply(5, [], refDate);
    expect(analysis.totalRecords).toBe(0);
    expect(analysis.averageSupplyDurationMinutes).toBeNull();
    expect(analysis.averageFlowRateLpm).toBeNull();
    expect(analysis.averagePressureBar).toBeNull();
    expect(analysis.hasMissingMeasurements).toBe(true);
  });

  it('never declares water safe when test data is incomplete', () => {
    const incompleteReport: WaterQualityInput = {
      id: 'wq1',
      sectionId: 2,
      testDate: '2026-11-08',
      verificationStatus: 'VERIFIED',
      phValue: 7.2,
      tdsPpm: 320,
      sodiumMgL: null, // missing!
      fluorideMgL: 0.8,
      microbialColiformColonies: 0,
    };

    const assessment = assessWaterQuality(incompleteReport);
    expect(assessment.hasIncompleteParameters).toBe(true);
    expect(assessment.testedParametersCount).toBe(4);
    expect(assessment.overallPotabilityStatus).toBe('INCOMPLETE_DATA');
    expect(assessment.assessmentSummary).toContain('Incomplete test data');
  });

  it('never declares water safe if report is unverified', () => {
    const unverifiedReport: WaterQualityInput = {
      id: 'wq2',
      sectionId: 3,
      testDate: '2026-11-10',
      verificationStatus: 'PENDING_VERIFICATION',
      phValue: 7.4,
      tdsPpm: 250,
      sodiumMgL: 80,
      fluorideMgL: 0.6,
      microbialColiformColonies: 0,
    };

    const assessment = assessWaterQuality(unverifiedReport);
    expect(assessment.overallPotabilityStatus).toBe('UNVERIFIED_LAB_REPORT');
  });

  it('detects pathogen contamination and raises non-compliant status', () => {
    const contaminatedReport: WaterQualityInput = {
      id: 'wq3',
      sectionId: 4,
      testDate: '2026-11-09',
      verificationStatus: 'VERIFIED',
      phValue: 7.1,
      tdsPpm: 410,
      sodiumMgL: 110,
      fluorideMgL: 0.7,
      microbialColiformColonies: 12, // Contaminated!
    };

    const assessment = assessWaterQuality(contaminatedReport);
    expect(assessment.overallPotabilityStatus).toBe('NON_COMPLIANT');
    expect(assessment.parameters.microbial.isSafe).toBe(false);
    expect(assessment.assessmentSummary).toContain('Microbial coliform');
  });

  it('confirms potable water only when all 5 parameters are verified and safe', () => {
    const perfectReport: WaterQualityInput = {
      id: 'wq4',
      sectionId: 1,
      testDate: '2026-11-10',
      verificationStatus: 'VERIFIED',
      phValue: 7.3,
      tdsPpm: 280,
      sodiumMgL: 65,
      fluorideMgL: 0.7,
      microbialColiformColonies: 0,
    };

    const assessment = assessWaterQuality(perfectReport);
    expect(assessment.overallPotabilityStatus).toBe('POTABLE_CONFIRMED');
    expect(assessment.testedParametersCount).toBe(5);
  });
});
