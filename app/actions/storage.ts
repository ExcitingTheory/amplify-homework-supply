"use server";

/**
 * Storage Server Actions
 *
 * Server-side access to student submission URLs for instructors.
 */

import { getServerClient } from "@/utils/amplifyServerClient";

/**
 * Get a signed URL for a student's submission file (instructor access).
 */
export async function getStudentSubmissionUrl(
  gradeId: string,
  submissionKey: string,
): Promise<{ url: string | null; error?: string }> {
  const client = getServerClient();

  try {
    const { data, errors } = await (
      client as any
    ).queries.getStudentSubmissionUrl({
      gradeId,
      submissionKey,
    });

    if (errors?.length) {
      console.error("[storage action] getStudentSubmissionUrl errors:", errors);
      return { url: null, error: errors[0]?.message };
    }

    const result = typeof data === "string" ? JSON.parse(data) : data;
    return { url: result?.url || null };
  } catch (err: any) {
    console.error("[storage action] getStudentSubmissionUrl error:", err);
    return { url: null, error: err?.message };
  }
}
