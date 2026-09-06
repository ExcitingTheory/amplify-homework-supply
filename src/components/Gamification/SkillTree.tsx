/**
 * SkillTree — Renders a skill DAG using React Flow.
 * Nodes represent skills, edges represent prerequisites.
 * Node colors are driven by StudentSkillProgress status.
 *
 * @module SkillTree
 */

import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
  memo,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type OnNodeDrag,
  type Connection,
  type OnEdgesDelete,
  Position,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import LockIcon from "@mui/icons-material/Lock";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { generateSkillTreeFromUnit } from "../../../app/actions/gamification";

// ============================================================================
// Types
// ============================================================================

export type SkillStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "MASTERED";

export interface SkillNodeData {
  [key: string]: unknown;
  skillId: string;
  title: string;
  description?: string;
  status: SkillStatus;
  xpReward?: number;
  prerequisites?: string[];
  /** Cohort scope — encodes unit link as `unit-{unitID}` */
  cohortId?: string;
  /** Set by parent to indicate this node is currently selected */
  selected?: boolean;
}

export interface SkillTreeProps {
  /** All skills in the tree */
  skills: SkillNodeData[];
  /** Called when a skill node is clicked */
  onSkillClick?: (skillId: string) => void;
  /** Height of the tree container */
  height?: number | string;
  /** Unit ID for AI skill generation (instructor only) */
  unitId?: string;
  /** Cohort ID scope for generated skills */
  cohortId?: string;
  /** Whether the user can generate/regenerate skills */
  canGenerate?: boolean;
  /** Called after skills are generated */
  onGenerated?: (result: { skillCount: number }) => void;
  /** Enable interactive editing (drag nodes, connect/disconnect edges) */
  editable?: boolean;
  /** Called when prerequisite relationships change (edge added/removed) */
  onPrerequisiteChange?: (skillId: string, prerequisites: string[]) => void;
  /** Currently selected skill ID — renders a highlight ring */
  selectedSkillId?: string | null;
  /** Compact mode for embedding in dashboards (smaller nodes, no controls) */
  compact?: boolean;
  /** Show loading skeleton */
  loading?: boolean;
}

// ============================================================================
// Status → Visual Mapping
// ============================================================================

const STATUS_COLORS: Record<SkillStatus, string> = {
  LOCKED: "#616161", // darker grey for contrast
  AVAILABLE: "#1565c0", // darker blue
  IN_PROGRESS: "#e65100", // deep orange
  MASTERED: "#1b5e20", // dark green
};

const STATUS_BG: Record<SkillStatus, string> = {
  LOCKED: "#eeeeee",
  AVAILABLE: "#bbdefb",
  IN_PROGRESS: "#ffe0b2",
  MASTERED: "#c8e6c9",
};

const STATUS_TEXT: Record<SkillStatus, string> = {
  LOCKED: "#212121",
  AVAILABLE: "#0d47a1",
  IN_PROGRESS: "#bf360c",
  MASTERED: "#1b5e20",
};

const STATUS_ICONS: Record<SkillStatus, React.ReactNode> = {
  LOCKED: <LockIcon sx={{ fontSize: 20 }} />,
  AVAILABLE: <RadioButtonUncheckedIcon sx={{ fontSize: 20 }} />,
  IN_PROGRESS: <PlayArrowIcon sx={{ fontSize: 20 }} />,
  MASTERED: <CheckCircleIcon sx={{ fontSize: 20 }} />,
};

// ============================================================================
// Custom Node Component
// ============================================================================

const SkillNodeContent = memo(function SkillNodeContent({
  data,
}: {
  data: SkillNodeData;
}) {
  const status = data.status || "LOCKED";
  const isSelected = data.selected === true;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
      />
      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          border: `3px solid ${STATUS_COLORS[status]}`,
          bgcolor: STATUS_BG[status],
          minWidth: 200,
          maxWidth: 280,
          textAlign: "center",
          cursor: status === "LOCKED" ? "not-allowed" : "pointer",
          opacity: status === "LOCKED" ? 0.7 : 1,
          transition: "box-shadow 0.3s, transform 0.3s, outline 0.2s",
          outline: isSelected ? `3px solid ${STATUS_COLORS[status]}` : "none",
          outlineOffset: 3,
          boxShadow: isSelected
            ? `0 0 16px ${STATUS_COLORS[status]}50`
            : `0 2px 8px rgba(0,0,0,0.1)`,
          transform: isSelected ? "scale(1.05)" : undefined,
          "&:hover":
            status !== "LOCKED"
              ? {
                  boxShadow: isSelected
                    ? `0 0 20px ${STATUS_COLORS[status]}60`
                    : `0 4px 16px rgba(0,0,0,0.15)`,
                  transform: isSelected ? "scale(1.07)" : "scale(1.03)",
                }
              : {},
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            mb: 0.75,
          }}
        >
          {STATUS_ICONS[status]}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: STATUS_TEXT[status],
              lineHeight: 1.3,
              fontSize: "0.95rem",
            }}
          >
            {data.title}
          </Typography>
        </Box>
        {data.description && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontSize: "0.8rem",
              lineHeight: 1.3,
              mb: 0.75,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {data.description}
          </Typography>
        )}
        {data.xpReward != null && data.xpReward > 0 && (
          <Chip
            label={`+${data.xpReward} XP`}
            size="small"
            sx={{
              height: 24,
              fontSize: "0.8rem",
              fontWeight: 600,
              bgcolor: STATUS_COLORS[status],
              color: "white",
            }}
          />
        )}
      </Box>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
      />
    </>
  );
});

// ============================================================================
// Layout Helpers
// ============================================================================

/**
 * Simple layered DAG layout — skills with no prerequisites at the top,
 * each subsequent layer below. This is a basic topological sort approach.
 */
function layoutSkills(skills: SkillNodeData[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const skillMap = new Map(skills.map((s) => [s.skillId, s]));
  const prereqMap = new Map<string, string[]>();
  skills.forEach((s) => {
    prereqMap.set(s.skillId, s.prerequisites || []);
  });

  // Topological layer assignment
  const layers = new Map<string, number>();

  function getLayer(id: string, visited: Set<string>): number {
    if (layers.has(id)) return layers.get(id)!;
    if (visited.has(id)) return 0; // cycle guard
    visited.add(id);

    const prereqs = prereqMap.get(id) || [];
    if (prereqs.length === 0) {
      layers.set(id, 0);
      return 0;
    }

    const maxPrereqLayer = Math.max(
      ...prereqs
        .filter((pid) => skillMap.has(pid))
        .map((pid) => getLayer(pid, visited)),
      -1,
    );
    const layer = maxPrereqLayer + 1;
    layers.set(id, layer);
    return layer;
  }

  skills.forEach((s) => getLayer(s.skillId, new Set()));

  // Group skills by layer
  const layerGroups = new Map<number, string[]>();
  layers.forEach((layer, id) => {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(id);
  });

  const LAYER_GAP_Y = 180;
  const NODE_GAP_X = 300;

  const nodes: Node[] = [];
  layerGroups.forEach((ids, layer) => {
    const totalWidth = ids.length * NODE_GAP_X;
    const startX = -totalWidth / 2 + NODE_GAP_X / 2;

    ids.forEach((id, idx) => {
      const skill = skillMap.get(id)!;
      nodes.push({
        id,
        position: { x: startX + idx * NODE_GAP_X, y: layer * LAYER_GAP_Y },
        data: skill,
        type: "skillNode",
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });
  });

  // Build edges from prerequisites
  const edges: Edge[] = [];
  skills.forEach((s) => {
    (s.prerequisites || []).forEach((prereqId) => {
      if (skillMap.has(prereqId)) {
        edges.push({
          id: `${prereqId}->${s.skillId}`,
          source: prereqId,
          target: s.skillId,
          animated: s.status === "IN_PROGRESS",
          style: {
            stroke: STATUS_COLORS[s.status],
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: STATUS_COLORS[s.status],
          },
        });
      }
    });
  });

  return { nodes, edges };
}

// ============================================================================
// Physics System — spring/damping/repulsion with CSS transition smoothing
// ============================================================================

/** Spring stiffness */
const SPRING_K = 0.04;
/** Damping — higher = less bounce */
const DAMPING = 0.88;
/** Impulse on click */
const TOUCH_IMPULSE = 8;
/** How far impulse propagates (px) */
const IMPULSE_FALLOFF = 300;
/** Repulsion between nearby nodes */
const REPULSION_STRENGTH = 800;
/** Distance where repulsion activates */
const REPULSION_RADIUS = 200;
/** Minimum distance for hard collision */
const MIN_NODE_DISTANCE = 180;
/** Velocity threshold to stop simulation */
const VEL_THRESHOLD = 0.05;
/** Position threshold to snap to rest */
const POS_THRESHOLD = 0.3;
/** Strength of pull on connected nodes during drag */
const DRAG_PULL = 0.15;
/** Pull decay per graph hop */
const DRAG_HOP_DECAY = 0.5;

interface PhysBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  restX: number;
  restY: number;
}

function buildAdjacency(edges: Edge[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, new Set());
    if (!adj.has(edge.target)) adj.set(edge.target, new Set());
    adj.get(edge.source)!.add(edge.target);
    adj.get(edge.target)!.add(edge.source);
  }
  return adj;
}

function bfsDistances(
  sourceId: string,
  adjacency: Map<string, Set<string>>,
): Map<string, number> {
  const distances = new Map<string, number>();
  distances.set(sourceId, 0);
  const queue = [sourceId];
  let i = 0;
  while (i < queue.length) {
    const current = queue[i++];
    const currentDist = distances.get(current)!;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    }
  }
  return distances;
}

/**
 * Physics hook that computes node positions via spring/damping simulation.
 * Positions are applied to React Flow nodes; CSS transitions on the
 * `.react-flow__node` elements provide smooth interpolation between frames.
 * The dragged node is exempt from physics (React Flow handles it directly).
 */
function usePhysicsPositions(
  nodes: Node[],
  edges: Edge[],
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  enabled: boolean,
) {
  const bodiesRef = useRef<Map<string, PhysBody>>(new Map());
  const animRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const draggedRef = useRef<string | null>(null);

  // Sync rest positions when nodes change from external source (layout, skills prop)
  const prevNodeCountRef = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    // Only reset rest positions when node count changes (new layout)
    if (nodes.length !== prevNodeCountRef.current) {
      const bodies = bodiesRef.current;
      bodies.clear();
      nodes.forEach((n) => {
        bodies.set(n.id, {
          x: n.position.x,
          y: n.position.y,
          vx: 0,
          vy: 0,
          restX: n.position.x,
          restY: n.position.y,
        });
      });
      prevNodeCountRef.current = nodes.length;
    }
  }, [nodes, enabled]);

  const step = useCallback(() => {
    if (!enabled) return;
    const bodies = bodiesRef.current;
    const ids = Array.from(bodies.keys());
    let hasMotion = false;

    // Spring force toward rest position
    for (const id of ids) {
      if (id === draggedRef.current) continue;
      const body = bodies.get(id)!;
      const fx = (body.restX - body.x) * SPRING_K;
      const fy = (body.restY - body.y) * SPRING_K;
      body.vx = (body.vx + fx) * DAMPING;
      body.vy = (body.vy + fy) * DAMPING;
    }

    // Pairwise repulsion
    for (let i = 0; i < ids.length; i++) {
      if (ids[i] === draggedRef.current) continue;
      for (let j = i + 1; j < ids.length; j++) {
        if (ids[j] === draggedRef.current) continue;
        const a = bodies.get(ids[i])!;
        const b = bodies.get(ids[j])!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < REPULSION_RADIUS) {
          const force = REPULSION_STRENGTH / (dist * dist);
          const nx = dx / dist;
          const ny = dy / dist;
          a.vx += nx * force * 0.5;
          a.vy += ny * force * 0.5;
          b.vx -= nx * force * 0.5;
          b.vy -= ny * force * 0.5;
        }

        // Hard collision
        if (dist < MIN_NODE_DISTANCE) {
          const overlap = (MIN_NODE_DISTANCE - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x += nx * overlap;
          a.y += ny * overlap;
          b.x -= nx * overlap;
          b.y -= ny * overlap;
        }
      }
    }

    // Integrate positions
    for (const id of ids) {
      if (id === draggedRef.current) continue;
      const body = bodies.get(id)!;
      body.x += body.vx;
      body.y += body.vy;

      if (
        Math.abs(body.vx) > VEL_THRESHOLD ||
        Math.abs(body.vy) > VEL_THRESHOLD ||
        Math.abs(body.x - body.restX) > POS_THRESHOLD ||
        Math.abs(body.y - body.restY) > POS_THRESHOLD
      ) {
        hasMotion = true;
      }
    }

    // Snap settled nodes
    if (!hasMotion) {
      for (const id of ids) {
        const body = bodies.get(id)!;
        body.x = body.restX;
        body.y = body.restY;
        body.vx = 0;
        body.vy = 0;
      }
    }

    // Apply to React Flow nodes
    setNodes((currentNodes) =>
      currentNodes.map((n) => {
        if (n.id === draggedRef.current) return n;
        const body = bodies.get(n.id);
        if (!body) return n;
        if (n.position.x === body.x && n.position.y === body.y) return n;
        return { ...n, position: { x: body.x, y: body.y } };
      }),
    );

    if (hasMotion) {
      animRef.current = requestAnimationFrame(step);
    } else {
      runningRef.current = false;
    }
  }, [enabled, setNodes]);

  const startSim = useCallback(() => {
    if (!runningRef.current && enabled) {
      runningRef.current = true;
      animRef.current = requestAnimationFrame(step);
    }
  }, [enabled, step]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  /** Apply click impulse — source bounces, neighbors push away */
  const applyImpulse = useCallback(
    (sourceId: string) => {
      if (!enabled) return;
      const bodies = bodiesRef.current;
      const source = bodies.get(sourceId);
      if (!source) return;

      // Source bounces up
      source.vy -= TOUCH_IMPULSE * 0.5;

      // Push neighbors
      bodies.forEach((body, id) => {
        if (id === sourceId) return;
        const dx = body.x - source.x;
        const dy = body.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const strength = TOUCH_IMPULSE * Math.exp(-dist / IMPULSE_FALLOFF);
        body.vx += (dx / dist) * strength;
        body.vy += (dy / dist) * strength;
      });

      startSim();
    },
    [enabled, startSim],
  );

  /** Notify physics that a node is being dragged — pull connected nodes */
  const onDragMove = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (!enabled) return;
      const bodies = bodiesRef.current;
      const body = bodies.get(nodeId);
      if (!body) return;

      const deltaX = x - body.x;
      const deltaY = y - body.y;
      body.x = x;
      body.y = y;
      body.restX = x;
      body.restY = y;

      // Pull connected nodes along the drag direction
      const adj = buildAdjacency(edges);
      const hops = bfsDistances(nodeId, adj);
      hops.forEach((hopCount, id) => {
        if (id === nodeId) return;
        const neighbor = bodies.get(id);
        if (!neighbor) return;
        const factor = DRAG_PULL * Math.pow(DRAG_HOP_DECAY, hopCount);
        if (factor < 0.01) return;
        neighbor.vx += deltaX * factor;
        neighbor.vy += deltaY * factor;
        // Also shift rest position slightly for plasticity
        neighbor.restX += deltaX * factor * 0.3;
        neighbor.restY += deltaY * factor * 0.3;
      });

      startSim();
    },
    [enabled, edges, startSim],
  );

  const onDragStart = useCallback((nodeId: string) => {
    draggedRef.current = nodeId;
  }, []);

  const onDragStop = useCallback(
    (nodeId: string) => {
      draggedRef.current = null;
      // Update rest position to where node was dropped
      const body = bodiesRef.current.get(nodeId);
      if (body) {
        body.restX = body.x;
        body.restY = body.y;
        body.vx = 0;
        body.vy = 0;
      }
      startSim();
    },
    [startSim],
  );

  return { applyImpulse, onDragStart, onDragMove, onDragStop };
}

// ============================================================================
// SkillTree Inner (needs ReactFlowProvider parent for useReactFlow)
// ============================================================================

const nodeTypes = {
  skillNode: SkillNodeContent,
};

function SkillTreeInner({
  skills,
  onSkillClick,
  height = "100%",
  unitId,
  cohortId,
  canGenerate = false,
  onGenerated,
  editable = false,
  onPrerequisiteChange,
  selectedSkillId,
}: Omit<SkillTreeProps, "compact">) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutSkills(skills),
    [skills],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const reactFlow = useReactFlow();

  // Physics — spring/repulsion with CSS transition smoothing
  const { applyImpulse, onDragStart, onDragMove, onDragStop } =
    usePhysicsPositions(nodes, edges, setNodes, !editable);

  // Sync when skills prop changes
  useEffect(() => {
    const layout = layoutSkills(skills);
    setNodes(
      layout.nodes.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedSkillId },
      })),
    );
    setEdges(layout.edges);
  }, [skills, selectedSkillId, setNodes, setEdges]);

  // Keyboard zoom: capture +/- when container is focused or hovered
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isZoomIn =
        (e.key === "=" || e.key === "+") && (e.ctrlKey || e.metaKey);
      const isZoomOut = e.key === "-" && (e.ctrlKey || e.metaKey);

      if (isZoomIn || isZoomOut) {
        e.preventDefault();
        e.stopPropagation();
        const currentZoom = reactFlow.getZoom();
        const newZoom = isZoomIn
          ? Math.min(currentZoom * 1.2, 2.5)
          : Math.max(currentZoom / 1.2, 0.2);
        reactFlow.zoomTo(newZoom, { duration: 200 });
      }
    },
    [reactFlow],
  );

  // Handle new edge connection (source is prerequisite of target)
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.source === connection.target) return;

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: false,
            style: { stroke: "#1976d2", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#1976d2" },
          },
          eds,
        ),
      );

      if (onPrerequisiteChange) {
        const targetSkill = skills.find((s) => s.skillId === connection.target);
        const currentPrereqs = targetSkill?.prerequisites || [];
        if (!currentPrereqs.includes(connection.source!)) {
          onPrerequisiteChange(connection.target, [
            ...currentPrereqs,
            connection.source!,
          ]);
        }
      }
    },
    [skills, setEdges, onPrerequisiteChange],
  );

  // Handle edge deletion
  const handleEdgesDelete: OnEdgesDelete = useCallback(
    (deletedEdges) => {
      if (!onPrerequisiteChange) return;
      for (const edge of deletedEdges) {
        const targetSkill = skills.find((s) => s.skillId === edge.target);
        if (targetSkill) {
          const updatedPrereqs = (targetSkill.prerequisites || []).filter(
            (prereqId) => prereqId !== edge.source,
          );
          onPrerequisiteChange(edge.target, updatedPrereqs);
        }
      }
    },
    [skills, onPrerequisiteChange],
  );

  const handleGenerate = useCallback(async () => {
    if (!unitId) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await generateSkillTreeFromUnit(unitId, cohortId);
      if (result?.generated) {
        onGenerated?.({ skillCount: result.skillCount ?? 0 });
      } else {
        setError(result?.reason ?? "Failed to generate skill tree");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setGenerating(false);
    }
  }, [unitId, cohortId, onGenerated]);

  // Node click: fire onSkillClick AND trigger physics impulse
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const data = node.data as SkillNodeData;
      applyImpulse(node.id);
      if (data.status !== "LOCKED" && onSkillClick) {
        onSkillClick(data.skillId);
      }
    },
    [onSkillClick, applyImpulse],
  );

  // Node drag: propagate pull to connected nodes via physics
  const handleNodeDragStart: OnNodeDrag = useCallback(
    (_event, node) => {
      setIsDragging(true);
      onDragStart(node.id);
    },
    [onDragStart],
  );

  const handleNodeDrag: OnNodeDrag = useCallback(
    (_event, node) => {
      onDragMove(node.id, node.position.x, node.position.y);
    },
    [onDragMove],
  );

  const handleNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      setIsDragging(false);
      onDragStop(node.id);
    },
    [onDragStop],
  );

  // Determine if panning should be allowed based on zoom level and container size
  // Only allow pan when content exceeds container width at current zoom
  const [panEnabled, setPanEnabled] = useState(true);

  if (skills.length === 0) {
    return (
      <Box data-tour="skills-empty-state" sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">No skills defined yet.</Typography>
        {canGenerate && unitId && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={
                generating ? (
                  <Skeleton variant="circular" width={18} height={18} />
                ) : (
                  <AutoFixHighIcon />
                )
              }
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Generating…" : "Generate from Unit Content"}
            </Button>
            {error && (
              <Typography
                color="error"
                variant="caption"
                sx={{ display: "block", mt: 1 }}
              >
                {error}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      data-tour="skill-tree"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      sx={{
        height,
        width: "100%",
        position: "relative",
        bgcolor: "background.default",
        outline: "none",
        overflow: "visible",
        "& .react-flow__renderer": {
          overflow: "visible",
        },
        "& .react-flow__viewport": {
          overflow: "visible",
        },
        // CSS transitions smooth the physics position updates
        "& .react-flow__node": {
          transition: isDragging ? "none" : "transform 0.15s ease-out",
        },
        // Dragged node follows cursor immediately (no transition)
        "& .react-flow__node.dragging": {
          transition: "none !important",
        },
      }}
    >
      {editable && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            position: "absolute",
            top: 4,
            left: 8,
            zIndex: 10,
            bgcolor: "background.paper",
            px: 0.5,
            borderRadius: 0.5,
          }}
        >
          Drag nodes to reposition • Draw edges to add prerequisites • Select +
          Backspace to remove
        </Typography>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onConnect={editable ? handleConnect : undefined}
        onEdgesDelete={editable ? handleEdgesDelete : undefined}
        onNodeClick={handleNodeClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={editable}
        elementsSelectable={editable}
        deleteKeyCode={editable ? "Backspace" : null}
        panOnDrag={panEnabled}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        minZoom={0.2}
        maxZoom={2.5}
      >
        <Background gap={24} size={1} />
        <Controls showInteractive={editable} />
      </ReactFlow>
      {canGenerate && unitId && (
        <Tooltip
          title={
            generating
              ? "Generating…"
              : "Regenerate skill tree from unit content"
          }
        >
          <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
            <IconButton
              size="small"
              onClick={handleGenerate}
              disabled={generating}
              aria-label={
                generating
                  ? "Generating…"
                  : "Regenerate skill tree from unit content"
              }
              sx={{
                bgcolor: "background.paper",
                boxShadow: 1,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {generating ? (
                <Skeleton variant="circular" width={20} height={20} />
              ) : (
                <AutoFixHighIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Tooltip>
      )}
      {error && (
        <Typography
          color="error"
          variant="caption"
          sx={{
            position: "absolute",
            bottom: 8,
            left: 8,
            zIndex: 10,
            bgcolor: "background.paper",
            px: 1,
            borderRadius: 1,
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}

// ============================================================================
// SkillTree — Wrapped in ReactFlowProvider for useReactFlow access
// ============================================================================

export function SkillTree(props: SkillTreeProps) {
  const { compact: _compact, loading, ...rest } = props;

  if (loading) {
    return (
      <Box
        sx={{
          height: rest.height || "100%",
          width: "100%",
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        {/* Top row — single root card */}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Skeleton
            variant="rectangular"
            width={240}
            height={100}
            sx={{ borderRadius: 2 }}
          />
        </Box>
        {/* Middle row — two cards */}
        <Box sx={{ display: "flex", gap: 4, justifyContent: "center" }}>
          <Skeleton
            variant="rectangular"
            width={220}
            height={90}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width={220}
            height={90}
            sx={{ borderRadius: 2 }}
          />
        </Box>
        {/* Bottom row — three cards */}
        <Box sx={{ display: "flex", gap: 4, justifyContent: "center" }}>
          <Skeleton
            variant="rectangular"
            width={200}
            height={85}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width={200}
            height={85}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width={200}
            height={85}
            sx={{ borderRadius: 2 }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <ReactFlowProvider>
      <SkillTreeInner {...rest} />
    </ReactFlowProvider>
  );
}

export default SkillTree;
