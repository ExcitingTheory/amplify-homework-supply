import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, within } from 'storybook/test'
import { fn } from 'storybook/test'
import { SkillForm } from './SkillForm'

const mockUnits = [
  { id: 'u1', name: 'Intro to Variables' },
  { id: 'u2', name: 'Functions & Scope' },
  { id: 'u3', name: 'Async Programming' },
  { id: 'u4', name: 'Error Handling' },
  { id: 'u5', name: 'Data Structures' },
]

const mockSkills = [
  { id: 's1', title: 'Variables & Types' },
  { id: 's2', title: 'Control Flow' },
  { id: 's3', title: 'Functions' },
]

const meta: Meta<typeof SkillForm> = {
  title: '🏆 Gamification/Instructor/Skill Form',
  component: SkillForm,
  args: {
    onSubmit: fn(),
    onGenerateFromUnit: fn(),
    availableUnits: mockUnits,
    availableSkills: mockSkills,
  },
}
export default meta

type Story = StoryObj<typeof SkillForm>

/** Default empty form with all options available */
export const Default: Story = {}

/** Without Generate from Unit (no AI generation available) */
export const WithoutGenerate: Story = {
  args: {
    onGenerateFromUnit: undefined,
  },
}

/** No units or skills available (empty section) */
export const EmptySection: Story = {
  args: {
    availableUnits: [],
    availableSkills: [],
    onGenerateFromUnit: undefined,
  },
}

/** Submitting state */
export const Submitting: Story = {
  args: {
    submitting: true,
  },
}

/** Interaction: create a skill with units and prerequisites */
export const CreateSkillWithUnits: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Fill title
    await userEvent.type(canvas.getByLabelText(/Skill Title/i), 'Async Mastery')

    // Fill description
    await userEvent.type(canvas.getByLabelText(/Description/i), 'Master all async patterns')

    // Submit
    const btn = canvas.getByRole('button', { name: /Add Skill/i })
    await expect(btn).not.toBeDisabled()
    await userEvent.click(btn)

    await expect(args.onSubmit).toHaveBeenCalled()
  },
}
