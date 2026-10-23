import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BossBattleForm, DEFAULT_STAKES } from '../BossBattleForm'

describe('BossBattleForm', () => {
  it('renders all form fields', () => {
    render(<BossBattleForm onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/^bossBattleForm\.titleLabel/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^bossBattleForm\.targetXpLabel/)).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.bonusMultiplierLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.endDateLabel')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.settingLabel')).toBeInTheDocument()
    // Stakes switches
    expect(screen.getByLabelText('bossBattleForm.loseStreakFreeze')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.loseXp')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.loseLevel')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.resetStreak')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.loseBadge')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.loseBadgeByRarity')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.streakMissPenalty')).toBeInTheDocument()
    expect(screen.getByLabelText('bossBattleForm.loseCosmetics')).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<BossBattleForm onSubmit={vi.fn()} />)
    const btn = screen.getByRole('button', { name: 'bossBattleForm.createBattle' })
    expect(btn).toBeDisabled()
  })

  it('submit button is disabled when targetXP is empty', async () => {
    const user = userEvent.setup()
    render(<BossBattleForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/^bossBattleForm\.titleLabel/), 'Dragon')
    
    const btn = screen.getByRole('button', { name: 'bossBattleForm.createBattle' })
    expect(btn).toBeDisabled()
  })

  it('submit button is enabled with valid title and targetXP', async () => {
    const user = userEvent.setup()
    render(<BossBattleForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/^bossBattleForm\.titleLabel/), 'Dragon')
    await user.type(screen.getByLabelText(/^bossBattleForm\.targetXpLabel/), '1000')

    const btn = screen.getByRole('button', { name: 'bossBattleForm.createBattle' })
    expect(btn).not.toBeDisabled()
  })

  it('calls onSubmit with default stakes on form submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BossBattleForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/^bossBattleForm\.titleLabel/), 'The Dragon')
    await user.type(screen.getByLabelText(/^bossBattleForm\.targetXpLabel/), '2000')
    await user.type(screen.getByLabelText('bossBattleForm.settingLabel'), 'A dark cave')

    const btn = screen.getByRole('button', { name: 'bossBattleForm.createBattle' })
    await user.click(btn)

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'The Dragon',
      targetXP: 2000,
      deadline: undefined,
      startDate: undefined,
      bonusMultiplier: 1.5,
      setting: 'A dark cave',
      stakes: JSON.stringify(DEFAULT_STAKES),
    })
  })

  it('toggles stake switches and submits updated stakes', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BossBattleForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/^bossBattleForm\.titleLabel/), 'The Dragon')
    await user.type(screen.getByLabelText(/^bossBattleForm\.targetXpLabel/), '2000')

    // Toggle loseLevel on
    await user.click(screen.getByLabelText('bossBattleForm.loseLevel'))

    const btn = screen.getByRole('button', { name: 'bossBattleForm.createBattle' })
    await user.click(btn)

    const submittedStakes = JSON.parse(onSubmit.mock.calls[0][0].stakes)
    expect(submittedStakes.loseLevel).toBe(true)
    expect(submittedStakes.loseStreakFreeze).toBe(true) // default on
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BossBattleForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/^bossBattleForm\.titleLabel/), 'The Dragon')
    await user.type(screen.getByLabelText(/^bossBattleForm\.targetXpLabel/), '2000')

    const btn = screen.getByRole('button', { name: 'bossBattleForm.createBattle' })
    await user.click(btn)

    expect(screen.getByLabelText(/^bossBattleForm\.titleLabel/)).toHaveValue('')
  })

  it('disables all fields when submitting', () => {
    render(<BossBattleForm onSubmit={vi.fn()} submitting />)

    expect(screen.getByLabelText(/^bossBattleForm\.titleLabel/)).toBeDisabled()
    expect(screen.getByLabelText(/^bossBattleForm\.targetXpLabel/)).toBeDisabled()
    expect(screen.getByLabelText('bossBattleForm.bonusMultiplierLabel')).toBeDisabled()
    expect(screen.getByLabelText('bossBattleForm.endDateLabel')).toBeDisabled()
    expect(screen.getByLabelText('bossBattleForm.settingLabel')).toBeDisabled()
    expect(screen.getByLabelText('bossBattleForm.loseStreakFreeze')).toBeDisabled()
  })

  it('shows "Creating..." text on button when submitting', () => {
    render(<BossBattleForm onSubmit={vi.fn()} submitting />)
    expect(screen.getByRole('button', { name: 'bossBattleForm.creating' })).toBeInTheDocument()
  })

  it('bonus multiplier defaults to 1.5', () => {
    render(<BossBattleForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('bossBattleForm.bonusMultiplierLabel')).toHaveValue(1.5)
  })

  it('loseStreakFreeze is on by default', () => {
    render(<BossBattleForm onSubmit={vi.fn()} />)
    const toggle = screen.getByLabelText('bossBattleForm.loseStreakFreeze')
    expect(toggle).toBeChecked()
  })
})
