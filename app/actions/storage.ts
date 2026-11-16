"use server";

/**
 * Storage Server Actions
 *
 * Server-side access to student submission URLs for instructors.
 */

import { getServerClient } from "@/utils/amplifyServerClient";

/**
 * The query returns the signed URL as a plain string. It used to be passed to
 * JSON.parse, which throws on a URL, so instructors never got a URL back.
 * Older deployments may still return a JSON object with a `url` field.
 */
function parseSignedUrl(data: unknown): string | null {
  if (typeof data !== "string") {
    return (data as { url?: string } | null)?.url ?? null;
  }
  if (data.startsWith("https://")) return data;
  try {
    return JSON.parse(data)?.url ?? null;
  } catch {
    return null;
  }
}

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

    return { url: parseSignedUrl(data) };
  } catch (err: any) {
    console.error("[storage action] getStudentSubmissionUrl error:", err);
    return { url: null, error: err?.message };
  }
}

/**
 * Signed URLs for several of one grade's submission files in one call
 * (instructor access). Keys the server refuses come back with url: null.
 */
export async function getStudentSubmissionUrls(
  gradeId: string,
  submissionKeys: string[],
): Promise<{ urls: Record<string, string | null>; error?: string }> {
  if (!submissionKeys.length) return { urls: {} };
  const client = getServerClient();

  try {
    const { data, errors } = await (
      client as any
    ).queries.getStudentSubmissionUrls({ gradeId, submissionKeys });

    if (errors?.length) {
      console.error("[storage action] getStudentSubmissionUrls errors:", errors);
      return { urls: {}, error: errors[0]?.message };
    }

    const urls: Record<string, string | null> = {};
    for (const item of (data || []) as Array<{ key: string; url?: string | null }>) {
      if (item?.key) urls[item.key] = item.url ?? null;
    }
    return { urls };
  } catch (err: any) {
    console.error("[storage action] getStudentSubmissionUrls error:", err);
    return { urls: {}, error: err?.message };
  }
}
