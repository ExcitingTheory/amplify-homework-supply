'use client';

import * as React from 'react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../src/theme';

/**
 * Syncs the resolved MUI color scheme to a cookie so the server can
 * render the correct `data-mui-color-scheme` attribute and avoid hydration mismatch.
 */
function ColorSchemeCookieSync() {
  const { mode } = useColorScheme();

  React.useEffect(() => {
    if (!mode) return;
    let resolved: string;
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = mode;
    }
    document.cookie = `mui-color-scheme=${resolved};path=/;max-age=31536000;SameSite=Lax`;
  }, [mode]);

  // Also listen for OS preference changes when mode is 'system'
  React.useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      document.cookie = `mui-color-scheme=${resolved};path=/;max-age=31536000;SameSite=Lax`;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  return null;
}

/**
 * Emotion cache + MUI ThemeProvider for Next.js App Router.
 * Uses useServerInsertedHTML to flush emotion styles during SSR,
 * preventing hydration mismatches between server-rendered <style> tags
 * and client-rendered MUI components.
 *
 * CssBaseline is deferred to client-only because emotion's <Global>
 * component always renders an inline <style> tag during SSR but uses
 * useInsertionEffect (no DOM) on client, causing a hydration mismatch.
 * Since the theme uses CSS variables with InitColorSchemeScript in the
 * root layout, basic styles (bg, text) apply even before CssBaseline mounts.
 */
export default function ThemeRegistry({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache({ key: 'css', prepend: true, ...(nonce ? { nonce } : {}) });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <ColorSchemeCookieSync />
        {mounted && <CssBaseline enableColorScheme />}
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
