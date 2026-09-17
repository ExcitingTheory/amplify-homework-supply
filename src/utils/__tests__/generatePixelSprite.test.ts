import { describe, it, expect } from "vitest";
import {
  generateSpriteData,
  renderSpriteSvg,
  generatePixelSpriteSvg,
  CELL,
} from "../generatePixelSprite";

describe("generatePixelSprite", () => {
  it("generates deterministic sprite from seed", () => {
    const a = generatePixelSpriteSvg("test-seed", 1);
    const b = generatePixelSpriteSvg("test-seed", 1);
    expect(a).toBe(b);
  });

  it("produces different sprites for different seeds", () => {
    const a = generatePixelSpriteSvg("alice", 3);
    const b = generatePixelSpriteSvg("bob", 3);
    expect(a).not.toBe(b);
  });

  it("produces different sprites for different stages", () => {
    const a = generatePixelSpriteSvg("same-seed", 1);
    const b = generatePixelSpriteSvg("same-seed", 3);
    expect(a).not.toBe(b);
  });

  it("grid size grows with stage", () => {
    const s1 = generateSpriteData({ seed: "test", stage: 1 });
    const s5 = generateSpriteData({ seed: "test", stage: 5 });
    expect(s5.halfWidth).toBeGreaterThan(s1.halfWidth);
    expect(s5.height).toBeGreaterThan(s1.height);
  });

  it("palette has more colors at higher stages", () => {
    const s1 = generateSpriteData({ seed: "test", stage: 1 });
    const s5 = generateSpriteData({ seed: "test", stage: 5 });
    expect(s5.palette.length).toBeGreaterThan(s1.palette.length);
  });

  it("generates valid SVG string", () => {
    const svg = generatePixelSpriteSvg("test", 3, 4);
    expect(svg).toContain("<svg");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("<rect");
    expect(svg).toContain("</svg>");
  });

  it("clamps stage to 1-5 range", () => {
    const low = generateSpriteData({ seed: "test", stage: -1 });
    const high = generateSpriteData({ seed: "test", stage: 99 });
    expect(low.halfWidth).toBe(7); // stage 1: 5 + 2
    expect(high.halfWidth).toBe(15); // stage 5: 5 + 10
  });

  it("renders symmetric sprite (mirrored rects)", () => {
    const svg = generatePixelSpriteSvg("symmetric-test", 2, 4);
    // Count rect elements — should be even (each body cell generates 2 rects: left + mirror)
    const rectCount = (svg.match(/<rect/g) || []).length;
    expect(rectCount % 2).toBe(0);
  });

  it("always gives the creature a face (eyes) at every seed and stage", () => {
    for (const seed of ["a", "b", "alice", "bob", "xyz", "squad-42"]) {
      for (let stage = 1; stage <= 5; stage++) {
        const data = generateSpriteData({ seed, stage });
        const hasPupil = data.grid.some((row) => row.includes(CELL.PUPIL));
        expect(hasPupil).toBe(true);
        expect(data.eyes.left.x).toBeGreaterThanOrEqual(0);
        expect(data.eyes.right.x).toBeGreaterThan(data.eyes.left.x);
        expect(data.faceRow).toBeGreaterThanOrEqual(0);
        expect(data.faceRow).toBeLessThan(data.height);
      }
    }
  });

  it("exposes eye anchors mirrored around the centre line", () => {
    const data = generateSpriteData({ seed: "anchor", stage: 4 });
    const fullWidth = data.halfWidth * 2;
    expect(data.eyes.left.x + data.eyes.right.x).toBe(fullWidth - 1);
    expect(data.eyes.left.y).toBe(data.eyes.right.y);
  });

  it("overlays a borrowed accessory as a vector group", () => {
    const plain = generatePixelSpriteSvg("accessory-seed", 3, 4);
    for (const id of [
      "sunglasses",
      "round",
      "wayfarers",
      "prescription01",
      "eyepatch",
      "kurt",
    ]) {
      const worn = generatePixelSpriteSvg("accessory-seed", 3, 4, id);
      expect(worn).toContain('<g transform="translate');
      expect(worn.length).toBeGreaterThan(plain.length);
    }
  });

  it("accessory overlay is deterministic and unknown ids are a no-op", () => {
    const a = generatePixelSpriteSvg("det", 2, 4, "sunglasses");
    const b = generatePixelSpriteSvg("det", 2, 4, "sunglasses");
    expect(a).toBe(b);
    const plain = generatePixelSpriteSvg("det", 2, 4);
    const unknown = generatePixelSpriteSvg("det", 2, 4, "not-a-real-accessory");
    expect(unknown).toBe(plain);
  });
});
