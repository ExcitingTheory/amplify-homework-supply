import { test, expect } from "@playwright/test";
import { login, INSTRUCTOR } from "../e2e/journeys/helpers";

test("collaborative saves preserve the Lexical draft on reopen", async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL || "https://localhost:3000",
    ignoreHTTPSErrors: true,
    serviceWorkers: "allow",
    viewport: { width: 1920, height: 1080 },
  });
  let reopenedContext: Awaited<ReturnType<typeof browser.newContext>> | undefined;
  const errors: string[] = [];
  try {
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.text().includes("[saveEditorContent]") ||
          message.text().includes("[Save]") ||
          message.text().includes("[Editor onChange]") ||
          message.text().includes("[useYjsUnit]") ||
          message.text().includes("[YjsProvider]") ||
          message.text().includes("[UnitContext]")) {
        console.log(message.text());
      }
    });
    await login(page, INSTRUCTOR, "/units");
    await page.locator('[data-tour="create-unit-button"]').first().click();
    await page.waitForURL(/\/unit\/[a-f0-9-]+/);
    const unitUrl = page.url();
    console.log("Created persistence test unit:", new URL(unitUrl).pathname);
    const editor = page.getByRole("textbox", { name: "Edit", exact: true });
    await expect(editor).toBeVisible({ timeout: 90_000 });
    await test.step("authoring fields fill the header without growing past it", async () => {
      await page.locator('[data-tour="unit-title"]').click();
      const name = page.getByTestId("unit-name-input").getByRole("textbox");
      expect((await name.boundingBox())!.width).toBeGreaterThan(1700);
      await name.fill("Cell biology and the structures responsible for photosynthesis");
      await page.getByText("Add Description", { exact: true }).click();
      const description = page.getByTestId("unit-description-input").getByRole("textbox");
      expect((await description.boundingBox())!.width).toBeGreaterThan(1700);
      await description.fill("First line of the lesson description\nSecond line of the lesson description\nThird line\nFourth line");
      await expect.poll(() => description.evaluate((element) => {
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
        return element.clientHeight / lineHeight;
      })).toBeGreaterThan(2);
      await expect.poll(() => description.evaluate((element) => {
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
        return element.clientHeight / lineHeight;
      })).toBeLessThanOrEqual(3.1);
      await page.screenshot({ path: test.info().outputPath("full-width-lesson-fields.png") });
      await editor.click();
    });
    await test.step("sidebar resizes beyond 800px and stays inside a narrower viewport", async () => {
      const filesTab = page.locator('[data-tour="files-tab"]');
      await filesTab.click();
      const drawer = filesTab.locator('xpath=ancestor::*[contains(@class,"MuiDrawer-root")][1]');
      await expect.poll(async () => (await drawer.boundingBox())!.width).toBeGreaterThan(600);
      const handle = (await page.getByTestId("left-sidebar-resize").boundingBox())!;
      await page.mouse.move(handle.x + handle.width / 2, handle.y + 100);
      await page.mouse.down();
      await page.mouse.move(handle.x + 360, handle.y + 100);
      await page.mouse.up();
      await expect.poll(async () => (await drawer.boundingBox())!.width).toBeGreaterThan(950);
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
      expect((await editor.boundingBox())!.width).toBeGreaterThan(250);
      await filesTab.click();
      await page.setViewportSize({ width: 1920, height: 1080 });
    });
    const marker = `Draft persistence regression ${Date.now()}`;
    const draftSaved = context.waitForEvent("response", {
      predicate: (response) =>
        response.request().method() === "PUT" &&
        response.url().includes("draft.json") &&
        response.ok(),
      timeout: 60_000,
    });
    await editor.fill(marker);
    await page.keyboard.press("Escape");
    await page.getByTestId("save-button").click();
    expect((await draftSaved).request().postData()).toContain(marker);
    const storageState = await context.storageState();
    await context.close();
    reopenedContext = await browser.newContext({
      baseURL: process.env.BASE_URL || "https://localhost:3000",
      ignoreHTTPSErrors: true,
      serviceWorkers: "allow",
      storageState,
    });
    const reopened = await reopenedContext.newPage();
    reopened.on("pageerror", (error) => errors.push(error.message));
    await reopened.goto(unitUrl);
    await expect(reopened.getByRole("textbox", { name: "Edit", exact: true }))
      .toContainText(marker, { timeout: 90_000 });
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await reopenedContext?.close();
  }
});
