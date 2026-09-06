# Release Strategy & Fast-Path Testing Plan

> Goal: ship to production as quickly as possible while keeping defect risk low for the critical user paths.  
> Last updated: 2026-07-19

---

## Guiding Principle — Ship at the Confidence Boundary

Don't aim for 100% test coverage before shipping. Aim to pass the **minimum credible gate** for each risk tier. Skip tests that exercise unchanged, low-risk code. Escalate only when a critical path breaks.

---

## Risk Tiers

| Tier | Definition | Gate required before ship |
|------|-----------|---------------------------|
| **P0 — Auth & data integrity** | Cognito sign-in/out, owner-auth writes, `_version` optimistic locking | All P0 checks must pass |
| **P1 — Core learning loop** | Workbook execute → Grade submit → Grade visible in instructor view | All P1 checks must pass |
| **P2 — AI features** | Streaming chat, AI grading, document analysis | Smoke test + error boundary confirmed |
| **P3 — Supporting features** | Gamification, leaderboard, vocabulary drills, offline sync | Can ship with known issues if non-blocking |

---

## Fast-Path Release Checklist

Work top-to-bottom. Each step has a **local** command you can run before pushing.

### 1. TypeScript — 5 min

```bash
npm run typecheck
```

- Catches schema drift, missing props, broken imports
- **Must pass** — Amplify Hosting build fails on TS errors anyway

---

### 2. Unit Tests — 5–10 min

```bash
npm run test:unit
```

Covers: AI grading security, XP calculation, offline data store, conflict resolution, notification helpers, file upload utils, zip/office extraction, chunked cookie storage.

**Focus areas to review first if failures appear:**
- `test/unit/custom-ai-grading.test.ts` — AI grading correctness (P0)
- `test/unit/custom-ai-security.test.ts` — prompt injection guards (P0)
- `test/unit/conflictResolution.test.ts` — optimistic concurrency (P0)
- `test/unit/saveGradeOffline.test.ts` — offline grade persistence (P1)

Skip if unchanged: `giftParser`, `getResponsiveImageUrls`, `documentThumbnailHandler`.

---

### 3. Storybook Component Tests — 10 min

```bash
npm run storybook:run
```

Catches: prop contract regressions, mock data shape mismatches, render crashes in isolation.

**Minimum bar**: zero thrown errors. New visual warnings are acceptable if flagged; don't block the release.

Storybook validation also runs in CI via `.github/workflows/storybook-validation.yml` — check that workflow passes before merging to `main`.

---

### 4. Playwright E2E — Critical Paths Only — 15 min

Run the smallest slice that covers P0 + P1:

```bash
# Auth (P0)
npx playwright test test/e2e/auth.spec.ts --project=chromium

# Core learning loop (P1)
npx playwright test test/e2e/workbook.spec.ts test/e2e/sections.spec.ts --project=chromium
```

**Skip on fast release:**
- `chat.spec.ts` — AI feature; recovers gracefully if broken
- `dictionary.spec.ts` — P3 supporting feature
- `settings.spec.ts` — P3 personalization

---

### 5. Journey Smoke Tests — 15 min (optional but recommended)

If you have a staging environment with `.env.test` configured:

```bash
# P0 + P1 journeys only
npx playwright test \
  test/e2e/journeys/journey-01-learner-homework.spec.ts \
  test/e2e/journeys/journey-03-instructor-create-unit.spec.ts \
  test/e2e/journeys/journey-04-instructor-grading.spec.ts \
  --config=test/e2e/journeys/playwright.config.ts --reporter=line
```

Skip on a hotfix with no schema or auth changes:
- `journey-02-learner-gamification.spec.ts` (P3)
- `journey-11-offline-sync.spec.ts` (P3, flaky on CI)

---

### 6. Build Verification — 5 min

```bash
npm run build
```

Must produce zero errors. Build warnings about image optimisation or metadata are acceptable.

---

## CI Gates (Automated on Push to `main`)

| Workflow | Runs automatically | Blocks merge? |
|----------|--------------------|---------------|
| `storybook-validation.yml` | Yes | Yes — typecheck + mock validation |
| `chromatic.yml` | Yes (visual diff) | Review required; auto-accept on first run |
| Amplify Hosting build | Yes | Yes — full Next.js build + Amplify deploy |

There is currently **no CI workflow for unit tests or Playwright E2E**. Add one (see below) before treating `main` as protected.

---

## Adding a Minimal CI Unit + E2E Workflow (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npm run test:unit

  e2e-smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test test/e2e/auth.spec.ts test/e2e/workbook.spec.ts --project=chromium
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

---

## Schema / Amplify Backend Changes

Schema changes require extra care — they can break existing data and subscriptions.

**Before shipping any schema change:**

1. Run `npx ampx sandbox` and verify the sandbox deploys cleanly
2. Run `npm run test:unit` — focus on subscription and grading tests
3. Run `journey-01` and `journey-04` (learner homework + instructor grading) end-to-end
4. After prod deploy, watch CloudWatch Lambda error rates for 15 min
5. Keep the previous sandbox branch active for 24 h as a rollback point

---

## AI Feature Changes

AI features fail gracefully (error boundaries, fallback UI). They should not block a release unless:

- `/api/chat` returns 5xx on > 5% of requests (check CloudWatch)
- `grade-ai` schema validation is failing (check Lambda logs)
- Streaming stops mid-response consistently (Vercel AI SDK version mismatch)

Use `npm run test:unit -- test/unit/custom-ai-grading.test.ts test/unit/custom-ai-security.test.ts` as the minimum AI smoke gate.

---

## Release Sequence (TL;DR — Fastest Possible)

```
typecheck → test:unit → build → push to main → CI storybook passes → Amplify deploys
```

Total wall-clock time if all pass on first run: **~25 min**.

Add Playwright E2E smoke (`auth` + `workbook`) if any of these changed:
- `proxy.ts`
- `src/context/authContext.jsx`
- `app/[locale]/workbook/`
- `amplify/data/resource.ts`

---

## Rollback Plan

Amplify Hosting keeps the previous build artifact.

1. Go to AWS Amplify Console → App → `main` branch
2. Select the previous successful deployment
3. Click **Redeploy this version**

RTO: ~3 min.

For schema-only rollbacks, use the previous `amplify_outputs.json` commit and redeploy. Note: DynamoDB records written under the new schema may need manual migration if a field type changed.

---

## What to Skip for Speed (and When to Skip It)

| Test / check | Skip when… |
|---|---|
| `journeys:offline` | No changes to offline store, sync queue, or IndexedDB code |
| Chromatic review | No UI component changes (approve all without review) |
| `test:performance` | No changes to concurrent data operations or Yjs collaboration |
| Playwright browser tests | Always |
| `test:integration` | No changes to Lambda functions or AppSync resolvers |
| `storybook:validate-components` | CI step already has `|| true`; only block on explicit mock failures |
