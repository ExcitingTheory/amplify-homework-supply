import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  name: '@storybook/addon-translation-mode',
  
  managerEntries: (entry = []) => [
    ...entry,
    join(__dirname, 'manager.tsx'),
  ],
};

// Re-export globalTypes from the browser-safe file
export { globalTypes } from './globalTypes.js';
