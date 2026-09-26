/**
 * Heraldry tincture & metal palette + deterministic pickers.
 *
 * Tinctures (field/charge colors) and metal ramps (rims) are *derived from the
 * live MUI theme* rather than fixed hex, so every crest/medallion/badge respects
 * light/dark mode and any user-customized theme (see ThemeMixer /
 * CustomThemePaletteInput) instead of clashing with it. `getTinctures`/`getMetals`
 * curate each theme color into a 3-stop ramp (shade/main/light) so the output
 * still reads as a "designed crest" rather than a flat swap to raw palette hex.
 *
 * @module heraldry
 */

import { darken, lighten } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

export interface Tincture {
  name: string;
  /** Primary fill */
  main: string;
  /** Darker stop (shadows / depth) */
  shade: string;
  /** Lighter stop (highlights) */
  light: string;
}

export interface MetalRamp {
  name: string;
  /** Top specular stop of the rim */
  light: string;
  /** Mid tone of the rim */
  mid: string;
  /** Bottom shadow stop of the rim */
  dark: string;
}

// ============================================================================
// Palette
// ============================================================================

export const TINCTURE_KEYS = [
  "or",
  "argent",
  "gules",
  "azure",
  "vert",
  "sable",
  "purpure",
] as const;
export type TinctureKey = (typeof TINCTURE_KEYS)[number];

export const METAL_KEYS = ["bronze", "silver", "gold", "platinum"] as const;
export type MetalKey = (typeof METAL_KEYS)[number];

/** Curate a theme color into a shade/main/light ramp (a 3-stop tincture). */
function ramp(name: TinctureKey, main: string, isDarkMode: boolean): Tincture {
  return {
    name,
    main,
    shade: darken(main, isDarkMode ? 0.35 : 0.3),
    light: lighten(main, isDarkMode ? 0.2 : 0.32),
  };
}

/**
 * Derive the seven canonical heraldic tinctures from the live theme palette —
 * respects light/dark mode and any user theme customization instead of a
 * fixed hex table.
 */
export function getTinctures(theme: Theme): Record<TinctureKey, Tincture> {
  const isDarkMode = theme.palette.mode === "dark";
  const p = theme.palette;
  return {
    or: ramp("or", p.warning.main, isDarkMode),
    argent: ramp("argent", p.grey[isDarkMode ? 600 : 300], isDarkMode),
    gules: ramp("gules", p.error.main, isDarkMode),
    azure: ramp("azure", p.info.main, isDarkMode),
    vert: ramp("vert", p.success.main, isDarkMode),
    sable: ramp("sable", p.grey[isDarkMode ? 300 : 900], isDarkMode),
    purpure: ramp("purpure", p.secondary.main, isDarkMode),
  };
}

/**
 * Derive the four metal ramps (rim finishes) from the live theme palette.
 * Silver/platinum stay neutral (grey scale, mode-stable); gold/bronze tie to
 * the theme's warning hue so a customized brand still reads as "gold-ish".
 */
export function getMetals(theme: Theme): Record<MetalKey, MetalRamp> {
  const isDarkMode = theme.palette.mode === "dark";
  const p = theme.palette;
  const goldBase = p.warning.main;
  return {
    bronze: {
      name: "bronze",
      light: lighten(darken(goldBase, 0.15), isDarkMode ? 0.1 : 0),
      mid: darken(goldBase, 0.15),
      dark: darken(goldBase, 0.45),
    },
    silver: {
      name: "silver",
      light: p.grey[100],
      mid: p.grey[300],
      dark: p.grey[500],
    },
    gold: {
      name: "gold",
      light: lighten(goldBase, 0.35),
      mid: goldBase,
      dark: darken(goldBase, 0.25),
    },
    platinum: {
      name: "platinum",
      light: p.common.white,
      mid: p.grey[200],
      dark: p.grey[400],
    },
  };
}

export type HeraldicDivision =
  "plain" | "per-pale" | "per-fess" | "chevron" | "bend";

const DIVISIONS: HeraldicDivision[] = [
  "plain",
  "per-pale",
  "per-fess",
  "chevron",
  "bend",
];

// Ascending metal tiers keyed to a magnitude (XP-scale). Highest first.
const METAL_TIERS: Array<{ min: number; key: MetalKey }> = [
  { min: 15000, key: "platinum" },
  { min: 5000, key: "gold" },
  { min: 1000, key: "silver" },
  { min: 0, key: "bronze" },
];

// ============================================================================
// Deterministic helpers
// ============================================================================

/** Stable 32-bit-ish hash of a seed string. Always non-negative. */
export function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Pick a field + charge tincture from a seed. The charge is always a different
 * tincture than the field so the crest reads with contrast.
 */
export function pickTinctures(
  seed: string,
  theme: Theme,
): {
  field: Tincture;
  charge: Tincture;
} {
  const tinctures = getTinctures(theme);
  const h = hashSeed(seed);
  const fieldIdx = h % TINCTURE_KEYS.length;
  const chargeOffset = 1 + ((h >> 3) % (TINCTURE_KEYS.length - 1));
  const chargeIdx = (fieldIdx + chargeOffset) % TINCTURE_KEYS.length;
  return {
    field: tinctures[TINCTURE_KEYS[fieldIdx]],
    charge: tinctures[TINCTURE_KEYS[chargeIdx]],
  };
}

/** Pick a heraldic division (ordinary) from a seed. */
export function pickDivision(seed: string): HeraldicDivision {
  const h = hashSeed(seed);
  return DIVISIONS[(h >> 5) % DIVISIONS.length];
}

/** Map an XP-scale magnitude to a metal ramp for the rim (visible progression). */
export function metalForTier(xpOrLevel: number, theme: Theme): MetalRamp {
  const v = Number.isFinite(xpOrLevel) ? Math.max(0, xpOrLevel) : 0;
  const tier =
    METAL_TIERS.find((t) => v >= t.min) ?? METAL_TIERS[METAL_TIERS.length - 1];
  return getMetals(theme)[tier.key];
}

/**
 * Parse a CSS color string (hex or rgb()/rgba(), the two formats this module
 * and MUI's darken()/lighten() helpers produce) into 0-1 RGB components.
 */
function parseRgb(color: string): [number, number, number] {
  const rgbMatch = color.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i,
  );
  if (rgbMatch) {
    return [
      Number(rgbMatch[1]) / 255,
      Number(rgbMatch[2]) / 255,
      Number(rgbMatch[3]) / 255,
    ];
  }
  const hex = color.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

/** WCAG relative luminance (0=black, 1=white) of a hex or rgb()/rgba() color. */
function relativeLuminance(color: string): number {
  const [r, g, b] = parseRgb(color);
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Return a legible ink color (near-black or near-white) for text/charges laid
 * over the given background hex, using WCAG relative luminance.
 */
export function readableInk(hexColor: string): string {
  return relativeLuminance(hexColor) > 0.45 ? "#1a1a1a" : "#f5f5f5";
}

/**
 * Metallic outer-glow filter for charge lettering/devices that may end up dark-on-dark
 * (e.g. ink picked against the field color while the charge visually sits over a
 * separately-dark division color). Tints the glow with the medallion's own rim metal
 * so it reads as a metallic edge rather than a generic halo. Returns `undefined` when
 * none of the given background colors are dark enough to need it.
 */
export function emblemGlowFilter(
  metalLight: string,
  ...bgColors: string[]
): string | undefined {
  const needsGlow = bgColors.some((c) => relativeLuminance(c) <= 0.45);
  if (!needsGlow) return undefined;
  return (
    `drop-shadow(0 0 1.5px ${metalLight}) ` +
    `drop-shadow(0 0 3px ${metalLight})`
  );
}
