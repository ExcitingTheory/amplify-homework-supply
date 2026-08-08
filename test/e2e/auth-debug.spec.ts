import { test, expect } from "@playwright/test";
import { login, INSTRUCTOR } from "./helpers";

test("debug: check auth cookies and idToken size", async ({ page }) => {
  // Login
  await login(page, INSTRUCTOR, "/");

  // Check cookies
  const cookies = await page.context().cookies();

  const cognitoCookies = cookies.filter(
    (c) =>
      c.name.includes("CognitoIdentityServiceProvider") ||
      c.name.includes("amplify"),
  );

  console.log(`\n=== COGNITO/AMPLIFY COOKIES: ${cognitoCookies.length} ===`);
  cognitoCookies.forEach((c) => {
    const nameBytes = new TextEncoder().encode(c.name + "=" + c.value).length;
    console.log(`  ${c.name}`);
    console.log(
      `    value length: ${c.value.length} chars, ~${nameBytes} bytes`,
    );
  });

  // Check if idToken cookie exists — may be stored directly or in chunks:
  //   {key}.chunks = "3", {key}.chunk.0, {key}.chunk.1, ... (see amplifyServerChunked.ts)
  const hasIdToken = cognitoCookies.some((c) => c.name.includes("idToken"));
  const hasAccessToken = cognitoCookies.some((c) =>
    c.name.includes("accessToken"),
  );
  const hasRefreshToken = cognitoCookies.some((c) =>
    c.name.includes("refreshToken"),
  );
  // LastAuthUser is a small cookie always set when logged in — used by proxy.ts for SSR auth
  const hasLastAuthUser = cookies.some(
    (c) => c.name.includes("LastAuthUser") && c.value.length > 0,
  );

  console.log(`\n=== TOKEN PRESENCE ===`);
  console.log(
    `  idToken cookie: ${hasIdToken ? "PRESENT" : "MISSING (may be chunked)"}`,
  );
  console.log(
    `  accessToken cookie: ${hasAccessToken ? "PRESENT" : "MISSING"}`,
  );
  console.log(
    `  refreshToken cookie: ${hasRefreshToken ? "PRESENT" : "MISSING"}`,
  );
  console.log(
    `  LastAuthUser cookie: ${hasLastAuthUser ? "PRESENT" : "MISSING"}`,
  );

  // Check total cookie size (browsers limit to ~4KB per cookie)
  const totalCookieSize = cookies.reduce((sum, c) => {
    return sum + new TextEncoder().encode(c.name + "=" + c.value).length;
  }, 0);
  console.log(`\n  Total cookie size: ${totalCookieSize} bytes`);

  // Try to get the idToken from document.cookie in the browser
  const browserCookieCheck = await page.evaluate(() => {
    const allCookies = document.cookie;
    const hasIdToken = allCookies.includes("idToken");
    const cookieParts = allCookies.split(";").map((c) => c.trim());
    const cognitoParts = cookieParts.filter(
      (c) =>
        c.includes("CognitoIdentityServiceProvider") || c.includes("amplify"),
    );
    return {
      hasIdToken,
      totalCookieLength: allCookies.length,
      cognitoCookieCount: cognitoParts.length,
      cognitoCookieNames: cognitoParts.map((c) =>
        c.substring(0, c.indexOf("=")),
      ),
    };
  });
  console.log(`\n=== BROWSER document.cookie CHECK ===`);
  console.log(JSON.stringify(browserCookieCheck, null, 2));

  // If idToken is missing, log a diagnostic (the project uses chunked cookie storage
  // via amplifyServerChunked.ts, so idToken may appear as {key}.chunk.0, {key}.chunk.1, etc.)
  if (!hasIdToken) {
    console.log("\n[INFO] No direct idToken cookie found.");
    console.log(
      "The idToken JWT may be stored in chunks: {key}.chunk.0, {key}.chunk.1, ...",
    );
    console.log(
      "See src/utils/amplifyServerChunked.ts for the chunked cookie storage implementation.",
    );
  }

  // The SSR auth check in proxy.ts only requires LastAuthUser — assert on that instead
  expect(
    hasLastAuthUser,
    "LastAuthUser cookie must be present for SSR auth (checked by proxy.ts)",
  ).toBe(true);
});
