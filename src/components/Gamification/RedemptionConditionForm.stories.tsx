import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
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
}

export const Prefilled: Story = {
  render: () => {
    const [condition, setCondition] = useState<RedemptionCondition | null>({
      type: 'CONSECUTIVE_ON_TIME',
      count: 3,
    })
    return <RedemptionConditionForm value={condition} onChange={setCondition} />
  },
}

export const Disabled: Story = {
  args: {
    value: { type: 'LOGIN_STREAK', count: 7 },
    onChange: fn(),
    disabled: true,
  },
}
