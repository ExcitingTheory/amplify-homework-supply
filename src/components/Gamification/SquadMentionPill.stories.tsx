import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import { SquadMentionPill, renderSquadMentions } from "./SquadMentionPill";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

const meta: Meta<typeof SquadMentionPill> = {
  title: "🏆 Gamification/Squads & Teams/Squad Mention Pill",
  component: SquadMentionPill,
  parameters: {
    // Pure presentational component — skip the app context/subscription stack.
    minimalProviders: true,
  },
  args: {
    squadId: "squad-alpha-001",
    squadName: "Iron Dragons",
    totalXP: 4250,
    size: "small",
  },
};

export default meta;
type Story = StoryObj<typeof SquadMentionPill>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Iron Dragons");
  },
};

export const Medium: Story = {
  args: { size: "medium" },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Iron Dragons");
  },
};

export const WithSvgCrest: Story = {
  args: {
    crestSvg:
      '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#2196F3"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">⚔</text></svg>',
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText("Iron Dragons");
    expect(canvasElement.querySelector("svg")).not.toBeNull();
  },
};

export const Clickable: Story = {
  args: {
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Iron Dragons"));
    expect(args.onClick).toHaveBeenCalledWith("squad-alpha-001");
  },
};

export const MultipleInline: Story = {
  render: () => (
    <Typography
      variant="body1"
      component="div"
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}
    >
      The battle between{" "}
      <SquadMentionPill
        squadId="squad-1"
        squadName="Iron Dragons"
        totalXP={4250}
      />{" "}
      and{" "}
      <SquadMentionPill
        squadId="squad-2"
        squadName="Pixel Wolves"
        totalXP={3980}
      />{" "}
      rages on!
    </Typography>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Iron Dragons");
    await canvas.findByText("Pixel Wolves");
  },
};

export const ParsedFromTemplate: Story = {
  render: () => {
    const template =
      "The {{@squad:squad-1:Iron Dragons}} defeated the {{@squad:squad-2:Pixel Wolves}} in an epic showdown!";
    const squads = [
      { id: "squad-1", name: "Iron Dragons", totalXP: 4250 },
      { id: "squad-2", name: "Pixel Wolves", totalXP: 3980 },
    ];
    const rendered = renderSquadMentions(template, { squads });

    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Template:
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
          >
            {template}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Rendered:
          </Typography>
          <Typography
            variant="body1"
            component="div"
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {rendered}
          </Typography>
        </Box>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Rendered pills (exact match avoids the raw template string)
    await canvas.findByText("Iron Dragons");
    await canvas.findByText("Pixel Wolves");
  },
};
