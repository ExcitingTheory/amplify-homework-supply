import { describe, it, expect } from "vitest";
import {
  getOwnerIdentifiers,
  isAttendingViaLearnerGroup,
  isOwnedByUser,
  partitionByAccess,
} from "../../src/utils/ownership";

const session = {
  idToken: { payload: { sub: "sub-1", "cognito:username": "ada" } },
};

describe("ownership", () => {
  it("builds identifiers from the id token", () => {
    expect(getOwnerIdentifiers(session)).toEqual([
      "sub-1",
      "ada",
      "sub-1::ada",
    ]);
    expect(getOwnerIdentifiers(undefined)).toEqual([]);
  });

  it("matches bare sub, username, and sub::username owners", () => {
    const ids = getOwnerIdentifiers(session);
    expect(isOwnedByUser({ owner: "sub-1" }, ids)).toBe(true);
    expect(isOwnedByUser({ owner: "ada" }, ids)).toBe(true);
    expect(isOwnedByUser({ owner: "sub-1::ada" }, ids)).toBe(true);
    expect(isOwnedByUser({ owner: "other" }, ids)).toBe(false);
  });

  it("treats a matching instructor as ownership", () => {
    const ids = getOwnerIdentifiers(session);
    expect(isOwnedByUser({ owner: "other", instructor: "sub-1" }, ids)).toBe(
      true,
    );
  });

  it("never owns anything without identifiers", () => {
    expect(isOwnedByUser({ owner: "sub-1" }, [])).toBe(false);
    expect(isOwnedByUser({ owner: null }, ["sub-1"])).toBe(false);
  });

  it("partitions into owned, attending, and administering", () => {
    const ids = getOwnerIdentifiers(session);
    const groups = ["Instructors", "section-s2-learners"];
    const mine = { id: "a", owner: "sub-1::ada" };
    const attended = {
      id: "b",
      owner: "sub-2::bob",
      readableGroups: ["section-s2-instructors", "section-s2-learners"],
    };
    const viaLearnerField = {
      id: "c",
      owner: "sub-2::bob",
      learner: "section-s2-learners",
    };
    const administered = {
      id: "d",
      owner: "sub-2::bob",
      readableGroups: ["section-s3-instructors", "section-s3-learners"],
    };
    expect(
      partitionByAccess(
        [mine, attended, viaLearnerField, administered],
        ids,
        groups,
      ),
    ).toEqual({
      owned: [mine],
      attending: [attended, viaLearnerField],
      administering: [administered],
    });
  });

  it("does not count an instructor group as attending", () => {
    const item = { owner: "x", readableGroups: ["section-s1-instructors"] };
    expect(isAttendingViaLearnerGroup(item, ["section-s1-instructors"])).toBe(
      false,
    );
  });
});
