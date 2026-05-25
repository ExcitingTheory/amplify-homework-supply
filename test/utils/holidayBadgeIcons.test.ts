import { describe, it, expect } from "vitest";
import {
  HOLIDAY_BADGE_ICONS,
  getIconsByHoliday,
  getIconsByCulture,
  getAllHolidays,
  getAllCultures,
} from "../../src/utils/holidayBadgeIcons";

describe("holidayBadgeIcons", () => {
  it("exports at least 30 icons", () => {
    expect(HOLIDAY_BADGE_ICONS.length).toBeGreaterThanOrEqual(30);
  });

  it("covers at least 10 cultures", () => {
    const cultures = getAllCultures();
    expect(cultures.length).toBeGreaterThanOrEqual(10);
  });

  it("every icon has required fields", () => {
    for (const icon of HOLIDAY_BADGE_ICONS) {
      expect(icon.id).toBeTruthy();
      expect(icon.emoji).toBeTruthy();
      expect(icon.label).toBeTruthy();
      expect(icon.culture).toBeTruthy();
      expect(icon.holiday).toBeTruthy();
    }
  });

  it("all icon ids are unique", () => {
    const ids = HOLIDAY_BADGE_ICONS.map((icon) => icon.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe("getIconsByHoliday", () => {
    it("returns icons for Lunar New Year", () => {
      const icons = getIconsByHoliday("Lunar New Year");
      expect(icons.length).toBeGreaterThan(0);
      expect(icons.every((i) => i.holiday === "Lunar New Year")).toBe(true);
    });

    it("returns icons case-insensitively", () => {
      const icons = getIconsByHoliday("diwali");
      expect(icons.length).toBeGreaterThan(0);
    });

    it("returns partial matches", () => {
      const icons = getIconsByHoliday("New Year");
      expect(icons.length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown holiday", () => {
      expect(getIconsByHoliday("FakeHoliday")).toEqual([]);
    });
  });

  describe("getIconsByCulture", () => {
    it("returns icons for East Asian culture", () => {
      const icons = getIconsByCulture("East Asian");
      expect(icons.length).toBeGreaterThan(0);
      expect(icons.every((i) => i.culture === "East Asian")).toBe(true);
    });

    it("returns icons case-insensitively", () => {
      const icons = getIconsByCulture("islamic");
      expect(icons.length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown culture", () => {
      expect(getIconsByCulture("Martian")).toEqual([]);
    });
  });

  describe("getAllHolidays", () => {
    it("returns all unique holidays", () => {
      const holidays = getAllHolidays();
      expect(holidays.length).toBeGreaterThanOrEqual(10);
      // No duplicates
      expect(new Set(holidays).size).toBe(holidays.length);
    });
  });

  describe("getAllCultures", () => {
    it("returns all unique cultures", () => {
      const cultures = getAllCultures();
      expect(cultures.length).toBeGreaterThanOrEqual(10);
      expect(new Set(cultures).size).toBe(cultures.length);
    });
  });
});
