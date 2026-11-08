/**
 * /api/search-bundle: only people who use a unit or section can read its bundle.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockValidateAuth = vi.hoisted(() => vi.fn());
vi.mock("../../../app/api/_shared/auth", () => ({ validateAuth: mockValidateAuth }));

const mockLoadBundleObject = vi.hoisted(() => vi.fn());
vi.mock("../../../app/api/_shared/serverSearch", () => ({
  loadBundleObject: mockLoadBundleObject,
}));

const mockSectionGet = vi.hoisted(() => vi.fn());
const mockUnitGet = vi.hoisted(() => vi.fn());
const mockCollabList = vi.hoisted(() => vi.fn());
vi.mock("@/utils/amplifyServerClient", () => ({
  getServerClient: () => ({
    models: {
      Unit: { get: mockUnitGet },
      Section: { get: mockSectionGet },
      CollaboratorAccess: { list: mockCollabList },
    },
  }),
}));

import { GET } from "../../../app/api/search-bundle/route";

const request = (query: string, headers: Record<string, string> = {}) =>
  new Request(`http://localhost/api/search-bundle?${query}`, { headers }) as any;

const learner = (groups: string[]) => ({
  authenticated: true,
  userId: "sub-1",
  groups,
  identityId: "identity-1",
  ownerIds: ["sub-1", "alice", "sub-1::alice"],
});

/** A section whose assignments() returns the given unit ids. */
const sectionAssigning = (unitIds: string[]) => ({
  data: {
    assignments: async ({ filter }: any) => ({
      data: unitIds.includes(filter.unitID.eq) ? [{ id: "a1" }] : [],
      nextToken: null,
    }),
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUnitGet.mockResolvedValue({ data: { identityId: "identity-owner", owner: "owner::x" } });
  mockSectionGet.mockResolvedValue(sectionAssigning(["unit-1"]));
  mockCollabList.mockResolvedValue({ data: [], nextToken: null });
  mockLoadBundleObject.mockResolvedValue({ status: 200, body: '{"items":[]}', etag: '"v1"' });
});

describe("/api/search-bundle", () => {
  it("rejects unauthenticated requests", async () => {
    mockValidateAuth.mockResolvedValue({ authenticated: false });
    const res = await GET(request("kind=unit&id=unit-1"));
    expect(res.status).toBe(401);
    expect(mockLoadBundleObject).not.toHaveBeenCalled();
  });

  it.each([
    ["kind=other&id=unit-1"],
    ["kind=unit"],
    ["kind=unit&id=../../private/x"],
    ["kind=unit&id=a/b"],
  ])("rejects malformed input (%s)", async (query) => {
    mockValidateAuth.mockResolvedValue(learner(["section-s1-learners"]));
    const res = await GET(request(query));
    expect(res.status).toBe(400);
    expect(mockLoadBundleObject).not.toHaveBeenCalled();
  });

  it("serves a unit bundle to a learner enrolled in a section that assigns it", async () => {
    mockValidateAuth.mockResolvedValue(learner(["Learners", "section-s1-learners"]));
    const res = await GET(request("kind=unit&id=unit-1"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [] });
    expect(res.headers.get("ETag")).toBe('"v1"');
    expect(res.headers.get("Cache-Control")).toBe("private, no-cache");
    expect(mockLoadBundleObject).toHaveBeenCalledWith("search-index/unit/unit-1.json", null);
  });

  it("denies a learner for a unit their sections do not assign", async () => {
    mockValidateAuth.mockResolvedValue(learner(["Learners", "section-s1-learners"]));
    const res = await GET(request("kind=unit&id=unit-2"));
    expect(res.status).toBe(403);
    expect(mockLoadBundleObject).not.toHaveBeenCalled();
  });

  it("denies a learner who is not enrolled anywhere, even for a real unit", async () => {
    mockValidateAuth.mockResolvedValue(learner(["Learners"]));
    expect((await GET(request("kind=unit&id=unit-1"))).status).toBe(403);
    expect(mockLoadBundleObject).not.toHaveBeenCalled();
  });

  it("gives the same 403 for a unit that does not exist", async () => {
    mockUnitGet.mockResolvedValue({ data: null });
    mockValidateAuth.mockResolvedValue(learner(["section-s1-learners"]));
    expect((await GET(request("kind=unit&id=ghost"))).status).toBe(403);
  });

  it("serves the section bundle to enrolled members only", async () => {
    mockValidateAuth.mockResolvedValue(learner(["section-s1-learners"]));
    const ok = await GET(request("kind=section&id=s1"));
    expect(ok.status).toBe(200);
    expect(mockLoadBundleObject).toHaveBeenCalledWith("search-index/section/s1.json", null);

    mockSectionGet.mockResolvedValue({ data: { instructor: "someone-else" } });
    expect((await GET(request("kind=section&id=s2"))).status).toBe(403);
  });

  it("lets owners, collaborators and admins in", async () => {
    mockValidateAuth.mockResolvedValue({ ...learner(["Instructors"]), identityId: "identity-owner" });
    expect((await GET(request("kind=unit&id=unit-9"))).status).toBe(200);

    mockValidateAuth.mockResolvedValue(learner(["Instructors"]));
    mockCollabList.mockResolvedValue({ data: [{ id: "c1" }], nextToken: null });
    expect((await GET(request("kind=unit&id=unit-9"))).status).toBe(200);

    mockValidateAuth.mockResolvedValue(learner(["Admins"]));
    expect((await GET(request("kind=unit&id=unit-9"))).status).toBe(200);
  });

  it("answers 304 when the client's copy is current", async () => {
    mockValidateAuth.mockResolvedValue(learner(["section-s1-learners"]));
    mockLoadBundleObject.mockResolvedValue({ status: 304, etag: '"v1"' });
    const res = await GET(request("kind=unit&id=unit-1", { "if-none-match": '"v1"' }));
    expect(res.status).toBe(304);
    expect(mockLoadBundleObject).toHaveBeenCalledWith("search-index/unit/unit-1.json", '"v1"');
  });

  it("returns 404 for an authorized unit whose bundle was never built", async () => {
    mockValidateAuth.mockResolvedValue(learner(["section-s1-learners"]));
    mockLoadBundleObject.mockResolvedValue(null);
    expect((await GET(request("kind=unit&id=unit-1"))).status).toBe(404);
  });
});

describe("/api/search-bundle instructor bundles", () => {
  const ownId = "us-east-1:11111111-2222-3333-4444-555555555555";

  it("serves an instructor their own bundle", async () => {
    mockValidateAuth.mockResolvedValue({ ...learner(["Instructors"]), identityId: ownId });
    const res = await GET(request(`kind=instructor&id=${encodeURIComponent(ownId)}`));
    expect(res.status).toBe(200);
    expect(mockLoadBundleObject).toHaveBeenCalledWith(`search-index/instructor/${ownId}.json`, null);
  });

  it("refuses everyone else, admins included", async () => {
    for (const groups of [["Instructors"], ["Admins"], ["Learners", "section-s1-learners"]]) {
      mockLoadBundleObject.mockClear();
      mockValidateAuth.mockResolvedValue({ ...learner(groups), identityId: "us-east-1:someone-else" });
      const res = await GET(request(`kind=instructor&id=${encodeURIComponent(ownId)}`));
      expect(res.status).toBe(403);
      expect(mockLoadBundleObject).not.toHaveBeenCalled();
    }
  });

  it("refuses a request when the session has no identity", async () => {
    mockValidateAuth.mockResolvedValue({ ...learner(["Instructors"]), identityId: undefined });
    expect((await GET(request(`kind=instructor&id=${encodeURIComponent(ownId)}`))).status).toBe(403);
  });
});
