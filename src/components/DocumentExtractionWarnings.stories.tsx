import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import DocumentExtractionWarnings from "./DocumentExtractionWarnings";

const meta = {
  title: "Content Management/Document Extraction Warnings",
  component: DocumentExtractionWarnings,
} satisfies Meta<typeof DocumentExtractionWarnings>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NeedsHumanReview: Story = {
  args: { metadata: { analysis: {
    reviewWarnings: [
      'Page 2: vocabulary "Lysosomes" (definition): answer_not_in_source',
      "Page 2: Review missing source coverage: Cell membranes control transport.",
    ],
    reviewWarningCount: 2,
  } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Lysosomes");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
  },
};

export const NoWarnings: Story = {
  args: { metadata: { analysis: { reviewWarnings: [], reviewWarningCount: 0 } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("alert")).not.toBeInTheDocument();
  },
};
