/**
 * Tests for SkillTree component and SkillTreeContext
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

import { SkillTree } from '../SkillTree'
import type { SkillNodeData } from '../SkillTree'

// Mock gamificationActions
const mockGenerateSkillTree = vi.fn()
vi.mock('../../../../app/actions/gamification', () => ({
  generateSkillTreeFromUnit: (...args: any[]) => mockGenerateSkillTree(...args),
}))

// Mock @xyflow/react since it requires a DOM layout for React Flow
vi.mock('@xyflow/react', () => {
  const Position = { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' }
  const MarkerType = { ArrowClosed: 'arrowclosed' }

  function MockReactFlow({ nodes, edges, children }: any) {
    return (
      <div data-testid="react-flow">
        <div data-testid="node-count">{nodes?.length ?? 0}</div>
        <div data-testid="edge-count">{edges?.length ?? 0}</div>
        {nodes?.map((n: any) => (
          <div key={n.id} data-testid={`node-${n.id}`}>
            {n.data?.title} — {n.data?.status}
          </div>
        ))}
        {children}
      </div>
    )
  }

  function ReactFlowProvider({ children }: any) { return <>{children}</> }
  function Background() { return <div data-testid="background" /> }
  function Controls() { return <div data-testid="controls" /> }

  return {
    ReactFlow: MockReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    Position,
    MarkerType,
    useNodesState: (initialNodes: any[]) => [initialNodes || [], vi.fn(), vi.fn()],
    useEdgesState: (initialEdges: any[]) => [initialEdges || [], vi.fn(), vi.fn()],
    useReactFlow: () => ({ getZoom: () => 1, zoomTo: vi.fn() }),
    addEdge: vi.fn(),
  }
})

const sampleSkills: SkillNodeData[] = [
  { skillId: 'basics', title: 'Basics', status: 'MASTERED', xpReward: 10 },
  { skillId: 'intermediate', title: 'Intermediate', status: 'IN_PROGRESS', xpReward: 20, prerequisites: ['basics'] },
  { skillId: 'advanced', title: 'Advanced', status: 'LOCKED', xpReward: 50, prerequisites: ['intermediate'] },
]

describe('SkillTree', () => {
  beforeEach(() => {
    mockGenerateSkillTree.mockReset()
  })

  it('renders empty state when no skills', () => {
    render(<SkillTree skills={[]} />)
    expect(screen.getByText('No skills defined yet.')).toBeDefined()
  })

  it('renders nodes for each skill', () => {
    render(<SkillTree skills={sampleSkills} />)
    expect(screen.getByTestId('node-basics').textContent).toContain('Basics')
    expect(screen.getByTestId('node-basics').textContent).toContain('MASTERED')
    expect(screen.getByTestId('node-intermediate').textContent).toContain('IN_PROGRESS')
    expect(screen.getByTestId('node-advanced').textContent).toContain('LOCKED')
  })

  it('creates correct number of nodes and edges', () => {
    render(<SkillTree skills={sampleSkills} />)
    expect(screen.getByTestId('node-count').textContent).toBe('3')
    expect(screen.getByTestId('edge-count').textContent).toBe('2')
  })

  it('handles skills with no prerequisites (root nodes)', () => {
    const rootSkills: SkillNodeData[] = [
      { skillId: 'a', title: 'A', status: 'AVAILABLE' },
      { skillId: 'b', title: 'B', status: 'AVAILABLE' },
    ]
    render(<SkillTree skills={rootSkills} />)
    expect(screen.getByTestId('node-count').textContent).toBe('2')
    expect(screen.getByTestId('edge-count').textContent).toBe('0')
  })

  // ---- Generate Skill Tree UI tests ----

  it('does not show generate button when canGenerate is false', () => {
    render(<SkillTree skills={[]} unitId="unit-1" />)
    expect(screen.queryByText('Generate from Unit Content')).toBeNull()
  })

  it('does not show generate button when unitId is missing', () => {
    render(<SkillTree skills={[]} canGenerate />)
    expect(screen.queryByText('Generate from Unit Content')).toBeNull()
  })

  it('shows generate button in empty state when canGenerate and unitId are set', () => {
    render(<SkillTree skills={[]} canGenerate unitId="unit-1" />)
    expect(screen.getByText('Generate from Unit Content')).toBeDefined()
  })

  it('calls generateSkillTree and fires onGenerated on success', async () => {
    mockGenerateSkillTree.mockResolvedValue({ generated: true, skillCount: 5 })
    const onGenerated = vi.fn()

    render(<SkillTree skills={[]} canGenerate unitId="unit-1" cohortId="cohort-1" onGenerated={onGenerated} />)

    fireEvent.click(screen.getByText('Generate from Unit Content'))

    await waitFor(() => {
      expect(mockGenerateSkillTree).toHaveBeenCalledWith('unit-1', 'cohort-1')
      expect(onGenerated).toHaveBeenCalledWith({ skillCount: 5 })
    })
  })

  it('shows error when generation fails', async () => {
    mockGenerateSkillTree.mockResolvedValue({ generated: false, reason: 'Unit has no content' })

    render(<SkillTree skills={[]} canGenerate unitId="unit-1" />)

    fireEvent.click(screen.getByText('Generate from Unit Content'))

    await waitFor(() => {
      expect(screen.getByText('Unit has no content')).toBeDefined()
    })
  })

  it('shows regenerate button when skills exist and canGenerate is true', () => {
    render(<SkillTree skills={sampleSkills} canGenerate unitId="unit-1" />)
    // The regenerate button is an IconButton with a tooltip
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeDefined()
  })
})
