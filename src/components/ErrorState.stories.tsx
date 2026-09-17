import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "@mui/material/Button";
import { ErrorState } from "./ErrorState";

const meta = {
  title: "🧩 UI Components/State/ErrorState",
  component: ErrorState,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Review room not found",
    description:
      "This peer-review room may have closed or the link is out of date.",
    onRetry: () => {},
  },
};

export const WithoutRetry: Story = {
  args: {
    title: "Something went wrong",
    description: "We couldn't load this content. Please try again later.",
  },
};

export const CustomActions: Story = {
  args: {
    title: "Couldn't load leaderboard",
    description: "Check your connection and try again.",
    action: (
      <Button variant="contained" color="primary">
        Reload
      </Button>
    ),
    secondaryAction: <Button variant="text">Go back</Button>,
  },
};
