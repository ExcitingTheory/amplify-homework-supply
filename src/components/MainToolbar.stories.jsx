import React from 'react';
import MainToolbar, { SettingsMenu, HelpMenu, UserMenu } from './MainToolbar';

export default {
  title: 'Components/MainToolbar',
  component: MainToolbar,
  parameters: {
    layout: 'fullscreen',
  },
};

export const FullToolbar = {
  render: () => (
    <MainToolbar>
      <div style={{ padding: '2rem' }}>
        <h1>Page Content</h1>
        <p>This is the content below the toolbar.</p>
      </div>
    </MainToolbar>
  ),
};

export const SettingsMenuOnly = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: '#1976d2' }}>
      <SettingsMenu />
    </div>
  ),
};

export const HelpMenuOnly = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: '#1976d2' }}>
      <HelpMenu />
    </div>
  ),
};

export const UserMenuOnly = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: '#1976d2' }}>
      <UserMenu />
    </div>
  ),
};
