import { addons, type State } from 'storybook/manager-api';

// Import custom onboarding addon
import './code/myOnboarding/manager';

// Import translation-mode addon after onboarding to ensure proper loading order
import './addons/translation-mode/manager';

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
  theme: undefined,
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