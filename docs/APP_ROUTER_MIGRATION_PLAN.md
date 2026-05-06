# App Router Migration Plan

> **Status**: Planning  
> **Scope**: Migrate from Next.js Pages Router (`pages/`) to App Router (`app/`)  
> **Next.js Version**: 16.2.1 (already supports coexistence of both routers)

---

## Executive Summary

The project currently uses the Pages Router with `next-i18next` for i18n. Every single `getServerSideProps` in the codebase exists **solely** to load i18n translation namespaces — there is no server-side data fetching at the SSP level. This makes the migration cleaner than typical because removing `getServerSideProps` requires only an i18n replacement, not data-fetching refactors.

The migration can be done incrementally. Next.js supports `pages/` and `app/` coexisting — routes are migrated one at a time, and both routers work simultaneously during the transition.

**Two-tier approach:**
1. **Core migration (Phases 0–5)** — Move to App Router with minimal behavior changes. All pages start as Client Components (`'use client'`), preserving existing subscription-based data patterns.
2. **Stretch goals (Phase 6)** — Refactor select pages to use React Server Components for initial data, reducing client JS and improving Time to First Byte.

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

---

## Phase 6: Stretch Goals — Server-Side Data Access with RSC

### Prerequisite: Amplify Server-Side Data Client

Currently **all** data access is client-side via `generateClient()` with Cognito user pool tokens. To render data in Server Components, we need server-side Amplify access.

**Actions:**
1. Install `@aws-amplify/adapter-nextjs`
2. Create `src/utils/amplifyServerClient.ts`:
   ```typescript
   import { createServerRunner } from '@aws-amplify/adapter-nextjs';
   import outputs from '../../amplify_outputs.json';

   export const { runWithAmplifyServerContext } = createServerRunner({
     config: outputs,
   });
   ```
3. Create `src/utils/amplifyServerData.ts`:
   ```typescript
   import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';
   import { cookies } from 'next/headers';
   import outputs from '../../amplify_outputs.json';

   export const cookieBasedClient = generateServerClientUsingCookies({
     config: outputs,
     cookies,
   });
   ```

This enables authenticated server-side queries using the user's session cookies.

---

### 6.1 — `instructor/grade/[id]` → Full Server Component

**Why:** Zero real-time subscriptions. All data is one-time fetches (`Grade.get`, `Unit.get`, `Grade.list`). The page is read-heavy with minimal interactivity (only "Override Grade" dialog).

**Current pattern:**
```jsx
// Client-side: fetch grade, unit, all attempts on mount
const [grade, setGrade] = useState(null);
useEffect(() => {
  client.models.Grade.get({ id }).then(({ data }) => setGrade(data));
}, [id]);
```

**Target architecture:**
```
app/[locale]/instructor/grade/[id]/
├── page.tsx         # Server Component — fetches grade + unit + attempts
├── loading.tsx      # Skeleton while streaming
└── GradeActions.tsx # 'use client' — Override dialog, moderation buttons
```

```tsx
// page.tsx (Server Component)
import { cookieBasedClient } from '@/utils/amplifyServerData';

export default async function InstructorGradePage({ params }) {
  const { id } = await params;
  const { data: grade } = await cookieBasedClient.models.Grade.get({ id });
  const { data: unit } = await cookieBasedClient.models.Unit.get({ id: grade.unitID });
  const { data: attempts } = await cookieBasedClient.models.Grade.list({
    filter: { unitID: { eq: grade.unitID }, owner: { eq: grade.owner } },
  });

  return (
    <>
      <GradedWorkbookViewer grade={grade} unit={unit} attempts={attempts} />
      <GradeActions gradeId={grade.id} gradeVersion={grade._version} />
    </>
  );
}
```

**Impact:** Eliminates all client JS for grade/unit/attempt fetching. Page renders with data already present — no loading spinners, no waterfall.

---

### 6.2 — `profile/[username]` → Server Shell + Client Islands

**Why:** Profile data, XP log, badges, and streak calendar are all fetched once with `.list()`. Only the "Nailed It Wall" section uses a real-time subscription.

**Target architecture:**
```
app/[locale]/profile/[username]/
├── page.tsx           # Server Component — fetches profile, XP log, badges
├── loading.tsx        # Profile skeleton
└── NailedItWall.tsx   # 'use client' — live subscription for nailed-it items
```

```tsx
// page.tsx (Server Component)
export default async function ProfilePage({ params }) {
  const { username } = await params;
  const { data: profiles } = await cookieBasedClient.models.StudentProfile.list({
    filter: { studentId: { eq: username } },
  });
  const profile = profiles[0];
  const { data: xpLog } = await cookieBasedClient.models.StudentXPLog.list({
    filter: { studentId: { eq: username } },
  });

  return (
    <>
      <ProfileHeader profile={profile} />
      <BadgeGrid badges={profile.badges} />
      <StreakCalendar xpLog={xpLog} />
      <ProgressRings profile={profile} />
      <NailedItWall username={username} />  {/* Client Component */}
    </>
  );
}
```

**Impact:** Profile page loads instantly with all static data server-rendered. Only the NailedIt subscription hydrates on the client. ~60% less client JS on this route.

---

### 6.3 — `leaderboard` → ISR with Client Hydration

**Why:** Leaderboard data changes infrequently (only when students earn XP). Real-time subscriptions exist for freshness but the data is the same for all users in a cohort — a shared cache would eliminate redundant DynamoDB queries.

**Target architecture:**
```
app/[locale]/leaderboard/
├── page.tsx         # Server Component with ISR (revalidate: 60)
└── LiveUpdater.tsx  # 'use client' — optional live subscription for instant updates
```

```tsx
// page.tsx
export const revalidate = 60; // ISR: re-render every 60 seconds

export default async function LeaderboardPage() {
  // Use IAM-based (unauthenticated) access for public leaderboard data
  const { data: profiles } = await cookieBasedClient.models.StudentProfile.list({
    limit: 100,
    // sort client-side — or use a GSI
  });
  const ranked = profiles.sort((a, b) => b.totalXP - a.totalXP);

  return (
    <>
      <LeaderboardTable profiles={ranked} />
      <LiveUpdater initialData={ranked} /> {/* Optional: hydrates with subscription */}
    </>
  );
}
```

**Impact:** First load is instant (cached HTML). Subsequent visitors within 60s get the same pre-rendered page without any DynamoDB calls. LiveUpdater optionally picks up changes for users who stay on the page.

---

### 6.4 — Published Unit Content → Static Generation

**Why:** Published unit content (`Unit.data` Lexical JSON) only changes when an instructor saves. The workbook view for students is essentially a static document with interactive quiz islands.

**Target architecture:**
```
app/[locale]/workbook/[id]/
├── page.tsx              # Server Component — fetches Unit content
├── loading.tsx           # Skeleton
├── QuizIslands.tsx       # 'use client' — graded interactive blocks
└── WorkbookChat.tsx      # 'use client' — ChatSidebar
```

```tsx
// page.tsx
export default async function WorkbookPage({ params }) {
  const { id } = await params;
  const { data: unit } = await cookieBasedClient.models.Unit.get({ id });
  const content = JSON.parse(unit.data); // Lexical JSON

  return (
    <>
      {/* Server-rendered read-only Lexical content */}
      <WorkbookContent content={content} unitId={id} />
      {/* Client-rendered interactive quiz blocks */}
      <QuizIslands unitId={id} content={content} />
      {/* Client-rendered chat */}
      <WorkbookChat unitId={id} />
    </>
  );
}
```

**Complexity:** HIGH. Lexical rendering on the server requires `@lexical/headless` or a custom read-only renderer. The grading system (`Grade.observeQuery`) must remain client-side. This is the most architecturally complex stretch goal.

**Impact:** If achieved, workbook pages load with content already visible (no blank page → loading → content flash). Interactive blocks hydrate separately. Potentially reduces TTFB by 1–2 seconds on slow connections.

---

### 6.5 — Skill Tree Definitions → Server-Cached

**Why:** Skill definitions are admin-configured and change very rarely. They're the same for all students in a cohort.

```tsx
// app/[locale]/skills/page.tsx
export const revalidate = 300; // 5 minutes

export default async function SkillsPage() {
  const { data: skills } = await cookieBasedClient.models.Skill.list({
    filter: { cohortId: { eq: 'default' } },
  });

  return (
    <>
      <SkillTreeViewer skills={skills} />
      <SkillProgress /> {/* 'use client' — user-specific grades */}
    </>
  );
}
```

---

### Stretch Goal Priority Matrix

| Goal | Effort | Impact | Recommendation |
|------|--------|--------|---------------|
| 6.1 `instructor/grade/[id]` → RSC | Low | Medium | **Do first** — cleanest candidate, no subscriptions |
| 6.2 `profile/[username]` → RSC | Low–Med | Medium | **Do second** — mostly one-time fetches |
| 6.3 Leaderboard ISR | Medium | High | **High value** — eliminates N×DynamoDB queries for same data |
| 6.4 Workbook static content | High | High | **Hard but transformative** — requires Lexical server rendering |
| 6.5 Skill tree caching | Low | Low | **Easy win** — but low user traffic on this page |

---

### Constraints & Considerations for RSC Data Access

1. **Auth requirement**: Most data requires authenticated access. `generateServerClientUsingCookies` reads the Amplify auth cookie — the user must be logged in. Unauthenticated pages (if any) need IAM-based access.

2. **No real-time in RSC**: Server Components cannot use `observeQuery` or WebSocket subscriptions. Any live data must be a Client Component island with `'use client'`.

3. **Amplify Gen 2 compatibility**: `@aws-amplify/adapter-nextjs` must be compatible with the Gen 2 data client. Verify this works with the schema defined in `amplify/data/resource.ts`.

4. **Optimistic locking**: Server-fetched data includes `_version`. If a Client Component later updates the record, it must use the `_version` from the server-rendered props or re-fetch.

5. **Streaming**: Use `<Suspense>` boundaries to stream heavy data (e.g., unit content) while lighter UI (nav, sidebar) renders instantly.

6. **Cache invalidation**: For ISR pages, we need to call `revalidatePath()` or `revalidateTag()` when instructors save content. This could be triggered from the Amplify subscription handler or a webhook.

---

## Overall Architecture After Full Migration

```
┌────────────────────────────────────────────────────────┐
│                    app/layout.tsx                        │
│  (Server Component — HTML shell, metadata, fonts)       │
├────────────────────────────────────────────────────────┤
│              app/[locale]/layout.tsx                     │
│  (Server Component — i18n provider setup)               │
├────────────────────────────────────────────────────────┤
│                  app/providers.tsx                       │
│  ('use client' — Auth, Settings, Chat, Tour, MUI, etc) │
├────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────┐    ┌──────────────────────┐      │
│   │  Server Pages   │    │   Client Pages       │      │
│   │  (RSC stretch)  │    │   (core migration)   │      │
│   ├─────────────────┤    ├──────────────────────┤      │
│   │ profile/[user]  │    │ index (dashboard)    │      │
│   │ instructor/grade│    │ unit/[id] (editor)   │      │
│   │ leaderboard     │    │ workbook/[id]        │      │
│   │ skills          │    │ sections             │      │
│   │                 │    │ settings             │      │
│   │                 │    │ guilds / guild/[id]  │      │
│   │                 │    │ review/[id] (Yjs)    │      │
│   └─────────────────┘    └──────────────────────┘      │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Phase 7: Server Actions — Lambda Elimination

### Overview

Server Actions (`'use server'`) run on the Next.js compute layer (always warm, same-origin). They eliminate Lambda cold starts (300–1500ms), API Gateway overhead (~20ms), SigV4 signing complexity (~50ms), and multi-hop GraphQL routing. The net result: ~12 Lambda functions can be replaced, reducing infrastructure complexity and improving response latency across all AI features.

**Current flow (Lambda via GraphQL):**
```
Client → AppSync GraphQL → Lambda (cold start) → OpenAI → Lambda → AppSync → Client
```

**New flow (Server Action):**
```
Client → Server Action (always warm, ~5ms) → OpenAI → Client
```

**Current flow (Lambda via REST streaming):**
```
Client → post() with SigV4 → API Gateway → Lambda (cold start) → OpenAI → SSE proxy → Client
```

**New flow (Server Action streaming):**
```
Client → Server Action → streamUI/streamText → React streaming → Client
```

---

### Tier 1: High Impact — Replace REST Streaming Lambdas

These three functions have the most user-visible latency. Lambda cold starts add 300–1500ms to the first message in every session.

#### 7.1 — `chatStream` → Server Action with `streamUI`

**Current:** 700+ line Lambda handler, REST API, SSE proxy via `homeworkSupplyStreamApi`  
**Called from:** `src/components/ChatSidebar.jsx`

```typescript
// app/actions/chat.ts
'use server';

import { streamUI } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { cookieBasedClient } from '@/utils/amplifyServerData';

export async function streamChat(messages, context) {
  // Access user session server-side (no SigV4 needed)
  const unit = await cookieBasedClient.models.Unit.get({ id: context.unitId });

  return streamUI({
    model: openai('gpt-4o'),
    system: buildSystemPrompt(unit, context),
    messages,
    tools: {
      search_content: { /* ... */ },
      insert_quiz: { /* ... */ },
      insert_answer_block: { /* ... */ },
    },
  });
}
```

**Impact:** Eliminates Lambda cold start (~300–1500ms on first message), API Gateway round-trip (~20ms), SigV4 signing (~50ms). Streams React components directly instead of raw text. The 700-line handler becomes ~80 lines.

#### 7.2 — `suggestBlocksStream` → Server Action with `streamText`

**Current:** REST streaming Lambda that analyses unit structure and suggests next block types  
**Called from:** `src/components/Editor3/plugins/BlockSuggestionPlugin.jsx`

```typescript
// app/actions/suggestBlocks.ts
'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function suggestBlocks(unitContent, existingBlocks) {
  return streamText({
    model: openai('gpt-4o-mini'),
    system: 'Analyze this educational content and suggest pedagogical blocks...',
    prompt: JSON.stringify({ content: unitContent, existingBlocks }),
  });
}
```

**Impact:** Block suggestions appear faster during authoring. No cold start delay while instructor is actively editing.

#### 7.3 — `contentCompletionStream` → Server Action with `streamText`

**Current:** REST streaming Lambda for inline AI autocomplete  
**Called from:** `src/components/Editor3/plugins/AIContentCompletionPlugin.js`

```typescript
// app/actions/contentCompletion.ts
'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function completeContent(precedingText, context) {
  return streamText({
    model: openai('gpt-4o-mini'),
    system: 'Continue this educational content naturally...',
    prompt: precedingText,
  });
}
```

**Impact:** Autocomplete latency drops significantly. Currently the most latency-sensitive feature — users see suggestions while typing. Cold start elimination is critical here.

---

### Tier 2: Medium Impact — Replace GraphQL-Wrapped OpenAI Calls

These currently traverse: `client.queries.*()` → AppSync → Lambda → OpenAI → Lambda → AppSync → client. Server Actions cut this to: client → Next.js server → OpenAI → response.

#### 7.4 — Grading Actions

**Current:** `verifyDefinition`, `verifyWord`, `verifyShortAnswer`, `verifyAudio`, `verifyAudioUrl`, `verifyImage`, `verifyImageUrl` — 7 GraphQL queries routed through the `openai` Lambda  
**Called from:** CustomAnswerComponent, RecordingStudio2, SketchPad, reconcileGrades

```typescript
// app/actions/grading.ts
'use server';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function gradeAnswer(params: {
  answer: string;
  correctAnswer: string;
  type: 'definition' | 'word' | 'shortAnswer' | 'audio' | 'image';
  rubric?: string;
}) {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: `Grade this ${params.type} answer. Return JSON: { accuracy: 0-100, feedback: string }`,
    prompt: `Expected: ${params.correctAnswer}\nStudent answer: ${params.answer}`,
  });
  return JSON.parse(text);
}

export async function gradeAudioAnswer(audioUrl: string, expectedAnswer: string) {
  // Whisper transcription + GPT grading in one server round-trip
  const transcription = await openai.audio.transcriptions.create({
    file: await fetch(audioUrl),
    model: 'whisper-1',
  });
  return gradeAnswer({
    answer: transcription.text,
    correctAnswer: expectedAnswer,
    type: 'audio',
  });
}

export async function gradeImageAnswer(imageUrl: string, expectedAnswer: string) {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    messages: [
      { role: 'user', content: [
        { type: 'text', text: `Grade this image against: ${expectedAnswer}` },
        { type: 'image', image: imageUrl },
      ]},
    ],
  });
  return JSON.parse(text);
}
```

**Impact:** Grading responses return faster. Can batch multiple verifications in one action call. Eliminates AppSync round-trip overhead for every quiz question.

#### 7.5 — Content Generation Actions

**Current:** `generateAudio`, `generateAudioFile`, `generateImageFile`, `generateImage` — via `openai` Lambda  
**Called from:** RecordingStudio3, FileManager2, EnhancedGenerators

```typescript
// app/actions/generate.ts
'use server';

import { openai as openaiClient } from '@ai-sdk/openai';
import { cookieBasedClient } from '@/utils/amplifyServerData';

export async function generateSpeech(text: string, voice: string = 'alloy') {
  const response = await openaiClient.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
  });
  const buffer = Buffer.from(await response.arrayBuffer());

  // Save to S3 and create File record server-side
  const key = `public/audio/tts-${Date.now()}.mp3`;
  // ... upload to S3, create File record via cookieBasedClient
  return { key, url: `...` };
}

export async function generateImage(prompt: string, size: string = '1024x1024') {
  const response = await openaiClient.images.generate({
    model: 'dall-e-3',
    prompt,
    size,
    n: 1,
  });
  // Save to S3, create File record
  return { url: response.data[0].url };
}
```

**Impact:** TTS and image generation no longer need Lambda. S3 upload + File record creation happen in one server round-trip instead of Lambda → S3 → return URL → client creates File record.

#### 7.6 — `summarizeFeedback` → Server Action

**Current:** GraphQL query through `openai` Lambda  
**Called from:** `src/context/unitContext.jsx` on grade completion

```typescript
// app/actions/feedback.ts
'use server';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { cookieBasedClient } from '@/utils/amplifyServerData';

export async function generateFeedbackSummary(gradeId: string) {
  const { data: grade } = await cookieBasedClient.models.Grade.get({ id: gradeId });
  const { data: unit } = await cookieBasedClient.models.Unit.get({ id: grade.unitID });

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: 'Summarize this student submission with constructive feedback...',
    prompt: JSON.stringify({ gradeData: grade.data, unitName: unit.name }),
  });
  return text;
}
```

**Impact:** Feedback generation gets direct DynamoDB access + OpenAI in one hop instead of client → AppSync → Lambda → DynamoDB → OpenAI → Lambda → AppSync → client.

#### 7.7 — `moderateContent` → Server Action

**Current:** GraphQL mutation through `moderation` Lambda  
**Called from:** `src/utils/moderateContent.jsx` (used throughout app on saves)

```typescript
// app/actions/moderate.ts
'use server';

import { openai } from '@ai-sdk/openai';

export async function moderateContent(content: string, recordId?: string) {
  const response = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: content,
  });
  const result = response.results[0];

  if (result.flagged) {
    // Log moderation event server-side
    await cookieBasedClient.models.ModerationLog.create({
      recordId,
      flagged: true,
      categories: JSON.stringify(result.categories),
    });
  }

  return { flagged: result.flagged, categories: result.categories };
}
```

**Impact:** Moderation is a simple HTTP call to OpenAI — Lambda overhead is completely unnecessary. Reduces latency on every content save.

#### 7.8 — `generatePracticeDrill` → Server Action

**Current:** GraphQL mutation through `generatePracticeDrill` Lambda  
**Called from:** `src/components/PracticeDrill/usePracticeDrill.ts`

```typescript
// app/actions/drill.ts
'use server';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { cookieBasedClient } from '@/utils/amplifyServerData';

export async function generateDrill(unitId: string, drillType: string, count: number) {
  const { data: unit } = await cookieBasedClient.models.Unit.get({ id: unitId });
  const { data: words } = await cookieBasedClient.models.UnitWord.list({
    filter: { unitId: { eq: unitId } },
  });

  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: `Generate ${count} practice drill questions of type "${drillType}"...`,
    prompt: JSON.stringify({ unitName: unit.name, vocabulary: words }),
  });

  return JSON.parse(text);
}
```

**Impact:** AI generation + DynamoDB reads in one server round-trip. Currently: client → AppSync → Lambda → DynamoDB → OpenAI → Lambda → AppSync → client (6 hops → 1 hop).

---

### Tier 3: Lower Impact — Simplify Infrastructure

#### 7.9 — `embeddings` → Server Actions

**Current:** `generateEmbedding`, `generateEmbeddings` via `embeddings` Lambda  
**Called from:** `fileUploadUtils.jsx`, `FileManager2.jsx`, `chatTools.js`

```typescript
// app/actions/embeddings.ts
'use server';

import { openai } from '@ai-sdk/openai';
import { cookieBasedClient } from '@/utils/amplifyServerData';

export async function embedContent(content: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content,
  });
  return response.data[0].embedding;
}

export async function embedFile(fileId: string) {
  const { data: file } = await cookieBasedClient.models.File.get({ id: fileId });
  // Fetch content, generate embedding, update record
  const embedding = await embedContent(file.extractedText);
  await cookieBasedClient.models.File.update({
    id: fileId,
    embedding: JSON.stringify(embedding),
    embeddingModel: 'text-embedding-3-small',
    _version: file._version,
  });
  return { success: true };
}
```

#### 7.10 — `gamification` → Consolidated Server Action

**Current:** Multiple sequential Lambda calls (`awardXP`, `checkBadges`, `updateStreak`, `checkPersonalBest`) via `gamificationActions.ts`  
**Called from:** `src/context/unitContext.jsx` on grade submission

```typescript
// app/actions/gamification.ts
'use server';

import { cookieBasedClient } from '@/utils/amplifyServerData';

export async function recordGradeCompletion(gradeId: string, accuracy: number) {
  const { data: grade } = await cookieBasedClient.models.Grade.get({ id: gradeId });

  // All gamification logic in one atomic server operation:
  // 1. Award XP based on accuracy
  const xpEarned = calculateXP(accuracy);
  await cookieBasedClient.models.StudentXPLog.create({ ... });

  // 2. Update streak
  await updateStreak(grade.owner);

  // 3. Check badges
  const newBadges = await checkBadgeEligibility(grade.owner, accuracy);

  // 4. Check personal best
  const isPersonalBest = await checkPersonalBest(grade.owner, grade.unitID, accuracy);

  return { xpEarned, newBadges, isPersonalBest };
}
```

**Impact:** Single Server Action replaces 3–5 sequential Lambda calls that currently execute serially from the client. Atomic server-side execution is faster and more reliable.

#### 7.11 — `section` Operations → Server Actions

**Current:** `addSelfToSection`, `createSectionGroup`, `joinPeerReview` via `section` Lambda  
**Called from:** `MainToolbar.jsx`, `chatTools.js`, `JoinPeerReviewDialog.tsx`

```typescript
// app/actions/section.ts
'use server';

import { cookieBasedClient } from '@/utils/amplifyServerData';

export async function joinSection(code: string) {
  // Validate code, add user to section — all server-side
  const { data: sections } = await cookieBasedClient.models.Section.list({
    filter: { code: { eq: code } },
  });
  if (!sections.length) throw new Error('Invalid section code');

  // Add user to Cognito group + create membership record
  // ...
  return { success: true, sectionName: sections[0].name };
}
```

**Impact:** Trivial data mutations that don't need Lambda infrastructure overhead.

---

### Tier 4: Keep as Lambda (Not suitable for Server Actions)

| Function | Reason |
|----------|--------|
| **`streakResetCron`** | Scheduled by CloudWatch Events — no user trigger |
| **`yjsSync`** | Persistent WebSocket server for real-time document collaboration |
| **`mediaConvert`** | Triggered by S3 `OBJECT_CREATED_PUT` events + AWS MediaConvert jobs (long-running) |
| **`analyzeDocument`** | Can exceed 30s for large PDFs — needs Lambda's 15-min timeout |
| **`peerReviewAI`** | Triggered by WebSocket events, not direct user action |

---

### Server Action Implementation Strategy

#### File Organization

```
app/
├── actions/
│   ├── chat.ts              # streamChat (Tier 1)
│   ├── suggestBlocks.ts     # suggestBlocks (Tier 1)
│   ├── contentCompletion.ts # completeContent (Tier 1)
│   ├── grading.ts           # gradeAnswer, gradeAudio, gradeImage (Tier 2)
│   ├── generate.ts          # generateSpeech, generateImage (Tier 2)
│   ├── feedback.ts          # generateFeedbackSummary (Tier 2)
│   ├── moderate.ts          # moderateContent (Tier 2)
│   ├── drill.ts             # generateDrill (Tier 2)
│   ├── embeddings.ts        # embedContent, embedFile (Tier 3)
│   ├── gamification.ts      # recordGradeCompletion (Tier 3)
│   └── section.ts           # joinSection (Tier 3)
```

#### Environment Variables

Server Actions run in the Next.js server runtime. OpenAI API keys and other secrets move from AWS SSM (Lambda) to Amplify environment variables:

```bash
# amplify.yml or Amplify Hosting environment variables
OPENAI_API_KEY=sk-...
```

No more SSM `getParameter()` calls — `process.env.OPENAI_API_KEY` directly.

#### Migration Order

1. **Phase 7a** — Tier 1 streaming actions (highest user-visible impact)
2. **Phase 7b** — Tier 2 grading + generation (most frequent operations)
3. **Phase 7c** — Tier 3 consolidation (infrastructure simplification)
4. **Phase 7d** — Remove unused Lambda functions from `amplify/functions/`

#### Latency Comparison

| Operation | Current (Lambda) | After (Server Action) | Improvement |
|-----------|-----------------|----------------------|-------------|
| First chat message (cold) | 1500–2500ms | 200–400ms | **~6x faster** |
| First chat message (warm) | 300–500ms | 200–400ms | ~1.5x faster |
| Inline autocomplete (cold) | 1200–2000ms | 100–300ms | **~6x faster** |
| Grade a quiz answer | 400–800ms | 150–300ms | ~2.5x faster |
| Generate TTS audio | 500–1000ms | 300–600ms | ~1.7x faster |
| Moderate on save | 300–600ms | 100–200ms | ~3x faster |
| Gamification (4 calls) | 1200–2400ms | 200–400ms | **~6x faster** |

#### Infrastructure Removed After Full Migration

```
┌───────────────────────────────────────────────────────────────┐
│           Lambda Functions Eliminated (12 of 16)              │
├───────────────────────────────────────────────────────────────┤
│ ✗ chatStream              (REST streaming → Server Action)    │
│ ✗ suggestBlocksStream     (REST streaming → Server Action)    │
│ ✗ contentCompletionStream (REST streaming → Server Action)    │
│ ✗ openai                  (15+ GraphQL ops → Server Actions)  │
│ ✗ moderation              (GraphQL → Server Action)           │
│ ✗ embeddings              (GraphQL → Server Action)           │
│ ✗ gamification            (GraphQL → Server Action)           │
│ ✗ section                 (GraphQL → Server Action)           │
│ ✗ generatePracticeDrill   (GraphQL → Server Action)           │
│ ✗ documentAnalysis        (partially — short docs only)       │
├───────────────────────────────────────────────────────────────┤
│           Lambda Functions Retained (4–5 of 16)               │
├───────────────────────────────────────────────────────────────┤
│ ✓ streakResetCron         (scheduled — no user trigger)       │
│ ✓ yjsSync                 (WebSocket — persistent process)    │
│ ✓ mediaConvert            (S3 trigger — long-running)         │
│ ✓ peerReviewAI            (WebSocket trigger)                 │
│ ✓ documentAnalysis        (large PDFs exceed 30s timeout)     │
└───────────────────────────────────────────────────────────────┘
```

#### Amplify Hosting Considerations

- Server Actions run in the **same compute** as the Next.js server on Amplify Hosting
- Amplify Hosting supports Server Actions natively with `output: 'standalone'`
- No additional infrastructure configuration needed
- OpenAI API key stored as Amplify environment variable (not SSM)
- Server Action timeout defaults to 30s (sufficient for all Tier 1–3 operations except large document analysis)

---

### Updated Two-Tier Approach Summary

```
┌─────────────────────────────────────────────────────────────┐
│                   Migration Phases                            │
├──────────────┬──────────────────────────────────────────────┤
│ Phase 0      │ Foundation (i18n swap, serwist, ESM config)  │
│ Phase 1      │ Root Layout (app/layout.tsx, providers)       │
│ Phase 2      │ Page Migration (18 pages, incremental)       │
│ Phase 3      │ API & Imports Cleanup (useRouter, etc.)      │
│ Phase 4      │ MUI + Emotion SSR                            │
│ Phase 5      │ Finalization (delete pages/, verify)         │
├──────────────┼──────────────────────────────────────────────┤
│ Phase 6      │ RSC Stretch Goals (server data fetching)     │
│ Phase 7      │ Server Actions (Lambda elimination)          │
└──────────────┴──────────────────────────────────────────────┘
```
