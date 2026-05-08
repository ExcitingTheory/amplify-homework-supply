"use server";

/**
 * Peer Review Server Actions
 *
 * Wraps the peerReviewAI Lambda mutations server-side to eliminate
 * client-side AppSync GraphQL calls.
 *
 * Flow: Client → Server Action → AppSync → Lambda (peerReviewAI) → OpenAI
 */

import { getServerClient } from "@/utils/amplifyServerClient";

// ============================================================================
// Handle AI Mention
// ============================================================================

export interface AIMentionResult {
  success: boolean;
  response?: string;
  error?: string;
}

/**
 * Process an @AI mention in a peer review chat room.
 * The AI reads chat context and generates a helpful response.
 */
export async function handleAIMention(
  roomId: string,
  message: string,
  chatHistory?: string,
): Promise<AIMentionResult> {
  if (!roomId) {
    return { success: false, error: "Room ID is required" };
  }
  if (!message || message.trim().length === 0) {
    return { success: false, error: "Message is required" };
  }

  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).mutations.handleAIMention({
      roomId,
      message: message.trim(),
      chatHistory: chatHistory || undefined,
    });

    if (errors?.length) {
      const errorMsg = errors[0]?.message || "AI mention failed";
      console.error("[peerReview action] handleAIMention errors:", errors);
      return { success: false, error: errorMsg };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return {
      success: true,
      response: result?.response || result?.message || undefined,
    };
  } catch (err: any) {
    console.error("[peerReview action] handleAIMention error:", err);
    return {
      success: false,
      error: err?.message || "Failed to process AI mention",
    };
  }
}

// ============================================================================
// Generate Review Summary
// ============================================================================

export interface ReviewSummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
}

/**
 * Generate an AI summary of a completed peer review session.
 * Called when the review owner closes the room.
 */
export async function generateReviewSummary(
  roomId: string,
  chatLog: string,
): Promise<ReviewSummaryResult> {
  if (!roomId) {
    return { success: false, error: "Room ID is required" };
  }
  if (!chatLog || chatLog.trim().length === 0) {
    return { success: false, error: "Chat log is required" };
  }

  const client = getServerClient();

  try {
    const { data, errors } = await (
      client as any
    ).mutations.generateReviewSummary({
      roomId,
      chatLog: chatLog.trim(),
    });

    if (errors?.length) {
      const errorMsg = errors[0]?.message || "Summary generation failed";
      console.error(
        "[peerReview action] generateReviewSummary errors:",
        errors,
      );
      return { success: false, error: errorMsg };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return {
      success: true,
      summary: result?.summary || result?.aiReviewSummary || undefined,
    };
  } catch (err: any) {
    console.error("[peerReview action] generateReviewSummary error:", err);
    return {
      success: false,
      error: err?.message || "Failed to generate review summary",
    };
  }
}
