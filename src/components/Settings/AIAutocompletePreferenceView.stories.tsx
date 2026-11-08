import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { AIAutocompletePreferenceView } from "./AIAutocompletePreferenceView";

const meta = {
  title: "Settings/AI Autocomplete",
  component: AIAutocompletePreferenceView,
  args: { enabled: true, onChange: () => {} },
} satisfies Meta<typeof AIAutocompletePreferenceView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {
  render: function Preference(args) {
    const [enabled, setEnabled] = React.useState(args.enabled);
    return <AIAutocompletePreferenceView {...args} enabled={enabled} onChange={setEnabled} />;
  },
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByRole("switch", { name: "Enable AI autocomplete" });
    await expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await expect(toggle).not.toBeChecked();
  },
};
export const Disabled: Story = { args: { enabled: false } };
export const Saving: Story = { args: { disabled: true } };
export const SaveError: Story = { args: { error: "Unable to save your autocomplete preference. Please try again." } };
