import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within } from "storybook/test";
import Box from "@mui/material/Box";
import { PixelSpriteMascot } from "./PixelSpriteMascot";

const meta: Meta<typeof PixelSpriteMascot> = {
  title: "🏆 Gamification/Easter Eggs/Pixel Sprite Mascot",
  component: PixelSpriteMascot,
  parameters: {
    // Pure presentational component — skip the app context/subscription stack.
    minimalProviders: true,
  },
  argTypes: {
    stage: { control: { type: "range", min: 1, max: 5 } },
    size: { control: { type: "range", min: 32, max: 200 } },
  },
};

export default meta;
type Story = StoryObj<typeof PixelSpriteMascot>;

export const Default: Story = {
  args: {
    seed: "student-abc-123",
    stage: 1,
    size: 64,
    label: "Hatchling",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Hatchling");
  },
};

export const AllStages: Story = {
  render: () => (
    <Box
      sx={{ display: "flex", gap: 3, alignItems: "flex-end", flexWrap: "wrap" }}
    >
      {[1, 2, 3, 4, 5].map((stage) => (
        <PixelSpriteMascot
          key={stage}
          seed="student-abc-123"
          stage={stage}
          size={48 + stage * 12}
          label={`Stage ${stage}`}
          tooltip={`Level ${stage} evolution`}
        />
      ))}
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Stage 1");
    await canvas.findByText("Stage 5");
  },
};

export const DifferentSeeds: Story = {
  render: () => (
    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {["alice", "bob", "charlie", "diana", "eve", "frank"].map((name) => (
        <PixelSpriteMascot
          key={name}
          seed={name}
          stage={3}
          size={64}
          label={name}
        />
      ))}
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("alice");
    await canvas.findByText("frank");
  },
};

export const Sleeping: Story = {
  args: {
    seed: "student-abc-123",
    stage: 3,
    size: 80,
    label: "Zzz...",
    sleeping: true,
    tooltip: "Streak broken — mascot is sleeping",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Zzz...");
  },
};

export const SquadPet: Story = {
  args: {
    seed: "squad-phoenix-squad",
    stage: 4,
    size: 96,
    label: "Squad Pet",
    tooltip: "Phoenix Squad mascot (Stage 4)",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Squad Pet");
  },
};

export const BossMonster: Story = {
  args: {
    seed: "challenge-boss-final",
    stage: 5,
    size: 128,
    label: "Final Boss",
    tooltip: "Defeat this boss to earn bonus XP!",
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Final Boss");
  },
};

export const BorrowedAccessories: Story = {
  render: () => (
    <Box
      sx={{ display: "flex", gap: 3, alignItems: "flex-end", flexWrap: "wrap" }}
    >
      {[
        { id: "sunglasses", label: "Sunglasses" },
        { id: "round", label: "Round" },
        { id: "wayfarers", label: "Wayfarers" },
        { id: "prescription01", label: "Glasses" },
        { id: "eyepatch", label: "Eyepatch" },
        { id: "kurt", label: "Kurt" },
      ].map((a) => (
        <PixelSpriteMascot
          key={a.id}
          seed="student-abc-123"
          stage={3}
          size={80}
          accessory={a.id}
          label={a.label}
          tooltip={`Mascot borrowed: ${a.label}`}
        />
      ))}
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Sunglasses");
    await canvas.findByText("Kurt");
  },
};

export const BorrowedHats: Story = {
  render: () => (
    <Box
      sx={{ display: "flex", gap: 3, alignItems: "flex-end", flexWrap: "wrap" }}
    >
      {[
        { id: "hat", label: "Hat" },
        { id: "turban", label: "Turban" },
        { id: "winterHat1", label: "Bobble" },
        { id: "winterHat03", label: "Beanie" },
        { id: "winterHat04", label: "Cap" },
      ].map((a) => (
        <PixelSpriteMascot
          key={a.id}
          seed="student-abc-123"
          stage={4}
          size={96}
          accessory={a.id}
          label={a.label}
          tooltip={`Mascot borrowed: ${a.label}`}
        />
      ))}
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Hat");
    await canvas.findByText("Cap");
  },
};

export const BorrowedAcrossStages: Story = {
  render: () => (
    <Box
      sx={{ display: "flex", gap: 3, alignItems: "flex-end", flexWrap: "wrap" }}
    >
      {[1, 2, 3, 4, 5].map((stage) => (
        <PixelSpriteMascot
          key={stage}
          seed="student-abc-123"
          stage={stage}
          size={48 + stage * 12}
          accessory="sunglasses"
          label={`Stage ${stage}`}
          tooltip={`Borrowed sunglasses (stage ${stage})`}
        />
      ))}
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Stage 1");
    await canvas.findByText("Stage 5");
  },
};
