/**
 * Global toolbar configuration for Translation Mode
 * This file is imported in the browser context
 */
export const globalTypes = {
  translationMode: {
    description: 'Translation editing mode',
    defaultValue: 'off',
    toolbar: {
      title: 'Translation Mode',
      icon: 'globe',
      items: [
        { value: 'off', title: 'Off', icon: 'circle' },
        { value: 'highlight', title: 'Highlight Mode', icon: 'eye' },
        { value: 'edit', title: 'Edit Mode', icon: 'edit' },
      ],
      dynamicTitle: true,
    },
  },
  translationLanguage: {
    description: 'Override display language for translations',
    defaultValue: 'en',
    toolbar: {
      title: 'Language',
      icon: 'document',
      items: [
        { value: 'en', title: 'English', icon: 'globe' },
        { value: 'ja', title: 'Japanese (日本語)', icon: 'globe' },
        { value: 'es', title: 'Spanish (Español)', icon: 'globe' },
        { value: 'fr', title: 'French (Français)', icon: 'globe' },
        { value: 'zh', title: 'Chinese (中文)', icon: 'globe' },
        { value: 'de', title: 'German (Deutsch)', icon: 'globe' },
      ],
      dynamicTitle: true,
    },
  },
};
