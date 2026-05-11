/**
 * Shared notification utilities for Lambda functions.
 * Creates Notification records via IAM-auth GraphQL.
 */

const CREATE_NOTIFICATION = `mutation CreateNotification($input: CreateNotificationInput!) {
  createNotification(input: $input) {
    id recipientId type category title body linkPath linkLabel referenceId referenceType senderName seen interacted expiresAt metadata _version _lastChangedAt _deleted
  }
}`;

const LIST_NOTIFICATIONS_BY_RECIPIENT = `query ListNotificationsByRecipient($recipientId: String!, $limit: Int, $nextToken: String) {
  listNotificationsByRecipient(recipientId: $recipientId, limit: $limit, nextToken: $nextToken) {
    items { id recipientId type referenceId _version }
    nextToken
  }
}`;

/**
 * Type → Category mapping
 */
const TYPE_TO_CATEGORY: Record<string, string> = {
  ASSIGNMENT_NEW: "ASSIGNMENT",
  ASSIGNMENT_DUE_SOON: "ASSIGNMENT",
  ASSIGNMENT_DUE_NOW: "ASSIGNMENT",
  GRADE_RECEIVED: "ASSIGNMENT",
  PEER_REVIEW_COMPLETE: "COLLABORATION",
  PEER_REVIEW_INVITE: "COLLABORATION",
  PRACTICE_SESSION_INVITE: "COLLABORATION",
  WORKBOOK_SESSION_INVITE: "COLLABORATION",
  HOMEWORK_ROOM_OPENED: "COLLABORATION",
  XP_MILESTONE: "GAMIFICATION",
  LEVEL_UP: "GAMIFICATION",
  BADGE_EARNED: "GAMIFICATION",
  BADGE_LOST: "GAMIFICATION",
  DEBUFF_APPLIED: "GAMIFICATION",
  DEBUFF_EXPIRED: "GAMIFICATION",
  STREAK_MILESTONE: "GAMIFICATION",
  STREAK_AT_RISK: "GAMIFICATION",
  PERSONAL_BEST: "GAMIFICATION",
  CHALLENGE_STARTED: "GUILD",
  CHALLENGE_ENDING_SOON: "GUILD",
  CHALLENGE_COMPLETED: "GUILD",
  GUILD_POST_NEW: "GUILD",
  GUILD_MEMBER_JOINED: "GUILD",
  GUILD_METADATA_UPDATED: "GUILD",
  GUILD_INVITE: "GUILD",
  CHAT_MENTION: "CHAT",
  CHAT_NEW_MESSAGE: "CHAT",
  SYSTEM_ANNOUNCEMENT: "SYSTEM",
  SYSTEM_MAINTENANCE: "SYSTEM",
};

export interface CreateNotificationInput {
  recipientId: string;
  type: string;
  title: string;
  body?: string;
  linkPath?: string;
  linkLabel?: string;
  referenceId?: string;
  referenceType?: string;
  senderName?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a single notification via GraphQL.
 * Automatically resolves `category` from `type`.
 */
export async function createNotification(
  gqlClient: any,
  input: CreateNotificationInput,
): Promise<void> {
  const category = TYPE_TO_CATEGORY[input.type] || "SYSTEM";
  try {
    await gqlClient.graphql({
      query: CREATE_NOTIFICATION,
      variables: {
        input: {
          ...input,
          category,
          seen: false,
          interacted: false,
          metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        },
      },
    });
  } catch (err) {
    console.warn(`[notification] Failed to create ${input.type} for ${input.recipientId}:`, err);
  }
}

/**
 * Create a notification only if one with the same (recipientId, type, referenceId)
 * doesn't already exist. Used for deduplication in scheduled jobs.
 */
export async function createNotificationIfNotExists(
  gqlClient: any,
  input: CreateNotificationInput,
): Promise<boolean> {
  if (!input.referenceId) {
    await createNotification(gqlClient, input);
    return true;
  }

  try {
    // Query recent notifications for this recipient
    const { data } = await gqlClient.graphql({
      query: LIST_NOTIFICATIONS_BY_RECIPIENT,
      variables: { recipientId: input.recipientId, limit: 100 },
    });
    const items = data?.listNotificationsByRecipient?.items || [];
    const exists = items.some(
      (n: any) => n.type === input.type && n.referenceId === input.referenceId,
    );
    if (exists) {
      return false; // Already exists, skip
    }
  } catch (err) {
    console.warn(`[notification] Dedup check failed, creating anyway:`, err);
  }

  await createNotification(gqlClient, input);
  return true;
}

/**
 * Batch create notifications for multiple recipients.
 * Used for system announcements and section-wide notifications.
 */
export async function createNotificationsForRecipients(
  gqlClient: any,
  recipientIds: string[],
  baseInput: Omit<CreateNotificationInput, "recipientId">,
): Promise<{ created: number; failed: number }> {
  let created = 0;
  let failed = 0;

  // Process in batches of 25
  const batchSize = 25;
  for (let i = 0; i < recipientIds.length; i += batchSize) {
    const batch = recipientIds.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((recipientId) =>
        createNotification(gqlClient, { ...baseInput, recipientId }),
      ),
    );
    for (const r of results) {
      if (r.status === "fulfilled") created++;
      else failed++;
    }
  }

  return { created, failed };
}
