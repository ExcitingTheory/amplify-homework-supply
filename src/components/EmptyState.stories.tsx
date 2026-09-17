import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Button from "@mui/material/Button";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AddIcon from "@mui/icons-material/Add";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "🧩 UI Components/State/EmptyState",
  component: EmptyState,
  parameters: { layout: "centered" },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "No squads yet",
    description:
      "Join or create a squad to compete on the leaderboard and earn team XP.",
  },
};

export const WithAction: Story = {
  args: {
    icon: <GroupsOutlinedIcon fontSize="inherit" />,
    title: "No squads yet",
    description: "Create your first squad to start earning team XP together.",
    action: (
      <Button variant="contained" startIcon={<AddIcon />}>
        Create squad
      </Button>
    ),
    secondaryAction: <Button variant="outlined">Browse squads</Button>,
  },
};

export const Dense: Story = {
  args: {
    dense: true,
    title: "Nothing here yet",
    description: "Completed items will show up in this panel.",
  },
};
