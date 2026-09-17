/**
 * mascotAccessories — Overlays the *real* DiceBear (avataaars) accessory SVG the
 * mascot has "borrowed" (see the mascot-borrow anti-badge).
 *
 * The vector artwork is vendored in `dicebearAccessories.generated.json` (built
 * from `@dicebear/avataaars`; artwork "free for personal and commercial use" by
 * Pablo Stanley, DiceBear code MIT). Each entry is raw SVG markup with a
 * `__COLOR__` token for the frame tint.
 *
 * Placement uses a two-point transform: the avataaars eye reference points are
 * mapped onto the mascot's own eye anchors (`SpriteData.eyes`), so glasses sit
 * on the eyes and the eyepatch lands over one eye across every stage/scale.
 * Hats (avataaars `top`) live in a different coordinate space, so they are
 * placed by scaling to the head width and resting on the crown.
 *
 * @module mascotAccessories
 */

import { CELL, type SpriteData } from "./generatePixelSprite";
import accessorySvgs from "./dicebearAccessories.generated.json";

const ACCESSORIES = accessorySvgs as Record<string, string>;

/**
 * avataaars eye pupil reference points, in the accessory artwork's own
 * coordinate space (measured from the vendored SVGs). Mapping these onto the
 * mascot eye anchors positions and scales every accessory correctly.
 */
const AV_EYE_L = { x: 44, y: 71 };
const AV_EYE_R = { x: 98, y: 71 };

/** Default frame tint (avataaars `colors.accessories`). */
const DEFAULT_FRAME = "#2b3038";

/** Default hat tint (avataaars `colors.hatColor`). */
const DEFAULT_HAT = "#5a4a6a";

/**
 * Hats live in avataaars' `top` component (full-avatar coords). `cx`/`openTop`
 * come from a top-down centreline alpha scan: `openTop` is the first colour→none
 * transition, i.e. the top of the head opening.
 *
 * `mode` controls how the front layer is built:
 * - "crown" (default): front is clipped to just the crown above `openTop`
 *   (partial hat), sat on the mascot head-top — used for hats whose opening
 *   closely matches a round head (fedora, beanies, cap).
 * - "full": front is a full, unclipped copy (needed when the crown-only clip
 *   doesn't cover enough forehead), further clipped to the mascot's own head
 *   width so any tails/folds wider than the head get cut off (turban).
 * - "frontOnly": front only (no back layer), scaled up via `fitScale` so the
 *   hood is generous enough that the head never peeks out past its edges
 *   (hijab).
 */
const HAT_BBOX: Record<
  string,
  {
    x: number;
    y: number;
    w: number;
    h: number;
    cx: number;
    openTop: number;
    mode?: "crown" | "full" | "frontOnly";
    fitScale?: number;
  }
> = {
  hat: { x: 11, y: 2, w: 244, h: 136.77, cx: 133, openTop: 58 },
  turban: { x: 49, y: 3, w: 168, h: 138, cx: 133, openTop: 72, mode: "full" },
  hijab: {
    x: 51.72,
    y: 20.93,
    w: 168.48,
    h: 259.07,
    cx: 136,
    openTop: 54,
    mode: "frontOnly",
    fitScale: 1.3,
  },
  winterHat1: { x: 63, y: 20, w: 140, h: 165.01, cx: 133, openTop: 88 },
  winterHat02: { x: 61, y: 0, w: 144, h: 250, cx: 133, openTop: 78 },
  winterHat03: { x: 64, y: 0, w: 138, h: 104.51, cx: 133, openTop: 88 },
  winterHat04: { x: 64, y: 4, w: 138, h: 100.51, cx: 133, openTop: 88 },
};

/** avataaars head width (in the `top` coord space) that hats hug. */
const AV_FIT_WIDTH = 140;

/** DiceBear ids the mascot knows how to wear (eyewear + hats). */
export function isKnownAccessory(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(ACCESSORIES, id);
}

/** Rendered pixel-space bounds of an overlay, so the sprite viewBox can grow. */
export interface OverlayBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Eyewear bounding boxes in the artwork's own coordinate space (measured). */
const ACC_BBOX: Record<string, { x: number; y: number; w: number; h: number }> =
  {
    kurt: { x: 5.76, y: 45.63, w: 130.47, h: 51.3 },
    prescription01: { x: 7.99, y: 50.99, w: 125.94, h: 39.83 },
    prescription02: { x: 6, y: 50, w: 130, h: 43 },
    round: { x: 8, y: 45.98, w: 126, h: 50.02 },
    sunglasses: { x: 7.99, y: 50.99, w: 125.94, h: 39.83 },
    wayfarers: { x: 7, y: 50, w: 128.98, h: 43 },
    eyepatch: { x: 8, y: 4, w: 86.97, h: 87.65 },
  };

/**
 * Build the SVG overlay for a borrowed accessory plus its rendered bounds.
 *
 * Most hats render as a **sandwich**: a full, unclipped copy goes `back`
 * (drawn behind the body, so the brim/back peeks out past the head silhouette
 * like a real hat wrapping around the head), and a front copy — either
 * crown-only or full, per `mode` — goes over the forehead. `frontOnly` hats
 * (hijab) skip the back layer entirely. Eyewear/eyepatch is `front` only,
 * aligned to the eye anchors.
 *
 * The returned groups override `shape-rendering` so the crisp-edged pixel body
 * doesn't force the vector accessory to render blocky.
 */
export function getAccessoryOverlay(
  data: SpriteData,
  id: string,
  cellSize = 4,
  color?: string,
): { back: string; front: string; bounds: OverlayBounds | null } {
  const markup = ACCESSORIES[id];
  if (!markup) return { back: "", front: "", bounds: null };

  const hatBox = HAT_BBOX[id];

  if (hatBox) {
    const mode = hatBox.mode ?? "crown";
    const { s, tx, ty } = hatParams(data, hatBox, cellSize, hatBox.fitScale);
    const tinted = markup.split("__COLOR__").join(color ?? DEFAULT_HAT);
    const transform = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`;
    const fullGroup = `<g transform="${transform}" shape-rendering="geometricPrecision">${tinted}</g>`;

    const bounds = {
      minX: tx + (hatBox.x - 20) * s,
      minY: ty + hatBox.y * s,
      maxX: tx + (hatBox.x + hatBox.w + 20) * s,
      maxY: ty + hatBox.h * s,
    };

    if (mode === "frontOnly") {
      // e.g. hijab — one generously-scaled copy in front, no back layer, so
      // the hood fully contains the head with nothing peeking past its edges.
      // The body layer is already drawn beneath this (see renderSpriteSvg's
      // back+body+front order), so the face opening is naturally backed by
      // the mascot's own pixels — no synthetic fill needed.
      return { back: "", front: fullGroup, bounds };
    }

    // Back layer: the full hat, unclipped, drawn behind the body.
    const back = fullGroup;

    let front: string;
    if (mode === "full") {
      // e.g. turban — a full copy in front, clipped to the mascot's own head
      // width so any drooping side tails wider than the head get cut off.
      const headWidthPx = data.bodyMaxWidth * cellSize * 1.08;
      const centreX = data.halfWidth * cellSize;
      const clipId = `hattailclip-${id}`;
      const clip = `<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${(centreX - headWidthPx / 2).toFixed(1)}" y="-1000" width="${headWidthPx.toFixed(1)}" height="2000"/></clipPath>`;
      front = `<g>${clip}<g clip-path="url(#${clipId})">${fullGroup}</g></g>`;
    } else {
      // Default "crown" mode — only the crown above the head-opening
      // (partial hat), drawn over the forehead so it reads as wrapping.
      const clipPad = 8; // keep a sliver of band below the opening top
      const clipBottom = hatBox.openTop + clipPad;
      const clipId = `hatclip-${id}`;
      const clip = `<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${(hatBox.x - 20).toFixed(1)}" y="-300" width="${(hatBox.w + 40).toFixed(1)}" height="${(300 + clipBottom).toFixed(1)}"/></clipPath>`;
      front = `<g transform="${transform}">${clip}<g clip-path="url(#${clipId})" shape-rendering="geometricPrecision">${tinted}</g></g>`;
    }

    return { back, front, bounds };
  }

  // Eyewear: align to the eye anchors, front layer only.
  const { s, tx, ty } = eyewearParams(data, cellSize);
  const bbox = ACC_BBOX[id];
  const bounds = bbox
    ? {
        minX: tx + bbox.x * s,
        minY: ty + bbox.y * s,
        maxX: tx + (bbox.x + bbox.w) * s,
        maxY: ty + (bbox.y + bbox.h) * s,
      }
    : null;
  const tinted = markup.split("__COLOR__").join(color ?? DEFAULT_FRAME);
  const transform = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})`;
  const eyewearGroup = `<g transform="${transform}" shape-rendering="geometricPrecision">${tinted}</g>`;

  // Eyepatch: the strap arms can extend past the mascot's actual body outline
  // at some stages/seeds. Rather than repositioning it, crop it to the real
  // body silhouette (not just a rectangle), so whatever pokes out beyond the
  // creature's own shape is simply cut off — the strap disappears behind the
  // silhouette edge instead of floating past it.
  if (id === "eyepatch") {
    const clipId = `eyepatchclip-${eyepatchClipSeq++}`;
    const clip = silhouetteClipPath(data, cellSize, clipId);
    const front = `<g>${clip}<g clip-path="url(#${clipId})">${eyewearGroup}</g></g>`;
    return { back: "", front, bounds };
  }

  return { back: "", front: eyewearGroup, bounds };
}

/** Disambiguates clip-path ids when multiple mascots render on one page. */
let eyepatchClipSeq = 0;

/**
 * Build a `<clipPath>` tracing the mascot's actual pixel silhouette (per-row
 * left/right extents, mirrored), so accessories can be cropped to the real
 * body shape instead of a rectangular approximation.
 */
function silhouetteClipPath(
  data: SpriteData,
  cellSize: number,
  clipId: string,
): string {
  const rightPts: string[] = [];
  const leftPts: string[] = [];
  for (let y = 0; y < data.height; y++) {
    let minX = data.halfWidth;
    for (let x = 0; x < data.halfWidth; x++) {
      if (data.grid[y][x] !== CELL.EMPTY && x < minX) minX = x;
    }
    if (minX >= data.halfWidth) continue; // empty row — no silhouette here
    const leftPx = (minX * cellSize).toFixed(2);
    const rightPx = ((data.halfWidth * 2 - minX) * cellSize).toFixed(2);
    const yTop = (y * cellSize).toFixed(2);
    const yBot = ((y + 1) * cellSize).toFixed(2);
    rightPts.push(`${rightPx},${yTop}`, `${rightPx},${yBot}`);
    leftPts.unshift(`${leftPx},${yTop}`, `${leftPx},${yBot}`);
  }
  const points = [...rightPts, ...leftPts].join(" ");
  return `<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><polygon points="${points}"/></clipPath>`;
}

/** Map the two avataaars eye points onto the mascot eye anchors. */
function eyewearParams(
  data: SpriteData,
  cellSize: number,
): { s: number; tx: number; ty: number } {
  const { left: L, right: R } = data.eyes;
  const lx = (L.x + 0.5) * cellSize;
  const rx = (R.x + 0.5) * cellSize;
  const ey = (L.y + 0.5) * cellSize;
  const s = (rx - lx) / (AV_EYE_R.x - AV_EYE_L.x);
  return { s, tx: lx - AV_EYE_L.x * s, ty: ey - AV_EYE_L.y * s };
}

/**
 * Anchor the hat's opening-top onto the mascot head-top: scale by the head-fit
 * width (times an optional per-hat `fitScale`), then map the measured
 * `(cx, openTop)` point to `(headCentre, headTop)`, dipping the crown slightly
 * onto the head so there is no gap.
 */
function hatParams(
  data: SpriteData,
  bbox: { cx: number; openTop: number },
  cellSize: number,
  fitScale: number = 1,
): { s: number; tx: number; ty: number } {
  const headWidthPx = data.bodyMaxWidth * cellSize;
  const centreX = data.halfWidth * cellSize; // full-grid centre
  const headTopPx = data.headTopRow * cellSize;

  const s = (headWidthPx / AV_FIT_WIDTH) * fitScale;
  const overlap = headWidthPx * 0.14; // crown dips onto the head
  const tx = centreX - bbox.cx * s;
  const ty = headTopPx + overlap - bbox.openTop * s;
  return { s, tx, ty };
}
