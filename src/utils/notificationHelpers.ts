/**
 * Client-side notification creation helpers.
 *
 * These functions create Notification records directly from the frontend
 * for events that don't go through a Lambda (guild posts, collaboration invites, etc.).
 * Auth rules enforce that only the recipientId owner or Admins can write.
 */

import { getAmplifyClient } from "./amplifyClient";

interface NotificationInput {
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

/**
 * Create a notification for a single recipient.
 * Uses the Amplify Data Client with user auth.
 */
export async function sendNotification(input: NotificationInput): Promise<void> {
  const client = getAmplifyClient();
  const category = TYPE_TO_CATEGORY[input.type] || "SYSTEM";
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
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[notification] Failed to send ${input.type} to ${input.recipientId}:`, err);
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
  guildPostNew: (recipientIds: string[], senderName: string, guildId: string, guildName: string) =>
    sendNotificationToMany(recipientIds, {
      type: "GUILD_POST_NEW",
      title: `New post in ${guildName}`,
      body: `${senderName} posted in your guild.`,
      linkPath: `/guilds/${guildId}`,
      linkLabel: "View Post",
      referenceId: guildId,
      referenceType: "Guild",
      senderName,
    }),

  guildMemberJoined: (recipientIds: string[], memberName: string, guildId: string, guildName: string) =>
    sendNotificationToMany(recipientIds, {
      type: "GUILD_MEMBER_JOINED",
      title: `${memberName} joined ${guildName}`,
      body: `A new member has joined your guild.`,
      linkPath: `/guilds/${guildId}`,
      linkLabel: "View Guild",
      referenceId: guildId,
      referenceType: "Guild",
      senderName: memberName,
    }),

  practiceSessionInvite: (recipientId: string, senderName: string, roomCode: string, unitName?: string) =>
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

  workbookSessionInvite: (recipientId: string, senderName: string, unitId: string, unitName?: string) =>
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

  challengeStarted: (recipientIds: string[], challengeName: string, challengeId: string, guildId: string) =>
    sendNotificationToMany(recipientIds, {
      type: "CHALLENGE_STARTED",
      title: `Challenge Started: ${challengeName}`,
      body: "A new guild challenge has begun! Contribute XP to help your guild win.",
      linkPath: `/guilds/${guildId}`,
      linkLabel: "View Challenge",
      referenceId: challengeId,
      referenceType: "GroupChallenge",
      senderName: "System",
    }),

  challengeCompleted: (recipientIds: string[], challengeName: string, challengeId: string, guildId: string) =>
    sendNotificationToMany(recipientIds, {
      type: "CHALLENGE_COMPLETED",
      title: `Challenge Complete: ${challengeName}`,
      body: "Your guild challenge has been completed! Check the results.",
      linkPath: `/guilds/${guildId}`,
      linkLabel: "View Results",
      referenceId: challengeId,
      referenceType: "GroupChallenge",
      senderName: "System",
    }),
};
