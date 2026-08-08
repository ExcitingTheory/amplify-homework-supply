import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import RecordingSettings from "./RecordingSettings";
import { expect } from 'storybook/test'

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
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Off: Story = {
  render: () => <RecordingSettingsWrapper initialValue="off" />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Light: Story = {
  render: () => <RecordingSettingsWrapper initialValue="light" />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const Aggressive: Story = {
  render: () => <RecordingSettingsWrapper initialValue="aggressive" />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
