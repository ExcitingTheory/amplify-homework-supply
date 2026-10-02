#!/usr/bin/env node
/**
 * Full-page screenshot crawler for Storybook stories.
 *
 * Storybook's "Open canvas in new tab" / "open in isolation" link just points at
 * `iframe.html?id=<storyId>&viewMode=story` — that URL IS the isolated story canvas
 * (no manager chrome, no sidebar), so there's nothing to click in a browser UI.
 * We fetch the story index and navigate straight to that URL per story.
 *
 * Usage:
 *   npx playwright install chromium   # one-time
 *   node scripts/storybook-screenshots.mjs
 *
 * Env:
 *   STORYBOOK_URL        Base URL of a running Storybook instance (default http://localhost:6006)
 *   STORYBOOK_OUT_DIR    Output directory for screenshots (default test/results/storybook-screenshots)
 *   STORYBOOK_FILTER     Optional substring/regex to only capture matching story ids
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const STORYBOOK_URL = (
  process.env.STORYBOOK_URL || "http://localhost:6006"
).replace(/\/$/, "");
const OUT_DIR = resolve(
  REPO_ROOT,
  process.env.STORYBOOK_OUT_DIR || "test/results/storybook-screenshots",
);
const FILTER = process.env.STORYBOOK_FILTER
  ? new RegExp(process.env.STORYBOOK_FILTER)
  : null;

function sanitize(id) {
  return id.replace(/[^a-z0-9-_]/gi, "_");
}

// Independently-scrolling containers (overflow:auto with a capped height) never grow
// document.scrollHeight, so Playwright's fullPage screenshot misses their content.
// Strip the height/overflow constraints so everything flows into the document's own
// scroll height instead. Repeat a few passes since unlocking one container can reveal
// another nested scrollable ancestor/descendant.
async function expandScrollableContainers(page, passes = 4) {
  for (let i = 0; i < passes; i++) {
    const changed = await page.evaluate(() => {
      let count = 0;
      for (const el of document.querySelectorAll("*")) {
        const style = getComputedStyle(el);
        const isScrollableY =
          style.overflowY === "auto" || style.overflowY === "scroll";
        const isScrollableX =
          style.overflowX === "auto" || style.overflowX === "scroll";
        const overflowsY = el.scrollHeight > el.clientHeight + 1;
        const overflowsX = el.scrollWidth > el.clientWidth + 1;
        if ((isScrollableY && overflowsY) || (isScrollableX && overflowsX)) {
          el.style.setProperty("overflow", "visible", "important");
          el.style.setProperty("max-height", "none", "important");
          el.style.setProperty("height", "auto", "important");
          el.style.setProperty("max-width", "none", "important");
          count++;
        }
      }
      return count;
    });
    if (changed === 0) break;
  }
}

// Storybook 7+ serves a flat story/doc index here; `type: "story"` entries are
// the actual renderable stories (docs-only entries have no canvas to screenshot).
async function fetchStoryIndex() {
  const res = await fetch(`${STORYBOOK_URL}/index.json`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${STORYBOOK_URL}/index.json: ${res.status} ${res.statusText}`,
    );
  }
  const index = await res.json();
  const entries = Object.values(index.entries ?? {});
  return entries.filter((e) => e.type === "story");
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const stories = (await fetchStoryIndex()).filter(
    (s) => !FILTER || FILTER.test(s.id),
  );
  console.log(`Found ${stories.length} stories at ${STORYBOOK_URL}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });

  const results = [];

  for (const [i, story] of stories.entries()) {
    // This is already the isolation/canvas URL — no "open in isolation" click needed.
    const url = `${STORYBOOK_URL}/iframe.html?id=${story.id}&viewMode=story`;
    const outFile = join(OUT_DIR, `${sanitize(story.id)}.png`);
    process.stdout.write(`[${i + 1}/${stories.length}] ${story.id} ... `);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForSelector("#storybook-root", { timeout: 15000 });
      await expandScrollableContainers(page);
      await page.screenshot({ path: outFile, fullPage: true });
      console.log("ok");
      results.push({
        id: story.id,
        title: story.title,
        name: story.name,
        status: "ok",
        file: outFile,
      });
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      results.push({
        id: story.id,
        title: story.title,
        name: story.name,
        status: "error",
        error: err.message,
      });
    }
  }

  await browser.close();

  const summaryPath = join(OUT_DIR, "summary.json");
  writeFileSync(summaryPath, JSON.stringify(results, null, 2));

  const failed = results.filter((r) => r.status === "error");
  console.log(
    `\nDone. ${results.length - failed.length}/${results.length} succeeded.`,
  );
  console.log(`Screenshots: ${OUT_DIR}`);
  console.log(`Summary: ${summaryPath}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
