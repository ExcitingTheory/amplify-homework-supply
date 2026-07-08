/**
 * Tests for /api/hls route authorization (A1):
 * - Unauthenticated requests are rejected (401)
 * - Learner access to unenrolled content is denied (403)
 * - Valid enrolled-learner access succeeds (200)
 * - Privileged users (Instructors/Admins) bypass enrollment check
 * - Missing/invalid path parameter returns 400
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Auth mock ─────────────────────────────────────────────────────────────────
const mockValidateAuth = vi.hoisted(() => vi.fn());
vi.mock("../../../app/api/_shared/auth", () => ({
  validateAuth: mockValidateAuth,
}));

// ── Amplify server client mock ────────────────────────────────────────────────
const mockFileList = vi.hoisted(() => vi.fn());
const mockAssignmentList = vi.hoisted(() => vi.fn());
vi.mock("@/utils/amplifyServerClient", () => ({
  getServerClient: () => ({
    models: {
      File: { list: mockFileList },
      Assignment: { list: mockAssignmentList },
    },
  }),
}));

// ── SSM mock (CF credentials) ─────────────────────────────────────────────────
vi.mock("@aws-sdk/client-ssm", () => {
  function MockSSMClient() {
    return {
      send: vi.fn().mockImplementation((cmd: any) => {
        if (cmd?.input?.Name?.includes("private-key")) {
          return { Parameter: { Value: FAKE_PRIVATE_KEY } };
        }
        return { Parameter: { Value: "FAKE_KEY_PAIR_ID" } };
      }),
    };
  }
  function MockGetParameterCommand(this: unknown, input: unknown) {
    (this as any).input = input;
  }
  return {
    SSMClient: MockSSMClient,
    GetParameterCommand: MockGetParameterCommand,
  };
});

// ── Global fetch mock (manifest fetch) ────────────────────────────────────────
const mockFetch = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    ok: true,
    text: () =>
      Promise.resolve("#EXTM3U\n#EXT-X-TARGETDURATION:6\nsegment0.ts\n"),
  }),
);
vi.stubGlobal("fetch", mockFetch);

// Test RSA key (generated for testing only — not used anywhere else)
const FAKE_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA5hc+1tFvsGjK0B5lNTpiljfqmnjG7p1hYv4H9JrUnReh4NjW
7Dk1ZOSSTHGTXUK1EzZPs0BwIGP9cBima94SUnzVP7q+iB1AZVw3BPpwW4gpxIDl
c0bff2BfqIcAk0CZU1OxVs22+Uocl7Z3MOfzDpFUgXoPKuP+I5WMesNHK0f6daIB
mapPKInQmbesVZLjZFhq4YV+jX/kHaIzw08CsHxlgfWr/AV3OE43mK7HSYHGv4vR
RR+7P/zEIVrhf+/CngC420hhe/zRswKwhfb4LncA8L+RsDSAMSePuoLcUmeRhKd8
ewkcA0FkpOOqIbxM5zUF/FJ3RC/vxtPjaRaFLwIDAQABAoIBACdOuVGBng8JF/zN
9IRPYSBAlTemgnWpNUXwF/PVr5TWwLTk1nKso06FLekZTg+UodKSaLM6wu0Fp/pK
e8PZwE+PO+8TPBGMzb+DLXMQRbmdXWVQj+JNrUjZcf4cciC13Hu7xIQLyMJ1wsS4
S0xzk7ZdZY5pB8ZQBM6XcdRXIAVoh5htZ0vZUe886Hfw5UUiwKVipesKP4JZPVyz
LkOgK37X1J3JCiqqR/9dGmMDaoXCLeP+GqMsAa/uRgn9zkk/nRfT5xW15hQwPKWz
n7yp/JmGojEMyLC62uuktN9Ptbt8TLvpiQP+fymnGEhAygwX72T/JJTE1gS3Wo0I
4/eLE0ECgYEA81jJAhl+oHMrXpzvUcWZVkB3a88B9ffUkRXW1/SUFNcnoyPzIee8
l/zC68XSLBunEVWYsbC/uVbJ7prZ54+rlnD5pz8EDO13Ti5FNWVNR8EnP8zTXfnT
AFlLJx1Ski+8kSHSE5/fsZct3HPiyJySsLEeylB2ox49OTQ8YV6XQzcCgYEA8g4C
EgnlrIAqOkSj1UHGYj3eucwtIsZPOr+145A03fUPK2tTTP1ouyjE99wO3+5dO1rb
1QJvFDRhbyyZ2PFSBWi6oc7Sjq2oKI/M/xl9TTPkM9cG9dmalEX9I9Wyx+m7jQxx
PQLd+r6dOnba9qClpLIkSDQageObedVfDbFAuckCgYEAnny1tXtbQC6iEWXObAhw
vH8SCBHzafn15GQ/37h39TbHpvXT9MITzz0cyie1oWqFHcIMx7WguJnwvEj4IFsu
2rVLs4RUJANIz49NHeCTO2duI5xIEQ2TQcfmLVxombMjcbaANq3KJ8SZZtnG2vc2
hoNk1Ukga05Xe3ks1hGgHHMCgYEA5ixL67tdm9uETERZRsF1VJZg5W0yvo61aLhE
zlCi9S3DbxZv8BZJMTBjnQ61VlvkbDzKLpRR7HSi8oUHBzTzOhGM57E0qFiaP3f/
B9XFQVTG/ETNaZuzUqv7O8hKaa/pmQbr54iCbZ41BRNgxIWe/i4oMkDZtAosHn64
FN0pH4ECgYA39dKsYrP0cVAFE4gFE7UMdrQ+2WglnfHVffob5PPILnpXWb1LVrf4
vbkSFtuehNdnyfFxjdnCJSxYutozZgt88md7dhSvtez+uOBP9zXh3ZCZaxzIz+we
TdYWmT1gaGSWsv9/dRR5mW9wO8LjdqGDCipfPebVH7YyJcSJP8DS4A==
-----END RSA PRIVATE KEY-----`;

// ── Env vars ──────────────────────────────────────────────────────────────────
process.env.NEXT_PUBLIC_CDN_DOMAIN = "cdn.example.com";

// ── Import after mocks ────────────────────────────────────────────────────────
import { GET } from "../../../app/api/hls/route";
import { NextRequest } from "next/server";

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRequest(path?: string): NextRequest {
  const url = path
    ? `http://localhost/api/hls?path=${encodeURIComponent(path)}`
    : "http://localhost/api/hls";
  return new NextRequest(url);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("/api/hls - HLS Media Authorization (A1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("rejects unauthenticated requests with 401", async () => {
      mockValidateAuth.mockResolvedValue({ authenticated: false });

      const res = await GET(makeRequest("protected/abc/file1/file1.m3u8"));
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("Path validation", () => {
    it("rejects missing path parameter with 400", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "user-1",
        groups: ["Instructors"],
      });

      const res = await GET(makeRequest());
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toMatch(/Missing/);
    });

    it("rejects non-protected paths with 400", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "user-1",
        groups: ["Instructors"],
      });

      const res = await GET(makeRequest("public/some/file.m3u8"));
      expect(res.status).toBe(400);
    });

    it("rejects non-.m3u8 paths with 400", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "user-1",
        groups: ["Instructors"],
      });

      const res = await GET(makeRequest("protected/abc/file1/file1.ts"));
      expect(res.status).toBe(400);
    });
  });

  describe("Privileged users (Instructors/Admins)", () => {
    it("allows Instructors to access any HLS path without enrollment check", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "instructor-1",
        groups: ["Instructors"],
      });

      const res = await GET(
        makeRequest("protected/other-user/file1/file1.m3u8"),
      );
      expect(res.status).toBe(200);
      // Should NOT have called File.list (enrollment check skipped)
      expect(mockFileList).not.toHaveBeenCalled();
    });

    it("allows Admins to access any HLS path without enrollment check", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "admin-1",
        groups: ["Admins"],
      });

      const res = await GET(
        makeRequest("protected/some-user/file1/file1.m3u8"),
      );
      expect(res.status).toBe(200);
      expect(mockFileList).not.toHaveBeenCalled();
    });
  });

  describe("Learner enrollment checks", () => {
    it("denies learner access to content they are not enrolled in (403)", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "learner-1",
        groups: ["Learners"],
      });

      // File exists but no assignments for this learner
      mockFileList.mockResolvedValue({
        data: [
          {
            id: "file-1",
            identityId: "instructor-identity",
            owner: "instructor-1",
            unitFiles: [{ unitID: "unit-1" }],
          },
        ],
      });
      mockAssignmentList.mockResolvedValue({ data: [] });

      const res = await GET(
        makeRequest("protected/instructor-identity/file-1/file-1.m3u8"),
      );
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.error).toBe("Forbidden");
    });

    it("denies learner when file is not found in database (403)", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "learner-1",
        groups: ["Learners"],
      });

      mockFileList.mockResolvedValue({ data: [] });

      const res = await GET(
        makeRequest("protected/unknown/file-1/file-1.m3u8"),
      );
      expect(res.status).toBe(403);
    });

    it("allows learner access when enrolled (has assignment)", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "learner-1",
        groups: ["Learners"],
      });

      // File linked to a unit that the learner is assigned to
      mockFileList.mockResolvedValue({
        data: [
          {
            id: "file-1",
            identityId: "instructor-identity",
            owner: "instructor-1",
            unitFiles: [{ unitID: "unit-1" }],
          },
        ],
      });
      mockAssignmentList.mockResolvedValue({
        data: [{ id: "assignment-1" }],
      });

      const res = await GET(
        makeRequest("protected/instructor-identity/file-1/file-1.m3u8"),
      );
      expect(res.status).toBe(200);
    });

    it("allows learner access to their own files (owner match)", async () => {
      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "learner-1",
        groups: ["Learners"],
      });

      // File owned by the learner themselves
      mockFileList.mockResolvedValue({
        data: [
          {
            id: "file-1",
            identityId: "learner-identity",
            owner: "learner-1",
            unitFiles: [],
          },
        ],
      });

      const res = await GET(
        makeRequest("protected/learner-identity/file-1/file-1.m3u8"),
      );
      expect(res.status).toBe(200);
      // Assignment check should not be needed
      expect(mockAssignmentList).not.toHaveBeenCalled();
    });
  });

  describe("Denial logging", () => {
    it("logs denial with user and path details", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockValidateAuth.mockResolvedValue({
        authenticated: true,
        userId: "learner-1",
        groups: ["Learners"],
      });
      mockFileList.mockResolvedValue({
        data: [
          {
            id: "file-1",
            identityId: "inst",
            owner: "instructor-1",
            unitFiles: [{ unitID: "unit-1" }],
          },
        ],
      });
      mockAssignmentList.mockResolvedValue({ data: [] });

      await GET(makeRequest("protected/inst/file-1/file-1.m3u8"));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[/api/hls] Denied"),
      );

      warnSpy.mockRestore();
    });
  });
});
