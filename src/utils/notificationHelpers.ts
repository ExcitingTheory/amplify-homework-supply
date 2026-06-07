/**
 * Client-side notification creation helpers.
 *
 * These functions create Notification records directly from the frontend
 * for events that don't go through a Lambda (squad posts, collaboration invites, etc.).
 * Auth rules enforce that only the recipientId owner or Admins can write.
 */

import { getAmplifyClient } from "./amplifyClient";

interface NotificationInput {
  recipientId: string;
  type: keyof typeof TYPE_TO_CATEGORY;
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

const TYPE_TO_CATEGORY = {
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
  CHALLENGE_STARTED: "SQUAD",
  CHALLENGE_ENDING_SOON: "SQUAD",
  CHALLENGE_COMPLETED: "SQUAD",
  SQUAD_POST_NEW: "SQUAD",
  SQUAD_MEMBER_JOINED: "SQUAD",
  SQUAD_METADATA_UPDATED: "SQUAD",
  SQUAD_INVITE: "SQUAD",
  GUILD_POST_NEW: "GUILD",
  GUILD_MEMBER_JOINED: "GUILD",
  CHAT_MENTION: "CHAT",
  CHAT_NEW_MESSAGE: "CHAT",
  MODERATION_FLAGGED: "MODERATION",
  SYSTEM_ANNOUNCEMENT: "SYSTEM",
  SYSTEM_MAINTENANCE: "SYSTEM",
} as const;

type NotificationCategory =
  (typeof TYPE_TO_CATEGORY)[keyof typeof TYPE_TO_CATEGORY];

/**
 * Create a notification for a single recipient.
 * Uses the Amplify Data Client with user auth.
 */
export async function sendNotification(
  input: NotificationInput,
): Promise<void> {
  const client = getAmplifyClient();
  const category: NotificationCategory =
    TYPE_TO_CATEGORY[input.type] || "SYSTEM";
  try {
    await client.models.Notification.create({
      recipientId: input.recipientId,
      type: input.type,
      category,
      title: input.title,
      body: input.body,
      linkPath: input.linkPath,
      linkLabel: input.linkLabel,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      senderName: input.senderName,
      seen: false,
      interacted: false,
      expiresAt: input.expiresAt,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    });
  } catch (err) {
    console.warn(
      `[notification] Failed to send ${input.type} to ${input.recipientId}:`,
      err,
    );
  }
}

/**
 * Send notifications to multiple recipients.
 */
export async function sendNotificationToMany(
  recipientIds: string[],
  baseInput: Omit<NotificationInput, "recipientId">,
): Promise<void> {
  await Promise.allSettled(
    recipientIds.map((recipientId) =>
      sendNotification({ ...baseInput, recipientId }),
    ),
  );
}

/**
 * Pre-built notification senders for common events.
 */
export const notifications = {
  squadPostNew: (
    recipientIds: string[],
    senderName: string,
    squadId: string,
    squadName: string,
  ) =>
    sendNotificationToMany(recipientIds, {
      type: "SQUAD_POST_NEW",
      title: `New post in ${squadName}`,
      body: `${senderName} posted in your squad.`,
      linkPath: `/squads/${squadId}`,
      linkLabel: "View Post",
      referenceId: squadId,
      referenceType: "Squad",
      senderName,
    }),

  squadMemberJoined: (
    recipientIds: string[],
    memberName: string,
    squadId: string,
    squadName: string,
  ) =>
    sendNotificationToMany(recipientIds, {
      type: "SQUAD_MEMBER_JOINED",
      title: `${memberName} joined ${squadName}`,
      body: `A new member has joined your squad.`,
      linkPath: `/squads/${squadId}`,
      linkLabel: "View Squad",
      referenceId: squadId,
      referenceType: "Squad",
      senderName: memberName,
    }),

  practiceSessionInvite: (
    recipientId: string,
    senderName: string,
    roomCode: string,
    unitName?: string,
  ) =>
    sendNotification({
      recipientId,
      type: "PRACTICE_SESSION_INVITE",
      title: "Practice Session Invitation",
      body: `${senderName} invited you to practice${unitName ? ` "${unitName}"` : ""}. Code: ${roomCode}`,
      referenceId: roomCode,
      referenceType: "PracticeSession",
      senderName,
      linkLabel: "Join Practice",
      metadata: { roomCode },
    }),

  workbookSessionInvite: (
    recipientId: string,
    senderName: string,
    unitId: string,
    unitName?: string,
  ) =>
    sendNotification({
      recipientId,
      type: "WORKBOOK_SESSION_INVITE",
      title: "Workbook Collaboration Invitation",
      body: `${senderName} invited you to collaborate${unitName ? ` on "${unitName}"` : ""}.`,
      linkPath: `/workbook/${unitId}`,
      linkLabel: "Join Workbook",
      referenceId: unitId,
      referenceType: "Unit",
      senderName,
    }),

  challengeStarted: (
    recipientIds: string[],
    challengeName: string,
    challengeId: string,
    squadId: string,
  ) =>
    sendNotificationToMany(recipientIds, {
      type: "CHALLENGE_STARTED",
      title: `Challenge Started: ${challengeName}`,
      body: "A new squad challenge has begun! Contribute XP to help your squad win.",
      linkPath: `/squads/${squadId}`,
      linkLabel: "View Challenge",
      referenceId: challengeId,
      referenceType: "GroupChallenge",
      senderName: "System",
    }),

  challengeCompleted: (
    recipientIds: string[],
    challengeName: string,
    challengeId: string,
    squadId: string,
  ) =>
    sendNotificationToMany(recipientIds, {
      type: "CHALLENGE_COMPLETED",
      title: `Challenge Complete: ${challengeName}`,
      body: "Your squad challenge has been completed! Check the results.",
      linkPath: `/squads/${squadId}`,
      linkLabel: "View Results",
      referenceId: challengeId,
      referenceType: "GroupChallenge",
      senderName: "System",
    }),

  guildPostNew: (
    recipientIds: string[],
    senderName: string,
    guildId: string,
    guildName: string,
  ) =>
    sendNotificationToMany(recipientIds, {
      type: "GUILD_POST_NEW",
      category: "GUILD",
      title: `New post in ${guildName}`,
      body: `${senderName} posted in your guild.`,
      linkPath: `/guilds/${guildId}`,
      linkLabel: "View Post",
      referenceId: guildId,
      referenceType: "Guild",
      senderName,
    }),

  guildMemberJoined: (
    recipientIds: string[],
    memberName: string,
    guildId: string,
    guildName: string,
  ) =>
    sendNotificationToMany(recipientIds, {
      type: "GUILD_MEMBER_JOINED",
      category: "GUILD",
      title: `${memberName} joined ${guildName}`,
      body: `A new member has joined your guild.`,
      linkPath: `/guilds/${guildId}`,
      linkLabel: "View Guild",
      referenceId: guildId,
      referenceType: "Guild",
      senderName: memberName,
    }),

  moderationFlagged: (
    recipientIds: string[],
    modelName: string,
    recordId: string,
    flaggedCategories: string[],
  ) =>
    sendNotificationToMany(recipientIds, {
      type: "MODERATION_FLAGGED",
      title: `Content flagged: ${modelName}`,
      body: `A ${modelName.toLowerCase()} was flagged for: ${flaggedCategories.join(", ")}`,
      linkPath:
        modelName === "Grade"
          ? `/instructor/grade/${recordId}`
          : modelName === "Unit"
            ? `/units/${recordId}`
            : `/admin/moderation`,
      linkLabel: "Review Content",
      referenceId: recordId,
      referenceType: modelName,
      senderName: "Moderation System",
      metadata: { modelName, flaggedCategories },
    }),
};
