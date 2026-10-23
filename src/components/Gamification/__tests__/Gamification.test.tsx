/**
 * Gamification Component Tests
 *
 * Tests for NailedItBadge, NailedItCelebration, XPToast,
 * HomeworkXPSummary, and NailedItWall render output.
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

// Mock canvas-confetti (not installed — dynamic import in NailedItCelebration)
vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

import { NailedItBadge } from '../NailedItBadge'
import { NailedItCelebration } from '../NailedItCelebration'
import { XPToast } from '../XPToast'
import { HomeworkXPSummary } from '../HomeworkXPSummary'
import { NailedItWall } from '../NailedItWall'

describe('NailedItBadge', () => {
  it('renders Nailed It label', () => {
    render(<NailedItBadge />)
    expect(screen.getByText('nailedItBadge.label')).toBeDefined()
  })

  it('renders with small size by default', () => {
    const { container } = render(<NailedItBadge />)
    const chip = container.querySelector('.MuiChip-sizeSmall')
    expect(chip).not.toBeNull()
  })

  it('accepts medium size', () => {
    const { container } = render(<NailedItBadge size="medium" />)
    const chip = container.querySelector('.MuiChip-sizeMedium')
    expect(chip).not.toBeNull()
  })
})

describe('NailedItCelebration', () => {
  it('renders dialog when open', () => {
    render(
      <NailedItCelebration
        open={true}
        nailedItReason="Great explanation!"
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('nailedItCelebration.title')).toBeDefined()
    expect(screen.getByText('Great explanation!')).toBeDefined()
    expect(screen.getByText('nailedItCelebration.xpReward')).toBeDefined()
    expect(screen.getByText('nailedItCelebration.keepGoing')).toBeDefined()
  })

  it('does not render when closed', () => {
    render(
      <NailedItCelebration
        open={false}
        nailedItReason="Reason"
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText('nailedItCelebration.title')).toBeNull()
  })

  it('calls onClose when Keep Going is clicked', () => {
    const onClose = vi.fn()
    render(
      <NailedItCelebration
        open={true}
        nailedItReason="Reason"
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByText('nailedItCelebration.keepGoing'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('XPToast', () => {
  it('renders XP notification when open', () => {
    render(
      <XPToast
        open={true}
        xpAmount={50}
        xpReason="Block completed"
        onClose={vi.fn()}
      />,
    )
    expect(screen.getAllByText(
        withValues('xpToast.message', { xpAmount: 50, xpReason: 'Block completed' }),
      ).length).toBeGreaterThan(0)
  })

  it('does not render when closed', () => {
    render(
      <XPToast
        open={false}
        xpAmount={50}
        xpReason="Block completed"
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText(/^xpToast\.message/)).toBeNull()
  })
})

describe('HomeworkXPSummary', () => {
  const defaultProps = {
    lineItems: [
      { label: 'Homework Submitted', xp: 50 },
      { label: 'All Blocks Done', xp: 75 },
      { label: '2 Nailed It Blocks', xp: 40 },
    ],
    totalXP: 165,
    cumulativeXP: 500,
  }

  it('renders homework complete title', () => {
    render(<HomeworkXPSummary {...defaultProps} />)
    expect(screen.getByText('homeworkXPSummary.title')).toBeDefined()
  })

  it('renders all line items', () => {
    render(<HomeworkXPSummary {...defaultProps} />)
    expect(screen.getByText('Homework Submitted')).toBeDefined()
    expect(screen.getByText('All Blocks Done')).toBeDefined()
    expect(screen.getByText('2 Nailed It Blocks')).toBeDefined()
    expect(
      screen.getByText(withValues('homeworkXPSummary.lineItemXp', { xp: 50 })),
    ).toBeDefined()
    expect(
      screen.getByText(withValues('homeworkXPSummary.lineItemXp', { xp: 75 })),
    ).toBeDefined()
    expect(
      screen.getByText(withValues('homeworkXPSummary.lineItemXp', { xp: 40 })),
    ).toBeDefined()
  })

  it('renders total XP', () => {
    render(<HomeworkXPSummary {...defaultProps} />)
    expect(screen.getByText(withValues('homeworkXPSummary.total', { totalXP: 165 }))).toBeDefined()
  })

  it('renders level progress bar', () => {
    const { container } = render(<HomeworkXPSummary {...defaultProps} />)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).not.toBeNull()
  })
})

describe('NailedItWall', () => {
  const blocks = [
    {
      id: '1',
      question: 'What is photosynthesis?',
      nailedItReason: 'Clear explanation with great examples',
      homeworkTitle: 'Biology HW3',
      createdAt: '2025-06-01T12:00:00Z',
    },
    {
      id: '2',
      question: 'Explain cell division',
      nailedItReason: 'Excellent diagram analysis',
      homeworkTitle: 'Biology HW5',
      createdAt: '2025-06-10T14:00:00Z',
    },
  ]

  it('renders all nailed-it blocks', () => {
    render(<NailedItWall blocks={blocks} />)
    expect(screen.getByText('What is photosynthesis?')).toBeDefined()
    expect(screen.getByText('Explain cell division')).toBeDefined()
  })

  it('renders reason text', () => {
    render(<NailedItWall blocks={blocks} />)
    expect(
      screen.getByText('Clear explanation with great examples'),
    ).toBeDefined()
  })

  it('renders homework title and date', () => {
    render(<NailedItWall blocks={blocks} />)
    expect(
      screen.getByText(
        withValues('nailedItWall.meta', {
          homeworkTitle: 'Biology HW3',
          date: new Date('2025-06-01T12:00:00Z').toLocaleDateString(),
        }),
      ),
    ).toBeDefined()
  })

  it('renders empty state when no blocks', () => {
    render(<NailedItWall blocks={[]} />)
    expect(screen.getByText('nailedItWall.emptyTitle')).toBeDefined()
  })
})
