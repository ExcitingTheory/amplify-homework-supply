/**
 * @fileoverview Storybook stories for CustomAIPlugin
 * Demonstrates AI-graded exercises in both editable and read-only modes
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

import CustomAIPlugin, {
  INSERT_CUSTOM_AI_BLOCK_COMMAND,
  CustomAINode,
} from "./CustomAIPlugin";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import { seedMockUnit } from "../../../../.storybook/__mocks__/aws-amplify-data";

export default {
  title: "✏️ Lesson Editor/Content Blocks/Custom AI",
  component: CustomAIPlugin,
  parameters: {
    layout: "fullscreen",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertCustomAIButton() {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.dispatchCommand(INSERT_CUSTOM_AI_BLOCK_COMMAND, []);
  };

  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert AI-Graded Exercise
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: "CustomAIPluginDemo",
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
      CustomAINode,
    ],
  };

  seedMockUnit({
    id: "mock-unit-id",
    name: "CustomAI Story Unit",
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
    questionIDs: ["question-1", "question-2", "question-3"],
    _version: 1,
    owner: "mock-user-sub",
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Custom AI Plugin - Editable Mode</h2>
        {showInsertButton && <InsertCustomAIButton />}
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
                Enter text or insert AI-graded exercises...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <CustomAIPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: "CustomAIPluginDemo",
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
      CustomAINode,
    ],
  };

  seedMockUnit({
    id: "mock-unit-id",
    name: "CustomAI Story Unit",
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
    questionIDs: ["question-1", "question-2", "question-3"],
    _version: 1,
    owner: "mock-user-sub",
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Custom AI Plugin - Read-Only (Student) Mode</h2>
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
          <CustomAIPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

// Sample editor state with a custom-ai block
const sampleCustomAIState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "AI-Graded Exercise",
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
            text: "Answer the following questions using AI-assisted grading:",
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
        type: "custom-ai",
        version: 1,
        ids: ["question-1", "question-2"],
        inputMode: "text",
        criteria:
          "Grade based on scientific accuracy and completeness. Award full marks for mentioning key concepts.",
        allowedInput: ["text", "audio"],
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

const sampleMultiInputState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Multi-Input AI Exercise",
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
        type: "custom-ai",
        version: 1,
        ids: ["question-1", "question-2", "question-3"],
        inputMode: "text",
        criteria:
          "Evaluate student drawings and written answers for understanding of cell biology concepts.",
        allowedInput: ["text", "audio", "drawing", "image"],
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

// ========== STORIES ==========

export const EmptyEditable = {
  render: () => <EditableTemplate showInsertButton={true} />,
  name: "Editor: Empty + Insert Button",
};

export const WithQuestions = {
  render: () => (
    <EditableTemplate
      editorState={sampleCustomAIState}
      showInsertButton={false}
    />
  ),
  name: "Editor: With Questions & Criteria",
};

export const StudentTextInput = {
  render: () => <ReadOnlyTemplate editorState={sampleCustomAIState} />,
  name: "Student: Text Input Mode",
};

export const StudentMultiInput = {
  render: () => <ReadOnlyTemplate editorState={sampleMultiInputState} />,
  name: "Student: All Input Modes",
};

export const EmptyBlock = {
  render: () => {
    const emptyState = {
      root: {
        children: [
          {
            type: "custom-ai",
            version: 1,
            ids: [],
            inputMode: "text",
            criteria: "",
            allowedInput: ["text"],
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
    return <EditableTemplate editorState={emptyState} showInsertButton={false} />;
  },
  name: "Editor: Empty Block (No Questions)",
};
