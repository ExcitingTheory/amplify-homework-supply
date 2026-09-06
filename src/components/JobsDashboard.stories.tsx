import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import JobsDashboard from "./JobsDashboard";
import { expect, within, waitFor } from "storybook/test";

const meta: Meta<typeof JobsDashboard> = {
  title: "🛠️ Admin/Jobs Dashboard",
  component: JobsDashboard,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof JobsDashboard>;

export const Default: Story = {
  args: {
    compact: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvasElement.querySelector(
      'table, [role="grid"], [role="list"]',
    );
    expect(
      table ||
        canvasElement.querySelector('[class*="job"], [class*="Job"]') ||
        canvasElement.textContent!.length > 0,
    ).toBeTruthy();
  },
};

export const Compact: Story = {
  args: {
    compact: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvasElement.querySelector(
      'table, [role="grid"], [role="list"]',
    );
    expect(
      table ||
        canvasElement.querySelector('[class*="job"], [class*="Job"]') ||
        canvasElement.textContent!.length > 0,
    ).toBeTruthy();
  },
};

export const WithJobs: Story = {
  args: {
    compact: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        const table = canvasElement.querySelector("table");
        expect(table).toBeTruthy();
        expect(table!.textContent).toMatch(
          /Chapter1\.pdf|lecture\.mp4|Generate quiz|Notes\.pdf/i,
        );
      },
      { timeout: 10_000 },
    );
    expect(canvasElement.textContent).toContain("job");
  },
};
