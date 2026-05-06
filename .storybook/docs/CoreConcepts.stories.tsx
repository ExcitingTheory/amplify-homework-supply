/**
 * Core Concepts - Units, Sections, Grading, and AI
 * Explains the fundamental data model and how features connect.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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

function DataBox({ label, fields }: { label: string; fields: string[] }) {
  return (
    <Paper sx={{ p: 2, display: 'inline-flex', flexDirection: 'column', gap: 0.5, minWidth: 180 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{label}</Typography>
      {fields.map((f) => (
        <Typography key={f} variant="caption" sx={{ fontFamily: 'monospace' }}>{f}</Typography>
      ))}
    </Paper>
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
            It stores rich content as Lexical JSON in the <code>data</code> field.
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
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <DataBox label="Unit" fields={['id', 'name', 'description', 'data (JSON)', 'published', 'owner']} />
            <DataBox label="Word" fields={['id', 'word', 'definition', 'phonetic', 'audio', 'language']} />
            <DataBox label="Question" fields={['id', 'question', 'answers[]', 'correctAnswer', 'hint']} />
          </Box>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="Sections & Assignments">
          <Typography variant="body1" sx={{ mb: 2 }}>
            A <strong>Section</strong> is a class — a group of students. Instructors create sections and share
            a <strong>join code</strong> (6 characters) that students use to enroll.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            An <strong>Assignment</strong> links a Unit to a Section with an optional due date.
            When an assignment is created, all students in that section can access the unit as a workbook.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <DataBox label="Section" fields={['id', 'name', 'joinCode', 'owner', 'members[]']} />
            <DataBox label="Assignment" fields={['id', 'unitId', 'sectionId', 'dueDate', 'published']} />
          </Box>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="Grading System">
          <Typography variant="body1" sx={{ mb: 2 }}>
            When a student opens an assignment, a <strong>Grade</strong> record is created automatically.
            As they complete graded blocks, the <code>data</code> JSON field tracks each block's response:
          </Typography>
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.900', color: 'grey.100', fontFamily: 'monospace', fontSize: 13, overflow: 'auto' }}>
            <pre style={{ margin: 0 }}>{`{
  "block-id-1": { "complete": true, "accuracy": 100, "userAnswer": "photosynthesis" },
  "block-id-2": { "complete": true, "accuracy": 75, "selectedOptions": [0, 2] },
  "block-id-3": { "complete": false, "accuracy": 0 }
}`}</pre>
          </Paper>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The overall <strong>accuracy</strong> is the average of all completed graded blocks.
            The <strong>rubric</strong> field lists which block IDs count toward the grade.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <DataBox label="Grade" fields={['id', 'accuracy', 'complete', 'data (JSON)', 'rubric[]', 'owner', 'assignmentId']} />
          </Box>
        </ConceptSection>

        <Divider sx={{ my: 4 }} />

        <ConceptSection title="AI Integration">
          <Typography variant="body1" sx={{ mb: 2 }}>
            AI is woven throughout the platform via Lambda functions calling OpenAI:
          </Typography>
          <Box component="ul" sx={{ pl: 3, '& li': { mb: 1.5 } }}>
            <li>
              <Typography><strong>Chat Assistant</strong> — GPT-4 with streaming, context-aware (knows current unit, files, vocabulary)</Typography>
            </li>
            <li>
              <Typography><strong>Content Generation</strong> — Generates quiz questions, vocabulary, lesson outlines from prompts</Typography>
            </li>
            <li>
              <Typography><strong>Audio Transcription</strong> — Whisper API converts recordings to text</Typography>
            </li>
            <li>
              <Typography><strong>Text-to-Speech</strong> — Generates pronunciation audio for vocabulary words</Typography>
            </li>
            <li>
              <Typography><strong>PDF Analysis</strong> — Extracts text, identifies vocabulary, generates learning objectives</Typography>
            </li>
            <li>
              <Typography><strong>Embeddings</strong> — Semantic search across units, words, and questions via text-embedding-3-small</Typography>
            </li>
            <li>
              <Typography><strong>Practice Drills</strong> — AI generates fresh quiz variations from unit content</Typography>
            </li>
          </Box>
        </ConceptSection>
      </Container>
    </Box>
  ),
};
