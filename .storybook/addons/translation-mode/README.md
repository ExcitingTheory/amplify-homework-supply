# Storybook Translation Mode Addon

An addon for Storybook that enables in-context translation editing for i18n workflows.

## Features

- 🎯 **In-context editing**: See exactly where text appears in the UI
- 🌍 **Multi-language support**: Edit multiple languages side-by-side
- 📊 **Character count tracking**: Get warnings if translations are too long/short
- 📤 **Export to JSON or CSV**: Generate translation files for your project
- 🔍 **Usage tracking**: See which stories use each translation
- 🎨 **Visual indicators**: Color-coded highlights for translation status

## Installation

The addon is already integrated into this Storybook instance. No additional installation required.

## Usage

### 1. Automatic Capturing with `useTranslation` (Recommended)

If your components already use `next-i18next`'s `useTranslation` hook, **Translation Mode automatically captures all `t()` calls** without any code changes! Just add the decorator:

```tsx
import { withTranslationMode } from '../.storybook/addons/translation-mode';

export default {
  title: 'My Component',
  component: MyComponent,
  decorators: [withTranslationMode],
};
```

Your existing code works as-is:

```tsx
function MyComponent() {
  const { t } = useTranslation('common');
  
  return (
    <Button>{t('actions.save')}</Button>  // ✅ Automatically captured!
  );
}
```

**How it works:** The `next-i18next` module is mocked in Storybook to use `useTranslationWithCapture`, which wraps every `t()` function call to automatically capture translations and sync them with Translation Mode.

### 2. Enable Translation Mode

Click the **globe icon** in the Storybook toolbar and choose a mode:

- **Off**: Normal story viewing (default)
- **Highlight Mode**: Hover over text to see translation keys in tooltips
- **Edit Mode**: Click on any text to open the translation editor

### 3. Manual Wrapping with `TranslationOverlay` (Alternative)

For components that don't use `useTranslation`, or for more granular control, wrap text manually:

```tsx
import { TranslationOverlay } from '../.storybook/addons/translation-mode';

<Button>
  <TranslationOverlay 
    tKey="actions.save" 
    namespace="common"
    value="Save"
    context="Optional context for translators"
  >
    Save
  </TranslationOverlay>
</Button>
```

Or enable it globally in `.storybook/preview.jsx` (already configured).

### 4. Edit Translations

1. Switch to **Edit Mode** in the toolbar
2. Click on any highlighted text
3. The translation panel opens on the right
4. Edit translations for each language
5. Character count warnings show if text is too long/short
6. Click **Save Translation** to save changes (TODO: implement actual persistence)

### 5. Export Translations

1. Open the translation panel
2. Click **Export Translations**
3. Choose format:
   - **JSON**: Standard i18n format (one file per language/namespace)
   - **CSV**: Spreadsheet-friendly format
   - **Diff**: Show only changes
4. Select languages to include
5. Click **Export** to download

## API Reference

### TranslationOverlay Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tKey` | `string` | Yes | Translation key (e.g., "actions.save") |
| `namespace` | `string` | Yes | Namespace (e.g., "common", "editor") |
| `value` | `string` | Yes | Default text (usually English) |
| `children` | `ReactNode` | Yes | The text to display |
| `defaultValue` | `string` | No | Fallback value if translation missing |
| `context` | `string` | No | Context for translators |
| `storyName` | `string` | No | Story where this is used (auto-captured) |

### Contexts

#### TranslationCaptureContext

Manages captured translations:

```tsx
const { translations, captureTranslation, getTranslation, updateTranslation } = 
  useContext(TranslationCaptureContext);
```

#### TranslationModeContext

Manages UI state:

```tsx
const { mode, setMode, selectedTranslation, selectTranslation, isPanelOpen } = 
  useContext(TranslationModeContext);
```

## Architecture

### Directory Structure

```
.storybook/addons/translation-mode/
├── components/
│   ├── TranslationOverlay.tsx    # Wrapper that highlights text
│   ├── TranslationPanel.tsx      # Side panel for editing
│   ├── ExportDialog.tsx          # Export configuration
│   └── TranslationDemo.tsx       # Demo component
├── contexts/
│   ├── TranslationCaptureContext.tsx  # Stores captured translations
│   └── TranslationModeContext.tsx     # UI state management
├── hooks/
│   └── useTranslationCapture.ts  # Hook for manual capture
├── utils/
│   └── TranslationExporter.ts    # Export functionality
├── decorator.tsx                 # Storybook decorator
├── preset.ts                     # Toolbar configuration
├── index.ts                      # Public API
└── README.md                     # This file
```

### How It Works

1. **Decorator**: The `withTranslationMode` decorator wraps all stories with the necessary providers
2. **Overlay**: Each translatable text is wrapped in `TranslationOverlay`
3. **Capture**: On mount, the overlay captures its translation data
4. **Interaction**: User clicks on highlighted text
5. **Edit**: Translation panel opens with all languages
6. **Save**: Changes are saved to context (TODO: persist to files)
7. **Export**: Download updated translation files

## Customization

### Add More Languages

Edit `TranslationModeContext.tsx`:

```tsx
const [currentLanguages, setCurrentLanguages] = useState<string[]>([
  'en', 'ja', 'es', 'fr'  // Add more languages
]);
```

### Change Highlight Colors

Edit `TranslationOverlay.tsx`:

```tsx
const getOutlineColor = () => {
  if (!hover) return 'transparent';
  if (hasMissingTranslations) return 'error.main';      // Red
  if (hasPartialTranslations) return 'warning.main';    // Yellow
  return 'success.main';                                 // Green
};
```

### Add AI Translation Suggestions

Integrate OpenAI in the translation panel (see spec for example).

## TODO / Future Enhancements

- [ ] Persist translations to actual JSON files
- [ ] Load existing translations from `public/locales/`
- [ ] AI-assisted translation suggestions
- [ ] Pluralization support (count-based translations)
- [ ] Screenshot capture for context
- [ ] Translation memory (reuse previous translations)
- [ ] GitHub PR generation for translation updates
- [ ] Real-time collaboration (multiple translators)
- [ ] Translation coverage metrics
- [ ] Keyboard shortcuts for navigation

## Example

See [.storybook/TranslationMode.stories.tsx](.storybook/TranslationMode.stories.tsx) for a complete working example.

## Support

For issues or questions, see the main project documentation.
