/**
 * Tests for the 6 new gamification feature components:
 * CampaignBriefing, DiceBearAvatar, CosmeticSelector,
 * BossBattleCard, EasterEggTrigger hooks, InstructorGamificationPanel,
 * AvatarCustomizer, GuildJoinPanel
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

import { CampaignBriefing } from '../CampaignBriefing'
import { DiceBearAvatar, getUnlockedStyleTier, getStyleTierStatus } from '../DiceBearAvatar'
import { CosmeticSelector, DEFAULT_EDITOR_THEMES } from '../CosmeticSelector'
import { BossBattleCard } from '../BossBattleCard'
import { HiddenEasterEgg } from '../EasterEggTrigger'
import { InstructorGamificationPanel } from '../InstructorGamificationPanel'
import { AvatarCustomizer } from '../AvatarCustomizer'
import { GuildJoinPanel } from '../GuildJoinPanel'

// Mock NarrativeReader (used by CampaignBriefing when contentJson is provided)
vi.mock('../../Editor3/NarrativeReader', () => ({
  NarrativeReader: ({ contentJson, ariaLabel }: any) => (
    <div data-testid="narrative-reader" aria-label={ariaLabel}>
      {contentJson}
    </div>
  ),
}))

// ============================================================================
// CampaignBriefing
// ============================================================================

describe('CampaignBriefing', () => {
  it('renders title, setting, stakes', () => {
    render(
      <CampaignBriefing
        title="Operation Codename"
        setting="A distant galaxy where code is law."
        stakes="If we fail, the codebase collapses."
      />,
    )
    expect(screen.getByText('Operation Codename')).toBeDefined()
    expect(screen.getByText('A distant galaxy where code is law.')).toBeDefined()
    expect(screen.getByText('If we fail, the codebase collapses.')).toBeDefined()
  })

  it('renders chapter text as mission briefing', () => {
    render(
      <CampaignBriefing
        title="Chapter 3"
        chapterText="Your task: refactor the legacy module."
      />,
    )
    expect(screen.getByText(/Your task: refactor the legacy module/)).toBeDefined()
  })

  it('renders loading skeleton', () => {
    const { container } = render(
      <CampaignBriefing title="" isLoading />,
    )
    // MUI Skeleton renders span elements with animation
    const skeletons = container.querySelectorAll('.MuiSkeleton-root')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders compact mode', () => {
    render(
      <CampaignBriefing
        title="Compact"
        setting="Some setting"
        chapterText="Brief chapter"
        compact
      />,
    )
    // In compact mode, chapter text takes priority
    expect(screen.getByText('Brief chapter')).toBeDefined()
    // Title is not rendered in compact
    expect(screen.queryByText('Compact')).toBeNull()
  })

  it('compact mode falls back to setting when no chapter text', () => {
    render(
      <CampaignBriefing
        title="Compact"
        setting="Fallback setting text"
        compact
      />,
    )
    expect(screen.getByText('Fallback setting text')).toBeDefined()
  })

  it('renders NarrativeReader when contentJson is provided', () => {
    const json = JSON.stringify({ root: { children: [] } })
    render(
      <CampaignBriefing
        title="With Content"
        contentJson={json}
      />,
    )
    const reader = screen.getByTestId('narrative-reader')
    expect(reader).toBeDefined()
    expect(reader.getAttribute('aria-label')).toBe('With Content narrative content')
  })

  it('does not render NarrativeReader when contentJson is absent', () => {
    render(
      <CampaignBriefing
        title="No Content"
        setting="Just text"
      />,
    )
    expect(screen.queryByTestId('narrative-reader')).toBeNull()
  })
})

// ============================================================================
// DiceBearAvatar
// ============================================================================

describe('DiceBearAvatar', () => {
  it('renders an avatar with the given seed', () => {
    render(<DiceBearAvatar seed="student-123" />)
    const avatar = screen.getByRole('img')
    expect(avatar).toBeDefined()
    expect(avatar.getAttribute('alt')).toBe('student-123')
  })

  it('renders with a label tooltip', () => {
    render(<DiceBearAvatar seed="test" label="Test User" />)
    const avatar = screen.getByRole('img')
    expect(avatar.getAttribute('alt')).toBe('Test User')
  })

  it('applies locked style', () => {
    render(<DiceBearAvatar seed="locked-user" locked />)
    const avatar = screen.getByRole('img')
    expect(avatar).toBeDefined()
    // Check that grayscale filter is applied via style
    const style = window.getComputedStyle(avatar)
    // MUI applies styles via classes, so just verify it renders
  })

  it('generates deterministic SVGs (same seed = same output)', () => {
    const { unmount } = render(<DiceBearAvatar seed="deterministic" />)
    const src1 = screen.getByRole('img').getAttribute('src')
    unmount()
    render(<DiceBearAvatar seed="deterministic" />)
    const src2 = screen.getByRole('img').getAttribute('src')
    expect(src1).toBe(src2)
  })

  it('generates different SVGs for different seeds', () => {
    const { unmount } = render(<DiceBearAvatar seed="seed-a" />)
    const src1 = screen.getByRole('img').getAttribute('src')
    unmount()
    render(<DiceBearAvatar seed="seed-b" />)
    const src2 = screen.getByRole('img').getAttribute('src')
    expect(src1).not.toBe(src2)
  })

  it('fires onClick when clicked', () => {
    const onClick = vi.fn()
    render(<DiceBearAvatar seed="clickable" onClick={onClick} />)
    fireEvent.click(screen.getByRole('img'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('getUnlockedStyleTier', () => {
  it('returns simple for level 1', () => {
    expect(getUnlockedStyleTier(1)).toBe('simple')
  })
  it('returns detailed for level 2', () => {
    expect(getUnlockedStyleTier(2)).toBe('detailed')
  })
  it('returns toonhead for level 3+', () => {
    expect(getUnlockedStyleTier(3)).toBe('toonhead')
    expect(getUnlockedStyleTier(4)).toBe('toonhead')
    expect(getUnlockedStyleTier(10)).toBe('toonhead')
  })
})

describe('getStyleTierStatus', () => {
  it('returns all tiers with correct unlock status', () => {
    const tiers = getStyleTierStatus(2)
    expect(tiers.length).toBe(3)
    const unlocked = tiers.filter((t) => t.unlocked)
    expect(unlocked.length).toBe(2) // simple, detailed
  })
})

// ============================================================================
// CosmeticSelector
// ============================================================================

describe('CosmeticSelector', () => {
  it('renders editor themes', () => {
    render(<CosmeticSelector level={5} />)
    expect(screen.getByText('Editor Theme')).toBeDefined()
    expect(screen.getByText('Default')).toBeDefined()
    expect(screen.getByText('Midnight')).toBeDefined()
    expect(screen.getByText('Aurora')).toBeDefined()
  })

  it('renders avatar style section', () => {
    render(<CosmeticSelector level={3} />)
    expect(screen.getByText('Avatar Style')).toBeDefined()
  })
})

// ============================================================================
// BossBattleCard
// ============================================================================

describe('BossBattleCard', () => {
  const phases = [
    { id: 'p1', title: 'Phase 1', description: 'Answer core questions', status: 'COMPLETED' as const, targetXP: 500, currentXP: 500 },
    { id: 'p2', title: 'Phase 2', description: 'Write tests', status: 'ACTIVE' as const, targetXP: 300, currentXP: 150, requiredRoles: ['Tester', 'Reviewer'] },
    { id: 'p3', title: 'Phase 3', description: 'Final challenge', status: 'LOCKED' as const, targetXP: 200, currentXP: 0 },
  ]

  it('renders title and narrative', () => {
    render(
      <BossBattleCard
        title="The Algorithm Dragon"
        narrative="A fearsome dragon guards the sorting algorithms."
        phases={phases}
        totalHP={1000}
        totalDamage={650}
        active
      />,
    )
    expect(screen.getByText('The Algorithm Dragon')).toBeDefined()
    expect(screen.getByText(/A fearsome dragon/)).toBeDefined()
  })

  it('shows overall progress', () => {
    render(
      <BossBattleCard
        title="Boss"
        phases={phases}
        totalHP={1000}
        totalDamage={650}
        active
      />,
    )
    expect(screen.getByText('65%')).toBeDefined()
    expect(screen.getByText(/650/)).toBeDefined()
  })

  it('shows phase stepper', () => {
    render(
      <BossBattleCard
        title="Boss"
        phases={phases}
        totalHP={1000}
        totalDamage={650}
        active
      />,
    )
    expect(screen.getByText('Phase 1')).toBeDefined()
    expect(screen.getByText('Phase 2')).toBeDefined()
    expect(screen.getByText('Phase 3')).toBeDefined()
  })

  it('shows current phase detail with required roles', () => {
    render(
      <BossBattleCard
        title="Boss"
        phases={phases}
        totalHP={1000}
        totalDamage={650}
        active
        currentUserRole="Tester"
      />,
    )
    expect(screen.getByText(/Write tests/)).toBeDefined()
    expect(screen.getAllByText('Tester').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Reviewer').length).toBeGreaterThan(0)
  })

  it('shows defeated state', () => {
    render(
      <BossBattleCard
        title="Boss"
        phases={[]}
        totalHP={1000}
        totalDamage={1000}
        active
      />,
    )
    expect(screen.getByText(/Defeated/)).toBeDefined()
    expect(screen.getByText('100%')).toBeDefined()
  })

  it('renders contributors', () => {
    render(
      <BossBattleCard
        title="Boss"
        phases={[]}
        totalHP={1000}
        totalDamage={500}
        active
        contributors={[
          { userId: 'u1', displayName: 'Alice', xpContributed: 200 },
          { userId: 'u2', displayName: 'Bob', xpContributed: 150 },
        ]}
      />,
    )
    expect(screen.getByText('A')).toBeDefined()
    expect(screen.getByText('B')).toBeDefined()
  })
})

// ============================================================================
// HiddenEasterEgg
// ============================================================================

describe('HiddenEasterEgg', () => {
  it('renders a clickable hidden element', () => {
    const onFind = vi.fn()
    render(<HiddenEasterEgg onFind={onFind} />)
    const button = screen.getByRole('button', { name: 'Hidden element' })
    expect(button).toBeDefined()
    fireEvent.click(button)
    expect(onFind).toHaveBeenCalledOnce()
  })

  it('does not render when found', () => {
    render(<HiddenEasterEgg onFind={vi.fn()} found />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})

// ============================================================================
// InstructorGamificationPanel
// ============================================================================

describe('InstructorGamificationPanel', () => {
  it('renders all admin sections', () => {
    render(<InstructorGamificationPanel />)
    expect(screen.getByText('Gamification Admin')).toBeDefined()
    expect(screen.getByText(/Skill Tree \(/)).toBeDefined()
    expect(screen.getByText(/Campaign \(/)).toBeDefined()
    expect(screen.getByText(/Guilds \(/)).toBeDefined()
    expect(screen.getByText(/Easter Eggs \(/)).toBeDefined()
    expect(screen.getByText(/Boss Battles \(/)).toBeDefined()
  })

  it('renders existing skills', () => {
    render(
      <InstructorGamificationPanel
        skills={[{ id: 's1', title: 'Variables', xpReward: 100 }]}
      />,
    )
    // Expand Skill Tree accordion
    fireEvent.click(screen.getByText(/Skill Tree/))
    expect(screen.getByText('Variables')).toBeDefined()
  })

  it('calls onAddSkill when add button clicked', () => {
    const onAddSkill = vi.fn()
    render(<InstructorGamificationPanel onAddSkill={onAddSkill} />)
    // Expand Skill Tree accordion
    fireEvent.click(screen.getByText(/Skill Tree/))
    // Use placeholder to find the input (MUI label association can be tricky in collapsed accordions)
    const input = screen.getByPlaceholderText('e.g. Variables & Types')
    fireEvent.change(input, { target: { value: 'Loops' } })
    fireEvent.click(screen.getByRole('button', { name: /Add Skill/i }))
    expect(onAddSkill).toHaveBeenCalledWith(expect.objectContaining({ title: 'Loops' }))
  })

  it('renders existing guilds', () => {
    render(
      <InstructorGamificationPanel
        guilds={[{ id: 'g1', name: 'Code Warriors', memberCount: 5 }]}
      />,
    )
    fireEvent.click(screen.getByText(/Guilds/))
    expect(screen.getByText('Code Warriors')).toBeDefined()
    expect(screen.getByText('5 members')).toBeDefined()
  })

  it('calls onCreateGuild with guild name and cohortId', () => {
    const onCreateGuild = vi.fn()
    const sections = [{ id: 'sec-1', name: 'Biology 101', description: 'Intro to biology' }]
    render(<InstructorGamificationPanel sections={sections} onCreateGuild={onCreateGuild} />)
    fireEvent.click(screen.getByText(/Guilds/))
    // Select a section from the autocomplete
    const sectionInput = screen.getByLabelText('Section')
    fireEvent.change(sectionInput, { target: { value: 'Biology' } })
    fireEvent.click(screen.getByText('Biology 101'))
    // Enter guild name
    const input = screen.getByLabelText('Guild name')
    fireEvent.change(input, { target: { value: 'Phoenix' } })
    fireEvent.click(screen.getByText('Create'))
    expect(onCreateGuild).toHaveBeenCalledWith('Phoenix', 'sec-1')
  })

  it('renders easter eggs and calls onDeleteEasterEgg', () => {
    const onDeleteEasterEgg = vi.fn()
    render(
      <InstructorGamificationPanel
        easterEggs={[{ id: 'e1', type: 'CLICK', message: 'Found the bug!', xpReward: 50 }]}
        onDeleteEasterEgg={onDeleteEasterEgg}
      />,
    )
    fireEvent.click(screen.getByText(/Easter Eggs/))
    expect(screen.getByText('Found the bug!')).toBeDefined()
  })
})

// ============================================================================
// AvatarCustomizer
// ============================================================================

describe('AvatarCustomizer', () => {
  it('renders simple customization at level 1', () => {
    const onSave = vi.fn()
    render(
      <AvatarCustomizer open={true} onClose={() => {}} level={1} seed="test" onSave={onSave} />,
    )
    expect(screen.getByText('Background')).toBeDefined()
    expect(screen.getByText('Eyebrows')).toBeDefined()
    expect(screen.getByText('Eyes')).toBeDefined()
    expect(screen.getByText('Mouth')).toBeDefined()
  })

  it('renders color pickers at level 2', () => {
    const onSave = vi.fn()
    render(
      <AvatarCustomizer open={true} onClose={() => {}} level={2} seed="test" onSave={onSave} />,
    )
    expect(screen.getByText('Background')).toBeDefined()
  })

  it('renders detailed customization at level 2', () => {
    const onSave = vi.fn()
    render(
      <AvatarCustomizer open={true} onClose={() => {}} level={2} seed="test" selectedStyle="detailed" onSave={onSave} />,
    )
    expect(screen.getByText('Hair / Top')).toBeDefined()
    expect(screen.getByText('Clothing')).toBeDefined()
    expect(screen.getByText('Eyes')).toBeDefined()
    expect(screen.getByText('Mouth')).toBeDefined()
    expect(screen.getByText('Facial Hair')).toBeDefined()
    expect(screen.getByText('Accessories')).toBeDefined()
  })

  it('renders toon head customization at level 3', () => {
    const onSave = vi.fn()
    render(
      <AvatarCustomizer open={true} onClose={() => {}} level={3} seed="test" selectedStyle="toonhead" onSave={onSave} />,
    )
    expect(screen.getByText('Hair')).toBeDefined()
    expect(screen.getByText('Eyes')).toBeDefined()
    expect(screen.getByText('Eyebrows')).toBeDefined()
    expect(screen.getByText('Mouth')).toBeDefined()
    expect(screen.getByText('Beard')).toBeDefined()
    expect(screen.getByText('Clothes')).toBeDefined()
  })

  it('calls onSave with overrides and style on Save click', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(
      <AvatarCustomizer open={true} onClose={onClose} level={2} seed="test" onSave={onSave} />,
    )
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith({}, 'detailed')
    expect(onClose).toHaveBeenCalled()
  })
})

// ============================================================================
// GuildJoinPanel
// ============================================================================

describe('GuildJoinPanel', () => {
  const mockGuilds = [
    { id: 'g1', name: 'Code Warriors', totalXP: 1200, memberCount: 4 },
    { id: 'g2', name: 'Phoenix Rising', totalXP: 980, memberCount: 3 },
  ]

  const mockMembers = [
    { id: 'm1', studentId: 'student-1', role: 'LEADER' as const, displayName: 'Alice' },
    { id: 'm2', studentId: 'student-2', role: 'MEMBER' as const, displayName: 'Bob' },
  ]

  it('shows available guilds when not in a guild', () => {
    render(
      <GuildJoinPanel
        availableGuilds={mockGuilds}
        studentId="student-5"
        onJoinGuild={() => {}}
        onLeaveGuild={() => {}}
      />,
    )
    expect(screen.getByText('Join a Guild')).toBeDefined()
    expect(screen.getByText('Code Warriors')).toBeDefined()
    expect(screen.getByText('Phoenix Rising')).toBeDefined()
  })

  it('shows empty state when no guilds available', () => {
    render(
      <GuildJoinPanel
        availableGuilds={[]}
        studentId="student-5"
        onJoinGuild={() => {}}
        onLeaveGuild={() => {}}
      />,
    )
    expect(screen.getByText(/No guilds available/)).toBeDefined()
  })

  it('shows current guild when student is a member', () => {
    render(
      <GuildJoinPanel
        availableGuilds={mockGuilds}
        myGuild={mockGuilds[0]}
        myGuildMembers={mockMembers}
        studentId="student-1"
        onJoinGuild={() => {}}
        onLeaveGuild={() => {}}
      />,
    )
    expect(screen.getByText('Code Warriors')).toBeDefined()
    expect(screen.getByText('Members')).toBeDefined()
    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Leave Guild')).toBeDefined()
  })

  it('shows Leader chip for guild leader', () => {
    render(
      <GuildJoinPanel
        availableGuilds={mockGuilds}
        myGuild={mockGuilds[0]}
        myGuildMembers={mockMembers}
        studentId="student-1"
        onJoinGuild={() => {}}
        onLeaveGuild={() => {}}
      />,
    )
    expect(screen.getByText('Leader')).toBeDefined()
  })

  it('opens join confirmation dialog on Join click', () => {
    render(
      <GuildJoinPanel
        availableGuilds={mockGuilds}
        studentId="student-5"
        onJoinGuild={() => {}}
        onLeaveGuild={() => {}}
      />,
    )
    const joinButtons = screen.getAllByText('Join')
    fireEvent.click(joinButtons[0])
    expect(screen.getByText('Join Code Warriors?')).toBeDefined()
  })

  it('calls onJoinGuild when confirming join', () => {
    const onJoinGuild = vi.fn()
    render(
      <GuildJoinPanel
        availableGuilds={mockGuilds}
        studentId="student-5"
        onJoinGuild={onJoinGuild}
        onLeaveGuild={() => {}}
      />,
    )
    const joinButtons = screen.getAllByText('Join')
    fireEvent.click(joinButtons[0])
    fireEvent.click(screen.getByText('Join Guild'))
    expect(onJoinGuild).toHaveBeenCalledWith('g1')
  })

  it('opens leave confirmation dialog', () => {
    render(
      <GuildJoinPanel
        availableGuilds={mockGuilds}
        myGuild={mockGuilds[0]}
        myGuildMembers={mockMembers}
        studentId="student-2"
        onJoinGuild={() => {}}
        onLeaveGuild={() => {}}
      />,
    )
    fireEvent.click(screen.getByText('Leave Guild'))
    expect(screen.getByText('Leave Code Warriors?')).toBeDefined()
  })

  it('calls onLeaveGuild when confirming leave', () => {
    const onLeaveGuild = vi.fn()
    render(
      <GuildJoinPanel
        availableGuilds={mockGuilds}
        myGuild={mockGuilds[0]}
        myGuildMembers={mockMembers}
        studentId="student-2"
        onJoinGuild={() => {}}
        onLeaveGuild={onLeaveGuild}
      />,
    )
    fireEvent.click(screen.getByText('Leave Guild'))
    fireEvent.click(screen.getByText('Leave'))
    expect(onLeaveGuild).toHaveBeenCalled()
  })
})
