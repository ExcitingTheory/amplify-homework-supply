/**
 * @fileoverview Storybook stories for AIFeedbackWidget component
 */

import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import AIFeedbackWidget from './AIFeedbackWidget';

export default {
  title: 'Components/AIFeedbackWidget',
  component: AIFeedbackWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

// Template for stories
const Template = (args) => (
  <Paper sx={{ p: 3, maxWidth: 600 }}>
    <Typography variant="body1" gutterBottom>
      This is some AI-generated content. Rate it below:
    </Typography>
    <Box sx={{ mt: 2 }}>
      <AIFeedbackWidget {...args} />
    </Box>
  </Paper>
);

// Default story - Chat message
export const ChatMessage = Template.bind({});
ChatMessage.args = {
  contentType: 'CHAT_MESSAGE',
  generatedContent: 'Sure! I can help you create a vocabulary list for Japanese greetings.',
  model: 'gpt-4',
  prompt: 'Create a vocabulary list for Japanese greetings',
  messageId: 'msg-123',
  size: 'small',
  showLabels: false,
};

// Content completion
export const ContentCompletion = Template.bind({});
ContentCompletion.args = {
  contentType: 'CONTENT_COMPLETION',
  generatedContent: 'The study of Japanese grammar reveals a complex system of particles that determine the grammatical relationships between words.',
  model: 'gpt-4',
  prompt: 'The study of Japanese grammar',
  size: 'small',
  showLabels: true,
};

// With labels
export const WithLabels = Template.bind({});
WithLabels.args = {
  contentType: 'CHAT_MESSAGE',
  generatedContent: 'Here are the top 10 most common Japanese verbs...',
  model: 'gpt-4',
  size: 'medium',
  showLabels: true,
};

// Large buttons
export const LargeButtons = Template.bind({});
LargeButtons.args = {
  contentType: 'DOCUMENT_ANALYSIS',
  generatedContent: 'Extracted 150 vocabulary words from the document.',
  model: 'gpt-4',
  documentId: 'doc-456',
  size: 'large',
  showLabels: true,
};

// In a chat context
export const InChatContext = () => (
  <Box sx={{ maxWidth: 600, mx: 'auto' }}>
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
      <Typography variant="body2" gutterBottom>
        User: How do I say "hello" in Japanese?
      </Typography>
    </Paper>
    <Paper sx={{ p: 2, position: 'relative', pr: 6 }}>
      <Typography variant="body2" gutterBottom>
        Assistant: In Japanese, there are several ways to say "hello":
        <br />
        - こんにちは (Konnichiwa) - Standard greeting during the day
        <br />
        - おはよう (Ohayou) - Good morning
        <br />
        - こんばんは (Konbanwa) - Good evening
      </Typography>
      <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
        <AIFeedbackWidget
          contentType="CHAT_MESSAGE"
          generatedContent="In Japanese, there are several ways to say hello..."
          model="gpt-4"
          messageId="msg-hello"
          size="small"
        />
      </Box>
    </Paper>
  </Box>
);

// Callback example
export const WithCallback = () => {
  const [lastFeedback, setLastFeedback] = React.useState(null);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" gutterBottom>
          AI-generated vocabulary definitions
        </Typography>
        <Box sx={{ mt: 2, mb: 2 }}>
          <AIFeedbackWidget
            contentType="VOCABULARY_EXTRACTION"
            generatedContent="食べる (taberu) - to eat"
            model="gpt-4"
            size="medium"
            showLabels={true}
            onFeedbackSubmitted={(feedback) => {
              setLastFeedback(feedback);
              console.log('Feedback submitted:', feedback);
            }}
          />
        </Box>
        {lastFeedback && (
          <Paper sx={{ p: 2, bgcolor: 'success.light', mt: 2 }}>
            <Typography variant="body2">
              ✓ Feedback submitted: {lastFeedback.feedbackType}
            </Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};
