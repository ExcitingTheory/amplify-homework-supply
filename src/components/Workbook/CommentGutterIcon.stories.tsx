import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { CommentGutterIcon } from "./CommentGutterIcon";

const meta: Meta<typeof CommentGutterIcon> = {
  title: "📓 Workbook/Comment Gutter Icon",
  component: CommentGutterIcon,
};
export default meta;

type Story = StoryObj<typeof CommentGutterIcon>;

export const NoComments: Story = {
  args: {
    commentCount: 0,
    unresolvedCount: 0,
    onClick: () => console.log("open"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("button")).toBeTruthy();
  },
};

export const WithComments: Story = {
  args: {
    commentCount: 5,
    unresolvedCount: 3,
    onClick: () => console.log("open"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("button")).toBeTruthy();
    const canvas = within(canvasElement);
    await canvas.findByText("3");
  },
};

export const AllResolved: Story = {
  args: {
    commentCount: 4,
    unresolvedCount: 0,
    onClick: () => console.log("open"),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement).toBeTruthy();
  },
};
