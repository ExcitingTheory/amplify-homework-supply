/**
 * @fileoverview Storybook stories for TablePlugin
 * Demonstrates table functionality in both editable and read-only modes
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
import { Button } from "@mui/material";

import {
  TablePlugin,
  TableContext,
  INSERT_NEW_TABLE_COMMAND,
} from "./TablePlugin";
import TableCellResizerPlugin from "./TableCellResizerPlugin";
import { TableNode as NewTableNode } from "../components/TableNode";
import TableCellNodes from "../components/TableCellNodes";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import {
  seedMockUnit,
  clearMockData,
} from "../../../../.storybook/__mocks__/aws-amplify-data";
import { expect } from 'storybook/test'

export default {
  title: "✏️ Lesson Editor/Formatting/Table",
  component: TablePlugin,
  loaders: [
    async () => {
      clearMockData();
      seedMockUnit({
        id: "table-plugin-story-unit",
        name: "Table Plugin Demo",
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
    unitId: "table-plugin-story-unit",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

function InsertTableButton() {
  const [editor] = useLexicalComposerContext();

  const handleClick = () => {
    editor.dispatchCommand(INSERT_NEW_TABLE_COMMAND, {
      rows: "3",
      columns: "3",
    });
  };

  return (
    <Button variant="contained" onClick={handleClick} sx={{ mb: 2 }}>
      Insert 3x3 Table
    </Button>
  );
}

const EditableTemplate = ({ editorState, showInsertButton }) => {
  const cellEditorConfig = {
    namespace: "TableCellEditor",
    nodes: [...TableCellNodes],
    onError,
    theme: LanguageEditorTheme,
  };

  const initialConfig = {
    namespace: "TablePluginDemo",
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
      NewTableNode,
      ...TableCellNodes,
    ],
  };

  return (
    <TableContext>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
          <h2>Table Plugin - Editable Mode</h2>
          {showInsertButton && <InsertTableButton />}
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
                  Enter text or insert tables...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <TableCellResizerPlugin />
            <TablePlugin cellEditorConfig={cellEditorConfig} />
          </div>
        </div>
      </LexicalComposer>
    </TableContext>
  );
};

const ReadOnlyTemplate = ({ editorState }) => {
  const cellEditorConfig = {
    namespace: "TableCellEditor",
    nodes: [...TableCellNodes],
    onError,
    editable: false,
    theme: LanguageEditorTheme,
  };

  const initialConfig = {
    namespace: "TablePluginDemo",
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
      NewTableNode,
      ...TableCellNodes,
    ],
  };

  return (
    <TableContext>
      <LexicalComposer initialConfig={initialConfig}>
        <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
          <h2>Table Plugin - Read-Only Mode</h2>
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
            <TablePlugin cellEditorConfig={cellEditorConfig} />
          </div>
        </div>
      </LexicalComposer>
    </TableContext>
  );
};

const sampleTableState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Table Example",
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
        type: "tablesheet",
        version: 1,
        children: [
          {
            type: "tablerow",
            version: 1,
            children: [
              {
                type: "tablecell",
                version: 1,
                headerState: 1,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 1,
                        mode: "normal",
                        style: "",
                        text: "Header 1",
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
              },
              {
                type: "tablecell",
                version: 1,
                headerState: 1,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 1,
                        mode: "normal",
                        style: "",
                        text: "Header 2",
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
              },
            ],
          },
          {
            type: "tablerow",
            version: 1,
            children: [
              {
                type: "tablecell",
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Cell 1",
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
              },
              {
                type: "tablecell",
                version: 1,
                headerState: 0,
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: "normal",
                        style: "",
                        text: "Cell 2",
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
              },
            ],
          },
        ],
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
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const EditableWithTable = {
  render: () => <EditableTemplate editorState={sampleTableState} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};

export const ReadOnlyWithTable = {
  render: () => <ReadOnlyTemplate editorState={sampleTableState} />,
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent?.length).toBeGreaterThan(0)
  },
};
