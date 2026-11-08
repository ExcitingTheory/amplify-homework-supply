/**
 * Demo video 1: Instructor builds a source-led lesson with interactive blocks.
 *
 * Storyline: add prose -> insert and analyze the source PDF -> import vocabulary
 * and unique questions -> use vocabulary autocomplete -> add meaning association,
 * answer, quiz, and AI-graded exercises -> publish and assign the lesson.
 *
 * Output: test-results/demos/01-instructor-builds-a-lesson.webm
 */

import { test, expect, type Locator } from "@playwright/test";
import { readFileSync } from "node:fs";
import { saveInstructorLesson } from "./instructorLesson";
import { INSTRUCTOR } from "../journeys/helpers";
import { recordDemo } from "./demoKit";
import { recycleFailedDemoUnit, type CreatedDemoUnit } from "./demoUnitCleanup";
import { loadBiologySource, pasteLessonHtml, biologyPdfHtml } from "./biologySource";

test("Demo 1: Instructor builds a lesson", async ({ browser, request }) => {
  test.setTimeout(40 * 60_000);
  const biologySource = loadBiologySource();
  let createdUnit: CreatedDemoUnit | undefined;
  try {
    await recordDemo(
      browser,
      {
        name: "01-instructor-builds-a-lesson",
        user: INSTRUCTOR,
        startPath: "/units",
      },
      async (page, demo) => {
        let selectedAIQuestion: { prompt: string; answer: string } | undefined;
        page.on("console", (message) => {
          if (message.text().includes("[saveEditorContent]") ||
              message.text().includes("[Save]") ||
              message.text().includes("[Editor] component error")) {
            console.log(message.text());
          }
        });
        await demo.chapter(
          "Instructor: build a lesson",
          "Add introductory prose, a source PDF, and focused practice",
        );

        // 1. Create a unit
        await page.waitForSelector('[data-tour="units-page"]');
        await demo.beat();
        const creationResponse = page.waitForResponse(
          (response) =>
            response.url().includes("appsync-api") &&
            /\bcreateUnit\s*\(/.test(
              response.request().postDataJSON()?.query || "",
            ),
        );
        await page.locator('[data-tour="create-unit-button"]').first().click();
        const response = await creationResponse;
        const result = await response.json();
        expect(result.errors).toBeUndefined();
        expect(result.data?.createUnit?.id).toBeTruthy();
        createdUnit = {
          id: result.data.createUnit.id,
          graphqlUrl: response.url(),
          authorization: response.request().headers().authorization,
        };
        const emptyGrades = await request.post(createdUnit.graphqlUrl, {
          headers: { authorization: createdUnit.authorization },
          data: {
            query: `query VerifyNewUnitGrades($unitId: ID!) {
              listGrades(filter: {unitID: {eq: $unitId}}, limit: 1) { items { id unitID } }
            }`,
            variables: { unitId: createdUnit.id },
          },
        });
        expect(emptyGrades.ok()).toBe(true);
        const gradeResult = await emptyGrades.json();
        expect(gradeResult.errors).toBeUndefined();
        expect(gradeResult.data?.listGrades?.items).toEqual([]);
        await page.waitForURL(/\/unit\/[a-f0-9-]+/, { timeout: 15_000 });
        await page.goto(`/unit/${createdUnit.id}?sidebars=files&leftWidth=1100`);
        const editor = page.getByRole("textbox", { name: "Edit", exact: true });
        await expect(editor).toBeVisible({ timeout: 90_000 });
        const filesTab = page.locator('[data-tour="files-tab"]');
        const leftDrawer = filesTab.locator('xpath=ancestor::*[contains(@class,"MuiDrawer-root")][1]');
        const drawerWidth = () => leftDrawer.evaluate((element) => element.getBoundingClientRect().width);
        await expect.poll(drawerWidth).toBeGreaterThanOrEqual(1095);
        await expect.poll(drawerWidth).toBeLessThanOrEqual(1105);
        await filesTab.click();
        await expect.poll(drawerWidth).toBeLessThan(100);
        await page.locator('[data-tour="unit-title"]').click();
        const unitName = page.getByTestId("unit-name-input").locator("input");
        await unitName.fill("");
        await unitName.pressSequentially("Cell Biology and Photosynthesis", { delay: 55 });
        await expect(unitName).toHaveValue("Cell Biology and Photosynthesis");
        const nameSaved = page.waitForResponse((response) =>
          response.url().includes("appsync-api") &&
          /\bupdateUnit\s*\(/.test(response.request().postDataJSON()?.query || "") &&
          response.request().postDataJSON()?.variables?.input?.name != null,
        );
        await editor.click();
        const nameResponse = await nameSaved;
        const nameInput = nameResponse.request().postDataJSON().variables.input;
        expect(nameInput.name).toBe("Cell Biology and Photosynthesis");
        const nameResult = await nameResponse.json();
        expect(nameResult.errors).toBeUndefined();
        expect(nameResult.data?.updateUnit?.id).toBe(createdUnit.id);
        const persistedMetadata = await request.post(createdUnit.graphqlUrl, {
          headers: { authorization: createdUnit.authorization },
          data: {
            query: "query VerifyDemoName($id: ID!) { getUnit(id: $id) { id name } }",
            variables: { id: createdUnit.id },
          },
        });
        const persistedName = await persistedMetadata.json();
        expect(persistedName.errors).toBeUndefined();
        expect(persistedName.data?.getUnit?.name).toBe("Cell Biology and Photosynthesis");
        await expect(page.locator('[data-tour="unit-title"]')).toHaveText("Cell Biology and Photosynthesis");
        await page.getByText("Add Description", { exact: true }).click();
        const description = page.getByPlaceholder("Add Description", { exact: true });
        const unitDescription =
          "Explore cells and photosynthesis with a source PDF, useful vocabulary, and several ways to practise.";
        await demo.type(description, unitDescription);
        await editor.click();
        await expect(page.getByText(unitDescription, { exact: true })).toBeVisible();
        await demo.beat();

        await demo.chapter(
          "Introduce the lesson",
          "Set the scene in your own words before adding the reading",
        );
        const lessonIntro =
          "Every living thing is built from cells. In this lesson we read how plant cells are organised, then follow how chloroplasts capture sunlight to make food.";
        await editor.click();
        await demo.type(editor, lessonIntro);
        await page.keyboard.press("Enter");
        await expect(editor.getByText(lessonIntro, { exact: true })).toBeVisible();
        await demo.beat(2000);

        await demo.chapter(
          "Start with the source",
          "Add the biology reading first; the lesson and activities will build on it",
        );
        await filesTab.click();
        await expect.poll(drawerWidth).toBeGreaterThanOrEqual(1095);
        const pdfName = `cell-biology-${createdUnit.id.slice(0, 8)}.pdf`;
        const uploadedPdf = page.waitForResponse((response) =>
          response.url().includes("appsync-api") &&
          /\bcreateFile\s*\(/.test(response.request().postDataJSON()?.query || "") &&
          response.request().postDataJSON()?.variables?.input?.name === pdfName,
          { timeout: 90_000 },
        );
        await page.getByTestId("file-upload-input").setInputFiles({
          name: pdfName,
          mimeType: "application/pdf",
          buffer: readFileSync(biologySource.pdfPath),
        });
        const uploadResponse = await uploadedPdf;
        const uploadResult = await uploadResponse.json();
        expect(uploadResult.errors).toBeUndefined();
        const pdf = uploadResult.data?.createFile;
        expect(pdf?.path).toBeTruthy();
        expect(pdf?.identityId).toBeTruthy();
        await demo.chapter("Read the source PDF", "Place the original reading right after the introduction");
        await filesTab.click();
        await expect.poll(drawerWidth).toBeLessThan(100);
        // Restore the caret left in the empty paragraph after the introduction;
        // clicking the editor again can move it into the middle of the text.
        await editor.focus();
        await pasteLessonHtml(page, biologyPdfHtml({
          path: pdf.path,
          identityId: pdf.identityId,
          name: pdfName,
        }), "Cell biology source PDF");
        const pdfViewer = editor.locator(".react-pdf__Document");
        await expect(pdfViewer.locator("canvas").first()).toBeVisible({ timeout: 90_000 });
        const introFollowedByPdf = await editor.getByText(lessonIntro, { exact: true }).evaluate(
          (intro, viewer) => Boolean(intro.compareDocumentPosition(viewer!) & Node.DOCUMENT_POSITION_FOLLOWING),
          await pdfViewer.elementHandle(),
        );
        expect(introFollowedByPdf).toBe(true);
        await pdfViewer.scrollIntoViewIfNeeded();
        await demo.beat(2500);
        await pdfViewer.hover();
        for (let turn = 0; turn < 3; turn++) {
          await page.mouse.wheel(0, 500);
          await demo.beat(1500);
        }
        await demo.beat(1500);
        await page.keyboard.press("Escape");

        await demo.chapter(
          "Re-analyze the source PDF",
          "Refresh the analysis before importing its vocabulary and questions",
        );
        await filesTab.click();
        await expect.poll(drawerWidth).toBeGreaterThanOrEqual(1095);
        const pdfRow = leftDrawer.getByTestId("file-list-item").filter({
          has: page.getByText(pdfName, { exact: true }),
        });
        const fileList = leftDrawer.getByTestId("file-list-item").first().locator("../..");
        await expect(async () => {
          if (!(await pdfRow.count())) {
            await fileList.hover();
            await page.mouse.wheel(0, 400);
          }
          await expect(pdfRow).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 60_000 });
        await pdfRow.getByRole("checkbox").check({ timeout: 60_000 });
        await leftDrawer.getByRole("button", { name: "Re-analyze", exact: true }).click();
        // Ticking the file selects it, which opens the detail pane holding the
        // app's own analysis progress. Confirm it is on screen, so a silent
        // regression there shows up here rather than as dead air in the video.
        const analysisProgress = leftDrawer.getByRole("progressbar");
        await expect(analysisProgress.first()).toBeVisible({ timeout: 120_000 });
        const analysisSnackbar = page.getByTestId("document-analysis-snackbar");
        await expect(analysisSnackbar).toBeVisible();
        let processingStatus = "";
        let processingMetadata: unknown;
        // Analysis takes minutes; a dropped connection must not abort the take.
        const queryApi = (query: string, variables: Record<string, string>) =>
          request.post(createdUnit!.graphqlUrl, {
            timeout: 60_000,
            headers: { authorization: createdUnit!.authorization },
            data: { query, variables },
          }).catch((error: Error) => {
            console.log("PDF processing poll will retry:", error.message);
            return null;
          });
        await expect.poll(async () => {
          const response = await queryApi(
            "query DemoProcessing($id:ID!) { getFile(id:$id) { documentID } }",
            { id: pdf.id },
          );
          if (!response) return false;
          const body = await response.json();
          expect(body.errors).toBeUndefined();
          const documentId = body.data?.getFile?.documentID;
          if (!documentId) return false;
          const statusResponse = await queryApi(
            "query DemoDocument($id:ID!){getDocument(id:$id){status metadata}}",
            { id: documentId },
          );
          if (!statusResponse) return false;
          const statusBody = await statusResponse.json();
          expect(statusBody.errors).toBeUndefined();
          processingStatus = statusBody.data?.getDocument?.status;
          processingMetadata = statusBody.data?.getDocument?.metadata;
          console.log("PDF processing:", processingStatus);
          return ["completed", "failed", "cancelled"].includes(processingStatus);
        }, {timeout:420_000,intervals:[5000]}).toBe(true);
        expect(processingStatus, `PDF processing metadata: ${JSON.stringify(processingMetadata)}`)
          .toBe("completed");
        await analysisSnackbar.getByRole("button", { name: /close/i }).click();
        await expect(analysisSnackbar).toBeHidden();
        await pdfRow.getByRole("checkbox").uncheck();
        await pdfRow.getByRole("checkbox").check();
        const extractedTabs = leftDrawer.getByRole("tab").filter({ hasText: /^\(\d+\)$/ });
        await expect(extractedTabs.first()).toBeVisible({ timeout: 240_000 });
        await expect(extractedTabs.first()).not.toHaveText("(0)", { timeout: 240_000 });
        await demo.chapter(
          "Bring key terms into practice",
          "Use the reading analysis to support a few focused exercises",
        );
        await extractedTabs.first().click();
        await expect(leftDrawer.getByText(/Review and import vocabulary from the document/i)).toBeVisible();
        await demo.beat(1800);
        const vocabularyList = leftDrawer
          .locator('[data-tour="word-card"]')
          .first()
          .locator("xpath=ancestor::ul[1]");
        const vocabularyScroller = vocabularyList.locator("xpath=..");
        await expect(vocabularyScroller).toBeVisible();
        // The review screen selects every pending vocabulary item by default.
        // Import all of them before adding exercises that depend on the terms.
        await expect(
          leftDrawer.getByRole("button", { name: "Deselect All", exact: true }),
        ).toBeVisible();
        const vocabularyCards = vocabularyList.locator(
          '[data-tour="word-card"]',
        );
        await expect(vocabularyCards.first()).toBeVisible();
        await vocabularyScroller.scrollIntoViewIfNeeded();
        await demo.beat(1200);
        // Show the extracted terms by scrolling the virtualized list, as the question step does.
        for (let page = 0; page < 3; page++) {
          const before = await vocabularyScroller.evaluate((element) => element.scrollTop);
          const atEnd = await vocabularyScroller.evaluate(
            (element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1,
          );
          if (atEnd) break;
          await vocabularyScroller.evaluate((element) =>
            element.scrollBy({ top: 600, behavior: "smooth" }),
          );
          await expect
            .poll(() => vocabularyScroller.evaluate((element) => element.scrollTop))
            .toBeGreaterThan(before);
          await demo.beat(1200);
        }
        await expect(vocabularyCards.first()).toBeVisible();
        await demo.beat(1500);
        await leftDrawer
          .getByRole("button", { name: "Import To Dictionary", exact: true })
          .click();
        const vocabularyImportResult = leftDrawer.getByRole("alert").filter({
          hasText: /Imported.*errors/i,
        });
        await expect(vocabularyImportResult).toBeVisible({ timeout: 240_000 });
        const vocabularySummary = await vocabularyImportResult.innerText();
        const vocabularyCounts =
          /Imported (\d+) new words, (\d+) already existed, (\d+) errors/i.exec(
            vocabularySummary,
          );
        expect(vocabularyCounts, vocabularySummary).not.toBeNull();
        expect(Number(vocabularyCounts?.[1]) + Number(vocabularyCounts?.[2])).toBeGreaterThan(0);
        expect(Number(vocabularyCounts?.[3])).toBe(0);
        await demo.beat(2500);
        await demo.chapter("Pick questions for the bank", "Import distinct questions about cell structures and pigments");
        await extractedTabs.nth(1).click();
        await expect(extractedTabs.nth(1)).not.toHaveText("(0)", { timeout: 240_000 });
        await expect(leftDrawer.getByText(/Review and import questions from the document/i)).toBeVisible();
        await demo.beat(4000);
        await expect(
          leftDrawer.getByRole("button", { name: "Deselect All", exact: true }),
        ).toBeVisible();
        const questionList = leftDrawer
          .getByRole("checkbox", { name: /^Select Question\b/ })
          .first()
          .locator("xpath=ancestor::ul[1]");
        await expect(questionList).toBeVisible();
        const questionScroller = questionList.locator("xpath=..");
        const questionRows = questionList.getByRole("listitem");
        let selectedQuestion: Locator | undefined;
        let selectedPrompt = "";
        for (let pageIndex = 0; pageIndex < 40 && !selectedQuestion; pageIndex++) {
          const rowCount = await questionRows.count();
          for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const row = questionRows.nth(rowIndex);
            const prompt = (
              await row.locator('[contenteditable="true"]').first().innerText()
            ).trim();
            if (prompt && !/photosynthesis/i.test(prompt)) {
              selectedQuestion = row;
              selectedPrompt = prompt;
              break;
            }
          }
          if (selectedQuestion) break;
          const atEnd = await questionScroller.evaluate(
            (element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1,
          );
          if (atEnd) break;
          const before = await questionScroller.evaluate((element) => element.scrollTop);
          await questionScroller.evaluate((element) =>
            element.scrollBy({ top: 600, behavior: "smooth" }),
          );
          await expect
            .poll(() => questionScroller.evaluate((element) => element.scrollTop))
            .toBeGreaterThan(before);
          await demo.beat(500);
        }
        if (!selectedQuestion) {
          throw new Error("The PDF analysis did not provide a question distinct from the previous photosynthesis question");
        }
        expect(selectedPrompt).not.toMatch(/photosynthesis/i);
        await selectedQuestion.getByRole("button", { name: /expand/i }).click();
        const expectedAnswer = (
          await selectedQuestion
            .getByRole("textbox", { name: "Answer" })
            .innerText()
        ).trim();
        expect(expectedAnswer.length).toBeGreaterThan(0);
        selectedAIQuestion = { prompt: selectedPrompt, answer: expectedAnswer };
        await demo.beat(1500);
        await demo.beat(2500);
        await leftDrawer.getByRole("button", { name: "Import to Question Bank", exact: true }).click();
        const questionImportResult = leftDrawer.getByRole("alert").filter({
          hasText: /Imported.*errors/i,
        });
        await expect(questionImportResult).toBeVisible({ timeout: 240_000 });
        const questionSummary = await questionImportResult.innerText();
        const questionCounts =
          /Imported (\d+) new questions, (\d+) already existed, (\d+) errors/i.exec(
            questionSummary,
          );
        expect(questionCounts, questionSummary).not.toBeNull();
        expect(Number(questionCounts?.[1]) + Number(questionCounts?.[2])).toBeGreaterThan(0);
        expect(Number(questionCounts?.[3])).toBe(0);
        await demo.beat(2500);
        await demo.beat(2000);
        await filesTab.click();
        await expect.poll(drawerWidth).toBeLessThan(100);
        const importedDraft = page.waitForResponse((response) =>
          response.request().method() === "PUT" &&
          response.url().includes(`units/${createdUnit?.id}/draft.json`) &&
          response.ok(),
          { timeout: 60_000 },
        );
        await page.getByTestId("save-button").click();
        await importedDraft;
        await page.reload();
        await expect(editor).toBeVisible({ timeout: 90_000 });
        await expect(editor.locator(".react-pdf__Document").locator("canvas").first())
          .toBeVisible({ timeout: 90_000 });
        await expect.poll(drawerWidth).toBeGreaterThanOrEqual(1095);
        await filesTab.click();
        await expect.poll(drawerWidth).toBeLessThan(100);

        // Continue below the PDF with a vocabulary-focused paragraph.
        await editor.focus();
        await page.keyboard.press("ControlOrMeta+End");
        await page.keyboard.press("Enter");
        await demo.chapter(
          "Explain useful vocabulary",
          "Start typing below the PDF and let autocomplete suggest the content",
        );
        const completionPrompt = "Useful vocabulary for photosynthesis includes";
        const completionResponse = page.waitForResponse(
          (response) =>
            response.url().endsWith("/api/content-completion") &&
            response.request().method() === "POST" &&
            response.request().postDataJSON()?.prompt === completionPrompt,
          { timeout: 60_000 },
        );
        await page.keyboard.type(completionPrompt, { delay: 55 });
        const completionResult = await completionResponse;
        expect(completionResult.ok()).toBe(true);
        expect(await completionResult.finished()).toBeNull();
        const ghostText = editor.locator('span[contenteditable="false"][spellcheck="false"]')
          .filter({ hasText: /Tab.*accept/i }).first();
        await expect(ghostText).toBeVisible({ timeout: 60_000 });
        const completion = (await ghostText.locator(".ai-suggestion-markdown").innerText()).trim();
        expect(completion.length).toBeGreaterThan(0);
        await demo.beat(2500);
        await editor.focus();
        await editor.press("Escape");
        await expect(ghostText).toHaveCount(0);
        await expect(editor).toContainText(completionPrompt);
        await demo.beat(2000);
        await editor.focus();
        await page.keyboard.press("ControlOrMeta+End");
        await page.keyboard.press("Enter");

        const selectWordForExercise = async (input: Locator, word: string) => {
          await demo.type(input, word);
          const existingWord = page.getByRole("option", {
            name: new RegExp(`^${word}$`, "i"),
          }).first();
          await expect(
            existingWord,
            `${word} must be imported before creating dependent exercises`,
          ).toBeVisible();
          await existingWord.click();
        };

        await demo.chapter(
          "Connect words and meanings",
          "Add a meaning-association exercise if autocomplete did not suggest one",
        );
        const meaningAssociations = page.locator(
          '[data-block-type="meaning-association"]',
        );
        if (!(await meaningAssociations.count())) {
          await editor.focus();
          await page.keyboard.press("ControlOrMeta+End");
          await page.keyboard.press("Enter");
          await page.locator('button[aria-controls="insert-node-menu"]').click();
          await page.getByRole("menuitem", { name: /Meaning Association/i }).click();
        }
        const meaningAssociation = meaningAssociations.last();
        await expect(meaningAssociation).toBeVisible();
        const meaningWord = meaningAssociation.getByRole("combobox").first();
        const meaningWords = ["Nucleus", "Ribosomes"];
        for (const word of meaningWords) {
          const wordCell = meaningAssociation.getByRole("gridcell", {
            name: new RegExp(`^${word}$`, "i"),
          });
          if (!(await wordCell.count())) {
            await selectWordForExercise(meaningWord, word);
          }
          await expect(wordCell).toBeVisible();
          await demo.beat(1500);
        }

        await demo.chapter(
          "Build a vocabulary answer",
          "Choose a pair of useful cell terms for short-answer practice",
        );
        const shortAnswers = page.locator('[data-block-type="answer"]');
        if (!(await shortAnswers.count())) {
          await editor.focus();
          await page.keyboard.press("ControlOrMeta+End");
          await page.keyboard.press("Enter");
          await page.locator('button[aria-controls="insert-node-menu"]').click();
          await page
            .getByRole("menuitem", { name: /Short Answer.*Vocabulary/i })
            .click();
        }
        const shortAnswer = shortAnswers.last();
        await expect(shortAnswer).toBeVisible();
        await expect(
          shortAnswer.getByRole("heading", {
            name: /Short Answer Exercise by Definition/i,
          }),
        ).toBeVisible();
        const addWord = shortAnswer.getByRole("combobox").first();
        const answerWords = ["Mitochondria", "Cell wall"];
        for (const word of answerWords) {
          const wordRow = shortAnswer.getByRole("row").filter({
            has: page.getByRole("gridcell", {
              name: new RegExp(`^${word}$`, "i"),
            }),
          });
          if (!(await wordRow.count())) {
            await addWord.scrollIntoViewIfNeeded();
            await selectWordForExercise(addWord, word);
          }
          await expect(wordRow).toBeVisible();
          await demo.beat(1500);
        }

        await demo.chapter(
          "Make a multiple-choice quiz",
          "Build a quick check about the structure of plant cells",
        );
        await editor.focus();
        await page.keyboard.press("ControlOrMeta+End");
        await page.keyboard.press("Enter");
        const quizPrompt = "What is the basic structure of the cell membrane?";
        await page.keyboard.type(quizPrompt, { delay: 45 });
        await page.keyboard.press("Enter");
        await page.locator('button[aria-controls="insert-node-menu"]').click();
        await page
          .getByRole("menuitem", { name: /Multiple Choice Quiz/i })
          .click();
        const quizBlock = page.locator('[data-tour="quiz-block"]').last();
        await expect(quizBlock).toBeVisible();
        await quizBlock.getByRole("button", { name: /^Edit$/i }).click();
        const quizAnswers = ["Phospholipid bilayer", "Cellulose", "DNA"];
        for (const [index, answer] of quizAnswers.entries()) {
          await quizBlock.getByTestId("quiz-add-answer").click();
          await quizBlock.getByRole("textbox").nth(index).fill(answer);
        }
        const correctQuizAnswer = quizBlock
          .locator('[data-tour="correct-checkbox"]')
          .first()
          .getByRole("checkbox");
        await correctQuizAnswer.check();
        await expect(correctQuizAnswer).toBeChecked();
        await quizBlock.getByRole("button", { name: /^Done$/i }).click();
        await expect(
          quizBlock.getByText("Phospholipid bilayer", { exact: true }),
        ).toBeVisible();

        await demo.chapter(
          "Add a unique AI-graded question",
          "Use a fresh cell-structure question from the imported bank",
          2800,
        );
        await editor.focus();
        await page.keyboard.press("ControlOrMeta+End");
        await page.keyboard.press("Enter");
        await page.locator('button[aria-controls="insert-node-menu"]').click();
        await page
          .getByRole("menuitem", { name: /AI-Graded Exercise/i })
          .click();

        const aiQuestion = selectedAIQuestion;
        if (!aiQuestion) throw new Error("The imported AI question was not captured");
        const aiBlock = page.locator('[data-block-type="custom-ai"]').last();
        const criteria = page.getByPlaceholder(
          /Describe how the AI should grade/i,
        );
        await expect(criteria).toBeVisible({ timeout: 10_000 });
        await criteria.scrollIntoViewIfNeeded();
        await demo.beat();
        await demo.type(
          criteria,
          `Award full credit for an accurate answer to: ${aiQuestion.prompt} Expected answer: ${aiQuestion.answer} Give partial credit for a correct but incomplete explanation.`,
        );
        await criteria.blur();
        await demo.beat(1500);

        const search = aiBlock.getByPlaceholder(/Search and add questions/i);
        await search.scrollIntoViewIfNeeded();
        await search.click();
        const selectedQuestionOption = page
          .getByRole("option")
          .filter({ hasText: aiQuestion.prompt })
          .first();
        await expect(async () => {
          await search.fill("");
          await search.pressSequentially(aiQuestion.prompt.slice(0, 40), { delay: 70 });
          await expect(selectedQuestionOption).toBeVisible({ timeout: 8_000 });
        }).toPass({ timeout: 180_000, intervals: [3_000] });
        const uniquePrompt = await selectedQuestionOption.innerText();
        expect(uniquePrompt).toBe(aiQuestion.prompt);
        await selectedQuestionOption.click();
        const questionCountHeading = aiBlock.getByRole("heading", {
          name: /^Questions \(\d+\)$/,
        });
        await expect(questionCountHeading).toHaveText("Questions (1)");

        // The AI-graded exercise accepts more than typing: the instructor
        // chooses which input modes learners may answer with.
        await demo.chapter(
          "Let learners answer their own way",
          "Allow a spoken or drawn response as well as typing",
        );
        await aiBlock.scrollIntoViewIfNeeded();
        const inputModes = aiBlock.getByRole("group", { name: /Allowed input modes/i });
        await expect(inputModes).toBeVisible();
        for (const mode of ["Audio", "Drawing"] as const) {
          const toggle = inputModes.getByRole("button", { name: mode, exact: true });
          await toggle.click();
          // The toggle group reflects the saved value, so a pressed button
          // confirms the mode reached the block rather than just the click.
          await expect(toggle).toHaveAttribute("aria-pressed", "true");
          await demo.beat(2000);
        }
        await demo.beat(1500);

        // 7. Tour the side tabs
        await demo.chapter(
          "Everything in one place",
          "Vocabulary, files and assignments",
        );
        for (const tab of ["dictionary-tab", "files-tab", "assignments-tab"]) {
          const locator = page.locator(`[data-tour="${tab}"]`);
          if (await locator.isVisible().catch(() => false)) {
            await locator.click();
            await expect.poll(drawerWidth).toBeGreaterThanOrEqual(1095);
            await demo.beat(2500);
          }
        }
        await page.locator('[data-tour="assignments-tab"]').click();
        await expect.poll(drawerWidth).toBeLessThan(100);

        await demo.chapter("Publish the lesson", "Make the completed unit available to learners");
        await editor.click();
        await page.keyboard.press("ControlOrMeta+End");
        await page.keyboard.press("Enter");
        await demo.type(editor, "Review the reading, practise the vocabulary, and explain how chlorophyll captures light for photosynthesis.");
        const savedContent = page.context().waitForEvent("response", { predicate: (response) =>
          response.url().includes("appsync-api") &&
          /\bupdateUnit\s*\(/.test(response.request().postDataJSON()?.query || "") &&
          response.request().postDataJSON()?.variables?.input?.contentVersion != null,
          timeout: 60_000,
        });
        const draftUpload = page.context().waitForEvent("response", {
          predicate: (response) => response.request().method() === "PUT" &&
            response.url().includes(`units/${createdUnit?.id}/draft.json`) && response.ok(),
          timeout: 60_000,
        });
        await page.getByTestId("save-button").click();
        expect((await savedContent).ok()).toBe(true);
        const savedDraft = JSON.parse((await draftUpload).request().postData()!);
        interface SavedNode {
          type: string;
          children?: SavedNode[];
          ids?: string[];
          allowedInput?: string[];
        }
        const aiExercises: SavedNode[] = [];
        const collectExercises = (node: SavedNode) => {
          if (node.type === "custom-ai") aiExercises.push(node);
          node.children?.forEach(collectExercises);
        };
        collectExercises(savedDraft.root);
        // The exercise keeps its questions and now accepts spoken and drawn
        // answers as well as typed ones.
        expect(aiExercises.some((node) =>
          node.ids?.length &&
          ["text", "audio", "drawing"].every((mode) => node.allowedInput?.includes(mode)),
        )).toBe(true);
        const published = page.waitForResponse((response) =>
          response.url().includes("appsync-api") &&
          /\bpublishUnit\s*\(/.test(response.request().postDataJSON()?.query || ""),
          { timeout: 120_000 },
        );
        await page.getByRole("combobox", { name: /^Status\b/ }).click();
        await page.getByRole("option", { name: "Published", exact: true }).click();
        const publishBody = await (await published).json();
        expect(publishBody.errors).toBeUndefined();
        const publishResult = typeof publishBody.data?.publishUnit === "string"
          ? JSON.parse(publishBody.data.publishUnit) : publishBody.data?.publishUnit;
        expect(publishResult?.success).toBe(true);
        await expect(page.getByRole("combobox", { name: /^Status\b/ })).toHaveText(/Published/);
        await demo.beat(2500);

        await demo.chapter("Create a class assignment", "Open the published lesson now for Biology 101");
        await page.locator('[data-tour="assignments-tab"]').click();
        await expect.poll(drawerWidth).toBeGreaterThanOrEqual(1095);
        const openDate = await page.evaluate(() => {
          // Open the lesson an hour ago so it is immediately available. The
          // assignment's end is anchored to the end of whichever day is picked,
          // so an hour ago must not fall into yesterday: just after midnight
          // that would set a deadline that has already passed.
          const now = new Date();
          const date = new Date(now.getTime() - 60 * 60_000);
          if (date.getDate() !== now.getDate()) {
            // Clamp to the start of today, not of the day an hour ago.
            date.setTime(now.getTime());
            date.setHours(0, 0, 0, 0);
          }
          const pad = (value: number) => String(value).padStart(2, "0");
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        });
        await page.locator('[data-tour="due-date-picker"] input').fill(openDate);
        const section = page.getByRole("combobox", { name: "Section", exact: true });
        await section.scrollIntoViewIfNeeded();
        await section.fill("Biology 101");
        await page.getByRole("option", { name: /Biology 101 - Period 3/ }).click();
        await expect(page.getByText("Assignment Preview", { exact: true })).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Assign Button", exact: true }),
        ).toBeVisible();
        const assignmentCreated = page.waitForResponse((response) =>
          response.url().includes("appsync-api") &&
          /\bcreateAssignment\s*\(/.test(response.request().postDataJSON()?.query || "") &&
          response.request().postDataJSON()?.variables?.input?.unitID === createdUnit?.id,
          { timeout: 60_000 },
        );
        await page.getByRole("button", { name: "Assign Button", exact: true }).click();
        const assignmentResponse = await assignmentCreated;
        const assignmentInput = assignmentResponse.request().postDataJSON().variables.input;
        expect(new Date(assignmentInput.availableFrom).getTime()).toBeLessThanOrEqual(Date.now());
        expect(new Date(assignmentInput.availableUntil).getTime()).toBeGreaterThan(Date.now());
        const assignmentBody = await assignmentResponse.json();
        expect(assignmentBody.errors).toBeUndefined();
        expect(assignmentBody.data?.createAssignment?.id).toBeTruthy();
        if (!createdUnit) throw new Error("Created unit was not tracked");
        if (!selectedAIQuestion) throw new Error("AI-graded question was not captured");
        saveInstructorLesson({
          unitId: createdUnit.id,
          assignmentId: assignmentBody.data.createAssignment.id,
          sectionId: assignmentBody.data.createAssignment.sectionID,
          aiQuestionPrompt: selectedAIQuestion.prompt,
          aiQuestionAnswer: selectedAIQuestion.answer,
        });
        await expect(page.getByRole("alert").filter({ hasText: /Assignment Success|Assignment created successfully/ })).toBeVisible();
        await demo.beat(4000);
      },
    );
  } catch (error) {
    if (createdUnit) {
      try {
        await recycleFailedDemoUnit(request, createdUnit);
        console.log(`Recycled failed demo unit ${createdUnit.id}`);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          `Instructor demo failed; unit ${createdUnit.id} could not be recycled`,
        );
      }
    }
    throw error;
  }
});
