import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  signIn,
  signOut,
  type SignInInput,
  type SignInOutput,
} from "aws-amplify/auth";
// @ts-ignore -- js-cookie has no type declarations in this project
import JsCookie from "js-cookie";

const SIGN_IN_STATE_KEYS = new Set([
  "CognitoSignInState.username",
  "CognitoSignInState.challengeName",
  "CognitoSignInState.signInSession",
  "CognitoSignInState.expiry",
]);

export function isRecoverableSignInError(error: unknown): boolean {
  return error instanceof Error &&
    /(?:DEVICE_)?PASSWORD_VERIFIER challengeName returned by the underlying service was not addressed\./.test(error.message);
}

/**
 * Cognito rejects an identity ID that belongs to a different user's logins.
 * Amplify only clears its remembered identity on signOut, so reaching sign-in
 * any other way (expired session, redirect) leaves the previous one in place.
 */
export function isForbiddenIdentityError(error: unknown): boolean {
  return error instanceof Error &&
    error.name === "NotAuthorizedException" &&
    /Access to Identity '.*' is forbidden/.test(error.message);
}

let identityRecovery: Promise<void> | null = null;

/** Drops the stale identity and fetches the one linked to the current tokens. */
export function recoverForbiddenIdentity(): Promise<void> {
  identityRecovery ??= (async () => {
    try {
      await Amplify.clearCredentials();
      await fetchAuthSession({ forceRefresh: true });
    } finally {
      identityRecovery = null;
    }
  })();
  return identityRecovery;
}

export async function signInWithAuthRecovery(
  input: SignInInput,
  recoveryMessage: string,
): Promise<SignInOutput> {
  // No session exists yet, so any remembered identity belongs to a prior user.
  await Amplify.clearCredentials();
  try {
    return await signIn(input);
  } catch (error) {
    if (!isRecoverableSignInError(error)) throw error;
    console.warn("[Auth] Sign-in challenge could not be completed:", error);
    throw new Error(recoveryMessage, { cause: error });
  }
}

/**
 * Removes this client's persisted auth state, not application storage.
 * Amplify signOut intentionally retains device metadata; a page reload is
 * needed after manual recovery to also discard the SDK's in-memory challenge.
 */
export function clearLocalAuthData(): void {
  const cognito = Amplify.getConfig().Auth?.Cognito;
  if (!cognito?.userPoolClientId) {
    throw new Error("Cannot clear authentication data without a configured Cognito client.");
  }
  const tokenPrefix = `CognitoIdentityServiceProvider.${cognito.userPoolClientId}.`;
  const identityPrefix = cognito.identityPoolId
    ? `com.amplify.Cognito.${cognito.identityPoolId}.`
    : undefined;
  const isAuthKey = (key: string) =>
    key.startsWith(tokenPrefix) ||
    (identityPrefix !== undefined && key.startsWith(identityPrefix)) ||
    SIGN_IN_STATE_KEYS.has(key);

  for (const storage of [window.localStorage, window.sessionStorage]) {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
    for (const key of keys) {
      if (key !== null && isAuthKey(key)) storage.removeItem(key);
    }
  }

  // Enumerate physical cookies so even orphaned token chunks are removed.
  const cookieNames = Object.keys(JsCookie.get()).filter(isAuthKey);
  for (const name of cookieNames) {
    JsCookie.remove(name, { path: "/", secure: true, sameSite: "lax" });
  }
  if (Object.keys(JsCookie.get()).some(isAuthKey)) {
    throw new Error("Some authentication cookies could not be cleared.");
  }
}

export async function signOutAndClearLocalAuthData(): Promise<void> {
  try {
    await signOut();
  } finally {
    clearLocalAuthData();
  }
}
