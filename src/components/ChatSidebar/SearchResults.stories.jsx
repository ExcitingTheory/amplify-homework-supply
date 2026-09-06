/**
 * @fileoverview Storybook stories for SearchResults component
 * Demonstrates the enhanced AI Assistant search results display with:
 * - Collapsible sections with animations
 * - Better visual hierarchy
 * - Animated relevance scores
 * - Loading states
 * - Empty states
 * - Markdown support in descriptions
 */

import React from "react";
import SearchResults from "./SearchResults";
import { Box } from "@mui/material";
import { expect, within } from "storybook/test";

export default {
  title: "💬 AI Assistant/Search Results",
  component: SearchResults,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
# Search Results Component

Enhanced display for AI Assistant search results with improved visual hierarchy, collapsible sections, and relevance scoring.

## Features

- **Collapsible Sections**: Click section headers to expand/collapse result groups
- **Relevance Scores**: Animated chips showing match quality percentage
- **Visual Hierarchy**: Larger icons, better spacing, hover effects
- **Icon Colors**: Three-color system (primary, secondary, info) for clarity
- **Markdown Support**: Basic formatting in descriptions (**bold**)
- **Loading States**: Animated skeletons during search
- **Empty States**: Helpful message when no results found
- **Actions**: Link to unit, edit, insert into editor, open in tab

## Result Types

- **Files**: Documents and PDFs with page numbers
- **Vocabulary**: Words with phonetics and definitions
- **Questions**: Quiz items with answers
- **Sections**: Student cohorts/classes with join codes
- **Units**: Learning modules with published status
                `,
      },
    },
  },
  argTypes: {
    unitId: {
      control: "text",
      description: "Current unit ID for linking items",
    },
    searchQuery: {
      control: "text",
      description: "Original search query for highlighting matches",
    },
    isLoading: {
      control: "boolean",
      description: "Show loading skeleton states",
    },
  },
};

// Mock data
const mockFiles = [
  {
    id: "file-1",
    type: "file",
    name: "Japanese Grammar Basics.pdf",
    description:
      "Introduction to **Japanese particles** (は, が, を) and their usage in sentences. Includes practice examples and common mistakes.",
    page: 12,
    similarity: 0.92,
  },
  {
    id: "file-2",
    type: "file",
    name: "Verb Conjugation Guide",
    description:
      "Complete guide to **verb conjugation** patterns in Japanese, covering present, past, negative, and polite forms.",
    page: 5,
    similarity: 0.78,
  },
  {
    id: "file-3",
    type: "file",
    name: "Kanji Study Methods",
    description:
      "Effective strategies for learning and remembering kanji characters.",
    page: 3,
    similarity: 0.55,
  },
];

const mockWords = [
  {
    id: "word-1",
    type: "word",
    phrase: "食べる",
    phonetic: "たべる (taberu)",
    definition: "to eat; one of the most common verbs in Japanese",
    similarity: 0.95,
  },
  {
    id: "word-2",
    type: "word",
    phrase: "学生",
    phonetic: "がくせい (gakusei)",
    definition:
      "student; typically refers to **high school or university students**",
    similarity: 0.88,
  },
  {
    id: "word-3",
    type: "word",
    phrase: "美しい",
    phonetic: "うつくしい (utsukushii)",
    definition: "beautiful; i-adjective used to describe visual beauty",
    similarity: 0.62,
  },
];

const mockQuestions = [
  {
    id: "question-1",
    type: "question",
    prompt: "What is the difference between は (wa) and が (ga) particles?",
    answer:
      "は marks the **topic** of the sentence (what you're talking about), while が marks the **subject** (who/what performs the action). は is used for contrast or known information, が for new information or emphasis.",
    similarity: 0.91,
  },
  {
    id: "question-2",
    type: "question",
    prompt: "How do you conjugate る-verbs to past tense?",
    answer:
      "Remove る and add た. For example: 食べる → 食べた (taberu → tabeta)",
    similarity: 0.76,
  },
  {
    id: "question-3",
    type: "question",
    prompt: "What are the three writing systems in Japanese?",
    answer:
      "Hiragana (phonetic syllabary), Katakana (phonetic syllabary for foreign words), and Kanji (Chinese characters)",
    similarity: 0.58,
  },
];

const mockSections = [
  {
    id: "section-1",
    type: "section",
    name: "Japanese 101 - Spring 2026",
    description:
      "Beginner Japanese class covering **hiragana, katakana**, basic grammar, and conversational skills.",
    joinCode: "JPH101",
    similarity: 0.89,
  },
  {
    id: "section-2",
    type: "section",
    name: "Advanced Grammar Study Group",
    description: "Focus on complex grammar patterns and literary Japanese.",
    joinCode: "ADVG22",
    similarity: 0.71,
  },
  {
    id: "section-3",
    type: "section",
    name: "JLPT N3 Preparation",
    description:
      "Test preparation class for the **Japanese Language Proficiency Test** N3 level.",
    joinCode: "N3PREP",
    similarity: 0.64,
  },
];

const mockUnits = [
  {
    id: "unit-1",
    type: "unit",
    name: "Introduction to Particles",
    description:
      "Learn the fundamental **Japanese particles**: は, が, を, に, で, and their basic usage patterns.",
    published: true,
    similarity: 0.94,
  },
  {
    id: "unit-2",
    type: "unit",
    name: "Daily Routines Vocabulary",
    description:
      "Common words and phrases for describing daily activities and schedules.",
    published: true,
    similarity: 0.82,
  },
  {
    id: "unit-3",
    type: "unit",
    name: "Keigo (Honorific Speech) - Draft",
    description:
      "Introduction to Japanese honorific language system including **敬語 (keigo)** levels.",
    published: false,
    similarity: 0.59,
  },
];

// Mock tab handlers
const mockTabHandlers = {
  setLeftTab: (index) => console.log("Set left tab:", index),
  setLeftOpen: (open) => console.log("Set left open:", open),
  setRightOpen: (open) => console.log("Set right open:", open),
  scrollToItem: (type, id) => console.log("Scroll to:", type, id),
};

// Default story - all result types
export const AllResultTypes = {
  args: {
    results: [
      ...mockFiles,
      ...mockWords,
      ...mockQuestions,
      ...mockSections,
      ...mockUnits,
    ],
    unitId: "unit-123",
    searchQuery: "Japanese",
    tabHandlers: mockTabHandlers,
    onInsertWord: (word) => console.log("Insert word:", word.phrase),
    onInsertQuestion: (question) =>
      console.log("Insert question:", question.prompt),
    onFocusItem: (type, id) => console.log("Focus item:", type, id),
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent.length).toBeGreaterThan(0);
  },
};

// Only files
export const FilesOnly = {
  args: {
    results: mockFiles,
    unitId: "unit-123",
    searchQuery: "grammar",
    tabHandlers: mockTabHandlers,
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent.length).toBeGreaterThan(0);
  },
};

// Only vocabulary
export const VocabularyOnly = {
  args: {
    results: mockWords,
    unitId: "unit-123",
    searchQuery: "食べる",
    tabHandlers: mockTabHandlers,
    onInsertWord: (word) => console.log("Insert word:", word.phrase),
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/食べる/);
  },
};

// Only questions
export const QuestionsOnly = {
  args: {
    results: mockQuestions,
    unitId: "unit-123",
    searchQuery: "particle",
    tabHandlers: mockTabHandlers,
    onInsertQuestion: (question) =>
      console.log("Insert question:", question.prompt),
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/difference between.*は.*が/i);
  },
};

// Only sections
export const SectionsOnly = {
  args: {
    results: mockSections,
    searchQuery: "JLPT",
    tabHandlers: mockTabHandlers,
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Japanese 101/i);
  },
};

// Only units
export const UnitsOnly = {
  args: {
    results: mockUnits,
    searchQuery: "particles",
    tabHandlers: mockTabHandlers,
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent.length).toBeGreaterThan(0);
  },
};

// Loading state
export const LoadingState = {
  args: {
    results: [],
    searchQuery: "searching...",
    tabHandlers: mockTabHandlers,
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    expect(
      canvasElement.querySelector(
        '[class*="skeleton"], [class*="Skeleton"], [role="progressbar"]',
      ),
    ).not.toBeNull();
  },
};

// Empty state
export const EmptyState = {
  args: {
    results: [],
    searchQuery: "xyzabc123",
    tabHandlers: mockTabHandlers,
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText(/Japanese Grammar Basics/i)).toBeNull();
  },
};

// High relevance scores
export const HighRelevanceScores = {
  args: {
    results: [
      { ...mockFiles[0], similarity: 0.98 },
      { ...mockWords[0], similarity: 0.96 },
      { ...mockQuestions[0], similarity: 0.94 },
      { ...mockSections[0], similarity: 0.92 },
      { ...mockUnits[0], similarity: 0.95 },
    ],
    unitId: "unit-123",
    searchQuery: "Japanese",
    tabHandlers: mockTabHandlers,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "All results have high relevance scores (≥80%).",
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent.length).toBeGreaterThan(0);
  },
};

// Low relevance scores
export const LowRelevanceScores = {
  args: {
    results: [
      { ...mockFiles[2], similarity: 0.45 },
      { ...mockWords[2], similarity: 0.38 },
      { ...mockQuestions[2], similarity: 0.42 },
    ],
    unitId: "unit-123",
    searchQuery: "test",
    tabHandlers: mockTabHandlers,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "All results have low relevance scores (<60%).",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Kanji Study Methods/i);
  },
};

// Large result set
export const LargeResultSet = {
  args: {
    results: [
      ...mockFiles,
      ...Array(7)
        .fill(null)
        .map((_, i) => ({
          id: `file-extra-${i}`,
          type: "file",
          name: `Document ${i + 4}`,
          description: `Additional document about various topics in Japanese language learning.`,
          page: i + 1,
          similarity: 0.7 - i * 0.05,
        })),
      ...mockWords,
      ...Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `word-extra-${i}`,
          type: "word",
          phrase: `単語${i + 4}`,
          phonetic: `たんご${i + 4}`,
          definition: `Additional vocabulary word for demonstration`,
          similarity: 0.65 - i * 0.04,
        })),
      ...mockQuestions,
      ...Array(4)
        .fill(null)
        .map((_, i) => ({
          id: `question-extra-${i}`,
          type: "question",
          prompt: `Question ${i + 4} about Japanese grammar?`,
          answer: `This is an example answer for question ${i + 4}.`,
          similarity: 0.72 - i * 0.06,
        })),
      ...mockSections,
      ...mockUnits,
    ],
    unitId: "unit-123",
    searchQuery: "Japanese",
    tabHandlers: mockTabHandlers,
    onInsertWord: (word) => console.log("Insert word:", word.phrase),
    onInsertQuestion: (question) =>
      console.log("Insert question:", question.prompt),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Large result set to demonstrate collapsible sections and scrolling.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent.length).toBeGreaterThan(0);
  },
};

// Without unit ID (no link buttons)
export const WithoutUnitId = {
  args: {
    results: [
      ...mockFiles.slice(0, 1),
      ...mockWords.slice(0, 1),
      ...mockQuestions.slice(0, 1),
    ],
    unitId: null,
    searchQuery: "test",
    tabHandlers: mockTabHandlers,
    onInsertWord: (word) => console.log("Insert word:", word.phrase),
    onInsertQuestion: (question) =>
      console.log("Insert question:", question.prompt),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'No unit ID provided, so "Add to unit" buttons are hidden.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Japanese Grammar Basics/i);
  },
};

// Minimal callbacks
export const MinimalCallbacks = {
  args: {
    results: [
      ...mockFiles.slice(0, 1),
      ...mockWords.slice(0, 1),
      ...mockQuestions.slice(0, 1),
    ],
    searchQuery: "test",
    tabHandlers: {},
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Minimal setup with no callbacks - only basic display functionality.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent.length).toBeGreaterThan(0);
  },
};

// In a constrained container
export const InConstrainedContainer = {
  args: {
    results: [...mockFiles, ...mockWords, ...mockQuestions],
    unitId: "unit-123",
    searchQuery: "Japanese",
    tabHandlers: mockTabHandlers,
    onInsertWord: (word) => console.log("Insert word:", word.phrase),
    onInsertQuestion: (question) =>
      console.log("Insert question:", question.prompt),
    isLoading: false,
  },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 400, border: "2px dashed #ccc", p: 2 }}>
        <Story />
      </Box>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Demonstrates responsive behavior in a narrow container.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent.length).toBeGreaterThan(0);
  },
};
