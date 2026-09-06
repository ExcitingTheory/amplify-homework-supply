/**
 * @fileoverview Stories for Chat and ChatSidebar sub-components
 *
 * @module stories/chat-components.stories
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";

import { MentionChip } from "../components/Chat/MentionChip";
import { MessageComposer } from "../components/Chat/MessageComposer";
import LexicalMessageRenderer from "../components/ChatSidebar/LexicalMessageRenderer";
import NavigationPrompt from "../components/ChatSidebar/NavigationPrompt";
import RecordingScriptPreview from "../components/ChatSidebar/RecordingScriptPreview";

// Cast JSX components for TypeScript compatibility
const TypedLexicalMessageRenderer: React.FC<any> = LexicalMessageRenderer;
const TypedNavigationPrompt: React.FC<any> = NavigationPrompt;

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: "💬 AI Assistant/Components/Chat Primitives",
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// MentionChip
// ---------------------------------------------------------------------------

export const MentionChipUser: Story = {
  name: "MentionChip / User",
  render: () => <MentionChip name="Alice" onClick={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Alice/);
  },
};

export const MentionChipBot: Story = {
  name: "MentionChip / Bot (Kai)",
  render: () => <MentionChip name="Kai" onClick={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Kai/);
  },
};

export const MentionChipNoClick: Story = {
  name: "MentionChip / Non-clickable",
  render: () => <MentionChip name="Bob" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Bob/);
  },
};

// ---------------------------------------------------------------------------
// MessageComposer
// ---------------------------------------------------------------------------

const sampleMembers = [
  { username: "student-alice-sub", displayName: "Alice Johnson" },
  { username: "student-bob-sub", displayName: "Bob Smith" },
  { username: "kai", displayName: "Kai" },
  { username: "teacher-1", displayName: "Sensei Tanaka" },
];

export const MessageComposerDefault: Story = {
  name: "MessageComposer / Default",
  render: () => (
    <div style={{ width: 400 }}>
      <MessageComposer onSend={fn()} members={sampleMembers} onTyping={fn()} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvasElement.querySelector("input, textarea, [contenteditable]"),
    ).not.toBeNull();
  },
};

export const MessageComposerWithReply: Story = {
  name: "MessageComposer / With Reply",
  render: () => (
    <div style={{ width: 400 }}>
      <MessageComposer
        onSend={fn()}
        members={sampleMembers}
        onTyping={fn()}
        replyTo={{
          id: "msg-1",
          authorName: "Alice",
          content: "Has anyone tried the new quiz blocks?",
        }}
        onCancelReply={fn()}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Alice/);
  },
};

// ---------------------------------------------------------------------------
// LexicalMessageRenderer
// ---------------------------------------------------------------------------

export const LexicalMessageRendererMarkdown: Story = {
  name: "LexicalMessageRenderer / Markdown",
  render: () => (
    <div style={{ width: 500, padding: 16 }}>
      <TypedLexicalMessageRenderer
        content={`# Hello World\n\nThis is a **bold** message with:\n- A bullet list\n- Multiple items\n\n\`\`\`javascript\nconst x = 42;\n\`\`\`\n\n[Link](https://example.com)`}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Hello World/);
  },
};

export const LexicalMessageRendererPlainText: Story = {
  name: "LexicalMessageRenderer / Plain Text",
  render: () => (
    <div style={{ width: 500, padding: 16 }}>
      <TypedLexicalMessageRenderer content="こんにちは！ How are you today?" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/こんにちは/);
  },
};

// ---------------------------------------------------------------------------
// NavigationPrompt
// ---------------------------------------------------------------------------

export const NavigationPromptEditor: Story = {
  name: "NavigationPrompt / Editor Context",
  render: () => (
    <div style={{ width: 400 }}>
      <TypedNavigationPrompt
        requiredContext="editorRef"
        unitId="unit-japanese-1"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.textContent!.length).toBeGreaterThan(0);
  },
};

export const NavigationPromptSections: Story = {
  name: "NavigationPrompt / Sections Context",
  render: () => (
    <div style={{ width: 400 }}>
      <TypedNavigationPrompt requiredContext="sections" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.textContent!.length).toBeGreaterThan(0);
  },
};

// ---------------------------------------------------------------------------
// RecordingScriptPreview
// ---------------------------------------------------------------------------

export const RecordingScriptPreviewWord: Story = {
  name: "RecordingScriptPreview / Word Preset",
  render: () => (
    <div style={{ width: 500 }}>
      <RecordingScriptPreview
        toolOutput={{
          preset: "word",
          scriptData: {
            metadata: { title: "おはよう — Good morning", preset: "word" },
            word: "おはよう",
            phonetic: "ohayou",
            definition: "Good morning",
            tracks: [
              {
                label: "Native",
                text: "おはようございます。",
                voice: "native",
              },
            ],
          },
          lockedTracks: [0],
          wordData: {
            word: "おはよう",
            phonetic: "ohayou",
            definition: "Good morning",
          },
          preview: { trackCount: 1, preset: "word", estimatedDuration: "2s" },
          warnings: [],
        }}
        onOpenStudio={fn()}
        unitId="unit-japanese-1"
        owner="teacher-1"
        identityId="us-east-1:teacher-identity-1"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/おはよう/);
  },
};

export const RecordingScriptPreviewConversation: Story = {
  name: "RecordingScriptPreview / Conversation Preset",
  render: () => (
    <div style={{ width: 500 }}>
      <RecordingScriptPreview
        toolOutput={{
          preset: "conversation",
          scriptData: {
            metadata: {
              title: "Asking for Directions",
              preset: "conversation",
            },
            tracks: [
              {
                label: "Speaker A",
                text: "すみません、駅はどこですか？",
                voice: "native",
              },
              {
                label: "Speaker B",
                text: "まっすぐ行って、右に曲がってください。",
                voice: "native",
              },
            ],
          },
          lockedTracks: [],
          preview: {
            trackCount: 2,
            preset: "conversation",
            estimatedDuration: "8s",
          },
          warnings: [],
        }}
        onOpenStudio={fn()}
        unitId="unit-japanese-1"
        owner="teacher-1"
        identityId="us-east-1:teacher-identity-1"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Asking for Directions/i);
  },
};
