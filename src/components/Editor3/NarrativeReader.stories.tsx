import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NarrativeReader } from "./NarrativeReader";
import { expect, within } from "storybook/test";

const meta: Meta<typeof NarrativeReader> = {
  title: "✏️ Lesson Editor/Narrative Reader",
  component: NarrativeReader,
  parameters: {
    docs: {
      description: {
        component:
          "Standalone read-only Lexical renderer. Takes serialized JSON (same format as Unit.data) and renders it with all interactive plugins — quizzes, vocab, media, etc.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NarrativeReader>;

/**
 * Minimal Lexical JSON with a paragraph and heading.
 * This is the same shape that `Unit.data` stores.
 */
const sampleContentJson = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Welcome to the Narrative",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "This content is rendered by the NarrativeReader — a lightweight, read-only Lexical viewer that supports all interactive block types (quizzes, vocab, meaning association, etc.) without a toolbar or grading system.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 1,
            mode: "normal",
            style: "",
            text: "Use it to embed workbook content into campaign narratives.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

export const Default: Story = {
  args: {
    contentJson: sampleContentJson,
  },
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector("[data-lexical-editor]");
    expect(editor).not.toBeNull();
    expect(editor?.getAttribute("contenteditable")).toBe("false");
    const canvas = within(canvasElement);
    expect(canvas.getByText("Welcome to the Narrative")).toBeTruthy();
  },
};

export const WithMaxHeight: Story = {
  args: {
    contentJson: sampleContentJson,
    maxHeight: 200,
    ariaLabel: "Scrollable narrative",
  },
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector("[data-lexical-editor]");
    expect(editor).not.toBeNull();
    expect(editor?.getAttribute("contenteditable")).toBe("false");
  },
};

export const CustomLabel: Story = {
  args: {
    contentJson: sampleContentJson,
    ariaLabel: "Chapter 5: The Final Debug",
  },
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector("[data-lexical-editor]");
    expect(editor).not.toBeNull();
    expect(editor?.getAttribute("contenteditable")).toBe("false");
  },
};
