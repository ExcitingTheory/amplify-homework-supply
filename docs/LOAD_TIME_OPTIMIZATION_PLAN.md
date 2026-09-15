# Load-Time Optimization & Code-Splitting Plan

**Question answered:** _Can we improve load times with code splitting, and if so where and how? Are there other places we can optimize loading?_

**Short answer:** Yes. There are several eager imports of very heavy libraries that ship to every user (or every route) even though they are only needed for narrow, on-demand interactions. Code splitting will meaningfully cut the initial JS payload. Beyond splitting, there are wins in bundler configuration, barrel-import hygiene, and moving more work server-side.

> Companion doc: [SSR_PERFORMANCE.md](SSR_PERFORMANCE.md) covers the RSC/streaming strategy already in place. This plan focuses on **client bundle size and lazy loading**.

---

## TL;DR — Prioritized Actions

| # | Action | Impact | Effort | Risk |
|---|--------|:------:|:------:|:----:|
| 1 | Add a bundle analyzer to measure before/after | Enables everything else | S | None |
| 2 | Lazy-load DiceBear style packs (only load the selected style) | **High** | M | Low |
| 3 | Lazy-load `ChatSidebar` inside `GlobalChatDrawer` (loads on every page today) | **High** | S | Low |
| 4 | Lazy-load `@mui/x-data-grid` in authoring editors | Med–High | M | Low |
| 5 | Lazy-load `SkillTree` (`@xyflow/react`) and `CadenceCopyDialog` (`@mui/x-scheduler`) | Med | S | Low |
| 6 | Add `experimental.optimizePackageImports` for MUI icons / react-icons / dicebear | Med | S | Low |
| 7 | Lazy-load `PdfThumbnail` / `react-pdf` on non-editor surfaces | Med | S | Low |
| 8 | Route-level split of `Editor3` `Workbook` where read-only rendering suffices | Med | M | Med |
| 9 | Audit `framer-motion` usage; import granularly / lazy-load heavy animations | Low–Med | M | Low |

Legend: S = small, M = medium.

---

## Current State (what's already good)

The Editor3 subsystem already does a lot right — several heavy nodes are lazy:

- `SketchPad` / `@excalidraw/excalidraw` — `next/dynamic` in `AnswerComponent.jsx`, `CustomAnswerComponent.jsx`, `React.lazy` in `CustomAIComponent.tsx`.
- `PdfViewerComponent` (`react-pdf`) — `React.lazy` in [PdfViewerNode.jsx](../src/components/Editor3/components/PdfViewerNode.jsx).
- `TableComponent`, `ImageComponent` — `React.lazy` in their nodes.
- `MediaPlayerComponent`, `ConversationPlayer`, `CustomAIEditor` — `lazy()` in their plugins.

Infra is also solid: Turbopack, React Compiler, `output: 'standalone'`, custom CDN image loader, Serwist service worker, RSC data fetching, and ISR on `/leaderboard` and `/skills`.

**The gaps are eager imports of heavy libraries in globally-mounted or route-entry components.**

---

## Findings & Recommendations

### 1. Add a bundle analyzer (do this first)

There is **no bundle analyzer** wired up today, so all sizing below is inferred from dependency weight and import location. Measurement must come first so we can quantify wins and avoid guessing.

**How:**
- Add `@next/bundle-analyzer`, gate it behind `ANALYZE=true`, and wrap the config in `next.config.mjs` (compose alongside `withSerwist` / `withNextIntl`).
- Add script: `"analyze": "ANALYZE=true next build"`.
- Capture a baseline report, then re-measure after each change below.

> Note: modifying `next.config.mjs` and `package.json` requires maintainer approval per repo conventions — flag before implementing.

---

### 2. DiceBear avatars — eager import of ~20 style packs 🔴 biggest win

[DiceBearAvatar.tsx](../src/components/Gamification/DiceBearAvatar.tsx) statically imports **every** DiceBear collection:

```ts
import * as avataaars from '@dicebear/avataaars'
import * as toonHead from '@dicebear/toon-head'
// …18 more: adventurer, bottts, pixel-art, shapes, thumbs, rings, glass, identicon, initials, …
```

Only **one** style is rendered per avatar, but all ~20 collections (each with embedded SVG asset data) ship in the bundle. Avatars appear on leaderboards, squads, and profiles — high-traffic surfaces.

**How:**
- Replace the static namespace imports with a lazy resolver keyed by `AvatarStyleTier`, e.g. a `styleLoaders` map of `() => import('@dicebear/bottts')`, resolved inside an effect/async `useMemo`, rendering a placeholder until the chosen collection loads.
- The 3–4 "default/common" styles (`simple`, `detailed`) can stay eager for instant first paint; unlockable/rare styles (`bottts`, `glass`, `rings`, etc.) load on demand.
- Consider a small shared cache so a style downloaded once is reused across many avatars on the same page.

**Impact:** Removes the largest single block of avoidable client JS from common pages.

---

### 3. `ChatSidebar` loads on every authenticated page 🔴

[GlobalChatDrawer.jsx](../src/components/GlobalChatDrawer.jsx) is mounted globally via `app/providers.tsx` and **statically imports `ChatSidebar`**:

```js
import ChatSidebar from './ChatSidebar';
```

`ChatSidebar` pulls in the Vercel AI SDK (`@ai-sdk/react`, `ai`), Editor3 plugins, and `BlockInsertPreview` (which imports `QuizComponent`, `AnswerComponent`, etc.). All of this ships on first load of every page even though the drawer is closed by default.

**How:**
- Convert the `ChatSidebar` import in `GlobalChatDrawer` to `next/dynamic` with `ssr: false` and a lightweight skeleton fallback.
- Only render/mount it when `isChatOpen` becomes true (the drawer already tracks `isChatOpen` from `ChatContext`), so the chunk downloads on first open, not on page load.

**Impact:** Removes the AI SDK + chat editor graph from the initial payload of every route.

---

### 4. `@mui/x-data-grid` in authoring editors 🟠

`DataGrid` is eagerly imported in six authoring-only components:

- [AnswerEditor.jsx](../src/components/Editor3/components/AnswerEditor.jsx)
- [MeaningAssociationEditor.jsx](../src/components/Editor3/components/MeaningAssociationEditor.jsx)
- [MediaPlayerComponent.jsx](../src/components/Editor3/components/MediaPlayerComponent.jsx)
- [PlaylistEditor.jsx](../src/components/Editor3/components/PlaylistEditor.jsx)
- [CustomAIEditor.tsx](../src/components/Editor3/nodes/CustomAINode/CustomAIEditor.tsx)
- [CustomAnswerEditor.jsx](../src/components/Editor3/nodes/CustomAnswerNode/CustomAnswerEditor.jsx)

`@mui/x-data-grid` is a large component and is `transpilePackages`-listed (so it's not tree-shaken away). Learners never touch these authoring editors, yet the grid can be pulled into shared chunks.

**How:**
- Wrap `DataGrid` usage in a locally lazy-loaded wrapper (`const DataGrid = dynamic(() => import('@mui/x-data-grid').then(m => m.DataGrid), { ssr: false })`) in each editor, or extract a single shared `LazyDataGrid` component and reuse it.
- Verify these editors are only reachable from instructor/authoring routes; if so, the chunk stays out of learner bundles entirely.

---

### 5. `SkillTree` (`@xyflow/react`) and `CadenceCopyDialog` (`@mui/x-scheduler`) 🟠

- [SkillTree.tsx](../src/components/Gamification/SkillTree.tsx) eagerly imports `@xyflow/react` (React Flow) — a large graph-rendering lib used only on the skill-tree view.
- [CadenceCopyDialog.jsx](../src/components/CadenceCopyDialog.jsx) eagerly imports `@mui/x-scheduler/event-calendar` (`EventCalendar`, a beta scheduler) — used only inside one dialog.

**How:**
- `next/dynamic` both with `ssr: false`. For the dialog, only mount the calendar once the dialog opens.

---

### 6. Bundler-level barrel optimization 🟠

The app imports from big barrel packages (`@mui/icons-material`, `react-icons`, `@mui/material`, `@dicebear/*`). Next's `experimental.optimizePackageImports` rewrites these to per-module imports so only used symbols are bundled.

**How:** add to `next.config.mjs`:

```js
experimental: {
  turbopackFileSystemCacheForDev: true, // existing
  optimizePackageImports: [
    '@mui/material',
    '@mui/icons-material',
    'react-icons',
    '@dicebear/core',
  ],
},
```

(Requires config change → maintainer approval.) Measure with the analyzer from step 1; `@mui/icons-material` alone is a common source of bloat when imported by name.

---

### 7. `react-pdf` / `pdfjs-dist` outside the editor 🟠

PDF rendering is already lazy inside the editor, but these surfaces import it eagerly:

- [PdfThumbnail.tsx](../src/components/PdfThumbnail.tsx)
- [usePdfThumbnail.ts](../src/hooks/usePdfThumbnail.ts)
- [pdfThumbnailGenerator.ts](../src/utils/pdfThumbnailGenerator.ts)

`react-pdf` + `pdfjs-dist` is heavy (worker + fonts + cmaps). If thumbnails render in file lists/pickers, this can enter common chunks.

**How:**
- Lazy-load `PdfThumbnail` where it's consumed, and dynamically `import()` `pdfjs` inside the thumbnail generator util so it's fetched only when a PDF actually needs a thumbnail.

---

### 8. Route-level split of `Editor3` `Workbook` 🟡

The full `Editor3` `Workbook`/`Editor` is statically imported at several route entries:

- [unit/[id]/UnitEditorClient.jsx](../app/[locale]/unit/[id]/UnitEditorClient.jsx)
- [workbook/[id]/WorkbookClient.tsx](../app/[locale]/workbook/[id]/WorkbookClient.tsx)
- [drill/[id]/page.tsx](../app/[locale]/drill/[id]/page.tsx)
- [review/[id]/PeerReviewClient.jsx](../app/[locale]/review/[id]/PeerReviewClient.jsx)

These are legitimately editor routes, so the editor bundle belongs there. The opportunity is narrower:

**How:**
- Ensure the authoring-only plugins (toolbars, floating link editor, generators, DataGrid editors) are split from the read/interactive path, so learners loading a workbook to *complete* it don't download authoring tooling. `MiniEditorReadOnly` / `NarrativeReader` already hint at a lighter read path — verify those routes don't transitively pull the full authoring plugin set.
- Confirm `WorkbookSSRSkeleton` continues to paint immediately while the client editor chunk streams.

**Risk:** Medium — editor plugin graph is interconnected; do this after the analyzer confirms the shared-chunk boundary.

---

### 9. `framer-motion` 🟡

Used in Gamification (`BadgeIcon.tsx` and others). `framer-motion` is moderately heavy. If it lands in a shared chunk it affects non-gamification pages.

**How:**
- Prefer granular imports and, where animations are non-critical/below-the-fold, lazy-load the animated component. Consider `LazyMotion` + `domAnimation` feature bundle to ship a smaller motion runtime.

---

## Non-splitting load-time wins

- **Server-render more read-only content.** Continue the SSR_PERFORMANCE direction — grade/review/workbook read views via RSC + `@lexical/headless` reduce client hydration cost. Any list/detail page that's currently client-fetch-then-render is a candidate.
- **Trim `transpilePackages`.** `@mui/x-data-grid` is transpiled globally; once it's lazy-loaded (step 4), confirm whether it still needs to be in `transpilePackages` — keeping packages there can defeat tree-shaking.
- **Font loading.** Multiple local font families are shipped (`Inter`, `DM_Sans`, `Cormorant`, `Noto_Sans_JP`). Audit `font-display: swap`, subset to used weights/ranges, and preload only above-the-fold families.
- **Service worker precache scope.** Serwist is enabled; verify the precache manifest isn't eagerly caching large rarely-used chunks (PDF worker, transformers assets) on first visit.
- **`@huggingface/transformers` stays server-only.** Confirmed: it's imported only in Lambda handlers and `app/actions/embeddings.ts` (server actions), plus the Turbopack alias stub for `onnxruntime-node`. Keep it that way — it must never enter a client chunk.
- **Avoid `@mlc-ai/web-llm` on initial load.** It's a very large WASM/model runtime; ensure any usage is behind an explicit user action and dynamically imported.

---

## Suggested Sequencing

1. **Measure** — add analyzer, capture baseline (step 1).
2. **Global wins** — DiceBear lazy styles (2), ChatSidebar lazy (3). Re-measure.
3. **Config** — `optimizePackageImports` (6). Re-measure.
4. **Feature-scoped** — DataGrid (4), SkillTree/Scheduler (5), PDF thumbnails (7).
5. **Deeper** — Editor authoring/read split (8), framer-motion (9).
6. **Server + assets** — SSR expansion, fonts, SW precache audit.

Re-run the analyzer and a Lighthouse/`web-vitals` capture (the app already depends on `web-vitals`) after each phase to confirm reductions in initial JS, LCP, and TBT.

---

## Approval Notes

- `next.config.mjs` and `package.json` changes (analyzer, `optimizePackageImports`, scripts) require maintainer approval per repo policy.
- Component-level `next/dynamic` / `React.lazy` changes in `src/components` are production code — confirm before implementing.
- Each change should ship with the relevant Storybook story still passing (mocked heavy deps) and no hydration warnings from `ssr: false` boundaries.
