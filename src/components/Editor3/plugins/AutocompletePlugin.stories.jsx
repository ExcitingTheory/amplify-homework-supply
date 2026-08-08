/**
 * @fileoverview Storybook stories for AutocompletePlugin
 * Demonstrates autocomplete suggestions functionality in editable mode
 */

import React from "react";
import { expect } from "storybook/test";
import { within, waitFor } from "storybook/test";
import { userEvent } from "storybook/test";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";

import AutocompletePlugin from "./AutocompletePlugin";
import { AutocompleteProvider } from "../context/SharedAutocompleteContext";
import { AutocompleteNode } from "../components/AutocompleteNode";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import {
  seedMockUnit,
  clearMockData,
} from "../../../../.storybook/__mocks__/aws-amplify-data";

export default {
  title: "✏️ Lesson Editor/Interactions/Autocomplete",
  component: AutocompletePlugin,
  loaders: [
    async () => {
      clearMockData();
      seedMockUnit({
        id: "autocomplete-story-unit",
        name: "Autocomplete Story Unit",
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
    unitId: "autocomplete-story-unit",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

const EditableTemplate = ({ editorState }) => {
  const initialConfig = {
    namespace: "AutocompletePluginDemo",
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
      AutocompleteNode,
    ],
  };

  return (
    <AutocompleteProvider>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <h2>Autocomplete Plugin - Editable Mode</h2>
          <p style={{ color: "#666", marginBottom: "10px" }}>
            Start typing words like "information", "available", or "copyright"
            to see autocomplete suggestions.
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
                  Start typing to see autocomplete suggestions...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutocompletePlugin />
          </div>
        </div>
      </LexicalComposer>
    </AutocompleteProvider>
  );
};

const sampleAutocompleteState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Autocomplete Demo",
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
            text: "Try typing partial words to see suggestions appear. Supported words include: information, available, copyright.",
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
};

export const EditableEmpty = {
  render: () => <EditableTemplate editorState={null} />,
  parameters: {
    docs: {
      description: {
        story:
          "Type text to trigger autocomplete suggestions based on the vocabulary in the dictionary.",
      },
    },
  },
};

export const EditableWithInstructions = {
  render: () => <EditableTemplate editorState={sampleAutocompleteState} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the editor to render with instructions
    await waitFor(
      () => {
        expect(canvas.getByText(/Autocomplete Demo/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Click into the editor to focus it
    const editable = canvas.getByRole("textbox");
    await userEvent.click(editable);

    // Type a partial word to trigger autocomplete suggestions
    await userEvent.type(editable, " info");
  },
  parameters: {
    docs: {
      description: {
        story:
          "Editor pre-filled with instructions. A partial word is typed via the play function to trigger autocomplete suggestions.",
      },
    },
  },
};
