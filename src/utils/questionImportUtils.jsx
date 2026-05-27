/**
 * @fileoverview Utilities for importing questions from ParsedContent to Question bank
 * Handles duplicate detection, Question creation, and Unit/Document linking
 */

import { getAmplifyClient } from "./amplifyClient";

/**
 * Check if a question already exists in the bank (by prompt similarity)
 * @param {string} prompt - The question prompt to check
 * @param {string} owner - Owner of the question
 * @returns {Promise<Object|null>} Existing question or null
 */
export async function findExistingQuestion(prompt, owner) {
  const client = getAmplifyClient();
  const normalizedPrompt = prompt.trim().toLowerCase();

  // Search by prompt text (exact match)
  const { data: existingQuestions } = await client.models.Question.list({
    filter: { prompt: { eq: prompt.trim() } },
  });

  const exactMatch = existingQuestions?.find(
    (q) => q.prompt?.trim().toLowerCase() === normalizedPrompt,
  );

  return exactMatch || null;
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
  const {
    prompt,
    question,
    answer,
    expectedAnswer,
    hint,
    options,
    questionType,
    type,
    difficulty,
  } = questionItem;

  // Normalize field names (ParsedContent uses different names than Question model)
  const questionPrompt = prompt || question || "";
  const questionAnswer = answer || expectedAnswer || "";
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
 * @returns {Promise<Object>} Created QuestionUnit relationship
 */
export async function linkQuestionToUnit(questionId, unitId, owner) {
  const client = getAmplifyClient();
  // Check if relationship already exists
  const { data: existing } = await client.models.QuestionUnit.list({
    filter: {
      and: [{ questionID: { eq: questionId } }, { unitID: { eq: unitId } }],
    },
  });

  if (existing && existing.length > 0) {
    console.log(`Question ${questionId} already linked to Unit ${unitId}`);
    return existing[0];
  }

  const { data: questionUnit } = await client.models.QuestionUnit.create({
    questionID: questionId,
    unitID: unitId,
    owner: owner,
  });
  return questionUnit;
}

/**
 * Link a Question to a Document via DocumentQuestion junction table
 * @param {string} questionId - ID of the Question
 * @param {string} documentId - ID of the Document
 * @param {string} owner - Owner of the relationship
 * @returns {Promise<Object|null>} Created DocumentQuestion relationship or null
 */
export async function linkQuestionToDocument(questionId, documentId, owner) {
  if (!documentId) return null;

  const client = getAmplifyClient();
  const { data: existing } = await client.models.DocumentQuestion.list({
    filter: {
      and: [
        { questionID: { eq: questionId } },
        { documentID: { eq: documentId } },
      ],
    },
  });

  if (existing && existing.length > 0) {
    return existing[0];
  }

  const { data: docQuestion } = await client.models.DocumentQuestion.create({
    questionID: questionId,
    documentID: documentId,
    owner: owner,
  });
  return docQuestion;
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
    // Fetch the ParsedContent record
    const { data: parsedContent } = await client.models.ParsedContent.get({
      id: parsedContentId,
    });

    if (!parsedContent) {
      throw new Error(`ParsedContent not found: ${parsedContentId}`);
    }

    // Parse the questionsJSON
    const questionItems = parsedContent.questionsJSON
      ? typeof parsedContent.questionsJSON === "string"
        ? JSON.parse(parsedContent.questionsJSON)
        : parsedContent.questionsJSON
      : [];

    if (questionItems.length === 0) {
      return {
        success: true,
        imported: 0,
        skipped: 0,
        errors: 0,
        message: "No questions to import",
      };
    }

    // Filter items if specific indices are selected
    const itemsToImport = selectedIndices
      ? questionItems.filter((_, index) => selectedIndices.includes(index))
      : questionItems;

    const results = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
      importedQuestions: [],
    };

    const total = itemsToImport.length;

    // Get associated documentID if available
    const documentId = parsedContent.documentID || null;

    // Process each question item
    for (let i = 0; i < itemsToImport.length; i++) {
      const item = itemsToImport[i];
      const promptText = item.prompt || item.question || "";

      if (onProgress) {
        onProgress(i + 1, total, `Processing: ${promptText.slice(0, 50)}...`);
      }

      if (!promptText) {
        results.errors++;
        results.errorDetails.push({
          question: `(index ${i})`,
          error: "Empty prompt",
        });
        continue;
      }

      try {
        // Check for existing question
        const existingQuestion = await findExistingQuestion(promptText, owner);

        let questionToLink;

        if (existingQuestion) {
          // Question already exists, just link to unit
          questionToLink = existingQuestion;
          console.log(`Question already exists: ${promptText.slice(0, 40)}...`);
          results.skipped++;
        } else {
          // Create new question
          questionToLink = await createQuestion(item, owner, identityId);
          console.log(`Created new question: ${promptText.slice(0, 40)}...`);
          results.imported++;
        }

        // Link question to unit
        if (unitId && questionToLink) {
          await linkQuestionToUnit(questionToLink.id, unitId, owner);
        }

        // Link question to source document
        if (documentId && questionToLink) {
          await linkQuestionToDocument(questionToLink.id, documentId, owner);
        }

        results.importedQuestions.push({
          questionId: questionToLink.id,
          prompt: questionToLink.prompt,
          isNew: !existingQuestion,
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
      }
    }

    // Mark ParsedContent questions as imported
    if (parsedContent) {
      await client.models.ParsedContent.update({
        id: parsedContent.id,
        importedAt: new Date().toISOString(),
        _version: parsedContent._version,
      });
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
    const { data: parsedContent } = await client.models.ParsedContent.get({
      id: parsedContentId,
    });

    if (!parsedContent) {
      throw new Error(`ParsedContent not found: ${parsedContentId}`);
    }

    const questionItems = parsedContent.questionsJSON
      ? typeof parsedContent.questionsJSON === "string"
        ? JSON.parse(parsedContent.questionsJSON)
        : parsedContent.questionsJSON
      : [];

    if (itemIndex < 0 || itemIndex >= questionItems.length) {
      throw new Error(`Invalid item index: ${itemIndex}`);
    }

    // Update the item
    questionItems[itemIndex] = {
      ...questionItems[itemIndex],
      ...updates,
    };

    // Save updated ParsedContent
    await client.models.ParsedContent.update({
      id: parsedContent.id,
      questionsJSON: JSON.stringify(questionItems),
      _version: parsedContent._version,
    });

    return true;
  } catch (error) {
    console.error("Error updating question item:", error);
    return false;
  }
}
