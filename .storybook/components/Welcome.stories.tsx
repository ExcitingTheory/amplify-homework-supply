/**
 * @fileoverview Welcome page - First-time user experience for Homework Supply Storybook
 * 
 * This is the landing page shown when users first visit Storybook.
 * It provides an overview of the platform and directs users to the existing
 * onboarding tools in the sidebar and addon panel.
 */

import React, { useMemo } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { linkTo } from '@storybook/addon-links';
import { 
  Box, 
  Typography, 
  Container, 
  Paper,
  Button,
  Link,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { useTheme as useStorybookTheme } from 'storybook/theming';
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

function buildMuiTheme(isDark: boolean) {
  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      background: {
        default: isDark ? '#1a1a2e' : '#f6f9fc',
        paper: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e0e0e0' : '#2E3338',
        secondary: isDark ? '#b0b0b0' : '#5C6570',
      },
    },
  });
}

const meta: Meta = {
  title: 'Getting Started/Welcome',
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
    let sbTheme: any;
    try { sbTheme = useStorybookTheme(); } catch { sbTheme = null; }
    const isDark = sbTheme?.base === 'dark' || (sbTheme == null && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    const muiTheme = useMemo(() => buildMuiTheme(isDark), [isDark]);

    return (
      <ThemeProvider theme={muiTheme}>
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
              border: '1px solid rgba(33, 150, 243, 0.3)',
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
                  bgcolor: '#2196F3',
                  color: '#fff',
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
                  bgcolor: '#4CAF50',
                  color: '#fff',
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
                    Click the <strong>"Onboarding"</strong> tab in the addon panel at the bottom of the screen 
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
                  bgcolor: '#FF9800',
                  color: '#fff',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  3
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
                    Explore Stories in the Sidebar
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Browse the component stories in the sidebar menu. Try the{' '}
                    <Link 
                      component="button" 
                      onClick={linkTo('📚 Creating Lessons/Workbook', 'WorkbookWithContent')}
                      sx={{ color: '#2196F3', cursor: 'pointer' }}
                    >
                      📚 Creating Lessons
                    </Link>
                    ,{' '}
                    <Link 
                      component="button" 
                      onClick={linkTo('💬 AI Assistant/Chat Sidebar', 'GettingStarted')}
                      sx={{ color: '#4CAF50', cursor: 'pointer' }}
                    >
                      💬 AI Assistant
                    </Link>
                    , and{' '}
                    <Link 
                      component="button" 
                      onClick={linkTo('📄 Pages/Application Pages', 'Index')}
                      sx={{ color: '#9C27B0', cursor: 'pointer' }}
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
                  bgcolor: '#9C27B0',
                  color: '#fff',
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
                    and see how components adapt to different locales (English, Japanese, Spanish, French, Chinese, German).
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Role Overview */}
          <Typography variant="h5" sx={{ color: 'text.primary', mb: 3 }}>
            Available Roles
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ fontSize: 32, color: '#2196F3' }} />
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
              <SchoolIcon sx={{ fontSize: 32, color: '#4CAF50' }} />
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
              <CodeIcon sx={{ fontSize: 32, color: '#9C27B0' }} />
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
              <LanguageIcon sx={{ fontSize: 32, color: '#FF9800' }} />
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

          {/* Platform Features */}
          <Typography variant="h5" sx={{ color: 'text.primary', mb: 3 }}>
            Platform Features
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
              }}
              onClick={linkTo('📚 Creating Lessons/Workbook', 'WorkbookWithContent')}
            >
              <MenuBookIcon sx={{ fontSize: 40, color: '#2196F3', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>Rich Editor</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Quizzes, vocabulary, multimedia</Typography>
            </Paper>

            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
              }}
              onClick={linkTo('💬 AI Assistant/Chat Sidebar', 'GettingStarted')}
            >
              <ChatIcon sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>AI Assistant</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Content creation & translations</Typography>
            </Paper>

            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
              }}
              onClick={linkTo('🎙️ Recording Audio/Recording Studio', 'StartFromScratch')}
            >
              <RecordVoiceOverIcon sx={{ fontSize: 40, color: '#FF9800', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>Audio Tools</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Recording & text-to-speech</Typography>
            </Paper>

            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)' },
              }}
              onClick={linkTo('📄 Pages/Application Pages', 'Index')}
            >
              <FolderIcon sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>Full Pages</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Complete user flows</Typography>
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
              onClick={linkTo('📚 Creating Lessons/Editor', 'EmptyEditorTextFormatting')}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              Editor
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={linkTo('📁 Managing Content/Vocabulary Review', 'Default')}
              sx={{ color: 'text.secondary', borderColor: 'divider' }}
            >
              Vocabulary
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={linkTo('📁 Managing Content/File Manager', 'Default')}
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
      </ThemeProvider>
    );
  },
};
