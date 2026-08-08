import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import AudioFilterPanel from "./AudioFilterPanel";
import { expect } from 'storybook/test'

const meta: Meta<typeof AudioFilterPanel> = {
  title: "🎙️ Recording Studio/Components/Audio Filter Panel",
  component: AudioFilterPanel,
  parameters: {
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
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const SomeActive: Story = {
  render: () => (
    <AudioFilterPanelWrapper
      initialFilters={new Set(["derumble", "noisecancel"])}
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const AllActive: Story = {
  render: () => (
    <AudioFilterPanelWrapper
      initialFilters={new Set(["derumble", "pop", "noisecancel", "compress", "presence"])}
    />
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
