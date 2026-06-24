"use client";
/**
 * GamificationContext — Unified context for all gamification state:
 * XP, Progress, Campaign, Squad, SkillTree, and ContentLock.
 *
 * Consolidates 6 separate contexts into one provider with a single
 * useReducer + domain-specific useMemo selectors.
 *
 * @module GamificationContext
 */

import React, { createContext, useContext, useEffect, useReducer, useCallback, useMemo, useState, useRef } from 'react'
import type { SkillNodeData, SkillStatus } from '../components/Gamification/SkillTree'
import type { AvatarUnlockConfig } from '../components/Gamification/DiceBearAvatar'
import { XPToast } from '../components/Gamification/XPToast'
import { calculateMultipliedXP, getLevelInfoWithThresholds, XPReason } from '../utils/xpCalculation'
import type { StudentXPLog, LevelInfo } from '../utils/xpCalculation'
import {
  gamificationReducer,
  initialState,
  actionTypes,
} from './reducers/gamificationReducer'
import type {
  ModuleProgress,
  PersonalBest,
  StreakInfo,
  CampaignInfo,
  GroupChallengeInfo,
  SquadInfo,
  SquadMember,
  LockStatus,
} from './reducers/gamificationReducer'

// Re-export types so consumers can import from this file
export type {
  ModuleProgress,
  PersonalBest,
  StreakInfo,
  CampaignInfo,
  GroupChallengeInfo,
  SquadInfo,
  SquadMember,
  LockStatus,
}

export interface BadgeEntry {
  badgeType: string
  sourceId?: string | null
  awardedAt?: string | null
  cohortId?: string | null
  unitID?: string | null
  isAnti?: boolean
  count?: number
}

export interface ActiveDebuff {
  badgeType: string
  appliedAt: string
  expiresAt: string
  xpMultiplier?: number
  temporaryTitle?: string
  shameText?: string
  avatarDowngrade?: string
  hideFromLeaderboard?: boolean
  extraDrills?: number
}

// ============================================================================
// Context value interface
// ============================================================================

export interface GamificationContextValue {
  // XP
  totalXP: number
  sectionXP: number
  level: LevelInfo
  sectionLevel: LevelInfo
  xpLogs: StudentXPLog[]
  xpLoading: boolean

  // Progress
  modules: ModuleProgress[]
  personalBests: PersonalBest[]
  badges: BadgeEntry[]
  activeDebuffs: ActiveDebuff[]
  hasActiveDebuff: (badgeType: string) => boolean
  streak: StreakInfo | null
  progressLoading: boolean

  // Campaign
  campaign: CampaignInfo | null
  activeChallenges: GroupChallengeInfo[]
  completedChallenges: GroupChallengeInfo[]
  campaignLoading: boolean

  // Squad
  mySquad: SquadInfo | null
  myMembership: SquadMember | null
  squadLeaderboard: SquadInfo[]
  squadMembers: SquadMember[]
  squadLoading: boolean

  // SkillTree
  skillNodes: SkillNodeData[]
  skillTreeLoading: boolean
  selectedSkillId: string | null
  setSelectedSkillId: (id: string | null) => void

  // ContentLock
  locks: LockStatus[]
  isLocked: (contentId: string) => boolean
  getLockStatus: (contentId: string) => LockStatus | undefined
  contentLockLoading: boolean

  // Global settings (from PlatformSettings singleton)
  avatarUnlockConfig: AvatarUnlockConfig | null
  platformSettings: any | null
  autoAnalyzeDocuments: boolean

  // Overall
  isLoading: boolean
}

// ============================================================================
// Context
// ============================================================================

const GamificationContext = createContext<GamificationContextValue>({
  // XP
  totalXP: 0,
  sectionXP: 0,
  level: { level: 1, label: 'Beginner', xpRequired: 0, xpForNextLevel: 100, progress: 0 },
  sectionLevel: { level: 1, label: 'Beginner', xpRequired: 0, xpForNextLevel: 100, progress: 0 },
  xpLogs: [],
  xpLoading: true,

  // Progress
  modules: [],
  personalBests: [],
  badges: [],
  activeDebuffs: [],
  hasActiveDebuff: () => false,
  streak: null,
  progressLoading: true,

  // Campaign
  campaign: null,
  activeChallenges: [],
  completedChallenges: [],
  campaignLoading: true,

  // Squad
  mySquad: null,
  myMembership: null,
  squadLeaderboard: [],
  squadMembers: [],
  squadLoading: true,

  // SkillTree
  skillNodes: [],
  skillTreeLoading: true,
  selectedSkillId: null,
  setSelectedSkillId: () => {},

  // ContentLock
  locks: [],
  isLocked: () => false,
  getLockStatus: () => undefined,
  contentLockLoading: true,

  // Global settings
  avatarUnlockConfig: null,
  platformSettings: null,
  autoAnalyzeDocuments: true,

  // Overall
  isLoading: true,
})

// ============================================================================
// Convenience hooks — one per domain, matching the old APIs
// ============================================================================

export function useGamification(): GamificationContextValue {
  return useContext(GamificationContext)
}

/** Drop-in replacement for the old useProgress() hook */
export function useProgress() {
  const ctx = useContext(GamificationContext)
  return {
    modules: ctx.modules,
    personalBests: ctx.personalBests,
    streak: ctx.streak,
    isLoading: ctx.progressLoading,
  }
}

/** Hook for earned badges from StudentProfile */
export function useBadges() {
  const ctx = useContext(GamificationContext)
  return {
    badges: ctx.badges,
    isLoading: ctx.progressLoading,
  }
}

/** Drop-in replacement for the old useCampaign() hook */
export function useCampaign() {
  const ctx = useContext(GamificationContext)
  return {
    campaign: ctx.campaign,
    activeChallenges: ctx.activeChallenges,
    completedChallenges: ctx.completedChallenges,
    isLoading: ctx.campaignLoading,
  }
}

/** Drop-in replacement for the old useSquad() hook */
export function useSquad() {
  const ctx = useContext(GamificationContext)
  return {
    mySquad: ctx.mySquad,
    myMembership: ctx.myMembership,
    squadLeaderboard: ctx.squadLeaderboard,
    squadMembers: ctx.squadMembers,
    isLoading: ctx.squadLoading,
  }
}

/** Drop-in replacement for the old useSkillTree() hook */
export function useSkillTree() {
  const ctx = useContext(GamificationContext)
  return {
    skillNodes: ctx.skillNodes,
    isLoading: ctx.skillTreeLoading,
    selectedSkillId: ctx.selectedSkillId,
    setSelectedSkillId: ctx.setSelectedSkillId,
  }
}

/** Drop-in replacement for the old useContentLock() hook */
export function useContentLock() {
  const ctx = useContext(GamificationContext)
  return {
    locks: ctx.locks,
    isLocked: ctx.isLocked,
    getLockStatus: ctx.getLockStatus,
    isLoading: ctx.contentLockLoading,
  }
}

/** Drop-in replacement for the old useXP() hook */
export function useXP() {
  const ctx = useContext(GamificationContext)
  return {
    totalXP: ctx.totalXP,
    sectionXP: ctx.sectionXP,
    level: ctx.level,
    sectionLevel: ctx.sectionLevel,
    xpLogs: ctx.xpLogs,
    isLoading: ctx.xpLoading,
    avatarUnlockConfig: ctx.avatarUnlockConfig,
  }
}

/** Access global platform settings (admin-configured singleton) */
export function usePlatformSettings() {
  const ctx = useContext(GamificationContext)
  return {
    platformSettings: ctx.platformSettings,
    autoAnalyzeDocuments: ctx.autoAnalyzeDocuments,
    avatarUnlockConfig: ctx.avatarUnlockConfig,
  }
}

// ============================================================================
// XP Toast friendly labels
// ============================================================================

const REASON_LABELS: Record<string, string> = {
  [XPReason.HOMEWORK_SUBMITTED]: 'Homework submitted',
  [XPReason.AI_FEEDBACK_REVISED]: 'Revised after AI feedback',
  [XPReason.ALL_BLOCKS_COMPLETED]: 'All blocks complete',
  [XPReason.PEER_REVIEW_GIVEN]: 'Peer review (reviewer)',
  [XPReason.PEER_REVIEW_HOSTED]: 'Peer review (host)',
  [XPReason.NAILED_IT]: 'Nailed It!',
  [XPReason.ON_TIME_SUBMISSION]: 'On-time submission',
  [XPReason.STREAK_3DAY]: '3-day streak',
  [XPReason.STREAK_7DAY]: '7-day streak',
  [XPReason.STREAK_14DAY]: '14-day streak',
  [XPReason.STREAK_30DAY]: '30-day streak',
  [XPReason.PERFECT_SCORE]: 'Perfect score',
  [XPReason.COMEBACK]: 'Comeback!',
  [XPReason.PERSONAL_BEST]: 'New personal best!',
  [XPReason.EASTER_EGG]: 'Secret discovered!',
  [XPReason.SQUAD_CHALLENGE_BONUS]: 'Squad challenge bonus',
}

interface XPToastItem {
  id: string
  xpAmount: number
  xpReason: string
}

// ============================================================================
// Provider
// ============================================================================

export interface GamificationProviderProps {
  client: any
  studentId: string
  cohortId?: string
  /** Optional map of moduleId → display name for progress rings */
  moduleNames?: Record<string, string>
  /** Set of badge types the student has earned */
  earnedBadgeTypes?: Set<string>
  /** Map of moduleId → completion percent (0–100) */
  moduleCompletionMap?: Record<string, number>
  /** Optional sections array — pass from SectionContext to avoid duplicate subscriptions */
  sections?: any[]
  /** Optional assignments array — pass from SectionContext to avoid duplicate subscriptions */
  assignments?: any[]
  children: React.ReactNode
}

export function GamificationProvider({
  client,
  studentId,
  cohortId,
  moduleNames = {},
  earnedBadgeTypes = new Set(),
  moduleCompletionMap = {},
  sections: sectionsProp,
  assignments: assignmentsProp,
  children,
}: GamificationProviderProps) {
  const [state, dispatch] = useReducer(gamificationReducer, initialState)

  // XP toast queue (local state — not in reducer since it triggers UI side-effects)
  const [toastQueue, setToastQueue] = useState<XPToastItem[]>([])
  const [currentToast, setCurrentToast] = useState<XPToastItem | null>(null)
  const knownXpIdsRef = useRef<Set<string>>(new Set())
  const xpInitialLoadRef = useRef(true)
  const profileVersionRef = useRef(0)
  const challengeVersionMapRef = useRef<Record<string, number>>({})
  const squadVersionMapRef = useRef<Record<string, number>>({})
  const skillVersionMapRef = useRef<Record<string, number>>({})
  const xpLogVersionMapRef = useRef<Record<string, number>>({})
  const unitLockVersionMapRef = useRef<Record<string, number>>({})

  // Stable setter for selectedSkillId
  const setSelectedSkillId = useCallback(
    (id: string | null) => dispatch({ type: actionTypes.SET_SELECTED_SKILL_ID, payload: id }),
    [],
  )

  // ── Safety timeout: if subscriptions never fire, unblock UI after 5s ──
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only force-clear if any loading states are still true
      const stillLoading =
        state.progressLoading || state.campaignsLoading || state.challengesLoading ||
        state.squadsLoading || state.membershipsLoading || state.skillsLoading ||
        state.skillProgressLoading || state.locksLoading || state.xpLoading
      if (!stillLoading) return
      console.warn('[GamificationContext] Safety timeout: forcing loading states to false')
      dispatch({ type: actionTypes.SET_PROGRESS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_CAMPAIGNS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_CHALLENGES_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_SQUADS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_MEMBERSHIPS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_SKILLS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_SKILL_PROGRESS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_LOCKS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_XP_LOADING, payload: false })
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  // ── StudentProfile subscription (replaces 7 individual model subs) ──
  useEffect(() => {
    if (!client?.models?.StudentProfile || !studentId) {
      dispatch({ type: actionTypes.SET_PROGRESS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_SKILL_PROGRESS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_LOCKS_LOADING, payload: false })
      return
    }
    const filter = { studentId: { eq: studentId } }

    const processProfile = (data: any[]) => {
      const valid = (data || []).filter((i: any) => i != null && i.id != null)
      const profile = valid[0]
      if (!profile) {
        dispatch({ type: actionTypes.SET_PROGRESS_LOADING, payload: false })
        dispatch({ type: actionTypes.SET_SKILL_PROGRESS_LOADING, payload: false })
        dispatch({ type: actionTypes.SET_LOCKS_LOADING, payload: false })
        return
      }

      // Version guard: only rerender if incoming version is greater than expected
      if (profile._version != null && !(profile._version > profileVersionRef.current)) {
        return
      }
      profileVersionRef.current = profile._version || 0

      // Progress (was StudentProgress)
      dispatch({ type: actionTypes.SET_RAW_MODULES, payload: profile.moduleProgress || [] })

      // Badges (was StudentBadge)
      dispatch({ type: actionTypes.SET_RAW_BADGES, payload: profile.badges || [] })

      // Active debuffs from anti-badges
      dispatch({ type: actionTypes.SET_RAW_DEBUFFS, payload: profile.activeDebuffs || [] })

      // Personal bests (was StudentPersonalBest)
      dispatch({ type: actionTypes.SET_RAW_PERSONAL_BESTS, payload: (profile.personalBests || []).map((pb: any) => ({ ...pb, id: pb.unitID })) })

      // Streak (was StudentStreak)
      if (profile.currentStreak != null) {
        dispatch({
          type: actionTypes.SET_STREAK,
          payload: {
            currentStreak: profile.currentStreak || 0,
            longestStreak: profile.longestStreak || 0,
            lastActivityDate: profile.lastActivityDate || '',
            freezesRemaining: profile.freezesRemaining || 0,
            freezesUsed: profile.freezesUsed || 0,
          },
        })
      }

      // Skill progress (was StudentSkillProgress)
      dispatch({
        type: actionTypes.SET_RAW_SKILL_PROGRESS,
        payload: (profile.skillProgress || []).map((sp: any) => ({ ...sp, id: sp.skillId })),
      })

      // Content locks are derived from Unit model fields (requiredXP, requiredBadgeId,
      // requiredModuleCompletion) — see Unit subscription below. Not stored on profile.
    }

    // Single observeQuery replaces list() + onCreate + onUpdate
    const subscription = client.models.StudentProfile.observeQuery({ filter }).subscribe({
      next: ({ items }: any) => {
        processProfile(items)
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (!msg.includes('DuplicatedOperationError')) console.error('[GamificationContext] StudentProfile error:', err)
      },
    })

    return () => subscription.unsubscribe()
  }, [client, studentId])

  // ── GroupChallenge subscription (includes campaign + contributions) ──
  useEffect(() => {
    if (!client?.models?.GroupChallenge || !cohortId) {
      dispatch({ type: actionTypes.SET_CAMPAIGNS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_CHALLENGES_LOADING, payload: false })
      return
    }
    const filter = { cohortId: { eq: cohortId } }

    const processData = (data: any[]) => {
      const valid = (data || []).filter((i: any) => i != null && i.id != null)

      // Version map guard
      const hasChanges = valid.some((item: any) => {
        const tracked = challengeVersionMapRef.current[item.id]
        return tracked == null || item._version > tracked
      })
      if (!hasChanges && Object.keys(challengeVersionMapRef.current).length > 0) return

      challengeVersionMapRef.current = {}
      valid.forEach((item: any) => { challengeVersionMapRef.current[item.id] = item._version })

      dispatch({ type: actionTypes.SET_RAW_CHALLENGES, payload: valid })
      // Extract campaign info from challenges (setting/stakes/systemPromptSeed)
      const campaignChallenge = valid.find((c: any) => c.setting || c.stakes)
      dispatch({ type: actionTypes.SET_RAW_CAMPAIGNS, payload: campaignChallenge ? [campaignChallenge] : [] })
    }

    const subscription = client.models.GroupChallenge.observeQuery({ filter }).subscribe({
      next: ({ items }: any) => { processData(items) },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (!msg.includes('DuplicatedOperationError')) console.error('[GamificationContext] GroupChallenge error:', err)
      },
    })

    return () => subscription.unsubscribe()
  }, [client, cohortId])

  // ── Squad subscription (includes members) ───────────────────────
  useEffect(() => {
    if (!client?.models?.Squad) {
      dispatch({ type: actionTypes.SET_SQUADS_LOADING, payload: false })
      dispatch({ type: actionTypes.SET_MEMBERSHIPS_LOADING, payload: false })
      return
    }
    const filter = cohortId ? { cohortId: { eq: cohortId } } : undefined

    const processSquads = (data: any[]) => {
      const valid = (data || []).filter((i: any) => i != null && i.id != null)

      // Version map guard
      const hasChanges = valid.some((item: any) => {
        const tracked = squadVersionMapRef.current[item.id]
        return tracked == null || item._version > tracked
      })
      if (!hasChanges && Object.keys(squadVersionMapRef.current).length > 0) return

      squadVersionMapRef.current = {}
      valid.forEach((item: any) => { squadVersionMapRef.current[item.id] = item._version })

      dispatch({ type: actionTypes.SET_RAW_SQUADS, payload: valid })
      // Extract memberships from Squad.members arrays
      const allMemberships: any[] = []
      for (const squad of valid) {
        for (const member of (squad.members || [])) {
          allMemberships.push({ ...member, id: `${squad.id}-${member.studentId}`, squadId: squad.id })
        }
      }
      dispatch({ type: actionTypes.SET_RAW_MEMBERSHIPS, payload: allMemberships })
    }

    const subscription = client.models.Squad.observeQuery(filter ? { filter } : undefined).subscribe({
      next: ({ items }: any) => { processSquads(items) },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (!msg.includes('DuplicatedOperationError')) console.error('[GamificationContext] Squad error:', err)
      },
    })

    return () => subscription.unsubscribe()
  }, [client, cohortId])

  // ── Skill definitions subscription ─────────────────────────────
  useEffect(() => {
    if (!client?.models?.Skill) {
      dispatch({ type: actionTypes.SET_SKILLS_LOADING, payload: false })
      return
    }
    const filter = cohortId ? { cohortId: { eq: cohortId } } : undefined

    const subscription = client.models.Skill.observeQuery(filter ? { filter } : undefined).subscribe({
      next: ({ items }: any) => {
        const valid = (items || []).filter((i: any) => i != null && i.id != null)

        // Version map guard
        const hasChanges = valid.some((item: any) => {
          const tracked = skillVersionMapRef.current[item.id]
          return tracked == null || item._version > tracked
        })
        if (!hasChanges && Object.keys(skillVersionMapRef.current).length > 0) return

        skillVersionMapRef.current = {}
        valid.forEach((item: any) => { skillVersionMapRef.current[item.id] = item._version })

        dispatch({ type: actionTypes.SET_RAW_SKILLS, payload: valid })
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (!msg.includes('DuplicatedOperationError')) console.error('[GamificationContext] Skill error:', err)
      },
    })

    return () => subscription.unsubscribe()
  }, [client, cohortId])

  // ── Unit subscription (content lock fields) ─────────────────────
  // Reads requiredXP, requiredBadgeId, requiredModuleCompletion from
  // published units to derive content locks. This is the source of truth
  // for XP/badge/completion gates — NOT StudentProfile.contentLocks.
  useEffect(() => {
    if (!client?.models?.Unit) {
      dispatch({ type: actionTypes.SET_LOCKS_LOADING, payload: false })
      return
    }

    const subscription = client.models.Unit.observeQuery({
      filter: { status: { eq: 'PUBLISHED' } },
    }).subscribe({
      next: ({ items }: any) => {
        const valid = (items || []).filter((u: any) => u != null && u.id != null && u.deletedAt == null)

        // Version map guard
        const hasChanges = valid.some((item: any) => {
          const tracked = unitLockVersionMapRef.current[item.id]
          return tracked == null || item._version > tracked
        })
        if (!hasChanges && Object.keys(unitLockVersionMapRef.current).length > 0) return

        unitLockVersionMapRef.current = {}
        valid.forEach((item: any) => { unitLockVersionMapRef.current[item.id] = item._version })

        // Extract units that have at least one lock requirement set
        const lockData = valid
          .filter((u: any) =>
            (u.requiredXP != null && u.requiredXP > 0) ||
            u.requiredBadgeId ||
            (u.requiredModuleCompletion != null && u.requiredModuleCompletion > 0),
          )
          .map((u: any) => ({
            contentId: u.id,
            requiredXP: u.requiredXP || undefined,
            requiredBadgeId: u.requiredBadgeId || undefined,
            requiredModuleCompletion: u.requiredModuleCompletion || undefined,
          }))

        dispatch({ type: actionTypes.SET_RAW_LOCKS, payload: lockData })
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (!msg.includes('DuplicatedOperationError')) console.error('[GamificationContext] Unit lock error:', err)
        dispatch({ type: actionTypes.SET_LOCKS_LOADING, payload: false })
      },
    })

    return () => subscription.unsubscribe()
  }, [client])

  // ── PlatformSettings subscription (global singleton) ────────
  // One record for the whole platform: XP multipliers, level thresholds,
  // avatar unlock config, badge toggles, caps, AI settings. Admin-only write.
  const [globalSettings, setGlobalSettings] = useState<any>(null)

  useEffect(() => {
    if (!client?.models?.PlatformSettings) return

    const subscription = client.models.PlatformSettings.observeQuery().subscribe({
      next: ({ items }: any) => {
        const valid = (items || []).filter((item: any) => item != null && item.id != null)
        // Take the first (and only) record
        setGlobalSettings(valid[0] || null)
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || err?.error?.errors?.[0]?.message || String(err)
        if (!msg.includes('DuplicatedOperationError')) {
          console.warn('[GamificationContext] PlatformSettings error:', msg)
        }
      },
    })

    return () => subscription.unsubscribe()
  }, [client])

  // ── Linear Lock data (Sections, Assignments, Grades) ───────────
  // Sections and Assignments are accepted from parent contexts via props —
  // zero additional API calls for those models.
  // Grades are fetched only when a section actually has linearLockEnabled,
  // since no existing context provides all grades across all units.
  useEffect(() => {
    if (sectionsProp !== undefined) {
      dispatch({ type: actionTypes.SET_RAW_SECTIONS, payload: sectionsProp })
    } else {
      dispatch({ type: actionTypes.SET_SECTIONS_LOADING, payload: false })
    }
  }, [sectionsProp])

  useEffect(() => {
    if (assignmentsProp !== undefined) {
      dispatch({ type: actionTypes.SET_RAW_ASSIGNMENTS, payload: assignmentsProp })
    } else {
      dispatch({ type: actionTypes.SET_ASSIGNMENTS_LOADING, payload: false })
    }
  }, [assignmentsProp])

  // Grades: fetch only when linear lock is enabled on at least one section
  const gradesFetchedRef = useRef(false)
  useEffect(() => {
    const hasLinearLock = (sectionsProp || []).some((s: any) => s?.linearLockEnabled)
    if (!hasLinearLock || !client?.models?.Grade || !studentId || gradesFetchedRef.current) {
      dispatch({ type: actionTypes.SET_GRADES_LOADING, payload: false })
      return
    }
    gradesFetchedRef.current = true

    client.models.Grade.list().then(({ data }: { data: any[] }) => {
      const valid = (data || []).filter((g: any) => g != null && g.id != null)
      dispatch({ type: actionTypes.SET_RAW_GRADES, payload: valid })
    }).catch((err: any) => {
      console.error('[GamificationContext] Grade fetch for linear lock error:', err)
      dispatch({ type: actionTypes.SET_GRADES_LOADING, payload: false })
    })
  }, [sectionsProp, client, studentId])

  // ── XP subscription ─────────────────────────────────────────────
  useEffect(() => {
    if (!client?.models?.StudentXPLog || !studentId) {
      dispatch({ type: actionTypes.SET_XP_LOADING, payload: false })
      return
    }
    const filter = { studentId: { eq: studentId } }

    const processXPLogs = (data: any[]) => {
      const valid = (data || []).filter((i: any) => i != null && i.id != null)

      // Version map guard
      const hasChanges = valid.some((item: any) => {
        const tracked = xpLogVersionMapRef.current[item.id]
        return tracked == null || item._version > tracked
      })
      if (!hasChanges && Object.keys(xpLogVersionMapRef.current).length > 0) return

      xpLogVersionMapRef.current = {}
      valid.forEach((item: any) => { xpLogVersionMapRef.current[item.id] = item._version })

      dispatch({ type: actionTypes.SET_XP_LOGS, payload: valid })

      // Queue toasts for new entries (skip initial load)
      if (!xpInitialLoadRef.current) {
        const newEntries = valid.filter((item: any) => !knownXpIdsRef.current.has(item.id))
        for (const entry of newEntries) {
          setToastQueue((prev) => [
            ...prev,
            {
              id: entry.id,
              xpAmount: entry.xpAmount,
              xpReason: REASON_LABELS[entry.reason] || entry.reason,
            },
          ])
        }
      }

      knownXpIdsRef.current = new Set(valid.map((item: any) => item.id))
      xpInitialLoadRef.current = false
    }

    const subscription = client.models.StudentXPLog.observeQuery({ filter }).subscribe({
      next: ({ items }: any) => { processXPLogs(items) },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (!msg.includes('DuplicatedOperationError')) console.error('[GamificationContext] XPLog error:', err)
      },
    })

    return () => subscription.unsubscribe()
  }, [client, studentId])

  // ── XP toast queue — show one at a time ─────────────────────────
  useEffect(() => {
    if (currentToast || toastQueue.length === 0) return
    const [next, ...rest] = toastQueue
    setCurrentToast(next)
    setToastQueue(rest)
  }, [toastQueue, currentToast])

  const handleToastClose = useCallback(() => setCurrentToast(null), [])

  // ── Derived: XP ─────────────────────────────────────────────────
  // Parse multipliers and level thresholds from global settings
  const xpMultipliers = useMemo<Record<string, number> | null>(() => {
    if (!globalSettings?.xpMultipliers) return null
    try {
      return typeof globalSettings.xpMultipliers === 'string'
        ? JSON.parse(globalSettings.xpMultipliers)
        : globalSettings.xpMultipliers
    } catch { return null }
  }, [globalSettings?.xpMultipliers])

  const dbLevelThresholds = useMemo<{ level: number; xpRequired: number; title?: string }[] | null>(() => {
    if (!globalSettings?.levelThresholds) return null
    try {
      const parsed = typeof globalSettings.levelThresholds === 'string'
        ? JSON.parse(globalSettings.levelThresholds)
        : globalSettings.levelThresholds
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
    } catch { return null }
  }, [globalSettings?.levelThresholds])

  // Total XP applies multipliers globally (all logs)
  const computedTotalXP = useMemo(
    () => calculateMultipliedXP(state.xpLogs, xpMultipliers),
    [state.xpLogs, xpMultipliers],
  )
  // Level uses DB thresholds when configured, otherwise hardcoded defaults
  const level = useMemo(
    () => getLevelInfoWithThresholds(computedTotalXP, dbLevelThresholds),
    [computedTotalXP, dbLevelThresholds],
  )

  // Section-scoped XP: only XP logs matching the current cohortId
  const computedSectionXP = useMemo(() => {
    if (!cohortId) return 0
    const sectionLogs = state.xpLogs.filter((log: any) => log.cohortId === cohortId)
    return calculateMultipliedXP(sectionLogs, xpMultipliers)
  }, [state.xpLogs, cohortId, xpMultipliers])
  const sectionLevel = useMemo(
    () => getLevelInfoWithThresholds(computedSectionXP, dbLevelThresholds),
    [computedSectionXP, dbLevelThresholds],
  )

  // Avatar unlock config from global settings
  const avatarUnlockConfig = useMemo<AvatarUnlockConfig | null>(() => {
    if (!globalSettings?.avatarUnlockConfig) return null
    try {
      const parsed = typeof globalSettings.avatarUnlockConfig === 'string'
        ? JSON.parse(globalSettings.avatarUnlockConfig)
        : globalSettings.avatarUnlockConfig
      return parsed?.unlocks?.length ? parsed : null
    } catch { return null }
  }, [globalSettings?.avatarUnlockConfig])

  // ── Derived: Progress ───────────────────────────────────────────
  const modules = useMemo<ModuleProgress[]>(
    () =>
      state.rawModules.map((m: any) => ({
        moduleId: m.moduleId,
        moduleName: moduleNames[m.moduleId] || m.moduleId,
        completionPercent: m.completionPercent || 0,
        totalWorkbooks: m.totalWorkbooks || 0,
        completedWorkbooks: m.completedWorkbooks || 0,
      })),
    [state.rawModules, moduleNames],
  )

  const personalBests = useMemo<PersonalBest[]>(
    () =>
      state.rawPersonalBests.map((pb: any) => ({
        id: pb.id,
        unitID: pb.unitID,
        bestScore: pb.bestScore,
        previousBest: pb.previousBest ?? null,
        achievedAt: pb.achievedAt || '',
      })),
    [state.rawPersonalBests],
  )

  const badges = useMemo<BadgeEntry[]>(
    () => (state.rawBadges || []).map((b: any) => ({
      badgeType: b.badgeType,
      sourceId: b.sourceId || null,
      awardedAt: b.awardedAt || null,
      cohortId: b.cohortId || null,
      unitID: b.unitID || null,
      isAnti: b.isAnti || false,
      count: b.count || 1,
    })),
    [state.rawBadges],
  )

  const activeDebuffs = useMemo<ActiveDebuff[]>(() => {
    try {
      const raw = typeof state.rawDebuffs === 'string'
        ? JSON.parse(state.rawDebuffs || '[]')
        : state.rawDebuffs || []
      const now = Date.now()
      return (raw as any[]).filter(
        (d) => d && d.expiresAt && new Date(d.expiresAt).getTime() > now,
      )
    } catch {
      return []
    }
  }, [state.rawDebuffs])

  const hasActiveDebuff = useCallback(
    (badgeType: string) => activeDebuffs.some((d) => d.badgeType === badgeType),
    [activeDebuffs],
  )

  // ── Derived: Campaign ───────────────────────────────────────────
  const campaign = useMemo<CampaignInfo | null>(() => {
    if (state.rawCampaigns.length === 0) return null
    const c = state.rawCampaigns[0]
    return {
      id: c.id,
      cohortId: c.cohortId,
      title: c.title,
      setting: c.setting,
      stakes: c.stakes,
      systemPromptSeed: c.systemPromptSeed,
    }
  }, [state.rawCampaigns])

  const { activeChallenges, completedChallenges } = useMemo(() => {
    const active: GroupChallengeInfo[] = []
    const completed: GroupChallengeInfo[] = []
    state.rawChallenges.forEach((ch: any) => {
      const info: GroupChallengeInfo = {
        id: ch.id,
        cohortId: ch.cohortId,
        title: ch.title,
        targetXP: ch.targetXP,
        currentXP: ch.currentXP || 0,
        deadline: ch.deadline,
        active: ch.active !== false,
        bonusMultiplier: ch.bonusMultiplier || 1.5,
        contributions: ch.contributions || [],
        progressPercent:
          ch.targetXP > 0
            ? Math.min(100, Math.round(((ch.currentXP || 0) / ch.targetXP) * 100))
            : 0,
      }
      if (info.active) active.push(info)
      else completed.push(info)
    })
    return { activeChallenges: active, completedChallenges: completed }
  }, [state.rawChallenges])

  // ── Derived: Squad ──────────────────────────────────────────────
  const myMembership = useMemo<SquadMember | null>(() => {
    const found = state.rawMemberships.find((m: any) => m.studentId === studentId)
    if (!found) return null
    return {
      id: found.id,
      squadId: found.squadId,
      studentId: found.studentId,
      role: found.role || 'MEMBER',
      joinedAt: found.joinedAt,
    }
  }, [state.rawMemberships, studentId])

  const memberCountMap = useMemo(() => {
    const counts = new Map<string, number>()
    state.rawMemberships.forEach((m: any) => {
      counts.set(m.squadId, (counts.get(m.squadId) || 0) + 1)
    })
    return counts
  }, [state.rawMemberships])

  const squadLeaderboard = useMemo<SquadInfo[]>(
    () =>
      state.rawSquads
        .map((g: any) => ({
          id: g.id,
          name: g.name,
          cohortId: g.cohortId,
          totalXP: g.totalXP || 0,
          crestSvg: g.crestSvg || null,
          description: g.description,
          memberCount: memberCountMap.get(g.id) || 0,
          members: (g.members || []).map((m: any) => ({
            studentId: m.studentId,
            role: m.role,
            avatarStyle: m.avatarStyle,
            avatarOverrides: typeof m.avatarOverrides === 'string'
              ? JSON.parse(m.avatarOverrides)
              : m.avatarOverrides,
            avatarSeed: m.avatarSeed || m.studentId,
          })),
          posts: g.posts || [],
        }))
        .sort((a: SquadInfo, b: SquadInfo) => b.totalXP - a.totalXP),
    [state.rawSquads, memberCountMap],
  )

  const mySquad = useMemo<SquadInfo | null>(() => {
    if (!myMembership) return null
    return squadLeaderboard.find((g) => g.id === myMembership.squadId) || null
  }, [myMembership, squadLeaderboard])

  const squadMembers = useMemo<SquadMember[]>(() => {
    if (!myMembership) return []
    return state.rawMemberships
      .filter((m: any) => m.squadId === myMembership.squadId)
      .map((m: any) => ({
        id: m.id,
        squadId: m.squadId,
        studentId: m.studentId,
        role: m.role || 'MEMBER',
        joinedAt: m.joinedAt,
      }))
  }, [state.rawMemberships, myMembership])

  // ── Derived: SkillTree ──────────────────────────────────────────
  const skillNodes = useMemo<SkillNodeData[]>(() => {
    const progressBySkill = new Map<string, string>(
      state.rawSkillProgress.map((p: any) => [p.skillId, p.status]),
    )
    return state.rawSkills.map((skill: any) => {
      const status = (progressBySkill.get(skill.id) || 'LOCKED') as SkillStatus
      let prerequisites: string[] = []
      if (skill.prerequisites) {
        try {
          const parsed =
            typeof skill.prerequisites === 'string'
              ? JSON.parse(skill.prerequisites)
              : skill.prerequisites
          if (Array.isArray(parsed)) prerequisites = parsed
        } catch {
          // ignore malformed
        }
      }
      return {
        skillId: skill.id,
        title: skill.title,
        description: skill.description || undefined,
        status,
        xpReward: skill.xpReward ?? undefined,
        prerequisites,
        cohortId: skill.cohortId || undefined,
      }
    })
  }, [state.rawSkills, state.rawSkillProgress])

  // ── Derived: ContentLock ────────────────────────────────────────
  const locks = useMemo<LockStatus[]>(() => {
    return state.rawLocks.map((lock: any) => {
      let isLockedVal = false
      const status: LockStatus = { contentId: lock.contentId, isLocked: false }

      if (lock.requiredXP != null && lock.requiredXP > 0) {
        status.requiredXP = lock.requiredXP
        status.currentXP = computedTotalXP
        if (computedTotalXP < lock.requiredXP) isLockedVal = true
      }
      if (lock.requiredBadgeId) {
        status.requiredBadge = lock.requiredBadgeId
        status.hasBadge = earnedBadgeTypes.has(lock.requiredBadgeId)
        if (!status.hasBadge) isLockedVal = true
      }
      if (lock.requiredModuleCompletion != null && lock.requiredModuleCompletion > 0) {
        const requiredPercent = Math.round(lock.requiredModuleCompletion * 100)
        const currentPercent = moduleCompletionMap[lock.contentId] || 0
        status.requiredCompletion = requiredPercent
        status.currentCompletion = currentPercent
        if (currentPercent < requiredPercent) isLockedVal = true
      }
      status.isLocked = isLockedVal
      return status
    })
  }, [state.rawLocks, computedTotalXP, earnedBadgeTypes, moduleCompletionMap])

  // ── Derived: Linear Lock (sequential by due date) ───────────────
  const linearLocks = useMemo<LockStatus[]>(() => {
    // Find sections with linearLockEnabled
    const linearSections = state.rawSections.filter((s: any) => s.linearLockEnabled)
    if (linearSections.length === 0) return []

    const completedUnitIds = new Set(
      state.rawGrades
        .filter((g: any) => g.complete)
        .map((g: any) => g.unitID),
    )

    const result: LockStatus[] = []

    for (const section of linearSections) {
      // Get assignments for this section, sorted by dueDate ascending
      const sectionAssignments = state.rawAssignments
        .filter((a: any) => a.sectionID === section.id && a.dueDate)
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

      if (sectionAssignments.length < 2) continue

      // First assignment is always unlocked; subsequent ones require prior completion
      let blocked = false
      for (let i = 1; i < sectionAssignments.length; i++) {
        const prevAssignment = sectionAssignments[i - 1]
        const currentAssignment = sectionAssignments[i]

        if (!blocked && !completedUnitIds.has(prevAssignment.unitID)) {
          blocked = true
        }

        if (blocked) {
          result.push({
            contentId: currentAssignment.unitID,
            isLocked: true,
            requiredPriorUnitId: prevAssignment.unitID,
          })
        }
      }
    }

    return result
  }, [state.rawSections, state.rawAssignments, state.rawGrades])

  // ── Combined lock map (ContentLock + Linear Lock) ───────────────
  const lockMap = useMemo(() => {
    const map = new Map<string, LockStatus>(locks.map((l) => [l.contentId, l]))
    // Merge linear locks — if already locked by ContentLock, keep that; otherwise add linear lock
    for (const ll of linearLocks) {
      const existing = map.get(ll.contentId)
      if (existing) {
        // Already locked by ContentLock — add linear lock info
        if (!existing.isLocked) {
          map.set(ll.contentId, { ...existing, ...ll })
        } else {
          // Both locked — merge the linear fields into existing
          map.set(ll.contentId, { ...existing, requiredPriorUnitId: ll.requiredPriorUnitId })
        }
      } else {
        map.set(ll.contentId, ll)
      }
    }
    return map
  }, [locks, linearLocks])

  const isLockedFn = useCallback(
    (contentId: string) => lockMap.get(contentId)?.isLocked ?? false,
    [lockMap],
  )
  const getLockStatus = useCallback(
    (contentId: string) => lockMap.get(contentId),
    [lockMap],
  )

  // ── Loading flags ───────────────────────────────────────────────
  const campaignLoading = state.campaignsLoading || state.challengesLoading
  const squadLoading = state.squadsLoading || state.membershipsLoading
  const skillTreeLoading = state.skillsLoading || state.skillProgressLoading
  const isLoading =
    state.xpLoading ||
    state.progressLoading ||
    campaignLoading ||
    squadLoading ||
    skillTreeLoading ||
    state.locksLoading

  // ── Context value ───────────────────────────────────────────────
  const contextValue = useMemo<GamificationContextValue>(
    () => ({
      // XP
      totalXP: computedTotalXP,
      sectionXP: computedSectionXP,
      level,
      sectionLevel,
      xpLogs: state.xpLogs,
      xpLoading: state.xpLoading,

      // Progress
      modules,
      personalBests,
      badges,
      activeDebuffs,
      hasActiveDebuff,
      streak: state.streak,
      progressLoading: state.progressLoading,

      // Campaign
      campaign,
      activeChallenges,
      completedChallenges,
      campaignLoading,

      // Squad
      mySquad,
      myMembership,
      squadLeaderboard,
      squadMembers,
      squadLoading,

      // SkillTree
      skillNodes,
      skillTreeLoading,
      selectedSkillId: state.selectedSkillId,
      setSelectedSkillId,

      // ContentLock
      locks,
      isLocked: isLockedFn,
      getLockStatus,
      contentLockLoading: state.locksLoading,

      // Global settings
      avatarUnlockConfig,
      platformSettings: globalSettings,
      autoAnalyzeDocuments: globalSettings?.autoAnalyzeDocuments !== false,

      // Overall
      isLoading,
    }),
    [
      computedTotalXP,
      computedSectionXP,
      level,
      sectionLevel,
      state.xpLogs,
      state.xpLoading,
      modules,
      personalBests,
      badges,
      activeDebuffs,
      hasActiveDebuff,
      state.streak,
      state.progressLoading,
      campaign,
      activeChallenges,
      completedChallenges,
      campaignLoading,
      mySquad,
      myMembership,
      squadLeaderboard,
      squadMembers,
      squadLoading,
      skillNodes,
      skillTreeLoading,
      state.selectedSkillId,
      setSelectedSkillId,
      locks,
      isLockedFn,
      getLockStatus,
      state.locksLoading,
      avatarUnlockConfig,
      globalSettings,
      isLoading,
    ],
  )

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
      <XPToast
        open={currentToast != null}
        xpAmount={currentToast?.xpAmount || 0}
        xpReason={currentToast?.xpReason || ''}
        onClose={handleToastClose}
      />
    </GamificationContext.Provider>
  )
}

export default GamificationContext
