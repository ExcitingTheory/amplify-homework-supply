/**
 * @fileoverview Storybook stories for HorizontalTimeline
 * Demonstrates the horizontal scrollable timeline with speaker track rows
 */

import React from 'react';
import { expect } from 'storybook/test';
import { within, waitFor } from 'storybook/test';
import HorizontalTimeline from './HorizontalTimeline';

const mockConversationScript = {
  metadata: {
    title: 'Coffee Shop Conversation',
    scene: 'INT. COFFEE SHOP - MORNING',
    date: '2026-01-04',
    version: '1.0',
  },
  speakers: {
    alice: { name: 'Alice', voice: 'nova', description: '30s, energetic' },
    bob: { name: 'Bob', voice: 'onyx', description: '40s, laid-back' },
  },
  dialogue: [
    {
      id: 1,
      speaker: 'alice',
      text: 'Hello, how are you doing today?',
      timing: { start: 0.0, end: 3.5 },
      direction: 'entering, slightly out of breath',
      emotion: 'cheerful',
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 2,
      speaker: 'bob',
      text: "I'm doing well, thanks for asking.",
      timing: { start: 3.5, end: 6.2 },
      direction: 'looks up from newspaper',
      emotion: 'warm',
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 3,
      speaker: 'bob',
      text: 'What brings you here?',
      timing: { start: 7.0, end: 8.5 },
      direction: 'pauses, sets down newspaper',
      emotion: 'curious',
      takes: [],
      activeTakeIndex: null,
    },
    {
      id: 4,
      speaker: 'alice',
      text: 'Just needed a break from work.',
      timing: { start: 9.0, end: 12.0 },
      direction: 'sighs, pulls out chair',
      emotion: 'tired but relieved',
      takes: [],
      activeTakeIndex: null,
    },
  ],
};

const mockThreeSpeakers = {
  metadata: {
    title: 'Multi-speaker scene',
    scene: 'INT. CLASSROOM',
    date: '2026-04-17',
    version: '1.0',
  },
  speakers: {
    narrator: { name: 'NARRATOR', voice: 'fable', description: 'authoritative' },
    akiko: { name: 'AKIKO', voice: 'nova', description: 'native speaker' },
    student: { name: 'STUDENT', voice: 'echo', description: 'beginner' },
  },
  dialogue: [
    { id: 1, speaker: 'narrator', text: 'Welcome to the lesson.', timing: { start: 0, end: 2.5 }, direction: '', emotion: 'warm', takes: [], activeTakeIndex: null },
    { id: 2, speaker: 'akiko', text: 'こんにちは！', timing: { start: 3, end: 4.5 }, direction: 'bow slightly', emotion: 'cheerful', takes: [], activeTakeIndex: null },
    { id: 3, speaker: 'student', text: 'こんにちは...', timing: { start: 5, end: 6.5 }, direction: 'hesitant', emotion: 'nervous', takes: [], activeTakeIndex: null },
    { id: 4, speaker: 'narrator', text: 'Great job! Now try again.', timing: { start: 7, end: 9 }, direction: '', emotion: 'encouraging', takes: [], activeTakeIndex: null },
    { id: 5, speaker: 'akiko', text: 'はじめまして。', timing: { start: 9.5, end: 11 }, direction: 'formal register', emotion: 'neutral', takes: [], activeTakeIndex: null },
    { id: 6, speaker: 'student', text: 'はじめまして。', timing: { start: 11.5, end: 13 }, direction: 'more confident', emotion: 'focused', takes: [], activeTakeIndex: null },
  ],
};

const emptyScript = {
  metadata: { title: 'Empty', scene: '', date: '2026-04-17', version: '1.0' },
  speakers: {},
  dialogue: [],
};

export default {
  title: '🎙️ Recording Studio/Horizontal Timeline',
  component: HorizontalTimeline,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Horizontal Timeline

A scrollable, zoomable horizontal timeline that displays dialogue cards
positioned at their timing offsets. Each speaker gets a dedicated track row.

**Features:**
- 🔍 Zoom via Ctrl+scroll
- 🎯 Click a card to select it
- ⏱️ Time ruler with tick marks
- ▶️ Transport controls (play/stop/record)
        `,
      },
    },
  },
  decorators: [
    (Story: any) => (
      <div style={{ height: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export const TwoSpeakers = {
  args: {
    scriptData: mockConversationScript,
    selectedDialogueId: null,
    onSelectDialogue: (id: any) => console.log('Selected dialogue:', id),
    recording: false,
    playing: false,
    onPlay: () => console.log('Play'),
    onStop: () => console.log('Stop'),
    onRecordingComplete: (blob: any, waveform: any) => console.log('Recording complete:', blob, waveform),
    readOnly: false,
  },
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Alice')).toBeInTheDocument();
      expect(canvas.getByText('Bob')).toBeInTheDocument();
    }, { timeout: 5000 });
  },
};

export const ThreeSpeakers = {
  args: {
    scriptData: mockThreeSpeakers,
    selectedDialogueId: 2,
    onSelectDialogue: (id: any) => console.log('Selected dialogue:', id),
    recording: false,
    playing: false,
    onPlay: () => console.log('Play'),
    onStop: () => console.log('Stop'),
    onRecordingComplete: (blob: any, waveform: any) => console.log('Recording complete:', blob, waveform),
    readOnly: false,
  },
};

export const EmptyTimeline = {
  args: {
    scriptData: emptyScript,
    selectedDialogueId: null,
    onSelectDialogue: (id: any) => console.log('Selected dialogue:', id),
    recording: false,
    playing: false,
    onPlay: () => console.log('Play'),
    onStop: () => console.log('Stop'),
    onRecordingComplete: (blob: any, waveform: any) => console.log('Recording complete:', blob, waveform),
    readOnly: false,
  },
};

export const RecordingState = {
  args: {
    scriptData: mockConversationScript,
    selectedDialogueId: 1,
    onSelectDialogue: (id: any) => console.log('Selected dialogue:', id),
    recording: true,
    playing: false,
    onPlay: () => console.log('Play'),
    onStop: () => console.log('Stop'),
    onRecordingComplete: (blob: any, waveform: any) => console.log('Recording complete:', blob, waveform),
    readOnly: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the timeline in active recording state.',
      },
    },
  },
};
