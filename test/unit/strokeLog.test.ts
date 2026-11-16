import { describe, expect, it } from "vitest";
import {
  buildDrawingFile,
  compareStrokeOrder,
  createStrokeLog,
  decodeStrokes,
  elementsFromStrokes,
  encodeStrokes,
  STROKE_DATA_MAX_BYTES,
  restoreStrokeLog,
  serializeStrokeLog,
  summarizeScene,
  summarizeStrokes,
  updateStrokeLog,
} from "../../src/utils/strokeLog";

type Pt = [number, number];

function freedraw(id: string, x: number, y: number, points: Pt[], extra: Record<string, unknown> = {}) {
  return {
    id,
    type: "freedraw",
    x,
    y,
    points,
    pressures: [],
    simulatePressure: true,
    strokeColor: "#000000",
    strokeWidth: 2,
    opacity: 100,
    isDeleted: false,
    version: points.length,
    ...extra,
  };
}

// Draw a stroke one point at a time, the way Excalidraw's onChange reports it.
function drawStroke(
  log: ReturnType<typeof createStrokeLog>,
  before: any[],
  id: string,
  origin: Pt,
  rel: Pt[],
  t0: number,
  stepMs = 10,
) {
  let el: any = null;
  rel.forEach((_, k) => {
    el = freedraw(id, origin[0], origin[1], rel.slice(0, k + 1));
    updateStrokeLog(log, [...before, el], t0 + k * stepMs);
  });
  return el;
}

// Horizontal stroke then vertical stroke: a plus sign drawn "correctly".
function drawPlus(order: "h-first" | "v-first", vReversed = false) {
  const log = createStrokeLog(1000);
  const h: [Pt, Pt[]] = [[0, 50], [[0, 0], [50, 0], [100, 0]]];
  const vPts: Pt[] = vReversed ? [[0, 100], [0, 50], [0, 0]] : [[0, 0], [0, 50], [0, 100]];
  const v: [Pt, Pt[]] = [[50, 0], vPts];
  const [first, second] = order === "h-first" ? [h, v] : [v, h];
  const a = drawStroke(log, [], "a", first[0], first[1], 1000);
  drawStroke(log, [a], "b", second[0], second[1], 2000);
  return log;
}

describe("updateStrokeLog", () => {
  it("records strokes in the order they were drawn, with point timing", () => {
    const log = drawPlus("h-first");
    expect(log.strokes.map((s) => s.id)).toEqual(["a", "b"]);
    expect(log.strokes.map((s) => s.order)).toEqual([0, 1]);
    const a = log.strokes[0];
    expect(a.points).toEqual([
      [0, 0, 0],
      [50, 0, 10],
      [100, 0, 20],
    ]);
    expect(a.startedAt).toBe(1000);
    expect(a.endedAt).toBe(1020);
    expect(a.timing).toBe("observed");
  });

  it("ignores repeated onChange calls with no new version", () => {
    const log = createStrokeLog(0);
    const el = freedraw("a", 0, 0, [[0, 0], [10, 0]]);
    updateStrokeLog(log, [el], 5);
    updateStrokeLog(log, [el], 50);
    expect(log.strokes).toHaveLength(1);
    expect(log.strokes[0].endedAt).toBe(5);
  });

  it("does not stretch stroke timing when a remount bumps the version", () => {
    const log = drawPlus("h-first");
    const a = freedraw("a", 0, 50, [[0, 0], [50, 0], [100, 0]], { version: 42 });
    const b = freedraw("b", 50, 0, [[0, 0], [0, 50], [0, 100]], { version: 43 });
    updateStrokeLog(log, [], 5000);
    updateStrokeLog(log, [a, b], 5001);
    expect(log.strokes.map((s) => s.endedAt)).toEqual([1020, 2020]);
    expect(log.strokes.every((s) => s.deletedAt === null)).toBe(true);
  });

  it("keeps erased strokes in the order but marks them deleted", () => {
    const log = drawPlus("h-first");
    const a = freedraw("a", 0, 50, [[0, 0], [50, 0], [100, 0]], { isDeleted: true, version: 9 });
    const b = freedraw("b", 50, 0, [[0, 0], [0, 50], [0, 100]]);
    updateStrokeLog(log, [a, b], 3000);
    expect(log.strokes[0].deletedAt).toBe(3000);
    expect(log.strokes[1].deletedAt).toBeNull();
    // Undo the erase.
    updateStrokeLog(log, [{ ...a, isDeleted: false, version: 10 }, b], 3100);
    expect(log.strokes[0].deletedAt).toBeNull();
  });

  it("marks strokes that disappear from the scene as deleted", () => {
    const log = drawPlus("h-first");
    updateStrokeLog(log, [], 4000);
    expect(log.strokes.every((s) => s.deletedAt === 4000)).toBe(true);
  });

  it("re-syncs geometry when Excalidraw moves the stroke origin", () => {
    const log = createStrokeLog(0);
    updateStrokeLog(log, [freedraw("a", 10, 10, [[0, 0], [5, 5]])], 10);
    updateStrokeLog(log, [freedraw("a", 5, 5, [[5, 5], [10, 10], [0, 0]], { version: 5 })], 20);
    const s = log.strokes[0];
    expect([s.x, s.y]).toEqual([5, 5]);
    expect(s.points.map((p) => p.slice(0, 2))).toEqual([
      [5, 5],
      [10, 10],
      [0, 0],
    ]);
    expect(s.points.map((p) => p[2])).toEqual([0, 0, 10]);
  });

  it("labels strokes loaded from a saved scene as restored", () => {
    const log = createStrokeLog(0);
    updateStrokeLog(log, [freedraw("a", 0, 0, [[0, 0], [9, 9]])], 0, { restored: true });
    expect(log.strokes[0].timing).toBe("restored");
  });

  it("ignores non-stroke elements", () => {
    const log = createStrokeLog(0);
    updateStrokeLog(log, [{ id: "t", type: "text", x: 0, y: 0, version: 1 }], 1);
    expect(log.strokes).toHaveLength(0);
  });
});

describe("serialize / restore", () => {
  it("round-trips through JSON and keeps updating", () => {
    const log = drawPlus("h-first");
    const json = JSON.parse(JSON.stringify(serializeStrokeLog(log)));
    expect(json._index).toBeUndefined();
    const back = restoreStrokeLog(json)!;
    updateStrokeLog(back, [freedraw("c", 0, 0, [[0, 0], [1, 1]])], 9000);
    expect(back.strokes.map((s: any) => s.id)).toEqual(["a", "b", "c"]);
  });
});

describe("summarizeStrokes", () => {
  it("normalizes to 0..1000 and numbers kept strokes from 1", () => {
    const summary = summarizeStrokes(drawPlus("h-first"));
    expect(summary.count).toBe(2);
    expect(summary.erased).toBe(0);
    expect(summary.box).toEqual({ x: 0, y: 0, w: 100, h: 100 });
    expect(summary.strokes[0]).toMatchObject({ n: 1, id: "a", start: [0, 500], end: [1000, 500], len: 1000 });
    expect(summary.strokes[1]).toMatchObject({ n: 2, id: "b", start: [500, 0], end: [500, 1000], at: 1000 });
    expect(summary.durationMs).toBe(1020);
  });

  it("drops erased strokes and renumbers", () => {
    const log = drawPlus("h-first");
    log.strokes[0].deletedAt = 1;
    const summary = summarizeStrokes(log);
    expect(summary.count).toBe(1);
    expect(summary.erased).toBe(1);
    expect(summary.strokes[0]).toMatchObject({ n: 1, id: "b" });
  });

  it("caps strokes and points so it fits inline in grade data", () => {
    const log = createStrokeLog(0);
    const els = Array.from({ length: 80 }, (_, i) =>
      freedraw(`s${i}`, i, 0, Array.from({ length: 50 }, (_, k) => [k, k] as Pt)),
    );
    updateStrokeLog(log, els, 1);
    const summary = summarizeStrokes(log);
    expect(summary.strokes).toHaveLength(60);
    expect(summary.truncated).toBe(true);
    expect(summary.strokes[0].path).toHaveLength(12);
    expect(JSON.stringify(summary).length).toBeLessThan(20000);
  });

  it("handles an empty log", () => {
    expect(summarizeStrokes(createStrokeLog(0))).toMatchObject({ count: 0, box: null, strokes: [] });
  });
});

describe("compareStrokeOrder", () => {
  const reference = summarizeScene([
    freedraw("r1", 0, 50, [[0, 0], [100, 0]]),
    freedraw("r2", 50, 0, [[0, 0], [0, 100]]),
  ]);

  it("passes when the order and direction match", () => {
    const result = compareStrokeOrder(summarizeStrokes(drawPlus("h-first")), reference);
    expect(result.ok).toBe(true);
    expect(result.problems).toEqual([]);
  });

  it("reports strokes drawn out of order", () => {
    const result = compareStrokeOrder(summarizeStrokes(drawPlus("v-first")), reference);
    expect(result.ok).toBe(false);
    expect(result.strokes.map((s) => s.match)).toEqual([2, 1]);
    expect(result.problems).toContain("stroke 1 matches reference stroke 2");
  });

  it("reports strokes drawn backwards", () => {
    const result = compareStrokeOrder(summarizeStrokes(drawPlus("h-first", true)), reference);
    expect(result.ok).toBe(false);
    expect(result.strokes[1]).toMatchObject({ match: 2, inOrder: true, reversed: true });
  });

  it("reports a missing stroke", () => {
    const log = drawPlus("h-first");
    log.strokes[1].deletedAt = 1;
    const result = compareStrokeOrder(summarizeStrokes(log), reference);
    expect(result.ok).toBe(false);
    expect(result.countMatches).toBe(false);
    expect(result.problems[0]).toBe("expected 2 strokes, got 1");
  });

  it("is size and position independent", () => {
    const big = summarizeScene([
      freedraw("a", 400, 600, [[0, 0], [300, 0]]),
      freedraw("b", 550, 450, [[0, 0], [0, 300]]),
    ]);
    expect(compareStrokeOrder(big, reference).ok).toBe(true);
  });
});

describe("buildDrawingFile", () => {
  it("writes a loadable .excalidraw file with the stroke log attached", () => {
    const log = drawPlus("h-first");
    const erased = freedraw("x", 0, 0, [[0, 0]], { isDeleted: true });
    const file = buildDrawingFile({
      elements: [freedraw("a", 0, 50, [[0, 0], [100, 0]]), erased],
      files: {},
      strokeLog: log,
      meta: { gradeId: "g1", questionID: "q1" },
      submittedAt: 5000,
    });
    expect(file.type).toBe("excalidraw");
    expect(file.version).toBe(2);
    expect(file.elements.map((e: any) => e.id)).toEqual(["a"]);
    expect(file.homeworkSupply).toMatchObject({
      format: "homework-supply/drawing@1",
      gradeId: "g1",
      questionID: "q1",
      submittedAt: 5000,
    });
    expect(file.homeworkSupply.strokeLog!.strokes).toHaveLength(2);
    expect(() => JSON.stringify(file)).not.toThrow();
  });
});

// Wobbly handwriting-like strokes reported one point at a time.
function handwriting(nStrokes: number, pointsPerStroke: number, seed = 7) {
  let r = seed;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const log = createStrokeLog(0);
  const done: any[] = [];
  let now = 0;
  for (let s = 0; s < nStrokes; s++) {
    const x0 = 40 + rnd() * 500;
    const y0 = 20 + rnd() * 180;
    const ang = rnd() * Math.PI * 2;
    const len = 40 + rnd() * 120;
    const bend = (rnd() - 0.5) * 2;
    const pts: Pt[] = [];
    for (let k = 0; k < pointsPerStroke; k++) {
      const u = k / (pointsPerStroke - 1);
      pts.push([
        Math.cos(ang) * len * u + Math.sin(u * Math.PI) * bend * 20 + (rnd() - 0.5) * 1.2,
        Math.sin(ang) * len * u + (rnd() - 0.5) * 1.2,
      ]);
    }
    for (let k = 1; k <= pointsPerStroke; k++) {
      now += 8;
      const el = freedraw(`e${s}`, x0, y0, pts.slice(0, k));
      updateStrokeLog(log, [...done, el], now);
      if (k === pointsPerStroke) done.push(el);
    }
    now += 300;
  }
  return log;
}

describe("encodeStrokes / decodeStrokes", () => {
  it("round-trips order, timing, erasures and shape", () => {
    const log = drawPlus("h-first");
    log.strokes[1].deletedAt = 2500;
    const data = encodeStrokes(log);
    expect(data).toMatchObject({ version: 1, startedAt: 1000, tolerance: 0.5 });
    expect(data.strokes[0]).toMatchObject({
      order: 0,
      startMs: 0,
      durationMs: 20,
      points: [0, 50, 100, 0],
      times: [20],
    });
    expect(data.strokes[1].erasedMs).toBe(1500);

    const back = decodeStrokes(JSON.parse(JSON.stringify(data)))!;
    expect(back.strokes.map((s: any) => s.order)).toEqual([0, 1]);
    expect(back.strokes[1].deletedAt).toBe(2500);
    const before = summarizeStrokes({ ...log, strokes: log.strokes.map((s) => ({ ...s, deletedAt: null })) });
    const after = summarizeStrokes({ ...back, strokes: back.strokes.map((s: any) => ({ ...s, deletedAt: null })) });
    expect(after.strokes.map((s) => [s.start, s.end])).toEqual(before.strokes.map((s) => [s.start, s.end]));
  });

  it("reads items back from GraphQL, where unset fields are null", () => {
    const fromApi = {
      version: 1,
      startedAt: 0,
      tolerance: 0.5,
      truncated: null,
      total: null,
      strokes: [
        { order: 0, startMs: 0, durationMs: 5, points: [10, 10, 5, 0], times: null, restored: null, erasedMs: null, color: null, width: null, pointCount: null },
      ],
    };
    const log = decodeStrokes(fromApi)!;
    expect(log.strokes[0]).toMatchObject({ x: 10, y: 10, color: "#000000", width: 1, deletedAt: null, timing: "observed" });
    expect(log.strokes[0].points.map((p: number[]) => p.slice(0, 2))).toEqual([[0, 0], [5, 0]]);
  });

  it("keeps stroke order checks working on stored data", () => {
    const reference = summarizeScene([
      freedraw("r1", 0, 50, [[0, 0], [100, 0]]),
      freedraw("r2", 50, 0, [[0, 0], [0, 100]]),
    ]);
    const stored = JSON.parse(JSON.stringify(encodeStrokes(drawPlus("v-first"))));
    const result = compareStrokeOrder(summarizeStrokes(decodeStrokes(stored)), reference);
    expect(result.ok).toBe(false);
    expect(result.strokes.map((s) => s.match)).toEqual([2, 1]);
  });

  it("fits typical handwriting well under the per-drawing budget", () => {
    const word = JSON.stringify(encodeStrokes(handwriting(8, 90))).length;
    const kanji = JSON.stringify(encodeStrokes(handwriting(15, 120))).length;
    expect(word).toBeLessThan(4000);
    expect(kanji).toBeLessThan(8000);
  });

  it("simplifies, then truncates, to stay under the cap", () => {
    const big = encodeStrokes(handwriting(120, 200));
    expect(JSON.stringify(big).length).toBeLessThanOrEqual(STROKE_DATA_MAX_BYTES);
    expect(big.tolerance).toBeGreaterThan(0.5);

    const tiny = encodeStrokes(handwriting(40, 100), { maxBytes: 1500 });
    expect(JSON.stringify(tiny).length).toBeLessThanOrEqual(1500);
    expect(tiny.truncated).toBe(true);
    expect(tiny.total).toBe(40);
    expect(tiny.strokes[0].order).toBe(0);
  });

  it("rebuilds Excalidraw elements in drawing order", () => {
    const els = elementsFromStrokes(encodeStrokes(drawPlus("h-first")));
    expect(els.map((e: any) => e.type)).toEqual(["freedraw", "freedraw"]);
    expect(els[0]).toMatchObject({ x: 0, y: 50, points: [[0, 0], [100, 0]], isDeleted: false });
    const file = buildDrawingFile({ elements: els, strokeLog: decodeStrokes(encodeStrokes(drawPlus("h-first"))) });
    expect(file.elements).toHaveLength(2);
  });
});
