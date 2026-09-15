/**
 * @fileoverview Storybook stories for ToolCallPreview component
 *
 * Demonstrates AI tool call preview functionality with:
 * - Different tool types (search, create, update, delete)
 * - Various states (pending, executing, executed, error)
 * - Parameter editing workflows
 * - Confirmation/cancellation interactions
 *
 * @module ChatSidebar/ToolCallPreview.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, expect, within, userEvent } from "storybook/test";
import ToolCallPreview from "./ToolCallPreview";
import { toolDefinitions } from "../../utils/chatTools";

const meta: Meta<typeof ToolCallPreview> = {
  title: "💬 AI Assistant/Components/Tool Call Preview",
  component: ToolCallPreview,
  parameters: {
    layout: "padded",
  },
  args: {
    onConfirm: fn(),
    onCancel: fn(),
    onEdit: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ToolCallPreview>;

// Find tool definitions for stories — extract .function and cast to match ToolCallPreviewProps.toolDefinition shape
type ToolDef = NonNullable<
  React.ComponentProps<typeof ToolCallPreview>["toolDefinition"]
>;
const searchContentDef = toolDefinitions.find(
  (t) => t.function.name === "search_content",
)?.function as ToolDef | undefined;
const createSectionDef = toolDefinitions.find(
  (t) => t.function.name === "create_section",
)?.function as ToolDef | undefined;
const generateContentDef = toolDefinitions.find(
  (t) => t.function.name === "generate_unit_content",
)?.function as ToolDef | undefined;

export const SearchContentPending: Story = {
  args: {
    toolName: "search_content",
    toolCallId: "call_abc123",
    parameters: {
      query: "Japanese particles",
      type: "all",
      limit: 10,
    },
    toolDefinition: searchContentDef,
    state: "pending",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/search content/i);
    await canvas.findByText("query");
    const execBtn = canvasElement.querySelector(
      ".MuiButton-containedPrimary",
    ) as HTMLElement;
    await userEvent.click(execBtn);
    expect(args.onConfirm).toHaveBeenCalled();
  },
};

export const CreateSectionPending: Story = {
  args: {
    toolName: "create_section",
    toolCallId: "call_def456",
    parameters: {
      name: "Japanese 101 - Fall 2026",
      description: "Beginner Japanese language course",
      learner: "fall2026-jpn101",
    },
    toolDefinition: createSectionDef,
    state: "pending",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/create section/i);
    const cancelBtn = canvasElement.querySelector(
      ".MuiButton-outlined",
    ) as HTMLElement;
    await userEvent.click(cancelBtn);
    expect(args.onCancel).toHaveBeenCalled();
  },
};

export const GenerateContentPending: Story = {
  args: {
    toolName: "generate_unit_content",
    toolCallId: "call_ghi789",
    parameters: {
      contentType: "explanation",
      topic: "Japanese particles (は, が, を)",
      instructions: "Include examples for each particle with translations",
      includeMarkdown: true,
    },
    toolDefinition: generateContentDef,
    state: "pending",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/generate unit content/i);
    const editBtn = canvasElement.querySelector(
      ".MuiIconButton-colorPrimary",
    ) as HTMLElement;
    await userEvent.click(editBtn);
    const inputs = await canvas.findAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  },
};

export const ToolExecuting: Story = {
  args: {
    toolName: "search_content",
    toolCallId: "call_exec123",
    parameters: {
      query: "vocabulary about food",
      type: "words",
      limit: 5,
    },
    toolDefinition: searchContentDef,
    state: "executing",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/search content/i);
    // Executing state shows no confirm button
    expect(
      canvasElement.querySelector(".MuiButton-containedPrimary"),
    ).toBeNull();
  },
};

export const ToolExecuted: Story = {
  args: {
    toolName: "create_section",
    toolCallId: "call_done456",
    parameters: {
      name: "Advanced Japanese",
      description: "Advanced level course",
    },
    toolDefinition: createSectionDef,
    state: "executed",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/create section/i);
    expect(
      canvasElement.querySelector(".MuiButton-containedPrimary"),
    ).toBeNull();
  },
};

export const ToolError: Story = {
  args: {
    toolName: "create_unit",
    toolCallId: "call_err789",
    parameters: {
      name: "", // Empty name should trigger error
      description: "Test unit",
    },
    state: "error",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/create unit/i);
  },
};

export const CompactView: Story = {
  args: {
    toolName: "add_timer_to_unit",
    toolCallId: "call_compact",
    parameters: {
      unitId: "unit-123",
      seconds: 1800,
    },
    state: "pending",
    compact: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/add timer to unit/i);
    const summary = canvasElement.querySelector(
      ".MuiAccordionSummary-root",
    ) as HTMLElement;
    // Compact starts collapsed; clicking the summary expands it
    expect(summary.getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(summary);
    expect(summary.getAttribute("aria-expanded")).toBe("true");
  },
};

export const AllToolTypes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <ToolCallPreview
        toolName="search_content"
        toolCallId="call_1"
        parameters={{ query: "test", type: "all" }}
        toolDefinition={searchContentDef}
        state="pending"
      />
      <ToolCallPreview
        toolName="create_section"
        toolCallId="call_2"
        parameters={{ name: "Test Section" }}
        toolDefinition={createSectionDef}
        state="executing"
      />
      <ToolCallPreview
        toolName="generate_unit_content"
        toolCallId="call_3"
        parameters={{ contentType: "quiz", topic: "Verb conjugation" }}
        toolDefinition={generateContentDef}
        state="executed"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/search content/i);
    await canvas.findByText(/create section/i);
    await canvas.findByText(/generate unit content/i);
  },
};
