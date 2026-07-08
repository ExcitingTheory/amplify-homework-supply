/**
 * @fileoverview Welcome page - First-time user experience for Homework Supply Storybook
 * 
 * This is the landing page shown when users first visit Storybook.
 * It provides an overview of the platform and directs users to the existing
 * onboarding tools in the sidebar and addon panel.
 */

import React from 'react';
import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { linkTo } from '@storybook/addon-links';
import { 
  Box, 
  Typography, 
  Container, 
  Paper,
  Button,
  Link,
  Chip,
  Divider,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExtensionIcon from '@mui/icons-material/Extension';
import RateReviewIcon from '@mui/icons-material/RateReview';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ShieldIcon from '@mui/icons-material/Shield';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  chips?: string[];
  storyLink?: [string, string];
  color: string;
}

function FeatureCard({ icon, title, description, chips = [], storyLink, color }: FeatureCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: storyLink ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': storyLink ? { bgcolor: 'action.hover', transform: 'translateY(-2px)', boxShadow: 4 } : {},
      }}
      onClick={storyLink ? linkTo(...storyLink) : undefined}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>{title}</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flex: 1 }}>
        {description}
      </Typography>
      {chips.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {chips.map(chip => (
            <Chip key={chip} label={chip} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
          ))}
        </Box>
      )}
    </Paper>
  );
}

const meta: Meta = {
  title: '🏠 Getting Started/Welcome',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      disable: true,
      description: {
        component: `
# Welcome to Homework Supply

An interactive e-learning platform built with Next.js, AWS Amplify, and AI-powered features.

This Storybook showcases:
- **Interactive Components**: Explore the building blocks of the platform
- **Full Page Layouts**: See how components work together
- **AI Features**: Chat assistant, audio generation, and content suggestions
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Welcome - The main landing page for first-time users
 */
export const Welcome: Story = {
  render: () => {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
          py: 6,
        }}
      >
        <Container maxWidth="md">
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{ 
                color: 'text.primary', 
                fontWeight: 700,
              }}
            >
              📚 Homework Supply
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: 'text.secondary', mb: 4, maxWidth: 600, mx: 'auto' }}
            >
              An interactive e-learning platform for creating, sharing, and completing educational content
            </Typography>
          </Box>

          {/* Getting Started Instructions */}
          <Paper 
            sx={{ 
              p: 4, 
              mb: 4, 
              bgcolor: 'rgba(33, 150, 243, 0.1)', 
              border: '1px solid',
              borderColor: 'rgba(33, 150, 243, 0.3)',
            }}
          >
            <Typography variant="h5" sx={{ color: 'text.primary', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              🚀 Getting Started
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Step 1: Sidebar */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  bgcolor: 'info.main',
                  color: 'info.contrastText',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  1
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                    <ArrowBackIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                    Select Your Role in the Sidebar
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Look at the <strong>Onboarding widget</strong> in the left sidebar. Choose your role: 
                    <strong> Instructor</strong>, <strong>Learner</strong>, <strong>Developer</strong>, or <strong>Translator</strong> 
                    to see personalized tasks.
                  </Typography>
                </Box>
              </Box>

              {/* Step 2: Addon Panel */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  bgcolor: 'success.main',
                  color: 'success.contrastText',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  2
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                    <ArrowDownwardIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                    View Tasks in the Onboarding Panel
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Click the <strong>"Onboarding"</strong> tab in the panel at the bottom of the screen 
                    to see your full task list, progress tracking, and interactive tutorials.
                  </Typography>
                </Box>
              </Box>

              {/* Step 3: Explore */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  3
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                    Explore Examples in the Sidebar
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Browse the interactive examples in the sidebar. Try the{' '}
                    <Link 
                      component="button" 
                      onClick={linkTo('✏️ Lesson Editor/Workbook', 'WorkbookWithContent')}
                      sx={{ color: 'info.main', cursor: 'pointer' }}
                    >
                      📚 Creating Lessons
                    </Link>
                    ,{' '}
                    <Link 
                      component="button" 
                      onClick={linkTo('💬 AI Assistant/Chat Sidebar', 'GettingStarted')}
                      sx={{ color: 'success.main', cursor: 'pointer' }}
                    >
                      💬 AI Assistant
                    </Link>
                    , and{' '}
                    <Link 
                      component="button" 
                      onClick={linkTo('📄 Pages/Application Pages', 'Index')}
                      sx={{ color: 'secondary.main', cursor: 'pointer' }}
                    >
                      📄 Pages
                    </Link>
                    {' '}sections.
                  </Typography>
                </Box>
              </Box>

              {/* Step 4: Translation Toolbar */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  bgcolor: 'secondary.main',
                  color: 'secondary.contrastText',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  4
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                    <ArrowUpwardIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                    Try the Translation Feature
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Look for the <TranslateIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} /> 
                    <strong>Globe icon</strong> in the toolbar at the top. Click it to switch languages 
                    and see how the app looks in different languages (English, Japanese, Spanish, French, Chinese, German).
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* Platform Features — comprehensive marketing overview        */}
          {/* ══════════════════════════════════════════════════════════ */}
          <Typography variant="h4" sx={{ color: 'text.primary', mb: 1, fontWeight: 700 }}>
            Platform Features
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            Everything instructors and learners need for interactive, AI-powered education.
          </Typography>

          {/* ── Authoring & Content ── */}
          <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 2, mb: 2, display: 'block' }}>
            Authoring &amp; Content
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, mb: 4 }}>
            <FeatureCard
              icon={<MenuBookIcon sx={{ fontSize: 36 }} />}
              title="Rich Lesson Editor"
              description="A powerful editor with quizzes, matching exercises, fill-in-the-blank, media embeds, drag-and-drop blocks, and live AI content suggestions."
              chips={['Quiz', 'Matching Exercises', 'Fill-in-the-Blank', 'Media Embeds', 'Drag & Drop', 'AI Suggestions']}
              storyLink={['✏️ Lesson Editor/Editor Components', 'QuizDefault']}
              color="info.main"
            />
            <FeatureCard
              icon={<FolderIcon sx={{ fontSize: 36 }} />}
              title="File & Document Management"
              description="Upload PDFs, images, audio, and video. AI-powered PDF analysis extracts vocabulary, summaries, and learning objectives automatically."
              chips={['Cloud Storage', 'PDF Analysis', 'Vocabulary Extraction', 'Audio/Video']}
              storyLink={['📁 Content Management/File Manager', 'Default']}
              color="secondary.main"
            />
            <FeatureCard
              icon={<ExtensionIcon sx={{ fontSize: 36 }} />}
              title="Vocabulary & Question Banks"
              description="Dedicated editors for vocabulary words (with pronunciation guides and audio) and question banks (multiple choice, short answer, with hints)."
              chips={['Vocabulary Editor', 'Question Editor', 'Pronunciation Guides', 'Audio Playback']}
              storyLink={['� Content Management/Dictionary Editor', 'Default']}
              color="success.main"
            />
          </Box>

          {/* ── AI & Intelligence ── */}
          <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 2, mb: 2, display: 'block' }}>
            AI &amp; Intelligence
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, mb: 4 }}>
            <FeatureCard
              icon={<ChatIcon sx={{ fontSize: 36 }} />}
              title="Two AI Assistants"
              description="Kai is a personal tutor for students — patient, encouraging, and uses hints to guide rather than just giving answers. Sage is a teaching assistant for instructors — helps design lessons, generate content, and review student performance."
              chips={['Kai (Student Tutor)', 'Sage (Teaching Assistant)', 'Real-time Responses', 'Lesson-Aware', 'Content Search', 'Insert into Editor']}
              storyLink={['💬 AI Assistant/Chat Sidebar', 'GettingStarted']}
              color="success.main"
            />
            <FeatureCard
              icon={<FitnessCenterIcon sx={{ fontSize: 36 }} />}
              title="Practice Drills"
              description="AI generates fresh quiz variations from your lesson content so students can keep practicing without memorising the same answers."
              chips={['AI-Generated', 'Unlimited Practice', 'XP Rewards', 'Multiple Formats']}
              storyLink={['🎯 Practice Drills/Dialog', 'Default']}
              color="warning.main"
            />
            <FeatureCard
              icon={<RecordVoiceOverIcon sx={{ fontSize: 36 }} />}
              title="Audio & Recording Studio"
              description="Record audio with a visual waveform, automatic AI transcription, and text-to-speech voice generation. Includes a script-style dialogue editor."
              chips={['AI Transcription', 'Text-to-Speech', 'Audio Visualization', 'Dialogue Editor', 'Timeline']}
              storyLink={['🎙️ Recording Studio/Recording Studio', 'StartFromScratch']}
              color="warning.main"
            />
          </Box>

          {/* ── Collaboration & Learning ── */}
          <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 2, mb: 2, display: 'block' }}>
            Collaboration &amp; Learning
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, mb: 4 }}>
            <FeatureCard
              icon={<GroupsIcon sx={{ fontSize: 36 }} />}
              title="Real-Time Workbook"
              description="Work on lessons together in real time. Students see tutor guidance live, receive instant AI feedback, and track their progress as they go."
              chips={['Live Collaboration', 'Tutor Guidance', "Who's Online", 'Instant AI Feedback', 'Progress Tracking']}
              storyLink={['📓 Workbook/Progress', 'Detailed']}
              color="info.main"
            />
            <FeatureCard
              icon={<RateReviewIcon sx={{ fontSize: 36 }} />}
              title="Peer Review"
              description="Students review each other's work with structured feedback prompts, join-by-code rooms, real-time chat, and invitation management."
              chips={['Join by Code', 'Feedback Prompts', 'Chat', 'Invitations']}
              storyLink={['🤝 Peer Review/Chat', 'ChatStory']}
              color="secondary.main"
            />
            <FeatureCard
              icon={<DashboardIcon sx={{ fontSize: 36 }} />}
              title="Instructor Dashboard"
              description="See class performance at a glance — leaderboards, student rankings, grade averages, and completion rates across all your classes."
              chips={['Leaderboard', 'Grade Analytics', 'Section Stats', 'Progress Bars']}
              storyLink={['📊 Instructor Tools/Dashboard', 'WithSections']}
              color="error.main"
            />
          </Box>

          {/* ── Gamification & Engagement ── */}
          <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 2, mb: 2, display: 'block' }}>
            Gamification &amp; Engagement
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, mb: 4 }}>
            <FeatureCard
              icon={<EmojiEventsIcon sx={{ fontSize: 36 }} />}
              title="XP, Levels & Badges"
              description="Track progress with XP, level badges, daily streaks, skill trees, personal bests, and celebration moments for big achievements."
              chips={['XP & Points', 'Levels', 'Streaks', 'Skill Tree', 'Badges', 'Celebrations']}
              storyLink={['🏆 Gamification/XP & Progression/Level Badge', 'Beginner']}
              color="warning.main"
            />
            <FeatureCard
              icon={<ShieldIcon sx={{ fontSize: 36 }} />}
              title="Squads & Social"
              description="Squad system with custom crests, leaderboards, post feeds, group challenges, boss battles, and campaign missions for team-based learning."
              chips={['Squads', 'Crests', 'Challenges', 'Boss Battles', 'Campaigns']}
              storyLink={['🏆 Gamification/Squads & Teams/Squad Leaderboard', 'Full']}
              color="error.main"
            />
            <FeatureCard
              icon={<PersonIcon sx={{ fontSize: 36 }} />}
              title="Avatar & Customization"
              description="Customizable avatars with armor, accessories, and cosmetics that unlock as you level up. Squads get unique emblems."
              chips={['Avatars', 'Armor & Accessories', 'Cosmetics', 'Level Unlocks', 'Squad Emblems']}
              storyLink={['🏆 Gamification/Avatars & Cosmetics/Avatar Customizer', 'Level2Colors']}
              color="info.main"
            />
          </Box>

          {/* ── Platform & Accessibility ── */}
          <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 2, mb: 2, display: 'block' }}>
            Platform &amp; Accessibility
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, mb: 4 }}>
            <FeatureCard
              icon={<LanguageIcon sx={{ fontSize: 36 }} />}
              title="Multiple Languages"
              description="Supports 6 languages (English, Chinese, Spanish, French, German, Japanese). Switch languages instantly from the toolbar."
              chips={['6 Languages', 'Live Switching', 'Right-to-Left Support', 'Full Coverage']}
              storyLink={['Translation Mode/Demo', 'Default']}
              color="secondary.main"
            />
            <FeatureCard
              icon={<WifiOffIcon sx={{ fontSize: 36 }} />}
              title="Offline Support"
              description="Works without an internet connection. Content loads in advance, changes sync when you're back online, and clear indicators show your connection status."
              chips={['Works Offline', 'Auto-Sync', 'Pre-loaded Content', 'Connection Status']}
              storyLink={['🔌 Offline & Sync/Sync Status Indicator', 'AllSynced']}
              color="warning.main"
            />
            <FeatureCard
              icon={<DarkModeIcon sx={{ fontSize: 36 }} />}
              title="Dark Mode & Theming"
              description="Full dark mode that follows your device settings automatically, with consistent styling throughout."
              chips={['Dark Mode', 'Follows Device Settings', 'Consistent Styling', 'Instant Switch']}
              color="info.main"
            />
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Role Overview */}
          <Typography variant="h5" sx={{ color: 'text.primary', mb: 3 }}>
            Available Roles
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ fontSize: 32, color: 'info.main' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  Instructor
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Create lessons, manage classes, and track student progress
                </Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <SchoolIcon sx={{ fontSize: 32, color: 'success.main' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  Learner
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Join classes, complete assignments, and track your learning
                </Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CodeIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  Developer
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Explore component library and technical documentation
                </Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <LanguageIcon sx={{ fontSize: 32, color: 'warning.main' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  Translator
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Localize content and review translations across languages
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Quick Links */}
          <Typography variant="h5" sx={{ color: 'text.primary', mb: 3, mt: 4 }}>
            Quick Links
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={linkTo('✏️ Lesson Editor/Editor', 'EmptyEditorTextFormatting')}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              Editor
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={linkTo('📁 Content Management/Dictionary Editor', 'Default')}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              Vocabulary
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={linkTo('📁 Content Management/File Manager', 'Default')}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              File Manager
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={linkTo('Translation Mode/Demo', 'Default')}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              Translation Demo
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={linkTo('📄 Pages/Application Pages', 'Sections')}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              Sections Page
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 6, color: 'text.disabled' }}>
            <Typography variant="body2">
              Built with Next.js • AWS Amplify • Material UI • OpenAI
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  },
};
