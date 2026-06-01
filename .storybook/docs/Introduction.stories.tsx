/**
 * Introduction - What is Homework Supply?
 * First page new users see explaining the platform at a high level.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Box,
  Typography,
  Container,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupsIcon from '@mui/icons-material/Groups';
import DevicesIcon from '@mui/icons-material/Devices';

const meta: Meta = {
  title: '🏠 Getting Started/Introduction',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

function PillarCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Paper sx={{ p: 3, height: '100%', textAlign: 'center' }}>
      <Box sx={{ color: 'primary.main', mb: 2 }}>{icon}</Box>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{description}</Typography>
    </Paper>
  );
}

export const Introduction: Story = {
  render: () => (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="md">
        {/* Hero */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            Homework Supply
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            An AI-powered e-learning platform where instructors create interactive lessons
            and students learn with real-time feedback.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Next.js" size="small" />
            <Chip label="AWS Amplify" size="small" />
            <Chip label="OpenAI" size="small" />
            <Chip label="Real-time Collaboration" size="small" />
            <Chip label="Peer Review" size="small" />
            <Chip label="Practice Drills" size="small" />
            <Chip label="Gamification" size="small" />
            <Chip label="Offline Support" size="small" />
          </Box>
        </Box>

        {/* What it does */}
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}>
          What does it do?
        </Typography>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          <Grid item xs={12} sm={6}>
            <PillarCard
              icon={<SchoolIcon sx={{ fontSize: 48 }} />}
              title="Create Lessons"
              description="Rich editor with quizzes, fill-in-the-blank, vocabulary drills, audio, video, and PDF content. Build a full curriculum in minutes."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PillarCard
              icon={<AutoAwesomeIcon sx={{ fontSize: 48 }} />}
              title="AI-Powered"
              description="Chat assistant generates content, transcribes audio, analyzes PDFs, and provides personalized feedback to students in real-time."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PillarCard
              icon={<GroupsIcon sx={{ fontSize: 48 }} />}
              title="Collaborative"
              description="Real-time workbooks with tutor cursors, peer review with shared annotation, class chat rooms, squads, and group challenges. Students see instructor guidance live."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PillarCard
              icon={<DevicesIcon sx={{ fontSize: 48 }} />}
              title="Anywhere Access"
              description="Works offline with service workers, supports 6 languages, and adapts to any screen size. Dark mode included."
            />
          </Grid>
        </Grid>

        {/* How it works summary */}
        <Paper sx={{ p: 4, bgcolor: 'action.hover' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            How it works
          </Typography>
          <Box component="ol" sx={{ pl: 3, '& li': { mb: 2 } }}>
            <li>
              <Typography><strong>Instructors</strong> create Units (lessons) with rich content and graded blocks</Typography>
            </li>
            <li>
              <Typography><strong>Instructors</strong> organize students into Sections (classes) and create Assignments</Typography>
            </li>
            <li>
              <Typography><strong>Students</strong> join via code, open assignments, and complete graded activities</Typography>
            </li>
            <li>
              <Typography><strong>AI</strong> assists both roles — generating content for instructors and providing feedback to students</Typography>
            </li>
            <li>
              <Typography><strong>Practice Drills</strong> let students replay graded content as AI-generated variations for extra practice</Typography>
            </li>
            <li>
              <Typography><strong>Peer Review</strong> enables students to give structured feedback on each other's work in collaborative rooms</Typography>
            </li>
            <li>
              <Typography><strong>Gamification</strong> keeps students engaged with XP, badges, skill trees, boss battles, streaks, squads, and leaderboards</Typography>
            </li>
          </Box>
        </Paper>
      </Container>
    </Box>
  ),
};
