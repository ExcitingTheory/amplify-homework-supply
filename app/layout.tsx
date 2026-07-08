import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { headers } from 'next/headers';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { SkipToMain } from './SkipToMain';

export const metadata: Metadata = {
  title: 'Homework Supply',
  description: 'eLearning platform for instructors and learners',
  manifest: '/manifest.json',
  icons: {
    icon: '/static/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#556cd6',
};

/**
 * Async component that handles dynamic per-request data (CSP nonce).
 * Wrapped in Suspense so the static HTML shell can be pre-rendered with PPR.
 */
async function DynamicShell({ children }: { children: React.ReactNode }) {
  await connection();

  // Generate a per-request nonce for CSP.
  // Read from x-nonce header (set by proxy) or generate fresh.
  const headerStore = await headers();
  const nonce = headerStore.get('x-nonce') || crypto.randomUUID();

  return (
    <>
      {/* These elements are hoisted to <head> by Next.js */}
      <style nonce={nonce} suppressHydrationWarning>{`*, *::before, *::after { box-sizing: border-box; } body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }`}</style>
      <meta name="csp-nonce" content={nonce} />
      <SkipToMain />
      <InitColorSchemeScript attribute="data-mui-color-scheme" nonce={nonce} />
      {children}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html data-mui-color-scheme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head />
      <body>
        <Suspense>
          <DynamicShell>{children}</DynamicShell>
        </Suspense>
      </body>
    </html>
  );
}
