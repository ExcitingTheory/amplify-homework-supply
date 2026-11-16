/**
 * Synthesized handwriting for seeded drawing answers.
 *
 * Takes real stroke-order paths (KanjiVG, see
 * test/mocks/student-responses/kanjivg-arigatou.json), lays the glyphs out on
 * a SketchPad-sized canvas, and "draws" them the way a student would: pointer
 * samples every ~16ms at a hand-like speed, a little tremor, pauses between
 * strokes. Each sample goes through the app's own updateStrokeLog, exactly as
 * SketchPad's Excalidraw onChange does, so the result is the same data a real
 * submission stores (encodeStrokes output, typed ResponseStrokes).
 *
 * Mistakes are explicit: draw a glyph's strokes in another order, or draw a
 * stroke backwards. Everything is deterministic for a given seed.
 */

import {
  createStrokeLog,
  encodeStrokes,
  summarizeScene,
  updateStrokeLog,
} from "../../src/utils/strokeLog";

export type Point = [number, number];

export interface GlyphPaths {
  char: string;
  /** SVG path data per stroke, in the correct stroke order */
  strokes: string[];
}

export interface HandwritingOptions {
  /** Canvas position of the first glyph's top-left corner, px */
  origin?: Point;
  /** Glyph size in px (KanjiVG glyphs are 109 units square) */
  glyphSize?: number;
  /** Distance between glyph origins, px */
  advance?: number;
  /** Epoch ms when the student starts drawing */
  startedAt?: number;
  /** PRNG seed for tremor, speed and pauses */
  seed?: number;
  /** Per glyph index, the order to draw its strokes in (indexes into strokes) */
  order?: Record<number, number[]>;
  /** Strokes drawn backwards, as "glyphIndex:strokeIndex" */
  reversed?: string[];
  /** Pen speed, px per second */
  speed?: number;
  /** Tremor, px (standard deviation) */
  tremor?: number;
}

const KANJIVG_UNITS = 109;
const FRAME_MS = 16;

/** Small deterministic PRNG (mulberry32). */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Points along an SVG path (M, L, H, V, C, S, Q, T, Z; absolute or relative). */
export function samplePath(d: string, perCurve = 24): Point[] {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const out: Point[] = [];
  let i = 0;
  let cmd = "";
  let cur: Point = [0, 0];
  let start: Point = [0, 0];
  let lastCtrl: Point | null = null;
  let lastCmd = "";
  const num = () => Number(tokens[i++]);
  const isNum = () => i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i]);
  const cubic = (p0: Point, p1: Point, p2: Point, p3: Point) => {
    for (let k = 1; k <= perCurve; k++) {
      const t = k / perCurve;
      const mt = 1 - t;
      out.push([
        mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
        mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
  };
  const quad = (p0: Point, p1: Point, p2: Point) => {
    for (let k = 1; k <= perCurve; k++) {
      const t = k / perCurve;
      const mt = 1 - t;
      out.push([
        mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0],
        mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1],
      ]);
    }
  };

  while (i < tokens.length) {
    if (!isNum()) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const base = (p: Point): Point => (rel ? [cur[0] + p[0], cur[1] + p[1]] : p);
    switch (cmd.toUpperCase()) {
      case "M": {
        cur = base([num(), num()]);
        start = cur;
        out.push(cur);
        cmd = rel ? "l" : "L"; // further pairs are line-tos
        lastCtrl = null;
        break;
      }
      case "L": {
        cur = base([num(), num()]);
        out.push(cur);
        lastCtrl = null;
        break;
      }
      case "H": {
        const x = num();
        cur = [rel ? cur[0] + x : x, cur[1]];
        out.push(cur);
        lastCtrl = null;
        break;
      }
      case "V": {
        const y = num();
        cur = [cur[0], rel ? cur[1] + y : y];
        out.push(cur);
        lastCtrl = null;
        break;
      }
      case "C": {
        const p1 = base([num(), num()]);
        const p2 = base([num(), num()]);
        const p3 = base([num(), num()]);
        cubic(cur, p1, p2, p3);
        lastCtrl = p2;
        cur = p3;
        break;
      }
      case "S": {
        const reflect = lastCtrl && /[CS]/i.test(lastCmd);
        const p1: Point = reflect ? [2 * cur[0] - lastCtrl![0], 2 * cur[1] - lastCtrl![1]] : cur;
        const p2 = base([num(), num()]);
        const p3 = base([num(), num()]);
        cubic(cur, p1, p2, p3);
        lastCtrl = p2;
        cur = p3;
        break;
      }
      case "Q": {
        const p1 = base([num(), num()]);
        const p2 = base([num(), num()]);
        quad(cur, p1, p2);
        lastCtrl = p1;
        cur = p2;
        break;
      }
      case "T": {
        const reflect = lastCtrl && /[QT]/i.test(lastCmd);
        const p1: Point = reflect ? [2 * cur[0] - lastCtrl![0], 2 * cur[1] - lastCtrl![1]] : cur;
        const p2 = base([num(), num()]);
        quad(cur, p1, p2);
        lastCtrl = p1;
        cur = p2;
        break;
      }
      case "Z": {
        cur = start;
        out.push(cur);
        lastCtrl = null;
        break;
      }
      default:
        i++; // unknown token: skip
    }
    lastCmd = cmd;
  }
  return out;
}

/** Resample a polyline at a fixed arc-length step. */
function resample(points: Point[], step: number): Point[] {
  if (points.length < 2) return points.slice();
  const out: Point[] = [points[0]];
  let carry = 0;
  for (let k = 1; k < points.length; k++) {
    const [ax, ay] = points[k - 1];
    const [bx, by] = points[k];
    const seg = Math.hypot(bx - ax, by - ay);
    let pos = step - carry;
    while (pos <= seg) {
      const t = pos / seg;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      pos += step;
    }
    carry = seg - (pos - step);
  }
  const last = points[points.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.25) out.push(last);
  return out;
}

interface PlannedStroke {
  id: string;
  points: Point[]; // canvas px, in drawing direction
}

/** Where each stroke lands on the canvas, in the order it will be drawn. */
function planStrokes(glyphs: GlyphPaths[], opts: Required<Pick<HandwritingOptions, "origin" | "glyphSize" | "advance">> & HandwritingOptions) {
  const scale = opts.glyphSize / KANJIVG_UNITS;
  const reversed = new Set(opts.reversed || []);
  const planned: Array<PlannedStroke & { glyph: number }> = [];
  glyphs.forEach((glyph, g) => {
    const order = opts.order?.[g] ?? glyph.strokes.map((_, s) => s);
    for (const s of order) {
      let pts = samplePath(glyph.strokes[s]).map(
        ([x, y]): Point => [opts.origin[0] + g * opts.advance + x * scale, opts.origin[1] + y * scale],
      );
      if (reversed.has(`${g}:${s}`)) pts = pts.reverse();
      planned.push({ id: `stroke-${g}-${s}`, points: pts, glyph: g });
    }
  });
  return planned;
}

function freedraw(id: string, points: Point[], version: number) {
  const [ox, oy] = points[0];
  return {
    id,
    type: "freedraw",
    x: ox,
    y: oy,
    points: points.map(([x, y]) => [x - ox, y - oy]),
    pressures: [],
    simulatePressure: true,
    strokeColor: "#1e1e1e",
    strokeWidth: 2,
    opacity: 100,
    isDeleted: false,
    version,
  };
}

const DEFAULTS = {
  origin: [40, 70] as Point,
  glyphSize: 88,
  advance: 96,
  startedAt: Date.UTC(2026, 0, 1),
  seed: 1,
  speed: 320,
  tremor: 0.35,
};

/**
 * Draw `glyphs` like a student would and return the stored form of the
 * drawing (encodeStrokes output), plus the stroke log and final elements.
 */
export function synthesizeHandwriting(glyphs: GlyphPaths[], options: HandwritingOptions = {}) {
  const opts = { ...DEFAULTS, ...options };
  const rand = prng(opts.seed);
  const log = createStrokeLog(opts.startedAt);
  const done: ReturnType<typeof freedraw>[] = [];
  let now = opts.startedAt + 400 + Math.round(rand() * 300);
  let previousGlyph = 0;

  for (const stroke of planStrokes(glyphs, opts)) {
    if (stroke.glyph !== previousGlyph) now += 350 + Math.round(rand() * 300);
    previousGlyph = stroke.glyph;

    // Hand speed varies a little per stroke; samples arrive once per frame.
    // Even a tiny tick (a dakuten) takes a hand at least ~6 frames.
    const length = stroke.points.reduce(
      (sum, p, k) => (k ? sum + Math.hypot(p[0] - stroke.points[k - 1][0], p[1] - stroke.points[k - 1][1]) : 0),
      0,
    );
    const step = Math.min((opts.speed * (0.8 + rand() * 0.4) * FRAME_MS) / 1000, length / 6);
    const path = resample(stroke.points, step).map(
      ([x, y]): Point => [x + gaussian(rand) * opts.tremor, y + gaussian(rand) * opts.tremor],
    );
    for (let k = 1; k <= path.length; k++) {
      const element = freedraw(stroke.id, path.slice(0, k), k);
      updateStrokeLog(log, [...done, element], now);
      now += FRAME_MS + Math.round(rand() * 4);
    }
    done.push(freedraw(stroke.id, path, path.length));
    now += 220 + Math.round(rand() * 280); // pen up, move to the next stroke
  }

  return { strokes: encodeStrokes(log), log, elements: done, endedAt: now };
}

/** The correct drawing with no tremor, as a stroke-order reference. */
export function referenceSummary(glyphs: GlyphPaths[], options: HandwritingOptions = {}) {
  const opts = { ...DEFAULTS, ...options, order: undefined, reversed: undefined };
  const elements = planStrokes(glyphs, opts).map((s) => freedraw(s.id, s.points, 1));
  return summarizeScene(elements);
}
