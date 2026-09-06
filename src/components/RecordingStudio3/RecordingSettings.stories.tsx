import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState } from "react";
import RecordingSettings from "./RecordingSettings";
import { expect, within } from "storybook/test";

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
    const canvas = within(canvasElement);
    expect(canvasElement.querySelector(".MuiSlider-root")).toBeTruthy();
    await canvas.findByText("Standard");
  },
};

export const Off: Story = {
  render: () => <RecordingSettingsWrapper initialValue="off" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.querySelector(".MuiSlider-root")).toBeTruthy();
    await canvas.findByText("Off");
  },
};

export const Light: Story = {
  render: () => <RecordingSettingsWrapper initialValue="light" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.querySelector(".MuiSlider-root")).toBeTruthy();
    await canvas.findByText("Light");
  },
};

export const Aggressive: Story = {
  render: () => <RecordingSettingsWrapper initialValue="aggressive" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.querySelector(".MuiSlider-root")).toBeTruthy();
    await canvas.findByText("Aggressive");
  },
};
