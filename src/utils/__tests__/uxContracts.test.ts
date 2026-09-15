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
    expect(source).toContain('aria-labelledby="workbook-timer-title"');
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
    const recordingSource = readWorkspaceFile(
      "src/components/RecordingStudio3.jsx",
    );
    const offlineSource = readWorkspaceFile("src/components/OfflineBanner.tsx");

    expect(recordingSource).toContain('role="status"');
    expect(recordingSource).toContain('aria-live="polite"');
    expect(offlineSource).toContain("onClick={handleManualSync}");
    expect(offlineSource).toContain(
      "aria-label={`Sync ${pendingCount} pending changes`}",
    );
  });
});
