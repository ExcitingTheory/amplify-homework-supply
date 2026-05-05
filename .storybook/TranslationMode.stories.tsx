import type { Meta, StoryObj } from '@storybook/react';
import { TranslationDemo } from './addons/translation-mode/components/TranslationDemo';
import { withTranslationMode } from './addons/translation-mode';

const meta: Meta<typeof TranslationDemo> = {
  title: '🌐 Internationalization/Translation Mode',
  component: TranslationDemo,
  decorators: [withTranslationMode],
  parameters: {
    layout: 'fullscreen',
    options: {
      showPanel: true,
      showToolbar: true,
    },
    docs: {
      description: {
        component: `
# Translation Mode Demo

This story demonstrates the Translation Mode addon for Storybook with rich English metadata.

## How to Use

1. **Enable Translation Mode**: Click the globe icon in the Storybook toolbar
2. **Choose a mode**:
   - **Highlight Mode**: Hover over text to see translation keys
   - **Edit Mode**: Click on any text to edit its translation
3. **View metadata**: Click on highlighted text to see comprehensive metadata including:
   - **Context**: Description of when/where the text is used
   - **Component Location**: File path of the component using this text
   - **Component Description**: Details about the component and its behavior
   - **Usage**: How users interact with this text
   - **Impact**: Critical/High/Important - how essential is this text
   - **User Type**: Which user groups see this text
   - **Tone**: Formal/Casual/Technical style guide
   - **Alternative Terms**: Synonym suggestions for translation variety
4. **Edit translations**: Modify the English source or add translations in other languages
5. **Export translations**: Use the "Export Translations" button in the panel to download translation files

## Features

- 🎯 **In-context editing**: See exactly where text appears in the UI
- 📋 **Rich metadata**: View comprehensive context from translation files
- 🌍 **Multi-language support**: Edit English and Japanese side-by-side
- 📊 **Character count tracking**: Get warnings if translations are too long/short
- 📤 **Export to JSON or CSV**: Generate translation files for your project
- 🔍 **Usage tracking**: See which stories use each translation
- 🎨 **Impact color coding**: Critical (red), High (orange), Important (default)

## Integration

To use the translation mode in your own stories:

\`\`\`tsx
import { TranslationOverlay } from '.storybook/addons/translation-mode';

<TranslationOverlay 
  tKey="your.translation.key" 
  namespace="common"
  value="Your text here"
>
  Your text here
</TranslationOverlay>
\`\`\`

Or use the decorator to enable it for all stories:

\`\`\`tsx
export default {
  decorators: [withTranslationMode],
};
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TranslationDemo>;

export const Default: Story = {
  args: {
    namespace: 'common',
    storyName: 'Translation Mode/Demo/Default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Common namespace with shared UI translations like buttons, labels, and navigation elements.',
      },
    },
  },
};

export const EditorNamespace: Story = {
  args: {
    namespace: 'editor',
    storyName: 'Translation Mode/Demo/Editor Namespace',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demo using the "editor" namespace for translations',
      },
    },
  },
};

export const AuthNamespace: Story = {
  args: {
    namespace: 'auth',
    storyName: 'Translation Mode/Demo/Auth Namespace',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demo using the "auth" namespace for translations',
      },
    },
  },
};
