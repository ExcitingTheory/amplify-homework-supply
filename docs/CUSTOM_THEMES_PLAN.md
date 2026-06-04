# Custom Themes Plan

_Created: June 2026_

Implement the custom editor themes shown in `CosmeticSelector` (Midnight, Forest, Sunset, Aurora) so that selecting one actually applies a distinct MUI palette. Currently the picker UI exists but selections do nothing — no persistence, no palette swap, no runtime application.

---

## Current State

| Layer | Status |
|-------|--------|
| **UI picker** (`CosmeticSelector.tsx`) | ✅ Exists — 5 themes with preview colors, level-gated |
| **Settings page wiring** | ❌ `CosmeticSelector` rendered with only `level` prop — no `selectedThemeId` or `onThemeSelect` |
| **Schema persistence** | ❌ No `cosmeticThemeId` field on Settings model (only `editorTheme` for light/dark/auto) |
| **MUI palette definitions** | ❌ Only static light/dark in `src/theme.js` — no Midnight/Forest/Sunset/Aurora palettes |
| **Runtime application** | ❌ `ThemeRegistry.tsx` always provides the one static theme |

---

## Solution Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Settings Page                                              │
│  CosmeticSelector → onThemeSelect(id) → updateSettings()   │
│                                                             │
│  Persisted: Settings.cosmeticThemeId = 'midnight'           │
└─────────────────────────────────────────────────────────────┘
            ↓ (SettingsContext provides cosmeticThemeId)
┌─────────────────────────────────────────────────────────────┐
│  ThemeRegistry                                              │
│  Reads cosmeticThemeId → picks palette from THEME_PALETTES │
│  → creates MUI theme with selected palette → ThemeProvider  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Schema & Persistence

### 1.1 Add `cosmeticThemeId` to Settings Model

**File**: `amplify/data/resource.ts`

```typescript
// In Settings model, add:
cosmeticThemeId: a.string(), // 'default' | 'midnight' | 'forest' | 'sunset' | 'aurora'
```

### 1.2 Default in SettingsContext

**File**: `src/context/settingsContext.jsx`

When creating new Settings records, default `cosmeticThemeId` to `'default'`. Expose it via context value.

---

## Phase 2: Palette Definitions

### 2.1 Theme Palette Map

**File**: `src/themes/editorThemes.ts` (new)

Define full MUI palette overrides for each cosmetic theme. Each theme provides both light and dark variants (the cosmetic theme adjusts accent colors and custom tokens, while respecting the user's light/dark mode preference).

```typescript
export interface ThemePalette {
  light: {
    primary: { main: string }
    secondary: { main: string }
    background: { default: string; paper: string }
    custom: {
      chatBubbleUser: string
      chatBubbleAssistant: string
      glassNavbar: string
      editorBackground: string
      codeBlock: string
      searchHighlight: string
      subtleBorder: string
    }
  }
  dark: {
    primary: { main: string }
    secondary: { main: string }
    background: { default: string; paper: string }
    text: { primary: string; secondary: string }
    custom: {
      chatBubbleUser: string
      chatBubbleAssistant: string
      glassNavbar: string
      editorBackground: string
      codeBlock: string
      searchHighlight: string
      subtleBorder: string
    }
  }
}

export const THEME_PALETTES: Record<string, ThemePalette> = {
  default: { /* current values from src/theme.js */ },
  midnight: {
    light: {
      primary: { main: '#00bcd4' },
      secondary: { main: '#26c6da' },
      background: { default: '#f0f4f8', paper: '#ffffff' },
      custom: {
        chatBubbleUser: '#e0f7fa',
        chatBubbleAssistant: '#e8eaf6',
        glassNavbar: 'rgba(240,244,248,0.85)',
        editorBackground: '#ffffff',
        codeBlock: '#eceff1',
        searchHighlight: '#80deea',
        subtleBorder: '#b0bec5',
      },
    },
    dark: {
      primary: { main: '#00bcd4' },
      secondary: { main: '#26c6da' },
      background: { default: '#1a1a2e', paper: '#16213e' },
      text: { primary: '#e0e0e0', secondary: '#90a4ae' },
      custom: {
        chatBubbleUser: '#1a2634',
        chatBubbleAssistant: '#1a1a2e',
        glassNavbar: 'rgba(26,26,46,0.85)',
        editorBackground: '#16213e',
        codeBlock: '#0f3460',
        searchHighlight: '#006064',
        subtleBorder: '#2a3a5e',
      },
    },
  },
  forest: {
    light: {
      primary: { main: '#66bb6a' },
      secondary: { main: '#81c784' },
      background: { default: '#f1f8e9', paper: '#ffffff' },
      custom: {
        chatBubbleUser: '#e8f5e9',
        chatBubbleAssistant: '#f1f8e9',
        glassNavbar: 'rgba(241,248,233,0.85)',
        editorBackground: '#ffffff',
        codeBlock: '#e8f5e9',
        searchHighlight: '#aed581',
        subtleBorder: '#c8e6c9',
      },
    },
    dark: {
      primary: { main: '#66bb6a' },
      secondary: { main: '#81c784' },
      background: { default: '#1b2d1b', paper: '#2e3d2e' },
      text: { primary: '#c8e6c9', secondary: '#81c784' },
      custom: {
        chatBubbleUser: '#1b3d1b',
        chatBubbleAssistant: '#2e3d2e',
        glassNavbar: 'rgba(27,45,27,0.85)',
        editorBackground: '#2e3d2e',
        codeBlock: '#1b3d1b',
        searchHighlight: '#33691e',
        subtleBorder: '#4a6a4a',
      },
    },
  },
  sunset: {
    light: {
      primary: { main: '#ff7043' },
      secondary: { main: '#ffab91' },
      background: { default: '#fff3e0', paper: '#ffffff' },
      custom: {
        chatBubbleUser: '#fbe9e7',
        chatBubbleAssistant: '#fff3e0',
        glassNavbar: 'rgba(255,243,224,0.85)',
        editorBackground: '#ffffff',
        codeBlock: '#fbe9e7',
        searchHighlight: '#ffcc80',
        subtleBorder: '#ffccbc',
      },
    },
    dark: {
      primary: { main: '#ff7043' },
      secondary: { main: '#ffab91' },
      background: { default: '#2d1b1b', paper: '#3e2723' },
      text: { primary: '#ffccbc', secondary: '#ffab91' },
      custom: {
        chatBubbleUser: '#3e2723',
        chatBubbleAssistant: '#2d1b1b',
        glassNavbar: 'rgba(45,27,27,0.85)',
        editorBackground: '#3e2723',
        codeBlock: '#4e342e',
        searchHighlight: '#bf360c',
        subtleBorder: '#5d4037',
      },
    },
  },
  aurora: {
    light: {
      primary: { main: '#ab47bc' },
      secondary: { main: '#ce93d8' },
      background: { default: '#f3e5f5', paper: '#ffffff' },
      custom: {
        chatBubbleUser: '#f3e5f5',
        chatBubbleAssistant: '#ede7f6',
        glassNavbar: 'rgba(243,229,245,0.85)',
        editorBackground: '#ffffff',
        codeBlock: '#ede7f6',
        searchHighlight: '#e1bee7',
        subtleBorder: '#ce93d8',
      },
    },
    dark: {
      primary: { main: '#ab47bc' },
      secondary: { main: '#ce93d8' },
      background: { default: '#0d1b2a', paper: '#1b2838' },
      text: { primary: '#e0f7fa', secondary: '#b39ddb' },
      custom: {
        chatBubbleUser: '#1b2838',
        chatBubbleAssistant: '#0d1b2a',
        glassNavbar: 'rgba(13,27,42,0.85)',
        editorBackground: '#1b2838',
        codeBlock: '#1a237e',
        searchHighlight: '#4a148c',
        subtleBorder: '#311b92',
      },
    },
  },
}
```

---

## Phase 3: ThemeRegistry Integration

### 3.1 Dynamic Theme Creation

**File**: `app/ThemeRegistry.tsx`

Read `cosmeticThemeId` from SettingsContext (or a cookie for SSR). Use it to select the palette from `THEME_PALETTES` and pass to `createTheme()`.

```typescript
import { THEME_PALETTES } from '../src/themes/editorThemes'

function buildTheme(cosmeticThemeId: string) {
  const palette = THEME_PALETTES[cosmeticThemeId] ?? THEME_PALETTES.default
  return createTheme({
    cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' },
    colorSchemes: {
      light: { palette: palette.light },
      dark: { palette: palette.dark },
    },
  })
}
```

### 3.2 SSR Considerations

Store `cosmeticThemeId` in a cookie (alongside the existing `color-mode` cookie) so that the server can render with the correct palette on first load, avoiding a flash of wrong colors.

---

## Phase 4: Settings Page Wiring

### 4.1 Connect CosmeticSelector to SettingsContext

**File**: `app/[locale]/settings/page.jsx`

```jsx
const { settings, updateSettings } = useContext(SettingsContext)

<CosmeticSelector
  level={level?.level || 1}
  selectedThemeId={settings?.cosmeticThemeId || 'default'}
  onThemeSelect={(themeId) => updateSettings({ cosmeticThemeId: themeId })}
/>
```

### 4.2 Level-Gating Enforcement

CosmeticSelector already gates by `minLevel` in the UI. The backend should also validate on save that the user's XP level permits the selected theme (prevent spoofing). This can be a simple check in `updateSettings` or a custom resolver.

---

## Phase 5: Editor-Specific Theming (Optional Enhancement)

The current scope applies themes globally (entire app palette changes). A future enhancement could apply themes **only to the editor area** using a nested `ThemeProvider`:

```jsx
<ThemeProvider theme={globalTheme}>
  <AppShell>
    <ThemeProvider theme={editorSpecificTheme}>
      <Editor3 />
    </ThemeProvider>
  </AppShell>
</ThemeProvider>
```

This allows users to have a bold editor theme without affecting navigation/settings UI. Defer unless user feedback requests it.

---

## Files Affected

| File | Change |
|------|--------|
| `amplify/data/resource.ts` | Add `cosmeticThemeId` to Settings model |
| `src/themes/editorThemes.ts` | New — palette definitions for all 5 themes |
| `src/context/settingsContext.jsx` | Expose `cosmeticThemeId`, default on create |
| `app/ThemeRegistry.tsx` | Dynamic theme from `cosmeticThemeId` |
| `app/[locale]/settings/page.jsx` | Wire `selectedThemeId` and `onThemeSelect` to CosmeticSelector |
| `src/theme.js` | Refactor: extract palette values into `editorThemes.ts`, keep as thin wrapper |

---

## Rollout Order

1. **Schema change** — add `cosmeticThemeId` to Settings, deploy sandbox
2. **Palette definitions** — create `src/themes/editorThemes.ts` with all 5 themes
3. **ThemeRegistry dynamic creation** — read cosmeticThemeId, build theme
4. **SettingsContext wiring** — expose cosmeticThemeId, default on create
5. **Settings page connection** — pass props to CosmeticSelector
6. **Cookie for SSR** — persist theme choice for server-side rendering
7. **Test all themes** — visual regression in Storybook + manual check

---

## Design Decisions

- **Global vs editor-only**: Start with global palette swap (simpler). Move to editor-only if users request it.
- **Light+dark per theme**: Each cosmetic theme defines both light and dark variants so it respects the user's system/manual color mode preference.
- **Level gating**: Enforce both client-side (UX) and server-side (security). Don't let users persist a theme they haven't unlocked.
- **No extra network calls**: Theme palettes are bundled in JS. No runtime fetch required.
- **Cookie-based SSR**: Avoids hydration mismatch by knowing the theme before React mounts.

---

## Non-Goals

- **User-created custom palettes** — Out of scope. Only the 5 predefined themes.
- **Per-component theming** — All components use the same palette. No component-level overrides.
- **Theme marketplace** — No instructor-uploaded themes.
