/**
 * Water Distribution & Section Analysis Algorithm
 * 
 * Rules:
 * 1. Only calculate values from real records.
 * 2. Flag missing information separately from zero values (e.g. null flow rate vs 0 lpm).
 * 3. Never infer sodium or fluoride concentrations from TDS.
 * 4. Never invent test results or automatically declare water safe from incomplete data.
 * 5. Calculate section comparison metrics deterministically.
 */

export interface WaterRecordInput {
  id: string;
  sectionId: number;
  supplyDate: string; // YYYY-MM-DD
  actualDurationMinutes: number;
  quantitySuppliedKL: number;
  flowRateLpm: number | null;
  pressureBar: number | null;
  interruptionOccurred: boolean;
  interruptionReason?: string | null;
  status: string; // COMPLETED, PARTIAL, CANCELLED
}

export interface WaterSectionAnalysis {
  sectionId: number;
  totalRecords: number;
  totalSupplyDurationMinutes: number;
  averageSupplyDurationMinutes: number | null; // null if 0 valid records
  totalMeasuredVolumeKL: number;
  averageVolumePerSupplyKL: number | null;
  
  // Flow rate handling: distinguish missing flow rate measurements from zero
  recordsWithFlowRateCount: number;
  averageFlowRateLpm: number | null; // null if no flow rate records exist
  
  // Pressure handling: distinguish missing pressure from zero
  recordsWithPressureCount: number;
  averagePressureBar: number | null;
  
  interruptionCount: number;
  interruptionRatePercentage: number;
  
  lastRecordedSupplyDate: string | null;
  daysSinceLastRecordedSupply: number | null; // null if no records
  
  hasMissingMeasurements: boolean;
  missingMeasurementsDescription: string[];
}

export interface WaterQualityInput {
  id: string;
  sectionId: number;
  testDate: string; // YYYY-MM-DD
  verificationStatus: string; // PENDING_VERIFICATION, VERIFIED, REJECTED
  sodiumMgL: number | null;
  fluorideMgL: number | null;
  phValue: number | null;
  tdsPpm: number | null;
  microbialColiformColonies: number | null;
}

export interface ParameterSafetyAssessment {
  parameterName: string;
  measuredValue: number | null;
  unit: string;
  acceptableRange: string;
  isAvailable: boolean;
  isSafe: boolean | null; // null if parameter was not tested
  statusText: string;
  remarks: string;
}

export interface WaterQualityAssessment {
  reportId: string;
  sectionId: number;
  testDate: string;
  verificationStatus: string;
  isVerified: boolean;
  
  parameters: {
    sodium: ParameterSafetyAssessment;
    fluoride: ParameterSafetyAssessment;
    ph: ParameterSafetyAssessment;
    tds: ParameterSafetyAssessment;
    microbial: ParameterSafetyAssessment;
  };
  
  testedParametersCount: number;
  totalRequiredParameters: number;
  hasIncompleteParameters: boolean;
  
  // Safety rule: Water is ONLY declared compliant if ALL 5 parameters are tested, verified, and within acceptable limits.
  overallPotabilityStatus: 'POTABLE_CONFIRMED' | 'NON_COMPLIANT' | 'INCOMPLETE_DATA' | 'UNVERIFIED_LAB_REPORT';
  assessmentSummary: string;
}

/**
 * Standard permissible drinking water limits per BIS 10500:2012 (Bureau of Indian Standards):
 * - pH: 6.5 to 8.5
 * - TDS: Acceptable limit < 500 ppm, permissible up to 2000 ppm in absence of alternate source
 * - Fluoride: 1.0 mg/L acceptable, max 1.5 mg/L
 * - Sodium: Acceptable guideline ~200 mg/L (WHO guideline for taste and hypertensive sensitivity)
 * - Microbial Coliform: 0 CFU/100 ml (Zero tolerance)
 */
export function assessWaterQuality(report: WaterQualityInput): WaterQualityAssessment {
  const isVerified = report.verificationStatus === 'VERIFIED';
  let testedCount = 0;

  // 1. pH
  const phTested = report.phValue !== null && !isNaN(report.phValue);
  if (phTested) testedCount++;
  const phSafe = phTested ? (report.phValue! >= 6.5 && report.phValue! <= 8.5) : null;
  const phParam: ParameterSafetyAssessment = {
    parameterName: 'pH Value',
    measuredValue: report.phValue,
    unit: 'pH scale',
    acceptableRange: '6.5 - 8.5',
    isAvailable: phTested,
    isSafe: phSafe,
    statusText: !phTested ? 'NOT TESTED' : phSafe ? 'NORMAL' : 'OUT OF SPECIFICATION',
    remarks: !phTested
      ? 'pH measurement missing in sample analysis'
      : phSafe
      ? 'Optimal neutrality range'
      : report.phValue! < 6.5 ? 'Acidic sample, risk of pipe corrosion' : 'Alkaline sample',
  };

  // 2. TDS
  const tdsTested = report.tdsPpm !== null && !isNaN(report.tdsPpm);
  if (tdsTested) testedCount++;
  const tdsSafe = tdsTested ? (report.tdsPpm! <= 500) : null;
  const tdsParam: ParameterSafetyAssessment = {
    parameterName: 'Total Dissolved Solids (TDS)',
    measuredValue: report.tdsPpm,
    unit: 'ppm (mg/L)',
    acceptableRange: '≤ 500 ppm',
    isAvailable: tdsTested,
    isSafe: tdsSafe,
    statusText: !tdsTested ? 'NOT TESTED' : tdsSafe ? 'EXCELLENT' : report.tdsPpm! <= 1000 ? 'ACCEPTABLE' : 'HIGH TDS',
    remarks: !tdsTested
      ? 'TDS measurement missing. Note: TDS cannot be used to infer sodium or fluoride.'
      : tdsSafe
      ? 'Desirable dissolved solids level'
      : 'Elevated mineral solids; filtration recommended',
  };

  // 3. Fluoride (Crucial in AP groundwater basins like Guntur/Kantheru)
  const fluorideTested = report.fluorideMgL !== null && !isNaN(report.fluorideMgL);
  if (fluorideTested) testedCount++;
  const fluorideSafe = fluorideTested ? (report.fluorideMgL! <= 1.0) : null;
  const fluorideParam: ParameterSafetyAssessment = {
    parameterName: 'Fluoride Concentration',
    measuredValue: report.fluorideMgL,
    unit: 'mg/L',
    acceptableRange: '≤ 1.0 mg/L (Max 1.5 mg/L)',
    isAvailable: fluorideTested,
    isSafe: fluorideSafe,
    statusText: !fluorideTested ? 'NOT TESTED' : fluorideSafe ? 'SAFE' : 'DANGEROUS (FLUOROSIS RISK)',
    remarks: !fluorideTested
      ? 'Critical: Fluoride untested. Never infer fluoride concentration from TDS.'
      : fluorideSafe
      ? 'Within safe limits for dental and skeletal health'
      : 'Fluoride exceeds safety limit. High risk of dental/skeletal fluorosis.',
  };

  // 4. Sodium
  const sodiumTested = report.sodiumMgL !== null && !isNaN(report.sodiumMgL);
  if (sodiumTested) testedCount++;
  const sodiumSafe = sodiumTested ? (report.sodiumMgL! <= 200) : null;
  const sodiumParam: ParameterSafetyAssessment = {
    parameterName: 'Sodium Concentration',
    measuredValue: report.sodiumMgL,
    unit: 'mg/L',
    acceptableRange: '≤ 200 mg/L',
    isAvailable: sodiumTested,
    isSafe: sodiumSafe,
    statusText: !sodiumTested ? 'NOT TESTED' : sodiumSafe ? 'SAFE' : 'ELEVATED SODIUM',
    remarks: !sodiumTested
      ? 'Sodium untested. Never infer sodium concentration from TDS.'
      : sodiumSafe
      ? 'Suitable for general consumption and low-sodium diets'
      : 'Elevated sodium level may affect palatability and hypertensive individuals',
  };

  // 5. Microbial Coliform
  const microbialTested = report.microbialColiformColonies !== null && !isNaN(report.microbialColiformColonies);
  if (microbialTested) testedCount++;
  const microbialSafe = microbialTested ? (report.microbialColiformColonies! === 0) : null;
  const microbialParam: ParameterSafetyAssessment = {
    parameterName: 'Coliform Microbial Count',
    measuredValue: report.microbialColiformColonies,
    unit: 'CFU / 100ml',
    acceptableRange: '0 CFU/100ml',
    isAvailable: microbialTested,
    isSafe: microbialSafe,
    statusText: !microbialTested ? 'NOT TESTED' : microbialSafe ? 'ZERO BACTERIA (SAFE)' : 'PATHOGEN CONTAMINATION DETECTED',
    remarks: !microbialTested
      ? 'Microbial culture test missing. Cannot verify biological safety.'
      : microbialSafe
      ? 'Zero coliform colonies detected. Biologically safe.'
      : 'Coliform bacteria present! Urgent boiling notice and chlorination required.',
  };

  const hasIncompleteParameters = testedCount < 5;
  let overallPotabilityStatus: 'POTABLE_CONFIRMED' | 'NON_COMPLIANT' | 'INCOMPLETE_DATA' | 'UNVERIFIED_LAB_REPORT';
  let assessmentSummary = '';

  if (!isVerified) {
    overallPotabilityStatus = 'UNVERIFIED_LAB_REPORT';
    assessmentSummary = 'Laboratory report pending official verification by Water Quality Officer.';
  } else if (hasIncompleteParameters) {
    overallPotabilityStatus = 'INCOMPLETE_DATA';
    assessmentSummary = `Incomplete test data (${testedCount}/5 parameters tested). Cannot declare water safe without full test battery.`;
  } else {
    // All 5 tested and report is verified
    const allSafe = phSafe && tdsSafe && fluorideSafe && sodiumSafe && microbialSafe;
    if (allSafe) {
      overallPotabilityStatus = 'POTABLE_CONFIRMED';
      assessmentSummary = 'Fully tested and verified: All 5 water quality parameters meet drinking water standards.';
    } else {
      overallPotabilityStatus = 'NON_COMPLIANT';
      const failing = [];
      if (!phSafe) failing.push('pH');
      if (!tdsSafe) failing.push('TDS');
      if (!fluorideSafe) failing.push('Fluoride');
      if (!sodiumSafe) failing.push('Sodium');
      if (!microbialSafe) failing.push('Microbial coliform');
      assessmentSummary = `Water quality violation: ${failing.join(', ')} failed permissible safety standards.`;
    }
  }

  return {
    reportId: report.id,
    sectionId: report.sectionId,
    testDate: report.testDate,
    verificationStatus: report.verificationStatus,
    isVerified,
    parameters: {
      sodium: sodiumParam,
      fluoride: fluorideParam,
      ph: phParam,
      tds: tdsParam,
      microbial: microbialParam,
    },
    testedParametersCount: testedCount,
    totalRequiredParameters: 5,
    hasIncompleteParameters,
    overallPotabilityStatus,
    assessmentSummary,
  };
}

export function analyzeSectionWaterSupply(
  sectionId: number,
  records: WaterRecordInput[],
  referenceDate: Date = new Date()
): WaterSectionAnalysis {
  const sectionRecords = records.filter(r => r.sectionId === sectionId);
  const missingMeasurements: string[] = [];

  if (sectionRecords.length === 0) {
    return {
      sectionId,
      totalRecords: 0,
      totalSupplyDurationMinutes: 0,
      averageSupplyDurationMinutes: null,
      totalMeasuredVolumeKL: 0,
      averageVolumePerSupplyKL: null,
      recordsWithFlowRateCount: 0,
      averageFlowRateLpm: null,
      recordsWithPressureCount: 0,
      averagePressureBar: null,
      interruptionCount: 0,
      interruptionRatePercentage: 0,
      lastRecordedSupplyDate: null,
      daysSinceLastRecordedSupply: null,
      hasMissingMeasurements: true,
      missingMeasurementsDescription: ['No supply records have been logged for this section.'],
    };
  }

  const validDurationRecords = sectionRecords.filter(r => r.actualDurationMinutes > 0);
  const totalSupplyDurationMinutes = validDurationRecords.reduce((acc, curr) => acc + curr.actualDurationMinutes, 0);
  const averageSupplyDurationMinutes = validDurationRecords.length > 0
    ? Math.round(totalSupplyDurationMinutes / validDurationRecords.length)
    : null;

  const totalMeasuredVolumeKL = sectionRecords.reduce((acc, curr) => acc + (curr.quantitySuppliedKL || 0), 0);
  const averageVolumePerSupplyKL = sectionRecords.length > 0
    ? Number((totalMeasuredVolumeKL / sectionRecords.length).toFixed(2))
    : null;

  // Flow rate: Only consider records where flowRateLpm is explicitly non-null
  const flowRateRecords = sectionRecords.filter(r => r.flowRateLpm !== null && !isNaN(r.flowRateLpm));
  const recordsWithFlowRateCount = flowRateRecords.length;
  let averageFlowRateLpm: number | null = null;
  if (recordsWithFlowRateCount > 0) {
    const sumFlow = flowRateRecords.reduce((acc, curr) => acc + curr.flowRateLpm!, 0);
    averageFlowRateLpm = Number((sumFlow / recordsWithFlowRateCount).toFixed(1));
  } else {
    missingMeasurements.push('Flow rate sensors uninstalled or unrecorded.');
  }

  // Pressure: Only consider records where pressureBar is non-null
  const pressureRecords = sectionRecords.filter(r => r.pressureBar !== null && !isNaN(r.pressureBar));
  const recordsWithPressureCount = pressureRecords.length;
  let averagePressureBar: number | null = null;
  if (recordsWithPressureCount > 0) {
    const sumPressure = pressureRecords.reduce((acc, curr) => acc + curr.pressureBar!, 0);
    averagePressureBar = Number((sumPressure / recordsWithPressureCount).toFixed(2));
  } else {
    missingMeasurements.push('Pressure gauge data not recorded.');
  }

  const interruptionCount = sectionRecords.filter(r => r.interruptionOccurred).length;
  const interruptionRatePercentage = Number(((interruptionCount / sectionRecords.length) * 100).toFixed(1));

  // Determine last recorded supply date
  const sortedByDate = [...sectionRecords].sort((a, b) => b.supplyDate.localeCompare(a.supplyDate));
  const lastRecordedSupplyDate = sortedByDate[0].supplyDate;

  // Calculate days since last supply
  const [y, m, d] = lastRecordedSupplyDate.split('-').map(Number);
  const lastDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const refDateUTC = new Date(Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0));
  const daysDiff = Math.max(0, Math.floor((refDateUTC.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    sectionId,
    totalRecords: sectionRecords.length,
    totalSupplyDurationMinutes,
    averageSupplyDurationMinutes,
    totalMeasuredVolumeKL: Number(totalMeasuredVolumeKL.toFixed(2)),
    averageVolumePerSupplyKL,
    recordsWithFlowRateCount,
    averageFlowRateLpm,
    recordsWithPressureCount,
    averagePressureBar,
    interruptionCount,
    interruptionRatePercentage,
    lastRecordedSupplyDate,
    daysSinceLastRecordedSupply: daysDiff,
    hasMissingMeasurements: missingMeasurements.length > 0,
    missingMeasurementsDescription: missingMeasurements,
  };
}
