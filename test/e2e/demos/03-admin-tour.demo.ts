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
  { href: "/admin/analytics", title: "Analytics", ready: /Platform Analytics/, note: "Platform usage and learning trends", scroll: [600, 600] },
  { href: "/admin/words", title: "Vocabulary", ready: /Word List Maintenance/, note: "Every word across every unit", scroll: [500] },
  { href: "/admin/questions", title: "Question bank", ready: /Question Bank Maintenance/, note: "Shared practice questions", scroll: [500] },
  { href: "/admin/files", title: "Files", ready: /File List Maintenance/, note: "Audio, video, images and documents", scroll: [500] },
  { href: "/admin/moderation", title: "Moderation", ready: /Content Moderation/, note: "Review flagged content", scroll: [] },
  { href: "/admin/settings", title: "Settings", ready: /gamification|game design|platform settings/i, note: "Platform configuration", scroll: [500] },
  { href: "/recycle-bin", title: "Recycle bin", ready: /Recycle Bin/i, note: "Restore anything deleted by mistake", scroll: [] },
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
        // Return to the hub before each stop so browser history cannot land on a
        // stale pre-auth page.
        if (!/\/admin\/?$/.test(new URL(page.url()).pathname)) {
          await page.goto("/admin", { waitUntil: "domcontentloaded" });
          await page.waitForURL(/\/admin\/?$/, { timeout: 30_000 });
          await expect(page.locator('a[href$="/admin/analytics"]').first()).toBeVisible({
            timeout: 30_000,
          });
        }
        const link = page.locator(`a[href$="${stop.href}"]`).first();
        await expect(link).toBeVisible({ timeout: 15_000 });
        await link.scrollIntoViewIfNeeded();
        await demo.beat(900);
        // Dev-server route compilation can exceed the default action timeout
        await link.click({ noWaitAfter: true });
        await page.waitForURL(new RegExp(`${stop.href}/?$`), { timeout: 60_000 });
        await expect(page.getByRole("heading", { name: stop.ready }).first()).toBeVisible({
          timeout: 60_000,
        });
        await expect(page.getByText("Access denied", { exact: true })).toHaveCount(0);

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
