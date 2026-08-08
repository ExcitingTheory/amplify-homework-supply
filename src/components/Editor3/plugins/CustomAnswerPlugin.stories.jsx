/**
 * @fileoverview Storybook stories for CustomAnswerPlugin
 * Demonstrates custom Q&A exercises in both editable and read-only modes
 */

import React from "react";
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

import CustomAnswerPlugin, {
  INSERT_CUSTOM_ANSWER_BLOCK_COMMAND,
  CustomAnswerNode,
} from "./CustomAnswerPlugin";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import { seedMockUnit } from "../../../../.storybook/__mocks__/aws-amplify-data";
import { expect } from 'storybook/test'

export default {
  title: "✏️ Lesson Editor/Content Blocks/Custom Answer",
  component: CustomAnswerPlugin,
  parameters: {
    layout: "fullscreen",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertCustomAnswerButton() {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.dispatchCommand(INSERT_CUSTOM_ANSWER_BLOCK_COMMAND, null);
  };

  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Custom Answer Block
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: "CustomAnswerPluginDemo",
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
      CustomAnswerNode,
    ],
  };

  // Use the preview's default unit ID
  seedMockUnit({
    id: "mock-unit-id",
    name: "CustomAnswer Story Unit",
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
    questionIDs: ["question-1", "question-2", "question-3"], // Link questions used in the custom answer blocks
    _version: 1,
    owner: "mock-user-sub",
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Custom Answer Plugin - Editable Mode</h2>
        {showInsertButton && <InsertCustomAnswerButton />}
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
                Enter text or insert custom answer fields...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <CustomAnswerPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: "CustomAnswerPluginDemo",
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
      CustomAnswerNode,
    ],
  };

  // Use the preview's default unit ID
  seedMockUnit({
    id: "mock-unit-id",
    name: "CustomAnswer Story Unit",
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
    questionIDs: ["question-1", "question-2", "question-3"], // Link questions used in the custom answer blocks
    _version: 1,
    owner: "mock-user-sub",
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Custom Answer Plugin - Read-Only Mode</h2>
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
          <CustomAnswerPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

const sampleCustomAnswerState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Custom Question Exercise",
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
            text: "Answer the following question:",
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
        type: "custom-answer",
        version: 1,
        ids: ["question-1", "question-2"],
        allowedInput: ["text", "audio"],
        promptMethod: ["text"],
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
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const EditableWithCustomAnswer = {
  render: () => <EditableTemplate editorState={sampleCustomAnswerState} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const ReadOnlyWithCustomAnswer = {
  render: () => <ReadOnlyTemplate editorState={sampleCustomAnswerState} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
