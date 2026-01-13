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
import { TabProvider } from '../context/tabContext';
import { DemoBanner } from '../../.storybook/components/DemoBanner';
import {
  MOCK_CHAT_GREETING,
  MOCK_CHAT_QUESTION_SEARCH,
  MOCK_CHAT_MULTIPLE_TOOLS,
} from '../../.storybook/__mocks__/chatMockData';

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
        component: 'AI chat assistant with context awareness, streaming responses, and file attachment support.\n\n## Features\n- **Context-Aware**: Accesses current unit, vocabulary, questions, and files\n- **Streaming Responses**: Real-time token streaming via Vercel AI SDK\n- **File Attachments**: Drag-and-drop or click to attach files to messages\n- **OpenAI Integration**: GPT-4 powered responses with unit-specific context\n- **Message History**: Persistent conversation within the session\n- **Tool Calling**: AI can use tools to search content, create sections, generate quizzes, and more\n\n## Mocked Services\nAll AWS services (DataStore, Auth, Storage) and the /chat endpoint are mocked in Storybook.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      // Get messages from story args or use empty array
      const messages = context.args?.messages || [];
      
      // Create mock AssistantChat with messages
      const mockAssistantChat = {
        id: 'mock-chat-id',
        messages: messages,
        draft: '',
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _version: 1,
        files: {
          toArray: async () => []
        }
      };

      // Mock TabContext value
      const mockTabContext = {
        assistantChat: messages.length > 0 ? mockAssistantChat : null,
        chatHistories: messages.length > 0 ? [mockAssistantChat] : [],
        setCurrentChat: () => {},
        isLoadingChat: false,
        chatCreationError: null,
      };

      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <DemoBanner>
            AWS services (DataStore, Auth, Storage) and chat API (/chat) are mocked. 
            File uploads and streaming responses are simulated!
          </DemoBanner>
          <div style={{ 
            flex: 1,
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            <TabProvider value={mockTabContext}>
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
            </TabProvider>
          </div>
        </div>
      );
    },
  ],
};

export const Default = {
  args: {
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'A basic conversation without tool calls. Shows natural chat flow with the AI assistant helping learn Japanese.',
      },
    },
  },
};

export const WithToolCalls = {
  args: {
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the chat with tool calls - demonstrates how the AI uses tools like search_content to find vocabulary words. The tool invocation UI shows the search query and results in a structured format.',
      },
    },
  },
};

export const CreateSectionTool = {
  args: {
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the create_section tool being used to create a new class section. Shows how the AI can perform administrative tasks.',
      },
    },
  },
};

export const GenerateContentTool = {
  args: {
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the generate_unit_content tool creating educational content. The AI can generate quizzes, lessons, and other learning materials.',
      },
    },
  },
};

export const MultipleTools = {
  args: {
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates multiple tool calls in sequence. The AI first searches for vocabulary, then uses those results to generate a quiz - showing how tools can be chained together.',
      },
    },
  },
};

export const ToolCallInProgress = {
  args: {
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a tool call in progress (input-available state). The search is prepared but results have not arrived yet - demonstrates the loading state.',
      },
    },
  },
};

export const ToolCallError = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling in tool calls. Shows how the UI displays when a tool fails to execute properly.',
      },
    },
  },
};

export const WithFileAttachments = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates file attachment handling. The user uploaded a PDF and the AI acknowledged it for analysis.',
      },
    },
  },
};

export const LongConversation = {
  render: () => <ChatSidebar initialMessages={[]} />,
  parameters: {
    docs: {
      description: {
        story: 'Extended conversation showing context awareness and multiple tool calls. The AI helps create a complete lesson plan with associated quiz through a natural conversation flow.',
      },
    },
  },
};
