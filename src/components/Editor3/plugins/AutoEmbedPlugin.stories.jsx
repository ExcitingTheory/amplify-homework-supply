/**
 * @fileoverview Storybook stories for AutoEmbedPlugin
 * Demonstrates automatic URL detection and embed suggestions
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

import AutoEmbedPlugin from "./AutoEmbedPlugin";
import YouTubePlugin, { YouTubeNode } from "./YouTubePlugin";
import AutoLinkPlugin from "./AutoLinkPlugin";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import {
  seedMockUnit,
  clearMockData,
} from "../../../../.storybook/__mocks__/aws-amplify-data";
import { expect } from 'storybook/test'

export default {
  title: "✏️ Lesson Editor/Workflow/Auto Embed",
  component: AutoEmbedPlugin,
  loaders: [
    async () => {
      clearMockData();
      seedMockUnit({
        id: "auto-embed-story-unit",
        name: "AutoEmbed Demo Unit",
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
    unitId: "auto-embed-story-unit",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

const EditableTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: "AutoEmbedPluginDemo",
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
      YouTubeNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Auto Embed Plugin - Editable Mode</h2>
        <p style={{ color: "#666", marginBottom: "10px" }}>
          Type or paste a YouTube URL (e.g.,
          https://www.youtube.com/watch?v=dQw4w9WgXcQ) to see auto-embed
          suggestions appear!
        </p>
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
                Paste a YouTube URL to see auto-embed in action...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoLinkPlugin />
          <YouTubePlugin />
          <AutoEmbedPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
};

const sampleAutoEmbedState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Auto Embed Demo",
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
            text: "Try pasting one of these YouTube URLs:",
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
                    text: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
                    text: "https://youtu.be/jNQXAC9IVRw",
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
          "Paste a YouTube URL and press Enter to automatically embed the video.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const EditableWithInstructions = {
  render: () => <EditableTemplate editorState={sampleAutoEmbedState} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
