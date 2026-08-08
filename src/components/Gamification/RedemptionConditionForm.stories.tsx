import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn, expect, userEvent, within } from 'storybook/test'
import { RedemptionConditionForm } from './RedemptionConditionForm'
import type { RedemptionCondition } from './antiBadgeRegistry'

const meta: Meta<typeof RedemptionConditionForm> = {
  title: '🏆 Gamification/Instructor/Redemption Condition Form',
  component: RedemptionConditionForm,
}
export default meta

type Story = StoryObj<typeof RedemptionConditionForm>

export const Empty: Story = {
  render: () => {
    const [condition, setCondition] = useState<RedemptionCondition | null>(null)
    return <RedemptionConditionForm value={condition} onChange={setCondition} />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Initially no count field shown
    expect(canvas.queryByLabelText('Count')).toBeNull()

    // Open the select and pick a condition type
    const select = canvas.getByRole('combobox')
    await userEvent.click(select)
    const loginStreakOption = await within(document.body).findByText('Login Streak')
    await userEvent.click(loginStreakOption)

    // Count field should now appear with default value
    const countInput = await canvas.findByLabelText('Count')
    expect(countInput).toBeInTheDocument()
    expect((countInput as HTMLInputElement).value).toBe('3')

    // Change count
    await userEvent.tripleClick(countInput)
    await userEvent.type(countInput, '7')
    expect(Number((countInput as HTMLInputElement).value)).toBeGreaterThanOrEqual(1)
  },
}

export const Prefilled: Story = {
  render: () => {
    const [condition, setCondition] = useState<RedemptionCondition | null>({
      type: 'CONSECUTIVE_ON_TIME',
      count: 3,
    })
    return <RedemptionConditionForm value={condition} onChange={setCondition} />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Pre-filled count is visible
    const countInput = await canvas.findByLabelText('Count')
    expect((countInput as HTMLInputElement).value).toBe('3')

    // Change count
    await userEvent.tripleClick(countInput)
    await userEvent.type(countInput, '5')
    expect(Number((countInput as HTMLInputElement).value)).toBeGreaterThanOrEqual(1)

    // Switch to a percent-based type
    const select = canvas.getByRole('combobox')
    await userEvent.click(select)
    const accuracyOption = await within(document.body).findByText('Score Above Threshold')
    await userEvent.click(accuracyOption)

    // Count field gone, threshold field appears
    expect(canvas.queryByLabelText('Count')).toBeNull()
    const thresholdInput = await canvas.findByLabelText('Threshold')
    expect(thresholdInput).toBeInTheDocument()
  },
}

export const Disabled: Story = {
  args: {
    value: { type: 'LOGIN_STREAK', count: 7 },
    onChange: fn(),
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Count field is disabled
    const countInput = await canvas.findByLabelText('Count')
    expect(countInput).toBeDisabled()

    // Select is disabled
    const select = canvas.getByRole('combobox')
    expect(select).toHaveAttribute('aria-disabled', 'true')
  },
}
