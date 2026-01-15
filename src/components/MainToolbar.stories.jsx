import React from 'react';
import { Box, Typography } from '@mui/material';
import MainToolbar, { SettingsMenu, HelpMenu, UserMenu } from './MainToolbar';

export default {
  title: '📚 Creating Lessons/Main Toolbar',
  component: MainToolbar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Application navigation toolbar with user menu, settings, and help.

## Features
- **Responsive Design**: Adapts to mobile, tablet, and desktop viewports
- **User Menu**: Profile, password change, sign out
- **Settings Menu**: App configuration and preferences
- **Help Menu**: Documentation and support links
- **Material UI Integration**: Built with MUI AppBar and IconButtons

## Usage
Wrap page content with the MainToolbar component to add navigation.
        `.trim(),
      },
    },
  },
  tags: ['autodocs'],
};

export const FullToolbar = {
  render: () => (
    <MainToolbar>
      <Box sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          Page Content
        </Typography>
        <Typography variant="body1" paragraph>
          This is the content below the toolbar. The MainToolbar component wraps
          the page content and provides consistent navigation across the application.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The toolbar includes menus for user actions, settings, and help resources.
        </Typography>
      </Box>
    </MainToolbar>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete toolbar with page content, demonstrating typical usage in the application.',
      },
    },
  },
};

export const SettingsMenuOnly = {
  render: () => (
    <Box sx={{ p: 4, bgcolor: '#1976d2', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SettingsMenu />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Settings menu component displayed in isolation.',
      },
    },
  },
};

export const HelpMenuOnly = {
  render: () => (
    <Box sx={{ p: 4, bgcolor: '#1976d2', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <HelpMenu />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Help menu component displayed in isolation.',
      },
    },
  },
};

export const UserMenuOnly = {
  render: () => (
    <Box sx={{ p: 4, bgcolor: '#1976d2', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <UserMenu />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'User menu component displayed in isolation.',
      },
    },
  },
};

