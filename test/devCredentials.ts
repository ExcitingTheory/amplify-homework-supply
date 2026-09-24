import { createHmac } from "node:crypto";

/** Derive the same unique sandbox credential used by amplify/seed/seed.ts. */
export function passwordForTestUser(
  username: string,
  explicitEnvVar?: string,
): string {
  const explicitPassword = explicitEnvVar
    ? process.env[explicitEnvVar]
    : undefined;
  if (explicitPassword) return explicitPassword;

  const seed = process.env.TEST_USER_PASSWORD_SEED;
  if (!seed) {
    throw new Error(
      "TEST_USER_PASSWORD_SEED is required for seeded-user tests; set it locally without committing it.",
    );
  }

  const digest = createHmac("sha256", seed)
    .update(username)
    .digest("base64url");
  return `Dev!${digest}a1!`;
}
