# App Router Migration Plan

> **Status**: Planning  
> **Scope**: Migrate from Next.js Pages Router (`pages/`) to App Router (`app/`)  
> **Next.js Version**: 16.2.1 (already supports coexistence of both routers)

---

## Executive Summary

The project currently uses the Pages Router with `next-i18next` for i18n. Every single `getServerSideProps` in the codebase exists **solely** to load i18n translation namespaces — there is no server-side data fetching at the SSP level. This makes the migration cleaner than typical because removing `getServerSideProps` requires only an i18n replacement, not data-fetching refactors.

The migration can be done incrementally. Next.js supports `pages/` and `app/` coexisting — routes are migrated one at a time, and both routers work simultaneously during the transition.

---

## Phase 0: Foundation (Pre-Migration)

### 0.1 — Create a migration branch

```bash
git checkout -b feat/app-router-migration
```

### 0.2 — Replace `next-i18next` with `next-intl`

`next-i18next` is Pages Router-only. Replace with `next-intl` which natively supports App Router.

**Current i18n config:**
- 6 locales: `en`, `es`, `fr`, `de`, `ja`, `zh` (default: `en`)
- 10 namespaces: `auth`, `common`, `components`, `pages`, `editor.authoring`, `editor.files`, `editor.ai`, `editor.blocks`, `editor.shared`, `workbook`
- Translation files: `public/locales/{locale}/{namespace}.json`

**Actions:**
1. Install `next-intl`
2. Create `src/i18n/` directory with:
   - `request.ts` — server-side i18n configuration
   - `routing.ts` — locale routing config (replaces `next-i18next.config.js` `i18n` block)
   - `navigation.ts` — locale-aware `Link`, `redirect`, `useRouter` exports
3. Move translation files from `public/locales/` → `messages/` (or keep in place with custom path config)
4. Create `middleware.ts` for locale detection/routing (replaces the built-in Pages Router `i18n` key)
5. Replace all `useTranslation('namespace')` calls with `useTranslations('namespace')` from `next-intl`
6. Remove all `getServerSideProps` / `getStaticProps` that only call `serverSideTranslations`
7. Remove `appWithTranslation` HOC from `_app.jsx`
8. Remove `i18n` key from `next.config.js`
9. Uninstall `next-i18next`

**Files affected:**
- `next-i18next.config.js` → delete
- `next.config.js` → remove `i18n` key
- Every page file (15 pages) → remove `getServerSideProps`
- Every component using `useTranslation` → update import

### 0.3 — Replace `@serwist/next` with `@serwist/turbopack`

**Actions:**
1. Install `@serwist/turbopack` and update `serwist` to preview channel
2. Update `next.config.js`: replace `withSerwist` wrapper with `@serwist/turbopack`'s `withSerwist`
3. Update `src/sw.ts`: change import from `@serwist/next/worker` → `@serwist/turbopack/worker`
4. Uninstall `@serwist/next`

**Before (next.config.js):**
```js
const withSerwist = require('@serwist/next').default({ ... });
module.exports = withSerwist({ ... });
```

**After (next.config.mjs):**
```js
import { withSerwist } from '@serwist/turbopack';
const nextConfig = withSerwist({ reactStrictMode: true, ... });
export default nextConfig;
```

### 0.4 — Convert `next.config.js` → `next.config.mjs`

App Router and Turbopack work best with ESM config. Convert `require()` → `import`.

---

## Phase 1: Root Layout

### 1.1 — Create `app/layout.tsx`

Replaces both `_app.jsx` and `_document.jsx`.

**Current `_app.jsx` responsibilities:**
- Emotion cache + MUI `ThemeProvider` + `CssBaseline`
- `AuthProvider` → `AuthGate` → `SettingsProvider` → `ChatContextProvider` → `TourProvider`
- `DebugPanelProvider`
- `GlobalChatButton`, `GlobalChatDrawer`, `OfflineBanner`, `EasterEggLayer`
- `useRouter` for locale redirect + pathname-based chat button visibility
- `appWithTranslation` HOC (removed in Phase 0)

**Current `_document.jsx` responsibilities:**
- `<Html lang="en">`, `<Head>` with PWA meta, Emotion style injection
- `InitColorSchemeScript`
- Server-side Emotion style extraction via `getInitialProps`

**Actions:**
1. Create `app/layout.tsx` with `<html>`, `<body>`, viewport meta, PWA meta
2. Create `app/providers.tsx` (`'use client'`) wrapping all context providers
3. Move Emotion SSR setup — MUI v7 with App Router uses `@emotion/react`'s streaming support (no manual `getInitialProps` needed)
4. Move `GlobalChatButton`, `GlobalChatDrawer`, `OfflineBanner`, `EasterEggLayer` into a client component within the layout
5. Replace `useRouter().pathname` with `usePathname()` from `next/navigation`
6. Replace locale redirect logic with `next-intl` middleware

**Provider nesting order (preserved):**
```tsx
// app/providers.tsx ('use client')
<CacheProvider>
  <ThemeProvider>
    <CssBaseline />
    <DebugPanelProvider>
      <AuthProvider>
        <AuthGate>
          <SettingsProvider>
            <ChatContextProvider>
              <TourProvider>
                {children}
              </TourProvider>
            </ChatContextProvider>
          </SettingsProvider>
        </AuthGate>
      </AuthProvider>
    </DebugPanelProvider>
  </ThemeProvider>
</CacheProvider>
```

### 1.2 — Create locale routing structure

With `next-intl`, the App Router uses a `[locale]` segment:

```
app/
├── layout.tsx              # Root HTML shell
├── [locale]/
│   ├── layout.tsx          # Providers + i18n setup
│   ├── page.tsx            # Home (was pages/index.jsx)
│   ├── ...
```

### 1.3 — Amplify configuration

The Amplify `configure()` call currently lives in `_app.jsx`. Move to a top-level client component or `app/amplify-config.ts` imported in root layout.

---

## Phase 2: Page Migration (Incremental)

Each page is migrated independently. While a page exists in `app/`, remove it from `pages/`. Next.js will serve from `app/` when both exist, but having both causes warnings.

### Migration pattern per page

**Before (`pages/example.jsx`):**
```jsx
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ExamplePage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  return <div>{t('hello')}</div>;
}

export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}
```

**After (`app/[locale]/example/page.tsx`):**
```tsx
'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function ExamplePage() {
  const router = useRouter();
  const t = useTranslations('common');
  return <div>{t('hello')}</div>;
}
```

### Migration order (recommended)

Migrate simplest pages first, complex pages last:

| Order | Page | Complexity | Notes |
|-------|------|-----------|-------|
| 1 | `offline.tsx` | Trivial | Static page, already TSX |
| 2 | `privacy.txt` | Trivial | Rename to `.tsx`, static content |
| 3 | `leaderboard.jsx` | Low | No `useRouter` |
| 4 | `skills.jsx` | Low | No `useRouter` |
| 5 | `sections.jsx` | Low | No `useRouter` |
| 6 | `guilds.jsx` | Low | Uses `useRouter` |
| 7 | `profile.jsx` | Low | Redirect page |
| 8 | `settings.jsx` | Medium | Uses `useRouter` |
| 9 | `units.jsx` | Medium | Uses `useRouter` |
| 10 | `index.jsx` | Medium | Home dashboard |
| 11 | `guild/[id].jsx` | Medium | Dynamic route + `useRouter` |
| 12 | `section/[id].jsx` | Medium | Dynamic route + `useRouter` |
| 13 | `profile/[username].jsx` | Medium | Dynamic route + `useRouter` |
| 14 | `instructor/gamification.jsx` | Medium | Nested route |
| 15 | `instructor/grade/[id].jsx` | Medium | Nested dynamic route |
| 16 | `review/[id].jsx` | High | Uses `getStaticProps` + `getStaticPaths` with `fallback: 'blocking'` |
| 17 | `unit/[id].jsx` | High | Full Lexical editor, many namespaces |
| 18 | `workbook/[id].jsx` | High | Lexical workbook, ChatSidebar |

### Dynamic route mapping

```
pages/guild/[id].jsx         → app/[locale]/guild/[id]/page.tsx
pages/instructor/gamification.jsx → app/[locale]/instructor/gamification/page.tsx
pages/instructor/grade/[id].jsx   → app/[locale]/instructor/grade/[id]/page.tsx
pages/profile/[username].jsx      → app/[locale]/profile/[username]/page.tsx
pages/review/[id].jsx             → app/[locale]/review/[id]/page.tsx
pages/section/[id].jsx            → app/[locale]/section/[id]/page.tsx
pages/unit/[id].jsx               → app/[locale]/unit/[id]/page.tsx
pages/workbook/[id].jsx           → app/[locale]/workbook/[id]/page.tsx
```

---

## Phase 3: API & Imports Cleanup

### 3.1 — `useRouter` migration

| Old (`next/router`) | New (`next/navigation`) |
|---------------------|------------------------|
| `router.push(path)` | `router.push(path)` (same API) |
| `router.replace(path)` | `router.replace(path)` (same API) |
| `router.query.id` | `useParams().id` |
| `router.pathname` | `usePathname()` |
| `router.locale` | `useLocale()` from `next-intl` |
| `router.push(path, asPath, { locale })` | `useRouter()` from `next-intl/navigation` |
| `router.asPath` | `usePathname()` + `useSearchParams()` |
| `router.isReady` | Not needed (App Router always ready) |

**Files using `useRouter` from `next/router`:**
- `pages/_app.jsx` (locale redirect + pathname check)
- `src/context/unitContext.jsx`
- ~14 page files

### 3.2 — `next/head` migration

3 files use `next/head`:
- `pages/_app.jsx` → viewport meta moves to `app/layout.tsx` `metadata` export
- `src/components/Editor3/plugins/ToolBarPlugin.jsx` → if setting `<title>`, use `next/navigation`'s `useMetadata` or keep as `<title>` in `<head>`
- `src/components/Editor3/plugins/ToolBarRoPlugin.jsx` → same

### 3.3 — `next/link`

Only 1 file (`GuildLeaderboard.tsx`). `next/link` works identically in App Router — no change needed.

### 3.4 — `next/dynamic`

2 files in Editor3. `next/dynamic` works in App Router — no change needed.

---

## Phase 4: MUI + Emotion SSR

MUI v7 with App Router requires a different SSR setup than the current `_document.jsx` approach.

**Actions:**
1. Create `app/ThemeRegistry.tsx` — client component that sets up Emotion cache + MUI ThemeProvider
2. Remove `createEmotionCache.js` server-side usage (or adapt for streaming)
3. Remove `createEmotionServer` usage from `_document.jsx`
4. MUI v7 already supports React Server Components for many components

**Reference**: [MUI Next.js App Router guide](https://mui.com/material-ui/integrations/nextjs/)

---

## Phase 5: Finalization

### 5.1 — Delete legacy files
- `pages/_app.jsx`
- `pages/_document.jsx`
- `pages/Pages.mdx`
- `next-i18next.config.js`
- Any remaining files in `pages/`

### 5.2 — Update `next.config.mjs`
- Remove `pageExtensions` filtering (App Router uses `page.tsx` convention)
- Remove `turbopack: {}` placeholder (configure if needed)
- Verify `output: 'standalone'` still works

### 5.3 — Update Amplify build config
- Check `amplify.yml` for any `pages/` references
- Verify standalone output works with new router

### 5.4 — Update Cypress tests
- All `cy.visit()` URLs should still work (same routes)
- Check for any `getServerSideProps`-dependent test setup

### 5.5 — Update Storybook
- Stories should be unaffected (components, not pages)
- Verify any page-level stories still work

---

## Dependencies to Install

```bash
npm install next-intl
npm install @serwist/turbopack
npm install serwist@preview
```

## Dependencies to Remove

```bash
npm uninstall next-i18next @serwist/next
```

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| i18n regression (missing translations) | High | Test every locale before merging |
| Emotion SSR hydration mismatch | Medium | Follow MUI v7 App Router guide exactly |
| `useRouter` behavioral differences | Medium | Incremental migration, test each page |
| Service worker breakage | Low | Service worker is disabled in dev; test in production build |
| Amplify deployment issues | Medium | Test `output: 'standalone'` build before merging |
| Storybook breakage | Low | Components don't depend on router directly |

---

## Estimated File Count

| Category | Files |
|----------|-------|
| New files (app/ directory) | ~25 |
| Deleted files (pages/ directory) | ~20 |
| Modified files (imports, hooks) | ~20 |
| Config files modified | ~4 |
| **Total files touched** | **~70** |

---

## Verification Checklist

- [ ] All 18 routes render correctly
- [ ] All 6 locales load translations
- [ ] Locale switching works (URL-based)
- [ ] Auth flow works (login/logout/redirect)
- [ ] Real-time subscriptions work (Amplify Data Client)
- [ ] Lexical editor loads and saves
- [ ] Workbook renders and grades
- [ ] Chat sidebar streams responses
- [ ] PWA service worker registers in production build
- [ ] Offline page works
- [ ] `npm run build` succeeds
- [ ] Cypress E2E tests pass
- [ ] Storybook builds
- [ ] Amplify deployment succeeds
