/**
 * SkillTree — Renders a skill DAG using React Flow.
 * Nodes represent skills, edges represent prerequisites.
 * Node colors are driven by StudentSkillProgress status.
 *
 * @module SkillTree
 */

import React, { useMemo, useCallback, useState, memo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type Connection,
  type OnEdgesDelete,
  Position,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
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
import { generateSkillTreeFromUnit } from '../../../app/actions/gamification'

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
  /** Cohort scope — encodes unit link as `unit-{unitID}` */
  cohortId?: string
  /** Set by parent to indicate this node is currently selected */
  selected?: boolean
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
  /** Enable interactive editing (drag nodes, connect/disconnect edges) */
  editable?: boolean
  /** Called when prerequisite relationships change (edge added/removed) */
  onPrerequisiteChange?: (skillId: string, prerequisites: string[]) => void
  /** Currently selected skill ID — renders a highlight ring */
  selectedSkillId?: string | null
  /** Compact mode for embedding in dashboards (smaller nodes, no controls) */
  compact?: boolean
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

const SkillNodeContent = memo(function SkillNodeContent({ data }: { data: SkillNodeData }) {
  const status = data.status || 'LOCKED'
  const isSelected = data.selected === true

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
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
          transition: 'box-shadow 0.3s, transform 0.3s, outline 0.2s',
          outline: isSelected ? `3px solid ${STATUS_COLORS[status]}` : 'none',
          outlineOffset: 2,
          boxShadow: isSelected ? `0 0 12px ${STATUS_COLORS[status]}40` : undefined,
          transform: isSelected ? 'scale(1.05)' : undefined,
          '&:hover': status !== 'LOCKED' ? {
            boxShadow: isSelected ? `0 0 16px ${STATUS_COLORS[status]}60` : 3,
            transform: isSelected ? 'scale(1.07)' : 'scale(1.03)',
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
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </>
  )
})

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
  editable = false,
  onPrerequisiteChange,
  selectedSkillId,
  compact = false,
}: SkillTreeProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => layoutSkills(skills), [skills])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [generating, setGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Sync when skills prop changes
  React.useEffect(() => {
    const layout = layoutSkills(skills)
    setNodes(layout.nodes.map((n) => ({
      ...n,
      data: { ...n.data, selected: n.id === selectedSkillId },
    })))
    setEdges(layout.edges)
  }, [skills, selectedSkillId, setNodes, setEdges])

  // Handle new edge connection (source is prerequisite of target)
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      // Don't allow self-connections
      if (connection.source === connection.target) return

      // Add the edge visually
      setEdges((eds) => addEdge({
        ...connection,
        animated: false,
        style: { stroke: '#1976d2', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1976d2' },
      }, eds))

      // Notify parent: target skill now has source as a prerequisite
      if (onPrerequisiteChange) {
        const targetSkill = skills.find((s) => s.skillId === connection.target)
        const currentPrereqs = targetSkill?.prerequisites || []
        if (!currentPrereqs.includes(connection.source)) {
          onPrerequisiteChange(connection.target, [...currentPrereqs, connection.source])
        }
      }
    },
    [skills, setEdges, onPrerequisiteChange],
  )

  // Handle edge deletion (remove prerequisite relationship)
  const handleEdgesDelete: OnEdgesDelete = useCallback(
    (deletedEdges) => {
      if (!onPrerequisiteChange) return
      for (const edge of deletedEdges) {
        const targetSkill = skills.find((s) => s.skillId === edge.target)
        if (targetSkill) {
          const updatedPrereqs = (targetSkill.prerequisites || []).filter(
            (prereqId) => prereqId !== edge.source,
          )
          onPrerequisiteChange(edge.target, updatedPrereqs)
        }
      }
    },
    [skills, onPrerequisiteChange],
  )

  const handleGenerate = useCallback(async () => {
    if (!unitId) return
    setGenerating(true)
    setError(null)
    try {
      const result = await generateSkillTreeFromUnit(unitId, cohortId)
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
      {editable && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ position: 'absolute', top: 4, left: 8, zIndex: 10, bgcolor: 'background.paper', px: 0.5, borderRadius: 0.5 }}
        >
          Drag nodes to reposition • Draw edges to add prerequisites • Select + Backspace to remove
        </Typography>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onConnect={editable ? handleConnect : undefined}
        onEdgesDelete={editable ? handleEdgesDelete : undefined}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: compact ? 0.15 : 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        deleteKeyCode={editable ? 'Backspace' : null}
        panOnDrag={!compact}
        zoomOnScroll={!compact}
        zoomOnPinch={!compact}
        zoomOnDoubleClick={!compact}
        preventScrolling={!compact}
      >
        <Background />
        {!compact && <Controls showInteractive={editable} />}
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
