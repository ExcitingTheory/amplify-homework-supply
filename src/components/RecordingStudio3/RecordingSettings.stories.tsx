import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import RecordingSettings from "./RecordingSettings";

const meta: Meta<typeof RecordingSettings> = {
  title: "🎙️ Recording Studio/Components/Recording Settings",
  component: RecordingSettings,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RecordingSettings>;

function RecordingSettingsWrapper({ initialValue = "standard" }) {
  const [value, setValue] = useState(initialValue);
  return <RecordingSettings value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: () => <RecordingSettingsWrapper />,
};

export const Off: Story = {
  render: () => <RecordingSettingsWrapper initialValue="off" />,
};

export const Light: Story = {
  render: () => <RecordingSettingsWrapper initialValue="light" />,
};

export const Aggressive: Story = {
  render: () => <RecordingSettingsWrapper initialValue="aggressive" />,
};
