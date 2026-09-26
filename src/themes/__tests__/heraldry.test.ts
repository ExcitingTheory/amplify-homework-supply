import { describe, it, expect } from "vitest";
import { createTheme } from "@mui/material/styles";
import {
  getTinctures,
  getMetals,
  hashSeed,
  pickTinctures,
  pickDivision,
  metalForTier,
  readableInk,
} from "../heraldry";

const lightTheme = createTheme({ palette: { mode: "light" } });
const darkTheme = createTheme({ palette: { mode: "dark" } });

describe("getTinctures", () => {
  it("exposes the seven canonical tinctures for light and dark themes", () => {
    for (const theme of [lightTheme, darkTheme]) {
      expect(Object.keys(getTinctures(theme)).sort()).toEqual(
        ["argent", "azure", "gules", "or", "purpure", "sable", "vert"].sort(),
      );
    }
  });

  it("every tincture has main/shade/light CSS color values", () => {
    // main comes straight from the theme (usually hex); shade/light are
    // computed via MUI's darken()/lighten(), which return rgb() strings.
    const cssColor = /^#[0-9a-f]{6}$|^rgba?\(/i;
    for (const theme of [lightTheme, darkTheme]) {
      for (const t of Object.values(getTinctures(theme))) {
        expect(t.main).toMatch(cssColor);
        expect(t.shade).toMatch(cssColor);
        expect(t.light).toMatch(cssColor);
      }
    }
  });
});

describe("getMetals", () => {
  it("exposes the four metal ramps for light and dark themes", () => {
    for (const theme of [lightTheme, darkTheme]) {
      expect(Object.keys(getMetals(theme)).sort()).toEqual(
        ["bronze", "gold", "platinum", "silver"].sort(),
      );
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
    const a = pickTinctures("g1", lightTheme);
    const b = pickTinctures("g1", lightTheme);
    expect(a).toEqual(b);
  });

  it("always returns a charge tincture distinct from the field", () => {
    for (const seed of ["g1", "g2", "g3", "alpha", "beta", "gamma", "x", ""]) {
      const { field, charge } = pickTinctures(seed, lightTheme);
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
    expect(metalForTier(0, lightTheme).name).toBe("bronze");
    expect(metalForTier(999, lightTheme).name).toBe("bronze");
    expect(metalForTier(1000, lightTheme).name).toBe("silver");
    expect(metalForTier(4999, lightTheme).name).toBe("silver");
    expect(metalForTier(5000, lightTheme).name).toBe("gold");
    expect(metalForTier(14999, lightTheme).name).toBe("gold");
    expect(metalForTier(15000, lightTheme).name).toBe("platinum");
    expect(metalForTier(999999, lightTheme).name).toBe("platinum");
  });

  it("clamps negatives and non-finite values to bronze", () => {
    expect(metalForTier(-500, lightTheme).name).toBe("bronze");
    expect(metalForTier(Number.NaN, lightTheme).name).toBe("bronze");
  });
});

describe("readableInk", () => {
  it("returns light ink over dark fields", () => {
    expect(readableInk("#111417")).toBe("#f5f5f5");
    expect(readableInk(getTinctures(lightTheme).sable.main)).toBe("#f5f5f5");
  });

  it("returns dark ink over light fields", () => {
    expect(readableInk("#f2f5f8")).toBe("#1a1a1a");
    expect(readableInk(getTinctures(lightTheme).argent.main)).toBe("#1a1a1a");
  });

  it("handles shorthand hex", () => {
    expect(readableInk("#fff")).toBe("#1a1a1a");
    expect(readableInk("#000")).toBe("#f5f5f5");
  });
});
