/**
 * Core Concepts - Units, Sections, Grading, and AI
 * Explains the fundamental ideas and how features connect.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  Chip,
} from '@mui/material';

const meta: Meta = {
  title: '🏠 Getting Started/Core Concepts',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

function ConceptSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>{title}</Typography>
      {children}
    </Box>
  );
}

export const UnitsAndLessons: Story = {
  name: 'Units & Lessons',
  render: () => (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
          Core Concepts
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 6, textAlign: 'center' }}>
          Understanding the building blocks of Homework Supply
        </Typography>

        <ConceptSection title="Units (Lessons)">
          <Typography variant="body1" sx={{ mb: 2 }}>
            A <strong>Unit</strong> is the core content container — an interactive document created by an instructor.
            Units can include rich text, images, audio, video, PDF embeds, vocabulary lists, and practice questions.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Units contain <strong>graded blocks</strong> — interactive elements that students answer for a score:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Quiz (multiple choice)" color="primary" variant="outlined" />
            <Chip label="Answer (fill-in-the-blank)" color="primary" variant="outlined" />
            <Chip label="Meaning Association (match pairs)" color="primary" variant="outlined" />
            <Chip label="Custom Answer (open-ended)" color="primary" variant="outlined" />
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Each unit can also carry a <strong>vocabulary list</strong> (words with definitions, phonetics, and audio)
            and a <strong>question bank</strong> (practice questions used by AI drills and auto-graders).
          </Typography>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="Sections & Assignments">
          <Typography variant="body1" sx={{ mb: 2 }}>
            A <strong>Section</strong> is a class — a group of students. Instructors create sections and share
            a <strong>join code</strong> (6 characters) that students use to enroll.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            An <strong>Assignment</strong> links a Unit to a Section with an optional due date.
            When an assignment is created, all enrolled students can open it as a personal workbook.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Section</Typography>
              <Typography variant="body2">Name · Join code · Student roster</Typography>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Assignment</Typography>
              <Typography variant="body2">Links a Unit to a Section · Optional due date</Typography>
            </Paper>
          </Box>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="Grading System">
          <Typography variant="body1" sx={{ mb: 2 }}>
            When a student opens an assignment, a personal <strong>Grade record</strong> is created automatically.
            As they work through the lesson, each graded block records whether it was answered correctly.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The overall grade is the <strong>average accuracy</strong> across all graded blocks in the lesson.
            Instructors can see per-student scores in the section dashboard in real time.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Grade</Typography>
              <Typography variant="body2">Overall accuracy · Per-block responses · Completion status</Typography>
            </Paper>
          </Box>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="AI Integration">
          <Typography variant="body1" sx={{ mb: 2 }}>
            AI is woven throughout the platform:
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5 } }}>
            <li>
              <Typography><strong>Chat Assistant</strong> — Context-aware AI that knows the current lesson, files, and vocabulary. Streams responses in real time.</Typography>
            </li>
            <li>
              <Typography><strong>Content Generation</strong> — Generates quiz questions, vocabulary, and lesson outlines from a prompt or uploaded document.</Typography>
            </li>
            <li>
              <Typography><strong>Audio Transcription</strong> — Converts student recordings to text for review and grading.</Typography>
            </li>
            <li>
              <Typography><strong>Text-to-Speech</strong> — Generates pronunciation audio for vocabulary words.</Typography>
            </li>
            <li>
              <Typography><strong>PDF Analysis</strong> — Uploads a document and the AI extracts key vocabulary and learning objectives automatically.</Typography>
            </li>
            <li>
              <Typography><strong>Semantic Search</strong> — Find related content across lessons, vocabulary, and questions using meaning-based search.</Typography>
            </li>
            <li>
              <Typography><strong>Practice Drills</strong> — AI generates fresh variations of graded blocks so students can drill until confident, without just memorising answers.</Typography>
            </li>
          </Box>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="Peer Review">
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>Peer Review</strong> lets instructors open a shared collaborative room where students
            give and receive structured feedback on each other's work.
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5 } }}>
            <li><Typography>Instructors assign peer reviewers to specific students or open an open-room model.</Typography></li>
            <li><Typography>Students leave inline comments and structured feedback via prompts set by the instructor.</Typography></li>
            <li><Typography>Real-time presence shows who is in the room and what they are reviewing.</Typography></li>
          </Box>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="Collaborative Chat">
          <Typography variant="body1" sx={{ mb: 2 }}>
            Each section has a built-in <strong>class chat</strong> — a real-time threaded discussion board
            powered by Yjs CRDT sync so messages appear instantly without page refresh.
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5 } }}>
            <li><Typography>Topics can be scoped to a specific lesson, assignment, or the whole class.</Typography></li>
            <li><Typography>Supports @mentions, pinned topics, and rich-text messages.</Typography></li>
            <li><Typography>Instructors and students see who is online in real time.</Typography></li>
          </Box>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="Gamification">
          <Typography variant="body1" sx={{ mb: 2 }}>
            A full engagement system keeps students motivated throughout the course:
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5 } }}>
            <li><Typography><strong>XP & Levels</strong> — Students earn experience points for completing assignments, drills, and peer reviews.</Typography></li>
            <li><Typography><strong>Badges</strong> — Awarded for achievements like streaks, perfect scores, and first completions.</Typography></li>
            <li><Typography><strong>Skill Tree</strong> — Visual progression map that unlocks new content as skills are mastered.</Typography></li>
            <li><Typography><strong>Streaks</strong> — Daily and weekly activity streaks with a streak shield to protect them.</Typography></li>
            <li><Typography><strong>Squads</strong> — Students form small teams, earn group XP, and compete on a squad leaderboard.</Typography></li>
            <li><Typography><strong>Boss Battles & Campaigns</strong> — Instructor-created challenges with a story arc, timed phases, and group victory conditions.</Typography></li>
            <li><Typography><strong>Avatar Customization</strong> — Students unlock cosmetics, armor, and avatar styles as rewards.</Typography></li>
            <li><Typography><strong>Easter Eggs</strong> — Hidden surprise rewards triggered by specific in-lesson actions.</Typography></li>
          </Box>
        </ConceptSection>
      </Container>
    </Box>
  ),
};
