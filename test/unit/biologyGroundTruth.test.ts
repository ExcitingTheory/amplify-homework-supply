// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { loadBiologyGroundTruth } from "../fixtures/biology/groundTruth";

describe("biology textbook ground truth", () => {
  it("pins the original source and annotates every prose/definition block", () => {
    const { source, text, units, claims } = loadBiologyGroundTruth();
    expect(createHash("sha256").update(text).digest("hex")).toBe(source.sha256);
    expect(units).toHaveLength(47);
    expect(claims.length).toBeGreaterThan(150);
    expect(new Set(units.map((unit) => unit.id)).size).toBe(units.length);
    expect(new Set(claims.map((claim) => claim.id)).size).toBe(claims.length);
    expect(new Set(units.map((unit) => unit.headingPath[0])).size).toBe(4);
    for (const unit of units) {
      expect(text.slice(unit.start, unit.end)).toBe(unit.text);
      expect(claims.some((claim) => claim.evidence.unitId === unit.id)).toBe(true);
    }
  });

  it("retains exact evidence and separate subject/predicate/object for each claim", () => {
    const { text, units, claims } = loadBiologyGroundTruth();
    for (const claim of claims) {
      expect(claim.subject.trim()).not.toBe("");
      expect(claim.predicate.trim()).not.toBe("");
      expect(claim.object.trim()).not.toBe("");
      expect(text.slice(claim.evidence.start, claim.evidence.end)).toBe(claim.evidence.quote);
      expect(units.find((unit) => unit.id === claim.evidence.unitId)?.text).toBe(claim.evidence.quote);
    }
  });

  it("covers lists, numerical ranges, dates, locations, processes and contrasts", () => {
    const { units, claims } = loadBiologyGroundTruth();
    expect(units.find((unit) => unit.id === "cell-theory")?.kind).toBe("definition-with-list");
    expect(claims.filter((claim) => claim.evidence.unitId === "cell-theory")).toHaveLength(3);
    for (const object of ["1665", "1-10 μm", "10-100 μm", "a nucleoid region", "ribosomes"]) {
      expect(claims.some((claim) => claim.object === object)).toBe(true);
    }
    expect(claims.find((claim) => claim.id === "diffusion-1")?.object)
      .toBe("high concentration to low concentration");
    expect(claims.find((claim) => claim.id === "active-transport-2")?.object)
      .toBe("low to high concentration");
  });

  it("does not require scientifically oversimplified source claims for recall", () => {
    const { claims } = loadBiologyGroundTruth();
    const caveats = claims.filter((claim) => claim.sourceCaveat);
    expect(caveats).toHaveLength(3);
    expect(caveats.every((claim) => !claim.required)).toBe(true);
    expect(claims.filter((claim) => claim.required).every((claim) => !claim.sourceCaveat)).toBe(true);
  });
});
