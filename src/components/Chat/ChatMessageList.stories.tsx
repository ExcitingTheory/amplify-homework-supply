import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatMessageList } from "./ChatMessageList";

const meta: Meta<typeof ChatMessageList> = {
  title: "💬 AI Assistant/Chat Message List",
  component: ChatMessageList,
  parameters: {
    minimalProviders: true,
    layout: "padded",
  },
};
export default meta;
type Story = StoryObj<typeof ChatMessageList>;

/** Transcript with text bubbles and tool-call widgets (input + result). */
export const Default: Story = {
  args: {
    isLoading: true,
    messages: [
      {
        id: "c1",
        role: "user",
        parts: [{ type: "text", text: "Add a quiz checking greetings." }],
      },
      {
        id: "c2",
        role: "assistant",
        parts: [
          { type: "text", text: "Searching your unit content first…" },
          {
            type: "tool-search_content",
            toolCallId: "call-1",
            state: "output-available",
            input: { query: "greetings vocabulary", limit: 5 },
            output: { success: true, resultCount: 2 },
          },
        ],
      },
      {
        id: "c3",
        role: "assistant",
        parts: [
          { type: "text", text: "Drafting the quiz now." },
          {
            type: "tool-create_quiz",
            toolCallId: "call-2",
            state: "input-available",
            input: {
              question: 'Which word means "hello"?',
              correctIndex: 0,
              options: 3,
            },
          },
        ],
      },
    ],
  },
};

/** Error state on a tool call. */
export const ToolError: Story = {
  args: {
    messages: [
      {
        id: "e1",
        role: "assistant",
        parts: [
          {
            type: "tool-generate_unit_content",
            toolCallId: "call-err",
            state: "output-error",
            input: { topic: "Kanji basics" },
            output: { error: "Model timed out after 30s" },
          },
        ],
      },
    ],
  },
};
