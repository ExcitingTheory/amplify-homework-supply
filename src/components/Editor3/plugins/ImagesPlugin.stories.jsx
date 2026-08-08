/**
 * @fileoverview Storybook stories for ImagesPlugin
 * Demonstrates image embedding in both editable and read-only modes
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

import ImagesPlugin, { INSERT_IMAGE_COMMAND } from "./ImagesPlugin";
import { ImageNode } from "../components/ImageNode";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import {
  seedMockUnit,
  clearMockData,
} from "../../../../.storybook/__mocks__/aws-amplify-data";
import {
  MOCK_IMAGE_URL_2,
  MOCK_IMAGE_URL_3,
} from "../../../../.storybook/__mocks__/media";
import { expect } from 'storybook/test'

export default {
  title: "✏️ Lesson Editor/Media/Images",
  component: ImagesPlugin,
  loaders: [
    async () => {
      clearMockData();
      seedMockUnit({
        id: "images-plugin-story-unit",
        name: "Images Story Unit",
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
    unitId: "images-plugin-story-unit",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertImageButton() {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      altText: "Sample Image",
      src: MOCK_IMAGE_URL_2,
    });
  };

  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert Sample Image
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const initialConfig = {
    namespace: "ImagesPluginDemo",
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
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Images Plugin - Editable Mode</h2>
        {showInsertButton && <InsertImageButton />}
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
                Enter text or insert images...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ImagesPlugin captionsEnabled={false} />
        </div>
      </div>
    </LexicalComposer>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: "ImagesPluginDemo",
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
      ImageNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Images Plugin - Read-Only Mode</h2>
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
          <ImagesPlugin captionsEnabled={false} />
        </div>
      </div>
    </LexicalComposer>
  );
};

const sampleImageState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Image Example",
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
            text: "Below is an embedded image:",
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
        type: "image",
        version: 1,
        src: MOCK_IMAGE_URL_3,
        altText: "Sample image placeholder",
        width: 400,
        height: 300,
        maxWidth: 500,
        showCaption: false,
        caption: {
          editorState: {
            root: {
              children: [],
              direction: null,
              format: "",
              indent: 0,
              type: "root",
              version: 1,
            },
          },
        },
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

export const EditableWithImage = {
  render: () => <EditableTemplate editorState={sampleImageState} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};

export const ReadOnlyWithImage = {
  render: () => <ReadOnlyTemplate editorState={sampleImageState} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.innerHTML.length).toBeGreaterThan(0)
  },
};
