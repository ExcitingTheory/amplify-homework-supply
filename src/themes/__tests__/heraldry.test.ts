import { describe, it, expect } from "vitest";
import {
  HERALDRY,
  hashSeed,
  pickTinctures,
  pickDivision,
  metalForTier,
  readableInk,
} from "../heraldry";

describe("HERALDRY palette", () => {
  it("exposes the seven canonical tinctures", () => {
    expect(Object.keys(HERALDRY.tinctures).sort()).toEqual(
      ["argent", "azure", "gules", "or", "purpure", "sable", "vert"].sort(),
    );
  });

  it("exposes the four metal ramps", () => {
    expect(Object.keys(HERALDRY.metals).sort()).toEqual(
      ["bronze", "gold", "platinum", "silver"].sort(),
    );
  });

  it("every tincture has main/shade/light hex values", () => {
    for (const t of Object.values(HERALDRY.tinctures)) {
      expect(t.main).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.shade).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.light).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("hashSeed", () => {
  it("is deterministic and non-negative", () => {
    expect(hashSeed("squad-42")).toBe(hashSeed("squad-42"));
    expect(hashSeed("squad-42")).toBeGreaterThanOrEqual(0);
  });

  it("differs for different seeds", () => {
    expect(hashSeed("alpha")).not.toBe(hashSeed("beta"));
  });
});

describe("pickTinctures", () => {
  it("is deterministic for a given seed", () => {
    const a = pickTinctures("g1");
    const b = pickTinctures("g1");
    expect(a).toEqual(b);
  });

  it("always returns a charge tincture distinct from the field", () => {
    for (const seed of ["g1", "g2", "g3", "alpha", "beta", "gamma", "x", ""]) {
      const { field, charge } = pickTinctures(seed);
      expect(field.name).not.toBe(charge.name);
    }
  });
});

describe("pickDivision", () => {
  it("is deterministic and within the allowed set", () => {
    const allowed = ["plain", "per-pale", "per-fess", "chevron", "bend"];
    for (const seed of ["g1", "g2", "g3", "alpha", "beta"]) {
      const d = pickDivision(seed);
      expect(allowed).toContain(d);
      expect(pickDivision(seed)).toBe(d);
    }
  });
});

describe("metalForTier", () => {
  it("maps magnitudes to the correct ramp", () => {
    expect(metalForTier(0).name).toBe("bronze");
    expect(metalForTier(999).name).toBe("bronze");
    expect(metalForTier(1000).name).toBe("silver");
    expect(metalForTier(4999).name).toBe("silver");
    expect(metalForTier(5000).name).toBe("gold");
    expect(metalForTier(14999).name).toBe("gold");
    expect(metalForTier(15000).name).toBe("platinum");
    expect(metalForTier(999999).name).toBe("platinum");
  });

  it("clamps negatives and non-finite values to bronze", () => {
    expect(metalForTier(-500).name).toBe("bronze");
    expect(metalForTier(Number.NaN).name).toBe("bronze");
  });
});

describe("readableInk", () => {
  it("returns light ink over dark fields", () => {
    expect(readableInk("#111417")).toBe("#f5f5f5");
    expect(readableInk(HERALDRY.tinctures.sable.main)).toBe("#f5f5f5");
  });

  it("returns dark ink over light fields", () => {
    expect(readableInk("#f2f5f8")).toBe("#1a1a1a");
    expect(readableInk(HERALDRY.tinctures.argent.main)).toBe("#1a1a1a");
  });

  it("handles shorthand hex", () => {
    expect(readableInk("#fff")).toBe("#1a1a1a");
    expect(readableInk("#000")).toBe("#f5f5f5");
  });
});
