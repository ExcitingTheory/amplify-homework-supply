/**
 * generatePixelSprite — Procedural symmetric pixel creature generator.
 *
 * Inspired by Deep-Fold/SpriteGenerator (MIT). Uses a seeded PRNG
 * to generate a symmetric pixel grid with body/edge/shading cells,
 * then renders to a canvas data URL or inline SVG rects.
 *
 * The creature "evolves" at higher stages: wider grid, more colors,
 * additional limb probability.
 *
 * @module generatePixelSprite
 */

import { getAccessoryOverlay } from "./mascotAccessories";

// ============================================================================
// Seeded PRNG (mulberry32)
// ============================================================================

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ============================================================================
// Harmonic palette (HSL-derived from seed) + semantic slots
// ============================================================================

/** Semantic palette slots — stable indices consumed by the renderer. */
const P = {
  BODY: 0,
  OUTLINE: 1,
  LIGHT: 2,
  LIGHT2: 3,
  SHADOW: 4,
  SHADOW2: 5,
  EYE: 6,
  PUPIL: 7,
  HILITE: 8,
  BLUSH: 9,
  ACCENT: 10,
} as const;

/** Grid cell codes. Exported so tests + accessory overlays can align to anatomy. */
export const CELL = {
  EMPTY: 0,
  BODY: 1,
  OUTLINE: 2,
  LIGHT: 3,
  LIGHT2: 4,
  SHADOW: 5,
  SHADOW2: 6,
  EYE_WHITE: 7,
  PUPIL: 8,
  EYE_HILITE: 9,
  MOUTH: 10,
  BLUSH: 11,
  FOOT: 12,
  ACCENT: 13,
} as const;

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) =>
    lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/** Build a cohesive, "designed" palette from a seeded base hue (not random per-stage swatches). */
function buildPalette(rand: () => number, stage: number): string[] {
  const baseHue = Math.floor(rand() * 360);
  const sat = 44 + rand() * 20; // 44–64
  const accentHue = (baseHue + (rand() < 0.5 ? 150 : 205)) % 360;
  const palette: string[] = [];
  palette[P.BODY] = hslToHex(baseHue, sat, 60);
  palette[P.OUTLINE] = hslToHex(baseHue, sat * 0.6, 20);
  palette[P.LIGHT] = hslToHex(baseHue, sat, 73);
  palette[P.LIGHT2] = hslToHex(baseHue, sat * 0.85, 85);
  palette[P.SHADOW] = hslToHex(baseHue, sat, 46);
  palette[P.SHADOW2] = hslToHex(baseHue, sat, 33);
  palette[P.EYE] = "#ffffff";
  palette[P.PUPIL] = hslToHex(baseHue, sat * 0.5, 16);
  palette[P.HILITE] = "#ffffff";
  palette[P.BLUSH] = hslToHex((baseHue + 330) % 360, 72, 74);
  palette[P.ACCENT] = hslToHex(accentHue, sat + 12, 58);
  // Stage-scaled accent ramp — richer palettes at higher stages.
  for (let i = 0; i < stage; i++) {
    palette.push(hslToHex((accentHue + 26 * (i + 1)) % 360, sat, 52 + i * 3));
  }
  return palette;
}

// ============================================================================
// Sprite grid generation
// ============================================================================

export interface SpriteConfig {
  /** Deterministic seed string (e.g. studentId, squadId) */
  seed: string;
  /** Evolution stage (1-5) — affects grid size, palette, complexity */
  stage?: number;
  /** Pixel size of each cell */
  cellSize?: number;
}

export interface EyeAnchor {
  x: number;
  y: number;
}

export interface SpriteData {
  /** Grid width (half — the full sprite is mirrored) */
  halfWidth: number;
  /** Grid height */
  height: number;
  /** 2D half-grid of CELL codes (mirrored horizontally when rendered) */
  grid: number[][];
  /** Palette colors for this sprite (see semantic slots P) */
  palette: string[];
  /** Background color */
  bgColor: string;
  /** Full-grid eye anchor cells — align accessories (glasses/eyepatch) here */
  eyes: { left: EyeAnchor; right: EyeAnchor };
  /** Row index of the eye/face band */
  faceRow: number;
  /** Topmost body row (excludes antenna/feet) — anchor for hats */
  headTopRow: number;
  /** Widest full-grid body span in cells — hat sizing */
  bodyMaxWidth: number;
  /** Clamped evolution stage */
  stage: number;
}

export function generateSpriteData(config: SpriteConfig): SpriteData {
  const { seed, stage = 1 } = config;
  const clampedStage = Math.max(1, Math.min(5, stage));

  const seedNum = hashString(seed + "-" + clampedStage);
  const rand = mulberry32(seedNum);

  // Higher-resolution grid grows with stage (more, smaller cells → more detail).
  const halfWidth = 5 + clampedStage * 2; // 7 → 15
  const height = 15 + clampedStage * 3; // 18 → 30
  const fullWidth = halfWidth * 2;

  const grid: number[][] = Array.from({ length: height }, () =>
    new Array<number>(halfWidth).fill(CELL.EMPTY),
  );
  const set = (x: number, y: number, v: number) => {
    if (y >= 0 && y < height && x >= 0 && x < halfWidth) grid[y][x] = v;
  };
  const get = (x: number, y: number): number =>
    y >= 0 && y < height && x >= 0 && x < halfWidth ? grid[y][x] : CELL.EMPTY;
  const isSolid = (c: number) =>
    c === CELL.BODY ||
    c === CELL.LIGHT ||
    c === CELL.LIGHT2 ||
    c === CELL.SHADOW ||
    c === CELL.SHADOW2;

  const top = 1; // reserve row 0 for ears/antenna
  const bottom = height - 2; // reserve last row for feet
  const bodyRows = bottom - top + 1;

  // 1) Rounded "egg" silhouette — constrained noise, so it always reads as a body.
  const headBias = 0.9 + rand() * 0.5;
  const jitter = 0.5 + rand() * 0.8;
  const rowNoise: number[] = [];
  for (let y = 0; y < height; y++) rowNoise.push((rand() - 0.45) * jitter);
  for (let y = top; y <= bottom; y++) {
    const yy = (y - top + 0.5) / bodyRows;
    const oval = Math.sqrt(Math.max(0, 1 - Math.pow(2 * yy - 1, 2)));
    let rowRadius = halfWidth * oval * (1 + 0.28 * headBias * (1 - yy));
    rowRadius = Math.min(halfWidth, rowRadius + rowNoise[y]);
    for (let x = 0; x < halfWidth; x++) {
      if (halfWidth - x <= rowRadius) set(x, y, CELL.BODY);
    }
    set(halfWidth - 1, y, CELL.BODY); // spine → guarantees a connected body
  }

  // De-spike: drop stray body cells with no orthogonal body neighbour.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      if (grid[y][x] !== CELL.BODY) continue;
      const rightSolid = x === halfWidth - 1 || isSolid(get(x + 1, y));
      const n =
        (isSolid(get(x, y - 1)) ? 1 : 0) +
        (isSolid(get(x, y + 1)) ? 1 : 0) +
        (isSolid(get(x - 1, y)) ? 1 : 0) +
        (rightSolid ? 1 : 0);
      if (n === 0) set(x, y, CELL.EMPTY);
    }
  }

  // 2) Volume shading — top-centre light, quantised into bands for a rounded look.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      if (grid[y][x] !== CELL.BODY) continue;
      const ny = (y - top) / bodyRows; // 0 top .. 1 bottom
      const nx = (halfWidth - 1 - x) / halfWidth; // 0 centre .. 1 outer edge
      let shade = 0.42 * ny + 0.4 * nx;
      // Belly highlight (lower centre) lifts the tummy toward the light.
      const dxc = (halfWidth - 1 - x) / (halfWidth * 0.5);
      const dyc = (y - (top + bodyRows * 0.64)) / (bodyRows * 0.26);
      if (dxc * dxc + dyc * dyc < 1) shade -= 0.16;
      const band =
        shade < 0.12
          ? CELL.LIGHT2
          : shade < 0.3
            ? CELL.LIGHT
            : shade < 0.52
              ? CELL.BODY
              : shade < 0.74
                ? CELL.SHADOW
                : CELL.SHADOW2;
      set(x, y, band);
    }
  }

  // 3) Outline — one-cell rim, computed from a solidity snapshot so setting
  //    OUTLINE (which isn't "solid") doesn't cascade across the whole body.
  const solidSnap: boolean[][] = grid.map((row) => row.map((c) => isSolid(c)));
  const solidAt = (x: number, y: number): boolean =>
    y >= 0 && y < height && x >= 0 && x < halfWidth ? solidSnap[y][x] : false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      if (!solidSnap[y][x]) continue;
      const rightSolid = x === halfWidth - 1 || solidAt(x + 1, y);
      const exposed =
        !solidAt(x, y - 1) ||
        !solidAt(x, y + 1) ||
        !solidAt(x - 1, y) ||
        !rightSolid;
      if (exposed) set(x, y, CELL.OUTLINE);
    }
  }

  // 4) Feet — a nub under the belly (mirrored → a symmetric pair).
  let baseRow = bottom;
  while (baseRow > top && get(halfWidth - 1, baseRow) === CELL.EMPTY) baseRow--;
  const footY = Math.min(height - 1, baseRow + 1);
  const fcx = halfWidth - Math.max(2, Math.round(halfWidth * 0.34));
  const footW = Math.max(1, Math.round(halfWidth * 0.2));
  for (let d = 0; d < footW; d++) {
    if (fcx - d >= 0) set(fcx - d, footY, CELL.FOOT);
  }

  // 5) Eyes — round dark "bead" eyes with a catchlight (baby-schema = cute).
  const eyeW = Math.max(2, Math.round(halfWidth * 0.26));
  const eyeH = Math.max(2, Math.round(height * 0.15));
  const eyeTop = Math.max(top + 1, Math.round(height * 0.34));
  const eyeX0 = Math.max(1, Math.round(halfWidth * 0.26));
  const pcx = eyeX0 + Math.floor(eyeW / 2);
  const pcy = eyeTop + Math.floor(eyeH / 2);
  const roundEye = eyeW >= 3 && eyeH >= 3;
  // Carve a face patch so the eye reads on any body tone.
  for (let yy = eyeTop - 1; yy <= eyeTop + eyeH; yy++) {
    for (let xx = eyeX0 - 1; xx <= eyeX0 + eyeW; xx++) {
      if (get(xx, yy) === CELL.EMPTY) set(xx, yy, CELL.BODY);
    }
  }
  // Dark pupil bead with rounded corners.
  for (let yy = eyeTop; yy < eyeTop + eyeH; yy++) {
    for (let xx = eyeX0; xx < eyeX0 + eyeW; xx++) {
      const corner =
        roundEye &&
        (yy === eyeTop || yy === eyeTop + eyeH - 1) &&
        (xx === eyeX0 || xx === eyeX0 + eyeW - 1);
      if (!corner) set(xx, yy, CELL.PUPIL);
    }
  }
  set(eyeX0, eyeTop, CELL.EYE_WHITE); // top-left catchlight sparkle

  // 6) Mouth — seeded expression drives personality ("funny").
  const mouthRow = Math.min(
    height - 2,
    eyeTop + eyeH + Math.round(height * 0.06),
  );
  const expressions: Array<Array<[number, number]>> = [
    [
      [0, 0],
      [1, 0],
      [2, 1],
    ], // smile
    [
      [0, 0],
      [0, 1],
    ], // "o"
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ], // cat :3
    [
      [0, 0],
      [1, 0],
    ], // flat
  ];
  const expr = expressions[Math.floor(rand() * expressions.length)];
  for (const [dx, ry] of expr) {
    const mx = halfWidth - 1 - dx;
    if (isSolid(get(mx, mouthRow + ry))) set(mx, mouthRow + ry, CELL.MOUTH);
  }

  // 7) Blush (stage ≥ 2) — instant endearment.
  if (clampedStage >= 2) {
    const by = pcy + Math.max(1, Math.round(eyeH * 0.5));
    const bx = Math.max(0, eyeX0 - 1);
    if (isSolid(get(bx, by))) set(bx, by, CELL.BLUSH);
    if (isSolid(get(bx - 1, by))) set(bx - 1, by, CELL.BLUSH);
  }

  // 8) Ears / antenna (stage-gated accessory for variety + character).
  if (clampedStage >= 4) {
    set(halfWidth - 1, 0, CELL.ACCENT); // antenna stalk at head centre
    set(halfWidth - 1, 1, CELL.ACCENT);
  } else if (clampedStage >= 3 && isSolid(get(eyeX0 + 1, top))) {
    set(eyeX0 + 1, 0, CELL.ACCENT); // little ear tuft
  }

  const palette = buildPalette(rand, clampedStage);

  // Head metrics (exclude antenna + feet) so hats can rest on the crown.
  let headTopRow = height;
  let bodyMaxWidth = 0;
  for (let y = 0; y < height; y++) {
    let minX = halfWidth;
    for (let x = 0; x < halfWidth; x++) {
      const c = grid[y][x];
      if (c === CELL.EMPTY || c === CELL.ACCENT || c === CELL.FOOT) continue;
      if (x < minX) minX = x;
    }
    if (minX < halfWidth) {
      if (y < headTopRow) headTopRow = y;
      const w = fullWidth - 2 * minX;
      if (w > bodyMaxWidth) bodyMaxWidth = w;
    }
  }

  return {
    halfWidth,
    height,
    grid,
    palette,
    bgColor: "transparent",
    eyes: {
      left: { x: pcx, y: pcy },
      right: { x: fullWidth - 1 - pcx, y: pcy },
    },
    faceRow: eyeTop,
    headTopRow: Math.min(headTopRow, height - 1),
    bodyMaxWidth: Math.max(1, bodyMaxWidth),
    stage: clampedStage,
  };
}

// ============================================================================
// Render to SVG string
// ============================================================================

/** Map each cell code to a semantic palette slot. */
const PALETTE_INDEX: Record<number, number> = {
  [CELL.BODY]: P.BODY,
  [CELL.OUTLINE]: P.OUTLINE,
  [CELL.LIGHT]: P.LIGHT,
  [CELL.LIGHT2]: P.LIGHT2,
  [CELL.SHADOW]: P.SHADOW,
  [CELL.SHADOW2]: P.SHADOW2,
  [CELL.EYE_WHITE]: P.EYE,
  [CELL.PUPIL]: P.PUPIL,
  [CELL.EYE_HILITE]: P.HILITE,
  [CELL.MOUTH]: P.PUPIL,
  [CELL.BLUSH]: P.BLUSH,
  [CELL.FOOT]: P.ACCENT,
  [CELL.ACCENT]: P.ACCENT,
};

/** Resolve a grid cell code to its rendered colour. */
function cellColor(cell: number, palette: string[]): string {
  return palette[PALETTE_INDEX[cell] ?? P.BODY] || palette[P.BODY];
}

export function renderSpriteSvg(
  data: SpriteData,
  cellSize: number = 4,
  accessory?: string,
): string {
  const { halfWidth, height, grid, palette } = data;
  const fullWidth = halfWidth * 2;
  const svgW = fullWidth * cellSize;
  const svgH = height * cellSize;

  const rects: string[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      const cell = grid[y][x];
      if (cell === CELL.EMPTY) continue;

      const color = cellColor(cell, palette);

      // Left half
      rects.push(
        `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`,
      );
      // Mirror right half
      const mirrorX = (fullWidth - 1 - x) * cellSize;
      rects.push(
        `<rect x="${mirrorX}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`,
      );
    }
  }

  // Overlay the real DiceBear accessory (vector). Hats sandwich the body: a
  // full copy `back` (brim/back peeks past the silhouette) then the body then
  // a crown-only `front` copy (covers the forehead). Grow the viewBox to fit.
  const { back, front, bounds } = accessory
    ? getAccessoryOverlay(data, accessory, cellSize)
    : { back: "", front: "", bounds: null };

  const margin = cellSize;
  let minX = -margin;
  let minY = -margin;
  let maxX = svgW + margin;
  let maxY = svgH + margin;
  if (bounds) {
    minX = Math.min(minX, bounds.minX - margin);
    minY = Math.min(minY, bounds.minY - margin);
    maxX = Math.max(maxX, bounds.maxX + margin);
    maxY = Math.max(maxY, bounds.maxY + margin);
  }
  const vbW = maxX - minX;
  const vbH = maxY - minY;
  const body = rects.join("");
  const layers = `${back}${body}${front}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(2)} ${minY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}" width="${vbW.toFixed(2)}" height="${vbH.toFixed(2)}" shape-rendering="crispEdges">${layers}</svg>`;
}

// ============================================================================
// Combined convenience function
// ============================================================================

export function generatePixelSpriteSvg(
  seed: string,
  stage: number = 1,
  cellSize: number = 4,
  accessory?: string,
): string {
  const data = generateSpriteData({ seed, stage, cellSize });
  return renderSpriteSvg(data, cellSize, accessory);
}
