import type {
  Browser,
  BrowserContextOptions,
  Locator,
  Page,
} from "@playwright/test";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "fs";
import { resolve } from "path";
import { login, suppressKnownErrors, type TestUser } from "../journeys/helpers";
import { QUICK_LOGIN_USERS } from "../../../src/utils/quickLoginUsers";

export const VIDEO_SIZE = { width: 1920, height: 1080 } as const;

export const DEMO_OUTPUT_DIR = resolve(
  __dirname,
  "../../../test-results/demos",
);

/** Typing speed (ms per key) slow enough to read on screen. */
const TYPING_DELAY_MS = 55;

export interface DemoOptions {
  /** File name without extension, e.g. `01-instructor-builds-a-lesson`. */
  name: string;
  user: TestUser;
  /** Path the recording starts on, already signed in. */
  startPath: string;
  /**
   * Routes to visit in the unrecorded setup context so a cold dev server has
   * compiled them before recording starts (avoids dead air in the video).
   */
  warmPaths?: string[];
}

export interface Demo {
  /** Full-screen title card shown over the page, then removed. */
  chapter(
    title: string,
    description?: string,
    durationMs?: number,
  ): Promise<void>;
  /** Pause so viewers can read what just happened. Demo pacing only. */
  beat(ms?: number): Promise<void>;
  /** Click a locator, then type into it at a readable speed. */
  type(target: Locator, text: string): Promise<void>;
  /** Smooth-scroll the page by a number of pixels. */
  scroll(deltaY: number): Promise<void>;
}

/**
 * Signs in once in an unrecorded context, then records the scripted walkthrough
 * in a fresh context that reuses that session. The video therefore starts on
 * the target page instead of the login form.
 *
 * Env switches:
 *   DEMO_RECORD_LOGIN=1  record the sign-in too
 *   DEMO_PACE=1.5        multiply every pause (slower, easier to follow)
 */
/** Where a signed-in session is kept between runs. */
const AUTH_DIR = resolve(__dirname, "../../../test-results/demos/.auth");

const sessionPath = (username: string) =>
  resolve(AUTH_DIR, `${username.replace(/[^a-z0-9]+/gi, "-")}.json`);

function savedSession(username: string): string | undefined {
  const path = sessionPath(username);
  return existsSync(path) ? path : undefined;
}

/**
 * Signs in only when the restored session is no longer good.
 *
 * Amplify renews its own tokens: loading the app with a valid refresh token
 * cookie gets a fresh access token, so most runs never touch the sign-in form.
 * When it has genuinely lapsed, the seeded-user quick login is one click and
 * avoids the form's slower, flakier round trip.
 */
async function signInIfNeeded(
  page: Page,
  user: TestUser,
  startPath: string,
): Promise<void> {
  await page.goto(startPath, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const quickLogin = page.getByRole("button", { name: /^Sign in as /i }).first();
  const usernameInput = page.locator('input[name="username"]');
  const initialState = await Promise.any([
    page
      .locator("#user-button")
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "signed-in" as const),
    quickLogin
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "quick-login" as const),
    usernameInput
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "login-form" as const),
  ]);
  if (initialState === "signed-in") {
    return;
  }

  if (initialState === "quick-login") {
    const quickLoginUser = QUICK_LOGIN_USERS.find(
      (candidate) => candidate.username === user.username,
    );
    if (quickLoginUser) {
      const account = page.getByRole("button", {
        name: new RegExp(quickLoginUser.displayName, "i"),
      });
      if (await account.isVisible().catch(() => false)) {
        await account.click();
        await quickLogin.click();
        await page.locator("#user-button").waitFor({
          state: "visible",
          timeout: 30_000,
        });
        await page.goto(startPath, { waitUntil: "domcontentloaded", timeout: 60_000 });
        return;
      }
    }
  }

  await login(page, user, startPath);
}

export async function recordDemo(
  browser: Browser,
  options: DemoOptions,
  script: (page: Page, demo: Demo) => Promise<void>,
): Promise<string> {
  mkdirSync(DEMO_OUTPUT_DIR, { recursive: true });
  const videoPath = resolve(DEMO_OUTPUT_DIR, `${options.name}.webm`);
  const pendingVideoPath = resolve(DEMO_OUTPUT_DIR, `${options.name}-in-progress.webm`);
  const contextOptions: BrowserContextOptions = {
    viewport: { ...VIDEO_SIZE },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    colorScheme: "light",
    serviceWorkers: "allow",
    locale: "en-US",
  };
  const recordLogin = process.env.DEMO_RECORD_LOGIN === "1";
  const pace = Number(process.env.DEMO_PACE || "1");

  let storageState: BrowserContextOptions["storageState"];
  if (!recordLogin) {
    const setupContext = await browser.newContext({
      ...contextOptions,
      // Amplify keeps its tokens in cookies, so a saved session can be reused:
      // loading the app calls fetchAuthSession(), which renews an expired
      // access token from the refresh token without signing in again.
      storageState: savedSession(options.user.username),
    });
    await setupContext.addInitScript(() => {
      window.localStorage.setItem("homework-supply:first-run-complete", "1");
    });
    const setupPage = await setupContext.newPage();
    suppressKnownErrors(setupPage);
    await signInIfNeeded(setupPage, options.user, options.startPath);
    for (const path of options.warmPaths ?? []) {
      await setupPage
        .goto(path, { waitUntil: "load", timeout: 120_000 })
        .catch(() => {});
    }
    storageState = await setupContext.storageState();
    // Keep the renewed session for the next run.
    mkdirSync(AUTH_DIR, { recursive: true });
    writeFileSync(sessionPath(options.user.username), JSON.stringify(storageState));
    await setupContext.close();
  }

  const context = await browser.newContext({
    ...contextOptions,
    storageState,
  });
  // The first-run checklist mounts a banner after reading localStorage, which
  // shifts the page under the recording and can land mid-interaction. A demo
  // is not a first run, so mark it done before anything loads.
  await context.addInitScript(() => {
    window.localStorage.setItem("homework-supply:first-run-complete", "1");
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90_000);
  suppressKnownErrors(page);

  /** The chapter currently on screen, for the per-chapter timing log. */
  let lastChapter: { title: string; at: number } | undefined;

  const demo: Demo = {
    async chapter(title, description, durationMs = 2500) {
      // Each chapter reports how long the previous one took, so dead air in a
      // finished recording can be traced to the step that caused it instead of
      // being guessed at from the total runtime.
      const now = Date.now();
      if (lastChapter) {
        console.log(
          `[demo] ${((now - lastChapter.at) / 1000).toFixed(1)}s — ${lastChapter.title}`,
        );
      }
      lastChapter = { title, at: now };
      await page.screencast.showChapter(title, {
        description,
        duration: durationMs,
      });
      await page.waitForTimeout(durationMs);
    },
    async beat(ms = 1200) {
      await page.waitForTimeout(ms * pace);
    },
    async type(target, text) {
      await target.click();
      await target.pressSequentially(text, {
        delay: TYPING_DELAY_MS,
        // Typing at a readable speed takes longer than the default action
        // timeout for anything but a short phrase.
        timeout: text.length * TYPING_DELAY_MS + 30_000,
      });
    },
    async scroll(deltaY) {
      await page.evaluate(
        (dy) => window.scrollBy({ top: dy, behavior: "smooth" }),
        deltaY,
      );
      await page.waitForTimeout(900 * pace);
    },
  };

  const startRecording = () =>
    page.screencast.start({
      path: pendingVideoPath,
      size: { ...VIDEO_SIZE },
      quality: 90,
    });

  let failure: unknown;
  try {
    if (recordLogin) {
      await startRecording();
      await login(page, options.user, options.startPath);
    } else {
      await page.goto(options.startPath, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#user-button", { timeout: 30_000 });
      await page
        .waitForLoadState("networkidle", { timeout: 10_000 })
        .catch(() => {});
      await startRecording();
    }
    await page.screencast.showActions({
      cursor: "pointer",
      position: "bottom",
      fontSize: 28,
    });

    await script(page, demo);
    if (lastChapter) {
      console.log(
        `[demo] ${((Date.now() - lastChapter.at) / 1000).toFixed(1)}s — ${lastChapter.title}`,
      );
    }
    await demo.beat(1500);
  } catch (error) {
    failure = error;
    await page.screenshot({ path: resolve(DEMO_OUTPUT_DIR, `${options.name}-failure.png`) });
    writeFileSync(resolve(DEMO_OUTPUT_DIR, `${options.name}-failure.txt`), await page.locator("body").ariaSnapshot());
  } finally {
    await page.screencast.stop().catch(() => {});
    await context.close();
  }

  if (failure) throw failure;
  renameSync(pendingVideoPath, videoPath);
  console.log(`🎬 Saved ${videoPath}`);
  return videoPath;
}
