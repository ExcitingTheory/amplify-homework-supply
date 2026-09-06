import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DiceBearAvatar, getStyleTierStatus } from "./DiceBearAvatar";
import type { AvatarStyleTier } from "./DiceBearAvatar";
import { expect, within } from "storybook/test";

const meta: Meta<typeof DiceBearAvatar> = {
  title: "🏆 Gamification/Avatars & Cosmetics/DiceBear Avatar",
  component: DiceBearAvatar,
};
export default meta;

type Story = StoryObj<typeof DiceBearAvatar>;

export const Default: Story = {
  args: { seed: "student-123", size: 64 },
  play: async ({ canvasElement }) => {
    // Avatar renders an MUI Avatar root or an img/svg element
    const avatar =
      canvasElement.querySelector(".MuiAvatar-root") ||
      canvasElement.querySelector("img") ||
      canvasElement.querySelector("svg");
    expect(avatar).not.toBeNull();
  },
};

export const AllStyles: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      {(["simple", "detailed", "toonhead"] as AvatarStyleTier[]).map(
        (style) => (
          <Stack key={style} alignItems="center" spacing={0.5}>
            <DiceBearAvatar seed="demo-user" style={style} size={64} />
            <Typography variant="caption">{style}</Typography>
          </Stack>
        ),
      )}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Style labels render
    await canvas.findByText("simple");
    await canvas.findByText("detailed");
    await canvas.findByText("toonhead");
  },
};

export const LockedVsUnlocked: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <DiceBearAvatar seed="user-1" size={48} label="Unlocked" />
      <DiceBearAvatar seed="user-1" size={48} label="Locked" locked />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    // Both avatars render
    const avatars = canvasElement.querySelectorAll(".MuiAvatar-root");
    expect(avatars.length).toBe(2);
    // Locked avatar has grayscale filter or lock overlay
    const lockedAvatar = avatars[1];
    const lockedStyle = window.getComputedStyle(lockedAvatar);
    const hasGrayscale =
      lockedStyle.filter?.includes("grayscale") ||
      lockedAvatar.querySelector("[data-testid]") !== null ||
      lockedAvatar.innerHTML.includes("lock");
    expect(
      hasGrayscale || lockedAvatar.getAttribute("style")?.includes("grayscale"),
    ).toBeTruthy();
  },
};

export const TierProgression: Story = {
  render: () => {
    const tiers = getStyleTierStatus(4);
    return (
      <Stack direction="row" spacing={2} alignItems="center">
        {tiers.map((t) => (
          <Stack key={t.tier} alignItems="center" spacing={0.5}>
            <DiceBearAvatar
              seed="progression"
              style={t.tier}
              size={48}
              locked={!t.unlocked}
            />
            <Typography variant="caption">
              {t.displayName} {t.unlocked ? "✓" : "🔒"}
            </Typography>
          </Stack>
        ))}
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tiers = getStyleTierStatus(4);
    // Each tier renders an avatar
    const avatars = canvasElement.querySelectorAll(".MuiAvatar-root");
    expect(avatars.length).toBe(tiers.length);
    // Tier 5 should be locked (level 4 unlocks up to tier 4)
    const lockedLabels = tiers.filter((t) => !t.unlocked);
    for (const locked of lockedLabels) {
      await canvas.findByText(new RegExp(`${locked.displayName}.*🔒`));
    }
  },
};

export const DifferentSeeds: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      {["alice", "bob", "charlie", "diana", "eve"].map((name) => (
        <DiceBearAvatar key={name} seed={name} size={40} label={name} />
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    // 5 different seeds each produce an avatar element
    const avatars = canvasElement.querySelectorAll(".MuiAvatar-root");
    expect(avatars.length).toBe(5);
  },
};
