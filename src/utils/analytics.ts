"use client";

// ============================================================================
// Analytics SDK — Kinesis-backed event buffering with sendBeacon flush
// Replaces AWS Pinpoint with a lightweight client that buffers events and
// flushes to /api/analytics via navigator.sendBeacon.
// ============================================================================

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

// ============================================================================
// Event buffering & flush infrastructure
// ============================================================================

interface AnalyticsEvent {
  name: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  userRole?: "Admin" | "Instructor" | "Learner";
  sectionId?: string;
  squadId?: string;
  unitId?: string;
  path?: string;
  attributes?: Record<string, string>;
  metrics?: Record<string, number>;
}

const buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let currentSessionId: string | null = null;
let currentUserId: string | undefined;
let currentUserRole: "Admin" | "Instructor" | "Learner" | undefined;

function getSessionId(): string {
  if (currentSessionId) return currentSessionId;
  // Generate a session ID per browser tab
  currentSessionId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return currentSessionId;
}

/**
 * Flush buffered events to the analytics API endpoint.
 * Uses sendBeacon for reliability on page unload.
 */
export function flush() {
  if (buffer.length === 0) return;
  const events = buffer.splice(0, buffer.length);
  try {
    const payload = JSON.stringify(events);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", payload);
    } else {
      // Fallback for environments without sendBeacon (SSR guard)
      fetch("/api/analytics", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {
        // Silently fail — analytics should never block UX
      });
    }
  } catch {
    // Analytics should never crash the app
  }
}

// Auto-flush setup (client-side only)
if (typeof document !== "undefined") {
  // Flush on page hide (reliable even on tab close)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  // Flush every 30s
  flushTimer = setInterval(flush, 30_000);
}

// ============================================================================
// Core tracking function
// ============================================================================

/**
 * Record a custom analytics event with optional attributes and metrics.
 * Events are buffered and flushed in batches to /api/analytics.
 */
export function trackEvent(
  name: AnalyticsEventName | string,
  attributes?: Record<string, string>,
  metrics?: Record<string, number>,
) {
  try {
    buffer.push({
      name,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      userId: currentUserId,
      userRole: currentUserRole,
      path:
        typeof window !== "undefined" ? window.location.pathname : undefined,
      attributes,
      metrics,
    });
    // Auto-flush when buffer reaches 20 events
    if (buffer.length >= 20) flush();
  } catch {
    // Analytics should never crash the app
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
 * Initialize analytics. Call once during app initialization.
 * Sets up the user identity for event attribution.
 */
export function initAnalytics(options?: {
  userId?: string;
  userRole?: "Admin" | "Instructor" | "Learner";
}) {
  if (options?.userId) currentUserId = options.userId;
  if (options?.userRole) currentUserRole = options.userRole;
}

/**
 * Update user identity after sign-in or role change.
 * Replaces the old Pinpoint identifyUser pattern — user attributes
 * are now sent as event metadata with every event.
 */
export function identifyAnalyticsUser(options: {
  userId: string;
  userRole?: string;
  sectionIds?: string[];
  sectionNames?: string[];
  activeSectionId?: string;
}) {
  currentUserId = options.userId;
  if (options.userRole) {
    currentUserRole = options.userRole as "Admin" | "Instructor" | "Learner";
  }
}

// ============================================================================
// Section-aware event tracking
// ============================================================================

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
