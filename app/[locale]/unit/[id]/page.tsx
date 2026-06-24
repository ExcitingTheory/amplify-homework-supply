import { Suspense } from "react";
import { getServerClient } from "@/utils/amplifyServerClient";
import { generateHtmlFromLexicalState } from "@/utils/lexicalServerRender";
import UnitEditorClient from "./UnitEditorClient";

interface UnitPageProps {
  params: Promise<{ id: string; locale: string }>;
}

/**
 * Cached unit content preview. Generates read-only HTML from the unit's
 * Lexical editor state. Shown instantly while the full interactive editor loads.
 * Cache keyed by (unitId, unitVersion) — new saves automatically get fresh cache.
 * Revalidate via revalidateTag(`unit-${unitId}`) when unit is saved.
 */
async function getCachedEditorPreview(unitId: string): Promise<{
  html: string;
  name: string;
}> {
  try {
    const client = getServerClient();
    const { data: unit } = await (client as any).models.Unit.get({ id: unitId });

    if (!unit?.data) return { html: "", name: unit?.name || "" };

    const serializedEditorState =
      typeof unit.data === "string" ? unit.data : JSON.stringify(unit.data);

    const html = await generateHtmlFromLexicalState(serializedEditorState);
    return { html, name: unit.name || "" };
  } catch (error) {
    console.warn("[UnitPage] Cached preview generation failed:", error);
    return { html: "", name: "" };
  }
}

/**
 * Editor page with cached SSR content preview.
 * The pre-rendered HTML gives users instant content visibility while the
 * heavy Lexical editor (with collaboration, toolbar, panels) loads.
 */
export default async function UnitPage({ params }: UnitPageProps) {
  const { id } = await params;

  // Single fetch for preview — no separate metadata query needed
  let html = "";
  let name = "";
  try {
    const preview = await getCachedEditorPreview(id);
    html = preview.html;
    name = preview.name;
  } catch {
    // Fall through — client editor will load content independently
  }

  return (
    <Suspense fallback={<EditorPreviewSkeleton html={html} name={name} />}>
      <UnitEditorClient />
    </Suspense>
  );
}

/**
 * Skeleton that shows the unit's pre-rendered content in a read-only layout
 * mimicking the editor's structure (toolbar placeholder + content area).
 */
function EditorPreviewSkeleton({
  html,
  name,
}: {
  html: string;
  name: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Toolbar placeholder */}
      <div
        style={{
          height: "48px",
          background: "var(--mui-palette-background-paper, #fff)",
          borderBottom: "1px solid var(--mui-palette-divider, #e0e0e0)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {name && (
          <span
            style={{
              fontWeight: 500,
              fontSize: "1rem",
              opacity: 0.7,
            }}
          >
            {name}
          </span>
        )}
        <span style={{ opacity: 0.4, fontSize: "0.85rem", marginLeft: "auto" }}>
          Loading editor...
        </span>
      </div>

      {/* Content preview */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Left tab strip placeholder */}
        <div
          style={{
            width: "40px",
            background: "var(--mui-palette-background-paper, #fff)",
            borderRight: "1px solid var(--mui-palette-divider, #e0e0e0)",
            flexShrink: 0,
          }}
        />

        {/* Main content area with pre-rendered HTML */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1rem 2rem 1rem 2rem",
            opacity: 0.85,
          }}
        >
          {html ? (
            <div
              className="workbook-ssr-skeleton"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "200px",
                opacity: 0.5,
              }}
            >
              Loading content...
            </div>
          )}
        </div>

        {/* Right tab strip placeholder */}
        <div
          style={{
            width: "40px",
            background: "var(--mui-palette-background-paper, #fff)",
            borderLeft: "1px solid var(--mui-palette-divider, #e0e0e0)",
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
}
