/**
 * Demo video 2: Learner completes an AI-graded exercise.
 *
 * Storyline: open the newly authored instructor workbook -> answer
 * each question in free text -> AI grades with a score and feedback.
 *
 * Requires a successful instructor recording and its instructor-lesson.json
 * handoff, Biology 101 enrollment, and a working grading backend.
 * Never falls back to a seeded workbook.
 *
 * Output: test-results/demos/02-learner-ai-graded-exercise.webm
 */

import { test, expect } from "@playwright/test";
import { STUDENT_1 } from "../journeys/helpers";
import { recordDemo } from "./demoKit";
import { loadInstructorLesson } from "./instructorLesson";

test("Demo 2: Learner completes an AI-graded exercise", async ({ browser }) => {
  const lesson = loadInstructorLesson();
  await recordDemo(
    browser,
    {
      name: "02-learner-ai-graded-exercise",
      user: STUDENT_1,
      startPath: "/",
    },
    async (page, demo) => {
      page.on("console", (message) => {
        const text = message.text();
        if (
          message.type() === "error" &&
          /UserSubmission|AudioWaveformPlayer|CustomAIComponent|Transcribe URL Error/i.test(
            text,
          )
        ) {
          const summary = text
            .split(/\r?\n/, 1)[0]
            .replace(/https?:\/\/\S+/g, "[URL]")
            .replace(/private\/[^\s/]+/g, "private/[identity]");
          console.log(`[demo browser error] ${summary}`);
        }
      });

      await demo.chapter(
        "Learner: AI-graded homework",
        "Answer in your own words and get instant, personalised feedback",
      );

      await page.goto(`/workbook/${lesson.unitId}`);
      await page.waitForURL(/\/workbook\//, { timeout: 20_000 });
      expect(new URL(page.url()).pathname).toBe(`/workbook/${lesson.unitId}`);

      // 2. Timer gate / previous results from earlier takes
      // "Start recording" in the audio answer mode also begins with "start".
      const startButton = page.getByRole("button", { name: /^start$/i });
      const tryAgain = page.getByRole("button", { name: /try again/i });
      const inputs = page.locator('[data-testid="custom-ai-input"]');
      await expect(
        startButton.or(tryAgain).or(inputs.first()).first(),
      ).toBeVisible({ timeout: 60_000 });
      if (await startButton.isVisible()) {
        await demo.beat(1000);
        await startButton.click();
        await expect(tryAgain.or(inputs.first()).first()).toBeVisible({
          timeout: 60_000,
        });
      }
      if (await tryAgain.isVisible()) {
        await tryAgain.click();
      }

      await expect(page.locator('[data-tour="workbook"]')).toBeVisible({
        timeout: 20_000,
      });
      await expect(inputs.first()).toBeVisible({ timeout: 20_000 });
      await demo.beat(2500);

      // 3. The instructor allowed more than typing, so show those first: once
      // every block is answered the unit completes and the workbook closes.
      await demo.chapter(
        "Answer out loud",
        "Answer the new cell-structure question in your own words",
      );
      await page.context().grantPermissions(["microphone"]);
      // The instructor allowed audio and drawing as well as typing, so the
      // learner picks how to answer from the exercise's own mode switch.
      const aiExercise = page.locator('[data-block-type="custom-ai"]').first();
      await aiExercise.scrollIntoViewIfNeeded();
      const chooseMode = async (mode: "text" | "audio" | "drawing") => {
        const toggle = aiExercise.getByRole("button", { name: mode, exact: true }).first();
        await toggle.scrollIntoViewIfNeeded();
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-pressed", "true");
        await demo.beat(1500);
      };
      await chooseMode("audio");
      // Recording shows as separate Start and Stop controls, with Stop
      // disabled until a recording is running.
      const recordButton = aiExercise
        .getByRole("button", { name: "Start recording", exact: true })
        .first();
      await expect(recordButton).toBeVisible({ timeout: 30_000 });
      const audioPanel = recordButton.locator("xpath=ancestor::li[1]");
      await audioPanel.scrollIntoViewIfNeeded();
      const audioGrading = page.waitForResponse(
        (response) => response.url().includes("/api/grade-ai"),
        { timeout: 120_000 },
      );
      await recordButton.click();
      const stopButton = aiExercise
        .getByRole("button", { name: "Stop recording", exact: true })
        .first();
      await expect(stopButton).toBeEnabled({ timeout: 15_000 });
      await demo.beat(15_000);
      await stopButton.click();
      // A finished recording is uploaded and graded by the same AI route the
      // typed answers use; it submits itself, with no Submit to press.
      const gradeResponse = await audioGrading;
      expect(gradeResponse.ok(), `AI grading returned HTTP ${gradeResponse.status()}`).toBe(true);
      const spokenFeedback = await gradeResponse.json();
      expect(spokenFeedback.feedback ?? spokenFeedback.reason).toBeTruthy();
      await expect(aiExercise.getByText(/Score:\s*\d+\/100/).first())
        .toBeVisible({ timeout: 60_000 });
      await demo.beat(3500);


      await demo.chapter("Draw an explanation", "Switch to drawing and sketch sunlight reaching a plant");
      await chooseMode("drawing");
      // The drawing editor is mounted only when the pointer reaches the
      // placeholder, and a panel that already holds a submitted sketch never
      // swaps it in (SketchPad returns early when imageData is set). So the
      // panel to draw in is the one still offering the hover prompt.
      const hintText = "Hover to start drawing";
      const questionPanels = aiExercise.locator("li");
      await expect(questionPanels.getByText(hintText, { exact: true }).first())
        .toBeVisible({ timeout: 60_000 });
      // Hold the panel by position, not by the prompt inside it: the prompt is
      // removed the moment the editor mounts, which would otherwise re-resolve
      // this to the other question's panel.
      let drawingIndex = -1;
      for (let index = 0; index < (await questionPanels.count()); index++) {
        if (await questionPanels.nth(index).getByText(hintText, { exact: true }).count()) {
          drawingIndex = index;
          break;
        }
      }
      expect(drawingIndex, "no question is offering the drawing prompt").toBeGreaterThanOrEqual(0);
      const drawingPanel = questionPanels.nth(drawingIndex);
      const drawingHint = drawingPanel.getByText(hintText, { exact: true });
      await drawingHint.scrollIntoViewIfNeeded();
      // Excalidraw stacks a static and an interactive canvas; only the
      // interactive one takes pointer input, and it appears once mounted.
      const canvas = drawingPanel.locator("canvas.interactive").first();
      // Mounting is driven by the pointer arriving, and the editor is loaded
      // lazily, so keep the pointer moving over the placeholder until the
      // canvas it swaps in is actually there.
      await expect(async () => {
        const area = (await drawingHint.count()) ? await drawingHint.boundingBox() : null;
        if (area) {
          await page.mouse.move(area.x + area.width / 2, area.y - 20);
          await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2, { steps: 8 });
        }
        await expect(canvas).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 90_000, intervals: [2_000] });
      const bounds = await canvas.boundingBox();
      if (!bounds) throw new Error("Drawing canvas has no bounds");
      // Points are fractions of the canvas, so the sketch fits whatever size
      // the block gives it rather than assuming fixed pixels.
      const stroke = async (points: number[][]) => {
        const at = ([fx, fy]: number[]) =>
          [bounds.x + bounds.width * fx, bounds.y + bounds.height * fy] as const;
        const [startX, startY] = at(points[0]);
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        for (const point of points.slice(1)) {
          const [x, y] = at(point);
          await page.mouse.move(x, y, { steps: 4 });
        }
        await page.mouse.up();
        await page.waitForTimeout(150);
      };
      // A stem, two leaves, a sun and a ray reaching the plant.
      await stroke([[0.5, 0.85], [0.5, 0.6], [0.5, 0.4], [0.5, 0.25]]);
      await stroke([[0.5, 0.58], [0.38, 0.46], [0.32, 0.48], [0.37, 0.57], [0.5, 0.58]]);
      await stroke([[0.5, 0.47], [0.62, 0.35], [0.69, 0.37], [0.63, 0.46], [0.5, 0.47]]);
      const sun = Array.from({ length: 25 }, (_, index) => {
        const angle = (index * Math.PI) / 12;
        return [0.18 + 0.09 * Math.cos(angle), 0.22 + 0.13 * Math.sin(angle)];
      });
      await stroke(sun);
      await stroke([[0.28, 0.3], [0.45, 0.42]]);
      await demo.beat(2500);
      // Moving off the canvas is what arms the submission: the editor collapses
      // back to the sketch and starts the countdown, and only then does the
      // panel re-render with Submit enabled. Clicking it just skips the wait.
      const panelBox = await drawingPanel.boundingBox();
      if (!panelBox) throw new Error("Drawing panel has no bounds");
      await page.mouse.move(
        panelBox.x + panelBox.width / 2,
        panelBox.y + panelBox.height + 40,
        { steps: 12 },
      );
      const drawingSubmit = drawingPanel.getByRole("button", { name: /^Submit/i });
      await expect(drawingSubmit).toBeEnabled({ timeout: 30_000 });
      await drawingSubmit.click();
      await expect(drawingPanel.getByRole("img", { name: /sketch/i })).toBeVisible({ timeout: 90_000 });
      await demo.beat(5000);

      // 4. Answer anything still open by typing, and let the AI grade it.
      // Anchor on the question's <li>: inputs lose contenteditable once graded.
      await chooseMode("text");
      const panels = page.locator("li").filter({ has: inputs });
      const questionCount = await panels.count();
      for (let i = 0; i < questionCount; i++) {
        const prompt = await panels.first().locator("strong").locator("..").innerText();
        // Grading adds further list items repeating the prompt, so the panel
        // holding the answer input is the one to work in.
        const panel = page
          .locator("li")
          .filter({ has: page.getByText(prompt, { exact: true }) })
          .filter({ has: page.locator('[data-testid="custom-ai-input"]') })
          .first();
        // Other answer blocks share the input test id but are not AI-graded, so
        // only answer the ones offering a Submit.
        const submit = panel.getByRole("button", { name: /submit/i, disabled: false }).first();
        if ((await submit.count()) === 0) continue;
        const input = panel.locator('[data-testid="custom-ai-input"]').first();
        await input.scrollIntoViewIfNeeded();
        await demo.type(input, lesson.aiQuestionAnswer);
        await demo.beat(1000);

        await submit.click();

        await expect(panel.getByText(/AI is grading/i)).toBeVisible({
          timeout: 10_000,
        });
        await demo.beat(1500);
        // The score is rendered in the question's result item, not the input one.
        const graded = page
          .locator("li")
          .filter({ has: page.getByText(prompt, { exact: true }) })
          .filter({ hasText: /Score:\s*\d+\/100/ })
          .first();
        await expect(graded).toBeVisible({ timeout: 90_000 });
        // /api/grade-ai returns HTTP 200 with this message on OpenAI failure
        await expect(
          graded.getByText(/error occurred while grading/i),
          "AI grading backend failed; check OPENAI_API_KEY and server logs",
        ).toHaveCount(0);
        await graded.scrollIntoViewIfNeeded();
        await demo.beat(4500); // time to read the feedback
      }


      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await demo.beat(3500);
    },
  );
});
