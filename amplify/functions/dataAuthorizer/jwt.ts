import { jwtVerify, createRemoteJWKSet } from "jose";

/**
 * JWT Verification using jose library
 *
 * Verifies Cognito-issued JWTs and extracts claims including:
 * - sub (user ID)
 * - cognito:username
 * - cognito:groups (user's Cognito groups)
 * - aud (audience - should match COGNITO_CLIENT_ID)
 *
 * JWKS endpoint is derived from the issuer URL.
 */

interface VerifiedClaims {
  sub: string;
  "cognito:username"?: string;
  "cognito:groups"?: string[];
  aud: string;
  [key: string]: any;
}

/**
 * Verify and decode a Cognito JWT
 *
 * @param token - Raw JWT string from Authorization header
 * @param issuer - Cognito User Pool issuer URL (https://cognito-idp.{region}.amazonaws.com/{poolId})
 * @param audience - Expected audience (Cognito Client ID)
 * @returns Verified claims or null if verification fails
 */
export async function verifyToken(
  token: string,
  issuer: string,
  audience: string,
): Promise<VerifiedClaims | null> {
  try {
    // Remove "Bearer " prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, "");

    // Create JWKS (JSON Web Key Set) remote fetcher from Cognito
    const JWKS = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

    // Verify and decode the JWT
    const verified = await jwtVerify(cleanToken, JWKS, {
      issuer,
      audience,
      algorithms: ["RS256"], // Cognito uses RS256
    });

    return verified.payload as VerifiedClaims;
  } catch (error) {
    console.error("[JWT] Verification failed:", {
      error: error instanceof Error ? error.message : String(error),
      issuer,
      audience,
    });
    return null;
  }
}

/**
 * Extract group names from verified claims
 *
 * @param claims - Verified JWT claims
 * @returns Array of group names (e.g., ['Admins', 'section-123-instructors'])
 */
export function extractGroups(claims: VerifiedClaims): string[] {
  return claims["cognito:groups"] ?? [];
}

/**
 * Check if user is in a specific group
 *
 * @param claims - Verified JWT claims
 * @param groupName - Group to check for
 * @returns true if user is in the group
 */
export function isInGroup(claims: VerifiedClaims, groupName: string): boolean {
  const groups = extractGroups(claims);
  return groups.includes(groupName);
}

/**
 * Check if user has any of the specified groups (OR logic)
 *
 * @param claims - Verified JWT claims
 * @param groupNames - Groups to check for
 * @returns true if user is in any of the groups
 */
export function isInAnyGroup(
  claims: VerifiedClaims,
  groupNames: string[],
): boolean {
  const groups = extractGroups(claims);
  return groupNames.some((groupName) => groups.includes(groupName));
}

/**
 * Check if user has all of the specified groups (AND logic)
 *
 * @param claims - Verified JWT claims
 * @param groupNames - Groups to check for
 * @returns true if user is in all of the groups
 */
export function isInAllGroups(
  claims: VerifiedClaims,
  groupNames: string[],
): boolean {
  const groups = extractGroups(claims);
  return groupNames.every((groupName) => groups.includes(groupName));
}
