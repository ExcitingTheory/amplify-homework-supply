import { useColorScheme } from '@mui/material/styles';
import React from 'react';
import SettingsContext from '../context/settingsContext';

/**
 * Resolve the effective color scheme ('light' or 'dark') from MUI mode.
 * Used to persist the resolved value in a cookie for SSR.
 */
function resolveScheme(muiMode) {
  if (muiMode === 'dark') return 'dark';
  if (muiMode === 'light') return 'light';
  // 'system' — check media query (client only)
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function setColorSchemeCookie(muiMode) {
  if (typeof document === 'undefined') return;
  const resolved = resolveScheme(muiMode);
  document.cookie = `mui-color-scheme=${resolved};path=/;max-age=31536000;SameSite=Lax`;
}

export function useColorMode() {
  const { settings, updateSettings } = React.useContext(SettingsContext) || {};
  const { mode, setMode } = useColorScheme();

  // Sync MUI mode with persisted settings (one-way: settings → MUI).
  // Do NOT include `mode` in deps — it causes an infinite loop when an
  // external controller (e.g. Storybook's ColorSchemeSynchronizer) also
  // calls setMode, creating two effects that fight over the same state.
  React.useEffect(() => {
    if (!settings?.editorTheme) return;
    const muiMode = settings.editorTheme === 'auto' ? 'system' : settings.editorTheme;
    setMode(muiMode);
    setColorSchemeCookie(muiMode);
  }, [settings?.editorTheme, setMode]);

  // On mount, sync the cookie with MUI's current resolved mode
  React.useEffect(() => {
    if (mode) setColorSchemeCookie(mode);
  }, [mode]);

  const setColorMode = React.useCallback(
    (value) => {
      const muiMode = value === 'auto' ? 'system' : value;
      setMode(muiMode);
      setColorSchemeCookie(muiMode);
      if (updateSettings) {
        updateSettings({ editorTheme: value });
      }
    },
    [setMode, updateSettings],
  );

  return { mode: settings?.editorTheme || 'auto', setColorMode };
}
