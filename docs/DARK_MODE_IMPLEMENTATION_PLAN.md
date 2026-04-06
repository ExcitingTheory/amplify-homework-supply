# Dark Mode Implementation Plan

## Current State

| Area                        | Status                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| MUI version                 | `@mui/material@^7.3.6` with Emotion                                                                                                         |
| Theme file                  | [`src/theme.js`](../src/theme.js) — single light palette (`primary: #556cd6`, `secondary: #19857b`)                                         |
| ThemeProvider               | [`pages/_app.jsx`](../pages/_app.jsx) — `ThemeProvider` + `CssBaseline` + `CacheProvider`                                                   |
| Dark mode toggle            | [`MainToolbar.jsx`](../src/components/MainToolbar.jsx#L132) — exists in UI but **disconnected** (local `useState` only)                     |
| Settings model              | [`amplify/data/resource.ts`](../amplify/data/resource.ts#L807) — has `editorTheme: a.string()` field, defaulting to `'auto'`                |
| SettingsContext             | [`src/context/settingsContext.jsx`](../src/context/settingsContext.jsx) — reads/writes `editorTheme` but nothing consumes it for color mode |
| Existing TODOs              | 3 inline `TODO` comments requesting dark mode awareness (RecordingStudio2, CustomAnswerEditor, FileManager2)                                |
| Files with hardcoded colors | **~80+** across components, pages, CSS files, and styled-jsx blocks                                                                         |

---

## Phase 1 — Theme Infrastructure

### 1a. Upgrade `src/theme.js` to CSS Variables Theme

MUI v7 supports `cssVariables: true` on `createTheme`, which generates CSS custom properties and enables `colorSchemes`.

**File:** `src/theme.js`

```typescript
import { createTheme, alpha } from "@mui/material/styles";
import { red } from "@mui/material/colors";

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data-mui-color-scheme" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#556cd6" },
        secondary: { main: "#19857b" },
        error: { main: red.A400 },
        background: {
          default: "#fafafa",
          paper: "#ffffff",
        },
      },
    },
    dark: {
      palette: {
        primary: { main: "#7986cb" }, // lightened for dark bg contrast
        secondary: { main: "#4db6ac" }, // lightened for dark bg contrast
        error: { main: red.A200 },
        background: {
          default: "#121212",
          paper: "#1e1e1e",
        },
        text: {
          primary: "#e0e0e0",
          secondary: "#a0a0a0",
        },
      },
    },
  },
});

export default theme;
```

### 1b. Update `pages/_app.jsx`

Replace `ThemeProvider` with MUI v7's CSS variables-aware provider. Add `getInitColorSchemeScript()` import.

**Changes:**

- Import `ThemeProvider` from `@mui/material/styles` (same, but now the theme has `cssVariables: true`)
- `CssBaseline` stays — it automatically adapts to dark mode when using `colorSchemes`

### 1c. Update `pages/_document.jsx`

Add `getInitColorSchemeScript()` before `<Main />` to prevent flash-of-wrong-theme (FOWT) on SSR page load.

**Changes:**

```jsx
import { getInitColorSchemeScript } from "@mui/material/styles";

// In render():
<body>
  {getInitColorSchemeScript({ defaultMode: "system" })}
  <Main />
  <NextScript />
</body>;
```

Update the `theme-color` meta tag from `theme.palette.primary.main` to a dynamic CSS variable reference or remove the hardcoded value.

**Files changed:** 3 (`src/theme.js`, `pages/_app.jsx`, `pages/_document.jsx`)

---

## Phase 2 — Settings & Toggle Wiring

### 2a. Repurpose `editorTheme` Field

The `Settings` model already has `editorTheme: a.string()`. Use it to store `'light' | 'dark' | 'auto'`.

**No schema change needed.** The default `'auto'` value already works.

### 2b. Create `useColorMode` Hook

**New file:** `src/hooks/useColorMode.js`

```javascript
import { useColorScheme } from "@mui/material/styles";
import React from "react";
import SettingsContext from "../context/settingsContext";

export function useColorMode() {
  const { settings, updateSettings } = React.useContext(SettingsContext);
  const { mode, setMode } = useColorScheme();

  // Sync MUI mode with settings
  React.useEffect(() => {
    const target = settings?.editorTheme || "auto";
    const muiMode = target === "auto" ? "system" : target;
    if (mode !== muiMode) {
      setMode(muiMode);
    }
  }, [settings?.editorTheme]);

  const setColorMode = React.useCallback(
    (value) => {
      const muiMode = value === "auto" ? "system" : value;
      setMode(muiMode);
      updateSettings({ editorTheme: value });
    },
    [setMode, updateSettings],
  );

  return { mode: settings?.editorTheme || "auto", setColorMode };
}
```

### 2c. Wire `MainToolbar` Toggle

Replace the disconnected `ToggleMenuItem` at line 132 with a proper 3-way control:

```jsx
<MenuItem>
  <ListItemText primary={t("mainToolbar.settings.colorMode", "Color mode")} />
  <ToggleButtonGroup
    value={colorMode}
    exclusive
    onChange={(e, val) => val && setColorMode(val)}
    size="small"
  >
    <ToggleButton value="light">
      <LightMode fontSize="small" />
    </ToggleButton>
    <ToggleButton value="auto">
      <SettingsBrightness fontSize="small" />
    </ToggleButton>
    <ToggleButton value="dark">
      <DarkMode fontSize="small" />
    </ToggleButton>
  </ToggleButtonGroup>
</MenuItem>
```

**Files changed:** 3 (`src/hooks/useColorMode.js` new, `src/components/MainToolbar.jsx`, `src/context/settingsContext.jsx` if API needs adjustment)

---

## Phase 3 — Semantic Custom Tokens

Define app-specific design tokens in the theme for recurring color patterns. These are referenced by components instead of hardcoded values.

**File:** `src/theme.js` — add to both `light` and `dark` palettes:

| Token                        | Light                    | Dark                  | Used By                                                                                          |
| ---------------------------- | ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------ |
| `custom.chatBubbleUser`      | `#e3f2fd`                | `#1a2634`             | ChatSidebar                                                                                      |
| `custom.chatBubbleAssistant` | `#f3f4f6`                | `#2d2d2d`             | ChatSidebar                                                                                      |
| `custom.glassNavbar`         | `rgba(255,255,255,0.72)` | `rgba(30,30,30,0.85)` | pages/index, pages/units, pages/profile, pages/sections, pages/section/[id], pages/workbook/[id] |
| `custom.editorBackground`    | `#ffffff`                | `#1e1e1e`             | Editor3                                                                                          |
| `custom.codeBlock`           | `#f6f8fa`                | `#161b22`             | LexicalMessageRenderer, LanguageEditorTheme                                                      |
| `custom.searchHighlight`     | `#ffeb3b`                | `#b8860b`             | SearchResults, FileManager2, FileMetadataNode                                                    |
| `custom.subtleBorder`        | `#e0e0e0`                | `#333333`             | Tables, quotes, code blocks                                                                      |

**Files changed:** 1 (`src/theme.js`)

---

## Phase 4 — Hardcoded Color Remediation

### Tier 1 — Global CSS Files (highest impact)

These files affect the entire editor and chat rendering. Convert hardcoded colors to CSS custom properties with light/dark values.

| File                                                                                                                        | Hardcoded Values                                                                                                                                                                  | Strategy                                                                   |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`src/components/Editor3/theme.css`](../src/components/Editor3/theme.css)                                                   | `#757575`, `#efefef`, `#0099ff`                                                                                                                                                   | Define CSS vars at `:root` with `[data-mui-color-scheme="dark"]` overrides |
| [`src/components/Editor3/components/LanguageEditorTheme.css`](../src/components/Editor3/components/LanguageEditorTheme.css) | ~40 values: `rgb(5,5,5)`, `rgb(101,103,107)`, `#eee`, `#ccc`, `#777`, `#bbb`, `#f2f3f5`, `#c9dbf0`, `#999`, `#ffbbbb`, `#a6cdfe`, `#3d87f5`, syntax tokens (`#905`, `#690`, etc.) | Same — CSS vars with dark overrides                                        |

**Approach for CSS files:**

```css
:root {
  --editor-placeholder: #757575;
  --editor-drag-hover: #efefef;
  --editor-code-bg: rgb(240, 242, 245);
  --editor-table-header: #f2f3f5;
  --editor-table-border: #bbb;
  /* ... */
}

[data-mui-color-scheme="dark"] {
  --editor-placeholder: #666666;
  --editor-drag-hover: #333333;
  --editor-code-bg: #1a1a2e;
  --editor-table-header: #2a2a2a;
  --editor-table-border: #555;
  /* ... */
}
```

### Tier 2 — CSS Modules (partially dark-mode ready)

| File                                                                                                   | Status                                                          | Action                                                  |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------- |
| [`VirtualizedMessageList.module.css`](../src/components/ChatSidebar/VirtualizedMessageList.module.css) | Already uses CSS variables                                      | Add `[data-mui-color-scheme="dark"]` variable overrides |
| [`LexicalMessageRenderer.module.css`](../src/components/ChatSidebar/LexicalMessageRenderer.module.css) | CSS vars with light fallbacks (`#1a1a1a`, `#f6f8fa`, `#0969da`) | Add dark-mode variable overrides                        |

### Tier 3 — Component `sx` Props (~28 files)

Replace hardcoded hex values with theme tokens. These are mechanical changes.

**Replacement mapping:**

Using standard MUI palette tokens eliminates the need for custom dark overrides — these auto-adapt in dark mode with `colorSchemes`.

| Hardcoded Value                            | Replace With                       | ~Instances |
| ------------------------------------------ | ---------------------------------- | ---------- |
| `'#fff'`, `'white'`, `'#ffffff'`           | `'background.paper'`               | ~12        |
| `'#f5f5f5'`, `'#fafafa'`, `'#f8f9fa'`      | `'grey.100'`                       | ~10        |
| `'#e0e0e0'`, `'#E8E8E8'`, `'#ccc'`         | `'divider'`                        | ~17        |
| `'#e5e7eb'`                                | `'divider'`                        | 1          |
| `'#000'`, `'black'`, `'#1a1a1a'`, `'#333'` | `'text.primary'`                   | ~14        |
| `'#666'`, `'#505050'`                      | `'text.secondary'`                 | ~6         |
| `'#888'`, `'#999'`, `'gray'`               | `'text.disabled'`                  | ~10        |
| `'#9ca3af'`                                | `'text.disabled'`                  | 3          |
| `'#f3f4f6'` (chat bubbles)                 | `'custom.chatBubbleAssistant'`     | 2          |
| `'#1f2937'` (chat text)                    | `'text.primary'`                   | 1          |
| `rgba(255,255,255,0.72)`                   | `'custom.glassNavbar'`             | 6          |
| `'#ffeb3b'` (search highlight)             | `'custom.searchHighlight'`         | 3          |
| `'#4caf50'`, `'#2e7d32'`                   | `'success.main'`, `'success.dark'` | ~6         |
| `'#1976d2'`                                | `'primary.main'`                   | 2          |
| `'#90caf9'`                                | `'primary.light'`                  | 1          |
| `'red'` (required asterisk)                | `'error.main'`                     | 1          |
| `rgba(0,0,0,0.23)` (input borders)         | `'divider'` or `'action.disabled'` | 2          |
| `rgba(0,0,0,0.38)` (placeholders)          | `'text.disabled'`                  | 2          |

**Files by priority:**

| #   | File                                                                                                                                  | Hardcoded Values                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | [`src/components/ChatSidebar.jsx`](../src/components/ChatSidebar.jsx)                                                                 | `#f3f4f6`, `#1f2937`, `#9ca3af`, `white`                        |
| 2   | [`pages/section/[id].jsx`](../pages/section/%5Bid%5D.jsx)                                                                             | `#000`, `#333`, `#fafafa`, `#f5f5f5`, `#fff` (7 instances)      |
| 3   | [`pages/index.jsx`](../pages/index.jsx)                                                                                               | `rgba(255,255,255,0.72)`, `grey.50` (×4)                        |
| 4   | [`pages/units.jsx`](../pages/units.jsx)                                                                                               | `rgba(255,255,255,0.72)`, `grey.50` (×6)                        |
| 5   | [`pages/profile.jsx`](../pages/profile.jsx)                                                                                           | `rgba(255,255,255,0.72)`                                        |
| 6   | [`src/components/DictionaryEditor2.jsx`](../src/components/DictionaryEditor2.jsx)                                                     | `#fafafa`, `#999`                                               |
| 7   | [`src/components/InstructorDashboard.jsx`](../src/components/InstructorDashboard.jsx)                                                 | `#f5f5f5`, `#cd7f32`                                            |
| 8   | [`src/components/RecordingStudio3/ScreenplayEditor.jsx`](../src/components/RecordingStudio3/ScreenplayEditor.jsx)                     | `#fff`, `#000`, `#f5f5f5`, `rgba(255,255,255,0.95)`             |
| 9   | [`src/components/MeaningAssociationExercise/CompletionScreen.jsx`](../src/components/MeaningAssociationExercise/CompletionScreen.jsx) | `#fff`, `#f8f9fa`, `#4caf50`, `#2e7d32`, `#1976d2`              |
| 10  | [`src/components/MeaningAssociationExercise/DragBox.jsx`](../src/components/MeaningAssociationExercise/DragBox.jsx)                   | `#fff`, `#1976d2`                                               |
| 11  | [`src/components/VocabularyReview2.tsx`](../src/components/VocabularyReview2.tsx)                                                     | `#fff`, `grey.50`                                               |
| 12  | [`src/components/QuestionsReview2.tsx`](../src/components/QuestionsReview2.tsx)                                                       | `#fff`, `grey.50`                                               |
| 13  | [`src/components/ChatSidebar/ContentPreview.tsx`](../src/components/ChatSidebar/ContentPreview.tsx)                                   | `grey.50`, `grey.100`, `grey.900`                               |
| 14  | [`src/components/SavedPdfThumbnail.tsx`](../src/components/SavedPdfThumbnail.tsx)                                                     | `grey.50`, `grey.400`, `rgba(0,0,0,0.7)`                        |
| 15  | [`src/components/PdfThumbnail.tsx`](../src/components/PdfThumbnail.tsx)                                                               | `grey.50`, `grey.400`, `rgba(0,0,0,0.7)`                        |
| 16  | [`src/components/RecordingStudio3.jsx`](../src/components/RecordingStudio3.jsx)                                                       | `grey.50`                                                       |
| 17  | [`src/components/ModerationPanel.jsx`](../src/components/ModerationPanel.jsx)                                                         | `grey.50`                                                       |
| 18  | [`src/components/SvgPreview.jsx`](../src/components/SvgPreview.jsx)                                                                   | `grey.100`                                                      |
| 19  | [`src/components/Editor3/components/FileManager2.jsx`](../src/components/Editor3/components/FileManager2.jsx)                         | `#ffeb3b`, `#999`, `grey.50`, `grey.100`, `grey.200`            |
| 20  | [`src/components/Editor3/components/PdfViewerComponent.jsx`](../src/components/Editor3/components/PdfViewerComponent.jsx)             | `grey.50`, `grey.100`                                           |
| 21  | [`src/components/Editor3/components/AnswerComponent.jsx`](../src/components/Editor3/components/AnswerComponent.jsx)                   | `'gray'` (×6 — italic placeholder text)                         |
| 22  | [`src/components/Editor3/plugins/WordBlockPlugin.jsx`](../src/components/Editor3/plugins/WordBlockPlugin.jsx)                         | `#f5f5f5`, `#666` (×3)                                          |
| 23  | [`src/components/Editor3/plugins/UnitCompletedPlugin.jsx`](../src/components/Editor3/plugins/UnitCompletedPlugin.jsx)                 | `rgba(0,0,0,.3)` boxShadow                                      |
| 24  | [`src/components/PermissionErrorOverlay.jsx`](../src/components/PermissionErrorOverlay.jsx)                                           | `rgba(0,0,0,0.12)` boxShadow                                    |
| 25  | [`src/components/QuestionBlock.jsx`](../src/components/QuestionBlock.jsx)                                                             | `#E8E8E8` border (×2)                                           |
| 26  | [`src/components/SortableAnswers.jsx`](../src/components/SortableAnswers.jsx)                                                         | `#E8E8E8` border                                                |
| 27  | [`pages/sections.jsx`](../pages/sections.jsx)                                                                                         | `rgba(255,255,255,0.72)` glass navbar, boxShadow                |
| 28  | [`pages/workbook/[id].jsx`](../pages/workbook/%5Bid%5D.jsx)                                                                           | `rgba(255,255,255,0.72)` glass navbar, `#000` border, boxShadow |

> **Note:** MUI `grey.50`, `grey.100` etc. in `sx` props auto-adapt when using `colorSchemes` — these are lower priority. Focus first on raw hex values.
>
> **Simplification:** ~60% of hardcoded colors map to just 4 standard MUI tokens: `'background.paper'`, `'grey.100'`, `'divider'`, and `'text.primary'`/`'text.secondary'`/`'text.disabled'`. Using these eliminates the need for custom dark-mode overrides for those values.

### Tier 4 — Inline `style={{}}` (~23 files)

These require converting to `sx` props or using `useTheme()`:

| File                                                                                                                                                    | Values                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`src/components/SortableAnswers.jsx`](../src/components/SortableAnswers.jsx)                                                                           | `'white'`, `'lightblue'`                                                                         |
| [`src/components/RecordingStudio2.jsx`](../src/components/RecordingStudio2.jsx)                                                                         | `'white'`                                                                                        |
| [`src/components/ChatSidebar/SearchResults.jsx`](../src/components/ChatSidebar/SearchResults.jsx)                                                       | `#ffeb3b`                                                                                        |
| [`src/components/MeaningAssociationExercise/index.jsx`](../src/components/MeaningAssociationExercise/index.jsx)                                         | `#888`, `#4caf50`                                                                                |
| [`src/components/Editor3/components/AutocompleteNode.jsx`](../src/components/Editor3/components/AutocompleteNode.jsx)                                   | `#ccc`                                                                                           |
| [`src/components/Editor3/components/AIContentSuggestionNode.jsx`](../src/components/Editor3/components/AIContentSuggestionNode.jsx)                     | `#666`, `#444`                                                                                   |
| [`src/components/Editor3/components/ConfigurationManager.jsx`](../src/components/Editor3/components/ConfigurationManager.jsx)                           | `#000`, `#ddd`, `#333`                                                                           |
| [`src/components/Editor3/components/SketchPad.jsx`](../src/components/Editor3/components/SketchPad.jsx)                                                 | `#000000`, `#f9f9f9`                                                                             |
| [`src/components/Editor3/components/TabsVerticalRight.jsx`](../src/components/Editor3/components/TabsVerticalRight.jsx)                                 | `#1a1a1a`, `#2196f3`                                                                             |
| [`src/components/Editor3/components/MetadataField.jsx`](../src/components/Editor3/components/MetadataField.jsx)                                         | `red` (required asterisk)                                                                        |
| [`src/components/Editor3/nodes/FileMetadataNode/FileMetadataComponent.jsx`](../src/components/Editor3/nodes/FileMetadataNode/FileMetadataComponent.jsx) | `#ffeb3b`, `#f5f5f5`                                                                             |
| [`src/components/MainToolbar.jsx`](../src/components/MainToolbar.jsx)                                                                                   | `rgba(0,0,0,0.25)`, `rgba(255,255,255,0.85)`                                                     |
| [`src/components/Editor3/components/AudioWaveformPlayer.jsx`](../src/components/Editor3/components/AudioWaveformPlayer.jsx)                             | `#e0e0e0` border, `'white'` bg, canvas `rgb(255,255,255)` fills                                  |
| [`src/components/Editor3/components/MetadataEditor.tsx`](../src/components/Editor3/components/MetadataEditor.tsx)                                       | `rgba(0,0,0,0.23)` border, `rgba(0,0,0,0.38)` placeholder                                        |
| [`src/components/Editor3/components/StaticWaveform.jsx`](../src/components/Editor3/components/StaticWaveform.jsx)                                       | `rgba(255,255,255,0.8)` loading overlay                                                          |
| [`src/components/Editor3/plugins/FloatingLinkEditorPlugin.jsx`](../src/components/Editor3/plugins/FloatingLinkEditorPlugin.jsx)                         | `rgba(0,0,0,0.3)` shadow (JS `element.style`)                                                    |
| [`src/components/Editor3/plugins/AutoEmbedPlugin.jsx`](../src/components/Editor3/plugins/AutoEmbedPlugin.jsx)                                           | `rgba(0,0,0,0.75)` shadow                                                                        |
| [`src/components/SectionAssigner.jsx`](../src/components/SectionAssigner.jsx)                                                                           | `#ccc` border                                                                                    |
| [`src/components/ChatSidebar/VirtualizedMessageList.jsx`](../src/components/ChatSidebar/VirtualizedMessageList.jsx)                                     | CSS var fallbacks: `#666`, `#f6f8fa`, `#e1e4e8`                                                  |
| [`src/components/DebugPanel/LogViewer.tsx`](../src/components/DebugPanel/LogViewer.tsx)                                                                 | `rgba(211,47,47,0.1)`, `rgba(237,108,2,0.1)`, `rgba(2,136,209,0.1)` (dev tool — lowest priority) |

### Tier 5 — styled-jsx Blocks (5 files with colors)

| File                                                                                                          | Values                                                                                  |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`src/components/Editor3/plugins/ToolBarPlugin.jsx`](../src/components/Editor3/plugins/ToolBarPlugin.jsx)     | `#505050` (2 `<style jsx global>` blocks)                                               |
| [`src/components/Editor3/components/GradeHistory.jsx`](../src/components/Editor3/components/GradeHistory.jsx) | `#666`                                                                                  |
| [`src/components/Editor3/components/Placeholder.jsx`](../src/components/Editor3/components/Placeholder.jsx)   | `#999` → `text.disabled`                                                                |
| [`src/components/Editor3/components/ImageNode.jsx`](../src/components/Editor3/components/ImageNode.jsx)       | `#888`, `rgb(5,5,5)` caret color                                                        |
| [`src/components/Editor3/index.tsx`](../src/components/Editor3/index.tsx)                                     | `#ccc` dashed border (collab colors are functional — skip)                              |
| [`src/components/Editor3/plugins/ColorPicker.jsx`](../src/components/Editor3/plugins/ColorPicker.jsx)         | `#ccc` border, `rgba(0,0,0,0.3)` shadow (UI chrome only — swatch colors are functional) |

Convert to CSS custom properties or replace styled-jsx with `sx` props.

### Intentionally Skipped Files (functional/non-theme colors)

These files contain hardcoded colors that are **functional** (not decorative) and should not change between light/dark mode:

| File                                                                                                                | Reason                                                                                           |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`src/context/unitContext.jsx`](../src/context/unitContext.jsx)                                                     | Yjs collaboration user colors (`#f59e0b`, `#3b82f6`) — distinguish instructor vs student cursors |
| [`src/components/Editor3/index.tsx`](../src/components/Editor3/index.tsx) lines 165-176                             | Collaboration user color palette (10 distinct colors) — functional differentiation               |
| [`src/components/Workbook/TutorPresenceBanner.tsx`](../src/components/Workbook/TutorPresenceBanner.tsx)             | Collaboration avatar fallback color (`#f59e0b`)                                                  |
| [`src/components/Examples/CollaborativeWorkbook.tsx`](../src/components/Examples/CollaborativeWorkbook.tsx)         | Example/demo component + collaboration colors                                                    |
| [`src/components/Editor3/components/ImageMaskEditor.jsx`](../src/components/Editor3/components/ImageMaskEditor.jsx) | Canvas mask overlay (`rgba(255,0,0,0.5)`) — drawing tool, not UI chrome                          |
| [`src/components/Editor3/plugins/ColorPicker.jsx`](../src/components/Editor3/plugins/ColorPicker.jsx) swatch values | User-selectable text formatting colors — intentional fixed palette                               |
| [`src/components/ChatSidebar/BlockInsertPreview.jsx`](../src/components/ChatSidebar/BlockInsertPreview.jsx)         | Already uses MUI token `grey.50` — no fix needed                                                 |
| [`src/components/VideoPlayer.js`](../src/components/VideoPlayer.js)                                                 | Minified vendor CSS (video.js) — use theme class swap in Tier 6 instead                          |
| Canvas `fillStyle` calls (AudioWaveformPlayer, RecordingStudio2, CustomAnswerEditor, FileManager2)                  | Canvas rendering operations — read palette at draw time via `useTheme()` if needed               |

### Tier 6 — Third-Party Components

| Component                                                                                                | Action                                                                                            |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Excalidraw** ([`SketchPad.jsx`](../src/components/Editor3/components/SketchPad.jsx))                   | Pass `theme: mode === 'dark' ? 'dark' : 'light'` prop — Excalidraw has built-in dark mode support |
| **video.js** ([`VideoPlayer.js`](../src/components/VideoPlayer.js))                                      | Swap to `vjs-theme-dark` class when in dark mode                                                  |
| **PDF viewer** ([`PdfViewerComponent.jsx`](../src/components/Editor3/components/PdfViewerComponent.jsx)) | Container background only — PDF content stays unchanged                                           |

---

## Phase 5 — Storybook & Testing

### 5a. Storybook Dark Mode Decorator

**File:** `.storybook/preview.jsx`

Add a toolbar item that toggles `data-mui-color-scheme` attribute and wraps stories in `CssVarsProvider` with mode control. This enables visual review of every component in both modes.

### 5b. Chromatic Visual Regression

Configure Chromatic to capture each story in both light and dark mode for snapshot comparison. Add a `darkMode` global parameter.

### 5c. Cypress E2E Dark Mode Tests

- Emulate `prefers-color-scheme: dark` via `cy.wrap(window).invoke('matchMedia', ...)` or Cypress browser launch args
- Verify toggle persists across page navigation
- Verify no flash-of-white-theme on page load (check `getInitColorSchemeScript` works)

---

## Execution Order

```
Phase 1 (Infrastructure)     ← Foundation — everything depends on this
  └─ Phase 2 (Settings)      ← User control
      └─ Phase 3 (Tokens)    ← Semantic palette
          └─ Phase 4          ← File-by-file remediation
              ├─ Tier 1 (CSS files)
              ├─ Tier 2 (CSS modules)
              ├─ Tier 3 (sx props)
              ├─ Tier 4 (inline styles)
              ├─ Tier 5 (styled-jsx)
              └─ Tier 6 (third-party)
                  └─ Phase 5 (Testing)
```

### Scope Summary

| Phase                          | Files Changed | New Files | Complexity          |
| ------------------------------ | ------------- | --------- | ------------------- |
| Phase 1 — Infrastructure       | 3             | 0         | Low                 |
| Phase 2 — Settings & Toggle    | 2             | 1         | Low                 |
| Phase 3 — Custom Tokens        | 1             | 0         | Low                 |
| Phase 4 Tier 1-2 — CSS         | 4             | 0         | Medium              |
| Phase 4 Tier 3 — sx props      | ~28           | 0         | Medium (mechanical) |
| Phase 4 Tier 4 — inline styles | ~23           | 0         | Medium (mechanical) |
| Phase 4 Tier 5 — styled-jsx    | 5             | 0         | Low                 |
| Phase 4 Tier 6 — third-party   | 3             | 0         | Low                 |
| Phase 5 — Testing              | 3             | 1-2       | Medium              |
| **Total**                      | **~70**       | **~3**    |                     |

### Quick Wins After Phase 1

Once the `colorSchemes` theme is in place, these MUI features auto-adapt **without any component changes**:

- `CssBaseline` (body background, text color)
- All MUI components using default palette (`Button`, `AppBar`, `Paper`, `Card`, `Chip`, `Divider`, etc.)
- `sx` props using palette keys like `'background.paper'`, `'text.primary'`, `'primary.main'`
- `grey.*` scale references (`grey.50`, `grey.100`) — MUI inverts these automatically in dark mode

This means **many components will already look reasonable in dark mode** after just Phase 1, with Phase 4 cleaning up the remaining hardcoded values.
