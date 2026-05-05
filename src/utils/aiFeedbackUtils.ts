/**
 * @fileoverview Utility functions for AI feedback management
 *
 * Provides helper functions for creating, querying, and analyzing
 * user feedback on AI-generated content.
 */

import { getAmplifyClient } from "./amplifyClient";
import { fetchAuthSession } from "aws-amplify/auth";

const AiFeedbackType = {
  POSITIVE: "POSITIVE",
  NEGATIVE: "NEGATIVE",
} as const;

const AiFeedbackReason = {
  INCORRECT: "INCORRECT",
  INCOMPLETE: "INCOMPLETE",
  INAPPROPRIATE: "INAPPROPRIATE",
  NOT_HELPFUL: "NOT_HELPFUL",
  IRRELEVANT: "IRRELEVANT",
  POOR_QUALITY: "POOR_QUALITY",
  OTHER: "OTHER",
} as const;

const AiContentType = {
  CHAT_MESSAGE: "CHAT_MESSAGE",
  CONTENT_COMPLETION: "CONTENT_COMPLETION",
  AUDIO_GENERATION: "AUDIO_GENERATION",
  IMAGE_GENERATION: "IMAGE_GENERATION",
  DOCUMENT_ANALYSIS: "DOCUMENT_ANALYSIS",
  VOCABULARY_EXTRACTION: "VOCABULARY_EXTRACTION",
  TRANSCRIPTION: "TRANSCRIPTION",
  IMAGE_DESCRIPTION: "IMAGE_DESCRIPTION",
  GRADING_FEEDBACK: "GRADING_FEEDBACK",
  BLOCK_SUGGESTION: "BLOCK_SUGGESTION",
} as const;

export interface AIFeedback {
  id: string;
  contentType: string;
  feedbackType: string;
  generatedContent: string;
  model?: string;
  prompt?: string;
  reasons?: string[];
  comment?: string;
  messageId?: string;
  unitId?: string;
  gradeId?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

interface CreateFeedbackParams {
  contentType: keyof typeof AiContentType;
  feedbackType: "POSITIVE" | "NEGATIVE";
  generatedContent: string;
  model?: string;
  prompt?: string;
  reasons?: Array<keyof typeof AiFeedbackReason>;
  comment?: string;
  messageId?: string;
  unitId?: string;
  gradeId?: string;
  documentId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Create and save AI feedback
 */
export async function createAIFeedback(
  params: CreateFeedbackParams,
): Promise<any> {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub as string;
  const identityId = session.identityId;

  const client = getAmplifyClient();
  const { data: savedFeedback } = await client.models.AIFeedback.create({
    owner,
    identityId,
    contentType: AiContentType[params.contentType],
    feedbackType:
      params.feedbackType === "POSITIVE"
        ? AiFeedbackType.POSITIVE
        : AiFeedbackType.NEGATIVE,
    reasons: params.reasons?.[0]
      ? AiFeedbackReason[params.reasons[0]]
      : undefined,
    comment: params.comment,
    model: params.model,
    prompt: params.prompt,
    generatedContent: params.generatedContent,
    unitID: params.unitId,
    gradeID: params.gradeId,
    documentID: params.documentId,
    messageId: params.messageId,
    sessionId: params.sessionId,
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
  });

  return savedFeedback;
}

/**
 * Get all feedback for a specific content type
 */
export async function getFeedbackByContentType(
  contentType: keyof typeof AiContentType,
): Promise<any[]> {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub as string;

  const client = getAmplifyClient();
  const { data: feedback } = await client.models.AIFeedback.list({
    filter: {
      and: [
        { owner: { eq: owner } },
        { contentType: { eq: AiContentType[contentType] } },
      ],
    },
  });

  return feedback;
}

/**
 * Get feedback for a specific unit
 */
export async function getFeedbackByUnit(unitId: string): Promise<any[]> {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub as string;

  const client = getAmplifyClient();
  const { data: feedback } = await client.models.AIFeedback.list({
    filter: {
      and: [{ owner: { eq: owner } }, { unitID: { eq: unitId } }],
    },
  });

  return feedback;
}

/**
 * Get feedback for a specific message
 */
export async function getFeedbackByMessage(messageId: string): Promise<any[]> {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub as string;

  const client = getAmplifyClient();
  const { data: feedback } = await client.models.AIFeedback.list({
    filter: {
      and: [{ owner: { eq: owner } }, { messageId: { eq: messageId } }],
    },
  });

  return feedback;
}

/**
 * Calculate feedback statistics for a content type
 */
export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  positiveRate: number;
  negativeRate: number;
  commonReasons: Array<{ reason: string; count: number }>;
}

export async function getFeedbackStats(
  contentType?: keyof typeof AiContentType,
  unitId?: string,
): Promise<FeedbackStats> {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub as string;

  // Build query based on params
  const client = getAmplifyClient();
  let feedback: any[];

  if (contentType && unitId) {
    const { data } = await client.models.AIFeedback.list({
      filter: {
        and: [
          { owner: { eq: owner } },
          { contentType: { eq: AiContentType[contentType] } },
          { unitID: { eq: unitId } },
        ],
      },
    });
    feedback = data;
  } else if (contentType) {
    const { data } = await client.models.AIFeedback.list({
      filter: {
        and: [
          { owner: { eq: owner } },
          { contentType: { eq: AiContentType[contentType] } },
        ],
      },
    });
    feedback = data;
  } else if (unitId) {
    const { data } = await client.models.AIFeedback.list({
      filter: {
        and: [{ owner: { eq: owner } }, { unitID: { eq: unitId } }],
      },
    });
    feedback = data;
  } else {
    const { data } = await client.models.AIFeedback.list({
      filter: { owner: { eq: owner } },
    });
    feedback = data;
  }

  const total = feedback.length;
  const positive = feedback.filter(
    (f) => f.feedbackType === AiFeedbackType.POSITIVE,
  ).length;
  const negative = feedback.filter(
    (f) => f.feedbackType === AiFeedbackType.NEGATIVE,
  ).length;

  // Count reasons
  const reasonCounts: Record<string, number> = {};
  feedback.forEach((f) => {
    if (f.reasons) {
      const reason = f.reasons;
      if (reason) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    }
  });

  const commonReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    positive,
    negative,
    positiveRate: total > 0 ? (positive / total) * 100 : 0,
    negativeRate: total > 0 ? (negative / total) * 100 : 0,
    commonReasons,
  };
}

/**
 * Delete feedback by ID
 */
export async function deleteFeedback(feedbackId: string): Promise<void> {
  const client = getAmplifyClient();
  const { data: feedback } = await client.models.AIFeedback.get({
    id: feedbackId,
  });
  if (feedback) {
    await client.models.AIFeedback.delete({ id: feedbackId });
  }
}

/**
 * Quick helper to submit positive feedback
 */
export async function submitPositiveFeedback(
  contentType: keyof typeof AiContentType,
  generatedContent: string,
  metadata?: CreateFeedbackParams,
): Promise<AIFeedback> {
  return createAIFeedback({
    contentType,
    feedbackType: "POSITIVE",
    generatedContent,
    ...metadata,
  });
}

/**
 * Quick helper to submit negative feedback
 */
export async function submitNegativeFeedback(
  contentType: keyof typeof AiContentType,
  generatedContent: string,
  reasons: Array<keyof typeof AiFeedbackReason>,
  comment?: string,
  metadata?: Omit<
    CreateFeedbackParams,
    "feedbackType" | "contentType" | "generatedContent" | "reasons" | "comment"
  >,
): Promise<AIFeedback> {
  return createAIFeedback({
    contentType,
    feedbackType: "NEGATIVE",
    generatedContent,
    reasons,
    comment,
    ...metadata,
  });
}
