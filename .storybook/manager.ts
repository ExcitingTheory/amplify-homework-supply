import { addons, type State } from 'storybook/manager-api';

// Import custom onboarding addon
import './code/myOnboarding/manager';

// Import translation-mode addon after onboarding to ensure proper loading order
import './addons/translation-mode/manager';

addons.setConfig({
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
    showToolbar(state: State, defaultValue: boolean) {
      return state.viewMode === 'docs' ? false : defaultValue;
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