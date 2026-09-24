/**
 * Why It Exists - Value proposition and pain points solved
 */
import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { SEMANTIC_THEME } from "../../src/themes/semanticTheme";

const meta: Meta = {
  title: "🏠 Getting Started/Why It Exists",
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

const painPoints = [
  {
    problem: "Creating interactive quizzes is tedious",
    solution: "AI generates quizzes from your content in seconds",
  },
  {
    problem: "Students disengage from static PDFs",
    solution: "Rich interactive blocks with immediate feedback",
  },
  {
    problem: "Grading takes hours",
    solution: "Auto-graded blocks with accuracy scores calculated instantly",
  },
  {
    problem: "No visibility into student progress",
    solution: "Real-time dashboard with per-student, per-assignment analytics",
  },
  {
    problem: "Content creation is a solo effort",
    solution: "AI assistant co-creates lessons, vocabulary, and questions",
  },
  {
    problem: "Students lack motivation",
    solution: "XP, streaks, badges, squads, leaderboards, and skill trees",
  },
  {
    problem: "Audio/pronunciation practice is hard to manage",
    solution: "Built-in recording studio with AI transcription and TTS",
  },
  {
    problem: "Students lose context switching between lesson and chat",
    solution:
      "Class chat lives inside the platform, scoped to each lesson or section",
  },
  {
    problem: "Students give up after getting an answer wrong once",
    solution:
      "AI-generated practice drills create fresh variations so students can keep drilling",
  },
];

const comparisons = [
  { feature: "AI Content Generation", us: true, lms: false, docs: false },
  { feature: "Real-time Collaboration", us: true, lms: false, docs: true },
  {
    feature: "Auto-graded Interactive Blocks",
    us: true,
    lms: true,
    docs: false,
  },
  {
    feature: "Gamification (XP/Badges/Skill Tree/Boss Battles)",
    us: true,
    lms: false,
    docs: false,
  },
  {
    feature: "Audio Recording + Transcription",
    us: true,
    lms: false,
    docs: false,
  },
  {
    feature: "PDF Analysis + Vocab Extraction",
    us: true,
    lms: false,
    docs: false,
  },
  {
    feature: "AI Practice Drills (unique variations)",
    us: true,
    lms: false,
    docs: false,
  },
  { feature: "Peer Review System", us: true, lms: false, docs: true },
  {
    feature: "Class Chat (scoped to lessons)",
    us: true,
    lms: false,
    docs: false,
  },
  { feature: "Offline Support", us: true, lms: true, docs: true },
  { feature: "6-Language i18n", us: true, lms: true, docs: false },
];

export const WhyItExists: Story = {
  render: () => (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        px: { xs: 2, md: 4 },
        py: {
          xs: SEMANTIC_THEME.padding.pageMobile / 8,
          md: SEMANTIC_THEME.padding.pageDesktop / 8,
        },
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 700, mb: 2, textAlign: "center" }}
        >
          Why it exists
        </Typography>
        <Typography
          variant="h6"
          component="p"
          color="text.secondary"
          sx={{
            mb: { xs: 5, md: 7 },
            textAlign: "center",
            maxWidth: 640,
            mx: "auto",
          }}
        >
          It was built for the real frustrations of teaching with static
          materials, fragmented tools, and slow manual feedback loops.
        </Typography>

        {/* Pain points → Solutions */}
        <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
          The workflow problems it addresses
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 8 }}>
          {painPoints.map((p, i) => (
            <Paper
              key={i}
              elevation={SEMANTIC_THEME.elevation.card}
              sx={{
                p: 2,
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                borderRadius: `${SEMANTIC_THEME.radius.card}px`,
                border: 1,
                borderColor: "divider",
              }}
            >
              <CancelIcon
                sx={{ color: "error.main", mt: 0.3, flexShrink: 0 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  {p.problem}
                </Typography>
              </Box>
              <CheckCircleIcon
                sx={{ color: "success.main", mt: 0.3, flexShrink: 0 }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {p.solution}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Comparison table */}
        <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
          Feature Comparison
        </Typography>
        <TableContainer
          component={Paper}
          elevation={SEMANTIC_THEME.elevation.card}
          sx={{
            mb: 6,
            borderRadius: `${SEMANTIC_THEME.radius.panel}px`,
            border: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Feature</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Homework Supply</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Traditional LMS</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Google Docs</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisons.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell>{row.feature}</TableCell>
                  <TableCell align="center">
                    {row.us ? (
                      <CheckCircleIcon sx={{ color: "success.main" }} />
                    ) : (
                      <CancelIcon sx={{ color: "text.disabled" }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {row.lms ? (
                      <CheckCircleIcon sx={{ color: "success.main" }} />
                    ) : (
                      <CancelIcon sx={{ color: "text.disabled" }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {row.docs ? (
                      <CheckCircleIcon sx={{ color: "success.main" }} />
                    ) : (
                      <CancelIcon sx={{ color: "text.disabled" }} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Who is it for */}
        <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
          Who is it for?
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 2,
          }}
        >
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Language Teachers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vocabulary drills, pronunciation recording, phonetic guides, and
              AI-generated practice exercises.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Science/STEM Instructors
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PDF analysis extracts key concepts, AI generates quiz questions,
              embedded media for demonstrations.
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tutors & Homeschoolers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time collaborative workbooks, personalized AI feedback,
              progress tracking across subjects.
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  ),
};
