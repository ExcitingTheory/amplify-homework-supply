/**
 * For Developers - Architecture, Data Models, and Setup
 * Technical documentation moved from docs/ folder into Storybook.
 */
import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { SEMANTIC_THEME } from "../../src/themes/semanticTheme";
import { SyntaxHighlight } from "../../src/components/SyntaxHighlight";

const meta: Meta = {
  title: "🏠 Getting Started/Developer Notes",
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { disable: true },
  },
};
export default meta;
type Story = StoryObj;

export const Architecture: Story = {
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
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 4 }}>
          Architecture
        </Typography>

        {/* Stack */}
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Tech Stack
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 4 }}>
          <Chip label="Next.js 15 (App Router)" />
          <Chip label="React 19" />
          <Chip label="AWS Amplify Gen 2" />
          <Chip label="DynamoDB" />
          <Chip label="S3" />
          <Chip label="Cognito" />
          <Chip label="Lambda (TypeScript)" />
          <Chip label="OpenAI GPT-4" />
          <Chip label="Lexical Editor" />
          <Chip label="Material UI" />
          <Chip label="Yjs (CRDT)" />
          <Chip label="Vercel AI SDK" />
        </Box>

        {/* Architecture diagram as text */}
        <Paper
          elevation={SEMANTIC_THEME.elevation.card}
          sx={{
            p: 3,
            mb: 4,
            bgcolor: "background.paper",
            color: "text.primary",
            border: 1,
            borderColor: "divider",
            fontSize: 12,
            overflow: "auto",
            borderRadius: `${SEMANTIC_THEME.radius.card}px`,
          }}
        >
          <pre>{`
┌──────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  App     │ │ Contexts │ │Components│ │  Lexical Editor  │ │
│  │  Router  │ │  (State) │ │  (MUI)   │ │  (Rich Content)  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
│       │            │            │                │           │
│       └────────────┴────────────┴────────────────┘           │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │ Amplify Data Client
┌──────────────────────────────┼───────────────────────────────┐
│                     AWS Amplify Gen 2                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  AppSync │ │ Cognito  │ │    S3    │ │ Lambda Functions │ │
│  │ (GraphQL)│ │  (Auth)  │ │ (Files)  │ │  (OpenAI, etc.)  │ │
│  └────┬─────┘ └──────────┘ └──────────┘ └──────────────────┘ │
│       │                                                      │
│  ┌────┴─────┐                                                │
│  │ DynamoDB │                                                │
│  │ (Data)   │                                                │
│  └──────────┘                                                │
└──────────────────────────────────────────────────────────────┘
`}</pre>
        </Paper>

        {/* Key directories */}
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Project Structure
        </Typography>
        <Paper
          elevation={SEMANTIC_THEME.elevation.card}
          sx={{
            p: 2,
            mb: 4,
            fontSize: 13,
            overflow: "auto",
            borderRadius: `${SEMANTIC_THEME.radius.card}px`,
            border: 1,
            borderColor: "divider",
          }}
        >
          <pre>{`
app/                → Next.js App Router routes
  [locale]/         → i18n-prefixed pages
  actions/          → Server actions
  api/              → API routes
src/
  components/       → React components (MUI-based)
  context/          → React Context providers (state management)
  utils/            → Pure functions and helpers
  yjs/              → Yjs CRDT collaboration hooks and provider
amplify/
  data/resource.ts  → Data schema (models + auth rules)
  functions/        → Lambda functions (TypeScript)
  auth/             → Cognito configuration
  storage/          → S3 bucket configuration
.storybook/         → Storybook config, mocks, and docs
docs/               → Planning documents (architecture decisions)
`}</pre>
        </Paper>

        <Divider sx={{ my: 4 }} />

        {/* Auth Model */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Authentication & Authorization
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          AWS Cognito manages users with group-based access control:
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Group</strong>
                </TableCell>
                <TableCell>
                  <strong>Permissions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Admins</TableCell>
                <TableCell>Full access to all models</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Moderators</TableCell>
                <TableCell>Read/update most models, manage sections</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Instructors</TableCell>
                <TableCell>
                  Create/manage own content, sections, assignments
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Learners</TableCell>
                <TableCell>
                  Read published content, submit grades, join sections
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Data patterns */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Key Patterns
        </Typography>
        <Box component="ul" sx={{ pl: 3, "& li": { mb: 1.5 } }}>
          <li>
            <Typography>
              <strong>Real-time sync</strong> —{" "}
              <code>client.models.Model.observeQuery()</code> for live updates
              via WebSocket
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>One subscription per model</strong> — filter client-side,
              never duplicate subscriptions
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Context providers</strong> — shared state prevents
              subscription duplication across components
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Optimistic locking</strong> — pass <code>_version</code>{" "}
              on updates to prevent conflicts
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Lazy relationships</strong> —{" "}
              <code>await unit.words.toArray()</code> for ManyToMany joins
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>JSON fields</strong> — <code>Unit.data</code> (Lexical),{" "}
              <code>Grade.data</code> (responses) stored as JSON strings
            </Typography>
          </li>
        </Box>
      </Container>
    </Box>
  ),
};

export const GettingStarted: Story = {
  name: "Dev Setup",
  render: () => (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: { xs: 5, md: 7 },
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 4 }}>
          Developer Setup
        </Typography>

        <Paper
          component="section"
          aria-labelledby="developer-prerequisites"
          sx={{ p: 3, mb: 4 }}
        >
          <Typography
            id="developer-prerequisites"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Prerequisites
          </Typography>
          <Box component="ul" sx={{ pl: 3, "& li": { mb: 0.5 } }}>
            <li>
              <Typography>Node.js 20+</Typography>
            </li>
            <li>
              <Typography>npm 9+</Typography>
            </li>
            <li>
              <Typography>
                AWS CLI configured with SSO (for Amplify sandbox)
              </Typography>
            </li>
            <li>
              <Typography>Git</Typography>
            </li>
          </Box>
        </Paper>

        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Start
        </Typography>
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "background.paper",
            color: "text.primary",
            border: 1,
            borderColor: "divider",
            fontSize: 13,
          }}
        >
          <SyntaxHighlight
            language="bash"
            showLineNumbers
            maxWidthCh={80}
            code={`# Clone and install
git clone https://github.com/ExcitingTheory/amplify-homework-supply.git
cd amplify-homework-supply
npm install

# Add environment variables
echo "OPENAI_API_KEY=your_key_here" > .env.local

# Start Storybook (no AWS needed)
npm run storybook

# Start Next.js dev server (requires Amplify sandbox)
npm run sandbox        # Terminal 1: deploys cloud resources + streams logs
npm run dev            # Terminal 2: starts Next.js at https://localhost:3000

# Run tests
npm test               # Vitest unit tests
npm run test:storybook # Storybook render tests
npm run e2e             # Playwright browser tests`}
          />
        </Paper>

        <Typography
          variant="h5"
          component="h2"
          sx={{ fontWeight: 600, mb: 2, mt: 4 }}
        >
          Development Scripts
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Command</strong>
                </TableCell>
                <TableCell>
                  <strong>Purpose</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                ["npm run dev", "Next.js dev server (HTTPS, port 3000)"],
                ["npm run storybook", "Storybook dev (port 6006)"],
                ["npm run build", "Production Next.js build"],
                ["npm run build-storybook", "Static Storybook build"],
                ["npm test", "Run Vitest unit tests"],
                ["npm run test:storybook", "Run Storybook render tests"],
                ["npm run e2e", "Run Playwright browser tests"],
                ["npm run lint", "ESLint (zero warnings enforced)"],
                [
                  "npm run sandbox",
                  "Deploy Amplify sandbox with log streaming",
                ],
                [
                  "npm run sandbox:with-logs",
                  "Amplify sandbox + save logs to file",
                ],
              ].map(([cmd, desc]) => (
                <TableRow key={cmd}>
                  <TableCell sx={{ fontSize: 12 }}>
                    <code>{cmd}</code>
                  </TableCell>
                  <TableCell>{desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  ),
};
