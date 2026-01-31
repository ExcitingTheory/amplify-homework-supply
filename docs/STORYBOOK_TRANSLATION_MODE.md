# Storybook In-Context Translation Mode

## Vision

A specialized Storybook mode that allows translators to see components in their actual UI context and edit translations side-by-side across all languages—eliminating the need to work with abstract JSON files or spreadsheets.

## Current i18n Setup

**Framework**: next-i18next (based on next-i18next)  
**Structure**: Namespace-based JSON files in `public/locales/{lang}/{namespace}.json`  
**Languages**: 
- ✅ English (`en/`) - Complete
- 🚧 Japanese (`ja/`) - Empty (ready for translation)

**Namespaces**:
- `common.json` - Actions, navigation, status, time
- `chat.json` - Chat interface strings
- `editor.json` - Editor UI
- `units.json` - Learning unit management
- `grades.json` - Grading interface
- `auth.json` - Authentication flows
- `errors.json` - Error messages

## Goals

1. **Contextual Translation**: See exactly where text appears in the UI
2. **Side-by-Side Editing**: Compare and edit all languages simultaneously
3. **Zero Context Switching**: No jumping between files/tools
4. **Visual Validation**: Immediately see how translations fit in the layout
5. **Export Workflow**: Generate complete translation files or PRs

---

## Architecture

### 1. Translation Overlay System

A custom Storybook decorator that wraps the entire component tree and makes all i18n text interactive.

```
┌─────────────────────────────────────┐
│  Storybook Component Render         │
│  ┌───────────────────────────────┐  │
│  │ <Button>{t('actions.save')}</Button>
│  │   ↓                            │  │
│  │ <TranslationWrapper            │  │
│  │   tKey="actions.save"          │  │
│  │   namespace="common"           │  │
│  │   value="Save"                 │  │
│  │ >                              │  │
│  │   Save [clickable overlay]     │  │
│  │ </TranslationWrapper>          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. Component Structure

```
.storybook/
  addons/
    translation-mode/
      index.ts                    # Addon entry point
      register.tsx                # Storybook addon registration
      preset.ts                   # Preset configuration
      
      components/
        TranslationPanel.tsx      # Side panel UI
        TranslationOverlay.tsx    # Clickable text wrapper
        TranslationEditor.tsx     # Inline editing modal
        LanguageComparison.tsx    # Multi-language grid
        ExportDialog.tsx          # Export translations UI
        
      decorators/
        withTranslationMode.tsx   # Component wrapper decorator
        
      hooks/
        useTranslationCapture.ts  # Intercept i18n calls
        useTranslationState.ts    # Manage translation data
        
      utils/
        translationParser.ts      # Parse translation files
        translationExporter.ts    # Generate updated JSONs
        keyPathResolver.ts        # Resolve nested keys
        
      types/
        index.ts                  # TypeScript definitions
```

### 3. Core Functionality Flow

#### A. Detection Phase
```javascript
// Intercept all t() calls via custom hook wrapper
function useTranslation(namespace) {
  const { t, i18n } = useOriginalTranslation(namespace);
  const { captureTranslation } = useTranslationCapture();
  
  return {
    t: (key, options) => {
      const value = t(key, options);
      
      // In translation mode, register this key
      captureTranslation({
        key,
        namespace,
        value,
        language: i18n.language,
        interpolation: options
      });
      
      return value;
    },
    i18n
  };
}
```

#### B. Wrapping Phase
```jsx
// Decorator wraps all text nodes with interactive overlays
function withTranslationMode(Story, context) {
  const { translationMode } = context.globals;
  
  if (!translationMode) {
    return <Story />;
  }
  
  return (
    <TranslationCaptureProvider>
      <TranslationOverlayProvider>
        <Story />
      </TranslationOverlayProvider>
      <TranslationPanel />
    </TranslationCaptureProvider>
  );
}
```

#### C. Interaction Phase
```jsx
// Click on any translated text
<TranslationOverlay 
  tKey="actions.save" 
  namespace="common"
  onClick={() => openEditor({
    key: 'actions.save',
    namespace: 'common',
    currentValues: {
      en: 'Save',
      ja: '' // empty, needs translation
    }
  })}
>
  Save
</TranslationOverlay>
```

---

## UI/UX Design

### Mode 1: Highlight Mode (Default)

**Visual States**:
- 🟢 **Translated in all languages**: Faint green outline on hover
- 🟡 **Partially translated**: Yellow outline on hover
- 🔴 **Missing translations**: Red outline on hover
- 📝 **Selected**: Blue outline with edit cursor

**Interaction**:
- Hover: Show tooltip with translation key
- Click: Open side panel with editor

### Mode 2: Side Panel Layout

```
┌────────────────────────────────┬──────────────────────────┐
│  Component Canvas              │  Translation Panel       │
│                                │                          │
│  ┌──────────────┐              │  📝 actions.save         │
│  │ [Save] ←selected           │  Namespace: common       │
│  └──────────────┘              │                          │
│                                │  ┌────────────────────┐  │
│  ┌──────────────┐              │  │ English (en) ✓     │  │
│  │ [Cancel]     │              │  │ Save               │  │
│  └──────────────┘              │  └────────────────────┘  │
│                                │  ┌────────────────────┐  │
│  Rest of component...          │  │ Japanese (ja) ⚠️   │  │
│                                │  │ [Empty - click to  │  │
│                                │  │  translate]        │  │
│                                │  └────────────────────┘  │
│                                │                          │
│                                │  Character count: 4/50   │
│                                │  ✓ Fits in UI           │
│                                │                          │
│                                │  [Save] [Cancel]         │
└────────────────────────────────┴──────────────────────────┘
```

### Mode 3: Modal Editor (Alternative)

When clicking on text, show a centered modal:

```
┌─────────────────────────────────────────────┐
│  Translate "actions.save"                   │
│  Namespace: common                          │
├─────────────────────────────────────────────┤
│                                             │
│  Source (English - Primary)                 │
│  ┌─────────────────────────────────────┐   │
│  │ Save                                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Japanese (ja)                              │
│  ┌─────────────────────────────────────┐   │
│  │ 保存                                  │   │
│  └─────────────────────────────────────┘   │
│  Character count: 2 | Layout: ✓ Fits       │
│                                             │
│  Spanish (es) - Future                      │
│  ┌─────────────────────────────────────┐   │
│  │ Guardar                              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Context:                                   │
│  Used in: ChatSidebar.stories.tsx           │
│  Screenshot: [thumbnail]                    │
│                                             │
│  [Save Translation] [Cancel] [Next Missing] │
└─────────────────────────────────────────────┘
```

### Mode 4: Matrix View

Show all translatable strings in a table:

```
╔═══════════════════════╦═══════════╦═══════════╦══════════╗
║ Key                   ║ English   ║ Japanese  ║ Status   ║
╠═══════════════════════╬═══════════╬═══════════╬══════════╣
║ common:actions.save   ║ Save      ║ 保存      ║ ✓        ║
║ common:actions.cancel ║ Cancel    ║ [empty]   ║ ⚠️ Edit  ║
║ chat:send_message     ║ Send...   ║ [empty]   ║ ⚠️ Edit  ║
║ editor:toolbar.bold   ║ Bold      ║ 太字      ║ ✓        ║
╚═══════════════════════╩═══════════╩═══════════╩══════════╝

[Filter: 🔴 Missing only] [Export] [Import]
```

---

## Implementation Examples

### Example 1: TranslationOverlay Component

```tsx
// .storybook/addons/translation-mode/components/TranslationOverlay.tsx

import React, { useState } from 'react';
import { Box, Tooltip } from '@mui/material';

interface TranslationOverlayProps {
  tKey: string;
  namespace: string;
  children: React.ReactNode;
  languages: Record<string, string>; // { en: "Save", ja: "" }
  onEdit: () => void;
}

export const TranslationOverlay: React.FC<TranslationOverlayProps> = ({
  tKey,
  namespace,
  children,
  languages,
  onEdit
}) => {
  const [hover, setHover] = useState(false);
  
  // Determine completion status
  const totalLanguages = Object.keys(languages).length;
  const completedLanguages = Object.values(languages).filter(v => v).length;
  
  const status = 
    completedLanguages === totalLanguages ? 'complete' :
    completedLanguages === 0 ? 'empty' : 'partial';
  
  const colorMap = {
    complete: '#4caf50',
    partial: '#ff9800',
    empty: '#f44336'
  };
  
  return (
    <Tooltip title={`${namespace}:${tKey}`} arrow>
      <Box
        component="span"
        onClick={onEdit}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        sx={{
          position: 'relative',
          cursor: 'pointer',
          outline: hover ? `2px solid ${colorMap[status]}` : 'none',
          outlineOffset: '2px',
          borderRadius: '2px',
          transition: 'outline 0.2s',
          '&::after': hover ? {
            content: '"✏️"',
            position: 'absolute',
            top: -8,
            right: -8,
            fontSize: '12px',
            background: 'white',
            borderRadius: '50%',
            padding: '2px'
          } : {}
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
};
```

### Example 2: useTranslationCapture Hook

```typescript
// .storybook/addons/translation-mode/hooks/useTranslationCapture.ts

import { useContext, useCallback } from 'react';
import { TranslationCaptureContext } from '../contexts/TranslationCaptureContext';

interface CaptureData {
  key: string;
  namespace: string;
  value: string;
  language: string;
  interpolation?: Record<string, any>;
}

export const useTranslationCapture = () => {
  const { translations, addTranslation } = useContext(TranslationCaptureContext);
  
  const captureTranslation = useCallback((data: CaptureData) => {
    // Build a unique identifier
    const id = `${data.namespace}:${data.key}`;
    
    // Store in global registry
    addTranslation(id, {
      namespace: data.namespace,
      key: data.key,
      languages: {
        [data.language]: data.value
      },
      interpolation: data.interpolation,
      usageCount: (translations[id]?.usageCount || 0) + 1
    });
  }, [addTranslation, translations]);
  
  return { captureTranslation };
};
```

### Example 3: Translation Panel Component

```tsx
// .storybook/addons/translation-mode/components/TranslationPanel.tsx

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';

interface Translation {
  id: string;
  namespace: string;
  key: string;
  languages: Record<string, string>;
}

export const TranslationPanel: React.FC = () => {
  const { translations } = useTranslationContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  
  const selected = selectedId ? translations[selectedId] : null;
  
  // Get completion stats
  const stats = Object.values(translations).reduce((acc, t) => {
    const langs = Object.keys(t.languages).length;
    const completed = Object.values(t.languages).filter(v => v).length;
    
    if (completed === langs) acc.complete++;
    else if (completed === 0) acc.missing++;
    else acc.partial++;
    
    return acc;
  }, { complete: 0, partial: 0, missing: 0 });
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Translations</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Chip label={`✓ ${stats.complete}`} color="success" size="small" />
          <Chip label={`⚠️ ${stats.partial}`} color="warning" size="small" />
          <Chip label={`⚠️ ${stats.missing}`} color="error" size="small" />
        </Box>
      </Box>
      
      {/* Translation List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {Object.entries(translations).map(([id, translation]) => {
            const isComplete = Object.values(translation.languages).every(v => v);
            
            return (
              <ListItem key={id} disablePadding>
                <ListItemButton
                  selected={selectedId === id}
                  onClick={() => setSelectedId(id)}
                >
                  <ListItemText
                    primary={id}
                    secondary={translation.languages.en}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  {!isComplete && <Chip label="⚠️" size="small" />}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      
      {/* Editor Section */}
      {selected && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', maxHeight: '50%', overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            Editing: {selected.id}
          </Typography>
          
          <Divider sx={{ my: 1 }} />
          
          {/* Language inputs */}
          {Object.entries(selected.languages).map(([lang, value]) => (
            <Box key={lang} sx={{ mb: 2 }}>
              <Typography variant="caption" display="block" gutterBottom>
                {lang.toUpperCase()}
                {value ? ' ✓' : ' ⚠️'}
              </Typography>
              <TextField
                fullWidth
                size="small"
                defaultValue={value}
                placeholder={`Enter ${lang} translation...`}
                onChange={(e) => setEditValues({
                  ...editValues,
                  [lang]: e.target.value
                })}
                helperText={`${(editValues[lang] || value || '').length} characters`}
              />
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button variant="contained" size="small">
              Save
            </Button>
            <Button variant="outlined" size="small">
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
```

### Example 4: Storybook Global Toolbar Control

```typescript
// .storybook/addons/translation-mode/preset.ts

export const globalTypes = {
  translationMode: {
    name: 'Translation Mode',
    description: 'Enable in-context translation editing',
    defaultValue: false,
    toolbar: {
      title: 'Translation Mode',
      icon: 'globe',
      items: [
        { value: false, title: 'Off', icon: 'circlehollow' },
        { value: true, title: 'Highlight Mode', icon: 'circle' },
        { value: 'matrix', title: 'Matrix View', icon: 'grid' }
      ],
      dynamicTitle: true
    }
  },
  translationLanguage: {
    name: 'Translation Language',
    description: 'Select language to translate to',
    defaultValue: 'ja',
    toolbar: {
      title: 'Target Language',
      icon: 'transfer',
      items: [
        { value: 'ja', title: 'Japanese' },
        { value: 'es', title: 'Spanish (future)' },
        { value: 'fr', title: 'French (future)' }
      ],
      dynamicTitle: true
    }
  }
};
```

---

## Advanced Features

### 1. AI-Assisted Translation

Integrate OpenAI for suggestions:

```typescript
async function suggestTranslation(
  text: string, 
  targetLang: string,
  context?: string
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{
        role: 'system',
        content: `You are a professional translator. Translate UI text from English to ${targetLang}. Keep it concise and culturally appropriate.`
      }, {
        role: 'user',
        content: `Translate: "${text}"${context ? `\n\nContext: ${context}` : ''}`
      }]
    })
  });
  
  return response.json();
}
```

### 2. Layout Validation

Check if translated text fits:

```typescript
interface LayoutCheck {
  fits: boolean;
  overflow: number;
  warnings: string[];
}

function validateLayout(
  originalText: string,
  translatedText: string,
  maxLength?: number
): LayoutCheck {
  const lengthDiff = translatedText.length - originalText.length;
  const percentIncrease = (lengthDiff / originalText.length) * 100;
  
  const warnings = [];
  
  if (percentIncrease > 50) {
    warnings.push('Translation is 50% longer - may cause layout issues');
  }
  
  if (maxLength && translatedText.length > maxLength) {
    warnings.push(`Exceeds max length of ${maxLength} characters`);
  }
  
  return {
    fits: warnings.length === 0,
    overflow: maxLength ? Math.max(0, translatedText.length - maxLength) : 0,
    warnings
  };
}
```

### 3. Export Workflows

Generate updated translation files:

```typescript
// .storybook/addons/translation-mode/utils/translationExporter.ts

interface ExportOptions {
  format: 'json' | 'diff' | 'pr';
  languages: string[];
  namespaces: string[];
}

export class TranslationExporter {
  async export(
    translations: Record<string, Translation>,
    options: ExportOptions
  ) {
    const grouped = this.groupByNamespace(translations);
    
    if (options.format === 'json') {
      return this.exportJSON(grouped, options.languages);
    }
    
    if (options.format === 'diff') {
      return this.exportDiff(grouped, options.languages);
    }
    
    if (options.format === 'pr') {
      return this.createPullRequest(grouped, options.languages);
    }
  }
  
  private exportJSON(
    grouped: Record<string, Translation[]>,
    languages: string[]
  ) {
    const files: Record<string, any> = {};
    
    for (const [namespace, translations] of Object.entries(grouped)) {
      for (const lang of languages) {
        const filePath = `public/locales/${lang}/${namespace}.json`;
        
        files[filePath] = translations.reduce((acc, t) => {
          this.setNestedValue(acc, t.key, t.languages[lang] || '');
          return acc;
        }, {});
      }
    }
    
    return files;
  }
  
  private setNestedValue(obj: any, path: string, value: any) {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
    target[lastKey] = value;
  }
  
  // ... more export methods
}
```

### 4. Translation Memory

Store and suggest previous translations:

```typescript
interface TranslationMemory {
  source: string;
  target: string;
  language: string;
  namespace: string;
  timestamp: number;
  translator?: string;
}

class TranslationMemoryStore {
  private memory: TranslationMemory[] = [];
  
  addEntry(entry: TranslationMemory) {
    this.memory.push({
      ...entry,
      timestamp: Date.now()
    });
    this.persist();
  }
  
  findSimilar(source: string, language: string, threshold = 0.8): TranslationMemory[] {
    return this.memory
      .filter(m => m.language === language)
      .filter(m => this.similarity(source, m.source) >= threshold)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  private similarity(a: string, b: string): number {
    // Simple Levenshtein distance-based similarity
    // Could use more sophisticated algorithms
    const distance = this.levenshtein(a, b);
    const maxLength = Math.max(a.length, b.length);
    return 1 - (distance / maxLength);
  }
  
  private persist() {
    localStorage.setItem('translation-memory', JSON.stringify(this.memory));
  }
}
```

---

## Integration with Existing Workflow

### Step 1: Install Addon

```bash
# Install required dependencies
npm install --save-dev \
  @storybook/addon-essentials \
  levenshtein-edit-distance \
  react-syntax-highlighter
```

### Step 2: Register Addon

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    // ... existing addons
    './addons/translation-mode'
  ]
};
```

### Step 3: Mock i18n in Stories

```tsx
// src/components/ChatSidebar.stories.tsx
import { withTranslationMode } from '../../.storybook/addons/translation-mode';

export default {
  component: ChatSidebar,
  decorators: [withTranslationMode],
  parameters: {
    translationMode: {
      // Preload translation files for this story
      namespaces: ['chat', 'common'],
      languages: ['en', 'ja']
    }
  }
};
```

### Step 4: Use in Development

1. Start Storybook: `npm run storybook`
2. Open any story
3. Toggle "Translation Mode" in toolbar
4. Click on any text to edit translations
5. Export translations when done

---

## Example Use Cases

### Use Case 1: Japanese Translation Sprint

**Goal**: Translate all UI strings to Japanese

**Workflow**:
1. Translator opens Storybook
2. Enables Translation Mode (Highlight mode)
3. Sees all red-outlined (untranslated) text
4. Clicks first untranslated string
5. Side panel shows:
   - English: "Save"
   - Japanese: [empty input field]
6. Types: "保存"
7. System validates:
   - ✓ Fits in button
   - Character count: 2
8. Clicks "Save and Next" → jumps to next missing translation
9. Repeats until complete
10. Clicks "Export Translations"
11. Downloads updated `ja/common.json`, `ja/chat.json`, etc.
12. Commits to Git or creates PR

### Use Case 2: Layout Testing

**Goal**: Ensure German translations don't break layouts (German words are typically longer)

**Workflow**:
1. Open Button component story
2. Switch to Translation Mode
3. Add German translation: "Speichern" (longer than "Save")
4. System shows warning: "⚠️ 60% longer than original"
5. Visual preview shows button is still acceptable
6. Translator approves
7. For very long words, designer can adjust button min-width

### Use Case 3: Context Discovery

**Goal**: Translator needs to understand where "Bank" means "financial institution" vs "river bank"

**Workflow**:
1. Translator sees key: `common:bank`
2. Clicks on it
3. Panel shows:
   - Used in: `BankSelector.stories.tsx`, `AccountPage.stories.tsx`
   - Screenshot previews of both contexts
4. Translator sees it's financial context
5. Translates to Japanese: "銀行" (not "土手")

---

## Benefits

### For Translators
- ✅ **See context**: Understand exactly where text appears
- ✅ **No technical knowledge needed**: No JSON syntax, no Git
- ✅ **Visual validation**: Immediately see if text fits
- ✅ **Efficient workflow**: Click, type, save, next
- ✅ **Quality assurance**: Layout checks, character limits

### For Developers
- ✅ **No manual file management**: Export generates correct JSON structure
- ✅ **Review translations in UI**: See exactly how they look
- ✅ **Catch issues early**: Layout problems surface immediately
- ✅ **Maintain consistency**: Reuse translation memory
- ✅ **Onboard translators easily**: No dev environment setup needed

### For Product/Design
- ✅ **Design validation**: Ensure UI works in all languages
- ✅ **A/B test translations**: Try different phrasings visually
- ✅ **Stakeholder review**: Non-technical reviewers can preview
- ✅ **Documentation**: Screenshots with real translations

---

## Technical Challenges & Solutions

### Challenge 1: Intercepting `t()` Calls

**Problem**: How to capture all translation keys without modifying every component?

**Solution**: Context-based wrapper + custom hook:
```tsx
// In decorator
<I18nextProvider i18n={instrumentedI18n}>
  <Story />
</I18nextProvider>

// instrumentedI18n wraps every t() call to capture metadata
```

### Challenge 2: Text Wrapping

**Problem**: How to wrap text nodes with click handlers without breaking layout?

**Solution**: Use inline `<span>` with minimal styling:
```tsx
<span style={{ outline: 'inherit', position: 'relative' }}>
  {children}
</span>
```

### Challenge 3: Performance with Many Strings

**Problem**: 100+ translatable strings on one page = slow

**Solution**: 
- Virtualized list in panel
- Lazy load translations
- Debounce hover effects

### Challenge 4: Nested Keys

**Problem**: `t('actions.save.confirm.title')` has nested structure

**Solution**: Key path resolver:
```typescript
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((o, k) => o[k] ??= {}, obj);
  target[last] = value;
}
```

### Challenge 5: Pluralization & Interpolation

**Problem**: `t('items', { count: 5 })` → "5 items" or "5 item"?

**Solution**: Store interpolation metadata:
```typescript
{
  key: 'items',
  interpolation: { count: 5 },
  pluralRules: {
    en: { one: '1 item', other: '{{count}} items' },
    ja: { other: '{{count}}個のアイテム' }
  }
}
```

---

## Future Enhancements

### Phase 1: Core Features (MVP)
- ✅ Highlight mode with click-to-edit
- ✅ Side panel with all translations
- ✅ Export to JSON files
- ✅ Basic layout validation

### Phase 2: Workflow Tools
- 🔮 AI translation suggestions
- 🔮 Translation memory integration
- 🔮 Batch edit mode
- 🔮 Progress tracking (% complete per namespace)
- 🔮 Search/filter translations

### Phase 3: Collaboration
- 🔮 Multi-user editing (conflict detection)
- 🔮 Comment threads on translations
- 🔮 Approval workflow (translator → reviewer → merge)
- 🔮 Git integration (auto-create PRs)

### Phase 4: Advanced
- 🔮 Screenshot-based context
- 🔮 RTL language support preview
- 🔮 Accessibility checks (screen reader text)
- 🔮 Integration with Crowdin/Lokalise APIs
- 🔮 Character encoding validation
- 🔮 Automated pluralization rules

---

## Alternatives Considered

### Option A: Standalone Web App
**Pros**: Full control, better for non-devs  
**Cons**: Separate from component development, harder to maintain

### Option B: Figma Plugin
**Pros**: Designers can translate in Figma  
**Cons**: Disconnected from actual code, sync issues

### Option C: i18n Management Platform (Crowdin, Lokalise)
**Pros**: Professional tools, mature features  
**Cons**: Expensive, still lacks true UI context

### Option D: Storybook Addon (Chosen)
**Pros**: ✅ Integrated with dev workflow, ✅ Visual context, ✅ Free  
**Cons**: Requires Storybook knowledge, limited to components with stories

---

## Getting Started (When Ready)

```bash
# 1. Create addon structure
mkdir -p .storybook/addons/translation-mode/{components,decorators,hooks,utils}

# 2. Install dependencies
npm install --save-dev levenshtein-edit-distance

# 3. Implement core components (start with TranslationOverlay)

# 4. Add decorator to .storybook/preview.tsx

# 5. Test with one story
```

---

## References

- [Storybook Addon API](https://storybook.js.org/docs/react/addons/addon-api)
- [next-i18next Documentation](https://react.i18next.com/)
- [i18next Translation Functions](https://www.i18next.com/translation-function/essentials)
- [Material-UI Localization](https://mui.com/material-ui/guides/localization/)

---

**Status**: 📋 Planning Phase  
**Last Updated**: January 13, 2026  
**Owner**: TBD
