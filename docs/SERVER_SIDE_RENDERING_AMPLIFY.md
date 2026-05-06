# Server-Side Rendering with Amplify Gen 2 + Next.js App Router

> **Purpose**: Technical reference for enabling server-side data access and analysis of expected performance improvements.

---

## How It Works

### The Package

```bash
npm install @aws-amplify/adapter-nextjs
```

This is the official Amplify adapter for Next.js server-side rendering. It reads auth cookies from the incoming request and uses them to make authenticated GraphQL calls to AppSync — on the server, before any HTML reaches the browser.

---

### Setup (Two Files)

#### 1. Server Runner — `src/utils/amplifyServerUtils.ts`

```typescript
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import outputs from '@/amplify_outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});
```

Used for general server-side Amplify operations (getting current user, checking auth state in middleware, etc.).

#### 2. Cookie-Based Data Client — `src/utils/amplifyServerClient.ts`

```typescript
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';
import { cookies } from 'next/headers';
import outputs from '@/amplify_outputs.json';

export const cookieBasedClient = generateServerClientUsingCookies({
  config: outputs,
  cookies,
});
```

This gives you the same `.models.X.get()` / `.list()` API as the client — but it runs on the server using the user's session cookies for authentication.

---

### Usage in a Server Component

```tsx
// app/[locale]/instructor/grade/[id]/page.tsx
import { cookieBasedClient } from '@/utils/amplifyServerClient';

export default async function GradePage({ params }) {
  const { id } = await params;

  // Runs on server — user sees the result immediately, no spinner
  const { data: grade } = await cookieBasedClient.models.Grade.get({ id });
  const { data: unit } = await cookieBasedClient.models.Unit.get({
    id: grade.unitID,
  });

  return (
    <>
      <h1>{unit.name}</h1>
      <GradedWorkbookViewer grade={grade} unit={unit} />
      {/* Only this hydrates on the client */}
      <GradeActions gradeId={id} version={grade._version} />
    </>
  );
}
```

---

### Auth Flow Diagram

```
Browser sends request
  │ (Amplify auth cookies automatically attached)
  ▼
Next.js Server Component renders
  │
  ▼
generateServerClientUsingCookies() reads cookies
  │
  ▼
Extracts Cognito JWT from cookie
  │
  ▼
Authenticated GraphQL call to AppSync
  │ (AppSync applies @auth rules: owner, groups)
  ▼
Data returned → rendered into HTML
  │
  ▼
HTML streamed to browser with data already visible
  │ (no loading spinner, no client fetch)
  ▼
Client Components hydrate for interactivity only
```

---

### What Works Server-Side vs What Doesn't

| Operation | Server Component? | Notes |
|---|:---:|---|
| `.get(id)` | ✅ | Single record fetch |
| `.list({ filter })` | ✅ | Filtered queries |
| `.graphql({ query })` | ✅ | Raw GraphQL |
| `.create()` / `.update()` / `.delete()` | ✅ | Via Server Actions |
| `.observeQuery()` | ❌ | WebSocket — browser only |
| `.onUpdate()` / `.onCreate()` | ❌ | Subscriptions — browser only |
| S3 `getUrl()` / `uploadData()` | ❌ | Requires browser Storage API |

---

## Perceptible Speed Wins — Honest Assessment

### What users experience today (Pages Router, all client-side)

```
1. Browser requests page               → blank white (or skeleton)
2. Next.js sends JS bundle              → still blank
3. React hydrates                        → skeleton visible
4. Amplify configures + fetches token   → still skeleton
5. GraphQL query fires                   → still skeleton
6. Data returns, component re-renders   → CONTENT VISIBLE
```

**Time from click to content**: ~1.5–3s on fast connections, 3–5s on 3G/slow.

### What users would experience (App Router + RSC)

```
1. Browser requests page
2. Server fetches data (already has auth cookie)  → ~100-200ms
3. HTML streamed with content                      → CONTENT VISIBLE
4. Client Components hydrate                       → interactive
```

**Time from click to content**: ~200–500ms on fast connections, 500ms–1.5s on slow.

---

### Where the speed wins are perceptible

| Page | Current Wait | With RSC | User Feels It? |
|---|---|---|---|
| **instructor/grade/[id]** | 1.5–2s (fetch grade + unit + attempts) | ~200ms (server fetch) | **YES — dramatic** |
| **profile/[username]** | 1–2s (fetch profile + XP log + badges) | ~200ms | **YES — noticeable** |
| **leaderboard** | 1–2s (fetch all profiles + sort) | ~100ms (ISR cached) | **YES — feels instant** |
| **skills** | 1–1.5s (fetch skill defs + grades) | ~200ms | **Moderate** |
| **workbook/[id]** (content only) | 2–3s (fetch unit content + parse Lexical) | ~300ms (content visible) | **YES — biggest visual impact** |

### Where the speed wins are NOT perceptible

| Page | Why |
|---|---|
| **index (dashboard)** | 5+ observeQuery subscriptions fire simultaneously. Even if initial data is server-rendered, the subscriptions re-fire on hydration. The skeleton-to-content transition is the same. |
| **unit/[id] (editor)** | Lexical editor must fully hydrate before it's usable. Server rendering the JSON doesn't help because the editor needs client-side DOM control. |
| **section/[id]** | Real-time grade/assignment subscriptions mean client takes over immediately. |
| **review/[id]** | Yjs WebSocket collaboration — purely client-side by nature. |

---

### Quantified Impact Estimates

| Metric | Current | After RSC (target pages) | Improvement |
|---|---|---|---|
| **Time to First Contentful Paint** | 1.5–3s | 200–500ms | **3–6× faster** |
| **Largest Contentful Paint** | 2–4s | 300–700ms | **3–5× faster** |
| **Client JS shipped** (per RSC page) | Full component + fetch logic | Just interactive islands | **40–60% less JS** |
| **DynamoDB read units** (leaderboard) | N reads × M concurrent users | 1 read per ISR interval | **~99% reduction** |
| **Loading spinners visible** | Every page load | Only for live-data islands | **Eliminated on 5 pages** |

---

### The "Feel" Difference

The most perceptible improvement is **elimination of the loading skeleton flash**. Today, every page shows:

1. White/blank → 2. Skeleton → 3. Content

With RSC, target pages show:

1. Content (already there)

This is especially noticeable on:
- **Repeat visits** — ISR pages serve from cache in <100ms
- **Slow connections** — no waterfall of JS download → parse → execute → fetch → render
- **Mobile devices** — less JS to parse means faster interactivity

---

### What Doesn't Improve

- **Real-time update latency** — subscriptions are still WebSocket-based regardless of router
- **Editor responsiveness** — Lexical performance is DOM-bound, not data-bound
- **Auth redirect speed** — Cognito token validation still happens (just on server instead of client)
- **Pages users stay on** — after initial load, the subscription-based model is identical

---

## Summary

| Question | Answer |
|---|---|
| Are there perceptible speed wins? | **Yes, on 5 of 18 pages** |
| Which pages benefit most? | instructor/grade, profile, leaderboard, workbook (content), skills |
| What's the biggest visual change? | No more loading skeletons — content appears immediately |
| Is it worth it for the interactive pages? | No — those are subscription-heavy and need full client hydration anyway |
| What's the effort? | Low for instructor/grade and profile. Medium for leaderboard (ISR). High for workbook (Lexical server rendering). |
| Should we do it? | Yes for the easy wins (stretch goals 6.1, 6.2, 6.3). Defer 6.4 (workbook) until Lexical has better headless rendering support. |
