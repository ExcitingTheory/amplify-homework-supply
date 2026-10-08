/**
 * grainySheen — Textured two-color gradient (film-grain overlay + animated
 * diagonal sheen) for use on decorative gradient surfaces. Colors are always
 * passed in by the caller (theme tinctures, SEMANTIC_THEME colors, etc.) —
 * this module only owns the noise/sheen texture, not any color choices.
 *
 * @module grainySheen
 */

import type { SxProps, Theme } from "@mui/material/styles";

const GRAIN_NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const SHEEN_MASK_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.4 0 0 0 -.7'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E\")";

export interface GrainySheenOptions {
  /** Gradient angle in degrees. */
  angle?: number;
  /** Sheen band slant in degrees. */
  tilt?: number;
  /** Seconds between sheen passes. */
  every?: number;
  /** Seconds for the sheen to cross the surface. */
  sweep?: number;
  /** Sheen opacity, 0-1. */
  shine?: number;
  /** Grain texture opacity, 0-1. */
  grain?: number;
  /** Whether to animate the sheen — set false for a static grainy gradient only. */
  animate?: boolean;
}

/**
 * Returns an MUI `sx` object applying a film-grain overlay and animated sheen
 * on top of a two-color linear gradient. The container gets
 * `position:relative; isolation:isolate; overflow:hidden` so the pseudo-element
 * layers stay clipped and normal-flow children (e.g. monogram text) render on
 * top of them. Respects `prefers-reduced-motion`.
 */
export function getGrainySheenSx(
  colorA: string,
  colorB: string,
  {
    angle = 135,
    tilt = 112,
    every = 9,
    sweep = 3,
    shine = 0.16,
    grain = 0.35,
    animate = true,
  }: GrainySheenOptions = {},
): SxProps<Theme> {
  const sweepPct = Math.min(100, Math.round((sweep / every) * 1000) / 10);

  return {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    background: `linear-gradient(${angle}deg, ${colorA}, ${colorB})`,
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      zIndex: -2,
      pointerEvents: "none",
      background: `${GRAIN_NOISE_SVG} 0 0 / 240px 240px`,
      mixBlendMode: "overlay",
      opacity: grain,
    },
    ...(animate && {
      "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: `linear-gradient(${tilt}deg, transparent 40%, rgba(255,255,255,.3) 46%, #fff 50%, rgba(255,255,255,.3) 54%, transparent 60%) 100% 0 / 300% 100% no-repeat`,
        WebkitMask: `${SHEEN_MASK_SVG} 0 0 / 240px 240px`,
        mask: `${SHEEN_MASK_SVG} 0 0 / 240px 240px`,
        opacity: shine,
        animation: `grainySheenPass ${every}s ease-in-out infinite`,
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
      },
      "@keyframes grainySheenPass": {
        "0%": { backgroundPosition: "100% 0" },
        [`${sweepPct}%`]: { backgroundPosition: "0% 0" },
        "100%": { backgroundPosition: "0% 0" },
      },
    }),
  };
}
