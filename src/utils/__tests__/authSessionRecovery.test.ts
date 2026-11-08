import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getConfig, clearCredentials, fetchAuthSession, signIn, signOut, cookies, removeCookie } = vi.hoisted(() => {
  const cookies: Record<string, string> = {};
  return {
    getConfig: vi.fn(),
    clearCredentials: vi.fn(),
    fetchAuthSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    cookies,
    removeCookie: vi.fn((name: string) => { delete cookies[name]; }),
  };
});

vi.mock("aws-amplify", () => ({ Amplify: { getConfig, clearCredentials } }));
vi.mock("aws-amplify/auth", () => ({ fetchAuthSession, signIn, signOut }));
vi.mock("js-cookie", () => ({
  default: { get: () => ({ ...cookies }), remove: removeCookie },
}));

import {
  clearLocalAuthData,
  isForbiddenIdentityError,
  recoverForbiddenIdentity,
  signInWithAuthRecovery,
  signOutAndClearLocalAuthData,
} from "../authSessionRecovery";

const prefix = "CognitoIdentityServiceProvider.current-client.";
const challengeError = new Error(
  "An error occurred during the sign in process. PASSWORD_VERIFIER challengeName returned by the underlying service was not addressed.",
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  Object.keys(cookies).forEach((key) => delete cookies[key]);
  getConfig.mockReturnValue({
    Auth: { Cognito: { userPoolClientId: "current-client", identityPoolId: "current-pool" } },
  });
  signOut.mockResolvedValue(undefined);
  clearCredentials.mockResolvedValue(undefined);
  fetchAuthSession.mockResolvedValue({});
  removeCookie.mockImplementation((name: string) => { delete cookies[name]; });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("scoped authentication cleanup", () => {
  it("removes tokens, remembered devices, challenge state, and orphaned cookies without clearing application or other-client data", () => {
    const authKeys = [
      `${prefix}LastAuthUser`,
      `${prefix}user.accessToken`,
      `${prefix}user.deviceKey`,
      `${prefix}user.deviceGroupKey`,
      `${prefix}user.randomPasswordKey`,
      `${prefix}user.idToken.chunks`,
      `${prefix}user.idToken.chunk.0`,
      `${prefix}user.idToken.chunk.9`,
      `${prefix}oauthState`,
      "CognitoSignInState.username",
      "CognitoSignInState.challengeName",
      "CognitoSignInState.signInSession",
      "CognitoSignInState.expiry",
      "com.amplify.Cognito.current-pool.identityId",
    ];
    const preservedKeys = [
      "application.draft",
      "mui-mode",
      "returnUrl",
      "CognitoIdentityServiceProvider.other-client.user.deviceKey",
      "CognitoIdentityServiceProvider.current-client-other.user.idToken",
      "com.amplify.Cognito.other-pool.identityId",
    ];
    for (const key of [...authKeys, ...preservedKeys]) {
      localStorage.setItem(key, "keep-or-remove");
      sessionStorage.setItem(key, "keep-or-remove");
      cookies[key] = "keep-or-remove";
    }
    const deleteDatabase = vi.fn();
    const deleteCache = vi.fn();
    vi.stubGlobal("indexedDB", { deleteDatabase });
    vi.stubGlobal("caches", { delete: deleteCache });
    clearLocalAuthData();
    for (const key of authKeys) {
      expect(localStorage.getItem(key)).toBeNull();
      expect(sessionStorage.getItem(key)).toBeNull();
      expect(cookies[key]).toBeUndefined();
    }
    for (const key of preservedKeys) {
      expect(localStorage.getItem(key)).toBe("keep-or-remove");
      expect(sessionStorage.getItem(key)).toBe("keep-or-remove");
      expect(cookies[key]).toBe("keep-or-remove");
    }
    expect(deleteDatabase).not.toHaveBeenCalled();
    expect(deleteCache).not.toHaveBeenCalled();
  });

  it("fails explicitly if the auth client is not configured", () => {
    getConfig.mockReturnValue({});
    localStorage.setItem("application.draft", "saved");
    expect(clearLocalAuthData).toThrow("configured Cognito client");
    expect(localStorage.getItem("application.draft")).toBe("saved");
  });

  it("reports cookies that could not be removed rather than claiming recovery", () => {
    cookies[`${prefix}user.idToken`] = "token";
    removeCookie.mockImplementation(() => {});
    expect(clearLocalAuthData).toThrow("could not be cleared");
  });

  it.each([false, true])("cleans auth state on logout even when SDK signOut fails: %s", async (fails) => {
    const failure = new Error("SDK sign-out failed");
    localStorage.setItem(`${prefix}user.deviceKey`, "stale-device");
    sessionStorage.setItem("CognitoSignInState.challengeName", "PASSWORD_VERIFIER");
    localStorage.setItem("application.draft", "saved");
    if (fails) signOut.mockRejectedValueOnce(failure);
    const result = signOutAndClearLocalAuthData();
    if (fails) await expect(result).rejects.toBe(failure);
    else await expect(result).resolves.toBeUndefined();
    expect(localStorage.getItem(`${prefix}user.deviceKey`)).toBeNull();
    expect(sessionStorage.getItem("CognitoSignInState.challengeName")).toBeNull();
    expect(localStorage.getItem("application.draft")).toBe("saved");
  });
});

describe("sign-in recovery error handling", () => {
  it("replaces only the unsupported verifier error with recovery guidance", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    signIn.mockRejectedValueOnce(challengeError);
    await expect(signInWithAuthRecovery(
      { username: "test@example.com", password: "example" },
      "Clear saved sign-in data.",
    )).rejects.toMatchObject({ message: "Clear saved sign-in data.", cause: challengeError });
  });

  it("preserves ordinary sign-in errors and successful MFA next steps", async () => {
    const input = {
      username: "test@example.com", password: "example",
      options: { authFlowType: "USER_SRP_AUTH" as const },
    };
    const wrongPassword = new Error("Incorrect username or password.");
    signIn.mockRejectedValueOnce(wrongPassword);
    await expect(signInWithAuthRecovery(input, "Recovery")).rejects.toBe(wrongPassword);
    const nextStep = { isSignedIn: false, nextStep: { signInStep: "CONFIRM_SIGN_IN_WITH_TOTP_CODE" } };
    signIn.mockResolvedValueOnce(nextStep);
    await expect(signInWithAuthRecovery(input, "Recovery")).resolves.toBe(nextStep);
    expect(signIn).toHaveBeenLastCalledWith(input);
  });

  it("forgets a previous user's identity before signing in", async () => {
    signIn.mockResolvedValueOnce({ isSignedIn: true });
    await signInWithAuthRecovery({ username: "next@example.com", password: "example" }, "Recovery");
    expect(clearCredentials).toHaveBeenCalledOnce();
    expect(clearCredentials.mock.invocationCallOrder[0]).toBeLessThan(signIn.mock.invocationCallOrder[0]);
  });
});

describe("forbidden identity recovery", () => {
  const forbidden = Object.assign(
    new Error("Access to Identity 'us-east-1:stale-id' is forbidden."),
    { name: "NotAuthorizedException" },
  );

  it("recognizes only Cognito's identity ownership rejection", () => {
    expect(isForbiddenIdentityError(forbidden)).toBe(true);
    expect(isForbiddenIdentityError(Object.assign(
      new Error("Incorrect username or password."), { name: "NotAuthorizedException" },
    ))).toBe(false);
    expect(isForbiddenIdentityError(new Error(forbidden.message))).toBe(false);
  });

  it("clears the stale identity, then fetches a fresh one once for concurrent callers", async () => {
    await Promise.all([recoverForbiddenIdentity(), recoverForbiddenIdentity()]);
    expect(clearCredentials).toHaveBeenCalledOnce();
    expect(fetchAuthSession).toHaveBeenCalledExactlyOnceWith({ forceRefresh: true });
    expect(clearCredentials.mock.invocationCallOrder[0]).toBeLessThan(fetchAuthSession.mock.invocationCallOrder[0]);

    await recoverForbiddenIdentity();
    expect(clearCredentials).toHaveBeenCalledTimes(2);
  });
});
