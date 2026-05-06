/**
 * Why Homework Supply - Value proposition and pain points solved
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const meta: Meta = {
  title: '🏠 Getting Started/Why Homework Supply',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

const painPoints = [
  {
    problem: 'Creating interactive quizzes is tedious',
    solution: 'AI generates quizzes from your content in seconds',
  },
  {
    problem: 'Students disengage from static PDFs',
    solution: 'Rich interactive blocks with immediate feedback',
  },
  {
    problem: 'Grading takes hours',
    solution: 'Auto-graded blocks with accuracy scores calculated instantly',
  },
  {
    problem: 'No visibility into student progress',
    solution: 'Real-time dashboard with per-student, per-assignment analytics',
  },
  {
    problem: 'Content creation is a solo effort',
    solution: 'AI assistant co-creates lessons, vocabulary, and questions',
  },
  {
    problem: 'Students lack motivation',
    solution: 'XP, streaks, badges, guilds, leaderboards, and skill trees',
  },
  {
    problem: 'Audio/pronunciation practice is hard to manage',
    solution: 'Built-in recording studio with AI transcription and TTS',
  },
];

const comparisons = [
  { feature: 'AI Content Generation', us: true, lms: false, docs: false },
  { feature: 'Real-time Collaboration', us: true, lms: false, docs: true },
  { feature: 'Auto-graded Interactive Blocks', us: true, lms: true, docs: false },
  { feature: 'Gamification (XP/Badges/Guilds)', us: true, lms: false, docs: false },
  { feature: 'Audio Recording + Transcription', us: true, lms: false, docs: false },
  { feature: 'PDF Analysis + Vocab Extraction', us: true, lms: false, docs: false },
  { feature: 'Offline Support', us: true, lms: true, docs: true },
  { feature: '6-Language i18n', us: true, lms: true, docs: false },
  { feature: 'Peer Review System', us: true, lms: false, docs: true },
  { feature: 'Practice Drills (AI-generated)', us: true, lms: false, docs: false },
];

export const WhyHomeworkSupply: Story = {
  render: () => (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
          Why Homework Supply?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 6, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
          Built by an educator who was frustrated with existing tools.
          Here's what makes it different.
        </Typography>

        {/* Pain points → Solutions */}
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Problems We Solve
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 8 }}>
          {painPoints.map((p, i) => (
            <Paper key={i} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <CancelIcon sx={{ color: 'error.main', mt: 0.3, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                  {p.problem}
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ color: 'success.main', mt: 0.3, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {p.solution}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Comparison table */}
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Feature Comparison
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 6 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Feature</strong></TableCell>
                <TableCell align="center"><strong>Homework Supply</strong></TableCell>
                <TableCell align="center"><strong>Traditional LMS</strong></TableCell>
                <TableCell align="center"><strong>Google Docs</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisons.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell>{row.feature}</TableCell>
                  <TableCell align="center">
                    {row.us ? <CheckCircleIcon sx={{ color: 'success.main' }} /> : <CancelIcon sx={{ color: 'text.disabled' }} />}
                  </TableCell>
                  <TableCell align="center">
                    {row.lms ? <CheckCircleIcon sx={{ color: 'success.main' }} /> : <CancelIcon sx={{ color: 'text.disabled' }} />}
                  </TableCell>
                  <TableCell align="center">
                    {row.docs ? <CheckCircleIcon sx={{ color: 'success.main' }} /> : <CancelIcon sx={{ color: 'text.disabled' }} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Who is it for */}
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Who is it for?
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Language Teachers</Typography>
            <Typography variant="body2" color="text.secondary">
              Vocabulary drills, pronunciation recording, phonetic guides, and AI-generated practice exercises.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Science/STEM Instructors</Typography>
            <Typography variant="body2" color="text.secondary">
              PDF analysis extracts key concepts, AI generates quiz questions, embedded media for demonstrations.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Tutors & Homeschoolers</Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time collaborative workbooks, personalized AI feedback, progress tracking across subjects.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  ),
};
