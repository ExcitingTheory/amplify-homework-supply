/**
 * Overview - What is Homework Supply?
 * First page new users see explaining the platform at a high level.
 */
import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Box, Typography, Container, Paper, Chip, Grid } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import GroupsIcon from "@mui/icons-material/Groups";
import DevicesIcon from "@mui/icons-material/Devices";
import { SEMANTIC_THEME } from "../../src/themes/semanticTheme";

const meta: Meta = {
  title: "🏠 Getting Started/Overview",
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

function PillarCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Paper
      elevation={SEMANTIC_THEME.elevation.card}
      sx={{
        p: {
          xs: SEMANTIC_THEME.padding.cardMobile / 8,
          md: SEMANTIC_THEME.padding.cardDesktop / 8,
        },
        height: "100%",
        textAlign: "left",
        borderRadius: `${SEMANTIC_THEME.radius.card}px`,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ color: "primary.main", mb: 2, display: "flex" }}>{icon}</Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
}

export const Overview: Story = {
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
        {/* Hero */}
        <Box
          component="header"
          sx={{
            maxWidth: 760,
            mx: "auto",
            textAlign: "center",
            mb: {
              xs: SEMANTIC_THEME.spacing.pageGap / 8,
              md: SEMANTIC_THEME.spacing.pageGap / 4,
            },
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Homework Supply
          </Typography>
          <Typography
            variant="h5"
            component="p"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 600, mx: "auto" }}
          >
            A learning workspace for creating, assigning, and completing
            interactive lessons with AI support, collaborative feedback, and
            measurable progress.
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Chip label="Units" size="small" />
            <Chip label="Sections" size="small" />
            <Chip label="Assignments" size="small" />
            <Chip label="AI Feedback" size="small" />
            <Chip label="Practice Drills" size="small" />
            <Chip label="Real-time Collaboration" size="small" />
          </Box>
        </Box>

        {/* What it does */}
        <Box
          component="section"
          aria-labelledby="overview-includes"
          sx={{ mb: { xs: 6, md: 8 } }}
        >
          <Typography
            id="overview-includes"
            variant="h4"
            component="h2"
            sx={{ mb: 4, fontWeight: 600, textAlign: "center" }}
          >
            What it includes
          </Typography>

          <Grid container spacing={SEMANTIC_THEME.spacing.panelGap / 8}>
            <Grid item xs={12} sm={6}>
              <PillarCard
                icon={<SchoolIcon sx={{ fontSize: 48 }} />}
                title="Create Lessons"
                description="Rich editor with quizzes, fill-in-the-blank, vocabulary drills, audio, video, and PDF content. Use autocomplete and AI suggestions to speed up content creation. Build a full curriculum in minutes."
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
        </Box>

        {/* How it works summary */}
        <Paper
          component="section"
          aria-labelledby="overview-workflow"
          elevation={SEMANTIC_THEME.elevation.card}
          sx={{
            p: { xs: 2, md: 3 },
            bgcolor: "action.hover",
            border: 1,
            borderColor: "divider",
            borderRadius: `${SEMANTIC_THEME.radius.panel}px`,
          }}
        >
          <Typography
            id="overview-workflow"
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            How the workflow fits together
          </Typography>
          <Box component="ol" sx={{ pl: 3, "& li": { mb: 2 } }}>
            <li>
              <Typography>
                <strong>Instructors</strong> create lessons as Units and add
                interactive graded blocks, media, and vocabulary.
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>Sections</strong> organize students into classes, and
                Assignments publish those lessons to a group.
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>Students</strong> open workbooks, complete the tasks,
                and receive immediate progress and feedback.
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>AI</strong> supports both sides of the workflow:
                drafting content, grading patterns, and guiding student
                practice.
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>Review loops</strong> like peer feedback, drills, and
                progression systems help students keep improving.
              </Typography>
            </li>
          </Box>
        </Paper>
      </Container>
    </Box>
  ),
};
