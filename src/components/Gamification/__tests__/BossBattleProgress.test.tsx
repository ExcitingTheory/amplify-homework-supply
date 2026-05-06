import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BossBattleProgress, Contributor } from '../BossBattleProgress'

const baseProps = {
  id: 'boss-1',
  title: 'The Algorithm Dragon',
  currentXP: 500,
  targetXP: 1000,
  active: true,
}

describe('BossBattleProgress', () => {
  it('renders title', () => {
    render(<BossBattleProgress {...baseProps} />)
    expect(screen.getByText('The Algorithm Dragon')).toBeInTheDocument()
  })

  it('renders progress percentage', () => {
    render(<BossBattleProgress {...baseProps} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders XP counts', () => {
    render(<BossBattleProgress {...baseProps} />)
    expect(screen.getByText('500 / 1,000 XP')).toBeInTheDocument()
  })

  it('shows Active chip when active', () => {
    render(<BossBattleProgress {...baseProps} active={true} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows Inactive chip when not active', () => {
    render(<BossBattleProgress {...baseProps} active={false} />)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('shows Complete! chip when currentXP >= targetXP', () => {
    render(<BossBattleProgress {...baseProps} currentXP={1000} targetXP={1000} />)
    expect(screen.getByText('Complete!')).toBeInTheDocument()
  })

  it('shows bonus multiplier chip', () => {
    render(<BossBattleProgress {...baseProps} bonusMultiplier={2.0} />)
    expect(screen.getByText('×2')).toBeInTheDocument()
  })

  it('does not show multiplier chip when multiplier is 1', () => {
    render(<BossBattleProgress {...baseProps} bonusMultiplier={1} />)
    expect(screen.queryByText(/×1/)).not.toBeInTheDocument()
  })

  it('shows narrative setting in italics', () => {
    render(<BossBattleProgress {...baseProps} setting="A dark forest" />)
    expect(screen.getByText('A dark forest')).toBeInTheDocument()
  })

  it('shows stakes text', () => {
    render(<BossBattleProgress {...baseProps} stakes="Everyone loses a freeze" />)
    expect(screen.getByText(/Everyone loses a freeze/)).toBeInTheDocument()
  })

  it('shows deadline countdown for future date', () => {
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    render(<BossBattleProgress {...baseProps} deadline={futureDate} />)
    expect(screen.getByText(/remaining/)).toBeInTheDocument()
  })

  it('shows expired for past deadline', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString()
    render(<BossBattleProgress {...baseProps} deadline={pastDate} />)
    expect(screen.getByText(/Deadline passed/)).toBeInTheDocument()
  })

  it('shows top contributors', () => {
    const contributors: Contributor[] = [
      { studentId: 's1', displayName: 'Alice', xpContributed: 200 },
      { studentId: 's2', displayName: 'Bob', xpContributed: 150 },
    ]
    render(<BossBattleProgress {...baseProps} contributors={contributors} />)
    expect(screen.getByText('Top Contributors')).toBeInTheDocument()
    expect(screen.getByText(/Alice \(200 XP\)/)).toBeInTheDocument()
    expect(screen.getByText(/Bob \(150 XP\)/)).toBeInTheDocument()
  })

  it('limits contributors to top 5', () => {
    const contributors: Contributor[] = Array.from({ length: 8 }, (_, i) => ({
      studentId: `s${i}`,
      displayName: `Student${i}`,
      xpContributed: 100 - i * 10,
    }))
    render(<BossBattleProgress {...baseProps} contributors={contributors} />)
    // Should only show 5
    expect(screen.queryByText(/Student5/)).not.toBeInTheDocument()
    expect(screen.getByText(/Student0/)).toBeInTheDocument()
    expect(screen.getByText(/Student4/)).toBeInTheDocument()
  })

  it('calls onToggleActive with correct args', async () => {
    const user = userEvent.setup()
    const onToggleActive = vi.fn()
    render(<BossBattleProgress {...baseProps} onToggleActive={onToggleActive} />)

    const pauseBtn = screen.getByLabelText('Pause battle')
    await user.click(pauseBtn)

    expect(onToggleActive).toHaveBeenCalledWith('boss-1', false)
  })

  it('calls onDelete with correct id', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<BossBattleProgress {...baseProps} onDelete={onDelete} />)

    const deleteBtn = screen.getByLabelText('Delete battle')
    await user.click(deleteBtn)

    expect(onDelete).toHaveBeenCalledWith('boss-1')
  })

  it('shows play icon when inactive', () => {
    render(<BossBattleProgress {...baseProps} active={false} />)
    expect(screen.getByLabelText('Activate battle')).toBeInTheDocument()
  })

  it('caps progress at 100% visually', () => {
    render(<BossBattleProgress {...baseProps} currentXP={1500} targetXP={1000} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
