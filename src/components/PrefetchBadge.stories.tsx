import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Box } from "@mui/material";
import { expect, waitFor } from "storybook/test";
import PrefetchBadge from "./PrefetchBadge";

/**
 * PrefetchBadge shows the offline readiness state for a specific assignment:
 * "Save offline" → downloading progress → "Offline ready" → error/retry.
 */
const meta: Meta<typeof PrefetchBadge> = {
  title: "🔌 Offline & Sync/Prefetch Badge",
  component: PrefetchBadge,
  parameters: {
    // Pure presentational component — skip the app context/subscription stack.
    minimalProviders: true,
    layout: "centered",
    docs: {
      description: {
        component:
          "Per-assignment chip that lets students download units for offline use and shows readiness status.",
      },
    },
  },
  decorators: [
    (Story) => (
      <Box sx={{ p: 4, display: "flex", gap: 2, alignItems: "center" }}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PrefetchBadge>;

/**
 * Not yet cached — shows "Save offline" chip with download icon.
 */
export const NotCached: Story = {
  args: {
    unitId: "unit-not-cached-123",
  },
  play: async ({ canvasElement }) => {
    // Async status check resolves to a rendered chip
    await waitFor(() =>
      expect(canvasElement.querySelector(".MuiChip-root")).not.toBeNull(),
    );
  },
};

/**
 * With Amplify client available — user can click to trigger download.
 */
export const WithClient: Story = {
  name: "With Client (clickable)",
  args: {
    unitId: "unit-with-client-456",
    client: { models: {} },
    username: "test-student",
  },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(canvasElement.querySelector(".MuiChip-root")).not.toBeNull(),
    );
  },
};
