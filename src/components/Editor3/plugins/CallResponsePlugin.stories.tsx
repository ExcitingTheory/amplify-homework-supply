import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Button } from "@mui/material";
import UnitContext from "../../../context/unitContext";
import type { UnitContextValue } from "../../../context/unitContext";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import CallResponsePlugin, {
  CallResponseNode,
  INSERT_CALL_RESPONSE_COMMAND,
} from "./CallResponsePlugin";

const unitContext = {
  unit: { id: "call-response-authoring-unit" },
  grade: { data: {} },
  saveGrade: () => undefined,
  session: { username: "instructor@example.com" },
  questionBank: {
    "question-1": {
      id: "question-1",
      prompt: "What is the planet of The Magus?",
      answer: "Mercury",
      metadata: JSON.stringify({
        card: "trump-i-the-magus",
        field: "planet",
        accept: ["Hermes"],
      }),
    },
    "question-2": {
      id: "question-2",
      prompt: "What is the Hebrew letter of The Magus?",
      answer: "Beth",
      metadata: JSON.stringify({
        card: "trump-i-the-magus",
        field: "hebrewLetter",
        accept: [],
      }),
    },
  },
} as unknown as UnitContextValue;

function InsertButton() {
  const [editor] = useLexicalComposerContext();
  return (
    <Button
      variant="contained"
      onClick={() => editor.dispatchCommand(INSERT_CALL_RESPONSE_COMMAND, undefined)}
    >
      Insert call and response
    </Button>
  );
}

function AuthoringHarness() {
  return (
    <UnitContext.Provider value={unitContext}>
      <LexicalComposer
        initialConfig={{
          namespace: "CallResponseAuthoring",
          theme: LanguageEditorTheme,
          onError: (error: Error) => {
            throw error;
          },
          editable: true,
          nodes: [CallResponseNode],
        }}
      >
        <InsertButton />
        <RichTextPlugin
          contentEditable={<ContentEditable aria-label="Unit content" />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <CallResponsePlugin />
      </LexicalComposer>
    </UnitContext.Provider>
  );
}

const meta = {
  title: "✏️ Lesson Editor/Content Blocks/Call Response Authoring",
  component: AuthoringHarness,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AuthoringHarness>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GenerateCuesFromQuestions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Insert call and response" }),
    );
    await expect(
      await canvas.findByText("Edit call-and-response script"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Generate audio" }),
    ).toBeDisabled();

    await userEvent.click(
      canvas.getByRole("combobox", { name: "Generate cues from questions" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByText("What is the planet of The Magus?"),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Add selected questions as cues" }),
    );

    await expect(await canvas.findByText("Cue 1: Prompt")).toBeInTheDocument();
    await expect(canvas.getByText("Cue 2: Response")).toBeInTheDocument();
    await expect(canvas.getByText("Cue 3: Answer")).toBeInTheDocument();
    // Mercury is both the expected response and the spoken answer text.
    await expect(canvas.getAllByDisplayValue("Mercury")).toHaveLength(2);
    await expect(canvas.getByDisplayValue("Hermes")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Generate audio" }),
      ).toBeEnabled(),
    );
  },
};

export const PreviewDraftWithoutSaving: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Insert call and response" }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Add question and response" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Preview" }));
    await expect(
      await canvas.findByRole("button", { name: "Start call and response" }),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Hide preview" }));
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Start call and response" }),
      ).not.toBeInTheDocument(),
    );
  },
};
