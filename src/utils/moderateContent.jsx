/**
 * Content Moderation Utility
 *
 * Provides automatic content moderation using OpenAI's Moderation API.
 * All user-generated content is flagged but NOT blocked - instructors
 * handle flagged content according to their school policies.
 *
 * Primary path: Server Action (app/actions/moderate.ts)
 * Fallback: Lambda via GraphQL mutation
 */

import { getAmplifyClient } from "./amplifyClient";
import { moderateContent as moderateServerAction } from "../../app/actions/moderate";
import { notifyModerationFlagged } from "../../app/actions/moderation-notify";

/**
 * Extract text content from various data structures for moderation
 * @param {Object} data - Data to extract text from (Unit.data, Grade.data, etc.)
 * @returns {string} - Combined text content
 */
function extractTextContent(data) {
  const texts = [];

  if (!data) return "";

  // Handle JSON string
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      return data; // Return as-is if not JSON
    }
  }

  // Handle Lexical editor state
  if (data.root && data.root.children) {
    const extractFromNode = (node) => {
      if (node.text) {
        texts.push(node.text);
      }
      if (node.children) {
        node.children.forEach(extractFromNode);
      }
      // Extract from custom block types
      if (node.prompt) texts.push(node.prompt);
      if (node.answer) texts.push(node.answer);
      if (node.phrase) texts.push(node.phrase);
      if (node.definition) texts.push(node.definition);
    };

    data.root.children.forEach(extractFromNode);
  }

  // Handle Grade data (question responses)
  if (typeof data === "object") {
    Object.values(data).forEach((item) => {
      if (item.userAnswer) texts.push(item.userAnswer);
      if (item.response) texts.push(item.response);
    });
  }

  return texts.join(" ").trim();
}

/**
 * Moderate content using OpenAI Moderation API.
 * When modelName + recordId are provided, the backend Lambda persists the
 * moderation result directly to the record's `moderation` field (server-authoritative).
 *
 * @param {string|Object} content - Text or object containing text to moderate
 * @param {Object} [options] - Optional context for server-side persist
 * @param {string} [options.modelName] - Model to update ('Unit'|'Grade'|'Word'|'Question')
 * @param {string} [options.recordId] - Record ID to update
 * @param {string} [options.sectionId] - Section ID for instructor notification
 * @param {string} [options.ownerId] - Owner of the content
 * @returns {Promise<Object>} - Moderation result
 */
export async function moderateContent(content, options = {}) {
  try {
    // Extract text if content is an object
    const textToModerate =
      typeof content === "string" ? content : extractTextContent(content);

    if (
      !textToModerate ||
      textToModerate.length === 0 ||
      textToModerate === "null" ||
      textToModerate === "undefined"
    ) {
      return {
        flagged: false,
        categories: {},
        categoryScores: {},
        model: "omni-moderation-latest",
        error: null,
      };
    }

    // Primary path: Server Action (no Lambda cold start)
    const result = await moderateServerAction({ content: textToModerate });

    // Dispatch notification to instructors/admins if flagged
    if (result.flagged && options.modelName && options.recordId) {
      const flaggedCategories = Object.entries(result.categories || {})
        .filter(([, v]) => v === true)
        .map(([k]) => k);

      notifyModerationFlagged({
        modelName: options.modelName,
        recordId: options.recordId,
        sectionId: options.sectionId,
        ownerId: options.ownerId,
        flaggedCategories,
      }).catch((err) =>
        console.warn("[moderation] Notification dispatch failed:", err),
      );
    }

    return { ...result, error: null };
  } catch (error) {
    console.error("Error moderating content:", error);
    // Return non-flagged result on error - don't block saves
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      model: "omni-moderation-latest",
      error: error.message,
    };
  }
}

/**
 * @deprecated Use moderateContent with { modelName, recordId } options instead.
 * Backend now handles persisting moderation fields directly.
 * Kept for backward compatibility during migration.
 */
export function buildModerationFields(moderationResult) {
  if (!moderationResult) return {};

  return {
    moderationStatus: moderationResult.flagged ? "flagged" : "approved",
    moderationFlags: moderationResult.flagged
      ? JSON.stringify({
          categories: moderationResult.categories,
          categoryScores: moderationResult.categoryScores,
          model: moderationResult.model,
        })
      : null,
    moderationCheckedAt: new Date().toISOString(),
  };
}

/**
 * Moderate content and have the backend persist the result to the record.
 * Replaces the old moderateAndSave which relied on frontend writes.
 *
 * @param {string} modelName - 'Unit'|'Grade'|'Word'|'Question'
 * @param {Object} item - Item with `id` field
 * @param {string|Object} content - Content to moderate
 * @param {Object} [context] - Optional context for notifications
 * @param {string} [context.sectionId] - Section ID for instructor lookup
 * @param {string} [context.ownerId] - Owner of the content
 * @returns {Promise<Object>} - Moderation result from API
 */
export async function moderateAndSave(modelName, item, content, context = {}) {
  const result = await moderateContent(content, {
    modelName,
    recordId: item.id,
  });

  if (result.flagged) {
    console.warn("Content flagged by moderation:", {
      categories: result.categories,
      itemId: item.id,
      modelName,
    });

    // Notify instructors and admins asynchronously (non-blocking)
    const flaggedCategories = Object.entries(result.categories || {})
      .filter(([, v]) => v === true)
      .map(([k]) => k);

    notifyModerationFlagged({
      modelName,
      recordId: item.id,
      sectionId: context.sectionId,
      ownerId: context.ownerId || item.owner,
      flaggedCategories,
    }).catch((err) =>
      console.warn("[moderation] Notification dispatch failed:", err),
    );
  }

  return result;
}

/**
 * Get human-readable moderation status
 * @param {Object} item - Model instance with moderation fields
 * @returns {string} - Status message
 */
export function getModerationStatus(item) {
  if (!item.moderationCheckedAt) {
    return "Not checked";
  }

  if (item.moderationStatus === "flagged") {
    try {
      const flags = JSON.parse(item.moderationFlags || "{}");
      const flaggedCategories = Object.entries(flags.categories || {})
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      if (flaggedCategories.length > 0) {
        return `Flagged: ${flaggedCategories.join(", ")}`;
      }
    } catch (e) {
      console.error("Error parsing moderation flags:", e);
    }
    return "Flagged for review";
  }

  return "Approved";
}

/**
 * Check if content should display a warning
 * @param {Object} item - Model instance with moderation fields
 * @returns {boolean}
 */
export function shouldShowModerationWarning(item) {
  return item.moderationStatus === "flagged";
}
