import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("UX implementation contracts", () => {
  it("keeps workbook timer entry responsive and bounded", () => {
    const source = readWorkspaceFile(
      "app/[locale]/workbook/[id]/WorkbookClient.tsx",
    );

    expect(source).toContain('width: "min(calc(100% - 2rem), 48rem)"');
    expect(source).toContain('maxHeight: "calc(100vh - 2rem)"');
    // aria-labelledby is built via a ternary (resume vs start overlay), not a literal attribute
    expect(source).toContain('"workbook-timer-title"');
  });

  it("keeps chat messages theme-aware and avoids forced white descendants", () => {
    const styles = readWorkspaceFile(
      "src/components/ChatSidebar/VirtualizedMessageList.module.css",
    );

    expect(styles).toContain("--user-message-text");
    expect(styles).toContain("--message-link");
    expect(styles).not.toContain(".messageWrapper.user *");
    expect(styles).not.toContain("color: #ffffff !important");
  });

  it("exposes live status and actionable offline sync contracts", () => {
    // Live status markup lives in the presentational View split-out component
    const recordingSource = readWorkspaceFile(
      "src/components/RecordingStudio3View.jsx",
    );
    // The sync button + aria-label live in the presentational View component
    const offlineSource = readWorkspaceFile("src/components/OfflineBannerView.tsx");

    expect(recordingSource).toContain('role="status"');
    expect(recordingSource).toContain('aria-live="polite"');
    expect(offlineSource).toContain("onClick={onSync}");
    expect(offlineSource).toContain(
      't("offlineBanner.syncAria", { count: pendingCount })',
    );
  });
});
