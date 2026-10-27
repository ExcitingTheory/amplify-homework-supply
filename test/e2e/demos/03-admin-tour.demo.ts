/**
 * Demo video 3: Admin tours the platform tools.
 *
 * Storyline: admin hub -> analytics -> vocabulary -> questions -> files ->
 * moderation -> settings -> recycle bin. Read-only: nothing is created,
 * edited or deleted.
 *
 * Output: test-results/demos/03-admin-tour.webm
 */

import { test, expect } from "@playwright/test";
import { ADMIN } from "../journeys/helpers";
import { recordDemo } from "./demoKit";

const STOPS = [
  { href: "/admin/analytics", title: "Analytics", note: "Platform usage and learning trends", scroll: [600, 600] },
  { href: "/admin/words", title: "Vocabulary", note: "Every word across every unit", scroll: [500] },
  { href: "/admin/questions", title: "Question bank", note: "Shared practice questions", scroll: [500] },
  { href: "/admin/files", title: "Files", note: "Audio, video, images and documents", scroll: [500] },
  { href: "/admin/moderation", title: "Moderation", note: "Review flagged content", scroll: [] },
  { href: "/admin/settings", title: "Settings", note: "Platform configuration", scroll: [500] },
  { href: "/recycle-bin", title: "Recycle bin", note: "Restore anything deleted by mistake", scroll: [] },
] as const;

test("Demo 3: Admin tours the platform", async ({ browser }) => {
  await recordDemo(
    browser,
    {
      name: "03-admin-tour",
      user: ADMIN,
      startPath: "/admin",
      warmPaths: ["/admin", ...STOPS.map((stop) => stop.href)],
    },
    async (page, demo) => {
      await demo.chapter(
        "Admin: run the platform",
        "Analytics, content, moderation and settings in one hub",
      );
      await demo.beat(2500);

      for (const stop of STOPS) {
        // Navigate via the hub card the way an admin would
        if (!/\/admin\/?$/.test(new URL(page.url()).pathname)) {
          await page.goto("/admin", { waitUntil: "domcontentloaded" });
        }
        const link = page.locator(`a[href$="${stop.href}"]`).first();
        await expect(link).toBeVisible({ timeout: 15_000 });
        await link.scrollIntoViewIfNeeded();
        await demo.beat(900);
        // Dev-server route compilation can exceed the default action timeout
        await link.click({ noWaitAfter: true });
        await page.waitForURL(new RegExp(`${stop.href}/?$`), { timeout: 60_000 });
        await page
          .waitForLoadState("networkidle", { timeout: 10_000 })
          .catch(() => {});

        await demo.chapter(stop.title, stop.note, 1800);
        await demo.beat(2500);
        for (const dy of stop.scroll) {
          await demo.scroll(dy);
          await demo.beat(1800);
        }
        await demo.scroll(-2000);
      }
    },
  );
});
