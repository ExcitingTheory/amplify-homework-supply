"use server";

/**
 * Unit Content Server Actions
 *
 * Server-side access to unit content stored in S3.
 * Used by SSR pages (workbook) that need published content for rendering.
 */

import { loadPublishedUnitContent as loadPublishedUnitContentImpl } from "@/utils/publishedUnitContent";

/**
 * Load published unit content from S3 for SSR rendering.
 * Falls back to null if content doesn't exist yet.
 */
export async function loadPublishedUnitContent(
  unitId: string,
): Promise<string | null> {
  return loadPublishedUnitContentImpl(unitId);
}
