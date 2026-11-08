import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from "y-protocols/awareness";
import { WorkbookCollaborationProvider } from "../../yjs/WorkbookCollaborationProvider";
import { WorkbookPointerOverlay } from "./WorkbookPointerOverlay";

function PointerExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [provider, setProvider] =
    React.useState<WorkbookCollaborationProvider | null>(null);

  React.useEffect(() => {
    const local = new WorkbookCollaborationProvider({
      gradeId: "story-grade",
      user: { username: "student", role: "student" },
      connect: false,
      persistence: false,
      autoSyncToGrade: false,
    });
    const remote = new WorkbookCollaborationProvider({
      gradeId: "story-grade",
      user: {
        username: "reviewer",
        displayName: "Reviewer",
        role: "tutor",
        color: "#3b82f6",
      },
      connect: false,
      persistence: false,
      autoSyncToGrade: false,
    });
    const awareness = remote.getAwareness();
    awareness.setLocalStateField("pointer", { x: 0.4, y: 0.25 });
    applyAwarenessUpdate(
      local.getAwareness(),
      encodeAwarenessUpdate(awareness, [awareness.clientID]),
      "story",
    );
    setProvider(local);
    return () => {
      local.destroy();
      remote.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ height: 240, overflow: "auto" }}>
      <WorkbookPointerOverlay provider={provider} containerRef={containerRef} />
      <div style={{ height: 600, padding: 16 }}>Workbook content</div>
    </div>
  );
}

const meta: Meta<typeof PointerExample> = {
  title: "Workbook/Participant pointers",
  component: PointerExample,
};
export default meta;

export const Participant: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).findByText("Reviewer"),
    ).resolves.toBeTruthy();
  },
};
