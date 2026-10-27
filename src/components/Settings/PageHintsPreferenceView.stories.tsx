import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PageHintsPreferenceView } from "./PageHintsPreferenceView";

const meta: Meta<typeof PageHintsPreferenceView> = {
  title: "⚙️ Settings/Page Hints Preference",
  component: PageHintsPreferenceView,
  parameters: { minimalProviders: true, layout: "padded" },
  args: {
    showTips: true,
    canReset: true,
    onShowTipsChange: fn(),
    onReset: fn(),
  },
};
export default meta;
type Story = StoryObj<typeof PageHintsPreferenceView>;

export const TipsOn: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("switch", { name: "Show page tips" }));
    expect(args.onShowTipsChange).toHaveBeenCalledWith(false);
    await userEvent.click(
      canvas.getByRole("button", { name: "Show tips again" }),
    );
    expect(args.onReset).toHaveBeenCalled();
  },
};

export const OptedOut: Story = {
  args: { showTips: false, canReset: true },
};

export const NothingToReset: Story = {
  args: { canReset: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByRole("button", { name: "Show tips again" }),
    ).toBeDisabled();
  },
};
