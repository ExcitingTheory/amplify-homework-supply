/**
 * Quick Tour - AI Assistant
 * Animated screenshot walkthrough showing how the AI chat works.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Container, Alert } from '@mui/material';
import { AnimatedDemo, DemoStep } from '../components/AnimatedDemo';

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

const aiSteps: DemoStep[] = [
  {
    screenshot: '/docs/tour/ai-01-open-chat.png',
    cursorTarget: [92, 50],
    click: true,
    caption: 'Step 1: Click the chat icon to open the AI Assistant sidebar',
    annotation: 'Open Chat',
    annotationOffset: [-45, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/ai-02-ask-question.png',
    cursorTarget: [80, 85],
    click: true,
    caption: 'Step 2: Type a request — "Generate 5 quiz questions about photosynthesis"',
    annotation: 'Send Message',
    annotationOffset: [-50, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/ai-03-streaming.png',
    cursorTarget: [80, 50],
    caption: 'Step 3: Watch the AI stream its response with content suggestions',
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/ai-04-tool-call.png',
    cursorTarget: [80, 60],
    caption: 'Step 4: The AI can search your content library and reference existing materials',
    annotation: 'Tool: search_content',
    annotationOffset: [-70, -45],
    duration: 3000,
  },
  {
    screenshot: '/docs/tour/ai-05-insert.png',
    cursorTarget: [80, 70],
    click: true,
    caption: 'Step 5: Click "Insert" to add AI-generated blocks directly into your lesson',
    annotation: 'Insert into Editor',
    annotationOffset: [-65, -45],
    duration: 3000,
  },
];

export const AIAssistant: Story = {
  render: () => (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
          AI Assistant
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Generate content, get suggestions, and insert blocks with chat
        </Typography>

        <Alert severity="info" sx={{ mb: 4 }}>
          The AI assistant is context-aware — it knows about your current unit,
          files, and vocabulary to give relevant suggestions.
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <AnimatedDemo
            steps={aiSteps}
            width="100%"
            autoPlay={true}
            loop={true}
            speed={1}
          />
        </Box>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            What the AI can do
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 1 } }}>
            <li><Typography><strong>Generate content</strong> — quizzes, vocabulary lists, lesson outlines, fill-in-the-blank exercises</Typography></li>
            <li><Typography><strong>Search your library</strong> — finds relevant units, files, and vocabulary using semantic search</Typography></li>
            <li><Typography><strong>Insert blocks</strong> — places generated content directly into the editor as formatted blocks</Typography></li>
            <li><Typography><strong>Transcribe audio</strong> — converts uploaded recordings to text via Whisper</Typography></li>
            <li><Typography><strong>Analyze PDFs</strong> — extracts text, vocabulary, and generates questions from documents</Typography></li>
            <li><Typography><strong>Generate audio</strong> — creates text-to-speech audio for pronunciation guides</Typography></li>
          </Box>
        </Box>
      </Container>
    </Box>
  ),
};
