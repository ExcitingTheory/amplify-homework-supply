/**
 * @fileoverview Storybook stories for ChatSidebar component
 * Demonstrates AI chat with context awareness and file attachments
 * 
 * Note: All AWS services are mocked via webpack aliases in .storybook/main.js
 */

import React from 'react';
import ChatSidebar from './ChatSidebar';
import { UnitProvider } from '../context/unitContext';
import FilesContext from '../context/fileContext';

// Mock unit data
const mockUnit = {
  id: 'unit-123',
  name: 'Introduction to Japanese',
  description: 'Basic Japanese language fundamentals',
  data: JSON.stringify({
    lessons: ['Hiragana', 'Katakana', 'Basic Greetings'],
  }),
};

// Mock files
const mockFiles = {
  'file-1': {
    id: 'file-1',
    name: 'japanese-grammar-guide.pdf',
    description: 'Grammar reference guide',
    mimeType: 'application/pdf',
  },
  'file-2': {
    id: 'file-2',
    name: 'vocabulary-list.pdf',
    description: 'Chapter 1 vocabulary',
    mimeType: 'application/pdf',
  },
};

// Mock question bank
const mockQuestionBank = {
  'q-1': {
    id: 'q-1',
    prompt: 'What is "hello" in Japanese?',
    answer: 'こんにちは (Konnichiwa)',
  },
  'q-2': {
    id: 'q-2',
    prompt: 'What is "thank you" in Japanese?',
    answer: 'ありがとうございます (Arigatou gozaimasu)',
  },
};

// Mock dictionary
const mockDictionary = {
  'd-1': {
    id: 'd-1',
    phrase: 'こんにちは',
    definition: 'Hello, Good afternoon',
  },
  'd-2': {
    id: 'd-2',
    phrase: 'ありがとう',
    definition: 'Thank you',
  },
};

// Mock FilesContext session
const mockSession = {
  identityId: 'mock-identity-123',
  tokens: {
    idToken: 'mock-id-token',
  },
};

export default {
  title: 'Components/ChatSidebar',
  component: ChatSidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'AI chat assistant with context awareness, streaming responses, and file attachment support. All AWS services and API calls are mocked.',
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '0.75rem 1rem',
            borderBottom: '2px solid #2196f3',
            fontSize: '0.875rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#0d47a1'
          }}>
            <strong>📘 Demo Mode:</strong> AWS services (DataStore, Auth) and chat API (/api/chat) are mocked. 
            File uploads and streaming responses are simulated!
          </div>
          <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
            <FilesContext.Provider value={{
              files: mockFiles,
              session: mockSession,
            }}>
              <UnitProvider value={{
                unit: mockUnit,
                files: mockFiles,
                questionBank: mockQuestionBank,
                dictionary: mockDictionary,
              }}>
                <Story />
              </UnitProvider>
            </FilesContext.Provider>
          </div>
        </>
      );
    },
  ],
};

export const Default = {};

export const EmptyState = {
  parameters: {
    docs: {
      description: {
        story: 'ChatSidebar with no messages - shows the empty state with helpful prompt.',
      },
    },
  },
};

export const WithDragAndDrop = {
  parameters: {
    docs: {
      description: {
        story: 'Try dragging and dropping files onto the chat area to attach them to your message.',
      },
    },
  },
};
