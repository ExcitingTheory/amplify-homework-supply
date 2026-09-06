import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SquadMessagePanel } from "./SquadMessagePanel";
import { fn, expect, within } from "storybook/test";

const mockSquads = [
  { id: "squad-1", name: "Iron Dragons", totalXP: 4250, crestSvg: null },
  { id: "squad-2", name: "Pixel Wolves", totalXP: 3980, crestSvg: null },
  { id: "squad-3", name: "Code Serpents", totalXP: 3100, crestSvg: null },
  { id: "squad-4", name: "Binary Phoenixes", totalXP: 2750, crestSvg: null },
  { id: "squad-5", name: "Quantum Foxes", totalXP: 4100, crestSvg: null },
];

const meta: Meta<typeof SquadMessagePanel> = {
  title: "🏆 Gamification/Squads & Teams/Squad Message Panel",
  component: SquadMessagePanel,
  args: {
    squads: mockSquads,
    onSend: fn(),
    submitting: false,
  },
};

export default meta;
type Story = StoryObj<typeof SquadMessagePanel>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ironDragons = await canvas.findAllByText("Iron Dragons");
    expect(ironDragons.length).toBeGreaterThan(0);
    const pixelWolves = await canvas.findAllByText("Pixel Wolves");
    expect(pixelWolves.length).toBeGreaterThan(0);
  },
};

export const TwoSquads: Story = {
  args: {
    squads: mockSquads.slice(0, 2),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ironDragons = await canvas.findAllByText("Iron Dragons");
    expect(ironDragons.length).toBeGreaterThan(0);
    const pixelWolves = await canvas.findAllByText("Pixel Wolves");
    expect(pixelWolves.length).toBeGreaterThan(0);
    expect(canvas.queryAllByText("Code Serpents").length).toBe(0);
  },
};

export const Submitting: Story = {
  args: {
    submitting: true,
  },
  play: async ({ canvasElement }) => {
    expect(
      canvasElement.querySelector('[role="progressbar"], button[disabled]'),
    ).toBeInTheDocument();
  },
};
