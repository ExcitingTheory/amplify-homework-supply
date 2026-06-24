import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import AudioFilterPanel from "./AudioFilterPanel";

const meta: Meta<typeof AudioFilterPanel> = {
  title: "RecordingStudio3/AudioFilterPanel",
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
};

export const SomeActive: Story = {
  render: () => (
    <AudioFilterPanelWrapper
      initialFilters={new Set(["derumble", "noisecancel"])}
    />
  ),
};

export const AllActive: Story = {
  render: () => (
    <AudioFilterPanelWrapper
      initialFilters={new Set(["derumble", "pop", "noisecancel", "compress", "presence"])}
    />
  ),
};
