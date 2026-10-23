/**
 * Tests for new gamification expansion components:
 * ProgressRings, PersonalBestBanner, StreakShield, ContentLockCard, EasterEggToast,
 * AnimatedXPCounter, RankChangeToast, BadgeCoinFlip
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// File-local next-intl mock (overrides test/setup.ts): appends interpolation
// values as JSON so assertions can verify both the message key and its data.
vi.mock('next-intl', () => {
  const format = (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key
  const createT = () => {
    const t = (key: string, values?: Record<string, unknown>) => format(key, values)
    t.rich = (key: string, values?: Record<string, unknown>) => format(key, values)
    t.markup = (key: string, values?: Record<string, unknown>) => format(key, values)
    t.raw = (key: string) => key
    t.has = () => true
    return t
  }
  return {
    useTranslations: () => createT(),
    useLocale: () => 'en',
    useMessages: () => ({}),
    useFormatter: () => ({
      number: (n: number) => String(n),
      dateTime: (d: Date) => d.toISOString(),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  }
})

/** Text matcher for `key {"name":value,...}` output that checks a subset of the values. */
const withValues =
  (key: string, expected: Record<string, unknown>) => (content: string) => {
    if (!content.startsWith(`${key} `)) return false
    try {
      const values = JSON.parse(content.slice(key.length + 1))
      return Object.entries(expected).every(([k, v]) => values[k] === v)
    } catch {
      return false
    }
  }

import { ProgressRings } from '../ProgressRings'
import { PersonalBestBanner } from '../PersonalBestBanner'
import { StreakShield } from '../StreakShield'
import { ContentLockCard } from '../ContentLockCard'
import { EasterEggToast } from '../EasterEggToast'
import { AnimatedXPCounter } from '../AnimatedXPCounter'
import { RankChangeToast } from '../RankChangeToast'
import { BadgeCoinFlip } from '../BadgeCoinFlip'

// ============================================================================
// ProgressRings
// ============================================================================

describe('ProgressRings', () => {
  const modules = [
    { moduleId: 'm1', moduleName: 'Foundations', completionPercent: 75, totalWorkbooks: 4, completedWorkbooks: 3 },
    { moduleId: 'm2', moduleName: 'Advanced', completionPercent: 25, totalWorkbooks: 8, completedWorkbooks: 2 },
    { moduleId: 'm3', moduleName: 'Projects', completionPercent: 100, totalWorkbooks: 3, completedWorkbooks: 3 },
  ]

  it('renders progress rings for each module', () => {
    render(<ProgressRings modules={modules} />)
    expect(screen.getByText('Foundations')).toBeDefined()
    expect(screen.getByText('Advanced')).toBeDefined()
    expect(screen.getByText('Projects')).toBeDefined()
  })

  it('shows percentage text', () => {
    render(<ProgressRings modules={modules} />)
    expect(screen.getByText('75%')).toBeDefined()
    expect(screen.getByText('25%')).toBeDefined()
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('shows empty state when no modules', () => {
    render(<ProgressRings modules={[]} />)
    expect(screen.getByText('progressRings.empty')).toBeDefined()
  })
})

// ============================================================================
// PersonalBestBanner
// ============================================================================

describe('PersonalBestBanner', () => {
  it('renders when open with improvement', () => {
    render(
      <PersonalBestBanner
        open={true}
        newScore={92}
        previousBest={85}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('personalBestBanner.title')).toBeDefined()
    expect(screen.getByText(
        withValues('personalBestBanner.scoreImproved', { score: 92, improvement: 7 }),
      )).toBeDefined()
  })

  it('renders first attempt message when no previous best', () => {
    render(
      <PersonalBestBanner
        open={true}
        newScore={80}
        previousBest={null}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(withValues('personalBestBanner.scoreFirst', { score: 80 }))).toBeDefined()
  })

  it('calls onClose when dismissed', () => {
    const onClose = vi.fn()
    render(
      <PersonalBestBanner
        open={true}
        newScore={90}
        previousBest={80}
        onClose={onClose}
      />,
    )
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })
})

// ============================================================================
// StreakShield
// ============================================================================

describe('StreakShield', () => {
  it('renders freeze count', () => {
    render(<StreakShield freezesRemaining={3} />)
    expect(screen.getByText('3')).toBeDefined()
  })

  it('renders nothing when no freezes ever', () => {
    const { container } = render(<StreakShield freezesRemaining={0} freezesUsed={0} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders with used freezes even if remaining is 0', () => {
    render(<StreakShield freezesRemaining={0} freezesUsed={2} />)
    expect(screen.getByText('0')).toBeDefined()
  })
})

// ============================================================================
// ContentLockCard
// ============================================================================

describe('ContentLockCard', () => {
  it('renders children when unlocked', () => {
    render(
      <ContentLockCard title="Bonus Content" isLocked={false}>
        <div>Unlocked Content</div>
      </ContentLockCard>,
    )
    expect(screen.getByText('Unlocked Content')).toBeDefined()
  })

  it('renders lock state with XP requirement', () => {
    render(
      <ContentLockCard
        title="Advanced Module"
        isLocked={true}
        requiredXP={500}
        currentXP={200}
      />,
    )
    expect(screen.getByText('Advanced Module')).toBeDefined()
    expect(screen.getByText(
        withValues('contentLockCard.xpProgress', { currentXP: 200, requiredXP: 500 }),
      )).toBeDefined()
    // 200 / 500 XP => 40% progress
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40')
  })

  it('renders badge requirement', () => {
    render(
      <ContentLockCard
        title="Expert Content"
        isLocked={true}
        requiredBadge="Sharpshooter"
      />,
    )
    expect(screen.getByText(withValues('contentLockCard.requiresBadge', { badge: 'Sharpshooter' }))).toBeDefined()
  })

  it('renders module completion requirement', () => {
    render(
      <ContentLockCard
        title="Final Project"
        isLocked={true}
        requiredCompletion={75}
        currentCompletion={50}
      />,
    )
    expect(screen.getByText(
        withValues('contentLockCard.moduleProgress', {
          currentCompletion: 50,
          requiredCompletion: 75,
        }),
      )).toBeDefined()
    // 50% of a 75% requirement => 67% progress
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('67')
  })
})

// ============================================================================
// EasterEggToast
// ============================================================================

describe('EasterEggToast', () => {
  it('renders message and XP reward when open', () => {
    render(
      <EasterEggToast
        open={true}
        message="You found the hidden treasure!"
        xpReward={30}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(
        withValues('easterEggToast.message', {
          message: 'You found the hidden treasure!',
          xpReward: 30,
        }),
      )).toBeDefined()
  })
})

// ============================================================================
// AnimatedXPCounter
// ============================================================================

describe('AnimatedXPCounter', () => {
  it('renders the target value', () => {
    render(<AnimatedXPCounter targetValue={500} />)
    expect(screen.getByText('500 XP')).toBeDefined()
  })

  it('renders zero', () => {
    render(<AnimatedXPCounter targetValue={0} />)
    expect(screen.getByText('0 XP')).toBeDefined()
  })
})

// ============================================================================
// RankChangeToast
// ============================================================================

describe('RankChangeToast', () => {
  it('renders upward movement', () => {
    render(
      <RankChangeToast
        open={true}
        positionsChanged={3}
        newRank={5}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/\+3 positions on leaderboard! Now #5/)).toBeDefined()
  })

  it('renders downward movement', () => {
    render(
      <RankChangeToast
        open={true}
        positionsChanged={-2}
        newRank={8}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/Dropped 2 positions/)).toBeDefined()
  })
})

// ============================================================================
// BadgeCoinFlip
// ============================================================================

describe('BadgeCoinFlip', () => {
  it('renders badge info when open', () => {
    render(
      <BadgeCoinFlip
        open={true}
        badgeEmoji="🎯"
        badgeName="Sharpshooter"
        badgeDescription="Scored 90%+ three times"
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('badgeCoinFlip.title')).toBeDefined()
    expect(screen.getByText('Sharpshooter')).toBeDefined()
    expect(screen.getByText('Scored 90%+ three times')).toBeDefined()
  })

  it('calls onClose when button clicked', () => {
    const onClose = vi.fn()
    render(
      <BadgeCoinFlip
        open={true}
        badgeEmoji="🏆"
        badgeName="Top of Class"
        badgeDescription="Reached #1"
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByText('badgeCoinFlip.closeButton'))
    expect(onClose).toHaveBeenCalled()
  })
})
