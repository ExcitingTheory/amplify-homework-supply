import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CampaignBriefing } from "./CampaignBriefing";
import { expect, within } from "storybook/test";

const meta: Meta<typeof CampaignBriefing> = {
  title: "🏆 Gamification/Squads & Teams/Campaign Briefing",
  component: CampaignBriefing,
};
export default meta;

type Story = StoryObj<typeof CampaignBriefing>;

export const Default: Story = {
  args: {
    title: "Operation Syntax Storm",
    setting:
      "In the year 2142, the world runs on code. The Global Compiler has malfunctioned, and only your cohort can debug reality itself.",
    stakes:
      "If the compiler isn't fixed in time, all applications will crash — and civilization with them.",
    chapterText:
      "Chapter 3: You've reached the Memory Leak Caverns. The garbage collector has gone rogue. Debug the reference cycles to proceed.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Operation Syntax Storm/);
    await canvas.findByText(/year 2142/);
  },
};

export const Loading: Story = {
  args: {
    title: "",
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector(".MuiSkeleton-root")).toBeTruthy();
  },
};

export const Compact: Story = {
  args: {
    title: "Operation Syntax Storm",
    setting: "A world that runs on code.",
    chapterText:
      "Navigate the Memory Leak Caverns and fix the garbage collector.",
    compact: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Memory Leak Caverns/);
  },
};

export const SettingOnly: Story = {
  args: {
    title: "Web Dev Quest",
    setting:
      "Welcome to the Digital Frontier — a virtual world where every website is a kingdom and every bug is a dragon.",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Web Dev Quest/);
    await canvas.findByText(/Digital Frontier/);
  },
};

export const WithEmbeddedContent: Story = {
  args: {
    title: "Operation Syntax Storm",
    setting: "In the year 2142, the world runs on code.",
    chapterText: "Chapter 3: The Memory Leak Caverns",
    contentJson: JSON.stringify({
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: "This Lexical content is embedded inside the campaign card via NarrativeReader. It supports full workbook blocks — quizzes, vocab, media, etc.",
                type: "text",
                version: 1,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    }),
    contentMaxHeight: 300,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Operation Syntax Storm/);
    await canvas.findByText(/Memory Leak Caverns/);
  },
};
