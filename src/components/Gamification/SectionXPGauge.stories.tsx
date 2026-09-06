import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionXPGauge } from "./SectionXPGauge";
import { action } from "storybook/actions";
import { expect, within } from "storybook/test";

const meta: Meta<typeof SectionXPGauge> = {
  title: "🏆 Gamification/XP & Progression/Section XP Gauge",
  component: SectionXPGauge,
  argTypes: {
    unitCount: { control: { type: "range", min: 1, max: 30, step: 1 } },
    desiredMaxLevel: { control: { type: "range", min: 2, max: 12, step: 1 } },
    showTuner: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof SectionXPGauge>;

export const FewUnits: Story = {
  args: {
    unitCount: 3,
    desiredMaxLevel: 6,
    showTuner: true,
    onApplyTuning: action("onApplyTuning"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/level/i);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const ModerateUnits: Story = {
  args: {
    unitCount: 8,
    desiredMaxLevel: 6,
    showTuner: true,
    onApplyTuning: action("onApplyTuning"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/level/i);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const ManyUnits: Story = {
  args: {
    unitCount: 15,
    desiredMaxLevel: 6,
    showTuner: true,
    onApplyTuning: action("onApplyTuning"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/level/i);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const CustomLevelConfig: Story = {
  args: {
    unitCount: 5,
    desiredMaxLevel: 10,
    xpConfig: {
      levelConfig: { maxLevel: 10, xpPerLevel: 100, levelScaling: 1.4 },
    },
    showTuner: true,
    onApplyTuning: action("onApplyTuning"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/level/i);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const WithMultipliers: Story = {
  args: {
    unitCount: 6,
    desiredMaxLevel: 6,
    xpConfig: {
      multipliers: {
        HOMEWORK_SUBMITTED: 2.0,
        PERFECT_SCORE: 1.5,
      },
    },
    showTuner: true,
    onApplyTuning: action("onApplyTuning"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/level/i);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const AllLevelsReachable: Story = {
  args: {
    unitCount: 20,
    desiredMaxLevel: 4,
    xpConfig: {
      levelConfig: { maxLevel: 4, xpPerLevel: 100, levelScaling: 1.2 },
    },
    showTuner: true,
    onApplyTuning: action("onApplyTuning"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/level/i);
    expect(matches.length).toBeGreaterThan(0);
  },
};

export const NoTuner: Story = {
  args: {
    unitCount: 5,
    desiredMaxLevel: 6,
    showTuner: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const matches = await canvas.findAllByText(/level/i);
    expect(matches.length).toBeGreaterThan(0);
  },
};
