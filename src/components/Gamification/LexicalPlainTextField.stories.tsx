import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LexicalPlainTextField } from "./LexicalPlainTextField";
import { expect, within } from "storybook/test";

const meta: Meta<typeof LexicalPlainTextField> = {
  title: "🏆 Gamification/Inputs/Lexical Plain Text Field",
  component: LexicalPlainTextField,
};
export default meta;

type Story = StoryObj<typeof LexicalPlainTextField>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("Hello world");
    return (
      <LexicalPlainTextField
        value={value}
        onChange={setValue}
        label="Badge Title"
        placeholder="Enter badge title..."
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Badge Title")).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  render: () => (
    <LexicalPlainTextField
      value="Read-only text"
      onChange={() => {}}
      label="Disabled"
      disabled
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Disabled")).toBeInTheDocument();
  },
};

export const Multiline: Story = {
  render: () => {
    const [value, setValue] = useState("Line 1\nLine 2");
    return (
      <LexicalPlainTextField
        value={value}
        onChange={setValue}
        label="Description"
        multiline
        maxLength={200}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Description")).toBeInTheDocument();
  },
};
