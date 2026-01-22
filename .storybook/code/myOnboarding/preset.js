// Custom Onboarding Addon Preset
const path = require('path');

module.exports = {
  name: '@storybook/addon-onboarding-custom',
  
  managerEntries: (entry = []) => [
    ...entry,
    // Manager (Storybook UI) side
    path.join(__dirname, 'manager.tsx'),
  ],
  
  previewAnnotations: (entry = []) => [
    ...entry,
    path.join(__dirname, 'preview.tsx'),
  ],
};
