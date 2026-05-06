import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SkillForm, UnitOption, SkillOption } from '../SkillForm'

const mockUnits: UnitOption[] = [
  { id: 'u1', name: 'Intro to Variables' },
  { id: 'u2', name: 'Functions & Scope' },
  { id: 'u3', name: 'Async Programming' },
]

const mockSkills: SkillOption[] = [
  { id: 's1', title: 'Variables & Types' },
  { id: 's2', title: 'Control Flow' },
]

describe('SkillForm', () => {
  it('renders all form fields', () => {
    render(<SkillForm onSubmit={vi.fn()} availableUnits={mockUnits} availableSkills={mockSkills} />)

    expect(screen.getByLabelText(/Skill Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/XP Reward/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Minimum accuracy/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Required Units/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prerequisites/i)).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<SkillForm onSubmit={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /Add Skill/i })
    expect(btn).toBeDisabled()
  })

  it('submit button is enabled with valid title', async () => {
    const user = userEvent.setup()
    render(<SkillForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/Skill Title/i), 'New Skill')

    const btn = screen.getByRole('button', { name: /Add Skill/i })
    expect(btn).not.toBeDisabled()
  })

  it('calls onSubmit with correct data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SkillForm onSubmit={onSubmit} availableUnits={mockUnits} availableSkills={mockSkills} />)

    await user.type(screen.getByLabelText(/Skill Title/i), 'Async Mastery')
    await user.type(screen.getByLabelText(/Description/i), 'Master async patterns')

    // Clear default XP and set new value
    const xpInput = screen.getByLabelText(/XP Reward/i)
    await user.clear(xpInput)
    await user.type(xpInput, '100')

    const btn = screen.getByRole('button', { name: /Add Skill/i })
    await user.click(btn)

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Async Mastery',
        description: 'Master async patterns',
        xpReward: 100,
        minimumAccuracy: 70,
        unitIds: [],
        prerequisites: [],
      })
    )
  })

  it('resets form after submission', async () => {
    const user = userEvent.setup()
    render(<SkillForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/Skill Title/i), 'Test Skill')

    const btn = screen.getByRole('button', { name: /Add Skill/i })
    await user.click(btn)

    expect(screen.getByLabelText(/Skill Title/i)).toHaveValue('')
  })

  it('disables fields when submitting', () => {
    render(<SkillForm onSubmit={vi.fn()} submitting />)
    expect(screen.getByLabelText(/Skill Title/i)).toBeDisabled()
    expect(screen.getByLabelText(/Description/i)).toBeDisabled()
    expect(screen.getByLabelText(/XP Reward/i)).toBeDisabled()
  })

  it('shows Generate button when onGenerateFromUnit is provided', () => {
    render(
      <SkillForm
        onSubmit={vi.fn()}
        onGenerateFromUnit={vi.fn()}
        availableUnits={mockUnits}
      />
    )
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument()
  })

  it('does not show Generate button when onGenerateFromUnit is not provided', () => {
    render(<SkillForm onSubmit={vi.fn()} availableUnits={mockUnits} />)
    expect(screen.queryByRole('button', { name: /Generate/i })).not.toBeInTheDocument()
  })

  it('default minimum accuracy is 70', () => {
    render(<SkillForm onSubmit={vi.fn()} />)
    expect(screen.getByText(/Min Accuracy: 70%/i)).toBeInTheDocument()
  })

  it('shows "Adding..." when submitting', () => {
    render(<SkillForm onSubmit={vi.fn()} submitting />)
    expect(screen.getByRole('button', { name: /Adding/i })).toBeInTheDocument()
  })
})
