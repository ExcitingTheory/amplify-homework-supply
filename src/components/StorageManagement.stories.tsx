import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StorageManagement from "./StorageManagement";
import { expect, within } from "storybook/test";

/**
 * StorageManagement is a settings panel showing offline storage usage,
 * AI model controls, and cached assignment management.
 */
const meta: Meta<typeof StorageManagement> = {
  title: "🔌 Offline & Sync/Storage Management",
  component: StorageManagement,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Settings panel for managing offline storage: usage bar, AI model download/delete, and cached assignment list.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof StorageManagement>;

/**
 * Default state — loads real data from IndexedDB (which will be empty
 * in Storybook since no prefetch has occurred).
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Empty state — no offline data available.
 * The component gracefully handles missing IndexedDB/offline modules.
 */
export const EmptyState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Component should render its card structure even without data
    const cards = canvasElement.querySelectorAll('[class*="MuiCard"]');
    expect(cards.length).toBeGreaterThan(0);
  },
};
