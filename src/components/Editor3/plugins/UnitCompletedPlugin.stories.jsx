/**
 * @fileoverview Storybook stories for UnitCompletedPlugin
 * Demonstrates the unit completion modal
 */

import React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { Button } from "@mui/material";

import UnitCompletedPlugin from "./UnitCompletedPlugin";
import LanguageEditorTheme from "../config/LanguageEditorTheme";
import { UnitProvider } from "../../../context/unitContext";
import { seedMockUnit } from "../../../../.storybook/__mocks__/aws-amplify-data";
import UnitContext from "../../../context/unitContext";

export default {
  title: "✏️ Lesson Editor/Workflow/Unit Completed",
  component: UnitCompletedPlugin,
  parameters: {
    layout: "fullscreen",
    initializeMockData: false,
  },
};

const onError = (error) => {
  console.error(error);
};

// Inner component that accesses UnitContext
function DemoContent() {
  const { setShowUnitComplete } = React.useContext(UnitContext);

  return (
    <LexicalComposer
      initialConfig={{
        namespace: "UnitCompletedPluginDemo",
        theme: LanguageEditorTheme,
        onError,
        editable: false,
        nodes: [
          HeadingNode,
          QuoteNode,
          ListNode,
          ListItemNode,
          CodeNode,
          CodeHighlightNode,
          AutoLinkNode,
          LinkNode,
        ],
      }}
    >
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>Unit Completed Plugin</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          This plugin displays a modal when a student completes all exercises in
          a unit. It shows the unit name and their top grades.
        </p>

        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowUnitComplete(true)}
          >
            Trigger Unit Completion Modal
          </Button>

          <div style={{ marginTop: "30px", color: "#666", fontSize: "14px" }}>
            <p>The modal includes:</p>
            <ul
              style={{
                textAlign: "left",
                display: "inline-block",
                marginTop: "10px",
              }}
            >
              <li>Unit name</li>
              <li>Top 5 recent grades with timestamps</li>
              <li>Accuracy percentages</li>
              <li>Congratulatory message</li>
            </ul>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            minHeight: "200px",
            padding: "20px",
            marginTop: "20px",
            backgroundColor: "#fff",
          }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{ outline: "none", minHeight: "150px" }}
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
                Editor content (read-only)...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        <UnitCompletedPlugin />
      </div>
    </LexicalComposer>
  );
}

const ControlledTemplate = () => {
  const unitId = "unit-completed-demo";

  seedMockUnit({
    id: unitId,
    name: "Advanced Japanese Vocabulary",
    description: "Master essential Japanese vocabulary for daily conversation",
    data: null,
    _version: 1,
    owner: "mock-user-sub",
  });

  return (
    <UnitProvider id={unitId}>
      <DemoContent />
    </UnitProvider>
  );
};

export const Interactive = {
  render: () => <ControlledTemplate />,
};
