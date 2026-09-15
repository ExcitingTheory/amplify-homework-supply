/**
 * CampaignContext — Subscribes to Campaign and GroupChallenge models
 * for the cohort's narrative/cooperative gamification layer.
 *
 * @module CampaignContext
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface CampaignInfo {
  id: string
  sectionID: string
  title: string
  setting?: string
  stakes?: string
  systemPromptSeed?: string
}

export interface GroupChallengeInfo {
  id: string
  sectionID: string
  title: string
  targetXP: number
  currentXP: number
  deadline?: string
  active: boolean
  bonusMultiplier: number
  progressPercent: number
  /** Unit IDs whose XP contributes to this chapter. Empty = all section XP. */
  linkedUnitIds?: string[]
  chapterOrder?: number
  setting?: string
  stakes?: string
}

export interface CampaignContextValue {
  /** Active campaign for the cohort */
  campaign: CampaignInfo | null
  /** Active group challenges */
  activeChallenges: GroupChallengeInfo[]
  /** Completed group challenges */
  completedChallenges: GroupChallengeInfo[]
  isLoading: boolean
}

// ============================================================================
// Context
// ============================================================================

const CampaignContext = createContext<CampaignContextValue>({
  campaign: null,
  activeChallenges: [],
  completedChallenges: [],
  isLoading: true,
})

export function useCampaign(): CampaignContextValue {
  return useContext(CampaignContext)
}

// ============================================================================
// Provider
// ============================================================================

export interface CampaignProviderProps {
  client: any
  sectionID: string
  children: React.ReactNode
}

export function CampaignProvider({
  client,
  sectionID,
  children,
}: CampaignProviderProps) {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [challengesLoading, setChallengesLoading] = useState(true)

  // Subscribe to Campaigns for this cohort
  useEffect(() => {
    if (!client?.models?.Campaign || !sectionID) {
      setCampaignsLoading(false)
      return
    }

    const sub = client.models.Campaign.observeQuery({
      filter: { sectionID: { eq: sectionID } },
    }).subscribe({
      next: ({ items }: { items: any[] }) => {
        const valid = items.filter((i: any) => i != null && i.id != null)
        setCampaigns(valid)
        setCampaignsLoading(false)
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (msg.includes('DuplicatedOperationError')) {
          console.warn('[CampaignContext] transient DuplicatedOperationError (safe to ignore)')
          return
        }
        console.error('[CampaignContext] Campaign subscription error:', err)
        setCampaignsLoading(false)
      },
    })

    return () => sub.unsubscribe()
  }, [client, sectionID])

  // Subscribe to GroupChallenges for this cohort
  useEffect(() => {
    if (!client?.models?.GroupChallenge || !sectionID) {
      setChallengesLoading(false)
      return
    }

    const sub = client.models.GroupChallenge.observeQuery({
      filter: { sectionID: { eq: sectionID } },
    }).subscribe({
      next: ({ items }: { items: any[] }) => {
        const valid = items.filter((i: any) => i != null && i.id != null)
        setChallenges(valid)
        setChallengesLoading(false)
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (msg.includes('DuplicatedOperationError')) {
          console.warn('[CampaignContext] transient DuplicatedOperationError (safe to ignore)')
          return
        }
        console.error('[CampaignContext] GroupChallenge subscription error:', err)
        setChallengesLoading(false)
      },
    })

    return () => sub.unsubscribe()
  }, [client, sectionID])

  // First campaign for this cohort
  const campaign = useMemo<CampaignInfo | null>(() => {
    if (campaigns.length === 0) return null
    const c = campaigns[0]
    return {
      id: c.id,
      sectionID: c.sectionID,
      title: c.title,
      setting: c.setting,
      stakes: c.stakes,
      systemPromptSeed: c.systemPromptSeed,
    }
  }, [campaigns])

  // Split challenges into active and completed
  const { activeChallenges, completedChallenges } = useMemo(() => {
    const active: GroupChallengeInfo[] = []
    const completed: GroupChallengeInfo[] = []

    challenges.forEach((ch: any) => {
      const info: GroupChallengeInfo = {
        id: ch.id,
        sectionID: ch.sectionID,
        title: ch.title,
        targetXP: ch.targetXP,
        currentXP: ch.currentXP || 0,
        deadline: ch.deadline,
        active: ch.active !== false,
        bonusMultiplier: ch.bonusMultiplier || 1.5,
        progressPercent: ch.targetXP > 0
          ? Math.min(100, Math.round(((ch.currentXP || 0) / ch.targetXP) * 100))
          : 0,
      }

      if (info.active) {
        active.push(info)
      } else {
        completed.push(info)
      }
    })

    return { activeChallenges: active, completedChallenges: completed }
  }, [challenges])

  const isLoading = campaignsLoading || challengesLoading

  const contextValue = useMemo<CampaignContextValue>(
    () => ({ campaign, activeChallenges, completedChallenges, isLoading }),
    [campaign, activeChallenges, completedChallenges, isLoading],
  )

  return (
    <CampaignContext.Provider value={contextValue}>
      {children}
    </CampaignContext.Provider>
  )
}

export default CampaignContext
