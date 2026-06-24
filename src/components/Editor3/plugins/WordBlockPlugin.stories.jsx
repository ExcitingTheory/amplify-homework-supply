/**
 * @fileoverview Storybook stories for WordBlockPlugin
 * Demonstrates vocabulary word blocks in both editable and read-only modes
 */

import React from "react";
import { within, waitFor } from "storybook/test";
import { expect } from "storybook/test";
import { userEvent } from "storybook/test";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { Button } from "@mui/material";

import WordBlockPlugin, {
  INSERT_WORD_BLOCK_COMMAND,
  WordBlockNode,
} from "./WordBlockPlugin";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import { UnitProvider } from "../../../context/unitContext";
import { seedMockUnit } from "../../../../.storybook/__mocks__/aws-amplify-data";
import { DictionaryProvider } from "../../../context/dictionaryContext";

export default {
  title: "✏️ Lesson Editor/Content Blocks/Word Block",
  component: WordBlockPlugin,
  parameters: {
    layout: "fullscreen",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertWordBlockButton() {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.dispatchCommand(INSERT_WORD_BLOCK_COMMAND, "sample-word-id");
  };

  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Sample Word Block
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: "WordBlockPluginDemo",
    theme: LanguageEditorTheme,
    onError,
    editable: true,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      WordBlockNode,
    ],
  };

  const unitId = "story-unit-id-" + Math.random();
  seedMockUnit({
    id: unitId,
    name: "WordBlock Story Unit",
    data: {
      root: {
        children: [],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    },
    _version: 1,
    owner: "mock-user-sub",
  });

  return (
    <UnitProvider id={unitId}>
      <DictionaryProvider>
        <LexicalComposer initialConfig={initialConfig}>
          <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h2>Word Block Plugin - Editable Mode</h2>
            {showInsertButton && <InsertWordBlockButton />}
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                minHeight: "400px",
                padding: "20px",
              }}
            >
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    style={{ outline: "none", minHeight: "350px" }}
                  />
                }
                placeholder={
                  <div
                    style={{
                      position: "absolute",
                      top: "20px",
                      left: "20px",
                      color: "#999",
                    }}
                  >
                    Enter text or insert word blocks...
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <WordBlockPlugin />
            </div>
          </div>
        </LexicalComposer>
      </DictionaryProvider>
    </UnitProvider>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: "WordBlockPluginDemo",
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    editorState: editorState ? JSON.stringify(editorState) : undefined,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      WordBlockNode,
    ],
  };

  const unitId = "story-unit-id-" + Math.random();
  seedMockUnit({
    id: unitId,
    name: "WordBlock Story Unit",
    data: {
      root: {
        children: [],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    },
    _version: 1,
    owner: "mock-user-sub",
  });

  return (
    <UnitProvider id={unitId}>
      <DictionaryProvider>
        <LexicalComposer initialConfig={initialConfig}>
          <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h2>Word Block Plugin - Read-Only Mode</h2>
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                minHeight: "400px",
                padding: "20px",
                backgroundColor: "#f5f5f5",
              }}
            >
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    style={{ outline: "none", minHeight: "350px" }}
                  />
                }
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <WordBlockPlugin />
            </div>
          </div>
        </LexicalComposer>
      </DictionaryProvider>
    </UnitProvider>
  );
};

const sampleWordBlockState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Vocabulary Word Example",
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
            text: "Below is a word block displaying vocabulary information:",
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
        type: "word-block",
        version: 1,
        wordID: "sample-word-id",
        format: "",
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} showInsertButton={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for insert button
    await waitFor(
      () => {
        const insertButton = canvas.getByRole("button", {
          name: /insert.*word/i,
        });
        expect(insertButton).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

export const EditableWithWordBlock = {
  render: () => <EditableTemplate editorState={sampleWordBlockState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for word block to render
    await waitFor(
      () => {
        expect(
          canvas.getByText(/Vocabulary Word Example/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify word block displays
    expect(canvas.getByText(/Below is a word block/i)).toBeInTheDocument();
  },
};

export const ReadOnlyWithWordBlock = {
  render: () => <ReadOnlyTemplate editorState={sampleWordBlockState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for word block in read-only mode
    await waitFor(
      () => {
        expect(
          canvas.getByText(/Vocabulary Word Example/i),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};
