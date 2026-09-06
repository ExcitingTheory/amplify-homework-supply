import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React, { useState } from "react";
import { AvatarCustomizer } from "./AvatarCustomizer";
import type { AvatarOverrides } from "./DiceBearAvatar";
import { expect, within } from "storybook/test";

const meta: Meta<typeof AvatarCustomizer> = {
  title: "🏆 Gamification/Avatars & Cosmetics/Avatar Customizer",
  component: AvatarCustomizer,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    level: { control: { type: "range", min: 1, max: 5 } },
    seed: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarCustomizer>;

function AvatarCustomizerWrapper({
  level,
  seed,
}: {
  level: number;
  seed: string;
}) {
  const [open, setOpen] = useState(true);
  const [overrides, setOverrides] = useState<AvatarOverrides>({});

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Customizer</button>
      <pre style={{ fontSize: 12, marginTop: 8 }}>
        Saved overrides: {JSON.stringify(overrides, null, 2)}
      </pre>
      <AvatarCustomizer
        open={open}
        onClose={() => setOpen(false)}
        level={level}
        seed={seed}
        overrides={overrides}
        onSave={setOverrides}
      />
    </>
  );
}

/** Level 2 — only color picker unlocked */
export const Level2Colors: Story = {
  render: () => <AvatarCustomizerWrapper level={2} seed="student-alice" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Open Customizer"),
    ).toBeInTheDocument();
  },
};

/** Level 4 — colors + accessories */
export const Level4Accessories: Story = {
  render: () => <AvatarCustomizerWrapper level={4} seed="student-bob" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Open Customizer"),
    ).toBeInTheDocument();
  },
};

/** Level 5 — full customizer */
export const Level5Full: Story = {
  render: () => <AvatarCustomizerWrapper level={5} seed="student-charlie" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Open Customizer"),
    ).toBeInTheDocument();
  },
};

/** Level 1 — all sections locked */
export const Level1AllLocked: Story = {
  render: () => <AvatarCustomizerWrapper level={1} seed="student-newbie" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Open Customizer"),
    ).toBeInTheDocument();
  },
};

/** With existing overrides pre-filled */
export const WithExistingOverrides: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [overrides, setOverrides] = useState<AvatarOverrides>({
      backgroundColor: ["c0aede"],
      skinColor: ["d2a67c"],
      accessories: ["kurt"],
      accessoriesProbability: 100,
    });

    return (
      <>
        <button onClick={() => setOpen(true)}>Open Customizer</button>
        <pre style={{ fontSize: 12, marginTop: 8 }}>
          {JSON.stringify(overrides, null, 2)}
        </pre>
        <AvatarCustomizer
          open={open}
          onClose={() => setOpen(false)}
          level={4}
          seed="student-returning"
          overrides={overrides}
          onSave={setOverrides}
        />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Open Customizer"),
    ).toBeInTheDocument();
  },
};
