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

// ============================================================================
// Create Peer Review Room (Instructor Assignment)
// ============================================================================

export interface CreateRoomResult {
  success: boolean;
  roomId?: string;
  error?: string;
}

/**
 * Create a HomeworkRoom for a specific grade and invite reviewer(s).
 * Called by the instructor to manually assign peer review.
 */
export async function createPeerReviewRoom(
  gradeId: string,
  reviewerIds: string[],
  sectionId: string,
  ownerId: string,
): Promise<CreateRoomResult> {
  if (!gradeId || !sectionId || !ownerId) {
    return {
      success: false,
      error: "gradeId, sectionId, and ownerId are required",
    };
  }

  const client = getServerClient();

  try {
    // Generate a short join code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const peerGroup = `review-room-${Date.now()}-peers`;

    const { data: room, errors } = await (
      client as any
    ).models.HomeworkRoom.create({
      gradeId,
      ownerId,
      sectionID: sectionId,
      status: "OPEN",
      code,
      invitedUserIds: reviewerIds,
      peerGroup,
    });

    if (errors?.length) {
      console.error("[peerReview action] createPeerReviewRoom errors:", errors);
      return {
        success: false,
        error: errors[0]?.message || "Failed to create room",
      };
    }

    return { success: true, roomId: room?.id };
  } catch (err: any) {
    console.error("[peerReview action] createPeerReviewRoom error:", err);
    return {
      success: false,
      error: err?.message || "Failed to create peer review room",
    };
  }
}

// ============================================================================
// Random-Assign Peer Review
// ============================================================================

export interface RandomAssignResult {
  success: boolean;
  created: number;
  pairs: Array<{ gradeOwner: string; reviewer: string; roomId: string }>;
  error?: string;
}

/**
 * Randomly pair students who have completed grades for a unit but have no open review room.
 * Creates HomeworkRooms for each pairing.
 */
export async function randomAssignPeerReview(
  sectionId: string,
  unitId: string,
): Promise<RandomAssignResult> {
  if (!sectionId || !unitId) {
    return {
      success: false,
      created: 0,
      pairs: [],
      error: "sectionId and unitId are required",
    };
  }

  const client = getServerClient();

  try {
    // Fetch all completed grades for this section+unit
    const { data: gradesData, errors: gradesErrors } = await (
      client as any
    ).models.Grade.list({
      filter: {
        sectionID: { eq: sectionId },
        unitID: { eq: unitId },
        complete: { eq: true },
      },
    });

    if (gradesErrors?.length) {
      return {
        success: false,
        created: 0,
        pairs: [],
        error: gradesErrors[0]?.message,
      };
    }

    const grades = (gradesData ?? []).filter(
      (g: any) => g != null && g.id != null,
    );
    if (grades.length < 2) {
      return {
        success: false,
        created: 0,
        pairs: [],
        error: "Not enough completed grades to pair",
      };
    }

    // Fetch existing open rooms for this section
    const { data: roomsData } = await (client as any).models.HomeworkRoom.list({
      filter: {
        sectionID: { eq: sectionId },
        status: { ne: "REVIEW_COMPLETE" },
      },
    });
    const existingRooms: any[] = (roomsData ?? []).filter(
      (r: any) => r != null,
    );
    const assignedGradeIds = new Set(existingRooms.map((r: any) => r.gradeId));

    // Filter to grades without rooms
    const unassignedGrades = grades.filter(
      (g: any) => !assignedGradeIds.has(g.id),
    );
    if (unassignedGrades.length < 2) {
      return {
        success: false,
        created: 0,
        pairs: [],
        error: "All grades already have review rooms",
      };
    }

    // Shuffle and pair
    const shuffled = [...unassignedGrades].sort(() => Math.random() - 0.5);
    const pairs: Array<{
      gradeOwner: string;
      reviewer: string;
      roomId: string;
    }> = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const gradeA = shuffled[i];
      const gradeB = shuffled[i + 1];

      // Create room for gradeA, invite gradeB's owner as reviewer
      const codeA = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: roomA, errors: errA } = await (
        client as any
      ).models.HomeworkRoom.create({
        gradeId: gradeA.id,
        ownerId: gradeA.owner,
        sectionID: sectionId,
        status: "OPEN",
        code: codeA,
        invitedUserIds: [gradeB.owner],
        peerGroup: `review-room-${gradeA.id}-peers`,
      });

      if (!errA?.length && roomA?.id) {
        pairs.push({
          gradeOwner: gradeA.owner,
          reviewer: gradeB.owner,
          roomId: roomA.id,
        });
      }

      // Create room for gradeB, invite gradeA's owner as reviewer
      const codeB = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: roomB, errors: errB } = await (
        client as any
      ).models.HomeworkRoom.create({
        gradeId: gradeB.id,
        ownerId: gradeB.owner,
        sectionID: sectionId,
        status: "OPEN",
        code: codeB,
        invitedUserIds: [gradeA.owner],
        peerGroup: `review-room-${gradeB.id}-peers`,
      });

      if (!errB?.length && roomB?.id) {
        pairs.push({
          gradeOwner: gradeB.owner,
          reviewer: gradeA.owner,
          roomId: roomB.id,
        });
      }
    }

    return { success: true, created: pairs.length, pairs };
  } catch (err: any) {
    console.error("[peerReview action] randomAssignPeerReview error:", err);
    return {
      success: false,
      created: 0,
      pairs: [],
      error: err?.message || "Failed to random-assign",
    };
  }
}

// ============================================================================
// Award Top Reviewer XP
// ============================================================================

export interface TopReviewerResult {
  success: boolean;
  studentId?: string;
  reviewCount?: number;
  xpAwarded?: boolean;
  error?: string;
}

/**
 * Find the student with the most completed peer reviews for a unit in a section,
 * then award them PEER_REVIEW_TOP_REVIEWER XP. Badge check is triggered automatically
 * by the gamification Lambda.
 */
export async function awardTopReviewerXP(
  sectionId: string,
  unitId: string,
): Promise<TopReviewerResult> {
  if (!sectionId || !unitId) {
    return { success: false, error: "sectionId and unitId are required" };
  }

  const client = getServerClient();

  try {
    // Fetch all completed rooms for this section whose grade belongs to this unit
    const { data: gradesData } = await (client as any).models.Grade.list({
      filter: {
        sectionID: { eq: sectionId },
        unitID: { eq: unitId },
        complete: { eq: true },
      },
    });
    const grades: any[] = (gradesData ?? []).filter(
      (g: any) => g != null && g.id != null,
    );
    const gradeIds = new Set(grades.map((g: any) => g.id));

    const { data: roomsData } = await (client as any).models.HomeworkRoom.list({
      filter: {
        sectionID: { eq: sectionId },
        status: { eq: "REVIEW_COMPLETE" },
      },
    });
    const completedRooms: any[] = (roomsData ?? []).filter(
      (r: any) => r != null && gradeIds.has(r.gradeId),
    );

    if (completedRooms.length === 0) {
      return {
        success: false,
        error: "No completed peer reviews found for this unit",
      };
    }

    // Count reviews given per student (reviewers are in invitedUserIds)
    const reviewCounts: Record<string, number> = {};
    for (const room of completedRooms) {
      const reviewers: string[] = room.invitedUserIds ?? [];
      for (const reviewer of reviewers) {
        if (reviewer)
          reviewCounts[reviewer] = (reviewCounts[reviewer] ?? 0) + 1;
      }
    }

    if (Object.keys(reviewCounts).length === 0) {
      return { success: false, error: "No reviewers found in completed rooms" };
    }

    // Find top reviewer
    const [topStudentId, topCount] = Object.entries(reviewCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];

    // Award XP via gamification action
    const { awardXP } = await import("./gamification");
    const xpResult = await awardXP(
      topStudentId,
      "PEER_REVIEW_TOP_REVIEWER",
      `top-reviewer-${sectionId}-${unitId}`,
      sectionId,
      unitId,
    );

    return {
      success: true,
      studentId: topStudentId,
      reviewCount: topCount,
      xpAwarded: !xpResult?.alreadyAwarded,
    };
  } catch (err: any) {
    console.error("[peerReview action] awardTopReviewerXP error:", err);
    return {
      success: false,
      error: err?.message || "Failed to award top reviewer XP",
    };
  }
}
