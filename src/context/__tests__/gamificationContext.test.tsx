/**
 * Tests for GamificationProvider (gamificationContext.tsx)
 *
 * Tests the unified context that consolidates XP, Progress, Campaign,
 * Guild, SkillTree, and ContentLock state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import React from 'react'
import {
  GamificationProvider,
  useGamification,
  useXP,
  useProgress,
  useCampaign,
  useGuild,
  useSkillTree,
  useContentLock,
} from '../gamificationContext'

// ============================================================================
// Helpers
// ============================================================================

/** Creates a mock client with observeQuery for each model */
function createMockClient(data: Record<string, any[]> = {}) {
  const subscriptions: Record<string, any> = {}

  const createModel = (modelName: string) => ({
    observeQuery: (filter?: any) => ({
      subscribe: (handlers: any) => {
        subscriptions[modelName] = handlers
        handlers.next({ items: data[modelName] || [] })
        return { unsubscribe: vi.fn() }
      },
    }),
  })

  return {
    models: {
      StudentXPLog: createModel('StudentXPLog'),
      StudentProgress: createModel('StudentProgress'),
      StudentPersonalBest: createModel('StudentPersonalBest'),
      StudentStreak: createModel('StudentStreak'),
      Campaign: createModel('Campaign'),
      GroupChallenge: createModel('GroupChallenge'),
      Guild: createModel('Guild'),
      GuildMembership: createModel('GuildMembership'),
      Skill: createModel('Skill'),
      StudentSkillProgress: createModel('StudentSkillProgress'),
      ContentLock: createModel('ContentLock'),
    },
    _subscriptions: subscriptions,
  }
}

// Test consumer components for each hook
function XPConsumer() {
  const { totalXP, level, xpLogs, isLoading } = useXP()
  return (
    <div>
      <div data-testid="xp-loading">{String(isLoading)}</div>
      <div data-testid="total-xp">{totalXP}</div>
      <div data-testid="level">{level.level}</div>
      <div data-testid="level-label">{level.label}</div>
      <div data-testid="xp-log-count">{xpLogs.length}</div>
    </div>
  )
}

function ProgressConsumer() {
  const { modules, personalBests, streak, isLoading } = useProgress()
  return (
    <div>
      <div data-testid="progress-loading">{String(isLoading)}</div>
      <div data-testid="module-count">{modules.length}</div>
      <div data-testid="pb-count">{personalBests.length}</div>
      <div data-testid="streak">{streak?.currentStreak ?? 'none'}</div>
    </div>
  )
}

function CampaignConsumer() {
  const { campaign, activeChallenges, completedChallenges, isLoading } = useCampaign()
  return (
    <div>
      <div data-testid="campaign-loading">{String(isLoading)}</div>
      <div data-testid="campaign-title">{campaign?.title ?? 'none'}</div>
      <div data-testid="active-challenges">{activeChallenges.length}</div>
      <div data-testid="completed-challenges">{completedChallenges.length}</div>
    </div>
  )
}

function GuildConsumer() {
  const { myGuild, myMembership, guildLeaderboard, guildMembers, isLoading } = useGuild()
  return (
    <div>
      <div data-testid="guild-loading">{String(isLoading)}</div>
      <div data-testid="my-guild">{myGuild?.name ?? 'none'}</div>
      <div data-testid="my-role">{myMembership?.role ?? 'none'}</div>
      <div data-testid="leaderboard-count">{guildLeaderboard.length}</div>
      <div data-testid="guild-member-count">{guildMembers.length}</div>
    </div>
  )
}

function SkillTreeConsumer() {
  const { skillNodes, isLoading, selectedSkillId, setSelectedSkillId } = useSkillTree()
  return (
    <div>
      <div data-testid="skill-loading">{String(isLoading)}</div>
      <div data-testid="skill-count">{skillNodes.length}</div>
      <div data-testid="selected-skill">{selectedSkillId ?? 'none'}</div>
      <button data-testid="select-btn" onClick={() => setSelectedSkillId('skill-1')}>
        select
      </button>
    </div>
  )
}

function ContentLockConsumer() {
  const { locks, isLocked, getLockStatus, isLoading } = useContentLock()
  return (
    <div>
      <div data-testid="lock-loading">{String(isLoading)}</div>
      <div data-testid="lock-count">{locks.length}</div>
      <div data-testid="is-locked-unit1">{String(isLocked('unit-1'))}</div>
      <div data-testid="lock-status-unit1">
        {JSON.stringify(getLockStatus('unit-1') || null)}
      </div>
    </div>
  )
}

function FullConsumer() {
  const ctx = useGamification()
  return (
    <div>
      <div data-testid="is-loading">{String(ctx.isLoading)}</div>
      <div data-testid="total-xp">{ctx.totalXP}</div>
      <div data-testid="level">{ctx.level.level}</div>
    </div>
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('GamificationProvider', () => {
  // ==== XP ====
  describe('XP domain', () => {
    it('computes totalXP from XP logs', () => {
      const client = createMockClient({
        StudentXPLog: [
          { id: 'xp1', studentId: 's1', xpAmount: 50, reason: 'HOMEWORK_SUBMITTED' },
          { id: 'xp2', studentId: 's1', xpAmount: 75, reason: 'ALL_BLOCKS_COMPLETED' },
          { id: 'xp3', studentId: 's1', xpAmount: 20, reason: 'NAILED_IT' },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <XPConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('total-xp').textContent).toBe('145')
      expect(screen.getByTestId('xp-log-count').textContent).toBe('3')
      expect(screen.getByTestId('xp-loading').textContent).toBe('false')
    })

    it('computes level from total XP', () => {
      const client = createMockClient({
        StudentXPLog: [
          { id: 'xp1', studentId: 's1', xpAmount: 200, reason: 'HOMEWORK_SUBMITTED' },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <XPConsumer />
        </GamificationProvider>,
      )

      // 200 XP → Level 2 (Explorer threshold is 150)
      expect(screen.getByTestId('level').textContent).toBe('2')
      expect(screen.getByTestId('level-label').textContent).toBe('Explorer')
    })

    it('handles empty XP logs', () => {
      const client = createMockClient({ StudentXPLog: [] })

      render(
        <GamificationProvider client={client} studentId="s1">
          <XPConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('total-xp').textContent).toBe('0')
      expect(screen.getByTestId('level').textContent).toBe('1')
    })
  })

  // ==== Progress ====
  describe('Progress domain', () => {
    it('maps raw modules to ModuleProgress', () => {
      const client = createMockClient({
        StudentProgress: [
          { id: 'p1', studentId: 's1', moduleId: 'mod-1', completionPercent: 75, totalWorkbooks: 4, completedWorkbooks: 3 },
          { id: 'p2', studentId: 's1', moduleId: 'mod-2', completionPercent: 25, totalWorkbooks: 8, completedWorkbooks: 2 },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1" moduleNames={{ 'mod-1': 'Foundations', 'mod-2': 'Advanced' }}>
          <ProgressConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('module-count').textContent).toBe('2')
      expect(screen.getByTestId('progress-loading').textContent).toBe('false')
    })

    it('parses streak data', () => {
      const client = createMockClient({
        StudentStreak: [
          { id: 'str1', studentId: 's1', currentStreak: 5, longestStreak: 10, lastActivityDate: '2026-04-25', freezesRemaining: 1, freezesUsed: 2 },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <ProgressConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('streak').textContent).toBe('5')
    })

    it('handles no streak', () => {
      const client = createMockClient({ StudentStreak: [] })

      render(
        <GamificationProvider client={client} studentId="s1">
          <ProgressConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('streak').textContent).toBe('none')
    })

    it('maps personal bests', () => {
      const client = createMockClient({
        StudentPersonalBest: [
          { id: 'pb1', studentId: 's1', unitID: 'u1', bestScore: 92, achievedAt: '2026-04-20', previousBest: 85 },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <ProgressConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('pb-count').textContent).toBe('1')
    })
  })

  // ==== Campaign ====
  describe('Campaign domain', () => {
    it('parses campaign data', () => {
      const client = createMockClient({
        Campaign: [
          { id: 'c1', cohortId: 'section-1', title: 'Science Quest' },
        ],
        GroupChallenge: [
          { id: 'ch1', cohortId: 'section-1', title: 'Weekly Sprint', targetXP: 1000, currentXP: 600, active: true, bonusMultiplier: 1.5 },
          { id: 'ch2', cohortId: 'section-1', title: 'Past Challenge', targetXP: 500, currentXP: 500, active: false, bonusMultiplier: 1.5 },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1" cohortId="section-1">
          <CampaignConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('campaign-title').textContent).toBe('Science Quest')
      expect(screen.getByTestId('active-challenges').textContent).toBe('1')
      expect(screen.getByTestId('completed-challenges').textContent).toBe('1')
    })

    it('handles no campaign', () => {
      const client = createMockClient({
        Campaign: [],
        GroupChallenge: [],
      })

      render(
        <GamificationProvider client={client} studentId="s1" cohortId="section-1">
          <CampaignConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('campaign-title').textContent).toBe('none')
    })

    it('sets loading false when no cohortId', () => {
      const client = createMockClient({})

      render(
        <GamificationProvider client={client} studentId="s1">
          <CampaignConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('campaign-loading').textContent).toBe('false')
    })
  })

  // ==== Guild ====
  describe('Guild domain', () => {
    it('identifies student guild and membership', () => {
      const client = createMockClient({
        Guild: [
          { id: 'g1', name: 'Alpha', cohortId: 'c1', totalXP: 500 },
          { id: 'g2', name: 'Beta', cohortId: 'c1', totalXP: 300 },
        ],
        GuildMembership: [
          { id: 'm1', guildId: 'g1', studentId: 's1', role: 'LEADER' },
          { id: 'm2', guildId: 'g1', studentId: 's2', role: 'MEMBER' },
          { id: 'm3', guildId: 'g2', studentId: 's3', role: 'MEMBER' },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <GuildConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('my-guild').textContent).toBe('Alpha')
      expect(screen.getByTestId('my-role').textContent).toBe('LEADER')
      expect(screen.getByTestId('leaderboard-count').textContent).toBe('2')
      expect(screen.getByTestId('guild-member-count').textContent).toBe('2')
    })

    it('sorts leaderboard by XP descending', () => {
      const client = createMockClient({
        Guild: [
          { id: 'g1', name: 'Alpha', cohortId: 'c1', totalXP: 200 },
          { id: 'g2', name: 'Beta', cohortId: 'c1', totalXP: 500 },
        ],
        GuildMembership: [],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <GuildConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('my-guild').textContent).toBe('none')
    })
  })

  // ==== SkillTree ====
  describe('SkillTree domain', () => {
    it('merges skills with progress', () => {
      const client = createMockClient({
        Skill: [
          { id: 'sk1', title: 'Basics', prerequisites: '[]', xpReward: 50 },
          { id: 'sk2', title: 'Advanced', prerequisites: '["sk1"]', xpReward: 100 },
        ],
        StudentSkillProgress: [
          { id: 'p1', skillId: 'sk1', studentId: 's1', status: 'MASTERED' },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <SkillTreeConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('skill-count').textContent).toBe('2')
      expect(screen.getByTestId('skill-loading').textContent).toBe('false')
    })

    it('updates selectedSkillId', () => {
      const client = createMockClient({
        Skill: [],
        StudentSkillProgress: [],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <SkillTreeConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('selected-skill').textContent).toBe('none')
      fireEvent.click(screen.getByTestId('select-btn'))
      expect(screen.getByTestId('selected-skill').textContent).toBe('skill-1')
    })
  })

  // ==== ContentLock ====
  describe('ContentLock domain', () => {
    it('evaluates XP-based locks', () => {
      const client = createMockClient({
        StudentXPLog: [
          { id: 'xp1', studentId: 's1', xpAmount: 100, reason: 'HOMEWORK_SUBMITTED' },
        ],
        ContentLock: [
          { id: 'cl1', contentId: 'unit-1', requiredXP: 500 },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <ContentLockConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('lock-count').textContent).toBe('1')
      expect(screen.getByTestId('is-locked-unit1').textContent).toBe('true')
    })

    it('unlocks when XP requirement met', () => {
      const client = createMockClient({
        StudentXPLog: [
          { id: 'xp1', studentId: 's1', xpAmount: 600, reason: 'HOMEWORK_SUBMITTED' },
        ],
        ContentLock: [
          { id: 'cl1', contentId: 'unit-1', requiredXP: 500 },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <ContentLockConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('is-locked-unit1').textContent).toBe('false')
    })
  })

  // ==== Full context ====
  describe('Full context', () => {
    it('provides all domains through useGamification', () => {
      const client = createMockClient({
        StudentXPLog: [
          { id: 'xp1', studentId: 's1', xpAmount: 500, reason: 'HOMEWORK_SUBMITTED' },
        ],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <FullConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('total-xp').textContent).toBe('500')
      expect(screen.getByTestId('level').textContent).toBe('3')
    })

    it('handles null items in subscription data', () => {
      const client = createMockClient({
        StudentXPLog: [
          null,
          { id: 'xp1', studentId: 's1', xpAmount: 50, reason: 'HOMEWORK_SUBMITTED' },
          null,
        ] as any[],
      })

      render(
        <GamificationProvider client={client} studentId="s1">
          <XPConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('xp-log-count').textContent).toBe('1')
      expect(screen.getByTestId('total-xp').textContent).toBe('50')
    })

    it('handles DuplicatedOperationError gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const client = {
        models: {
          StudentXPLog: {
            observeQuery: () => ({
              subscribe: (handlers: any) => {
                handlers.error({ message: 'DuplicatedOperationError' })
                return { unsubscribe: vi.fn() }
              },
            }),
          },
          StudentProgress: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          StudentPersonalBest: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          StudentStreak: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          Campaign: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          GroupChallenge: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          Guild: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          GuildMembership: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          Skill: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          StudentSkillProgress: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
          ContentLock: { observeQuery: () => ({ subscribe: (h: any) => { h.next({ items: [] }); return { unsubscribe: vi.fn() } } }) },
        },
      }

      // Should not throw
      render(
        <GamificationProvider client={client} studentId="s1" cohortId="c1">
          <FullConsumer />
        </GamificationProvider>,
      )

      expect(screen.getByTestId('total-xp').textContent).toBe('0')
      consoleSpy.mockRestore()
    })

    it('cleans up subscriptions on unmount', () => {
      const unsubFns: vi.Mock[] = []
      const makeModel = () => ({
        observeQuery: () => ({
          subscribe: (handlers: any) => {
            handlers.next({ items: [] })
            const unsub = vi.fn()
            unsubFns.push(unsub)
            return { unsubscribe: unsub }
          },
        }),
      })

      const client = {
        models: {
          StudentXPLog: makeModel(),
          StudentProgress: makeModel(),
          StudentPersonalBest: makeModel(),
          StudentStreak: makeModel(),
          Campaign: makeModel(),
          GroupChallenge: makeModel(),
          Guild: makeModel(),
          GuildMembership: makeModel(),
          Skill: makeModel(),
          StudentSkillProgress: makeModel(),
          ContentLock: makeModel(),
        },
      }

      const { unmount } = render(
        <GamificationProvider client={client} studentId="s1" cohortId="c1">
          <FullConsumer />
        </GamificationProvider>,
      )

      unmount()

      // All subscriptions should be unsubscribed
      for (const fn of unsubFns) {
        expect(fn).toHaveBeenCalled()
      }
    })
  })
})

// ============================================================================
// Reducer tests (unit-level)
// ============================================================================

describe('gamificationReducer', () => {
  // Import reducer and action types directly
  it('handles all action types without throwing', async () => {
    const { gamificationReducer, initialState, actionTypes } = await import('../reducers/gamificationReducer')

    const actionTests: Array<{ type: string; payload: any }> = [
      { type: actionTypes.SET_RAW_MODULES, payload: [{ id: '1' }] },
      { type: actionTypes.SET_RAW_PERSONAL_BESTS, payload: [] },
      { type: actionTypes.SET_STREAK, payload: { currentStreak: 5, longestStreak: 10, lastActivityDate: '2026-04-25', freezesRemaining: 1, freezesUsed: 0 } },
      { type: actionTypes.SET_PROGRESS_LOADING, payload: false },
      { type: actionTypes.SET_RAW_CAMPAIGNS, payload: [] },
      { type: actionTypes.SET_RAW_CHALLENGES, payload: [] },
      { type: actionTypes.SET_CAMPAIGNS_LOADING, payload: false },
      { type: actionTypes.SET_CHALLENGES_LOADING, payload: false },
      { type: actionTypes.SET_RAW_GUILDS, payload: [] },
      { type: actionTypes.SET_RAW_MEMBERSHIPS, payload: [] },
      { type: actionTypes.SET_GUILDS_LOADING, payload: false },
      { type: actionTypes.SET_MEMBERSHIPS_LOADING, payload: false },
      { type: actionTypes.SET_RAW_SKILLS, payload: [] },
      { type: actionTypes.SET_RAW_SKILL_PROGRESS, payload: [] },
      { type: actionTypes.SET_SKILLS_LOADING, payload: false },
      { type: actionTypes.SET_SKILL_PROGRESS_LOADING, payload: false },
      { type: actionTypes.SET_SELECTED_SKILL_ID, payload: 'skill-1' },
      { type: actionTypes.SET_RAW_LOCKS, payload: [] },
      { type: actionTypes.SET_LOCKS_LOADING, payload: false },
      { type: actionTypes.SET_XP_LOGS, payload: [] },
      { type: actionTypes.SET_XP_LOADING, payload: false },
    ]

    let state = initialState
    for (const action of actionTests) {
      state = gamificationReducer(state, action)
    }

    // Verify final state has expected values
    expect(state.rawModules).toEqual([{ id: '1' }])
    expect(state.streak?.currentStreak).toBe(5)
    expect(state.selectedSkillId).toBe('skill-1')
    expect(state.progressLoading).toBe(false)
  })

  it('returns same state for unknown action type', async () => {
    const { gamificationReducer, initialState } = await import('../reducers/gamificationReducer')
    const result = gamificationReducer(initialState, { type: 'UNKNOWN' as any })
    expect(result).toBe(initialState)
  })
})
