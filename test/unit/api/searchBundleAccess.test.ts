import { describe, it, expect, vi } from "vitest";

vi.mock("@/utils/amplifyServerClient", () => ({ getServerClient: () => ({}) }));

import {
  canReadBundle,
  canReadInstructorBundle,
  canReadSectionBundle,
  canReadUnitBundle,
  createBundleAccessData,
  enrolledSectionIds,
  type BundleAccessData,
  type BundleUser,
} from "../../../app/api/_shared/searchBundleAccess";

const user = (overrides: Partial<BundleUser> = {}): BundleUser => ({
  userId: "sub-1",
  groups: [],
  identityId: "identity-1",
  ownerIds: ["sub-1", "alice", "sub-1::alice"],
  ...overrides,
});

function fakeData(overrides: Partial<BundleAccessData> = {}): BundleAccessData {
  return {
    getUnit: vi.fn(async () => ({ identityId: "identity-owner", owner: "owner-sub::owner" })),
    getSection: vi.fn(async () => ({ instructor: "owner-sub" })),
    isCollaborator: vi.fn(async () => false),
    sectionAssignsUnit: vi.fn(async () => false),
    ...overrides,
  };
}

describe("enrolledSectionIds", () => {
  it("reads learner and instructor section groups only", () => {
    expect(
      enrolledSectionIds([
        "Learners",
        "section-abc-learners",
        "section-d-e-f-instructors",
        "section-abc-instructors",
        "section-zzz-admins",
        "Admins",
      ]),
    ).toEqual(["abc", "d-e-f"]);
  });
});

describe("canReadUnitBundle", () => {
  it("lets admins read any unit without lookups", async () => {
    const data = fakeData();
    expect(await canReadUnitBundle(user({ groups: ["Admins"] }), "u1", data)).toBe(true);
    expect(data.getUnit).not.toHaveBeenCalled();
  });

  it("lets a learner read a unit assigned to a section they are enrolled in", async () => {
    const data = fakeData({
      sectionAssignsUnit: vi.fn(async (sectionId) => sectionId === "s2"),
    });
    const learner = user({ groups: ["Learners", "section-s1-learners", "section-s2-learners"] });
    expect(await canReadUnitBundle(learner, "u1", data)).toBe(true);
  });

  it("denies a learner for units that are not assigned to their sections", async () => {
    const data = fakeData();
    const learner = user({ groups: ["Learners", "section-s1-learners"] });
    expect(await canReadUnitBundle(learner, "u1", data)).toBe(false);
    expect(data.sectionAssignsUnit).toHaveBeenCalledWith("s1", "u1");
  });

  it("denies learners who are in no section at all", async () => {
    const data = fakeData();
    expect(await canReadUnitBundle(user({ groups: ["Learners"] }), "u1", data)).toBe(false);
    expect(data.sectionAssignsUnit).not.toHaveBeenCalled();
  });

  it("denies units that do not exist", async () => {
    const data = fakeData({ getUnit: vi.fn(async () => null) });
    expect(await canReadUnitBundle(user({ groups: ["section-s1-learners"] }), "u1", data)).toBe(false);
  });

  it("lets the owner read via identity id or owner field", async () => {
    const owner = user({ identityId: "identity-owner" });
    expect(await canReadUnitBundle(owner, "u1", fakeData())).toBe(true);

    const byOwnerField = user({ ownerIds: ["owner-sub", "owner", "owner-sub::owner"], identityId: undefined });
    expect(await canReadUnitBundle(byOwnerField, "u1", fakeData())).toBe(true);
  });

  it("does not treat a missing identity as ownership", async () => {
    const data = fakeData({ getUnit: vi.fn(async () => ({ identityId: null, owner: null })) });
    expect(await canReadUnitBundle(user({ identityId: undefined }), "u1", data)).toBe(false);
  });

  it("lets a collaborator read", async () => {
    const data = fakeData({ isCollaborator: vi.fn(async () => true) });
    expect(await canReadUnitBundle(user({ groups: ["Instructors"] }), "u1", data)).toBe(true);
    expect(data.isCollaborator).toHaveBeenCalledWith("u1", "sub-1");
  });

  it("does not let an unrelated instructor read", async () => {
    expect(await canReadUnitBundle(user({ groups: ["Instructors"] }), "u1", fakeData())).toBe(false);
  });
});

describe("canReadSectionBundle", () => {
  it("allows admins, enrolled members and the section's instructor", async () => {
    expect(await canReadSectionBundle(user({ groups: ["Admins"] }), "s1", fakeData())).toBe(true);
    expect(await canReadSectionBundle(user({ groups: ["section-s1-learners"] }), "s1", fakeData())).toBe(true);
    expect(
      await canReadSectionBundle(user({ ownerIds: ["owner-sub"] }), "s1", fakeData()),
    ).toBe(true);
  });

  it("denies everyone else", async () => {
    expect(await canReadSectionBundle(user({ groups: ["section-s2-learners", "Learners"] }), "s1", fakeData())).toBe(false);
    const missing = fakeData({ getSection: vi.fn(async () => null) });
    expect(await canReadSectionBundle(user(), "s1", missing)).toBe(false);
  });
});

describe("createBundleAccessData.sectionAssignsUnit", () => {
  const clientWith = (pages: any[][]) => {
    let call = 0;
    const assignments = vi.fn(async () => {
      const data = pages[call++] ?? [];
      return { data, nextToken: call < pages.length ? `t${call}` : null };
    });
    return {
      assignments,
      client: { models: { Section: { get: vi.fn(async () => ({ data: { assignments } })) } } },
    };
  };

  it("follows pages until it finds the unit", async () => {
    const { client, assignments } = clientWith([[], [], [{ id: "a1" }]]);
    expect(await createBundleAccessData(client).sectionAssignsUnit("s1", "u1")).toBe(true);
    expect(assignments).toHaveBeenCalledTimes(3);
    expect(assignments).toHaveBeenCalledWith({ filter: { unitID: { eq: "u1" } }, nextToken: undefined });
  });

  it("is false when no page has an assignment", async () => {
    const { client } = clientWith([[], []]);
    expect(await createBundleAccessData(client).sectionAssignsUnit("s1", "u1")).toBe(false);
  });

  it("is false for a section that cannot be read", async () => {
    const client = { models: { Section: { get: vi.fn(async () => ({ data: null })) } } };
    expect(await createBundleAccessData(client).sectionAssignsUnit("s1", "u1")).toBe(false);
  });
});

describe("instructor bundles", () => {
  it("are readable only by the identity that owns them", () => {
    expect(canReadInstructorBundle(user({ identityId: "identity-1" }), "identity-1")).toBe(true);
    expect(canReadInstructorBundle(user({ identityId: "identity-1" }), "identity-2")).toBe(false);
  });

  it("are not readable by admins, instructors, collaborators or learners of someone else", async () => {
    for (const groups of [["Admins"], ["Instructors"], ["Learners", "section-s1-learners"]]) {
      expect(
        await canReadBundle("instructor", user({ groups, identityId: "identity-1" }), "identity-owner", fakeData()),
      ).toBe(false);
    }
  });

  it("never match when the session has no identity", () => {
    expect(canReadInstructorBundle(user({ identityId: undefined }), "undefined")).toBe(false);
    expect(canReadInstructorBundle(user({ identityId: undefined }), "")).toBe(false);
  });
});
