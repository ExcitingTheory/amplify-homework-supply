import React from 'react';
import { createRoot } from 'react-dom/client';
import { addons, types } from 'storybook/manager-api';
import OnboardingPanel from '../../components/OnboardingPanel';
import OnboardingSummary from '../../components/OnboardingSummary';

const ADDON_ID = 'storybook/addon-onboarding-custom';
const PANEL_ID = `${ADDON_ID}/panel`;

let root: ReturnType<typeof createRoot> | null = null;

const injectIntoSidebar = (api: any) => {
  // Find the sidebar container
  const sidebar = document.querySelector('[role="navigation"]') || 
                  document.querySelector('#storybook-explorer-tree')?.parentElement;
  
  if (!sidebar) {
    console.warn('[Onboarding] Sidebar not found yet, will retry...');
    setTimeout(() => injectIntoSidebar(api), 500);
    return;
  }
  
  // Check if our container already exists
  let container = document.getElementById('storybook-addon-onboarding-custom');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'storybook-addon-onboarding-custom';
    container.style.marginTop = '16px';
    container.style.paddingLeft = '12px';
    container.style.paddingRight = '12px';
    container.style.paddingBottom = '16px';
    
    // Insert after the logo/branding section, before the tree
    const tree = sidebar.querySelector('#storybook-explorer-tree');
    if (tree) {
      sidebar.insertBefore(container, tree);
    } else {
      sidebar.appendChild(container);
    }
  }
  
  if (!root) {
    root = createRoot(container);
  }
  
  // Render the compact summary widget
  root.render(<OnboardingSummary api={api} />);
  console.log('[Onboarding] Summary injected into sidebar');
};

// Register the onboarding addon
addons.register(ADDON_ID, (api) => {
  console.log('[Storybook] Custom onboarding addon registered');
  
  // Add as a panel so it appears in the addon panel tabs
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Onboarding',
    match: ({ viewMode }) => viewMode === 'story',
    render: ({ active }) => (
      active ? <OnboardingPanel api={api} /> : null
    ),
  });
  
  // Inject compact summary into sidebar below the logo
  setTimeout(() => {
    injectIntoSidebar(api);
  }, 1000);
});
