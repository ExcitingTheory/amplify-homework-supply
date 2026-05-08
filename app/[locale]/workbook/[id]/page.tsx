import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getServerClient } from "@/utils/amplifyServerClient";
import { generateHtmlFromLexicalState } from "@/utils/lexicalServerRender";
import { WorkbookSkeleton } from "./WorkbookSkeleton";

// Dynamically import the full interactive client — no SSR (it uses browser APIs)
const WorkbookClient = dynamic(() => import("./WorkbookClient"), {
  ssr: false,
});

interface WorkbookPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function WorkbookPage({ params }: WorkbookPageProps) {
  const { id } = await params;

  let html = "";
  let unitName = "";

  try {
    const client = getServerClient();
    const { data: unit } = await client.models.Unit.get({ id });

    if (unit?.data) {
      unitName = unit.name || "";
      html = await generateHtmlFromLexicalState(
        typeof unit.data === "string" ? unit.data : JSON.stringify(unit.data),
      );
    }
  } catch (err) {
    console.error("[Workbook RSC] Failed to fetch unit or generate HTML:", err);
  }

  return (
    <Suspense fallback={html ? <WorkbookSkeleton html={html} unitName={unitName} /> : null}>
      <WorkbookClient />
    </Suspense>
  );
}
