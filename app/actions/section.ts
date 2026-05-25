"use server";

/**
 * Section Server Actions
 *
 * Replaces client-side section operations that traverse:
 * Client → AppSync GraphQL → Lambda → Cognito/DynamoDB → Lambda → AppSync → Client
 *
 * New flow: Client → Server Action → AppSync GraphQL → Lambda (1 fewer hop)
 *
 * Note: Cognito group management (addSelfToSection) must remain backed by
 * the Lambda since it requires IAM admin privileges for Cognito.
 */

import { getServerClient } from "@/utils/amplifyServerClient";

// ============================================================================
// Join Section
// ============================================================================

export interface JoinSectionResult {
  success: boolean;
  sectionName?: string;
  sectionId?: string;
  error?: string;
}

/**
 * Join a section by code — adds the current user to the section's Cognito group
 * and creates a membership record.
 *
 * This calls the `addSelfToSection` Lambda mutation server-side.
 */
export async function joinSection(code: string): Promise<JoinSectionResult> {
  if (!code || code.trim().length === 0) {
    return { success: false, error: "Section code is required" };
  }

  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).mutations.addSelfToSection({
      code: code.trim(),
    });

    if (errors?.length) {
      const errorMsg = errors[0]?.message || "Failed to join section";
      console.error("[section action] joinSection errors:", errors);
      return { success: false, error: errorMsg };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return {
      success: true,
      sectionName: result?.sectionName || result?.name || undefined,
      sectionId: result?.sectionId || result?.id || undefined,
    };
  } catch (err: any) {
    console.error("[section action] joinSection error:", err);
    return { success: false, error: err?.message || "Failed to join section" };
  }
}

// ============================================================================
// Create Section Group (Instructor)
// ============================================================================

export interface CreateSectionResult {
  success: boolean;
  sectionId?: string;
  code?: string;
  error?: string;
}

/**
 * Create a new section with a generated join code.
 * Instructor-only operation — creates the Cognito group and section record.
 * Optionally copies gamification settings from another section.
 */
export async function createSection(
  name: string,
  description?: string,
  copySettingsFromSectionId?: string,
): Promise<CreateSectionResult> {
  if (!name || name.trim().length === 0) {
    return { success: false, error: "Section name is required" };
  }

  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).mutations.createSectionGroup(
      {
        name: name.trim(),
        description: description?.trim() || null,
      },
    );

    if (errors?.length) {
      const errorMsg = errors[0]?.message || "Failed to create section";
      console.error("[section action] createSection errors:", errors);
      return { success: false, error: errorMsg };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    const sectionId = result?.id || result?.sectionId;

    // Copy gamification settings from source section if specified
    if (copySettingsFromSectionId && sectionId) {
      try {
        await (client as any).mutations.copyGamificationSettings({
          sourceSectionId: copySettingsFromSectionId,
          targetSectionId: sectionId,
        });
      } catch (copyErr: any) {
        console.warn(
          "[section action] Failed to copy gamification settings:",
          copyErr?.message,
        );
        // Don't fail section creation if settings copy fails
      }
    }

    return {
      success: true,
      sectionId,
      code: result?.code,
    };
  } catch (err: any) {
    console.error("[section action] createSection error:", err);
    return {
      success: false,
      error: err?.message || "Failed to create section",
    };
  }
}

// ============================================================================
// Copy Gamification Settings Between Sections
// ============================================================================

export interface CopySettingsResult {
  success: boolean;
  error?: string;
}

/**
 * Copy gamification settings (leveling curve, XP multipliers, badge configs)
 * from one section to another. Overwrites existing settings on the target.
 */
export async function copyGamificationSettings(
  sourceSectionId: string,
  targetSectionId: string,
): Promise<CopySettingsResult> {
  if (!sourceSectionId || !targetSectionId) {
    return {
      success: false,
      error: "Both source and target section IDs are required",
    };
  }

  const client = getServerClient();

  try {
    const { data, errors } = await (
      client as any
    ).mutations.copyGamificationSettings({
      sourceSectionId,
      targetSectionId,
    });

    if (errors?.length) {
      const errorMsg = errors[0]?.message || "Failed to copy settings";
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[section action] copyGamificationSettings error:", err);
    return { success: false, error: err?.message || "Failed to copy settings" };
  }
}

// ============================================================================
// Join Peer Review Room
// ============================================================================

export interface JoinPeerReviewResult {
  success: boolean;
  roomId?: string;
  error?: string;
}

/**
 * Join a peer review room by code.
 */
export async function joinPeerReview(
  code: string,
): Promise<JoinPeerReviewResult> {
  if (!code || code.trim().length === 0) {
    return { success: false, error: "Review room code is required" };
  }

  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).mutations.joinPeerReview({
      roomCode: code.trim(),
    });

    if (errors?.length) {
      const errorMsg = errors[0]?.message || "Failed to join peer review";
      console.error("[section action] joinPeerReview errors:", errors);
      return { success: false, error: errorMsg };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return {
      success: true,
      roomId: result?.roomId || result?.id,
    };
  } catch (err: any) {
    console.error("[section action] joinPeerReview error:", err);
    return {
      success: false,
      error: err?.message || "Failed to join peer review",
    };
  }
}

// ============================================================================
// List Section Students
// ============================================================================

export interface StudentInfo {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  email?: string;
}

export interface ListSectionStudentsResult {
  success: boolean;
  students?: StudentInfo[];
  error?: string;
}

/**
 * List students in a section by section code.
 * Wraps the `listSectionStudents` Lambda query server-side.
 */
export async function listSectionStudents(
  sectionCode: string,
): Promise<ListSectionStudentsResult> {
  if (!sectionCode || sectionCode.trim().length === 0) {
    return { success: false, error: "Section code is required" };
  }

  const client = getServerClient();

  try {
    const { data, errors } = await (client as any).queries.listSectionStudents({
      sectionCode: sectionCode.trim(),
    });

    if (errors?.length) {
      const errorMsg = errors[0]?.message || "Failed to list students";
      console.error("[section action] listSectionStudents errors:", errors);
      return { success: false, error: errorMsg };
    }

    const students = Array.isArray(data) ? data : [];
    return { success: true, students };
  } catch (err: any) {
    console.error("[section action] listSectionStudents error:", err);
    return {
      success: false,
      error: err?.message || "Failed to list section students",
    };
  }
}
