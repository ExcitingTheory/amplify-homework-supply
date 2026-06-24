---
name: storybook-audit
description: "Full Storybook health audit using `npm run storybook:run:with-logs`. Validates all stories for rendering, console errors, network failures, HTTP errors, interaction tests, mock data schemas, prop type alignment, and accessibility. Use when validating Storybook health, after adding stories, before releases, or debugging rendering/plugin issues."
---

# Storybook Audit

Full Storybook health check that uses `npm run storybook:run:with-logs` to visit all stories via Vitest + Playwright browser mode, capturing console errors, network failures, HTTP errors, render issues, and interaction test results. Supplements with mock data schema validation and story inventory generation.

## When to Use

- After adding or modifying stories/components
- Before releasing or deploying
- When debugging Storybook rendering issues
- After upgrading Storybook or addon versions
- Periodic health checks for Storybook quality
- When asked to "audit storybook", "validate all stories", or "check storybook health"

## How It Works

The `npm run storybook:run:with-logs` command runs:

```bash
NODE_OPTIONS='--experimental-import-meta-resolve' npx vitest --project=storybook --run 2>&1 | tee test/logs/storybook-run.log
```

This uses `@storybook/addon-vitest` which:

1. Launches Storybook in CI mode on port 6006
2. Opens each story in Playwright (headless Chromium)
3. Runs all `play()` interaction functions
4. The `vitest-audit-hooks.ts` setup file captures per-story diagnostics:
   - Console errors (filtered against known-safe patterns)
   - HTTP 4xx/5xx responses
   - Network request failures
   - Resource load errors

All output is logged to `test/logs/storybook-run.log`.

## Execution Phases

### Phase 1: Pre-flight Checks (30 seconds)

Verify environment readiness:

```bash
# Ensure no stale process on port 6006
lsof -i :6006 -t | xargs kill 2>/dev/null || true

# Ensure output directories exist
mkdir -p test/logs test/results/storybook-audit
```

### Phase 2: Run Vitest Storybook Tests (5-15 minutes)

Execute the full test suite:

```bash
npm run storybook:run:with-logs
```

This runs ALL stories through the vitest browser test runner. Each story:

- Is rendered in real Chromium via Playwright
- Has console.error patched to collect errors (via `vitest-audit-hooks.ts`)
- Has fetch patched to collect HTTP/network errors
- Runs its `play()` function if one exists (interaction tests)
- Reports pass/fail with diagnostics in the log

**Key files**:

- `.storybook/vitest.setup.ts` — Registers audit hooks + polyfills
- `.storybook/vitest-audit-hooks.ts` — Console/network/HTTP error capture
- `vitest.config.ts` (storybook project) — Browser mode + Playwright config

**Audit hook behavior**:

- `STRICT_MODE = false` by default (warns, doesn't fail on individual errors)
- Fails test if > 20 console errors or > 10 HTTP errors per story
- Known-safe patterns are skipped (DevTools, HMR, ResizeObserver, MUI warnings, etc.)

### Phase 3: Read Full Test Output (1 minute)

**ALWAYS read the complete output** from the test run. Do NOT use `tail`, `head`, or `grep` to partially read the log — this causes issues to go unnoticed and leads to costly re-runs.

The full output is available in two places:

1. **Terminal stdout** — captured directly when running the command
2. **Log file** — `test/logs/storybook-run.log` (written by `tee`)

Read the entire log file:

```bash
cat test/logs/storybook-run.log
```

The `vitest-audit-hooks.ts` prints a clear `STORYBOOK AUDIT SUMMARY` block at the end of the run with:

- Total stories tested / clean / with issues
- Aggregated console errors (deduplicated with counts)
- Network failures and 404s (deduplicated with counts)
- HTTP errors (deduplicated with counts)
- Per-story issue list
- Verdict: PASS / ISSUES FOUND / NEEDS ATTENTION

**Key patterns in the output**:

- `═══` bordered block at the end — the audit summary
- `[audit] Issues in: <testName>` — Per-story diagnostic (inline during run)
- `Tests X passed | Y failed` — Vitest summary line

### Phase 4: Mock Data Schema Validation (2-3 minutes)

Validate mock data structures against Zod schemas:

```bash
npm run storybook:validate-mocks
```

This runs `vitest run test/storybook/validate-mocks.test.ts` which validates:

- `chat-bot-2.0.json`, `chat-bot-2.1.json`, `chat-bot-2.3.json` — Chat message format (parts array)
- Lexical editor state JSON — root.children structure
- File objects — S3 metadata structure
- Grade objects — data JSON with block responses
- Word/Question objects — vocabulary/quiz data

**Schemas location**: `.github/skills/storybook-audit/schemas/`

**Critical validations**:

- ChatSidebar: `message.parts` array format (NOT legacy `content`)
- Editor3: Lexical state with `root.children` structure
- FileManager2: ParsedContent status flow

### Phase 5: Component Prop Type Validation (2-3 minutes)

Verify mock data matches component TypeScript interfaces:

```bash
npm run storybook:validate-components
```

This runs `tsx .github/skills/storybook-audit/scripts/validate-component-mocks.ts` which:

- Extracts TypeScript interfaces (`*Props`) from components
- Loads mock data from `.storybook/__mocks__/ui-data/`
- Validates structure alignment (required fields, types)

### Phase 6: Story Inventory (1-2 minutes)

Generate a catalog of all stories:

```bash
npm run storybook:inventory
```

Output: `docs/STORYBOOK_INVENTORY.md` with:

- All story files and their variants
- Which stories have `play()` functions (interaction tests)
- Category grouping (Components, Pages, etc.)

### Phase 7: Server Log Analysis (30 seconds)

If Storybook was run with `npm run storybook:with-logs`, read the full server log:

```bash
cat test/logs/storybook.log
```

Look for build errors, deprecation warnings, and addon loading failures in the output.

### Phase 8: Summary Report

Produce a structured summary:

```
═══════════════════════════════════════════════════════════
  STORYBOOK AUDIT RESULTS — {date}
═══════════════════════════════════════════════════════════

VITEST RESULTS (from storybook:run:with-logs):
  Total Stories Tested: {N}
  Passed: {N}
  Failed: {N}
  Skipped: {N}

AUDIT DIAGNOSTICS (from vitest-audit-hooks):
  Stories with console errors: {N}
  Stories with HTTP errors: {N}
  Stories with network failures: {N}
  Top errors: [list]

MOCK DATA VALIDATION:
  Schema tests: {passed}/{total}
  Issues: [list if any]

COMPONENT PROP VALIDATION:
  Components checked: {N}
  Mismatches: {N}

STORY INVENTORY:
  Total stories: {N}
  With interaction tests: {N}
  Categories: {list}

SERVER LOGS (if available):
  Build errors: {N}
  Addon failures: {N}

VERDICT: {PASS | ISSUES FOUND | CRITICAL FAILURES}
═══════════════════════════════════════════════════════════
```

## Configuration

### Environment Variables

| Variable             | Default | Description                                        |
| -------------------- | ------- | -------------------------------------------------- |
| `STRICT_MODE`        | `false` | Set in `vitest-audit-hooks.ts` — fail on any error |
| `MAX_CONSOLE_ERRORS` | `20`    | Per-story threshold before forced fail             |
| `MAX_HTTP_ERRORS`    | `10`    | Per-story threshold before forced fail             |

### Known-Safe Patterns

Console messages that do NOT trigger failures (defined in `.storybook/vitest-audit-hooks.ts`):

```javascript
const KNOWN_SAFE_PATTERNS = [
  "Download the React DevTools",
  "Warning: ReactDOM.render is no longer supported",
  "[webpack-dev-server]",
  "[HMR]",
  "Storybook",
  "addon-backgrounds",
  "No matching export",
  "ResizeObserver loop",
  "ExperimentalWarning",
  "punycode",
  "favicon.ico",
  "ERR_CONNECTION_REFUSED",
  "net::ERR_",
  "chrome-extension://",
  "DevTools",
  "MUI:",
  "findDOMNode is deprecated",
  "Each child in a list should have a unique",
  "Warning: validateDOMNesting",
  "act(...)",
  "Consider adding an error boundary",
  "flushSync was called from inside",
];
```

## Common Issues and Fixes

### Console Errors in Stories

**Common causes**:

- Missing mock data or context providers
- Import path errors after file moves
- Props changed but story not updated

**Fix**: Check `.storybook/__mocks__/` data matches component interfaces.

### Render Errors (Error Boundaries)

**Common causes**:

- Null/undefined data passed to components expecting arrays/objects
- Missing required context (UnitContext, SectionContext, etc.)
- Stale story decorators after context API changes

**Fix**: Update story decorators in `.storybook/preview.jsx` or individual story files.

### Failed Interaction Tests

**Common causes**:

- DOM selector changes after component updates
- Timing issues (action before element renders)
- Mock data shape doesn't trigger expected UI paths

**Fix**: Update `play()` function selectors and add appropriate `waitFor` calls.

### Message Format Errors

**Symptom**: `Cannot read property 'text' of undefined` in ChatSidebar

**Root Cause**: Using legacy `message.content` instead of `message.parts`

**Fix**:

```typescript
// ❌ Legacy format
{ id: '1', role: 'user', content: 'Hello' }

// ✅ Correct format
{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
```

### Context Provider Missing

**Symptom**: `useContext() returned undefined`

**Fix**: Story wraps component with all required providers:

```typescript
export const Default = () => (
  <UnitContext.Provider value={mockUnitContext}>
    <SettingsContext.Provider value={mockSettings}>
      <Component />
    </SettingsContext.Provider>
  </UnitContext.Provider>
);
```

## Related npm Scripts

| Script                                  | Purpose                                        |
| --------------------------------------- | ---------------------------------------------- |
| `npm run storybook:run:with-logs`       | Full vitest run with audit hooks, logs to file |
| `npm run storybook:run`                 | Same without log capture                       |
| `npm run storybook:with-logs`           | Start dev server (for manual testing)          |
| `npm run storybook:inventory`           | Generate story inventory doc                   |
| `npm run storybook:validate-mocks`      | Run Zod schema validation                      |
| `npm run storybook:validate-components` | Run prop type validation                       |
| `npm run storybook:test`                | Inventory + mocks + components + typecheck     |
| `npm run storybook:report`              | Generate JSON test report                      |
| `npm run storybook:clear`               | Clear Storybook caches                         |

## Key Files

| File                                      | Role                                         |
| ----------------------------------------- | -------------------------------------------- |
| `.storybook/vitest.setup.ts`              | Registers audit hooks, polyfills             |
| `.storybook/vitest-audit-hooks.ts`        | Console/network/HTTP error capture per story |
| `vitest.config.ts` (storybook project)    | Browser mode config with Playwright          |
| `test/logs/storybook-run.log`             | Full test run output                         |
| `test/logs/storybook.log`                 | Dev server output (if running)               |
| `.storybook/__mocks__/ui-data/`           | Mock data files (source of truth)            |
| `.github/skills/storybook-audit/schemas/` | Zod schemas for mock validation              |

## Success Criteria

- ✅ All stories render without critical errors (vitest passes)
- ✅ Audit hooks report no excessive console/network errors
- ✅ Mock data validates against Zod schemas
- ✅ Component props align with mock data structures
- ✅ Story inventory is up to date

## Quick Run (All Phases)

```bash
# Kill any stale storybook
lsof -i :6006 -t | xargs kill 2>/dev/null || true

# Full audit
npm run storybook:run:with-logs

# Supplemental validation
npm run storybook:validate-mocks
npm run storybook:validate-components
npm run storybook:inventory
```
