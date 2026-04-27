/**
 * @fileoverview Storybook stories for ScreenplayEditor
 * Demonstrates the editable Fountain editor + AI prompt input
 */

import React from 'react';
import { expect } from 'storybook/test';
import { within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScreenplayEditor from './ScreenplayEditor';

const sampleFountain = `Title: Japanese Greetings Lesson
Date: 2026-04-17

INT. COFFEE SHOP - MORNING

NARRATOR
(warm, inviting)
Welcome to our lesson on Japanese greetings.
[[Slower pace. Clear enunciation.]]

AKIKO
(cheerful, native speaker)
こんにちは！ はじめまして。
[[Bow slightly. Formal register.]]

NARRATOR
That means "Hello! Nice to meet you."
[[Emphasize the English translation.]]`;

const emptyFountain = `Title: New Screenplay
Date: 2026-04-17

`;

export default {
  title: '🎙️ Recording Audio/Screenplay Editor',
  component: ScreenplayEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Screenplay Editor

An editable Fountain screenplay editor with AI prompt input. Write screenplays
in standard [Fountain format](https://fountain.io/syntax) and changes
automatically sync to the Recording Studio timeline.

**Features:**
- ✏️ Edit Fountain text directly — changes parse into speakers, dialogue, timing
- 🤖 AI prompt input for assisted generation
- 📜 Standard Fountain format — interoperable with Final Draft, Highland, etc.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithContent = {
  args: {
    fountainText: sampleFountain,
    onFountainChange: (text) => console.log('Fountain changed:', text.slice(0, 80)),
    onPromptSubmit: (prompt) => console.log('Prompt submitted:', prompt),
    isGenerating: false,
    readOnly: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText(/Welcome to our lesson/)).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(canvas.getByText(/こんにちは/)).toBeInTheDocument();
  },
};

export const Empty = {
  args: {
    fountainText: emptyFountain,
    onFountainChange: (text) => console.log('Fountain changed:', text.slice(0, 80)),
    onPromptSubmit: (prompt) => console.log('Prompt submitted:', prompt),
    isGenerating: false,
    readOnly: false,
  },
};

export const AIGenerating = {
  args: {
    fountainText: sampleFountain,
    onFountainChange: (text) => console.log('Fountain changed:', text.slice(0, 80)),
    onPromptSubmit: (prompt) => console.log('Prompt submitted:', prompt),
    isGenerating: true,
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state while AI generates screenplay content.',
      },
    },
  },
};

export const ReadOnly = {
  args: {
    fountainText: sampleFountain,
    onFountainChange: (text) => console.log('Fountain changed:', text.slice(0, 80)),
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Read-only mode — no editing, no prompt input.',
      },
    },
  },
};
