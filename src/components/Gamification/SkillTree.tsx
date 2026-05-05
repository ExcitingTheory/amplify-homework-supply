/**
 * SkillTree — Renders a skill DAG using React Flow.
 * Nodes represent skills, edges represent prerequisites.
 * Node colors are driven by StudentSkillProgress status.
 *
 * @module SkillTree
 */

import React, { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import LockIcon from '@mui/icons-material/Lock'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import { generateSkillTree } from '../../utils/gamificationActions'

// ============================================================================
// Types
// ============================================================================

export type SkillStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'MASTERED'

export interface SkillNodeData {
  [key: string]: unknown
  skillId: string
  title: string
  description?: string
  status: SkillStatus
  xpReward?: number
  prerequisites?: string[]
}

export interface SkillTreeProps {
  /** All skills in the tree */
  skills: SkillNodeData[]
  /** Called when a skill node is clicked */
  onSkillClick?: (skillId: string) => void
  /** Height of the tree container */
  height?: number | string
  /** Unit ID for AI skill generation (instructor only) */
  unitId?: string
  /** Cohort ID scope for generated skills */
  cohortId?: string
  /** Whether the user can generate/regenerate skills */
  canGenerate?: boolean
  /** Called after skills are generated */
  onGenerated?: (result: { skillCount: number }) => void
}

// ============================================================================
// Status → Visual Mapping
// ============================================================================

const STATUS_COLORS: Record<SkillStatus, string> = {
  LOCKED: '#9e9e9e',     // grey
  AVAILABLE: '#1976d2',  // blue
  IN_PROGRESS: '#ed6c02', // amber/orange
  MASTERED: '#2e7d32',   // green
}

const STATUS_BG: Record<SkillStatus, string> = {
  LOCKED: '#f5f5f5',
  AVAILABLE: '#e3f2fd',
  IN_PROGRESS: '#fff3e0',
  MASTERED: '#e8f5e9',
}

const STATUS_ICONS: Record<SkillStatus, React.ReactNode> = {
  LOCKED: <LockIcon sx={{ fontSize: 16 }} />,
  AVAILABLE: <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />,
  IN_PROGRESS: <PlayArrowIcon sx={{ fontSize: 16 }} />,
  MASTERED: <CheckCircleIcon sx={{ fontSize: 16 }} />,
}

// ============================================================================
// Custom Node Component
// ============================================================================

function SkillNodeContent({ data }: { data: SkillNodeData }) {
  const status = data.status || 'LOCKED'

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `2px solid ${STATUS_COLORS[status]}`,
        bgcolor: STATUS_BG[status],
        minWidth: 160,
        maxWidth: 220,
        textAlign: 'center',
        cursor: status === 'LOCKED' ? 'not-allowed' : 'pointer',
        opacity: status === 'LOCKED' ? 0.6 : 1,
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': status !== 'LOCKED' ? {
          boxShadow: 3,
          transform: 'scale(1.03)',
        } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
        {STATUS_ICONS[status]}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: STATUS_COLORS[status],
            lineHeight: 1.2,
          }}
        >
          {data.title}
        </Typography>
      </Box>
      {data.xpReward != null && data.xpReward > 0 && (
        <Chip
          label={`+${data.xpReward} XP`}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            bgcolor: STATUS_COLORS[status],
            color: 'white',
          }}
        />
      )}
    </Box>
  )
}

// ============================================================================
// Layout Helpers
// ============================================================================

/**
 * Simple layered DAG layout — skills with no prerequisites at the top,
 * each subsequent layer below. This is a basic topological sort approach.
 */
function layoutSkills(skills: SkillNodeData[]): { nodes: Node[]; edges: Edge[] } {
  const skillMap = new Map(skills.map((s) => [s.skillId, s]))
  const prereqMap = new Map<string, string[]>()
  skills.forEach((s) => {
    prereqMap.set(s.skillId, s.prerequisites || [])
  })

  // Topological layer assignment
  const layers = new Map<string, number>()

  function getLayer(id: string, visited: Set<string>): number {
    if (layers.has(id)) return layers.get(id)!
    if (visited.has(id)) return 0 // cycle guard
    visited.add(id)

    const prereqs = prereqMap.get(id) || []
    if (prereqs.length === 0) {
      layers.set(id, 0)
      return 0
    }

    const maxPrereqLayer = Math.max(
      ...prereqs
        .filter((pid) => skillMap.has(pid))
        .map((pid) => getLayer(pid, visited)),
      -1,
    )
    const layer = maxPrereqLayer + 1
    layers.set(id, layer)
    return layer
  }

  skills.forEach((s) => getLayer(s.skillId, new Set()))

  // Group skills by layer
  const layerGroups = new Map<number, string[]>()
  layers.forEach((layer, id) => {
    if (!layerGroups.has(layer)) layerGroups.set(layer, [])
    layerGroups.get(layer)!.push(id)
  })

  const LAYER_GAP_Y = 140
  const NODE_GAP_X = 240

  const nodes: Node[] = []
  layerGroups.forEach((ids, layer) => {
    const totalWidth = ids.length * NODE_GAP_X
    const startX = -totalWidth / 2 + NODE_GAP_X / 2

    ids.forEach((id, idx) => {
      const skill = skillMap.get(id)!
      nodes.push({
        id,
        position: { x: startX + idx * NODE_GAP_X, y: layer * LAYER_GAP_Y },
        data: skill,
        type: 'skillNode',
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      })
    })
  })

  // Build edges from prerequisites
  const edges: Edge[] = []
  skills.forEach((s) => {
    ;(s.prerequisites || []).forEach((prereqId) => {
      if (skillMap.has(prereqId)) {
        edges.push({
          id: `${prereqId}->${s.skillId}`,
          source: prereqId,
          target: s.skillId,
          animated: s.status === 'IN_PROGRESS',
          style: {
            stroke: STATUS_COLORS[s.status],
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: STATUS_COLORS[s.status],
          },
        })
      }
    })
  })

  return { nodes, edges }
}

// ============================================================================
// SkillTree Component
// ============================================================================

const nodeTypes = {
  skillNode: SkillNodeContent,
}

export function SkillTree({
  skills,
  onSkillClick,
  height = 500,
  unitId,
  cohortId,
  canGenerate = false,
  onGenerated,
}: SkillTreeProps) {
  const { nodes, edges } = useMemo(() => layoutSkills(skills), [skills])
  const [generating, setGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!unitId) return
    setGenerating(true)
    setError(null)
    try {
      const result = await generateSkillTree(unitId, cohortId)
      if (result?.generated) {
        onGenerated?.({ skillCount: result.skillCount ?? 0 })
      } else {
        setError(result?.reason ?? 'Failed to generate skill tree')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setGenerating(false)
    }
  }, [unitId, cohortId, onGenerated])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const data = node.data as SkillNodeData
      if (data.status !== 'LOCKED' && onSkillClick) {
        onSkillClick(data.skillId)
      }
    },
    [onSkillClick],
  )

  if (skills.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No skills defined yet.</Typography>
        {canGenerate && unitId && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={generating ? <Skeleton variant="circular" width={18} height={18} /> : <AutoFixHighIcon />}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating…' : 'Generate from Unit Content'}
            </Button>
            {error && (
              <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ height, width: '100%', border: 1, borderColor: 'divider', borderRadius: 2, position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
      {canGenerate && unitId && (
        <Tooltip title={generating ? 'Generating…' : 'Regenerate skill tree from unit content'}>
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
            <IconButton
              size="small"
              onClick={handleGenerate}
              disabled={generating}
              aria-label={generating ? 'Generating…' : 'Regenerate skill tree from unit content'}
              sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'action.hover' } }}
            >
              {generating ? <Skeleton variant="circular" width={20} height={20} /> : <AutoFixHighIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Tooltip>
      )}
      {error && (
        <Typography
          color="error"
          variant="caption"
          sx={{ position: 'absolute', bottom: 8, left: 8, zIndex: 10, bgcolor: 'background.paper', px: 1, borderRadius: 1 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default SkillTree
