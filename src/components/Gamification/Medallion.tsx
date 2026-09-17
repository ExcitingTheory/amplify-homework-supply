/**
 * Medallion — a single SVG primitive owning the shared crest/badge finish:
 * a heraldic silhouette (shield | disc | hex) with a metallic rim, inner bevel,
 * top gloss, an optional heraldic division, and a centered charge slot.
 *
 * Pure & context-free: it takes explicit color/metal props and (optionally) a
 * `reducedMotion` flag. OS-level reduced motion is auto-detected. Hover tilt is
 * driven by framer-motion (already used across gamification) so it stays
 * CSP-safe via inline style transforms.
 *
 * @module Medallion
 */

import React, { useId } from "react";
import Box, { type BoxProps } from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { motion, type HTMLMotionProps } from "framer-motion";
import { SEMANTIC_THEME } from "@/themes/semanticTheme";
import type { MetalRamp, HeraldicDivision } from "@/themes/heraldry";
import { SHAPE_PATHS } from "./BadgeIcon";

const MotionBox = motion.create(Box) as React.FC<
  BoxProps & HTMLMotionProps<"div">
>;

export type MedallionShape = "shield" | "disc" | "hex";

export interface MedallionProps {
  /** Silhouette. Defaults to 'shield'. */
  shape?: MedallionShape;
  /** Rendered size in px. Defaults to 64. */
  size?: number;
  /** Metal ramp for the rim (see heraldry.metalForTier). */
  rimMetal: MetalRamp;
  /** Primary field color. */
  fieldColor: string;
  /** Secondary field color for a heraldic division. Falls back to rim mid tone. */
  divisionColor?: string;
  /** Heraldic division/ordinary. Defaults to 'plain'. */
  division?: HeraldicDivision;
  /** Centered charge (initials, icon device, count, etc.). */
  charge?: React.ReactNode;
  /** Accessible label for the medallion. */
  ariaLabel?: string;
  /** App-level reduced-motion flag; OS-level is auto-detected regardless. */
  reducedMotion?: boolean;
  sx?: BoxProps["sx"];
}

const SHAPE_TO_PATH_KEY = {
  shield: "shield",
  disc: "circle",
  hex: "hexagon",
} as const;

export function Medallion({
  shape = "shield",
  size = 64,
  rimMetal,
  fieldColor,
  divisionColor,
  division = "plain",
  charge,
  ariaLabel,
  reducedMotion,
  sx,
}: MedallionProps) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const motionOff = reducedMotion || systemReduced;

  const path = SHAPE_PATHS[SHAPE_TO_PATH_KEY[shape]];
  const rimId = `med-rim-${uid}`;
  const glossId = `med-gloss-${uid}`;
  const bevelId = `med-bevel-${uid}`;
  const clipId = `med-clip-${uid}`;

  const divColor = divisionColor ?? rimMetal.mid;

  const hover = motionOff
    ? undefined
    : { rotateX: 6, rotateY: -6, scale: 1.04 };

  return (
    <MotionBox
      whileHover={hover}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      sx={{
        width: size,
        height: size,
        position: "relative",
        transformStyle: "preserve-3d",
        perspective: 400,
        ...sx,
      }}
    >
      <svg
        viewBox="-4 -4 108 108"
        width={size}
        height={size}
        role="img"
        aria-label={ariaLabel ?? "Heraldic medallion"}
        style={{
          display: "block",
          filter: `drop-shadow(0 2px ${SEMANTIC_THEME.elevation.floatingAction}px rgba(0,0,0,0.35))`,
        }}
      >
        <defs>
          <linearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={rimMetal.light} />
            <stop offset="50%" stopColor={rimMetal.mid} />
            <stop offset="100%" stopColor={rimMetal.dark} />
          </linearGradient>
          <radialGradient id={glossId} cx="50%" cy="30%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id={bevelId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="45%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {/* field */}
          <path d={path} fill={fieldColor} />
          {/* heraldic division overlay */}
          {division === "per-pale" && (
            <rect x="50" y="0" width="50" height="100" fill={divColor} />
          )}
          {division === "per-fess" && (
            <rect x="0" y="50" width="100" height="50" fill={divColor} />
          )}
          {division === "chevron" && (
            <polygon points="50,40 100,100 0,100" fill={divColor} />
          )}
          {division === "bend" && (
            <polygon points="100,0 100,100 0,100" fill={divColor} />
          )}
          {/* inner bevel shading */}
          <path d={path} fill={`url(#${bevelId})`} />
          {/* top specular gloss */}
          <ellipse cx="50" cy="30" rx="40" ry="26" fill={`url(#${glossId})`} />
        </g>

        {/* metallic rim */}
        <path
          d={path}
          fill="none"
          stroke={`url(#${rimId})`}
          strokeWidth={5}
          strokeLinejoin="round"
        />
      </svg>

      {charge != null && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {charge}
        </Box>
      )}
    </MotionBox>
  );
}

export default Medallion;
