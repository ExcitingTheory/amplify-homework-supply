import type {
  Browser,
  BrowserContextOptions,
  Locator,
  Page,
} from "@playwright/test";
import { mkdirSync } from "fs";
import { resolve } from "path";
import { login, suppressKnownErrors, type TestUser } from "../journeys/helpers";

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
 *   DEMO_UI_SCALE=1.25   UI zoom; viewport = 1920x1080 / scale (1 = native)
 */
export async function recordDemo(
  browser: Browser,
  options: DemoOptions,
  script: (page: Page, demo: Demo) => Promise<void>,
): Promise<string> {
  mkdirSync(DEMO_OUTPUT_DIR, { recursive: true });
  const videoPath = resolve(DEMO_OUTPUT_DIR, `${options.name}.webm`);
  // A smaller CSS viewport rendered at a higher device scale factor still
  // yields a 1920x1080 video, but UI text appears larger and easier to read.
  const uiScale = Number(process.env.DEMO_UI_SCALE || "1.25");
  const contextOptions: BrowserContextOptions = {
    viewport: {
      width: Math.round(VIDEO_SIZE.width / uiScale),
      height: Math.round(VIDEO_SIZE.height / uiScale),
    },
    deviceScaleFactor: uiScale,
    ignoreHTTPSErrors: true,
    colorScheme: "light",
    locale: "en-US",
  };
  const recordLogin = process.env.DEMO_RECORD_LOGIN === "1";
  const pace = Number(process.env.DEMO_PACE || "1");

  let storageState: BrowserContextOptions["storageState"];
  if (!recordLogin) {
    const setupContext = await browser.newContext(contextOptions);
    const setupPage = await setupContext.newPage();
    suppressKnownErrors(setupPage);
    await login(setupPage, options.user, options.startPath);
    for (const path of options.warmPaths ?? []) {
      await setupPage
        .goto(path, { waitUntil: "load", timeout: 120_000 })
        .catch(() => {});
    }
    storageState = await setupContext.storageState();
    await setupContext.close();
  }

  const context = await browser.newContext({
    ...contextOptions,
    storageState,
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(90_000);
  suppressKnownErrors(page);

  const demo: Demo = {
    async chapter(title, description, durationMs = 2500) {
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
      await target.pressSequentially(text, { delay: TYPING_DELAY_MS });
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
      path: videoPath,
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
    await demo.beat(1500);
  } catch (error) {
    failure = error;
  } finally {
    await page.screencast.stop().catch(() => {});
    await context.close();
  }

  if (failure) throw failure;
  console.log(`🎬 Saved ${videoPath}`);
  return videoPath;
}
