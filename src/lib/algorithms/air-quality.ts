/**
 * CPCB India National Air Quality Index (NAQI) & Deterministic Pollution Mitigation Engine
 *
 * Non-inferential design:
 * - Never estimates PM2.5 from PM10 or invents missing pollutants.
 * - Computes sub-indices strictly from provided pollutant concentrations.
 */

export type AqiCategory =
  | 'GOOD'
  | 'SATISFACTORY'
  | 'MODERATE'
  | 'POOR'
  | 'VERY_POOR'
  | 'SEVERE'
  | 'INCOMPLETE';

export interface AirPollutantInput {
  pm25UgM3?: number | null;
  pm10UgM3?: number | null;
  no2UgM3?: number | null;
  so2UgM3?: number | null;
  coMgM3?: number | null;
}

export interface SubIndexDetail {
  parameter: string;
  value: number | null;
  unit: string;
  subIndex: number | null;
}

export interface AirQualityAssessment {
  aqi: number | null;
  category: AqiCategory;
  dominantPollutant: string | null;
  measuredParametersCount: number;
  subIndices: SubIndexDetail[];
  citizenAdvisory: string;
  panchayatAction: string;
}

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 30, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 60, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 90, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 120, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 250, cHigh: 500, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 50, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 100, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 250, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 350, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 430, cHigh: 650, iLow: 401, iHigh: 500 },
];

const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 40, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 80, cHigh: 180, iLow: 101, iHigh: 200 },
  { cLow: 180, cHigh: 280, iLow: 201, iHigh: 300 },
  { cLow: 280, cHigh: 400, iLow: 301, iHigh: 400 },
  { cLow: 400, cHigh: 600, iLow: 401, iHigh: 500 },
];

const SO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 40, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 80, cHigh: 380, iLow: 101, iHigh: 200 },
  { cLow: 380, cHigh: 800, iLow: 201, iHigh: 300 },
  { cLow: 800, cHigh: 1600, iLow: 301, iHigh: 400 },
  { cLow: 1600, cHigh: 2200, iLow: 401, iHigh: 500 },
];

const CO_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50 },
  { cLow: 1.0, cHigh: 2.0, iLow: 51, iHigh: 100 },
  { cLow: 2.0, cHigh: 10.0, iLow: 101, iHigh: 200 },
  { cLow: 10.0, cHigh: 17.0, iLow: 201, iHigh: 300 },
  { cLow: 17.0, cHigh: 34.0, iLow: 301, iHigh: 400 },
  { cLow: 34.0, cHigh: 50.0, iLow: 401, iHigh: 500 },
];

function computeSubIndex(value: number | null | undefined, breakpoints: Breakpoint[]): number | null {
  if (value === null || value === undefined || Number.isNaN(value) || value < 0) {
    return null;
  }
  const capped = Math.min(value, breakpoints[breakpoints.length - 1].cHigh);
  for (const bp of breakpoints) {
    if (capped <= bp.cHigh) {
      const ratio = (capped - bp.cLow) / Math.max(0.0001, bp.cHigh - bp.cLow);
      return Math.round(bp.iLow + ratio * (bp.iHigh - bp.iLow));
    }
  }
  return 500;
}

export function classifyAqiCategory(aqi: number | null): AqiCategory {
  if (aqi === null) return 'INCOMPLETE';
  if (aqi <= 50) return 'GOOD';
  if (aqi <= 100) return 'SATISFACTORY';
  if (aqi <= 200) return 'MODERATE';
  if (aqi <= 300) return 'POOR';
  if (aqi <= 400) return 'VERY_POOR';
  return 'SEVERE';
}

export function calculateCpcbAqi(input: AirPollutantInput): AirQualityAssessment {
  const rawList = [
    { parameter: 'PM2.5', value: input.pm25UgM3 ?? null, unit: 'µg/m³', bps: PM25_BREAKPOINTS },
    { parameter: 'PM10', value: input.pm10UgM3 ?? null, unit: 'µg/m³', bps: PM10_BREAKPOINTS },
    { parameter: 'NO2', value: input.no2UgM3 ?? null, unit: 'µg/m³', bps: NO2_BREAKPOINTS },
    { parameter: 'SO2', value: input.so2UgM3 ?? null, unit: 'µg/m³', bps: SO2_BREAKPOINTS },
    { parameter: 'CO', value: input.coMgM3 ?? null, unit: 'mg/m³', bps: CO_BREAKPOINTS },
  ];

  const subIndices: SubIndexDetail[] = rawList.map((item) => ({
    parameter: item.parameter,
    value: item.value,
    unit: item.unit,
    subIndex: computeSubIndex(item.value, item.bps),
  }));

  const valid = subIndices.filter((s) => s.subIndex !== null) as (SubIndexDetail & { subIndex: number })[];
  if (valid.length === 0) {
    return {
      aqi: null,
      category: 'INCOMPLETE',
      dominantPollutant: null,
      measuredParametersCount: 0,
      subIndices,
      citizenAdvisory: 'No valid ambient sensor parameters available yet. Awaiting verified air quality reading.',
      panchayatAction: 'Log PM2.5 / PM10 sensor sample before issuing zone advisories.',
    };
  }

  let maxSub = valid[0];
  for (const s of valid) {
    if (s.subIndex > maxSub.subIndex) maxSub = s;
  }

  const aqi = maxSub.subIndex;
  const category = classifyAqiCategory(aqi);

  const advisories: Record<Exclude<AqiCategory, 'INCOMPLETE'>, { citizen: string; action: string }> = {
    GOOD: {
      citizen: 'Minimal ambient risk. Safe for outdoor school activities and morning walks across Kantheru.',
      action: 'Maintain routine sweeping & zero open-waste burning vigilance.',
    },
    SATISFACTORY: {
      citizen: 'Acceptable air quality; unusually sensitive individuals with asthma should carry preventive inhalers.',
      action: 'Standard dust monitoring along NH-16 Bypass Road & market lanes.',
    },
    MODERATE: {
      citizen: 'Possible breathing discomfort for elderly, children, and cardiac/asthma residents during prolonged exertion.',
      action:
        maxSub.parameter === 'PM10'
          ? 'Deploy Panchayat tractor water-sprinkler misting on unpaved shoulders & construction zones.'
          : 'Inspect Section zones for open garbage/stubble fires and enforce Panchayat prohibition.',
    },
    POOR: {
      citizen: 'Wear N95/cloth masks outdoors near traffic/smoke corridors; keep school recess indoors.',
      action: 'Mandatory wet-suppression road washing + immediate stop-work/extinguishing of biomass & plastic fires.',
    },
    VERY_POOR: {
      citizen: 'Avoid vigorous outdoor activity; keep windows shut during peak smoke hours; vulnerable groups stay indoors.',
      action: 'Emergency Panchayat water-tanker misting patrol + alert Kantheru PHC for respiratory nebulizer readiness.',
    },
    SEVERE: {
      citizen: 'Health alert for all residents. Avoid outdoor exposure; wear N95 masks if travel is unavoidable.',
      action: 'District Pollution Control Board & Gram Panchayat immediate containment, kiln/burning halt, and mobile PHC checks.',
    },
  };

  return {
    aqi,
    category,
    dominantPollutant: maxSub.parameter,
    measuredParametersCount: valid.length,
    subIndices,
    citizenAdvisory: advisories[category as Exclude<AqiCategory, 'INCOMPLETE'>].citizen,
    panchayatAction: advisories[category as Exclude<AqiCategory, 'INCOMPLETE'>].action,
  };
}

export function prioritizeAirIncident(input: {
  category: string;
  affectedHouseholds: number;
  isNearSensitiveFacility: boolean;
}) {
  const categoryMeta: Record<string, { score: number; unit: string }> = {
    GARBAGE_PLASTIC_BURNING: {
      score: 48,
      unit: 'Panchayat Anti-Burning Squad & Fire Extinguish Crew',
    },
    INDUSTRIAL_BRICK_KILN_SMOKE: {
      score: 44,
      unit: 'Guntur Pollution Inspection & Panchayat Enforcement Officer',
    },
    STUBBLE_CROP_BURNING: {
      score: 40,
      unit: 'Panchayat Water Tanker + Agriculture Mulching Team',
    },
    CONSTRUCTION_ROAD_DUST: {
      score: 30,
      unit: 'Panchayat Water Sprinkler Tanker (PM10 Suppression)',
    },
    VEHICULAR_CONGESTION: {
      score: 26,
      unit: 'NH-16 / Tadikonda Traffic & Green Buffer Diversion',
    },
  };

  const meta = categoryMeta[input.category] || {
    score: 25,
    unit: 'Panchayat Environmental Inspection Team',
  };

  const hhBoost = Math.min(30, Math.max(4, Math.round((input.affectedHouseholds || 1) * 1.5)));
  const sensitiveBoost = input.isNearSensitiveFacility ? 20 : 0;
  const severityScore = Math.min(100, meta.score + hhBoost + sensitiveBoost);

  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (severityScore >= 75) priority = 'CRITICAL';
  else if (severityScore >= 55) priority = 'HIGH';
  else if (severityScore >= 35) priority = 'MEDIUM';

  return {
    severityScore,
    priority,
    recommendedUnit: meta.unit,
  };
}
