/**
 * Tests for GroupChallengeCard, SquadCrest, SquadLeaderboard components
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

import { GroupChallengeCard } from '../GroupChallengeCard'
import { SquadCrest } from '../SquadCrest'
import { SquadLeaderboard } from '../SquadLeaderboard'

// ============================================================================
// GroupChallengeCard
// ============================================================================

describe('GroupChallengeCard', () => {
  it('renders challenge title and progress', () => {
    render(
      <GroupChallengeCard
        title="Weekly Sprint"
        targetXP={1000}
        currentXP={600}
        active={true}
      />,
    )
    expect(screen.getByText('Weekly Sprint')).toBeDefined()
    expect(screen.getByText('600 / 1,000 XP')).toBeDefined()
    expect(screen.getByText('60%')).toBeDefined()
  })

  it('shows "Goal Reached!" chip when target met', () => {
    render(
      <GroupChallengeCard
        title="Finish Line"
        targetXP={500}
        currentXP={500}
        active={false}
      />,
    )
    expect(screen.getByText('Goal Reached!')).toBeDefined()
  })

  it('shows bonus multiplier chip', () => {
    render(
      <GroupChallengeCard
        title="Challenge"
        targetXP={100}
        currentXP={50}
        active={true}
        bonusMultiplier={2}
      />,
    )
    expect(screen.getByText('2× bonus')).toBeDefined()
  })

  it('shows deadline info', () => {
    const future = new Date(Date.now() + 2 * 86400000).toISOString()
    render(
      <GroupChallengeCard
        title="Timed Challenge"
        targetXP={100}
        currentXP={0}
        active={true}
        deadline={future}
      />,
    )
    // Should show days remaining
    const text = screen.getByText(/\dd.*left/)
    expect(text).toBeDefined()
  })

  it('handles 0 targetXP without division error', () => {
    render(
      <GroupChallengeCard
        title="Empty Challenge"
        targetXP={0}
        currentXP={0}
        active={true}
      />,
    )
    expect(screen.getByText('0%')).toBeDefined()
  })
})

// ============================================================================
// SquadCrest
// ============================================================================

describe('SquadCrest', () => {
  it('renders squad initials', () => {
    render(<SquadCrest squadId="g1" squadName="Alpha Squad" />)
    expect(screen.getByText('AS')).toBeDefined()
  })

  it('renders squad name when showName is true', () => {
    render(<SquadCrest squadId="g1" squadName="Beta Team" showName />)
    expect(screen.getByText('Beta Team')).toBeDefined()
  })

  it('hides squad name when showName is false', () => {
    render(<SquadCrest squadId="g1" squadName="Beta Team" showName={false} />)
    expect(screen.queryByText('Beta Team')).toBeNull()
  })

  it('shows XP when provided', () => {
    render(<SquadCrest squadId="g1" squadName="Test" totalXP={1500} />)
    expect(screen.getByText('1,500 XP')).toBeDefined()
  })

  it('generates single initial for single-word name', () => {
    render(<SquadCrest squadId="g1" squadName="Phoenix" />)
    expect(screen.getByText('P')).toBeDefined()
  })
})

// ============================================================================
// SquadLeaderboard
// ============================================================================

describe('SquadLeaderboard', () => {
  const squads = [
    { id: 'g1', name: 'Alpha', totalXP: 500, memberCount: 3 },
    { id: 'g2', name: 'Beta', totalXP: 300, memberCount: 4 },
    { id: 'g3', name: 'Gamma', totalXP: 100, memberCount: 2 },
  ]

  it('renders all squads', () => {
    render(<SquadLeaderboard squads={squads} />)
    expect(screen.getByText('Alpha')).toBeDefined()
    expect(screen.getByText('Beta')).toBeDefined()
    expect(screen.getByText('Gamma')).toBeDefined()
  })

  it('shows empty state', () => {
    render(<SquadLeaderboard squads={[]} />)
    expect(screen.getByText('No squads yet.')).toBeDefined()
  })

  it('highlights student squad with "My Squad" chip', () => {
    render(<SquadLeaderboard squads={squads} mySquadId="g2" />)
    expect(screen.getByText('My Squad')).toBeDefined()
  })

  it('shows member count text', () => {
    render(<SquadLeaderboard squads={squads} />)
    expect(screen.getByText(/3 members/)).toBeDefined()
    expect(screen.getByText(/4 members/)).toBeDefined()
  })

  it('shows rank emojis for top 3', () => {
    render(<SquadLeaderboard squads={squads} />)
    expect(screen.getByText('🥇')).toBeDefined()
    expect(screen.getByText('🥈')).toBeDefined()
    expect(screen.getByText('🥉')).toBeDefined()
  })
})
