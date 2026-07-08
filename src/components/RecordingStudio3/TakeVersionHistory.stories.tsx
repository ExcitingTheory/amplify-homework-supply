import type { Meta, StoryObj } from "@storybook/react";
import { vi } from "vitest";
import TakeVersionHistory from "./TakeVersionHistory";

// Mock the listTakeVersions import
vi.mock("../../utils/takeVersioning", () => ({
  listTakeVersions: async () => [
    {
      version: 1,
      key: "protected/us-east-1:abc/takes/1-f3a2c8_1.webm",
      lastModified: new Date("2026-05-31T09:40:00Z"),
      size: 51200,
    },
    {
      version: 2,
      key: "protected/us-east-1:abc/takes/1-f3a2c8_2.webm",
      lastModified: new Date("2026-06-01T13:52:00Z"),
      size: 48300,
    },
    {
      version: 3,
      key: "protected/us-east-1:abc/takes/1-f3a2c8_3.webm",
      lastModified: new Date("2026-06-01T14:14:00Z"),
      size: 49100,
    },
  ],
}));

const meta: Meta<typeof TakeVersionHistory> = {
  title: "🎙️ Recording Studio/Components/Take Version History",
  component: TakeVersionHistory,
  parameters: {
    layout: "padded",
  },
  args: {
    identityId: "us-east-1:abc123",
    dialogueId: "1",
    slotId: "f3a2c8b1-1234-5678-abcd-123456789abc",
    currentVersion: 3,
    currentAudioPath: "protected/us-east-1:abc/takes/1-f3a2c8_3.webm",
    takeType: "human",
    onRestore: (dialogueId: string, slotId: string, versionKey: string) => {
      console.log("Restore:", { dialogueId, slotId, versionKey });
    },
  },
};

export default meta;
type Story = StoryObj<typeof TakeVersionHistory>;

export const Default: Story = {};

export const SingleVersion: Story = {
  parameters: {
    mockData: {
      versions: 1,
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const NoSlotId: Story = {
  args: {
    slotId: null,
    disabled: true,
  },
};
