// Custom Onboarding Addon Preset
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  name: '@storybook/addon-onboarding-custom',
  
  managerEntries: (entry = []) => [
    ...entry,
    // Manager (Storybook UI) side
    join(__dirname, 'manager.tsx'),
  ],
  
  previewAnnotations: (entry = []) => [
    ...entry,
    join(__dirname, 'preview.tsx'),
  ],
};
