import { cookies } from "next/headers";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplifyServerUtils";
import { getServerClient } from "@/utils/amplifyServerClient";
import { redirect } from "next/navigation";
import FileListClient from "./FileListClient";

const FILE_SELECTION_SET = [
  "id",
  "name",
  "description",
  "mimeType",
  "path",
  "size",
  "thumbnail",
  "generated",
  "documentID",
  "owner",
  "createdAt",
  "updatedAt",
  "moderation.*",
  "embedding.*",
] as const;

// Join tables only need the foreign key — used to compute which files are unreferenced.
const JOIN_SELECTION_SET = ["fileID"] as const;

/**
 * Admin file-list maintenance. Authenticates server-side (Admins/Instructors
 * only), pre-fetches the full file list plus every File join table so
 * "orphaned" (unreferenced) files can be flagged without a client-side waterfall.
 */
export default async function FileListMaintenancePage() {
  let groups: string[] = [];
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });
    const payload = session?.tokens?.idToken?.payload as
      { "cognito:groups"?: string[] } | undefined;
    groups = payload?.["cognito:groups"] || [];
  } catch {
    // Fall through — treated as no access below
  }

  if (!groups.includes("Admins") && !groups.includes("Instructors")) {
    redirect("/?returnUrl=" + encodeURIComponent("/admin/files"));
  }

  let initialFiles: unknown = [];
  try {
    const client = getServerClient();

    async function listAll(
      model:
        "File" | "UnitFile" | "WordFile" | "QuestionFile" | "AssistantChatFile",
      selectionSet: readonly string[],
    ) {
      const items: any[] = [];
      let nextToken: string | null = null;
      do {
        const {
          data,
          nextToken: token,
        }: { data: any[]; nextToken: string | null } = await (
          client as any
        ).models[model].list({ limit: 500, nextToken, selectionSet });
        for (const item of data || []) {
          if (item) items.push(item);
        }
        nextToken = token || null;
      } while (nextToken);
      return items;
    }

    const [files, unitFiles, wordFiles, questionFiles, chatFiles] =
      await Promise.all([
        listAll("File", FILE_SELECTION_SET),
        listAll("UnitFile", JOIN_SELECTION_SET),
        listAll("WordFile", JOIN_SELECTION_SET),
        listAll("QuestionFile", JOIN_SELECTION_SET),
        listAll("AssistantChatFile", JOIN_SELECTION_SET),
      ]);

    const referencedFileIds = new Set<string>();
    for (const join of [
      ...unitFiles,
      ...wordFiles,
      ...questionFiles,
      ...chatFiles,
    ]) {
      if (join?.fileID) referencedFileIds.add(join.fileID);
    }

    const filesWithLinkInfo = files.map((f) => ({
      ...f,
      orphaned: !f.documentID && !referencedFileIds.has(f.id),
    }));

    initialFiles = JSON.parse(JSON.stringify(filesWithLinkInfo));
  } catch (err) {
    console.error("[AdminFiles RSC] Pre-fetch error:", err);
  }

  return <FileListClient initialFiles={initialFiles as never} />;
}
