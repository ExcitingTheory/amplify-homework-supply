import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { headers } from "next/headers";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { SerwistProvider } from "@serwist/next/react";
import { SkipToMain } from "./SkipToMain";

export const metadata: Metadata = {
  title: "Homework Supply",
  description: "eLearning platform for instructors and learners",
  manifest: "/manifest.json",
  icons: {
    icon: "/static/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#556cd6",
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
  const nonce = headerStore.get("x-nonce") || crypto.randomUUID();

  return (
    <>
      {/* These elements are hoisted to <head> by Next.js */}
      <style
        nonce={nonce}
        suppressHydrationWarning
      >{`*, *::before, *::after { box-sizing: border-box; } body { margin: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }`}</style>
      <meta name="csp-nonce" content={nonce} />
      <SkipToMain />
      <InitColorSchemeScript attribute="data-mui-color-scheme" nonce={nonce} />
      <SerwistProvider
        swUrl="/sw.js"
        cacheOnNavigation
        reloadOnOnline
        options={{ scope: "/" }}
        disable={process.env.NODE_ENV === "development"}
      >
        {children}
      </SerwistProvider>
    </>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const lang = headerStore.get("x-locale") ?? "en";

  return (
    <html
      lang={lang}
      data-mui-color-scheme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head />
      <body>
        <Suspense>
          <DynamicShell>{children}</DynamicShell>
        </Suspense>
      </body>
    </html>
  );
}
