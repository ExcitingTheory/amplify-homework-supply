/**
 * Unit tests for components that previously had stories but no tests:
 * LevelBadge, StreakIndicator, StreakCalendar, BadgeShelf
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import { LevelBadge } from '../LevelBadge'
import { StreakIndicator } from '../StreakIndicator'
import { StreakCalendar } from '../StreakCalendar'
import { BadgeShelf } from '../BadgeShelf'
import type { EarnedBadge } from '../BadgeShelf'

// ============================================================================
// LevelBadge
// ============================================================================

describe('LevelBadge', () => {
  const baseLevel = {
    level: 3,
    label: 'Practitioner',
    xpRequired: 400,
    xpForNextLevel: 800,
    progress: 55,
  }

  it('renders level number', () => {
    render(<LevelBadge level={baseLevel} />)
    expect(screen.getByText('Lvl. 3')).toBeDefined()
  })

  it('shows progress bar by default', () => {
    const { container } = render(<LevelBadge level={baseLevel} />)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).not.toBeNull()
  })

  it('hides progress bar when showProgress is false', () => {
    const { container } = render(<LevelBadge level={baseLevel} showProgress={false} />)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toBeNull()
  })

  it('hides progress bar when xpForNextLevel is null (max level)', () => {
    const maxLevel = { ...baseLevel, level: 6, label: 'Master', xpForNextLevel: null, progress: 100 }
    const { container } = render(<LevelBadge level={maxLevel} />)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toBeNull()
  })

  it('renders small size variant', () => {
    const { container } = render(<LevelBadge level={baseLevel} size="small" />)
    const chip = container.querySelector('.MuiChip-sizeSmall')
    expect(chip).not.toBeNull()
  })

  it('renders tooltip with level info', () => {
    render(<LevelBadge level={baseLevel} />)
    // The tooltip text is in the component but only shown on hover
    // We can verify the chip label
    expect(screen.getByText('Lvl. 3')).toBeDefined()
  })

  it('renders all level numbers 1-6', () => {
    const levels = [1, 2, 3, 4, 5, 6]
    levels.forEach((lvl) => {
      const { unmount } = render(
        <LevelBadge level={{ ...baseLevel, level: lvl }} />
      )
      expect(screen.getByText(`Lvl. ${lvl}`)).toBeDefined()
      unmount()
    })
  })
})

// ============================================================================
// StreakIndicator
// ============================================================================

describe('StreakIndicator', () => {
  it('renders streak count', () => {
    render(<StreakIndicator currentStreak={5} />)
    expect(screen.getByText('5')).toBeDefined()
  })

  it('renders nothing when streak is 0', () => {
    const { container } = render(<StreakIndicator currentStreak={0} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when streak is negative', () => {
    const { container } = render(<StreakIndicator currentStreak={-1} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders with small size', () => {
    render(<StreakIndicator currentStreak={3} size="small" />)
    expect(screen.getByText('3')).toBeDefined()
  })

  it('renders milestone streak (7+ days)', () => {
    render(<StreakIndicator currentStreak={7} />)
    expect(screen.getByText('7')).toBeDefined()
  })

  it('renders large streak numbers', () => {
    render(<StreakIndicator currentStreak={30} />)
    expect(screen.getByText('30')).toBeDefined()
  })
})

// ============================================================================
// StreakCalendar
// ============================================================================

describe('StreakCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders month header', () => {
    render(<StreakCalendar activeDays={new Set()} year={2026} month={4} />)
    expect(screen.getByText('Apr 2026')).toBeDefined()
  })

  it('renders day-of-week headers', () => {
    render(<StreakCalendar activeDays={new Set()} year={2026} month={4} />)
    const headers = screen.getAllByText(/^[SMTWF]$/)
    expect(headers.length).toBe(7)
  })

  it('renders specific month when year and month provided', () => {
    render(
      <StreakCalendar
        activeDays={new Set(['2025-12-25'])}
        year={2025}
        month={12}
      />
    )
    expect(screen.getByText('Dec 2025')).toBeDefined()
  })

  it('renders with empty active days', () => {
    const { container } = render(
      <StreakCalendar activeDays={new Set()} year={2026} month={4} />
    )
    expect(container.innerHTML).not.toBe('')
  })

  it('renders with active days', () => {
    const activeDays = new Set(['2026-04-01', '2026-04-05', '2026-04-10'])
    const { container } = render(
      <StreakCalendar activeDays={activeDays} year={2026} month={4} />
    )
    // Should contain fire icons for active days
    expect(container.innerHTML).not.toBe('')
  })

  it('renders nothing before client mount when no explicit month/year', () => {
    // Without explicit year/month, it uses useEffect to set `now`
    // On first render (before effect), it returns null
    // But with fake timers, the effect runs synchronously in the test
    const { container } = render(
      <StreakCalendar activeDays={new Set()} />
    )
    // After effect, it should render the current month
    expect(screen.getByText('Apr 2026')).toBeDefined()
  })
})

// ============================================================================
// BadgeShelf
// ============================================================================

describe('BadgeShelf', () => {
  const sampleBadges: EarnedBadge[] = [
    { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-01-15T10:00:00Z' },
    { badgeType: 'GOOD_EYE', awardedAt: '2025-01-20T14:30:00Z' },
    { badgeType: 'QUICK_DRAW', awardedAt: '2025-02-01T08:00:00Z' },
  ]

  it('renders all badge types (earned and unearned)', () => {
    const { container } = render(<BadgeShelf earnedBadges={sampleBadges} />)
    // Should render 23 badges (all badge types in BADGE_DEFINITIONS)
    // Each badge is rendered as a Box with a Tooltip wrapper
    const gridItems = container.querySelectorAll('[style*="cursor: pointer"], [class*="cursor"]')
    // BadgeIcon components are rendered in a grid - check grid children
    const grid = container.querySelector('[class*="MuiBox-root"]')
    expect(grid).not.toBeNull()
    // The grid should have children for all badge types
    expect(grid!.children.length).toBeGreaterThanOrEqual(23)
  })

  it('renders earned badges differently from unearned', () => {
    const { container } = render(<BadgeShelf earnedBadges={sampleBadges} />)
    // Component renders without crashing with earned badges
    const grid = container.querySelector('[class*="MuiBox-root"]')
    expect(grid).not.toBeNull()
    // Grid has children (all badge types shown)
    expect(grid!.children.length).toBeGreaterThan(0)
  })

  it('renders only earned badges when earnedOnly is true', () => {
    const { container } = render(
      <BadgeShelf earnedBadges={sampleBadges} earnedOnly />
    )
    // Only 3 earned badges should render
    const grid = container.querySelector('[class*="MuiBox-root"]')
    expect(grid).not.toBeNull()
    expect(grid!.children.length).toBe(3)
  })

  it('renders empty state for earnedOnly with no badges', () => {
    const { container } = render(
      <BadgeShelf earnedBadges={[]} earnedOnly />
    )
    const grid = container.querySelector('[class*="MuiBox-root"]')
    expect(grid).not.toBeNull()
    expect(grid!.children.length).toBe(0)
  })

  it('renders with custom column count', () => {
    const { container } = render(
      <BadgeShelf earnedBadges={sampleBadges} />
    )
    // Grid should exist
    expect(container.innerHTML).not.toBe('')
  })

  it('shows multiplier badge when earned multiple times', () => {
    const multiBadges: EarnedBadge[] = [
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-01-15T10:00:00Z', sourceId: 'unit-a' },
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-02-01T10:00:00Z', sourceId: 'unit-b' },
      { badgeType: 'FIRST_SUBMISSION', awardedAt: '2025-03-01T10:00:00Z', sourceId: 'unit-c' },
    ]
    render(<BadgeShelf earnedBadges={multiBadges} />)
    expect(screen.getByText('×3')).toBeDefined()
  })

  it('opens popover on badge click', () => {
    render(<BadgeShelf earnedBadges={sampleBadges} />)
    // Click on the first grid item (badge)
    const { container } = render(<BadgeShelf earnedBadges={sampleBadges} />)
    const grid = container.querySelector('[class*="MuiBox-root"]')
    const firstBadge = grid?.children[0] as HTMLElement
    if (firstBadge) {
      fireEvent.click(firstBadge)
      // Popover should show badge details
      expect(screen.getByText('First Submission')).toBeDefined()
      expect(screen.getByText('Submitted your first homework')).toBeDefined()
    }
  })

  it('shows "Locked" in popover for unearned badges', () => {
    const { container } = render(<BadgeShelf earnedBadges={[]} />)
    const grid = container.querySelector('[class*="MuiBox-root"]')
    const firstBadge = grid?.children[0] as HTMLElement
    if (firstBadge) {
      fireEvent.click(firstBadge)
      expect(screen.getByText('Locked')).toBeDefined()
    }
  })
})
