/**
 * Tests for CampaignContext provider
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { CampaignProvider, useCampaign } from '../campaignContext'

function TestConsumer() {
  const { campaign, activeChallenges, completedChallenges, isLoading } = useCampaign()
  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="campaign">{campaign?.title ?? 'none'}</div>
      <div data-testid="campaign-setting">{campaign?.setting ?? 'none'}</div>
      <div data-testid="active-count">{activeChallenges.length}</div>
      <div data-testid="completed-count">{completedChallenges.length}</div>
      {activeChallenges.map((ch) => (
        <div key={ch.id} data-testid={`active-${ch.id}`}>
          {ch.title}|{ch.progressPercent}%|x{ch.bonusMultiplier}
        </div>
      ))}
      {completedChallenges.map((ch) => (
        <div key={ch.id} data-testid={`completed-${ch.id}`}>
          {ch.title}
        </div>
      ))}
    </div>
  )
}

function createMockClient(campaigns: any[] = [], challenges: any[] = []) {
  return {
    models: {
      Campaign: {
        observeQuery: () => ({
          subscribe: (handlers: any) => {
            handlers.next({ items: campaigns })
            return { unsubscribe: vi.fn() }
          },
        }),
      },
      GroupChallenge: {
        observeQuery: () => ({
          subscribe: (handlers: any) => {
            handlers.next({ items: challenges })
            return { unsubscribe: vi.fn() }
          },
        }),
      },
    },
  }
}

describe('CampaignContext', () => {
  it('shows no campaign when none exists', () => {
    const client = createMockClient([], [])
    render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )
    expect(screen.getByTestId('campaign').textContent).toBe('none')
    expect(screen.getByTestId('active-count').textContent).toBe('0')
    expect(screen.getByTestId('completed-count').textContent).toBe('0')
    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

  it('surfaces the first campaign for the cohort', () => {
    const client = createMockClient(
      [
        {
          id: 'camp-1',
          cohortId: 'c1',
          title: 'Water Cycle Quest',
          setting: 'Ocean',
          stakes: 'Save the fish!',
          systemPromptSeed: 'You are an ocean narrator',
        },
      ],
      [],
    )

    render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )

    expect(screen.getByTestId('campaign').textContent).toBe('Water Cycle Quest')
    expect(screen.getByTestId('campaign-setting').textContent).toBe('Ocean')
  })

  it('splits challenges into active and completed', () => {
    const client = createMockClient(
      [],
      [
        { id: 'ch-1', cohortId: 'c1', title: 'Week 1', targetXP: 1000, currentXP: 750, active: true, bonusMultiplier: 2 },
        { id: 'ch-2', cohortId: 'c1', title: 'Week 2', targetXP: 500, currentXP: 500, active: false, bonusMultiplier: 1.5 },
        { id: 'ch-3', cohortId: 'c1', title: 'Week 3', targetXP: 2000, currentXP: 0, active: true },
      ],
    )

    render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )

    expect(screen.getByTestId('active-count').textContent).toBe('2')
    expect(screen.getByTestId('completed-count').textContent).toBe('1')
    expect(screen.getByTestId('active-ch-1').textContent).toBe('Week 1|75%|x2')
    expect(screen.getByTestId('active-ch-3').textContent).toBe('Week 3|0%|x1.5')
    expect(screen.getByTestId('completed-ch-2').textContent).toBe('Week 2')
  })

  it('calculates progressPercent correctly', () => {
    const client = createMockClient(
      [],
      [
        { id: 'ch-1', cohortId: 'c1', title: 'Full', targetXP: 100, currentXP: 200, active: true },
        { id: 'ch-2', cohortId: 'c1', title: 'Zero Target', targetXP: 0, currentXP: 50, active: true },
        { id: 'ch-3', cohortId: 'c1', title: 'Half', targetXP: 200, currentXP: 100, active: true },
      ],
    )

    render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )

    // Capped at 100%
    expect(screen.getByTestId('active-ch-1').textContent).toContain('100%')
    // targetXP=0 → 0%
    expect(screen.getByTestId('active-ch-2').textContent).toContain('0%')
    // 100/200 = 50%
    expect(screen.getByTestId('active-ch-3').textContent).toContain('50%')
  })

  it('handles missing currentXP (defaults to 0)', () => {
    const client = createMockClient(
      [],
      [{ id: 'ch-1', cohortId: 'c1', title: 'New', targetXP: 500, active: true }],
    )

    render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )

    expect(screen.getByTestId('active-ch-1').textContent).toContain('0%')
  })

  it('handles DuplicatedOperationError gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const client = {
      models: {
        Campaign: {
          observeQuery: () => ({
            subscribe: (handlers: any) => {
              handlers.error({ message: 'DuplicatedOperationError' })
              return { unsubscribe: vi.fn() }
            },
          }),
        },
        GroupChallenge: {
          observeQuery: () => ({
            subscribe: (handlers: any) => {
              handlers.next({ items: [] })
              return { unsubscribe: vi.fn() }
            },
          }),
        },
      },
    }

    render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('DuplicatedOperationError'),
    )
    consoleSpy.mockRestore()
  })

  it('filters out null items', () => {
    const client = createMockClient(
      [null as any, { id: 'camp-1', cohortId: 'c1', title: 'Valid' }],
      [{ id: null } as any, { id: 'ch-1', cohortId: 'c1', title: 'Good', targetXP: 100, currentXP: 50, active: true }],
    )

    render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )

    expect(screen.getByTestId('campaign').textContent).toBe('Valid')
    expect(screen.getByTestId('active-count').textContent).toBe('1')
  })

  it('handles missing client models gracefully', () => {
    const client = { models: {} }
    render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )
    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(screen.getByTestId('campaign').textContent).toBe('none')
  })

  it('unsubscribes on unmount', () => {
    const unsubSkill = vi.fn()
    const unsubProgress = vi.fn()
    const client = {
      models: {
        Campaign: {
          observeQuery: () => ({
            subscribe: (handlers: any) => {
              handlers.next({ items: [] })
              return { unsubscribe: unsubSkill }
            },
          }),
        },
        GroupChallenge: {
          observeQuery: () => ({
            subscribe: (handlers: any) => {
              handlers.next({ items: [] })
              return { unsubscribe: unsubProgress }
            },
          }),
        },
      },
    }

    const { unmount } = render(
      <CampaignProvider client={client} cohortId="c1">
        <TestConsumer />
      </CampaignProvider>,
    )

    unmount()
    expect(unsubSkill).toHaveBeenCalled()
    expect(unsubProgress).toHaveBeenCalled()
  })
})
