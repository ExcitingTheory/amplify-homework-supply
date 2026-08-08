/**
 * @fileoverview Storybook stories for DragDropPastePlugin
 * Demonstrates drag-and-drop file upload and paste functionality
 */

import React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";

import DragDropPastePlugin from "./DragDropPastePlugin";
import ImagesPlugin from "./ImagesPlugin";
import PlaylistPlugin, { PlaylistNode } from "./PlaylistPlugin";
import { ImageNode } from "../components/ImageNode";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import {
  seedMockUnit,
  clearMockData,
} from "../../../../.storybook/__mocks__/aws-amplify-data";

export default {
  title: "✏️ Lesson Editor/Interactions/Drag Drop Paste",
  component: DragDropPastePlugin,
  loaders: [
    async () => {
      clearMockData();
      seedMockUnit({
        id: "drag-drop-story-unit",
        name: "DragDropPaste Demo",
        data: JSON.stringify({
          root: {
            children: [],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
          },
        }),
        _version: 1,
        owner: "mock-user-sub",
      });
    },
  ],
  parameters: {
    layout: "fullscreen",
    unitId: "drag-drop-story-unit",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

const EditableTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: "DragDropPastePluginDemo",
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
      ImageNode,
      PlaylistNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Drag & Drop / Paste Plugin - Editable Mode</h2>
        <p style={{ color: "#666", marginBottom: "10px" }}>
          Drag and drop image or audio files into the editor, or paste them from
          clipboard. Supported formats: Images (PNG, JPEG, GIF, WebP), Audio
          (MP3)
        </p>
        <div
          style={{
            border: "2px dashed #ccc",
            borderRadius: "4px",
            minHeight: "400px",
            padding: "20px",
            backgroundColor: "#fafafa",
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
                Drag and drop files here or paste from clipboard...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <DragDropPastePlugin />
          <ImagesPlugin captionsEnabled={false} />
          <PlaylistPlugin />
        </div>
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#e3f2fd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <strong>Note:</strong> In Storybook, AWS S3 upload functionality is
          mocked. In production, files are uploaded to AWS S3 with progress
          tracking.
        </div>
      </div>
    </LexicalComposer>
  );
};

const sampleDragDropState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Drag & Drop File Upload Demo",
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
            text: "This plugin handles file uploads via:",
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
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Drag and drop from file explorer",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "listitem",
                version: 1,
                value: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Paste from clipboard (Ctrl/Cmd+V)",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "listitem",
                version: 1,
                value: 2,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: "normal",
                    style: "",
                    text: "Automatic upload to AWS S3",
                    type: "text",
                    version: 1,
                  },
                ],
                direction: "ltr",
                format: "",
                indent: 0,
                type: "listitem",
                version: 1,
                value: 3,
              },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "list",
            version: 1,
            listType: "bullet",
            start: 1,
            tag: "ul",
          },
        ],
        direction: null,
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
};

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} />,
  parameters: {
    docs: {
      description: {
        story:
          "Drag and drop image files or paste them from your clipboard to insert images.",
      },
    },
  },
};

export const EditableWithInstructions = {
  render: () => <EditableTemplate editorState={sampleDragDropState} />,
};
