import { describe, expect, it } from "vitest";
import { buildSpikePoints } from "../FrequencyRingVisualizer";

describe("buildSpikePoints", () => {
  it("creates a round radial spike that starts at the ring and extends outward", () => {
    const points = buildSpikePoints({
      cx: 100,
      cy: 100,
      innerRadius: 30,
      outerRadius: 80,
      angle: 0,
      spread: Math.PI / 16,
    });

    expect(points).toHaveLength(5);
    expect(points[0][0]).toBeCloseTo(100 + 30, 5);
    expect(points[0][1]).toBeCloseTo(100, 5);
    expect(points[2][0]).toBeCloseTo(100 + 80, 5);
    expect(points[2][1]).toBeCloseTo(100, 5);
    expect(points[1][0]).toBeGreaterThan(points[0][0]);
    expect(points[3][0]).toBeGreaterThan(points[4][0]);
  });
});
