/**
 * Tests for GamificationToastLayer component
 *
 * This component detects new XP log entries and shows corresponding
 * toast notifications (rank changes, badge awards, easter eggs, content unlocks).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import { GamificationToastLayer } from '../GamificationToastLayer'

// Mock the context hooks
const mockXPLogs: any[] = []
const mockLocks: any[] = []

vi.mock('../../../context/gamificationContext', () => ({
  useXP: () => ({
    totalXP: 100,
    level: { level: 1, label: 'Beginner', xpRequired: 0, xpForNextLevel: 150, progress: 66 },
    xpLogs: [...mockXPLogs], // spread to create new reference so useEffect fires on rerender
    isLoading: false,
  }),
  useContentLock: () => ({
    locks: [...mockLocks],
    isLocked: () => false,
    getLockStatus: () => undefined,
    isLoading: false,
  }),
}))

describe('GamificationToastLayer', () => {
  beforeEach(() => {
    mockXPLogs.length = 0
    mockLocks.length = 0
  })

  it('renders without crashing when no events', () => {
    const { container } = render(<GamificationToastLayer />)
    // Should render the sub-components (all closed)
    expect(container).toBeDefined()
  })

  it('renders RankChangeToast, BadgeCoinFlip, EasterEggToast, ContentUnlockAnimation children', () => {
    render(<GamificationToastLayer />)
    // All toast sub-components are rendered but closed (open=false)
    // They shouldn't show visible text when closed
    expect(screen.queryByText(/positions on leaderboard/)).toBeNull()
    expect(screen.queryByText(/Secret Unlocked/)).toBeNull()
  })

  it('detects easter egg XP log entry and shows toast', () => {
    // Start with 0 logs
    const { rerender } = render(<GamificationToastLayer />)

    // Add an easter egg log entry
    act(() => {
      mockXPLogs.push({
        xpReason: 'EASTER_EGG',
        description: 'Found the hidden gem!',
        xpAmount: 25,
      })
    })

    rerender(<GamificationToastLayer />)
    // The easter egg toast should now show
    expect(screen.getByText(/Secret Unlocked/)).toBeDefined()
    expect(screen.getByText(/Found the hidden gem/)).toBeDefined()
  })

  it('detects badge awarded log and shows coin flip', () => {
    const { rerender } = render(<GamificationToastLayer />)

    act(() => {
      mockXPLogs.push({
        xpReason: 'BADGE_AWARDED',
        metadata: { badgeType: 'FIRST_SUBMISSION' },
        xpAmount: 0,
      })
    })

    rerender(<GamificationToastLayer />)
    // Badge coin flip dialog should open
    expect(screen.getByText('First Steps')).toBeDefined()
  })

  it('detects rank change and shows rank toast', () => {
    const { rerender } = render(<GamificationToastLayer />)

    act(() => {
      mockXPLogs.push({
        xpReason: 'RANK_CHANGE',
        metadata: { positionsChanged: 3, newRank: 2 },
        xpAmount: 0,
      })
    })

    rerender(<GamificationToastLayer />)
    expect(screen.getByText(/\+3 positions on leaderboard/)).toBeDefined()
  })

  it('handles unknown badge type gracefully', () => {
    const { rerender } = render(<GamificationToastLayer />)

    act(() => {
      mockXPLogs.push({
        xpReason: 'BADGE_AWARDED',
        metadata: { badgeType: 'UNKNOWN_TYPE' },
        xpAmount: 0,
      })
    })

    rerender(<GamificationToastLayer />)
    // Should use fallback badge info
    expect(screen.getByText('Badge')).toBeDefined()
  })
})
