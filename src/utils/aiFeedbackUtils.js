/**
 * @fileoverview Utility functions for AI feedback management
 * 
 * Provides helper functions for creating, querying, and analyzing
 * user feedback on AI-generated content.
 */

import { DataStore } from 'aws-amplify/datastore';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Create and save AI feedback to DataStore
 */
export async function createAIFeedback(params) {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub;
  const identityId = session.identityId;

  const feedback = await DataStore.save(
    new AIFeedback({
      owner,
      identityId,
      contentType: AIContentType[params.contentType],
      feedbackType: params.feedbackType === 'POSITIVE' 
        ? AIFeedbackType.POSITIVE 
        : AIFeedbackType.NEGATIVE,
      reasons: params.reasons?.map(r => AIFeedbackReason[r]),
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
    })
  );

  return feedback;
}

/**
 * Get all feedback for a specific content type
 */
export async function getFeedbackByContentType(
  contentType
) {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub;

  const feedback = await DataStore.query(AIFeedback, f =>
    f.and(f => [
      f.owner.eq(owner),
      f.contentType.eq(AIContentType[contentType])
    ])
  );

  return feedback;
}

/**
 * Get feedback for a specific unit
 */
export async function getFeedbackByUnit(unitId) {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub;

  const feedback = await DataStore.query(AIFeedback, f =>
    f.and(f => [
      f.owner.eq(owner),
      f.unitID.eq(unitId)
    ])
  );

  return feedback;
}

/**
 * Get feedback for a specific message
 */
export async function getFeedbackByMessage(messageId) {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub;

  const feedback = await DataStore.query(AIFeedback, f =>
    f.and(f => [
      f.owner.eq(owner),
      f.messageId.eq(messageId)
    ])
  );

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
  contentType?: keyof typeof AIContentType,
  unitId?: string
): Promise<FeedbackStats> {
  const session = await fetchAuthSession();
  const owner = session.tokens?.idToken?.payload.sub as string;

  // Build query based on params
  let feedback: AIFeedback[];
  
  if (contentType && unitId) {
    feedback = await DataStore.query(AIFeedback, f =>
      f.and(f => [
        f.owner.eq(owner),
        f.contentType.eq(AIContentType[contentType]),
        f.unitID.eq(unitId)
      ])
    );
  } else if (contentType) {
    feedback = await DataStore.query(AIFeedback, f =>
      f.and(f => [
        f.owner.eq(owner),
        f.contentType.eq(AIContentType[contentType])
      ])
    );
  } else if (unitId) {
    feedback = await DataStore.query(AIFeedback, f =>
      f.and(f => [
        f.owner.eq(owner),
        f.unitID.eq(unitId)
      ])
    );
  } else {
    feedback = await DataStore.query(AIFeedback, f => f.owner.eq(owner));
  }

  const total = feedback.length;
  const positive = feedback.filter(f => f.feedbackType === AIFeedbackType.POSITIVE).length;
  const negative = feedback.filter(f => f.feedbackType === AIFeedbackType.NEGATIVE).length;

  // Count reasons
  const reasonCounts: Record<string, number> = {};
  feedback.forEach(f => {
    if (f.reasons) {
      f.reasons.forEach(reason => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
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
  const feedback = await DataStore.query(AIFeedback, feedbackId);
  if (feedback) {
    await DataStore.delete(feedback);
  }
}

/**
 * Quick helper to submit positive feedback
 */
export async function submitPositiveFeedback(
  contentType: keyof typeof AIContentType,
  generatedContent: string,
  metadata?: CreateFeedbackParams
): Promise<AIFeedback> {
  return createAIFeedback({
    contentType,
    feedbackType: 'POSITIVE',
    generatedContent,
    ...metadata,
  });
}

/**
 * Quick helper to submit negative feedback
 */
export async function submitNegativeFeedback(
  contentType: keyof typeof AIContentType,
  generatedContent: string,
  reasons: Array<keyof typeof AIFeedbackReason>,
  comment?: string,
  metadata?: Omit<CreateFeedbackParams, 'feedbackType' | 'contentType' | 'generatedContent' | 'reasons' | 'comment'>
): Promise<AIFeedback> {
  return createAIFeedback({
    contentType,
    feedbackType: 'NEGATIVE',
    generatedContent,
    reasons,
    comment,
    ...metadata,
  });
}
