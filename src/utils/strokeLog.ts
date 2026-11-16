/**
 * Stroke log for Excalidraw drawings.
 *
 * Excalidraw's scene only keeps the final elements. Stroke order, direction
 * and timing are lost unless we watch the scene while the student draws.
 * SketchPad feeds every onChange into updateStrokeLog(); on submit the log is
 * compacted with encodeStrokes() and stored on the answer's GradeResponse item
 * (typed fields ResponseStrokes / ResponseStroke in amplify/data/resource.ts),
 * which the section's instructor group can read. No image is stored: the
 * strokes are the drawing, and images are rendered from them when needed.
 *
 * From the stored data you can:
 *  - check stroke order: compareStrokeOrder(summarizeStrokes(decodeStrokes(d)), reference)
 *  - replay or open the drawing in Excalidraw: elementsFromStrokes(d) / buildDrawingFile()
 *
 * Everything here is pure (no React, no Excalidraw import) so it can run in
 * tests, in a Lambda, or in the browser offline.
 */

export const DRAWING_FILE_FORMAT = "homework-supply/drawing@1";
export const STROKE_SUMMARY_VERSION = 1;
export const STROKE_ENCODING_VERSION = 1;

/**
 * Default size cap for one drawing's encoded strokes, in characters of JSON.
 * Each answer is its own DynamoDB item (400KB limit). A typical handwritten
 * word is 3-8KB, so this leaves room for long drawings at full detail.
 */
export const STROKE_DATA_MAX_BYTES = 32000;

export type Point = [number, number];

/** The parts of an Excalidraw element the log reads. */
export interface ExcalidrawElementLike {
  id: string;
  type: string;
  x: number;
  y: number;
  points?: ReadonlyArray<readonly number[]>;
  pressures?: readonly number[];
  simulatePressure?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  isDeleted?: boolean;
  version?: number;
}

/** One tracked stroke. Points are [dx, dy, tMs] relative to (x, y). */
export interface StrokeRecord {
  id: string;
  order: number;
  type: string;
  x: number;
  y: number;
  color: string;
  width: number;
  opacity: number;
  startedAt: number;
  endedAt: number;
  timing: "observed" | "restored";
  points: number[][];
  pressures: number[];
  simulatePressure: boolean;
  deletedAt: number | null;
  version: number;
}

export interface StrokeLog {
  format: string;
  startedAt: number;
  updatedAt: number;
  strokes: StrokeRecord[];
  /** id -> index into strokes. Rebuilt on load, never serialized. */
  _index?: Map<string, number>;
}

/** Shape of the ResponseStroke type in amplify/data/resource.ts. */
export interface EncodedStroke {
  order: number;
  startMs?: number | null;
  durationMs?: number | null;
  points?: number[] | null;
  times?: number[] | null;
  restored?: boolean | null;
  erasedMs?: number | null;
  color?: string | null;
  width?: number | null;
  pointCount?: number | null;
}

/** Shape of the ResponseStrokes type in amplify/data/resource.ts. */
export interface EncodedStrokes {
  version: number;
  startedAt: number;
  tolerance: number;
  strokes: EncodedStroke[];
  truncated?: boolean | null;
  total?: number | null;
}

/** ResponseStrokes as read back from GraphQL, where any field may be null. */
export interface StoredStrokes {
  version?: number | null;
  startedAt?: number | null;
  tolerance?: number | null;
  strokes?: Array<EncodedStroke | null> | null;
  truncated?: boolean | null;
  total?: number | null;
}

export interface StrokeSummaryItem {
  n: number;
  id: string;
  start: Point;
  end: Point;
  path: Point[];
  len: number;
  at: number;
  ms: number;
  timing: StrokeRecord["timing"];
}

export interface StrokeSummary {
  v: number;
  count: number;
  erased: number;
  box: { x: number; y: number; w: number; h: number } | null;
  durationMs: number;
  strokes: StrokeSummaryItem[];
  truncated?: boolean;
}

export interface StrokeOrderResult {
  ok: boolean;
  expected: number;
  actual: number;
  countMatches: boolean;
  strokes: Array<{
    n: number;
    match: number | null;
    inOrder: boolean;
    reversed: boolean;
    distance: number | null;
  }>;
  problems: string[];
}

/** Element types that represent a pen stroke. */
const STROKE_TYPES = new Set(["freedraw", "line", "arrow"]);

const round1 = (n: number | undefined) => Math.round(Number(n || 0) * 10) / 10;

/**
 * Create an empty stroke log.
 * @param startedAt epoch ms when the drawing session started
 */
export function createStrokeLog(startedAt: number = Date.now()): StrokeLog {
  return {
    format: DRAWING_FILE_FORMAT,
    startedAt,
    updatedAt: startedAt,
    strokes: [],
    _index: new Map(),
  };
}

function indexMap(log: StrokeLog): Map<string, number> {
  if (!(log._index instanceof Map)) {
    log._index = new Map(log.strokes.map((s, i) => [s.id, i]));
  }
  return log._index;
}

function relPoints(element: ExcalidrawElementLike): ReadonlyArray<readonly number[]> {
  return Array.isArray(element.points) ? element.points : [[0, 0]];
}

/**
 * Fold one Excalidraw onChange into the log. Mutates and returns `log`.
 *
 * - New stroke ids are appended in the order they first appear, which is the
 *   order the student drew them (elements arrive in z-order, and freedraw
 *   strokes are created on top).
 * - Points that appear between calls get a time offset `t` (ms since the
 *   stroke started), so the log records direction and speed, not just shape.
 * - Erased or undone strokes keep their place in the order with `deletedAt`;
 *   strokes that vanish from the scene (canvas cleared or remounted empty)
 *   are marked the same way.
 *
 * @param restored the elements were loaded from a saved scene, so their
 *   points carry no timing
 */
export function updateStrokeLog(
  log: StrokeLog,
  elements: ReadonlyArray<ExcalidrawElementLike | null | undefined>,
  now: number = Date.now(),
  { restored = false }: { restored?: boolean } = {},
): StrokeLog {
  if (!log || !Array.isArray(elements)) return log;
  const index = indexMap(log);
  const seen = new Set<string>();

  for (const el of elements) {
    if (!el || !STROKE_TYPES.has(el.type) || !el.id) continue;
    seen.add(el.id);
    const pts = relPoints(el);
    const i = index.get(el.id) ?? -1;

    if (i === -1) {
      log.strokes.push({
        id: el.id,
        order: log.strokes.length,
        type: el.type,
        x: round1(el.x),
        y: round1(el.y),
        color: el.strokeColor ?? "#000000",
        width: el.strokeWidth ?? 1,
        opacity: el.opacity ?? 100,
        startedAt: now,
        endedAt: now,
        timing: restored ? "restored" : "observed",
        points: pts.map(([px, py]) => [round1(px), round1(py), 0]),
        pressures: Array.isArray(el.pressures) ? [...el.pressures] : [],
        simulatePressure: el.simulatePressure !== false,
        deletedAt: el.isDeleted ? now : null,
        version: el.version ?? 0,
      });
      index.set(el.id, log.strokes.length - 1);
      log.updatedAt = now;
      continue;
    }

    const s = log.strokes[i];
    if ((el.version ?? 0) === s.version && !!el.isDeleted === !!s.deletedAt) continue;

    const t = Math.max(0, now - s.startedAt);
    const moved = round1(el.x) !== s.x || round1(el.y) !== s.y;
    // Only real geometry changes extend the stroke's end time; a remount or a
    // style change also bumps the version.
    const grew = moved || pts.length !== s.points.length;
    if (moved || pts.length < s.points.length) {
      // Excalidraw re-based or simplified the stroke: take the new geometry and
      // keep whatever timing we already had for each index.
      s.points = pts.map(([px, py], k) => [round1(px), round1(py), s.points[k]?.[2] ?? t]);
      s.x = round1(el.x);
      s.y = round1(el.y);
    } else {
      for (let k = s.points.length; k < pts.length; k++) {
        s.points.push([round1(pts[k][0]), round1(pts[k][1]), t]);
      }
    }
    if (Array.isArray(el.pressures)) s.pressures = [...el.pressures];
    if (grew && !el.isDeleted) s.endedAt = Math.max(s.endedAt, now);
    s.deletedAt = el.isDeleted ? (s.deletedAt ?? now) : null;
    s.version = el.version ?? s.version;
    log.updatedAt = now;
  }

  for (const s of log.strokes) {
    if (!seen.has(s.id) && s.deletedAt == null) {
      s.deletedAt = now;
      log.updatedAt = now;
    }
  }
  return log;
}

/** JSON-safe copy of a log (drops the lookup index). */
export function serializeStrokeLog(log: StrokeLog | null | undefined): StrokeLog | null {
  if (!log) return null;
  const { _index, ...rest } = log;
  return JSON.parse(JSON.stringify(rest));
}

/** Rebuild a log from serializeStrokeLog() output. */
export function restoreStrokeLog(data: unknown): StrokeLog | null {
  const source = data as Partial<StrokeLog> | null | undefined;
  if (!source || !Array.isArray(source.strokes)) return null;
  const log = {
    ...(source as StrokeLog),
    strokes: source.strokes.map((s) => ({ ...s })),
  };
  log._index = new Map(log.strokes.map((s, i) => [s.id, i]));
  return log;
}

function absolutePoints(stroke: StrokeRecord): Point[] {
  return stroke.points.map(([px, py]): Point => [stroke.x + px, stroke.y + py]);
}

function downsample<T>(points: T[], max: number): T[] {
  if (points.length <= max) return points;
  const out: T[] = [];
  for (let k = 0; k < max; k++) {
    out.push(points[Math.round((k * (points.length - 1)) / (max - 1))]);
  }
  return out;
}

function pathLength(points: Point[]): number {
  let len = 0;
  for (let k = 1; k < points.length; k++) {
    len += Math.hypot(points[k][0] - points[k - 1][0], points[k][1] - points[k - 1][1]);
  }
  return len;
}

/**
 * Small, inline-safe summary of a stroke log.
 *
 * Coordinates are normalized to 0..1000 against the larger side of the
 * bounding box of the kept strokes, so two drawings of the same character at
 * different sizes or positions compare directly. Erased strokes are counted
 * but not listed; `n` is the 1-based stroke number among kept strokes.
 */
export function summarizeStrokes(
  log: { strokes?: StrokeRecord[] } | null | undefined,
  { maxStrokes = 60, maxPoints = 12 }: { maxStrokes?: number; maxPoints?: number } = {},
): StrokeSummary {
  const all = Array.isArray(log?.strokes) ? log!.strokes! : [];
  const kept = all
    .filter((s) => s.deletedAt == null && s.points?.length)
    .sort((a, b) => a.order - b.order);

  const abs = kept.map(absolutePoints);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pts of abs) {
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const hasBox = Number.isFinite(minX);
  const w = hasBox ? maxX - minX : 0;
  const h = hasBox ? maxY - minY : 0;
  const scale = Math.max(w, h) || 1;
  const norm = ([x, y]: Point): Point => [
    Math.round(((x - minX) / scale) * 1000),
    Math.round(((y - minY) / scale) * 1000),
  ];

  const t0 = kept.length ? Math.min(...kept.map((s) => s.startedAt)) : 0;
  const t1 = kept.length ? Math.max(...kept.map((s) => s.endedAt)) : 0;

  const strokes = kept.slice(0, maxStrokes).map((s, k): StrokeSummaryItem => {
    const pts = abs[k];
    return {
      n: k + 1,
      id: s.id,
      start: norm(pts[0]),
      end: norm(pts[pts.length - 1]),
      path: downsample(pts, maxPoints).map(norm),
      len: Math.round((pathLength(pts) / scale) * 1000),
      at: Math.max(0, s.startedAt - t0),
      ms: Math.max(0, s.endedAt - s.startedAt),
      timing: s.timing,
    };
  });

  return {
    v: STROKE_SUMMARY_VERSION,
    count: kept.length,
    erased: all.length - kept.length,
    box: hasBox ? { x: round1(minX), y: round1(minY), w: round1(w), h: round1(h) } : null,
    durationMs: Math.max(0, t1 - t0),
    strokes,
    ...(kept.length > maxStrokes ? { truncated: true } : {}),
  };
}

/** Summarize a finished Excalidraw scene (no timing), e.g. a reference template. */
export function summarizeScene(
  elements: ReadonlyArray<ExcalidrawElementLike | null | undefined> | null | undefined,
  options?: { maxStrokes?: number; maxPoints?: number },
): StrokeSummary {
  const log = createStrokeLog(0);
  updateStrokeLog(log, (elements || []).filter((e) => !e?.isDeleted), 0, { restored: true });
  return summarizeStrokes(log, options);
}

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

type Endpoints = { start: Point; end: Point };

/**
 * Compare a drawing's stroke order to a reference.
 *
 * Both arguments are summaries (summarizeStrokes / summarizeScene) or their
 * `strokes` arrays. Each student stroke is matched to the reference stroke
 * whose endpoints are closest, in either direction. A stroke is "in order"
 * when its best match has the same position in the sequence, and "reversed"
 * when it is closer to the reference drawn backwards.
 *
 * `tolerance` is the largest allowed average endpoint distance on the
 * 0..1000 scale (default 200, a fifth of the drawing's size).
 */
export function compareStrokeOrder(
  actual: { strokes: Endpoints[] } | ReadonlyArray<Endpoints> | null | undefined,
  reference: { strokes: Endpoints[] } | ReadonlyArray<Endpoints> | null | undefined,
  { tolerance = 200 }: { tolerance?: number } = {},
): StrokeOrderResult {
  const list = (v: typeof actual): ReadonlyArray<Endpoints> =>
    Array.isArray(v) ? v : ((v as { strokes?: Endpoints[] } | null)?.strokes ?? []);
  const a = list(actual);
  const r = list(reference);
  const problems: string[] = [];

  const strokes = a.map((s, i) => {
    let best: { match: number | null; distance: number; reversed: boolean } = {
      match: null,
      distance: Infinity,
      reversed: false,
    };
    r.forEach((ref, j) => {
      const fwd = (dist(s.start, ref.start) + dist(s.end, ref.end)) / 2;
      const rev = (dist(s.start, ref.end) + dist(s.end, ref.start)) / 2;
      const d = Math.min(fwd, rev);
      if (d < best.distance) best = { match: j + 1, distance: d, reversed: rev < fwd };
    });
    const close = best.distance <= tolerance;
    const result = {
      n: i + 1,
      match: close ? best.match : null,
      inOrder: close && best.match === i + 1,
      reversed: close && best.reversed,
      distance: Number.isFinite(best.distance) ? Math.round(best.distance) : null,
    };
    if (!close) problems.push(`stroke ${i + 1} does not match any reference stroke`);
    else if (!result.inOrder) problems.push(`stroke ${i + 1} matches reference stroke ${best.match}`);
    if (result.reversed) problems.push(`stroke ${i + 1} is drawn in the wrong direction`);
    return result;
  });

  const countMatches = a.length === r.length;
  if (!countMatches) problems.unshift(`expected ${r.length} strokes, got ${a.length}`);

  return {
    ok: countMatches && strokes.every((s) => s.inOrder && !s.reversed),
    expected: r.length,
    actual: a.length,
    countMatches,
    strokes,
    problems,
  };
}

// ---------------------------------------------------------------------------
// Compact encoding for GradeResponse.strokes
// ---------------------------------------------------------------------------

/** Ramer-Douglas-Peucker on [x, y, t] points; keeps first and last. */
function simplify(points: number[][], epsilon: number): number[][] {
  if (epsilon <= 0 || points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    let maxD = -1;
    let maxI = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > epsilon) {
      keep[maxI] = 1;
      stack.push([a, maxI], [maxI, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function encodeStroke(
  stroke: StrokeRecord,
  startedAt: number,
  epsilon: number,
  withPoints: boolean,
): EncodedStroke {
  const abs = stroke.points.map(([px, py, t]) => [stroke.x + px, stroke.y + py, t || 0]);
  const pts = withPoints ? simplify(abs, epsilon) : [];
  const p: number[] = [];
  const t: number[] = [];
  let lx = 0;
  let ly = 0;
  let lt = 0;
  pts.forEach(([x, y, tt], i) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    const it = Math.round(tt);
    if (i === 0) p.push(ix, iy);
    else p.push(ix - lx, iy - ly);
    if (i > 0) t.push(it - lt);
    lx = ix;
    ly = iy;
    lt = it;
  });
  // Field names match the ResponseStroke type in amplify/data/resource.ts.
  const out: EncodedStroke = {
    order: stroke.order,
    startMs: Math.max(0, Math.round(stroke.startedAt - startedAt)),
    durationMs: Math.max(0, Math.round(stroke.endedAt - stroke.startedAt)),
    points: p,
  };
  if (stroke.timing === "observed" && t.some((v) => v !== 0)) out.times = t;
  if (stroke.timing === "restored") out.restored = true;
  if (stroke.deletedAt != null) out.erasedMs = Math.max(0, Math.round(stroke.deletedAt - startedAt));
  if (stroke.color && stroke.color !== "#000000") out.color = stroke.color;
  if (stroke.width != null && stroke.width !== 1) out.width = stroke.width;
  if (!withPoints && stroke.points.length) out.pointCount = stroke.points.length;
  return out;
}

/**
 * Encode a stroke log for storage on a GradeResponse item.
 *
 * Coordinates become whole pixels, delta-encoded, with per-point time deltas
 * in ms. Paths are simplified (Ramer-Douglas-Peucker) at 0.5px; if the result
 * is over `maxBytes`, the tolerance doubles up to 8px, then erased strokes
 * lose their points, then trailing strokes are dropped (`truncated: true`).
 * `tolerance` records the simplification used, so a reader knows how exact
 * the paths are. The shape matches the ResponseStrokes type.
 */
export function encodeStrokes(
  log: StrokeLog | null | undefined,
  { maxBytes = STROKE_DATA_MAX_BYTES }: { maxBytes?: number } = {},
): EncodedStrokes {
  const strokes = (log?.strokes || []).slice().sort((a, b) => a.order - b.order);
  const startedAt = log?.startedAt ?? 0;
  const build = (epsilon: number, erasedPoints: boolean): EncodedStrokes => ({
    version: STROKE_ENCODING_VERSION,
    startedAt,
    tolerance: epsilon,
    strokes: strokes.map((st) => encodeStroke(st, startedAt, epsilon, erasedPoints || st.deletedAt == null)),
  });
  const size = (d: EncodedStrokes) => JSON.stringify(d).length;

  for (const epsilon of [0.5, 1, 2, 4, 8]) {
    const data = build(epsilon, true);
    if (size(data) <= maxBytes) return data;
  }
  const data = build(8, false);
  if (size(data) <= maxBytes) return data;

  // Still too big: keep the earliest strokes that fit.
  data.truncated = true;
  data.total = data.strokes.length;
  while (data.strokes.length > 1 && size(data) > maxBytes) data.strokes.pop();
  return data;
}

/**
 * Decode encodeStrokes() output back into a stroke log that summarizeStrokes,
 * compareStrokeOrder and elementsFromStrokes accept.
 */
export function decodeStrokes(data: StoredStrokes | null | undefined): StrokeLog | null {
  if (!data || !Array.isArray(data.strokes)) return null;
  const startedAt = data.startedAt ?? 0;
  const log = createStrokeLog(startedAt);
  const index = indexMap(log);
  // GraphQL returns null for fields that were never set, so every optional
  // field is read with a fallback.
  for (const st of data.strokes) {
    if (!st) continue;
    const pts = st.points || [];
    const abs: number[][] = [];
    let x = 0;
    let y = 0;
    let t = 0;
    for (let i = 0; i + 1 < pts.length; i += 2) {
      if (i === 0) {
        x = pts[0];
        y = pts[1];
      } else {
        x += pts[i];
        y += pts[i + 1];
        t += st.times?.[i / 2 - 1] ?? 0;
      }
      abs.push([x, y, t]);
    }
    const ox = abs[0]?.[0] ?? 0;
    const oy = abs[0]?.[1] ?? 0;
    const stroke: StrokeRecord = {
      id: `s${st.order}`,
      order: st.order,
      type: "freedraw",
      x: ox,
      y: oy,
      color: st.color ?? "#000000",
      width: st.width ?? 1,
      opacity: 100,
      startedAt: startedAt + (st.startMs || 0),
      endedAt: startedAt + (st.startMs || 0) + (st.durationMs || 0),
      timing: st.restored ? "restored" : "observed",
      points: abs.map(([px, py, pt]) => [px - ox, py - oy, pt]),
      pressures: [],
      simulatePressure: true,
      deletedAt: st.erasedMs != null ? startedAt + st.erasedMs : null,
      version: 0,
    };
    log.strokes.push(stroke);
    index.set(stroke.id, log.strokes.length - 1);
  }
  return log;
}

function isStrokeLog(value: unknown): value is StrokeLog {
  return !!value && typeof value === "object" && ("format" in value || "_index" in value);
}

/**
 * Excalidraw freedraw elements rebuilt from a stroke log or encoded strokes,
 * in drawing order, for replay or for loading into Excalidraw. Erased strokes
 * are left out unless `includeErased` is set (they come back marked deleted).
 */
export function elementsFromStrokes(
  logOrData: StrokeLog | StoredStrokes | null | undefined,
  { includeErased = false }: { includeErased?: boolean } = {},
) {
  const log = isStrokeLog(logOrData) ? logOrData : decodeStrokes(logOrData);
  if (!log) return [];
  return log.strokes
    .filter((st) => includeErased || st.deletedAt == null)
    .filter((st) => st.points.length)
    .sort((a, b) => a.order - b.order)
    .map((st, i) => {
      const xs = st.points.map((p) => p[0]);
      const ys = st.points.map((p) => p[1]);
      return {
        id: st.id,
        type: "freedraw",
        x: st.x,
        y: st.y,
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
        angle: 0,
        strokeColor: st.color,
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: st.width,
        strokeStyle: "solid",
        roughness: 0,
        opacity: st.opacity ?? 100,
        groupIds: [] as string[],
        frameId: null,
        roundness: null,
        seed: i + 1,
        version: 1,
        versionNonce: i + 1,
        isDeleted: st.deletedAt != null,
        boundElements: null,
        updated: st.endedAt,
        link: null,
        locked: false,
        points: st.points.map(([px, py]) => [px, py]),
        pressures: st.pressures || [],
        simulatePressure: st.simulatePressure !== false,
        lastCommittedPoint: null,
      };
    });
}

/**
 * A normal .excalidraw file (type/version/elements/appState/files) that opens
 * in Excalidraw directly, plus a `homeworkSupply` key with the stroke log.
 * Used to let a teacher download a student's drawing:
 *   buildDrawingFile({ elements: elementsFromStrokes(data), strokeLog: decodeStrokes(data) })
 */
export function buildDrawingFile({
  elements,
  files,
  strokeLog,
  meta = {},
  submittedAt = Date.now(),
}: {
  elements: ReadonlyArray<{ isDeleted?: boolean } | null | undefined>;
  files?: Record<string, unknown> | null;
  strokeLog?: StrokeLog | null;
  meta?: Record<string, unknown>;
  submittedAt?: number;
}) {
  const kept = (elements || []).filter((e) => e && !e.isDeleted);
  return {
    type: "excalidraw" as const,
    version: 2,
    source: "homework-supply",
    elements: JSON.parse(JSON.stringify(kept)) as Array<Record<string, unknown>>,
    appState: { viewBackgroundColor: "#ffffff", gridSize: null },
    files: (files ? JSON.parse(JSON.stringify(files)) : {}) as Record<string, unknown>,
    homeworkSupply: {
      format: DRAWING_FILE_FORMAT,
      submittedAt,
      ...meta,
      strokeLog: serializeStrokeLog(strokeLog),
    },
  };
}
