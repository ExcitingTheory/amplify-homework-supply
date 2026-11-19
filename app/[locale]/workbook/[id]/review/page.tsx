import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { loadPublishedUnitContent } from "@/utils/publishedUnitContent";
import StudentReviewClient from "./StudentReviewClient";

export const dynamic = "force-dynamic";

interface ReviewPageProps {
  params: Promise<{ id: string; locale: string }>;
}

/**
 * Read-only view of a student's own graded workbook: every answer as they
 * gave it (text, recording, drawing in stroke order) with its verdict.
 * The unit content is the published version the student worked from.
 */
export default async function WorkbookReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;

  let contentJson = "";
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    if (session?.tokens?.idToken) {
      contentJson = (await loadPublishedUnitContent(id)) || "";
    }
  } catch (error) {
    console.warn("[WorkbookReviewPage] Could not load unit content:", error);
  }

  return <StudentReviewClient unitId={id} contentJson={contentJson} />;
}
