import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PageHintView } from "./PageHintView";

const meta: Meta<typeof PageHintView> = {
  title: "🧭 Onboarding/Page Hint",
  component: PageHintView,
  parameters: {
    minimalProviders: true,
    layout: "padded",
    docs: {
      description: {
        component:
          "First-visit hint shown at the top of a page's main content. Users can run an action, dismiss the hint, or opt out of all hints.",
      },
    },
  },
  args: {
    title: "Set up your first class",
    body: "Create a section, then share its join code so your students can enroll.",
    actions: [{ id: "createSection", label: "Create a section" }],
    dismissLabel: "Dismiss this tip",
    optOutLabel: "Don't show tips",
    onAction: fn(),
    onDismiss: fn(),
    onOptOut: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof PageHintView>;

export const InstructorNextStep: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Create a section" }),
    );
    expect(args.onAction).toHaveBeenCalledWith("createSection");
  },
};

export const LearnerJoinClass: Story = {
  args: {
    title: "Join your first class",
    body: "Enter the join code from your instructor to see your assigned work here.",
    actions: [{ id: "joinClass", label: "Join a class" }],
  },
};

export const InformationOnly: Story = {
  args: {
    title: "Section leaderboard",
    body: "Rankings come from the XP earned in each section.",
    actions: [],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Don't show tips" }),
    );
    expect(args.onOptOut).toHaveBeenCalled();
  },
};

export const Dismissible: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Dismiss this tip" }),
    );
    expect(args.onDismiss).toHaveBeenCalled();
  },
};
