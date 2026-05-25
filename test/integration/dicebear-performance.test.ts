/**
 * Performance benchmark: DiceBear avatar generation
 *
 * Measures how long it takes to generate DiceBear SVG avatars
 * at various batch sizes to inform leaderboard rendering decisions.
 */
import { describe, it, expect } from "vitest";
import { createAvatar } from "@dicebear/core";
import * as avataaarsNeutral from "@dicebear/avataaars-neutral";
import * as avataaars from "@dicebear/avataaars";
import * as toonHead from "@dicebear/toon-head";
import * as loreleiNeutral from "@dicebear/lorelei-neutral";
import * as notionists from "@dicebear/notionists";
import * as openPeeps from "@dicebear/open-peeps";
import * as personas from "@dicebear/personas";

const STYLES = {
  simple: avataaarsNeutral,
  detailed: avataaars,
  toonhead: toonHead,
  lorelei: loreleiNeutral,
  notionists: notionists,
  openpeeps: openPeeps,
  personas: personas,
} as const;

type StyleKey = keyof typeof STYLES;

function generateAvatar(seed: string, style: StyleKey, size: number = 48) {
  const avatar = createAvatar(STYLES[style] as any, {
    seed,
    size,
  });
  return avatar.toDataUri();
}

function generateAvatarSvg(seed: string, style: StyleKey, size: number = 48) {
  const avatar = createAvatar(STYLES[style] as any, {
    seed,
    size,
  });
  return avatar.toString();
}

function benchmarkBatch(count: number, style: StyleKey, size: number = 48) {
  const seeds = Array.from(
    { length: count },
    (_, i) => `user-${i}-${Date.now()}`,
  );

  const start = performance.now();
  const results = seeds.map((seed) => generateAvatar(seed, style, size));
  const elapsed = performance.now() - start;

  return { elapsed, count, avgMs: elapsed / count, results };
}

describe("DiceBear Avatar Performance", () => {
  describe("Single avatar generation", () => {
    const styles: StyleKey[] = [
      "simple",
      "detailed",
      "toonhead",
      "lorelei",
      "notionists",
      "openpeeps",
      "personas",
    ];

    it.each(styles)("generates %s style in < 50ms", (style) => {
      // Warmup
      generateAvatar("warmup", style);

      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        generateAvatar(`user-${i}`, style, 48);
        times.push(performance.now() - start);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      console.log(
        `  ${style}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`,
      );
      expect(avg).toBeLessThan(50);
    });
  });

  describe("Batch generation (leaderboard simulation)", () => {
    it("generates 10 avatars (small leaderboard)", () => {
      const { elapsed, avgMs } = benchmarkBatch(10, "simple");
      console.log(
        `  10 avatars: total=${elapsed.toFixed(2)}ms, avg=${avgMs.toFixed(2)}ms each`,
      );
      expect(elapsed).toBeLessThan(500);
    });

    it("generates 25 avatars (medium leaderboard page)", () => {
      const { elapsed, avgMs } = benchmarkBatch(25, "simple");
      console.log(
        `  25 avatars: total=${elapsed.toFixed(2)}ms, avg=${avgMs.toFixed(2)}ms each`,
      );
      expect(elapsed).toBeLessThan(1500);
    });

    it("generates 50 avatars (large leaderboard page)", () => {
      const { elapsed, avgMs } = benchmarkBatch(50, "simple");
      console.log(
        `  50 avatars: total=${elapsed.toFixed(2)}ms, avg=${avgMs.toFixed(2)}ms each`,
      );
      expect(elapsed).toBeLessThan(3000);
    });

    it("generates 100 avatars (full page / worst case)", () => {
      const { elapsed, avgMs } = benchmarkBatch(100, "simple");
      console.log(
        `  100 avatars: total=${elapsed.toFixed(2)}ms, avg=${avgMs.toFixed(2)}ms each`,
      );
      expect(elapsed).toBeLessThan(6000);
    });
  });

  describe("Mixed styles batch (realistic leaderboard)", () => {
    it("generates 50 avatars with mixed styles", () => {
      const styleKeys = Object.keys(STYLES) as StyleKey[];
      const seeds = Array.from({ length: 50 }, (_, i) => ({
        seed: `user-${i}`,
        style: styleKeys[i % styleKeys.length],
      }));

      const start = performance.now();
      seeds.forEach(({ seed, style }) => generateAvatar(seed, style, 48));
      const elapsed = performance.now() - start;

      console.log(
        `  50 mixed-style avatars: total=${elapsed.toFixed(2)}ms, avg=${(elapsed / 50).toFixed(2)}ms each`,
      );
      expect(elapsed).toBeLessThan(3000);
    });
  });

  describe("Size comparison", () => {
    it("compares generation time at different sizes", () => {
      const sizes = [24, 32, 48, 64, 96, 128];

      for (const size of sizes) {
        const start = performance.now();
        for (let i = 0; i < 20; i++) {
          generateAvatar(`user-${i}`, "simple", size);
        }
        const elapsed = performance.now() - start;
        console.log(
          `  size=${size}px: 20 avatars in ${elapsed.toFixed(2)}ms (avg ${(elapsed / 20).toFixed(2)}ms)`,
        );
      }
    });
  });

  describe("SVG output size", () => {
    it("measures SVG string sizes by style", () => {
      const styleKeys = Object.keys(STYLES) as StyleKey[];

      for (const style of styleKeys) {
        const svg = generateAvatarSvg("benchmark-user", style, 48);
        const bytes = new TextEncoder().encode(svg).length;
        console.log(
          `  ${style}: ${bytes} bytes (${(bytes / 1024).toFixed(1)} KB)`,
        );
      }
    });

    it("estimates memory for 100 data URIs", () => {
      const dataUris = Array.from({ length: 100 }, (_, i) =>
        generateAvatar(`user-${i}`, "simple", 48),
      );
      const totalBytes = dataUris.reduce(
        (sum, uri) => sum + new TextEncoder().encode(uri).length,
        0,
      );
      console.log(
        `  100 data URIs: ${(totalBytes / 1024).toFixed(1)} KB total, ${(totalBytes / 100 / 1024).toFixed(1)} KB avg`,
      );
    });
  });

  describe("Caching benefit (same seed repeated)", () => {
    it("shows no caching in createAvatar (each call regenerates)", () => {
      // First call
      const start1 = performance.now();
      const result1 = generateAvatar("same-user", "simple");
      const time1 = performance.now() - start1;

      // Second call with same seed
      const start2 = performance.now();
      const result2 = generateAvatar("same-user", "simple");
      const time2 = performance.now() - start2;

      console.log(`  First call: ${time1.toFixed(2)}ms`);
      console.log(`  Repeat call (same seed): ${time2.toFixed(2)}ms`);
      console.log(`  Results identical: ${result1 === result2}`);

      // Verify deterministic output
      expect(result1).toBe(result2);
    });
  });
});
