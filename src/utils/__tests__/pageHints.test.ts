import { describe, expect, it } from "vitest";
import {
  getHintPreferences,
  getHintRole,
  getHintRouteKey,
  resolvePageHint,
  withHintSeen,
  type HintProgress,
} from "../pageHints";

const progress = (overrides: Partial<HintProgress> = {}): HintProgress => ({
  ownedSectionCount: 0,
  ownedUnitCount: 0,
  ownedAssignmentCount: 0,
  joinedSectionCount: 0,
  ...overrides,
});

describe("getHintRole", () => {
  it("prioritises admins over instructors", () => {
    expect(getHintRole(["Instructors", "Admins"])).toBe("admin");
  });

  it("treats instructors and moderators as instructors", () => {
    expect(getHintRole(["Instructors"])).toBe("instructor");
    expect(getHintRole(["Moderators"])).toBe("instructor");
  });

  it("defaults to learner", () => {
    expect(getHintRole(["Learners"])).toBe("learner");
    expect(getHintRole(undefined)).toBe("learner");
  });
});

describe("getHintRouteKey", () => {
  it.each([
    ["/", "home"],
    ["/sections", "sections"],
    ["/sections/", "sections"],
    ["/section/abc", "section"],
    ["/units", "units"],
    ["/admin", "admin"],
    ["/admin/settings", "adminSettings"],
  ])("maps %s to %s", (path, key) => {
    expect(getHintRouteKey(path)).toBe(key);
  });

  it("leaves editors and unknown routes unmapped", () => {
    expect(getHintRouteKey("/unit/abc")).toBeNull();
    expect(getHintRouteKey("/workbook/abc")).toBeNull();
    expect(getHintRouteKey("/dashboard")).toBeNull();
    expect(getHintRouteKey(null)).toBeNull();
  });
});

describe("resolvePageHint on home", () => {
  it("tells admins to tune settings without waiting for progress", () => {
    expect(resolvePageHint("home", "admin", null)?.id).toBe(
      "home.admin.tuneWorkspace",
    );
  });

  it("waits for progress before hinting instructors and learners", () => {
    expect(resolvePageHint("home", "instructor", null)).toBeNull();
    expect(resolvePageHint("home", "learner", null)).toBeNull();
  });

  it("walks instructors through setup in order", () => {
    const id = (p: HintProgress) =>
      resolvePageHint("home", "instructor", p)?.id;
    expect(id(progress())).toBe("home.instructor.noSection");
    expect(id(progress({ ownedSectionCount: 1 }))).toBe(
      "home.instructor.noUnit",
    );
    expect(id(progress({ ownedSectionCount: 1, ownedUnitCount: 1 }))).toBe(
      "home.instructor.noAssignment",
    );
    expect(
      id(
        progress({
          ownedSectionCount: 1,
          ownedUnitCount: 1,
          ownedAssignmentCount: 1,
        }),
      ),
    ).toBe("home.instructor.active");
  });

  it("asks learners without a class to join one", () => {
    expect(resolvePageHint("home", "learner", progress())?.id).toBe(
      "home.learner.noSection",
    );
    expect(
      resolvePageHint("home", "learner", progress({ joinedSectionCount: 1 }))
        ?.id,
    ).toBe("home.learner.active");
  });
});

describe("resolvePageHint on other routes", () => {
  it("returns role-specific copy", () => {
    expect(resolvePageHint("sections", "learner", null)?.id).toBe(
      "sections.learner",
    );
    expect(resolvePageHint("sections", "instructor", null)?.id).toBe(
      "sections.instructor",
    );
  });

  it("lets admins reuse instructor hints but not the reverse", () => {
    expect(resolvePageHint("units", "admin", null)?.id).toBe(
      "units.instructor",
    );
    expect(resolvePageHint("adminSettings", "instructor", null)).toBeNull();
  });

  it("has no hint for learners on instructor-only pages", () => {
    expect(resolvePageHint("units", "learner", null)).toBeNull();
  });
});

describe("hint preferences", () => {
  it("treats unset Settings fields as enabled with nothing seen", () => {
    expect(getHintPreferences(undefined)).toEqual({ enabled: true, seen: [] });
    expect(getHintPreferences({})).toEqual({ enabled: true, seen: [] });
    expect(
      getHintPreferences({ pageHintsEnabled: null, pageHintsSeen: null }),
    ).toEqual({ enabled: true, seen: [] });
  });

  it("reads the opt-out and drops null seen entries", () => {
    expect(
      getHintPreferences({
        pageHintsEnabled: false,
        pageHintsSeen: ["a", null, "b"],
      }),
    ).toEqual({ enabled: false, seen: ["a", "b"] });
  });

  it("appends seen ids without duplicates", () => {
    expect(withHintSeen(["a"], "b")).toEqual(["a", "b"]);
    expect(withHintSeen(["a", "b"], "a")).toEqual(["a", "b"]);
  });
});
