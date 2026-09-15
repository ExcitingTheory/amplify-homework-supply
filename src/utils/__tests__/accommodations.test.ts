import { describe, expect, it } from "vitest";
import {
  parseAccommodations,
  getStudentAccommodation,
  hasAccommodation,
  getEffectiveDueDate,
  getEffectiveTimeAllowance,
} from "../accommodations";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("parseAccommodations", () => {
  it("returns an object for JSON strings", () => {
    const raw = JSON.stringify({ s1: { dueDateExtensionDays: 2 } });
    expect(parseAccommodations(raw)).toEqual({
      s1: { dueDateExtensionDays: 2 },
    });
  });

  it("passes through objects and defaults to {} on bad input", () => {
    expect(parseAccommodations({ a: 1 })).toEqual({ a: 1 });
    expect(parseAccommodations(null)).toEqual({});
    expect(parseAccommodations("not json")).toEqual({});
  });
});

describe("getStudentAccommodation", () => {
  const map = { alice: { dueDateExtensionDays: 3 } };

  it("finds a student entry from a parsed map", () => {
    expect(getStudentAccommodation(map, "alice")).toEqual({
      dueDateExtensionDays: 3,
    });
  });

  it("finds a student entry from a raw JSON string", () => {
    expect(getStudentAccommodation(JSON.stringify(map), "alice")).toEqual({
      dueDateExtensionDays: 3,
    });
  });

  it("returns null for unknown student or missing id", () => {
    expect(getStudentAccommodation(map, "bob")).toBeNull();
    expect(getStudentAccommodation(map, "")).toBeNull();
  });
});

describe("hasAccommodation", () => {
  it("is true only for meaningful entries", () => {
    expect(hasAccommodation({ dueDateExtensionDays: 1 })).toBe(true);
    expect(hasAccommodation({ timeMultiplier: 1.5 })).toBe(true);
    expect(hasAccommodation({ note: "IEP" })).toBe(true);
    expect(
      hasAccommodation({ dueDateExtensionDays: 0, timeMultiplier: 1 }),
    ).toBe(false);
    expect(hasAccommodation(null)).toBe(false);
  });
});

describe("getEffectiveDueDate", () => {
  const base = "2026-05-01T23:59:00.000Z";

  it("adds extension days to the base due date", () => {
    const result = getEffectiveDueDate(base, { dueDateExtensionDays: 2 });
    expect(new Date(result as string).getTime()).toBe(
      new Date(base).getTime() + 2 * DAY_MS,
    );
  });

  it("returns the base date unchanged when there is no extension", () => {
    expect(getEffectiveDueDate(base, null)).toBe(new Date(base).toISOString());
    expect(getEffectiveDueDate(base, { dueDateExtensionDays: 0 })).toBe(
      new Date(base).toISOString(),
    );
  });

  it("returns null for a missing or invalid base date", () => {
    expect(getEffectiveDueDate(null, { dueDateExtensionDays: 2 })).toBeNull();
    expect(
      getEffectiveDueDate("nonsense", { dueDateExtensionDays: 2 }),
    ).toBeNull();
  });
});

describe("getEffectiveTimeAllowance", () => {
  it("multiplies the allowance by the time multiplier", () => {
    expect(getEffectiveTimeAllowance(600, { timeMultiplier: 1.5 })).toBe(900);
  });

  it("returns the original allowance when multiplier is <= 1 or absent", () => {
    expect(getEffectiveTimeAllowance(600, { timeMultiplier: 1 })).toBe(600);
    expect(getEffectiveTimeAllowance(600, null)).toBe(600);
  });

  it("passes through null/undefined allowances", () => {
    expect(getEffectiveTimeAllowance(null, { timeMultiplier: 2 })).toBeNull();
  });
});
