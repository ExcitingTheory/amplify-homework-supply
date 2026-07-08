/**
 * Chapter Goal Feasibility Calculator
 *
 * Helps instructors understand whether a campaign chapter's XP target
 * is achievable given the linked units, and how much effort is required.
 */

/** XP amounts per reason (base values before multipliers) */
export const BASE_XP: Record<string, number> = {
  HOMEWORK_SUBMITTED: 50,
  AI_FEEDBACK_REVISED: 25,
  ALL_BLOCKS_COMPLETED: 75,
  PEER_REVIEW_GIVEN: 40,
  PEER_REVIEW_HOSTED: 30,
  PEER_REVIEW_TOP_REVIEWER: 60,
  NAILED_IT: 20,
  ON_TIME_SUBMISSION: 15,
  STREAK_3DAY: 30,
  STREAK_7DAY: 75,
  STREAK_14DAY: 150,
  STREAK_30DAY: 300,
  PERFECT_SCORE: 100,
  COMEBACK: 50,
  PERSONAL_BEST: 25,
  EASTER_EGG: 30,
  SQUAD_CHALLENGE_BONUS: 100,
  PRACTICE_DRILL_COMPLETED: 30,
  PRACTICE_DRILL_ACCURACY_BONUS: 15,
};

/** Which reasons are one-time per unit (not repeatable) */
const ONE_TIME_PER_UNIT: string[] = [
  "HOMEWORK_SUBMITTED",
  "ALL_BLOCKS_COMPLETED",
  "ON_TIME_SUBMISSION",
  "PERFECT_SCORE",
  "PERSONAL_BEST",
];

/** Estimated nailed-it blocks per unit (conservative) */
const NAILED_IT_PER_UNIT_CONSERVATIVE = 3;
const NAILED_IT_PER_UNIT_OPTIMISTIC = 8;

/** Drill diminishing returns: XP per session in a day */
const DRILL_XP_SEQUENCE = [30, 15, 7, 5]; // 4th+ stays at 5

export interface XPMultipliers {
  [reason: string]: number;
}

export interface FeasibilityBreakdown {
  reason: string;
  label: string;
  baseAmount: number;
  multipliedAmount: number;
  count: number;
  total: number;
}

export interface FeasibilityResult {
  /** Max XP achievable from completing linked units once (conservative) */
  oneTimeXPConservative: number;
  /** Max XP achievable from completing linked units once (optimistic, includes bonuses) */
  oneTimeXPOptimistic: number;
  /** Detailed breakdown of one-time XP sources */
  breakdown: FeasibilityBreakdown[];
  /** Extra drill sessions needed beyond one-time XP (conservative estimate) */
  drillSessionsNeeded: number;
  /** Days of daily drilling needed (4 sessions/day assumption) */
  drillDaysNeeded: number;
  /** Whether the chapter is achievable with one-time unit completion alone */
  achievableWithoutDrills: boolean;
  /** Whether the target is achievable within a reasonable timeframe */
  achievableWithinWeek: boolean;
  /** Human-readable verdict */
  verdict: string;
  /** Warning message if target is concerning */
  warning: string | null;
}

/**
 * Calculate XP from one drill day (up to maxSessions sessions).
 */
function drillXPPerDay(maxSessions: number, multiplier: number): number {
  let total = 0;
  for (let i = 0; i < maxSessions; i++) {
    const base = i < DRILL_XP_SEQUENCE.length
      ? DRILL_XP_SEQUENCE[i]
      : DRILL_XP_SEQUENCE[DRILL_XP_SEQUENCE.length - 1];
    total += Math.round(base * multiplier);
  }
  return total;
}

/**
 * Calculate feasibility of a chapter's XP target given linked units.
 */
export function calculateFeasibility(
  targetXP: number,
  linkedUnitCount: number,
  multipliers: XPMultipliers = {},
): FeasibilityResult {
  if (linkedUnitCount === 0 || targetXP <= 0) {
    return {
      oneTimeXPConservative: 0,
      oneTimeXPOptimistic: 0,
      breakdown: [],
      drillSessionsNeeded: 0,
      drillDaysNeeded: 0,
      achievableWithoutDrills: targetXP <= 0,
      achievableWithinWeek: targetXP <= 0,
      verdict: linkedUnitCount === 0
        ? "No units linked — all section XP contributes (legacy mode)"
        : "Target is 0 XP — chapter is already complete",
      warning: linkedUnitCount === 0
        ? "Link units to scope which XP contributes to this chapter"
        : null,
    };
  }

  const getMultiplier = (reason: string): number =>
    multipliers[reason] ?? 1.0;

  // Calculate one-time XP breakdown
  const breakdown: FeasibilityBreakdown[] = [];

  const conservativeReasons: { reason: string; label: string; perUnit: number }[] = [
    { reason: "HOMEWORK_SUBMITTED", label: "Submit homework", perUnit: 1 },
    { reason: "ALL_BLOCKS_COMPLETED", label: "All blocks completed", perUnit: 1 },
    { reason: "ON_TIME_SUBMISSION", label: "On-time submission", perUnit: 1 },
  ];

  const optimisticReasons: { reason: string; label: string; perUnit: number }[] = [
    ...conservativeReasons,
    { reason: "PERFECT_SCORE", label: "Perfect score", perUnit: 1 },
    { reason: "PERSONAL_BEST", label: "Personal best", perUnit: 1 },
    { reason: "NAILED_IT", label: "Nailed It moments", perUnit: NAILED_IT_PER_UNIT_OPTIMISTIC },
  ];

  let oneTimeConservative = 0;
  let oneTimeOptimistic = 0;

  // Conservative: only guaranteed XP (submit + blocks + on-time)
  for (const { reason, label, perUnit } of conservativeReasons) {
    const base = BASE_XP[reason] || 0;
    const mult = getMultiplier(reason);
    const multipliedAmount = Math.round(base * mult);
    const count = linkedUnitCount * perUnit;
    const total = multipliedAmount * count;
    oneTimeConservative += total;
    breakdown.push({ reason, label, baseAmount: base, multipliedAmount, count, total });
  }

  // Add conservative nailed-it
  const nailedItBase = BASE_XP.NAILED_IT || 20;
  const nailedItMult = getMultiplier("NAILED_IT");
  const nailedItMultiplied = Math.round(nailedItBase * nailedItMult);
  const nailedItCountCons = linkedUnitCount * NAILED_IT_PER_UNIT_CONSERVATIVE;
  oneTimeConservative += nailedItMultiplied * nailedItCountCons;
  breakdown.push({
    reason: "NAILED_IT",
    label: "Nailed It (conservative, ~3/unit)",
    baseAmount: nailedItBase,
    multipliedAmount: nailedItMultiplied,
    count: nailedItCountCons,
    total: nailedItMultiplied * nailedItCountCons,
  });

  // Optimistic total
  for (const { reason, perUnit } of optimisticReasons) {
    const base = BASE_XP[reason] || 0;
    const mult = getMultiplier(reason);
    oneTimeOptimistic += Math.round(base * mult) * linkedUnitCount * perUnit;
  }

  // Calculate drill requirements if target exceeds one-time
  const deficit = Math.max(0, targetXP - oneTimeConservative);
  const drillMult = getMultiplier("PRACTICE_DRILL_COMPLETED");
  const xpPerDrillDay = drillXPPerDay(4, drillMult); // 4 sessions/day
  const drillSessionsNeeded = deficit > 0
    ? Math.ceil(deficit / Math.round(BASE_XP.PRACTICE_DRILL_COMPLETED * drillMult))
    : 0;
  const drillDaysNeeded = deficit > 0
    ? Math.ceil(deficit / xpPerDrillDay)
    : 0;

  const achievableWithoutDrills = targetXP <= oneTimeConservative;
  const achievableWithinWeek = deficit <= xpPerDrillDay * 7;

  // Generate verdict and warning
  let verdict: string;
  let warning: string | null = null;

  if (achievableWithoutDrills) {
    verdict = `Achievable by completing ${linkedUnitCount === 1 ? "the unit" : `all ${linkedUnitCount} units`} without drills.`;
  } else if (targetXP <= oneTimeOptimistic) {
    verdict = `Achievable with strong performance (high accuracy + nailed-it bonuses) across ${linkedUnitCount} unit${linkedUnitCount > 1 ? "s" : ""}.`;
  } else {
    verdict = `Requires ~${drillSessionsNeeded} drill sessions (~${drillDaysNeeded} day${drillDaysNeeded > 1 ? "s" : ""} of practice) beyond completing the ${linkedUnitCount} unit${linkedUnitCount > 1 ? "s" : ""}.`;
  }

  if (drillDaysNeeded > 14) {
    warning = `This goal may take over 2 weeks of daily drilling — consider lowering the target or linking more units.`;
  } else if (drillDaysNeeded > 7) {
    warning = `Students will need over a week of daily practice drills beyond unit completion.`;
  } else if (!achievableWithoutDrills && deficit > 0) {
    warning = `Students will need drill practice beyond completing the assignments (~${drillDaysNeeded} day${drillDaysNeeded > 1 ? "s" : ""}).`;
  }

  return {
    oneTimeXPConservative: oneTimeConservative,
    oneTimeXPOptimistic: oneTimeOptimistic,
    breakdown,
    drillSessionsNeeded,
    drillDaysNeeded,
    achievableWithoutDrills,
    achievableWithinWeek,
    verdict,
    warning,
  };
}
