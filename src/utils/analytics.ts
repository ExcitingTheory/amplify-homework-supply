"use client";

import {
  record,
  configureAutoTrack,
  identifyUser,
} from "aws-amplify/analytics";

/**
 * Analytics event names — centralized to avoid typos and enable autocomplete
 */
export const AnalyticsEvents = {
  // Navigation
  PAGE_VIEW: "pageView",
  // Workbook engagement
  WORKBOOK_STARTED: "workbookStarted",
  WORKBOOK_COMPLETED: "workbookCompleted",
  ENGAGED_TIME_UPDATE: "engagedTimeUpdate",
  // Grading
  GRADE_SUBMITTED: "gradeSubmitted",
  GRADE_RETRY: "gradeRetry",
  // Content interaction
  AUDIO_PLAYED: "audioPlayed",
  VIDEO_PLAYED: "videoPlayed",
  FILE_DOWNLOADED: "fileDownloaded",
  // AI Chat engagement
  CHAT_MESSAGE_SENT: "chatMessageSent",
  CHAT_RESPONSE_RECEIVED: "chatResponseReceived",
  CHAT_TOOL_USED: "chatToolUsed",
  CHAT_FILE_UPLOADED: "chatFileUploaded",
  CHAT_SESSION_STARTED: "chatSessionStarted",
  CHAT_BLOCK_INSERTED: "chatBlockInserted",
  CHAT_REGENERATED: "chatRegenerated",
  DOCUMENT_ANALYZED: "documentAnalyzed",
  // Social
  PEER_REVIEW_SUBMITTED: "peerReviewSubmitted",
  PRACTICE_DRILL_STARTED: "practiceDrillStarted",
  PRACTICE_DRILL_COMPLETED: "practiceDrillCompleted",
  // Gamification
  BADGE_EARNED: "badgeEarned",
  LEVEL_UP: "levelUp",
  // Squad engagement
  SQUAD_VIEWED: "squadViewed",
  SQUAD_JOINED: "squadJoined",
  SQUAD_LEFT: "squadLeft",
  SQUAD_POST_CREATED: "squadPostCreated",
  SQUAD_POST_DELETED: "squadPostDeleted",
  SQUAD_EDITED: "squadEdited",
  SQUAD_LEADERBOARD_VIEWED: "squadLeaderboardViewed",
  SQUAD_LEADERBOARD_MODE_CHANGED: "squadLeaderboardModeChanged",
  // Section activity
  GUILD_VIEWED: "guildViewed",
  SECTION_WORKBOOK_STARTED: "sectionWorkbookStarted",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * Record a custom analytics event with optional attributes and metrics
 */
export function trackEvent(
  name: AnalyticsEventName | string,
  attributes?: Record<string, string>,
  metrics?: Record<string, number>,
) {
  try {
    record({
      name,
      ...(attributes && { attributes }),
      ...(metrics && { metrics }),
    });
  } catch (err) {
    // Analytics should never crash the app
    console.warn("[Analytics] Failed to record event:", name, err);
  }
}

/**
 * Track a page view with path and optional metadata
 */
export function trackPageView(
  path: string,
  attributes?: Record<string, string>,
) {
  trackEvent(AnalyticsEvents.PAGE_VIEW, {
    path,
    ...attributes,
  });
}

/**
 * Track workbook engagement time update
 */
export function trackEngagedTime(
  unitId: string,
  gradeId: string,
  engagedTimeMs: number,
) {
  trackEvent(
    AnalyticsEvents.ENGAGED_TIME_UPDATE,
    { unitId, gradeId },
    { engagedTimeMs },
  );
}

/**
 * Track workbook completion with accuracy
 */
export function trackWorkbookCompleted(
  unitId: string,
  gradeId: string,
  accuracy: number,
  engagedTimeMs: number,
) {
  trackEvent(
    AnalyticsEvents.WORKBOOK_COMPLETED,
    { unitId, gradeId },
    { accuracy, engagedTimeMs },
  );
}

/**
 * Initialize auto-tracking for sessions and page views.
 * Call once during app initialization.
 */
export function initAnalytics() {
  try {
    configureAutoTrack({
      enable: true,
      type: "session",
    });
    configureAutoTrack({
      enable: true,
      type: "pageView",
      options: {
        appType: "singlePage",
      },
    });
  } catch (err) {
    console.warn("[Analytics] Failed to initialize auto-tracking:", err);
  }
}

// ============================================================================
// User Segmentation — Pinpoint endpoint attributes for filtering/targeting
// ============================================================================

interface UserSegmentationOptions {
  /** Cognito userId / sub */
  userId: string;
  /** User's role (Admin, Instructor, Learner) */
  userRole?: string;
  /** Section IDs the user belongs to */
  sectionIds?: string[];
  /** Section names for human-readable segments */
  sectionNames?: string[];
  /** The user's active/current section ID (if applicable) */
  activeSectionId?: string;
}

/**
 * Set user attributes on the Pinpoint endpoint for segmentation.
 * Call when:
 * - User signs in
 * - User joins/leaves a section
 * - Section membership changes
 *
 * This enables filtering analytics by section, role, etc. in Pinpoint console
 * and the admin dashboard.
 */
export function identifyAnalyticsUser({
  userId,
  userRole,
  sectionIds,
  sectionNames,
  activeSectionId,
}: UserSegmentationOptions) {
  try {
    identifyUser({
      userId,
      userProfile: {
        customProperties: {
          ...(userRole && { userRole: [userRole] }),
          ...(sectionIds && sectionIds.length > 0 && { sectionIds }),
          ...(sectionNames && sectionNames.length > 0 && { sectionNames }),
          ...(activeSectionId && { activeSectionId: [activeSectionId] }),
        },
      },
    });
  } catch (err) {
    console.warn("[Analytics] Failed to identify user:", err);
  }
}

// ============================================================================
// Section-aware event tracking
// ============================================================================

/**
 * Every engagement event should include the sectionId it belongs to.
 * This resolves ambiguity when a user is in multiple sections:
 *
 * Example: User in Section A and Section B
 * - Workbook 1 (assigned in Section A) → events tagged sectionId: "A"
 * - Squad 1 (belongs to Section A) → events tagged sectionId: "A"
 * - Workbook 2 (assigned in Section B) → events tagged sectionId: "B"
 * - Squad 2 (belongs to Section B) → events tagged sectionId: "B"
 *
 * The user's Pinpoint profile has sectionIds: ["A", "B"] for membership queries,
 * but each event carries its own sectionId for per-section analytics.
 */

/**
 * Track a workbook started within the context of a specific section assignment
 */
export function trackSectionWorkbookStarted(
  unitId: string,
  sectionId: string,
  assignmentId?: string,
) {
  trackEvent(AnalyticsEvents.SECTION_WORKBOOK_STARTED, {
    unitId,
    sectionId,
    ...(assignmentId && { assignmentId }),
  });
}

/**
 * Track workbook completion with section context
 */
export function trackSectionWorkbookCompleted(
  unitId: string,
  gradeId: string,
  sectionId: string,
  accuracy: number,
  engagedTimeMs: number,
) {
  trackEvent(
    AnalyticsEvents.WORKBOOK_COMPLETED,
    { unitId, gradeId, sectionId },
    { accuracy, engagedTimeMs },
  );
}

/**
 * Track engaged time with section context
 */
export function trackSectionEngagedTime(
  unitId: string,
  gradeId: string,
  sectionId: string,
  engagedTimeMs: number,
) {
  trackEvent(
    AnalyticsEvents.ENGAGED_TIME_UPDATE,
    { unitId, gradeId, sectionId },
    { engagedTimeMs },
  );
}

/**
 * Track guild/squad/leaderboard page viewed with section context
 */
export function trackGuildViewed(sectionId: string, guildType?: string) {
  trackEvent(AnalyticsEvents.GUILD_VIEWED, {
    sectionId,
    ...(guildType && { guildType }),
  });
}

// ============================================================================
// Chat engagement tracking
// ============================================================================

/**
 * Track when user sends a message in chat
 */
export function trackChatMessageSent(
  chatId: string,
  sectionId?: string,
  messageLength?: number,
) {
  trackEvent(
    AnalyticsEvents.CHAT_MESSAGE_SENT,
    { chatId, ...(sectionId && { sectionId }) },
    messageLength != null ? { messageLength } : undefined,
  );
}

/**
 * Track when AI response is received (measures conversation depth)
 */
export function trackChatResponseReceived(
  chatId: string,
  toolsUsed?: string[],
) {
  trackEvent(AnalyticsEvents.CHAT_RESPONSE_RECEIVED, {
    chatId,
    ...(toolsUsed &&
      toolsUsed.length > 0 && { toolsUsed: toolsUsed.join(",") }),
  });
}

/**
 * Track when a chat tool call executes (search, practice drill, etc.)
 */
export function trackChatToolUsed(
  chatId: string,
  toolName: string,
  sectionId?: string,
) {
  trackEvent(AnalyticsEvents.CHAT_TOOL_USED, {
    chatId,
    toolName,
    ...(sectionId && { sectionId }),
  });
}

/**
 * Track file uploaded to chat for analysis
 */
export function trackChatFileUploaded(chatId: string, fileType: string) {
  trackEvent(AnalyticsEvents.CHAT_FILE_UPLOADED, { chatId, fileType });
}

/**
 * Track new chat session started
 */
export function trackChatSessionStarted(sectionId?: string) {
  trackEvent(AnalyticsEvents.CHAT_SESSION_STARTED, {
    ...(sectionId && { sectionId }),
  });
}

/**
 * Track when user inserts a block from chat into the editor
 */
export function trackChatBlockInserted(chatId: string, blockType: string) {
  trackEvent(AnalyticsEvents.CHAT_BLOCK_INSERTED, { chatId, blockType });
}

/**
 * Track when user regenerates an AI response
 */
export function trackChatRegenerated(chatId: string) {
  trackEvent(AnalyticsEvents.CHAT_REGENERATED, { chatId });
}

// ============================================================================
// Squad engagement tracking
// ============================================================================

/**
 * Track squad page viewed (deeper than a page view — includes squad context)
 */
export function trackSquadViewed(squadId: string, sectionId: string) {
  trackEvent(AnalyticsEvents.SQUAD_VIEWED, { squadId, sectionId });
}

/**
 * Track user joining a squad
 */
export function trackSquadJoined(squadId: string, sectionId: string) {
  trackEvent(AnalyticsEvents.SQUAD_JOINED, { squadId, sectionId });
}

/**
 * Track user leaving a squad
 */
export function trackSquadLeft(squadId: string, sectionId: string) {
  trackEvent(AnalyticsEvents.SQUAD_LEFT, { squadId, sectionId });
}

/**
 * Track squad post creation (social engagement)
 */
export function trackSquadPostCreated(squadId: string, sectionId: string) {
  trackEvent(AnalyticsEvents.SQUAD_POST_CREATED, { squadId, sectionId });
}

/**
 * Track squad post deleted
 */
export function trackSquadPostDeleted(squadId: string, sectionId: string) {
  trackEvent(AnalyticsEvents.SQUAD_POST_DELETED, { squadId, sectionId });
}

/**
 * Track squad settings edited (name, description, coat of arms)
 */
export function trackSquadEdited(squadId: string, field: string) {
  trackEvent(AnalyticsEvents.SQUAD_EDITED, { squadId, field });
}

/**
 * Track leaderboard viewed with mode context
 */
export function trackSquadLeaderboardViewed(sectionId: string) {
  trackEvent(AnalyticsEvents.SQUAD_LEADERBOARD_VIEWED, { sectionId });
}

/**
 * Track leaderboard mode switch (XP / Completion / Squads)
 */
export function trackSquadLeaderboardModeChanged(
  sectionId: string,
  mode: string,
) {
  trackEvent(AnalyticsEvents.SQUAD_LEADERBOARD_MODE_CHANGED, {
    sectionId,
    mode,
  });
}
