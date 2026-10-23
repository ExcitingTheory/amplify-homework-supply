import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { STUDENT, login, suppressKnownErrors } from "./helpers";

/**
 * Thoth call-and-response — Magus card.
 *
 * Prerequisite: `npm run sandbox:seed` has run the Thoth seed section so the
 * Trumps unit exists in test/integration/seed-data.json and student1 is
 * enrolled in the Thoth section. Chromium supplies a fake microphone, and only
 * the Whisper `verifyAudioUrl` query is stubbed so no paid transcription runs.
 */
const seedData = JSON.parse(
  readFileSync(resolve(__dirname, "../integration/seed-data.json"), "utf8"),
) as { thoth?: { units?: { trumps?: string } } };
const trumpsUnitId = seedData.thoth?.units?.trumps ?? "";

test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});

async function stubWhisper(page: Page, transcript: string): Promise<string[]> {
  const verifiedCues: string[] = [];
  await page.route(/appsync-api\..*\/graphql/, async (route) => {
    const request = route.request();
    const body = request.postData() ?? "";
    if (request.method() !== "POST" || !body.includes("verifyAudioUrl")) {
      await route.fallback();
      return;
    }
    verifiedCues.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        data: { verifyAudioUrl: JSON.stringify({ transcript }) },
      }),
    });
  });
  return verifiedCues;
}

test.describe("Thoth call and response", () => {
  test.skip(
    !trumpsUnitId,
    "Run the Thoth seed (npm run sandbox:seed) to populate seed-data.json thoth.units.trumps",
  );

  test.beforeEach(async ({ page }) => {
    suppressKnownErrors(page);
    await login(page, STUDENT, "/");
    await page.goto(`/workbook/${trumpsUnitId}`, {
      timeout: 120_000,
      waitUntil: "domcontentloaded",
    });
  });

  test("learner completes the Magus card and every response is graded", async ({
    page,
  }) => {
    // 13 responses, each with a real S3 upload and a grade save.
    test.setTimeout(300_000);
    const verified = await stubWhisper(page, "one");

    const startButton = page.getByRole("button", { name: /^start$/i });
    if (await startButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startButton.click();
    }

    const magus = page.getByRole("group", {
      name: "Call and response: The Magus",
    });
    await magus.scrollIntoViewIfNeeded();
    await expect(magus).toBeVisible({ timeout: 20_000 });
    await magus.getByRole("button", { name: "Start call and response" }).click();

    // Prompt and answer cues fall back to browser speech when no TTS file is
    // attached, so skip them with Continue; response windows end via Finish.
    const summary = magus.getByRole("status").filter({
      hasText: "Call and response complete.",
    });
    for (let step = 0; step < 80; step += 1) {
      if (await summary.isVisible()) break;
      const finish = magus.getByRole("button", { name: "Finish response" });
      const next = magus.getByRole("button", { name: "Continue" });
      if (await finish.isVisible()) {
        await expect(
          magus.getByRole("progressbar", { name: "Microphone activity" }),
        ).toBeVisible();
        await finish.click();
      } else if (await next.isVisible()) {
        await expect(
          magus.getByRole("progressbar", { name: "Microphone activity" }),
        ).toHaveCount(0);
        await next.click();
      } else {
        await page.waitForTimeout(100);
      }
    }

    await expect(summary).toBeVisible();
    await expect
      .poll(
        async () => {
          const text = (await summary.textContent()) ?? "";
          const match = /(\d+) of (\d+) responses graded/.exec(text);
          return match && match[1] === match[2] && Number(match[2]) > 0;
        },
        { timeout: 30_000 },
      )
      .toBe(true);
    expect(verified.length).toBeGreaterThan(0);
  });
});
