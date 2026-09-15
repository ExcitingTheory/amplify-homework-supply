import { describe, it, expect } from "vitest";
import {
  decide,
  AuthorizationContext,
  getSectionGroups,
  getUserSectionIds,
} from "../authz";

/**
 * Authorization Decision Matrix Tests
 *
 * Covers the role matrix: {Admin, Instructor, Learner, Moderator, None} × {read, create, update, delete}
 */

describe("Authorization: decide()", () => {
  describe("Admin role", () => {
    it("should allow Admin to read anything", () => {
      const decision = decide({
        userId: "admin-1",
        groups: ["Admins"],
        operationName: "getUnit",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Admin to create anything", () => {
      const decision = decide({
        userId: "admin-1",
        groups: ["Admins"],
        operationName: "createGrade",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Admin to update anything", () => {
      const decision = decide({
        userId: "admin-1",
        groups: ["Admins"],
        operationName: "updateDocument",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Admin to delete anything", () => {
      const decision = decide({
        userId: "admin-1",
        groups: ["Admins"],
        operationName: "deleteUnit",
      });
      expect(decision.allowed).toBe(true);
    });
  });

  describe("Instructor role", () => {
    it("should allow Instructor to read", () => {
      const decision = decide({
        userId: "instructor-1",
        groups: ["Instructors"],
        operationName: "listAssignments",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Instructor to create", () => {
      const decision = decide({
        userId: "instructor-1",
        groups: ["Instructors"],
        operationName: "createUnit",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Instructor to update", () => {
      const decision = decide({
        userId: "instructor-1",
        groups: ["Instructors"],
        operationName: "updateGrade",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Instructor to delete", () => {
      const decision = decide({
        userId: "instructor-1",
        groups: ["Instructors"],
        operationName: "deleteAssignment",
      });
      expect(decision.allowed).toBe(true);
    });
  });

  describe("Moderator role", () => {
    it("should allow Moderator to read", () => {
      const decision = decide({
        userId: "mod-1",
        groups: ["Moderators"],
        operationName: "getDocument",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Moderator to create", () => {
      const decision = decide({
        userId: "mod-1",
        groups: ["Moderators"],
        operationName: "createWord",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Moderator to update", () => {
      const decision = decide({
        userId: "mod-1",
        groups: ["Moderators"],
        operationName: "updateQuestion",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Moderator to delete", () => {
      const decision = decide({
        userId: "mod-1",
        groups: ["Moderators"],
        operationName: "deleteWord",
      });
      expect(decision.allowed).toBe(true);
    });
  });

  describe("Learner role", () => {
    it("should allow Learner to read", () => {
      const decision = decide({
        userId: "learner-1",
        groups: ["Learners"],
        operationName: "listUnits",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Learner to create", () => {
      const decision = decide({
        userId: "learner-1",
        groups: ["Learners"],
        operationName: "createGrade",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Learner to update (own data)", () => {
      const decision = decide({
        userId: "learner-1",
        groups: ["Learners"],
        operationName: "updateGrade",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow Learner to delete (own data)", () => {
      const decision = decide({
        userId: "learner-1",
        groups: ["Learners"],
        operationName: "deleteDocument",
      });
      expect(decision.allowed).toBe(true);
    });
  });

  describe("Unauthenticated user", () => {
    it("should deny read without authentication", () => {
      const decision = decide({
        userId: "",
        groups: [],
        operationName: "getUnit",
      });
      expect(decision.allowed).toBe(false);
    });

    it("should deny create without authentication", () => {
      const decision = decide({
        userId: "",
        groups: [],
        operationName: "createGrade",
      });
      expect(decision.allowed).toBe(false);
    });

    it("should deny update without authentication", () => {
      const decision = decide({
        userId: "",
        groups: [],
        operationName: "updateDocument",
      });
      expect(decision.allowed).toBe(false);
    });

    it("should deny delete without authentication", () => {
      const decision = decide({
        userId: "",
        groups: [],
        operationName: "deleteUnit",
      });
      expect(decision.allowed).toBe(false);
    });
  });

  describe("Multiple roles", () => {
    it("should allow user with Instructor + Admin", () => {
      const decision = decide({
        userId: "user-1",
        groups: ["Admins", "Instructors"],
        operationName: "updateUnit",
      });
      expect(decision.allowed).toBe(true);
    });

    it("should allow user with Learner + section group", () => {
      const decision = decide({
        userId: "learner-1",
        groups: ["Learners", "section-abc-learners"],
        operationName: "listAssignments",
      });
      expect(decision.allowed).toBe(true);
    });
  });

  describe("Custom operations", () => {
    it("should allow authenticated user for custom query (e.g., verifyAudio)", () => {
      const decision = decide({
        userId: "user-1",
        groups: ["Learners"],
        operationName: "verifyAudio",
      });
      // Custom queries that don't match read/create/update/delete should be allowed for authenticated users
      expect(decision.allowed).toBe(true);
    });
  });
});

describe("Authorization: getSectionGroups()", () => {
  it("should extract section groups for a specific section", () => {
    const groups = [
      "Instructors",
      "section-123-instructors",
      "section-456-learners",
    ];
    const result = getSectionGroups(groups, "123", "instructors");
    expect(result).toEqual(["section-123-instructors"]);
  });

  it("should extract all roles for a specific section", () => {
    const groups = [
      "Instructors",
      "section-123-instructors",
      "section-123-learners",
      "section-456-instructors",
    ];
    const result = getSectionGroups(groups, "123");
    expect(result).toEqual(["section-123-instructors", "section-123-learners"]);
  });

  it("should return empty array if user has no groups for section", () => {
    const groups = ["Instructors", "section-456-instructors"];
    const result = getSectionGroups(groups, "123", "instructors");
    expect(result).toEqual([]);
  });
});

describe("Authorization: getUserSectionIds()", () => {
  it("should extract all section IDs from section groups", () => {
    const groups = [
      "Admins",
      "section-123-instructors",
      "section-456-learners",
      "section-789-instructors",
    ];
    const result = getUserSectionIds(groups);
    expect(result.sort()).toEqual(["123", "456", "789"]);
  });

  it("should return empty array if user has no section groups", () => {
    const groups = ["Admins", "Instructors"];
    const result = getUserSectionIds(groups);
    expect(result).toEqual([]);
  });

  it("should handle duplicate sections (both instructor and learner)", () => {
    const groups = ["section-123-instructors", "section-123-learners"];
    const result = getUserSectionIds(groups);
    expect(result).toEqual(["123"]);
  });
});
