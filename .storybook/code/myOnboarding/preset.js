// Custom Onboarding Addon Preset
module.exports = {
  name: '@storybook/addon-onboarding-custom',
  
  managerEntries: [
    // Manager (Storybook UI) side
    require.resolve('./manager.tsx'),
  ],
  
  previewAnnotations: [
    require.resolve('./preview.tsx'),
  ],
};
