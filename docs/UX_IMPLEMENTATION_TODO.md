# UX Implementation Todo

## Current status

All implementation items in the UX audit are complete. The remaining quality caveats are environment-level: the crawl cannot authenticate because the configured Cognito app client no longer exists, and the full Storybook browser run can stall after hundreds of stories.

## Final validation

- TypeScript projects: src, gamification, pages, and app passed individually.
- Unit tests: 2,212 passed, 20 skipped.
- Storybook build: completed successfully.
- Next.js build: completed successfully, with existing Serwist/Turbopack and macOS native-library warnings.
- Crawl: command completed with zero reported page errors, but all roles were skipped because the configured Cognito app client no longer exists.
- Full Storybook browser run: optimizer reloads were fixed and focused quick-tour stories pass 6/6; the full suite can stall during the long Recording Studio story set before producing a final summary.

## Todo list

1. [x] Remove theme-dependent chat contrast risk.
   - Implemented in [src/components/ChatSidebar/LexicalMessageRenderer.module.css](../src/components/ChatSidebar/LexicalMessageRenderer.module.css)
   - Replaced the blanket white `!important` override with theme-aware tokens and explicit nested text-state rules.

2. [x] Make timed workbook entry responsive and duplicate-safe.
   - Implemented in [app/[locale]/workbook/[id]/WorkbookClient.tsx](../app/[locale]/workbook/[id]/WorkbookClient.tsx)
   - Includes responsive widths, bounded panels, and a disabled pending state while `createGrade()` is running.

3. [x] Standardize settings forms and error feedback.
   - Implemented in [app/[locale]/settings/page.jsx](../app/[locale]/settings/page.jsx)
   - Uses inline error states, validation helpers, and success feedback without browser alerts.

4. [x] Distinguish empty, loading, and failed content states.
   - Implemented in [app/[locale]/units/UnitsClient.jsx](../app/[locale]/units/UnitsClient.jsx)
   - Covers lazy unit tabs with loading, empty, error, and retry UI.

5. [x] Improve practice drill recovery and completion flow.
   - Implemented in [app/[locale]/drill/[id]/page.tsx](../app/[locale]/drill/[id]/page.tsx) and [src/components/PracticeDrill/usePracticeDrill.ts](../src/components/PracticeDrill/usePracticeDrill.ts)
   - Includes retries, resume logic, and completion summary actions.

6. [x] Attach discussion/help to the work in front of the learner.
   - Implemented in [src/components/Dashboard/AssignmentCard.tsx](../src/components/Dashboard/AssignmentCard.tsx) and [src/components/Dashboard/SectionPanel.tsx](../src/components/Dashboard/SectionPanel.tsx)
   - The dashboard surfaces now include scoped discussion actions.

7. [x] Make offline capability legible and actionable.
   - Implemented in [src/components/OfflineBanner.tsx](../src/components/OfflineBanner.tsx) and [src/components/SyncStatusIndicator.tsx](../src/components/SyncStatusIndicator.tsx)
   - Provides offline banners, pending sync actions, and retry flows.

8. [x] Improve first-run orientation and return intent.
   - Implemented in [src/components/FirstRunChecklist.tsx](../src/components/FirstRunChecklist.tsx)
   - Adds a role-aware, dismissible first-run checklist.

9. [x] Add destructive-action recovery and sync recency feedback.
   - Recording take deletion now requires confirmation.
   - Sync status displays the last successful sync time.

10. [x] Stabilize Storybook browser dependency loading and section-route stories.
   - Pre-bundles discovered Storybook dependencies.
   - Fixes missing section-route imports and invalid nested button markup.

## Related files

- [app/[locale]/workbook/[id]/WorkbookClient.tsx](../app/[locale]/workbook/[id]/WorkbookClient.tsx)
- [app/[locale]/settings/page.jsx](../app/[locale]/settings/page.jsx)
- [app/[locale]/units/UnitsClient.jsx](../app/[locale]/units/UnitsClient.jsx)
- [app/[locale]/drill/[id]/page.tsx](../app/[locale]/drill/[id]/page.tsx)
- [src/components/ChatSidebar/LexicalMessageRenderer.module.css](../src/components/ChatSidebar/LexicalMessageRenderer.module.css)
- [src/components/Dashboard/AssignmentCard.tsx](../src/components/Dashboard/AssignmentCard.tsx)
- [src/components/Dashboard/SectionPanel.tsx](../src/components/Dashboard/SectionPanel.tsx)
- [src/components/OfflineBanner.tsx](../src/components/OfflineBanner.tsx)
- [src/components/SyncStatusIndicator.tsx](../src/components/SyncStatusIndicator.tsx)
- [src/components/FirstRunChecklist.tsx](../src/components/FirstRunChecklist.tsx)
