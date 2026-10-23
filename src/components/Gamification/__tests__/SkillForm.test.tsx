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

    expect(screen.getByLabelText(/skillForm\.titleLabel/)).toBeInTheDocument()
    expect(screen.getByLabelText(/skillForm\.descriptionLabel/)).toBeInTheDocument()
    expect(screen.getByLabelText(/skillForm\.xpRewardLabel/)).toBeInTheDocument()
    expect(screen.getByLabelText(/skillForm\.minAccuracyLabel/)).toBeInTheDocument()
    expect(screen.getByLabelText(/skillForm\.requiredUnitsLabel/)).toBeInTheDocument()
    expect(screen.getByLabelText(/skillForm\.prerequisitesLabel/)).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<SkillForm onSubmit={vi.fn()} />)
    const btn = screen.getByRole('button', { name: 'skillForm.addSkill' })
    expect(btn).toBeDisabled()
  })

  it('submit button is enabled with valid title', async () => {
    const user = userEvent.setup()
    render(<SkillForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/skillForm\.titleLabel/), 'New Skill')

    const btn = screen.getByRole('button', { name: 'skillForm.addSkill' })
    expect(btn).not.toBeDisabled()
  })

  it('calls onSubmit with correct data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SkillForm onSubmit={onSubmit} availableUnits={mockUnits} availableSkills={mockSkills} />)

    await user.type(screen.getByLabelText(/skillForm\.titleLabel/), 'Async Mastery')
    await user.type(screen.getByLabelText(/skillForm\.descriptionLabel/), 'Master async patterns')

    // Clear default XP and set new value
    const xpInput = screen.getByLabelText(/skillForm\.xpRewardLabel/)
    await user.clear(xpInput)
    await user.type(xpInput, '100')

    const btn = screen.getByRole('button', { name: 'skillForm.addSkill' })
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

    await user.type(screen.getByLabelText(/skillForm\.titleLabel/), 'Test Skill')

    const btn = screen.getByRole('button', { name: 'skillForm.addSkill' })
    await user.click(btn)

    expect(screen.getByLabelText(/skillForm\.titleLabel/)).toHaveValue('')
  })

  it('disables fields when submitting', () => {
    render(<SkillForm onSubmit={vi.fn()} submitting />)
    expect(screen.getByLabelText(/skillForm\.titleLabel/)).toBeDisabled()
    expect(screen.getByLabelText(/skillForm\.descriptionLabel/)).toBeDisabled()
    expect(screen.getByLabelText(/skillForm\.xpRewardLabel/)).toBeDisabled()
  })

  it('shows Generate button when onGenerateFromUnit is provided', () => {
    render(
      <SkillForm
        onSubmit={vi.fn()}
        onGenerateFromUnit={vi.fn()}
        availableUnits={mockUnits}
      />
    )
    expect(screen.getByRole('button', { name: 'skillForm.generate' })).toBeInTheDocument()
  })

  it('does not show Generate button when onGenerateFromUnit is not provided', () => {
    render(<SkillForm onSubmit={vi.fn()} availableUnits={mockUnits} />)
    expect(screen.queryByRole('button', { name: 'skillForm.generate' })).not.toBeInTheDocument()
  })

  it('default minimum accuracy is 70', () => {
    render(<SkillForm onSubmit={vi.fn()} />)
    expect(screen.getByText('skillForm.minAccuracy')).toBeInTheDocument()
  })

  it('shows "Adding..." when submitting', () => {
    render(<SkillForm onSubmit={vi.fn()} submitting />)
    expect(screen.getByRole('button', { name: 'skillForm.adding' })).toBeInTheDocument()
  })
})
