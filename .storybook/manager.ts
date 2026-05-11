import { addons, type State } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

// Import custom onboarding addon
import './code/myOnboarding/manager';

// translation-mode addon is loaded via preset.js in main.ts addons array (managerEntries)
// Do NOT import it here — that causes double-registration

// Use dark theme when system prefers dark
const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

addons.setConfig({
  // Set the default story for first-time users - shows welcome overview page
  initialStoryId: 'getting-started-welcome--welcome',
  navSize: 300,
  bottomPanelHeight: 300,
  rightPanelWidth: 300,
  panelPosition: 'bottom',
  enableShortcuts: true,
  showToolbar: true,
  showRoots: false,
  theme: prefersDark ? themes.dark : themes.light,
  selectedPanel: undefined,
  initialActive: 'sidebar',
  layoutCustomisations: {
    showSidebar(state: State, defaultValue: boolean) {
      return state.storyId === 'landing' ? false : defaultValue;
    },
    // Always show toolbar, including in docs mode
    showToolbar(_state: State, _defaultValue: boolean) {
      return true;
    },
    // Always show addon panel, including in docs mode
    showPanel(_state: State, _defaultValue: boolean) {
      return true;
    },
  },
  sidebar: {
    showRoots: false,
    collapsedRoots: ['other'],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});