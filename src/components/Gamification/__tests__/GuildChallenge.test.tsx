/**
 * Tests for GroupChallengeCard, GuildCrest, GuildLeaderboard components
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

import { GroupChallengeCard } from '../GroupChallengeCard'
import { GuildCrest } from '../GuildCrest'
import { GuildLeaderboard } from '../GuildLeaderboard'

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
// GuildCrest
// ============================================================================

describe('GuildCrest', () => {
  it('renders guild initials', () => {
    render(<GuildCrest guildId="g1" guildName="Alpha Squad" />)
    expect(screen.getByText('AS')).toBeDefined()
  })

  it('renders guild name when showName is true', () => {
    render(<GuildCrest guildId="g1" guildName="Beta Team" showName />)
    expect(screen.getByText('Beta Team')).toBeDefined()
  })

  it('hides guild name when showName is false', () => {
    render(<GuildCrest guildId="g1" guildName="Beta Team" showName={false} />)
    expect(screen.queryByText('Beta Team')).toBeNull()
  })

  it('shows XP when provided', () => {
    render(<GuildCrest guildId="g1" guildName="Test" totalXP={1500} />)
    expect(screen.getByText('1,500 XP')).toBeDefined()
  })

  it('generates single initial for single-word name', () => {
    render(<GuildCrest guildId="g1" guildName="Phoenix" />)
    expect(screen.getByText('P')).toBeDefined()
  })
})

// ============================================================================
// GuildLeaderboard
// ============================================================================

describe('GuildLeaderboard', () => {
  const guilds = [
    { id: 'g1', name: 'Alpha', totalXP: 500, memberCount: 3 },
    { id: 'g2', name: 'Beta', totalXP: 300, memberCount: 4 },
    { id: 'g3', name: 'Gamma', totalXP: 100, memberCount: 2 },
  ]

  it('renders all guilds', () => {
    render(<GuildLeaderboard guilds={guilds} />)
    expect(screen.getByText('Alpha')).toBeDefined()
    expect(screen.getByText('Beta')).toBeDefined()
    expect(screen.getByText('Gamma')).toBeDefined()
  })

  it('shows empty state', () => {
    render(<GuildLeaderboard guilds={[]} />)
    expect(screen.getByText('No guilds yet.')).toBeDefined()
  })

  it('highlights student guild with "My Guild" chip', () => {
    render(<GuildLeaderboard guilds={guilds} myGuildId="g2" />)
    expect(screen.getByText('My Guild')).toBeDefined()
  })

  it('shows member count text', () => {
    render(<GuildLeaderboard guilds={guilds} />)
    expect(screen.getByText(/3 members/)).toBeDefined()
    expect(screen.getByText(/4 members/)).toBeDefined()
  })

  it('shows rank emojis for top 3', () => {
    render(<GuildLeaderboard guilds={guilds} />)
    expect(screen.getByText('🥇')).toBeDefined()
    expect(screen.getByText('🥈')).toBeDefined()
    expect(screen.getByText('🥉')).toBeDefined()
  })
})
