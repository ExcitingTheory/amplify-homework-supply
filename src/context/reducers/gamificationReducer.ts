/**
 * gamificationReducer — Unified reducer for all gamification state:
 * Progress, Campaign, Squad, SkillTree, ContentLock.
 *
 * Each domain has its own action types and state slice, but they share
 * a single reducer so they can live in one context/provider.
 */

// ============================================================================
// Types (re-exported from the unified context)
// ============================================================================

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  completionPercent: number;
  totalWorkbooks: number;
  completedWorkbooks: number;
}

export interface PersonalBest {
  id: string;
  unitID: string;
  bestScore: number;
  previousBest: number | null;
  achievedAt: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  freezesRemaining: number;
  freezesUsed: number;
}

export interface CampaignInfo {
  id: string;
  cohortId: string;
  title: string;
  setting?: string;
  stakes?: string;
  systemPromptSeed?: string;
}

export interface GroupChallengeInfo {
  id: string;
  cohortId: string;
  title: string;
  targetXP: number;
  currentXP: number;
  deadline?: string;
  active: boolean;
  bonusMultiplier: number;
  progressPercent: number;
  contributions?: Array<{
    studentId: string;
    xpContributed: number;
    contributedAt: string;
  }>;
}

export interface SquadInfo {
  id: string;
  name: string;
  cohortId: string;
  totalXP: number;
  crestSvg?: string | null;
  description?: string;
  memberCount: number;
  members?: Array<{
    studentId: string;
    role?: string;
    avatarStyle?: string;
    avatarOverrides?: any;
    avatarSeed?: string;
  }>;
  posts?: Array<{
    authorId: string;
    title: string;
    data?: string;
    createdAt?: string;
  }>;
}

export interface SquadMember {
  id: string;
  squadId: string;
  studentId: string;
  role: "LEADER" | "MEMBER";
  joinedAt?: string;
}

export interface LockStatus {
  contentId: string;
  isLocked: boolean;
  requiredXP?: number;
  currentXP?: number;
  requiredBadge?: string;
  hasBadge?: boolean;
  requiredCompletion?: number;
  currentCompletion?: number;
  /** Present when locked by linear progression */
  requiredPriorUnitId?: string;
  requiredPriorUnitName?: string;
}

// ============================================================================
// State
// ============================================================================

export interface GamificationState {
  // Progress
  rawModules: any[];
  rawPersonalBests: any[];
  rawBadges: any[];
  rawDebuffs: any[];
  streak: StreakInfo | null;
  progressLoading: boolean;

  // Campaign
  rawCampaigns: any[];
  rawChallenges: any[];
  campaignsLoading: boolean;
  challengesLoading: boolean;

  // Squad
  rawSquads: any[];
  rawMemberships: any[];
  squadsLoading: boolean;
  membershipsLoading: boolean;

  // SkillTree
  rawSkills: any[];
  rawSkillProgress: any[];
  skillsLoading: boolean;
  skillProgressLoading: boolean;
  selectedSkillId: string | null;

  // ContentLock
  rawLocks: any[];
  locksLoading: boolean;

  // Linear Lock (sequential progression)
  rawSections: any[];
  rawAssignments: any[];
  rawGrades: any[];
  sectionsLoading: boolean;
  assignmentsLoading: boolean;
  gradesLoading: boolean;

  // XP
  xpLogs: any[];
  xpLoading: boolean;
}

export const initialState: GamificationState = {
  // Progress
  rawModules: [],
  rawPersonalBests: [],
  rawBadges: [],
  rawDebuffs: [],
  streak: null,
  progressLoading: true,

  // Campaign
  rawCampaigns: [],
  rawChallenges: [],
  campaignsLoading: true,
  challengesLoading: true,

  // Squad
  rawSquads: [],
  rawMemberships: [],
  squadsLoading: true,
  membershipsLoading: true,

  // SkillTree
  rawSkills: [],
  rawSkillProgress: [],
  skillsLoading: true,
  skillProgressLoading: true,
  selectedSkillId: null,

  // ContentLock
  rawLocks: [],
  locksLoading: true,

  // Linear Lock
  rawSections: [],
  rawAssignments: [],
  rawGrades: [],
  sectionsLoading: true,
  assignmentsLoading: true,
  gradesLoading: true,

  // XP
  xpLogs: [],
  xpLoading: true,
};

// ============================================================================
// Actions
// ============================================================================

export const actionTypes = {
  // Progress
  SET_RAW_MODULES: "SET_RAW_MODULES",
  SET_RAW_PERSONAL_BESTS: "SET_RAW_PERSONAL_BESTS",
  SET_RAW_BADGES: "SET_RAW_BADGES",
  SET_RAW_DEBUFFS: "SET_RAW_DEBUFFS",
  SET_STREAK: "SET_STREAK",
  SET_PROGRESS_LOADING: "SET_PROGRESS_LOADING",

  // Campaign
  SET_RAW_CAMPAIGNS: "SET_RAW_CAMPAIGNS",
  SET_RAW_CHALLENGES: "SET_RAW_CHALLENGES",
  SET_CAMPAIGNS_LOADING: "SET_CAMPAIGNS_LOADING",
  SET_CHALLENGES_LOADING: "SET_CHALLENGES_LOADING",

  // Squad
  SET_RAW_SQUADS: "SET_RAW_SQUADS",
  SET_RAW_MEMBERSHIPS: "SET_RAW_MEMBERSHIPS",
  SET_SQUADS_LOADING: "SET_SQUADS_LOADING",
  SET_MEMBERSHIPS_LOADING: "SET_MEMBERSHIPS_LOADING",

  // SkillTree
  SET_RAW_SKILLS: "SET_RAW_SKILLS",
  SET_RAW_SKILL_PROGRESS: "SET_RAW_SKILL_PROGRESS",
  SET_SKILLS_LOADING: "SET_SKILLS_LOADING",
  SET_SKILL_PROGRESS_LOADING: "SET_SKILL_PROGRESS_LOADING",
  SET_SELECTED_SKILL_ID: "SET_SELECTED_SKILL_ID",

  // ContentLock
  SET_RAW_LOCKS: "SET_RAW_LOCKS",
  SET_LOCKS_LOADING: "SET_LOCKS_LOADING",

  // Linear Lock
  SET_RAW_SECTIONS: "SET_RAW_SECTIONS",
  SET_RAW_ASSIGNMENTS: "SET_RAW_ASSIGNMENTS",
  SET_RAW_GRADES: "SET_RAW_GRADES",
  SET_SECTIONS_LOADING: "SET_SECTIONS_LOADING",
  SET_ASSIGNMENTS_LOADING: "SET_ASSIGNMENTS_LOADING",
  SET_GRADES_LOADING: "SET_GRADES_LOADING",

  // XP
  SET_XP_LOGS: "SET_XP_LOGS",
  SET_XP_LOADING: "SET_XP_LOADING",
} as const;

export type ActionType = (typeof actionTypes)[keyof typeof actionTypes];

export interface GamificationAction {
  type: ActionType;
  payload?: any;
}

// ============================================================================
// Reducer
// ============================================================================

export function gamificationReducer(
  state: GamificationState,
  action: GamificationAction,
): GamificationState {
  switch (action.type) {
    // ── Progress ────────────────────────────────────────────────────
    case actionTypes.SET_RAW_MODULES:
      return { ...state, rawModules: action.payload, progressLoading: false };
    case actionTypes.SET_RAW_PERSONAL_BESTS:
      return { ...state, rawPersonalBests: action.payload };
    case actionTypes.SET_RAW_BADGES:
      return { ...state, rawBadges: action.payload };
    case actionTypes.SET_RAW_DEBUFFS:
      return { ...state, rawDebuffs: action.payload };
    case actionTypes.SET_STREAK:
      return { ...state, streak: action.payload };
    case actionTypes.SET_PROGRESS_LOADING:
      return { ...state, progressLoading: action.payload };

    // ── Campaign ────────────────────────────────────────────────────
    case actionTypes.SET_RAW_CAMPAIGNS:
      return {
        ...state,
        rawCampaigns: action.payload,
        campaignsLoading: false,
      };
    case actionTypes.SET_RAW_CHALLENGES:
      return {
        ...state,
        rawChallenges: action.payload,
        challengesLoading: false,
      };
    case actionTypes.SET_CAMPAIGNS_LOADING:
      return { ...state, campaignsLoading: action.payload };
    case actionTypes.SET_CHALLENGES_LOADING:
      return { ...state, challengesLoading: action.payload };

    // ── Squad ───────────────────────────────────────────────────────
    case actionTypes.SET_RAW_SQUADS:
      return { ...state, rawSquads: action.payload, squadsLoading: false };
    case actionTypes.SET_RAW_MEMBERSHIPS:
      return {
        ...state,
        rawMemberships: action.payload,
        membershipsLoading: false,
      };
    case actionTypes.SET_SQUADS_LOADING:
      return { ...state, squadsLoading: action.payload };
    case actionTypes.SET_MEMBERSHIPS_LOADING:
      return { ...state, membershipsLoading: action.payload };

    // ── SkillTree ───────────────────────────────────────────────────
    case actionTypes.SET_RAW_SKILLS:
      return { ...state, rawSkills: action.payload, skillsLoading: false };
    case actionTypes.SET_RAW_SKILL_PROGRESS:
      return {
        ...state,
        rawSkillProgress: action.payload,
        skillProgressLoading: false,
      };
    case actionTypes.SET_SKILLS_LOADING:
      return { ...state, skillsLoading: action.payload };
    case actionTypes.SET_SKILL_PROGRESS_LOADING:
      return { ...state, skillProgressLoading: action.payload };
    case actionTypes.SET_SELECTED_SKILL_ID:
      return { ...state, selectedSkillId: action.payload };

    // ── ContentLock ─────────────────────────────────────────────────
    case actionTypes.SET_RAW_LOCKS:
      return { ...state, rawLocks: action.payload, locksLoading: false };
    case actionTypes.SET_LOCKS_LOADING:
      return { ...state, locksLoading: action.payload };

    // ── Linear Lock ─────────────────────────────────────────────────
    case actionTypes.SET_RAW_SECTIONS:
      return { ...state, rawSections: action.payload, sectionsLoading: false };
    case actionTypes.SET_RAW_ASSIGNMENTS:
      return {
        ...state,
        rawAssignments: action.payload,
        assignmentsLoading: false,
      };
    case actionTypes.SET_RAW_GRADES:
      return { ...state, rawGrades: action.payload, gradesLoading: false };
    case actionTypes.SET_SECTIONS_LOADING:
      return { ...state, sectionsLoading: action.payload };
    case actionTypes.SET_ASSIGNMENTS_LOADING:
      return { ...state, assignmentsLoading: action.payload };
    case actionTypes.SET_GRADES_LOADING:
      return { ...state, gradesLoading: action.payload };

    // ── XP ───────────────────────────────────────────────────────────
    case actionTypes.SET_XP_LOGS:
      return { ...state, xpLogs: action.payload, xpLoading: false };
    case actionTypes.SET_XP_LOADING:
      return { ...state, xpLoading: action.payload };

    default:
      return state;
  }
}
