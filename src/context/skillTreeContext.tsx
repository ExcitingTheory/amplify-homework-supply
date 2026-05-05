/**
 * SkillTreeContext — Subscribes to Skill and StudentSkillProgress models
 * and merges them into SkillNodeData for the SkillTree component.
 *
 * @module SkillTreeContext
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { SkillNodeData, SkillStatus } from '../components/Gamification/SkillTree'

// ============================================================================
// Types
// ============================================================================

export interface SkillTreeContextValue {
  /** Merged skills with student progress status */
  skillNodes: SkillNodeData[]
  /** Loading state */
  isLoading: boolean
  /** Selected skill for side drawer */
  selectedSkillId: string | null
  setSelectedSkillId: (id: string | null) => void
}

// ============================================================================
// Context
// ============================================================================

const SkillTreeContext = createContext<SkillTreeContextValue>({
  skillNodes: [],
  isLoading: true,
  selectedSkillId: null,
  setSelectedSkillId: () => {},
})

export function useSkillTree(): SkillTreeContextValue {
  return useContext(SkillTreeContext)
}

// ============================================================================
// Provider
// ============================================================================

export interface SkillTreeProviderProps {
  client: any
  studentId: string
  /** Optional cohort filter */
  cohortId?: string
  children: React.ReactNode
}

export function SkillTreeProvider({
  client,
  studentId,
  cohortId,
  children,
}: SkillTreeProviderProps) {
  const [skills, setSkills] = useState<any[]>([])
  const [progressItems, setProgressItems] = useState<any[]>([])
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [progressLoading, setProgressLoading] = useState(true)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)

  // Subscribe to Skills
  useEffect(() => {
    if (!client?.models?.Skill) {
      setSkillsLoading(false)
      return
    }

    const sub = client.models.Skill.observeQuery(
      cohortId ? { filter: { cohortId: { eq: cohortId } } } : undefined,
    ).subscribe({
      next: ({ items }: { items: any[] }) => {
        const valid = items.filter((i: any) => i != null && i.id != null)
        setSkills(valid)
        setSkillsLoading(false)
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (msg.includes('DuplicatedOperationError')) {
          console.warn('[SkillTreeContext] transient DuplicatedOperationError (safe to ignore)')
          return
        }
        console.error('[SkillTreeContext] Skill subscription error:', err)
        setSkillsLoading(false)
      },
    })

    return () => sub.unsubscribe()
  }, [client, cohortId])

  // Subscribe to StudentSkillProgress for this student
  useEffect(() => {
    if (!client?.models?.StudentSkillProgress || !studentId) {
      setProgressLoading(false)
      return
    }

    const sub = client.models.StudentSkillProgress.observeQuery({
      filter: { studentId: { eq: studentId } },
    }).subscribe({
      next: ({ items }: { items: any[] }) => {
        const valid = items.filter((i: any) => i != null && i.id != null)
        setProgressItems(valid)
        setProgressLoading(false)
      },
      error: (err: any) => {
        const msg = err?.message || err?.errors?.[0]?.message || String(err)
        if (msg.includes('DuplicatedOperationError')) {
          console.warn('[SkillTreeContext] transient DuplicatedOperationError (safe to ignore)')
          return
        }
        console.error('[SkillTreeContext] StudentSkillProgress subscription error:', err)
        setProgressLoading(false)
      },
    })

    return () => sub.unsubscribe()
  }, [client, studentId])

  // Merge skills + progress into SkillNodeData[]
  const skillNodes = useMemo<SkillNodeData[]>(() => {
    const progressBySkill = new Map<string, string>(
      progressItems.map((p) => [p.skillId, p.status]),
    )

    return skills.map((skill) => {
      const status = (progressBySkill.get(skill.id) || 'LOCKED') as SkillStatus
      let prerequisites: string[] = []
      if (skill.prerequisites) {
        try {
          const parsed = typeof skill.prerequisites === 'string'
            ? JSON.parse(skill.prerequisites)
            : skill.prerequisites
          if (Array.isArray(parsed)) {
            prerequisites = parsed
          }
        } catch {
          // ignore malformed prerequisites
        }
      }

      return {
        skillId: skill.id,
        title: skill.title,
        description: skill.description || undefined,
        status,
        xpReward: skill.xpReward ?? undefined,
        prerequisites,
      }
    })
  }, [skills, progressItems])

  const isLoading = skillsLoading || progressLoading

  const contextValue = useMemo<SkillTreeContextValue>(
    () => ({ skillNodes, isLoading, selectedSkillId, setSelectedSkillId }),
    [skillNodes, isLoading, selectedSkillId],
  )

  return (
    <SkillTreeContext.Provider value={contextValue}>
      {children}
    </SkillTreeContext.Provider>
  )
}

export default SkillTreeContext
