/**
 * BadgeIcon — Renders a React Icon inside a shaped badge container
 * with animated SVG path drawing, gradient backgrounds, and motion effects.
 *
 * Replaces emoji-based badges with rich, animated, icon-based badges
 * using react-icons + framer-motion.
 *
 * @module BadgeIcon
 */

import React, { useId, useMemo } from "react";
import Box, { type BoxProps } from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getMetals, type MetalKey } from "@/themes/heraldry";

// Typed wrapper to avoid MUI Box + motion.div type conflicts
const MotionBox = motion.create(Box) as React.FC<
  BoxProps & HTMLMotionProps<"div">
>;
import {
  getBadgeConfig,
  getRarityEffects,
  type BadgeVisualConfig,
  type BadgeShape,
  type BadgeAnimationPreset,
  type BadgeGradient,
} from "./badgeRegistry";

// ============================================================================
// Types
// ============================================================================

export interface BadgeIconProps {
  /** The badge type key (e.g. 'FIRST_SUBMISSION'). Looks up from registry. */
  badgeType?: string;
  /** Override: pass a full config instead of looking up by type */
  config?: BadgeVisualConfig;
  /** Size in px. Defaults to 56. */
  size?: number;
  /** Whether the badge is earned (full color) or locked (greyed out). */
  earned?: boolean;
  /** Whether to play the mount animation. Defaults to true for earned badges. */
  animate?: boolean;
  /** Delay before mount animation starts (seconds). Useful for staggered grids. */
  animationDelay?: number;
  /** Override the animation preset */
  animationOverride?: BadgeAnimationPreset;
  /** Whether the icon line-draw animation should play. Defaults to true. */
  drawIcon?: boolean;
  /** Additional sx styles for the outer container */
  sx?: Record<string, unknown>;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

// ============================================================================
// Shape clip paths (SVG viewBox 0 0 100 100)
// ============================================================================

export const SHAPE_PATHS: Record<BadgeShape, string> = {
  circle: "M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0 Z",
  hexagon: "M 50 0 L 93.3 25 L 93.3 75 L 50 100 L 6.7 75 L 6.7 25 Z",
  shield: "M 50 0 L 95 15 L 90 60 Q 75 90, 50 100 Q 25 90, 10 60 L 5 15 Z",
  diamond: "M 50 0 L 100 50 L 50 100 L 0 50 Z",
};

// Rarity reads as a material step: bronze → silver → gold → platinum.
const RARITY_METAL: Record<BadgeVisualConfig["rarity"], MetalKey> = {
  common: "bronze",
  uncommon: "bronze",
  rare: "silver",
  epic: "gold",
  legendary: "platinum",
};

// ============================================================================
// Animation variants
// ============================================================================

const containerVariants: Record<BadgeAnimationPreset, Variants> = {
  draw: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  },
  pulse: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: [1, 1.06, 1],
      transition: { duration: 1.2, repeat: Infinity, repeatDelay: 2 },
    },
  },
  "spin-in": {
    hidden: { opacity: 0, rotate: -180, scale: 0.5 },
    visible: {
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 150, damping: 15 },
    },
  },
  "bounce-in": {
    hidden: { opacity: 0, y: 20, scale: 0.6 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 12 },
    },
  },
  glow: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  },
  shake: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      x: [0, -4, 4, -4, 4, 0],
      transition: { duration: 0.5 },
    },
  },
  none: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
};

const hoverVariants: Record<BadgeAnimationPreset, Record<string, unknown>> = {
  draw: {},
  pulse: { scale: 1.08, transition: { duration: 0.2 } },
  "spin-in": { rotate: 15, transition: { duration: 0.2 } },
  "bounce-in": { y: -4, transition: { type: "spring", stiffness: 400 } },
  glow: { scale: 1.05, transition: { duration: 0.2 } },
  shake: { x: [0, -3, 3, -3, 3, 0], transition: { duration: 0.4 } },
  none: {},
};

// ============================================================================
// SVG icon draw animation component
// ============================================================================

interface DrawableIconProps {
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
  size: number;
  draw: boolean;
  scale: number;
  translate: [number, number];
  animationDelay: number;
}

function DrawableIcon({
  Icon,
  color,
  size,
  draw,
  scale,
  translate,
  animationDelay,
}: DrawableIconProps) {
  const iconSize = Math.round(size * 0.55 * scale);
  const [tx, ty] = translate;

  if (!draw) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(${tx}px, ${ty}px)`,
          color,
        }}
      >
        <Icon size={iconSize} />
      </Box>
    );
  }

  return (
    <MotionBox
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${tx}px, ${ty}px)`,
        color,
        // SVG path draw animation via CSS
        "& svg": {
          overflow: "visible",
        },
        "& svg path, & svg circle, & svg rect, & svg line, & svg polyline, & svg polygon, & svg ellipse":
          {
            strokeDasharray: 1000,
            strokeDashoffset: 1000,
            animation: `badgeIconDraw 1.2s ease-out ${animationDelay}s forwards, badgeIconFill 0.4s ease-in ${animationDelay + 1.0}s forwards`,
            stroke: color,
            strokeWidth: 0.5,
            fill: "transparent",
          },
        "@keyframes badgeIconDraw": {
          to: { strokeDashoffset: 0 },
        },
        "@keyframes badgeIconFill": {
          to: { fill: color, strokeWidth: 0 },
        },
      }}
    >
      <Icon size={iconSize} />
    </MotionBox>
  );
}

// ============================================================================
// Gradient SVG defs
// ============================================================================

interface GradientDefsProps {
  id: string;
  gradient?: BadgeGradient;
  bgColor: string;
}

function GradientDefs({ id, gradient, bgColor }: GradientDefsProps) {
  if (!gradient) {
    return (
      <defs>
        <linearGradient id={id}>
          <stop offset="0%" stopColor={bgColor} />
          <stop offset="100%" stopColor={bgColor} />
        </linearGradient>
      </defs>
    );
  }

  if (gradient.type === "radial") {
    return (
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          {gradient.stops.map((stop, i) => (
            <stop key={i} offset={stop.position} stopColor={stop.color} />
          ))}
        </radialGradient>
      </defs>
    );
  }

  // Parse angle for linear gradient
  const angle = parseFloat(gradient.angle || "135") * (Math.PI / 180);
  const x1 = `${50 - Math.cos(angle) * 50}%`;
  const y1 = `${50 - Math.sin(angle) * 50}%`;
  const x2 = `${50 + Math.cos(angle) * 50}%`;
  const y2 = `${50 + Math.sin(angle) * 50}%`;

  return (
    <defs>
      <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
        {gradient.stops.map((stop, i) => (
          <stop key={i} offset={stop.position} stopColor={stop.color} />
        ))}
      </linearGradient>
    </defs>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BadgeIcon({
  badgeType,
  config: configOverride,
  size = 56,
  earned = true,
  animate = true,
  animationDelay = 0,
  animationOverride,
  drawIcon = true,
  sx: sxProp,
  onClick,
}: BadgeIconProps) {
  const gradientId = useId();
  const idBase = gradientId.replace(/:/g, "");
  const cleanGradientId = `badge-grad-${idBase}`;
  const glossId = `badge-gloss-${idBase}`;
  const rimMetalId = `badge-rim-${idBase}`;
  const sheenId = `badge-sheen-${idBase}`;
  const clipId = `badge-clip-${idBase}`;
  const reducedMotion = useReducedMotion();
  const theme = useTheme();

  // Suppress all animations when reduced motion is active
  const effectiveAnimate = animate && !reducedMotion;
  const effectiveDrawIcon = drawIcon && !reducedMotion;

  const config =
    configOverride ?? getBadgeConfig(badgeType ?? "FIRST_SUBMISSION");
  const rarityEffect = getRarityEffects(theme)[config.rarity];
  const rimMetal = getMetals(theme)[RARITY_METAL[config.rarity]];

  const mountAnim = animationOverride ?? config.animation;
  const hoverAnim = config.hoverAnimation ?? "pulse";

  const shapePath = SHAPE_PATHS[config.shape];

  // Locked state: greyscale + reduced opacity
  const filterStyle = earned ? undefined : "grayscale(100%) opacity(0.4)";

  const glowShadow = useMemo(() => {
    if (!earned || rarityEffect.glowIntensity === 0) return "none";
    return `0 0 ${rarityEffect.glowIntensity}px ${rarityEffect.glowColor}`;
  }, [earned, rarityEffect]);

  return (
    <MotionBox
      variants={
        effectiveAnimate && earned
          ? containerVariants[mountAnim]
          : containerVariants.none
      }
      initial={effectiveAnimate && earned ? "hidden" : "visible"}
      animate="visible"
      whileHover={
        earned && !reducedMotion ? (hoverVariants[hoverAnim] as any) : undefined
      }
      transition={{ delay: animationDelay }}
      onClick={onClick}
      sx={{
        width: size,
        height: size,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        filter: filterStyle,
        ...sxProp,
      }}
    >
      {/* SVG shape background */}
      <svg
        viewBox="-4 -4 108 108"
        width={size}
        height={size}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          filter: `drop-shadow(${glowShadow})`,
        }}
      >
        <GradientDefs
          id={cleanGradientId}
          gradient={config.gradient}
          bgColor={config.bgColor}
        />
        <defs>
          {/* specular gloss — enamel highlight */}
          <radialGradient id={glossId} cx="50%" cy="30%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          {/* beveled metal ring keyed to rarity */}
          <linearGradient id={rimMetalId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={rimMetal.light} />
            <stop offset="50%" stopColor={rimMetal.mid} />
            <stop offset="100%" stopColor={rimMetal.dark} />
          </linearGradient>
          {/* sheen sweep gradient */}
          <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={shapePath} />
          </clipPath>
        </defs>
        <path
          d={shapePath}
          fill={`url(#${cleanGradientId})`}
          stroke={earned ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)"}
          strokeWidth={rarityEffect.borderWidth}
        />
        {/* enamel gloss + earn sheen — earned only, clipped to the shape */}
        {earned && (
          <g clipPath={`url(#${clipId})`}>
            <ellipse
              cx="50"
              cy="28"
              rx="38"
              ry="24"
              fill={`url(#${glossId})`}
            />
            {effectiveAnimate && (
              <rect
                y="0"
                width="26"
                height="100"
                fill={`url(#${sheenId})`}
                transform="skewX(-16)"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  additive="sum"
                  from="-50 0"
                  to="150 0"
                  begin={`${animationDelay + 0.5}s`}
                  dur="1.1s"
                  repeatCount="1"
                  fill="freeze"
                />
              </rect>
            )}
          </g>
        )}
        {/* beveled metallic rim — material tier framing */}
        {earned && (
          <path
            d={shapePath}
            fill="none"
            stroke={`url(#${rimMetalId})`}
            strokeWidth={rarityEffect.borderWidth + 1}
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Icon overlay — hidden when unearned */}
      {earned && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DrawableIcon
            Icon={config.icon}
            color={config.iconColor}
            size={size}
            draw={effectiveAnimate && effectiveDrawIcon}
            scale={config.iconScale ?? 1}
            translate={config.iconTranslate ?? [0, 0]}
            animationDelay={animationDelay + 0.3}
          />
        </Box>
      )}
    </MotionBox>
  );
}

export default BadgeIcon;
