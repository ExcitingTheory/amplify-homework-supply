/**
 * Quick Tour - AI Assistant
 * Live interactive demo using the ChatSidebar component with play() interactions.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { within, waitFor, userEvent } from 'storybook/test';
import { Box, Typography, Paper } from '@mui/material';
import ChatSidebar from '../../src/components/ChatSidebar';
import { TabProvider } from '../../src/context/tabContext';
import { DemoBanner } from '../components/DemoBanner';
import { seedMockAssistantChats, seedMockWords, seedMockQuestions } from '@storybook-mocks/aws-amplify-data';
import { allChatData } from '@storybook-mocks/chatDataLoader';

const meta: Meta = {
  title: '🏠 Getting Started/Quick Tour/AI Assistant',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

/**
 * Step 1 — Start a new conversation with the AI
 */
export const Step1_StartChat: Story = {
  name: '1. Start a Conversation',
  decorators: [
    (Story: React.FC) => {
      seedMockAssistantChats([{
        id: 'tour-chat-1',
        model: 'gpt-4',
        threadInstructions: 'You are a helpful teaching assistant.',
        draft: '',
        archived: false,
        owner: 'mock-user-sub',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _version: 1,
        messages: [],
      }]);
      return (
        <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2, bgcolor: 'secondary.dark', color: 'secondary.contrastText' }}>
            <Typography variant="subtitle2">
              Quick Tour — Step 1: Type a question and the AI responds with streaming text.
              Watch the interaction panel to see each step play out.
            </Typography>
          </Paper>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            <Story />
          </div>
        </div>
      );
    },
  ],
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Find the chat input', async () => {
      await waitFor(() => {
        canvas.getByPlaceholderText(/ask me anything/i);
      }, { timeout: 5000 });
    });

    await step('Type a message to the AI assistant', async () => {
      const chatInput = canvas.getByPlaceholderText(/ask me anything/i);
      await userEvent.type(chatInput, 'Help me create a lesson about Japanese greetings', { delay: 40 });
      await new Promise(r => setTimeout(r, 500));
    });

    await step('Send the message', async () => {
      const sendButton = canvas.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);
      await new Promise(r => setTimeout(r, 1500));
    });
  },
};

/**
 * Step 2 — Chat with tool calls and content search
 */
export const Step2_ToolCalls: Story = {
  name: '2. AI Tool Calls',
  decorators: [
    (Story: React.FC) => {
      // Seed with a conversation that has tool call results
      if (allChatData?.toolCallSearch) {
        seedMockAssistantChats([allChatData.toolCallSearch]);
      } else {
        seedMockAssistantChats([{
          id: 'tour-chat-tools',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful teaching assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [],
        }]);
      }
      seedMockWords([]);
      seedMockQuestions([]);
      return (
        <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2, bgcolor: 'secondary.dark', color: 'secondary.contrastText' }}>
            <Typography variant="subtitle2">
              Quick Tour — Step 2: The AI can search your content library, generate questions,
              and insert blocks directly into the editor.
            </Typography>
          </Paper>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            <Story />
          </div>
        </div>
      );
    },
  ],
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Chat loads with tool call history', async () => {
      await waitFor(() => {
        canvas.getByPlaceholderText(/ask me anything/i);
      }, { timeout: 5000 });
      await new Promise(r => setTimeout(r, 1000));
    });

    await step('AI uses tools to search and generate content', async () => {
      const chatInput = canvas.getByPlaceholderText(/ask me anything/i);
      await userEvent.type(chatInput, 'Search my vocabulary for greetings', { delay: 40 });
      await new Promise(r => setTimeout(r, 500));
    });

    await step('Send search request', async () => {
      const sendButton = canvas.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);
      await new Promise(r => setTimeout(r, 2000));
    });
  },
};

/**
 * Step 3 — Quiz Generation demo
 */
export const Step3_GenerateContent: Story = {
  name: '3. Generate Content',
  decorators: [
    (Story: React.FC) => {
      if (allChatData?.quizGenerator) {
        seedMockAssistantChats([allChatData.quizGenerator]);
      } else {
        seedMockAssistantChats([{
          id: 'tour-chat-quiz',
          model: 'gpt-4',
          threadInstructions: 'You are a helpful teaching assistant.',
          draft: '',
          archived: false,
          owner: 'mock-user-sub',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _version: 1,
          messages: [],
        }]);
      }
      return (
        <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ p: 2, bgcolor: 'secondary.dark', color: 'secondary.contrastText' }}>
            <Typography variant="subtitle2">
              Quick Tour — Step 3: Ask the AI to generate quiz questions, vocabulary,
              or full lesson outlines. Generated content can be inserted directly into the editor.
            </Typography>
          </Paper>
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
            <Story />
          </div>
        </div>
      );
    },
  ],
  render: () => (
    <TabProvider>
      <ChatSidebar />
    </TabProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open chat for content generation', async () => {
      await waitFor(() => {
        canvas.getByPlaceholderText(/ask me anything/i);
      }, { timeout: 5000 });
    });

    await step('Ask AI to generate quiz questions', async () => {
      const chatInput = canvas.getByPlaceholderText(/ask me anything/i);
      await userEvent.type(
        chatInput,
        'Generate 3 multiple choice questions about Japanese greetings',
        { delay: 35 },
      );
      await new Promise(r => setTimeout(r, 500));
    });

    await step('Send and watch the AI stream its response', async () => {
      const sendButton = canvas.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);
      await new Promise(r => setTimeout(r, 2000));
    });
  },
};
