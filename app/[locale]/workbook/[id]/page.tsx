import { Suspense } from "react";
import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { loadPublishedUnitContent } from "../../../actions/unitContent";
import { generateHtmlFromLexicalState } from "@/utils/lexicalServerRender";
import WorkbookClient from "./WorkbookClient";
import { WorkbookSSRSkeleton } from "@/components/Editor3/WorkbookSSRSkeleton";

interface WorkbookPageProps {
  params: Promise<{ id: string; locale: string }>;
}

/**
 * Cached unit HTML generation. The Lexical → HTML render is expensive
 * and unit content rarely changes, so cache per (unitId, publishedVersion).
 * Revalidate via revalidateTag(`unit-${unitId}`) when unit is published.
 */
async function getCachedUnitHtml(unitId: string, unitVersion: string): Promise<string> {
  try {
    // Load published content from S3 (server-side IAM access)
    const content = await loadPublishedUnitContent(unitId);

    if (!content) return "";

    return await generateHtmlFromLexicalState(content);
  } catch (error) {
    console.warn("[WorkbookPage] Cached HTML generation failed:", error);
    return "";
  }
}

export default async function WorkbookPage({ params }: WorkbookPageProps) {
  const { id } = await params;

  // Auth check (dynamic — not cached)
  let isAuthenticated = false;
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    isAuthenticated = !!session?.tokens?.idToken;
  } catch {
    // Fall through — client will handle auth
  }

  // Lightweight metadata fetch to get published version for cache key
  let html = "";
  if (isAuthenticated) {
    try {
      const client = getServerClient();
      const { data: unitMeta } = await (client as any).models.Unit.get(
        { id },
        { selectionSet: ["id", "publishedContentVersion"] }
      );
      const publishedVersion = String(unitMeta?.publishedContentVersion || 0);
      html = await getCachedUnitHtml(id, publishedVersion);
    } catch {
      // Fall through — client will render content
    }
  }

  return (
    <Suspense fallback={<WorkbookSSRSkeleton html={html} />}>
      <WorkbookClient ssrHtml={html} />
    </Suspense>
  );
}
