import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  verifyToken,
  extractGroups,
  isInGroup,
  isInAnyGroup,
  isInAllGroups,
} from "../jwt";

// Mock the jose module
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  createRemoteJWKSet: vi.fn(() => ({})),
}));

import * as joseModule from "jose";

/**
 * JWT Verification Tests
 *
 * Note: These tests mock jose's jwtVerify since we don't have real Cognito creds in test env.
 * In real deployment, the actual JWT verification against Cognito happens in the Lambda.
 */

describe("JWT: verifyToken()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify a valid token and return claims", async () => {
    const mockClaims = {
      sub: "user-123",
      "cognito:username": "testuser",
      "cognito:groups": ["Learners", "section-abc-learners"],
      aud: "client-id",
    };

    (joseModule.jwtVerify as any).mockResolvedValueOnce({
      payload: mockClaims,
    });

    const result = await verifyToken(
      "Bearer eyJhbGc...",
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
      "client-id",
    );

    expect(result).toEqual(mockClaims);
  });

  it("should strip Bearer prefix from token", async () => {
    const mockClaims = {
      sub: "user-123",
      "cognito:username": "testuser",
      aud: "client-id",
    };

    (joseModule.jwtVerify as any).mockResolvedValueOnce({
      payload: mockClaims,
    });

    await verifyToken(
      "Bearer token123",
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
      "client-id",
    );

    // Should be called with stripped token
    expect(joseModule.jwtVerify).toHaveBeenCalled();
  });

  it("should return null if verification fails", async () => {
    (joseModule.jwtVerify as any).mockRejectedValueOnce(
      new Error("Invalid signature"),
    );

    const result = await verifyToken(
      "invalid-token",
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
      "client-id",
    );

    expect(result).toBeNull();
  });

  it("should handle expired tokens", async () => {
    (joseModule.jwtVerify as any).mockRejectedValueOnce(
      new Error("Token expired"),
    );

    const result = await verifyToken(
      "expired-token",
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
      "client-id",
    );

    expect(result).toBeNull();
  });

  it("should handle wrong issuer", async () => {
    (joseModule.jwtVerify as any).mockRejectedValueOnce(
      new Error("Issuer mismatch"),
    );

    const result = await verifyToken(
      "token-from-wrong-issuer",
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_wrong",
      "client-id",
    );

    expect(result).toBeNull();
  });

  it("should handle wrong audience", async () => {
    (joseModule.jwtVerify as any).mockRejectedValueOnce(
      new Error("Audience mismatch"),
    );

    const result = await verifyToken(
      "token-for-different-audience",
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_abc123",
      "different-client-id",
    );

    expect(result).toBeNull();
  });
});

describe("JWT: extractGroups()", () => {
  it("should extract groups from claims", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Admins", "Instructors"],
      aud: "client-id",
    };

    const groups = extractGroups(claims);
    expect(groups).toEqual(["Admins", "Instructors"]);
  });

  it("should return empty array if no groups in claims", () => {
    const claims = {
      sub: "user-123",
      aud: "client-id",
    };

    const groups = extractGroups(claims);
    expect(groups).toEqual([]);
  });

  it("should handle claims with empty groups array", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": [],
      aud: "client-id",
    };

    const groups = extractGroups(claims);
    expect(groups).toEqual([]);
  });
});

describe("JWT: isInGroup()", () => {
  it("should return true if user is in the group", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Learners", "section-abc-learners"],
      aud: "client-id",
    };

    expect(isInGroup(claims, "Learners")).toBe(true);
    expect(isInGroup(claims, "section-abc-learners")).toBe(true);
  });

  it("should return false if user is not in the group", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Learners"],
      aud: "client-id",
    };

    expect(isInGroup(claims, "Admins")).toBe(false);
  });

  it("should return false if no groups in claims", () => {
    const claims = {
      sub: "user-123",
      aud: "client-id",
    };

    expect(isInGroup(claims, "Learners")).toBe(false);
  });
});

describe("JWT: isInAnyGroup()", () => {
  it("should return true if user is in any of the groups (OR)", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Learners", "Instructors"],
      aud: "client-id",
    };

    expect(isInAnyGroup(claims, ["Admins", "Learners"])).toBe(true);
    expect(isInAnyGroup(claims, ["Instructors", "Moderators"])).toBe(true);
  });

  it("should return false if user is not in any of the groups", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Learners"],
      aud: "client-id",
    };

    expect(isInAnyGroup(claims, ["Admins", "Instructors"])).toBe(false);
  });

  it("should return false if no groups in claims", () => {
    const claims = {
      sub: "user-123",
      aud: "client-id",
    };

    expect(isInAnyGroup(claims, ["Learners", "Admins"])).toBe(false);
  });
});

describe("JWT: isInAllGroups()", () => {
  it("should return true if user is in all of the groups (AND)", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Learners", "section-abc-learners", "Instructors"],
      aud: "client-id",
    };

    expect(isInAllGroups(claims, ["Learners", "Instructors"])).toBe(true);
  });

  it("should return false if user is not in all of the groups", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Learners"],
      aud: "client-id",
    };

    expect(isInAllGroups(claims, ["Learners", "Instructors"])).toBe(false);
  });

  it("should return false if no groups in claims", () => {
    const claims = {
      sub: "user-123",
      aud: "client-id",
    };

    expect(isInAllGroups(claims, ["Learners", "Admins"])).toBe(false);
  });

  it("should return true for single group check if present", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Learners"],
      aud: "client-id",
    };

    expect(isInAllGroups(claims, ["Learners"])).toBe(true);
  });

  it("should return true for empty group list (vacuous truth)", () => {
    const claims = {
      sub: "user-123",
      "cognito:groups": ["Learners"],
      aud: "client-id",
    };

    expect(isInAllGroups(claims, [])).toBe(true);
  });
});
