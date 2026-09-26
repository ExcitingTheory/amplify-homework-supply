import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import AudioFilterPanel from "./AudioFilterPanel";
import { expect, within } from "storybook/test";

// Browser-mode tests here occasionally hit a Playwright/websocket disconnect
// ("[birpc] rpc is closed") unrelated to this story's assertions. Retry just
// this file's tests to absorb that flakiness. No-op outside the Vitest runtime.
if (typeof vi !== "undefined") {
  vi.setConfig({ retry: 1 });
}

const meta: Meta<typeof AudioFilterPanel> = {
  title: "🎙️ Recording Studio/Components/Audio Filter Panel",
  component: AudioFilterPanel,
  parameters: {
    // Pure presentational component — skip the app context/subscription stack.
    minimalProviders: true,
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof AudioFilterPanel>;

function AudioFilterPanelWrapper({ initialFilters = new Set<string>() }) {
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  return (
    <AudioFilterPanel
      activeFilters={activeFilters}
      onFiltersChange={setActiveFilters}
    />
  );
}

export const AllOff: Story = {
  render: () => <AudioFilterPanelWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("De-rumble");
    await canvas.findByText("Pop filter");
    await canvas.findByText("Noise cancel");
  },
};

export const SomeActive: Story = {
  render: () => (
    <AudioFilterPanelWrapper
      initialFilters={new Set(["derumble", "noisecancel"])}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("De-rumble");
    await canvas.findByText("Noise cancel");
  },
};

export const AllActive: Story = {
  render: () => (
    <AudioFilterPanelWrapper
      initialFilters={
        new Set(["derumble", "pop", "noisecancel", "compress", "presence"])
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Compress");
    await canvas.findByText("Presence");
    expect(canvasElement.querySelectorAll(".MuiChip-root").length).toBe(5);
  },
};
