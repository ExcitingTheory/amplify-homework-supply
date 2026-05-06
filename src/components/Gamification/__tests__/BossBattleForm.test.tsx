import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BossBattleForm, DEFAULT_STAKES } from '../BossBattleForm'

describe('BossBattleForm', () => {
  it('renders all form fields', () => {
    render(<BossBattleForm onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Target XP/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Bonus Multiplier/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Deadline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Narrative Setting/i)).toBeInTheDocument()
    // Stakes switches
    expect(screen.getByLabelText(/Lose a streak freeze/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Lose XP points/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Lose a level/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Reset streak to zero/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Lose most recent badge/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Lose a badge by rarity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Missed streaks cost XP/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Scramble cosmetics/i)).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<BossBattleForm onSubmit={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /Create Boss Battle/i })
    expect(btn).toBeDisabled()
  })

  it('submit button is disabled when targetXP is empty', async () => {
    const user = userEvent.setup()
    render(<BossBattleForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/Title/i), 'Dragon')
    
    const btn = screen.getByRole('button', { name: /Create Boss Battle/i })
    expect(btn).toBeDisabled()
  })

  it('submit button is enabled with valid title and targetXP', async () => {
    const user = userEvent.setup()
    render(<BossBattleForm onSubmit={vi.fn()} />)

    await user.type(screen.getByLabelText(/Title/i), 'Dragon')
    await user.type(screen.getByLabelText(/Target XP/i), '1000')

    const btn = screen.getByRole('button', { name: /Create Boss Battle/i })
    expect(btn).not.toBeDisabled()
  })

  it('calls onSubmit with default stakes on form submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BossBattleForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/Title/i), 'The Dragon')
    await user.type(screen.getByLabelText(/Target XP/i), '2000')
    await user.type(screen.getByLabelText(/Narrative Setting/i), 'A dark cave')

    const btn = screen.getByRole('button', { name: /Create Boss Battle/i })
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

    await user.type(screen.getByLabelText(/Title/i), 'The Dragon')
    await user.type(screen.getByLabelText(/Target XP/i), '2000')

    // Toggle loseLevel on
    await user.click(screen.getByLabelText(/Lose a level/i))

    const btn = screen.getByRole('button', { name: /Create Boss Battle/i })
    await user.click(btn)

    const submittedStakes = JSON.parse(onSubmit.mock.calls[0][0].stakes)
    expect(submittedStakes.loseLevel).toBe(true)
    expect(submittedStakes.loseStreakFreeze).toBe(true) // default on
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BossBattleForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/Title/i), 'The Dragon')
    await user.type(screen.getByLabelText(/Target XP/i), '2000')

    const btn = screen.getByRole('button', { name: /Create Boss Battle/i })
    await user.click(btn)

    expect(screen.getByLabelText(/Title/i)).toHaveValue('')
  })

  it('disables all fields when submitting', () => {
    render(<BossBattleForm onSubmit={vi.fn()} submitting />)

    expect(screen.getByLabelText(/Title/i)).toBeDisabled()
    expect(screen.getByLabelText(/Target XP/i)).toBeDisabled()
    expect(screen.getByLabelText(/Bonus Multiplier/i)).toBeDisabled()
    expect(screen.getByLabelText(/Deadline/i)).toBeDisabled()
    expect(screen.getByLabelText(/Narrative Setting/i)).toBeDisabled()
    expect(screen.getByLabelText(/Lose a streak freeze/i)).toBeDisabled()
  })

  it('shows "Creating..." text on button when submitting', () => {
    render(<BossBattleForm onSubmit={vi.fn()} submitting />)
    expect(screen.getByRole('button', { name: /Creating/i })).toBeInTheDocument()
  })

  it('bonus multiplier defaults to 1.5', () => {
    render(<BossBattleForm onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/Bonus Multiplier/i)).toHaveValue(1.5)
  })

  it('loseStreakFreeze is on by default', () => {
    render(<BossBattleForm onSubmit={vi.fn()} />)
    const toggle = screen.getByLabelText(/Lose a streak freeze/i)
    expect(toggle).toBeChecked()
  })
})
