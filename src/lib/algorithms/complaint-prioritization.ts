/**
 * Deterministic, Explainable Complaint Prioritisation Algorithm
 * 
 * Rules:
 * 1. Fully deterministic and rule-based (zero arbitrary black-box outputs).
 * 2. Factors: Public Health Relevance, Household Impact, Unresolved Age, Reopen Count, Sensitive Proximity.
 * 3. Human-readable explainability log detailing why the complaint received its score and tier.
 * 4. Automatic emergency contact escalation pathway flag for critical contamination events.
 */

export type SanitationCategory =
  | 'SUSPECTED_WATER_CONTAMINATION'
  | 'SEWAGE_OVERFLOW'
  | 'STAGNANT_WASTEWATER'
  | 'BLOCKED_DRAINAGE'
  | 'UNHYGIENIC_PUBLIC_AREA'
  | 'IMPROPER_WASTE_DISPOSAL';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PrioritizationInput {
  category: SanitationCategory | string;
  affectedHouseholds: number;
  submittedAt: Date | string;
  reopenCount?: number;
  isNearSensitiveFacility?: boolean; // Near anganwadi, school, PHC, overhead tank
  referenceDate?: Date;
}

export interface FactorBreakdown {
  factor: string;
  scoreAdded: number;
  weightDescription: string;
  justification: string;
}

export interface PrioritizationResult {
  score: number; // 0 - 100 scale
  priority: PriorityLevel;
  factorBreakdowns: FactorBreakdown[];
  summaryExplanation: string;
  requiresEmergencyEscalation: boolean;
  recommendedAction: string;
  targetResponseHours: number;
}

const CATEGORY_WEIGHTS: Record<string, { baseScore: number; hazardDescription: string }> = {
  SUSPECTED_WATER_CONTAMINATION: {
    baseScore: 45,
    hazardDescription: 'High Epidemic Hazard: Potentially vectors acute diarrhoeal diseases, cholera, and enteric fever in community drinking line.',
  },
  SEWAGE_OVERFLOW: {
    baseScore: 35,
    hazardDescription: 'Direct Fecal Exposure: Untreated raw sewage surfacing in residential streets, severe bio-hazard to pedestrians and children.',
  },
  STAGNANT_WASTEWATER: {
    baseScore: 25,
    hazardDescription: 'Vector Breeding Risk: Accumulated stagnant pools foster Culex/Aedes mosquito proliferation (Dengue, Malaria, Filariasis).',
  },
  BLOCKED_DRAINAGE: {
    baseScore: 20,
    hazardDescription: 'Drainage Chokage: Impeded stormwater/greywater runoff risking secondary overflow and structural inundation.',
  },
  UNHYGIENIC_PUBLIC_AREA: {
    baseScore: 15,
    hazardDescription: 'Public Space Sanitation: Accumulation of debris and filth in communal marketplaces or street corners.',
  },
  IMPROPER_WASTE_DISPOSAL: {
    baseScore: 10,
    hazardDescription: 'Solid Waste Litter: Uncollected domestic or dry waste requiring scheduled sanitation tractor pickup.',
  },
};

export function prioritizeComplaint(input: PrioritizationInput): PrioritizationResult {
  const breakdowns: FactorBreakdown[] = [];
  const referenceDate = input.referenceDate || new Date();
  const submittedDate = typeof input.submittedAt === 'string' ? new Date(input.submittedAt) : input.submittedAt;

  // 1. Category Public Health Impact (up to 45 pts)
  const categoryConfig = CATEGORY_WEIGHTS[input.category] || {
    baseScore: 15,
    hazardDescription: 'Standard civic sanitation complaint.',
  };

  breakdowns.push({
    factor: 'Public Health Impact (Category)',
    scoreAdded: categoryConfig.baseScore,
    weightDescription: `${categoryConfig.baseScore} / 45 pts`,
    justification: `${input.category.replace(/_/g, ' ')}: ${categoryConfig.hazardDescription}`,
  });

  // 2. Affected Households Footprint (up to 25 pts)
  const households = Math.max(1, input.affectedHouseholds || 1);
  let householdScore = 2;
  let householdDesc = 'Single household localized disruption';

  if (households > 50) {
    householdScore = 25;
    householdDesc = `Community-wide crisis affecting ${households} families`;
  } else if (households >= 21) {
    householdScore = 20;
    householdDesc = `Broad neighborhood impact affecting ${households} households`;
  } else if (households >= 6) {
    householdScore = 14;
    householdDesc = `Street-level cluster affecting ${households} households`;
  } else if (households >= 2) {
    householdScore = 7;
    householdDesc = `Multi-family exposure affecting ${households} households`;
  }

  breakdowns.push({
    factor: 'Community Footprint (Households Affected)',
    scoreAdded: householdScore,
    weightDescription: `${householdScore} / 25 pts`,
    justification: `${households} household(s) reported affected. (${householdDesc}).`,
  });

  // 3. Time Unresolved / Aging Escalation (up to 15 pts)
  const ageHours = Math.max(0, (referenceDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60));
  const ageDays = ageHours / 24;
  
  // Escalates at 2.5 pts per 24 hours unresolved, capped at 15 pts
  const ageScore = Math.min(15, Math.round(ageDays * 2.5 * 10) / 10);
  breakdowns.push({
    factor: 'Unresolved Duration (Aging Escalation)',
    scoreAdded: ageScore,
    weightDescription: `${ageScore} / 15 pts`,
    justification: `Issue has been open for ${ageDays.toFixed(1)} days (${Math.round(ageHours)} hours). Unresolved civic complaints accumulate aging priority.`,
  });

  // 4. Reopen Count (Quality of Resolution Failure, up to 15 pts)
  const reopens = Math.max(0, input.reopenCount || 0);
  let reopenScore = 0;
  if (reopens >= 2) {
    reopenScore = 15;
  } else if (reopens === 1) {
    reopenScore = 10;
  }

  if (reopens > 0) {
    breakdowns.push({
      factor: 'Recurrence / Prior Ineffective Resolution',
      scoreAdded: reopenScore,
      weightDescription: `${reopenScore} / 15 pts`,
      justification: `Complaint was previously closed and reopened ${reopens} time(s). Indicates persistent or recurring failure requiring supervisory oversight.`,
    });
  }

  // 5. Sensitive Location Bonus (up to 10 pts)
  let sensitiveScore = 0;
  if (input.isNearSensitiveFacility) {
    sensitiveScore = 10;
    breakdowns.push({
      factor: 'High-Vulnerability Proximity',
      scoreAdded: 10,
      weightDescription: '10 pts',
      justification: 'Located in immediate proximity to an Anganwadi, School, Health Centre, or Community Overhead Drinking Tank.',
    });
  }

  // Sum total score, cap at 100
  const rawTotal = categoryConfig.baseScore + householdScore + ageScore + reopenScore + sensitiveScore;
  const score = Math.min(100, Math.round(rawTotal * 10) / 10);

  // Deterministic Priority Tier
  let priority: PriorityLevel = 'LOW';
  let targetResponseHours = 72;
  let recommendedAction = 'Routine municipal sanitation roster dispatch.';

  if (score >= 70 || input.category === 'SUSPECTED_WATER_CONTAMINATION') {
    priority = 'CRITICAL';
    targetResponseHours = 4;
    recommendedAction = 'Immediate field dispatch. Inspect water line, collect lab culture sample, alert Ward Health Officer.';
  } else if (score >= 50) {
    priority = 'HIGH';
    targetResponseHours = 12;
    recommendedAction = 'Same-day sanitation crew deployment with mechanised suction / drain clearing unit.';
  } else if (score >= 30) {
    priority = 'MEDIUM';
    targetResponseHours = 24;
    recommendedAction = 'Schedule priority inspection within next operational work shift.';
  }

  const requiresEmergencyEscalation = priority === 'CRITICAL' || input.category === 'SUSPECTED_WATER_CONTAMINATION';

  const summaryExplanation = `Calculated priority score ${score}/100 [${priority}]. Determined by: ${input.category.replace(/_/g, ' ')} (+${categoryConfig.baseScore}), ${households} household footprint (+${householdScore}), ${ageDays.toFixed(1)}d open age (+${ageScore})${reopenScore > 0 ? `, reopened ${reopens}x (+${reopenScore})` : ''}${sensitiveScore > 0 ? ', sensitive proximity (+10)' : ''}.`;

  return {
    score,
    priority,
    factorBreakdowns: breakdowns,
    summaryExplanation,
    requiresEmergencyEscalation,
    recommendedAction,
    targetResponseHours,
  };
}
