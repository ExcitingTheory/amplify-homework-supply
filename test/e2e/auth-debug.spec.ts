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

  // Check if idToken cookie exists
  const hasIdToken = cognitoCookies.some((c) => c.name.includes("idToken"));
  const hasAccessToken = cognitoCookies.some((c) =>
    c.name.includes("accessToken"),
  );
  const hasRefreshToken = cognitoCookies.some((c) =>
    c.name.includes("refreshToken"),
  );

  console.log(`\n=== TOKEN PRESENCE ===`);
  console.log(`  idToken cookie: ${hasIdToken ? "PRESENT" : "MISSING"}`);
  console.log(
    `  accessToken cookie: ${hasAccessToken ? "PRESENT" : "MISSING"}`,
  );
  console.log(
    `  refreshToken cookie: ${hasRefreshToken ? "PRESENT" : "MISSING"}`,
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

  // If idToken is missing, the root cause is confirmed
  if (!hasIdToken) {
    console.log("\n*** ROOT CAUSE CONFIRMED: idToken cookie is MISSING ***");
    console.log(
      "The Cognito idToken JWT likely exceeds the ~4KB per-cookie browser limit.",
    );
    console.log(
      "This causes 'NoSignedUser: No current user' errors in generateClient({ authMode: 'userPool' }).",
    );
    console.log(
      "FIX: Either remove { ssr: true } from Amplify.configure() or add Next.js middleware from @aws-amplify/adapter-nextjs.",
    );
  }

  expect(hasIdToken).toBe(true);
});
