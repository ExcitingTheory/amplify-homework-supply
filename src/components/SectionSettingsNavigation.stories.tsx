import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { SectionSettingsNavigation } from "./SectionSettingsNavigation";

const meta = {
  title: "Components/SectionSettingsNavigation",
  component: SectionSettingsNavigation,
  args: { sectionId: "section-123" },
} satisfies Meta<typeof SectionSettingsNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settings: Story = {
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole("link");
    await expect(links[0]).toHaveAttribute("href", "/section/section-123/settings/ai");
    await expect(links[1]).toHaveAttribute("href", "/section/section-123/settings/gamification");
  },
};

export const BackToSection: Story = {
  args: { backToSection: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link"))
      .toHaveAttribute("href", "/section/section-123");
  },
};

export const Localized: Story = {
  args: { backToSection: true },
  globals: { translationLanguage: "fr" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link"))
      .toHaveAttribute("href", "/fr/section/section-123");
  },
};
