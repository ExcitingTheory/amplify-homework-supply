/**
 * @fileoverview Utilities for importing questions from ParsedContent to Question bank
 * Handles duplicate detection, Question creation, and Unit/Document linking
 */

import { getAmplifyClient } from "./amplifyClient";
import { assertParsedContentImportAllowed } from "./parsedContentModeration";
import { QUESTION_FIELDS, pickEntries, toEntryList } from "./parsedContentLists";
import {
  loadMergedParsedContent,
  patchMergedListEntries,
  updateMergedListEntry,
} from "./parsedContentChunks";
import {
  indexLinksByItem,
  linkItemToDocument,
  listDocumentLinks,
} from "./documentLinks";
import {
  findExistingByField,
  IMPORT_CONCURRENCY,
  listUnitLinkIds,
  mapWithConcurrency,
  matchKey,
  singleFlight,
} from "./importBatch";

/**
 * Check if a question already exists in the bank (by prompt similarity)
 *
 * Shares the batch lookup so a single check matches a prompt exactly as a whole
 * import would.
 * @param {string} prompt - The question prompt to check
 * @param {string} owner - Owner of the question
 * @returns {Promise<Object|null>} Existing question or null
 */
export async function findExistingQuestion(prompt, owner) {
  const client = getAmplifyClient();
  const found = await findExistingByField(client.models.Question, "prompt", [prompt]);
  return found.get(matchKey(prompt)) ?? null;
}

/**
 * Create a new Question in the bank
 * @param {Object} questionItem - Question item from ParsedContent.questionsJSON
 * @param {string} owner - Owner of the question
 * @param {string} identityId - Identity ID for auth
 * @returns {Promise<Object>} Created question
 */
export async function createQuestion(questionItem, owner, identityId) {
  const client = getAmplifyClient();
  const { prompt, answer, hint, options, questionType, difficulty } =
    questionItem;

  const questionPrompt = prompt || "";
  const questionAnswer = answer || "";
  const questionHint = hint || undefined;
  const resolvedDifficulty = difficulty || "medium";

  // Build choices array if options exist
  let choices = null;
  if (options && Array.isArray(options) && options.length > 0) {
    choices = options.map((opt) => ({
      choice:
        typeof opt === "string" ? opt : opt.text || opt.choice || String(opt),
      correct:
        typeof opt === "string"
          ? opt.toLowerCase() === questionAnswer.toLowerCase()
          : opt.correct || false,
    }));
  }

  const { data: newQuestion } = await client.models.Question.create({
    prompt: questionPrompt,
    answer: questionAnswer,
    hint: questionHint,
    choices: choices ? JSON.stringify(choices) : null,
    difficulty: resolvedDifficulty,
    generated: true,
    importedAt: new Date().toISOString(),
    owner: owner,
    identityId: identityId,
  });

  return newQuestion;
}

/**
 * Link a Question to a Unit via QuestionUnit junction table
 * @param {string} questionId - ID of the Question
 * @param {string} unitId - ID of the Unit
 * @param {string} owner - Owner of the relationship
 * @param {Map<string, Object>} [existing] - Links already loaded for the unit, by question id
 * @returns {Promise<Object>} Created QuestionUnit relationship
 */
export async function linkQuestionToUnit(questionId, unitId, owner, existing = undefined) {
  const client = getAmplifyClient();
  // The unit's links are loaded once by a batch import, so only look them up
  // here when this is a standalone call.
  if (existing) {
    const known = existing.get(questionId);
    if (known) return known;
  } else {
    const { data: found } = await client.models.QuestionUnit.list({
      filter: {
        and: [{ questionID: { eq: questionId } }, { unitID: { eq: unitId } }],
      },
    });
    if (found && found.length > 0) {
      console.log(`Question ${questionId} already linked to Unit ${unitId}`);
      return found[0];
    }
  }

  const { data: questionUnit } = await client.models.QuestionUnit.create({
    questionID: questionId,
    unitID: unitId,
    owner: owner,
  });
  return questionUnit;
}

/**
 * Link a Question to a Document via DocumentQuestion junction table, once.
 * The page and source snippet are read from the document's ParsedContent, not stored.
 * @param {string} questionId - ID of the Question
 * @param {string} documentId - ID of the Document
 * @param {string} owner - Owner of the relationship
 * @param {Map<string, Object>} [existing] - Links already loaded for the document, by question id
 * @returns {Promise<Object|null>} The DocumentQuestion link or null
 */
export async function linkQuestionToDocument(
  questionId,
  documentId,
  owner,
  existing = undefined,
) {
  return linkItemToDocument(getAmplifyClient(), "question", {
    itemId: questionId,
    documentId,
    owner,
    existing,
  });
}

/**
 * Import questions from ParsedContent to Question bank
 * @param {string} parsedContentId - ID of the ParsedContent record
 * @param {string} unitId - ID of the Unit to link questions to
 * @param {number[]} selectedIndices - Array of question indices to import (or null for all)
 * @param {string} owner - Owner of the questions
 * @param {string} identityId - Identity ID for auth
 * @param {Function} onProgress - Optional callback for progress updates (current, total, message)
 * @returns {Promise<Object>} Import results
 */
export async function importQuestionsToUnit(
  parsedContentId,
  unitId,
  selectedIndices = null,
  owner,
  identityId,
  onProgress = null,
) {
  try {
    const client = getAmplifyClient();
    // The setup below is several round trips, so it is reported too: the
    // progress bar is on screen from the click rather than appearing only once
    // the first question is reached.
    const report = (current, total, message) => onProgress?.(current, total, message);
    report(0, 0, "Loading the document…");
    // Fetch the ParsedContent record; a long document is stored as several
    // chunks, merged into one record here
    const parsedContent = await loadMergedParsedContent(client, {
      id: parsedContentId,
    });

    if (!parsedContent) {
      throw new Error(`ParsedContent not found: ${parsedContentId}`);
    }
    await assertParsedContentImportAllowed(client, parsedContent);

    const questionItems = toEntryList(parsedContent.questionsJSON);

    if (questionItems.length === 0) {
      return {
        success: true,
        imported: 0,
        skipped: 0,
        errors: 0,
        message: "No questions to import",
      };
    }

    // Filter items if specific indices are selected, remembering where each sits in the merged list
    const indexedItems = questionItems
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => !selectedIndices || selectedIndices.includes(index));
    const itemsToImport = indexedItems.map(({ item }) => item);
    // The Question each entry became, written back onto the entry afterwards
    const entryReferences = new Map();

    const results = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
      importedQuestions: [],
    };

    const total = itemsToImport.length;

    // Everything the loop needs to look up, fetched once. Each of these
    // replaces one filtered scan per question.
    report(0, total, "Checking the question bank…");
    const documentId = parsedContent.documentID || null;
    const [existingQuestions, unitLinks, documentLinks] = await Promise.all([
      findExistingByField(
        client.models.Question,
        "prompt",
        itemsToImport.map((item) => item.prompt || ""),
      ),
      unitId
        ? listUnitLinkIds(client.models.QuestionUnit, "unitID", unitId, "questionID")
        : Promise.resolve(new Map()),
      documentId
        ? listDocumentLinks(client, documentId, "question").then((links) =>
            indexLinksByItem("question", links))
        : Promise.resolve(undefined),
    ]);

    const createOnce = singleFlight();
    const linkOnce = singleFlight();
    // Claimed synchronously, before any await, so exactly one entry per prompt
    // is counted as created however the workers interleave.
    const claimed = new Set();
    let completed = 0;

    await mapWithConcurrency(itemsToImport, IMPORT_CONCURRENCY, async (item, i) => {
      const promptText = item.prompt || "";
      if (!promptText) {
        results.errors++;
        results.errorDetails.push({
          question: `(index ${i})`,
          error: "Empty prompt",
        });
        report(++completed, total, "Skipping a question with no prompt");
        return;
      }

      try {
        const key = matchKey(promptText);
        const existingQuestion = existingQuestions.get(key) ?? null;

        let questionToLink;
        let created = false;
        if (existingQuestion) {
          questionToLink = existingQuestion;
        } else {
          created = !claimed.has(key);
          claimed.add(key);
          // Whichever entry claims the prompt creates it; the rest wait on that
          // same create and count as duplicates.
          questionToLink = await createOnce(key, () =>
            createQuestion(item, owner, identityId));
        }
        if (created) results.imported++;
        else results.skipped++;

        // Several entries can resolve to one question, so its links are made
        // once rather than once per entry.
        await linkOnce(questionToLink.id, async () => {
          if (unitId && !unitLinks.has(questionToLink.id)) {
            unitLinks.set(
              questionToLink.id,
              await linkQuestionToUnit(questionToLink.id, unitId, owner, unitLinks),
            );
          }
          if (documentId) {
            await linkQuestionToDocument(
              questionToLink.id,
              documentId,
              owner,
              documentLinks,
            );
          }
          return questionToLink.id;
        });

        entryReferences.set(indexedItems[i].index, { questionID: questionToLink.id });

        results.importedQuestions.push({
          questionId: questionToLink.id,
          prompt: questionToLink.prompt,
          isNew: created,
        });
      } catch (error) {
        console.error(
          `Error importing question "${promptText.slice(0, 40)}":`,
          error,
        );
        results.errors++;
        results.errorDetails.push({
          question: promptText.slice(0, 60),
          error: error.message,
        });
      } finally {
        report(++completed, total, `Processing: ${promptText.slice(0, 50)}...`);
      }
    });

    report(total, total, "Saving the question bank…");
    // Mark ParsedContent questions as imported
    if (parsedContent) {
      await client.models.ParsedContent.update({
        id: parsedContent.id,
        importedAt: new Date().toISOString(),
        _version: parsedContent._version,
      });
    }

    // Record on each entry the Question it became, so its document link can find
    // its page and source and the review screen can show it as imported
    if (entryReferences.size > 0) {
      try {
        await patchMergedListEntries(
          client,
          parsedContent,
          "questionsJSON",
          entryReferences,
          (entries) => pickEntries(entries, QUESTION_FIELDS),
        );
      } catch (error) {
        console.error("Could not record imported questions on their entries:", error);
        results.warning = `Imported, but could not mark the entries as imported: ${error.message}`;
      }
    }

    if (onProgress) {
      onProgress(
        total,
        total,
        `Import complete: ${results.imported} new, ${results.skipped} existing, ${results.errors} errors`,
      );
    }

    return results;
  } catch (error) {
    console.error("Error in importQuestionsToUnit:", error);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: 1,
      errorDetails: [{ error: error.message }],
      message: `Import failed: ${error.message}`,
    };
  }
}

/**
 * Update a question item in ParsedContent before import (edit prompt/answer)
 * @param {string} parsedContentId - ID of the ParsedContent record
 * @param {number} itemIndex - Index of the question to update
 * @param {Object} updates - Fields to update {prompt, answer, hint, options}
 * @returns {Promise<boolean>} Success status
 */
export async function updateQuestionItem(parsedContentId, itemIndex, updates) {
  try {
    const client = getAmplifyClient();
    const parsedContent = await loadMergedParsedContent(client, {
      id: parsedContentId,
    });

    if (!parsedContent) {
      throw new Error(`ParsedContent not found: ${parsedContentId}`);
    }

    // Writes only the chunk that holds the question
    await updateMergedListEntry(
      client,
      parsedContent,
      "questionsJSON",
      itemIndex,
      updates,
      (entries) => pickEntries(entries, QUESTION_FIELDS),
    );

    return true;
  } catch (error) {
    console.error("Error updating question item:", error);
    return false;
  }
}
