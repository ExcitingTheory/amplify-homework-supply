# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: instructor-tour.spec.ts >> Instructor onboarding tour >> completes full instructor tour — step by step
- Location: test/storybook/e2e/instructor-tour.spec.ts:58:7

# Error details

```
Error: expect(locator).toBeAttached() failed

Locator:  locator('#storybook-preview-iframe').contentFrame().locator('[aria-controls="insert-node-menu"], button[aria-label*="Insert"]').first()
Expected: attached
Received: undefined

```

# Test source

```ts
  119 |  * Walk through the full lifecycle of a single onboarding task:
  120 |  *
  121 |  * 1. Click the task card → SpotlightOverlay opens
  122 |  * 2. Walk through ALL spotlight steps (Start → Next → … → Done)
  123 |  * 3. Navigate to the correct story to find data-tour elements
  124 |  * 4. Click each data-tour element with real Playwright clicks
  125 |  * 5. Return to onboarding panel and verify task completion
  126 |  */
  127 | export async function walkTaskTour(
  128 |   page: Page,
  129 |   task: TaskSpec,
  130 |   persona: Persona,
  131 |   expectedCompleted: number,
  132 | ): Promise<void> {
  133 |   // ── 1. Click the task card ─────────────────────────────────────────────────
  134 |   const taskCard = page
  135 |     .locator('[data-testid="task-item"]')
  136 |     .filter({ hasText: task.title });
  137 | 
  138 |   await taskCard.click();
  139 | 
  140 |   // "getting-started-storybook-basics" steps target real manager-frame elements
  141 |   // with no manual Next button (advancement === completion action itself), so
  142 |   // it can't go through the generic spotlight-walk-then-navigate flow below.
  143 |   if (task.id === "getting-started-storybook-basics") {
  144 |     await performStorybookBasicsAction(page);
  145 |     await openOnboardingPanel(page);
  146 |     const updatedTaskCard = page
  147 |       .locator('[data-testid="task-item"]')
  148 |       .filter({ hasText: task.title });
  149 |     await expect(updatedTaskCard.locator(`text=${task.title}`)).toHaveCSS(
  150 |       "text-decoration",
  151 |       /line-through/,
  152 |       { timeout: 10_000 },
  153 |     );
  154 |     await expect(updatedTaskCard.locator('input[type="checkbox"]')).toBeChecked(
  155 |       { timeout: 5_000 },
  156 |     );
  157 |     await expect(
  158 |       page.getByText(
  159 |         new RegExp(`${expectedCompleted} of \\d+ tasks completed`),
  160 |       ),
  161 |     ).toBeVisible({ timeout: 8_000 });
  162 |     return;
  163 |   }
  164 | 
  165 |   // ── 2. Interleave manual "Next" clicks with real completion clicks ─────────
  166 |   // Steps with a real target (per SpotlightOverlay's own design) advance ONLY
  167 |   // by clicking that real element in the app — they render no manual button.
  168 |   // The previous version of this helper walked every step via a manual
  169 |   // button first and only clicked completionSequence elements afterward,
  170 |   // which meant it never actually worked for any task with a targeted step
  171 |   // (i.e. almost all of them) — it just silently timed out looking for a
  172 |   // button that was never there by design.
  173 |   await walkSpotlightInterleaved(page, task);
  174 | 
  175 |   // ── 3. Return to onboarding panel and verify ──────────────────────────────
  176 |   await openOnboardingPanel(page);
  177 | 
  178 |   const updatedTaskCard = page
  179 |     .locator('[data-testid="task-item"]')
  180 |     .filter({ hasText: task.title });
  181 | 
  182 |   await expect(updatedTaskCard.locator(`text=${task.title}`)).toHaveCSS(
  183 |     "text-decoration",
  184 |     /line-through/,
  185 |     { timeout: 10_000 },
  186 |   );
  187 | 
  188 |   await expect(updatedTaskCard.locator('input[type="checkbox"]')).toBeChecked({
  189 |     timeout: 5_000,
  190 |   });
  191 | 
  192 |   await expect(
  193 |     page.getByText(new RegExp(`${expectedCompleted} of \\d+ tasks completed`)),
  194 |   ).toBeVisible({ timeout: 8_000 });
  195 | }
  196 | 
  197 | // ─── Completion Helpers ──────────────────────────────────────────────────────
  198 | 
  199 | /**
  200 |  * Click the given [data-tour] element in a way that's safe for large
  201 |  * container elements (Dialogs, forms). Clicking the center of a MUI Dialog's
  202 |  * root can land on the backdrop (which sits behind/around the visible Paper)
  203 |  * and silently close the dialog via onClose instead of registering a real
  204 |  * interaction. If the element itself isn't a native interactive control,
  205 |  * click its first interactive descendant instead (a real user would click
  206 |  * into the first field, not the dialog's empty backdrop).
  207 |  */
  208 | async function clickTourTarget(
  209 |   preview: ReturnType<Page["frameLocator"]>,
  210 |   selector: string,
  211 | ): Promise<void> {
  212 |   // Retry the whole locate-and-click a few times — a mock-data list re-render
  213 |   // (e.g. a newly created section being inserted) can detach the exact node
  214 |   // between locating it and the scroll/click actions.
  215 |   let lastError: unknown;
  216 |   for (let attempt = 0; attempt < 3; attempt++) {
  217 |     try {
  218 |       const target = preview.locator(selector).first();
> 219 |       await expect(target).toBeAttached({ timeout: 15_000 });
      |                            ^ Error: expect(locator).toBeAttached() failed
  220 | 
  221 |       const tag = await target.evaluate((el) => el.tagName.toLowerCase());
  222 |       const isNativelyInteractive = [
  223 |         "input",
  224 |         "textarea",
  225 |         "select",
  226 |         "button",
  227 |         "a",
  228 |       ].includes(tag);
  229 | 
  230 |       const clickable = isNativelyInteractive
  231 |         ? target
  232 |         : target
  233 |             .locator(
  234 |               'input, textarea, button, [role="combobox"], [role="button"]',
  235 |             )
  236 |             .first();
  237 | 
  238 |       const finalTarget = (await clickable
  239 |         .isVisible({ timeout: 2_000 })
  240 |         .catch(() => false))
  241 |         ? clickable
  242 |         : target;
  243 | 
  244 |       await finalTarget.scrollIntoViewIfNeeded();
  245 |       // The spotlight tooltip overlay can visually sit above a modal Dialog
  246 |       // that just opened (z-index race), intercepting pointer events even
  247 |       // though the target is otherwise visible/enabled — force the click
  248 |       // since we've already confirmed this is the correct interactive
  249 |       // descendant of the real data-tour target.
  250 |       await finalTarget.click({ force: true, timeout: 5_000 }).catch(async () => {
  251 |         await finalTarget.click({ timeout: 15_000 });
  252 |       });
  253 |       return;
  254 |     } catch (error) {
  255 |       lastError = error;
  256 |     }
  257 |   }
  258 |   throw lastError;
  259 | }
  260 | 
  261 | /**
  262 |  * Walk through ALL spotlight steps by clicking the primary action button:
  263 |  * "Start" on step 1, "Next" on middle steps, "Done" on the last step.
  264 |  * Verifies each step renders before advancing.
  265 |  */
  266 | async function walkAllSpotlightSteps(page: Page): Promise<void> {
  267 |   const tooltip = page.locator('[data-testid="spotlight-tooltip"]');
  268 |   await expect(tooltip.locator("text=/Step \\d+ of \\d+/")).toBeVisible({
  269 |     timeout: 10_000,
  270 |   });
  271 | 
  272 |   // Extract total step count from "Step 1 of N"
  273 |   const stepText = await tooltip
  274 |     .locator("text=/Step \\d+ of \\d+/")
  275 |     .textContent();
  276 |   const totalSteps = parseInt(stepText?.match(/of (\d+)/)?.[1] ?? "1", 10);
  277 | 
  278 |   for (let step = 1; step <= totalSteps; step++) {
  279 |     // Verify current step indicator
  280 |     await expect(
  281 |       tooltip.getByText(`Step ${step} of ${totalSteps}`),
  282 |     ).toBeVisible({ timeout: 5_000 });
  283 | 
  284 |     // Click the primary button (Start / Next / Done)
  285 |     const primaryBtn = tooltip.locator(
  286 |       'button:has-text("Start"), button:has-text("Continue"), button:has-text("Next"), button:has-text("Done")',
  287 |     );
  288 |     await expect(primaryBtn).toBeEnabled({ timeout: 10_000 });
  289 |     await primaryBtn.click();
  290 |   }
  291 | 
  292 |   // Spotlight should be dismissed after clicking Done on the last step
  293 |   await expect(tooltip).not.toBeVisible({ timeout: 5_000 });
  294 | }
  295 | 
  296 | /**
  297 |  * Extract the data-tour value from a targetSelector like
  298 |  * '[data-tour="join-code"], form' or '[data-tour="x"]'.
  299 |  */
  300 | function extractDataTourValue(selector?: string): string | null {
  301 |   if (!selector) return null;
  302 |   const match = selector.match(/\[data-tour="([^"]+)"\]/);
  303 |   return match ? match[1] : null;
  304 | }
  305 | 
  306 | /**
  307 |  * Walk a tutorial-mode spotlight tour to real completion, one step at a time,
  308 |  * driven directly by the REAL spotlight step definitions (not a separately
  309 |  * tracked completionSequence index, which can desync from what's actually
  310 |  * on screen at any given step):
  311 |  *  - info-only steps (no real target): click the manual Start/Next/Done button
  312 |  *  - target-based steps: click the REAL element in the app (the click both
  313 |  *    advances the tour, per SpotlightOverlay's design, and satisfies the
  314 |  *    task's completionCriteria)
  315 |  *
  316 |  * Clicking the task card already auto-navigates the preview iframe to the
  317 |  * task's tutorialStoryId (see OnboardingPanel.handleTaskClick), so this never
  318 |  * needs to `page.goto()` itself.
  319 |  */
```