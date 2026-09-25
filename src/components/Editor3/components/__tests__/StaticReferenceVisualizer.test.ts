import { describe, expect, it } from "vitest";

import {
  buildFlowingRingPath,
  buildRadialBars,
  flowingLineNoise,
} from "../StaticReferenceVisualizer";

describe("StaticReferenceVisualizer geometry", () => {
  it("creates a closed six-lobed reference path", () => {
    const path = buildFlowingRingPath(0);

    expect(path).toMatch(/^M /);
    expect(path).toMatch(/ Z$/);
    expect(path.split(" L ")).toHaveLength(97);
  });

  it("adds smooth ripple irregularity when configured", () => {
    const regularPath = buildFlowingRingPath(0, {
      flowingRippleIrregularity: 0,
    });
    const irregularPath = buildFlowingRingPath(0, {
      flowingRippleIrregularity: 8,
      irregularityPhase: 1.25,
    });

    expect(irregularPath).not.toBe(regularPath);
    expect(irregularPath).toMatch(/ Z$/);
  });

  it("moves irregular ripple peaks when its phase changes", () => {
    const initialPath = buildFlowingRingPath(0, {
      irregularityPhase: 0,
    });
    const offsetPath = buildFlowingRingPath(0, {
      irregularityPhase: Math.PI,
    });

    expect(offsetPath).not.toBe(initialPath);
  });

  it("changes the flowing path when its animation phase advances", () => {
    const initialPath = buildFlowingRingPath(0, {
      irregularityPhase: 0,
    });
    const animatedPath = buildFlowingRingPath(0.45, {
      irregularityPhase: 1.6,
    });

    expect(animatedPath).not.toBe(initialPath);
    expect(animatedPath).toMatch(/ Z$/);
  });

  it("breaks the rigid center-symmetric ripple when strand drift changes without altering the base phase", () => {
    const centeredPath = buildFlowingRingPath(0, {
      flowingAsymmetry: 0,
      flowingSwimAmplitude: 0,
      irregularityPhase: 0,
      strandOffset: 0,
    });
    const offsetPath = buildFlowingRingPath(0, {
      flowingAsymmetry: 8,
      flowingSwimAmplitude: 12,
      irregularityPhase: 0,
      strandOffset: 0.8,
    });

    expect(offsetPath).not.toBe(centeredPath);
    expect(offsetPath).toMatch(/ Z$/);
  });

  it("keeps flowing paths within the configured bounds box", () => {
    const path = buildFlowingRingPath(0.5, {
      flowingAsymmetry: 30,
      flowingBaseRadius: 130,
      flowingChaosIntensity: 1,
      flowingLobeAmplitude: 40,
      flowingMaxRadius: 120,
      flowingRippleAmplitude: 20,
      flowingRippleIrregularity: 20,
      flowingSwimAmplitude: 20,
      irregularityPhase: 2,
      strandOffset: 1.4,
    });
    const coordinates = path
      .replace(/^M /, "")
      .replace(/ Z$/, "")
      .split(" L ")
      .map((point) => point.split(" ").map(Number));

    expect(
      coordinates.every(
        ([x, y]) => x >= 39.99 && x <= 280.01 && y >= 39.99 && y <= 280.01,
      ),
    ).toBe(true);
  });

  it("fits oversized flowing paths to the box instead of a circular rim", () => {
    const path = buildFlowingRingPath(0.5, {
      flowingAsymmetry: 30,
      flowingBaseRadius: 130,
      flowingChaosIntensity: 1,
      flowingLobeAmplitude: 40,
      flowingMaxRadius: 120,
      flowingRippleAmplitude: 20,
      flowingRippleIrregularity: 20,
      flowingSwimAmplitude: 20,
      irregularityPhase: 2,
      strandOffset: 1.4,
    });
    const radii = path
      .replace(/^M /, "")
      .replace(/ Z$/, "")
      .split(" L ")
      .map((point) => {
        const [x, y] = point.split(" ").map(Number);
        return Math.hypot(x - 160, y - 160);
      });

    expect(Math.max(...radii)).toBeGreaterThan(120);
  });

  it("creates deterministic bounded variation for flowing lines", () => {
    const firstLineNoise = flowingLineNoise(0);

    expect(firstLineNoise).toBeGreaterThanOrEqual(-1);
    expect(firstLineNoise).toBeLessThanOrEqual(1);
    expect(flowingLineNoise(0)).toBe(firstLineNoise);
    expect(flowingLineNoise(1)).not.toBe(firstLineNoise);
  });

  it("creates outward-facing deterministic radial bars", () => {
    const bars = buildRadialBars();

    expect(bars).toHaveLength(168);
    expect(bars.every((bar) => bar.outerRadius > bar.innerRadius)).toBe(true);
    expect(buildRadialBars()).toEqual(bars);
  });
});
