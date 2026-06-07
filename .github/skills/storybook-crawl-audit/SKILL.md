---
name: storybook-crawl-audit
description: 'Crawls all Storybook stories via Playwright, checking console errors, Web Vitals, network issues, interaction tests, translation plugin functionality, persona onboarding widget, and route-map navigation. Use when validating Storybook health, after adding stories, before releases, or debugging rendering/plugin issues. Requires Storybook server running.'
---

# Storybook Crawl Audit

Full Storybook health check that discovers all stories from the sidebar, visits each in batches, validates rendering, plugins, interactions, and navigation integrity.

## When to Use

- After adding or modifying stories/components
- Before releasing or deploying
- When debugging Storybook rendering or plugin issues
- After upgrading Storybook or addon versions
- Periodic health checks for Storybook quality
- When asked to "crawl storybook", "validate all stories", or "check storybook health"

## Prerequisites

1. **Storybook running with logs**: `npm run storybook:with-logs` (port 6006, logs to `test/logs/storybook.log`)
2. **Playwright installed**: `npx playwright install chromium` (if not already)
3. **No other process on port 6006**

## Execution Phases

### Phase 1: Pre-flight Checks (1 minute)

Verify environment readiness:

```bash
# Confirm Storybook is responding
curl -s http://localhost:6006 | head -5

# Confirm test output directory exists
mkdir -p test/results/storybook-crawl
mkdir -p test/results/storybook-crawl/screenshots
```

If Storybook is not running, start it:

```bash
npm run storybook:with-logs &
# Wait for it to be ready (watch for "Storybook X.X started" in output)
npx wait-on http://localhost:6006 --timeout 60000
```

### Phase 2: Story Discovery (2-3 minutes)

Discover all story URLs from the Storybook sidebar using Playwright:

1. Navigate to `http://localhost:6006`
2. Wait for the sidebar to fully render
3. Extract all story links from the sidebar navigation
4. Group stories into batches of 5-10 for parallel visiting

**Discovery approach** — use the Storybook Manager API:

```javascript
// In browser context via Playwright evaluate:
const stories = __STORYBOOK_PREVIEW__.storyStoreV7
  ? await fetch('/index.json').then(r => r.json())
  : window.__STORYBOOK_CLIENT_API__?.raw?.();

// Or parse sidebar DOM:
const links = document.querySelectorAll('[data-nodetype="story"] a, [data-nodetype="document"] a');
const urls = Array.from(links).map(a => a.getAttribute('href'));
```

Alternatively, fetch the story index directly:

```bash
curl -s http://localhost:6006/index.json | jq '.entries | keys | length'
```

**Output**: Array of story IDs and their iframe URLs (`/iframe.html?id=<storyId>`)

### Phase 3: Batch Crawl & Console Audit (5-15 minutes)

Visit each story in batches of 5-10 (configurable). For each story:

#### 3a. Console Error Detection

Collect all browser console messages:

```javascript
page.on('console', msg => {
  if (msg.type() === 'error') errors.push({ storyId, text: msg.text(), url: msg.location()?.url });
  if (msg.type() === 'warning') warnings.push({ storyId, text: msg.text() });
});

page.on('pageerror', error => {
  criticalErrors.push({ storyId, message: error.message, stack: error.stack });
});
```

**Fail criteria**: Any `console.error` or uncaught exception that is NOT in the known-safe allowlist.

**Known-safe patterns to skip**:
- `Download the React DevTools`
- `Warning: ReactDOM.render is no longer supported`
- Storybook internal HMR messages
- `[webpack-dev-server]` messages

#### 3b. Render Error Detection

Check for error boundaries or error messages rendered in place of components:

```javascript
// Check for React error boundaries
const errorBoundary = await page.$('[class*="error"], [class*="Error"], [data-testid="error"]');

// Check for Storybook's built-in error display
const storybookError = await page.$('.sb-errordisplay, .sb-nopreview, #error-message');

// Check for common error text patterns
const bodyText = await page.textContent('body');
const hasRenderError = /Something went wrong|Error:|Cannot read prop|undefined is not/i.test(bodyText);
```

#### 3c. Web Vitals Measurement

Inject Performance Observer to capture Core Web Vitals:

```javascript
const vitals = await page.evaluate(() => {
  return new Promise(resolve => {
    const results = {};
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') results.LCP = entry.startTime;
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
          results.CLS = (results.CLS || 0) + entry.value;
        }
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observer.observe({ type: 'layout-shift', buffered: true });

    // FID approximation via first-input
    const fidObserver = new PerformanceObserver(list => {
      results.FID = list.getEntries()[0]?.processingStart - list.getEntries()[0]?.startTime;
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    setTimeout(() => resolve(results), 3000);
  });
});
```

**Thresholds** (per story):
- LCP: warn > 2500ms, fail > 4000ms
- CLS: warn > 0.1, fail > 0.25
- FID: warn > 100ms, fail > 300ms

#### 3d. Network Traffic Analysis

Monitor network requests for failures:

```javascript
page.on('requestfailed', request => {
  networkErrors.push({
    storyId,
    url: request.url(),
    failure: request.failure()?.errorText,
  });
});

page.on('response', response => {
  if (response.status() >= 400) {
    httpErrors.push({
      storyId,
      url: response.url(),
      status: response.status(),
    });
  }
});
```

**Skip patterns**: Chromatic-related requests, analytics pings, favicon.ico 404s.

### Phase 4: Interaction Tests (3-5 minutes)

Run the Storybook Vitest interaction tests:

```bash
npm run storybook:run
```

This executes all `play()` functions defined in stories via `@storybook/addon-vitest`.

**Alternative** (if test-runner is preferred):

```bash
npx test-storybook --url http://localhost:6006
```

**Output**: Pass/fail for each story with a `play()` function.

### Phase 5: Translation Plugin Validation (3-5 minutes)

Verify the custom translation addon works correctly.

**Architecture**: The translation addon uses:
- `TranslationModeContext` + `TranslationCaptureContext` (React contexts in preview iframe)
- Storybook channel events (`updateGlobals`, `translation-mode/update-all`, `translation-mode/save`)
- `TranslationOverlay` component wrapping each translated string (renders hover/edit UI)
- `TranslationPanel` (MUI Drawer, opens on click in edit mode)
- `TranslationPanelWrapper` (addon panel tab, receives data via channel)

#### 5a. Plugin Renders in Panel

```javascript
// The addon is registered with title 'Translations' in manager.tsx
await page.goto('http://localhost:6006/?path=/story/translationmode--default');
const panelTab = page.locator('button[role="tab"]').filter({ hasText: 'Translations' }).first();
expect(await panelTab.isVisible()).toBe(true);
await panelTab.click();
```

#### 5b. Hover Mode (Translation Overlay)

```javascript
// Change translationMode global via Storybook channel
await page.evaluate(() => {
  const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
  channel.emit('updateGlobals', { globals: { translationMode: 'hover' } });
});

// TranslationOverlay wraps translated text with hover handlers
// In hover mode, hovering shows a tooltip with the translation key
const iframe = page.frameLocator('#storybook-preview-iframe');
// Look for overlay-wrapped elements (divs with cursor styles or data attributes)
const overlayElements = await iframe.locator('div[style*="cursor"], [data-translation-key]').count();
```

#### 5c. Edit Mode (Translation Panel Drawer)

```javascript
// Switch to edit mode
await page.evaluate(() => {
  const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
  channel.emit('updateGlobals', { globals: { translationMode: 'edit' } });
});

// In edit mode, clicking a TranslationOverlay opens the TranslationPanel (MUI Drawer)
const iframe = page.frameLocator('#storybook-preview-iframe');
await iframe.locator('div').first().click(); // Trigger overlay click
// Check for MUI Drawer with TextField inputs
const drawer = await iframe.locator('.MuiDrawer-root').count();
```

#### 5d. Translation Metadata in Panel

```javascript
// Click the Translations addon panel tab
await page.locator('button[role="tab"]').filter({ hasText: 'Translations' }).click();
// TranslationPanelWrapper receives data via channel event 'translation-mode/update-all'
// which carries Map entries of captured translations with keys, namespaces, metadata
const panelContent = await page.locator('div[role="tabpanel"]').last().textContent();
expect(panelContent).toMatch(/key|namespace|translation/i);
```

#### 5e. Language Switching

```javascript
// Change translationLanguage global — decorator passes to TranslationModeController
// which calls setDisplayLanguage(), triggering TranslationOverlay to load new translations
await page.evaluate(() => {
  const channel = window.__STORYBOOK_ADDONS_CHANNEL__;
  channel.emit('updateGlobals', { globals: { translationLanguage: 'es' } });
});
// Supported languages: 'ja', 'es', 'fr', 'zh', 'de' (NON_EN_LANGUAGES in TranslationOverlay)
```

### Phase 6: Persona Onboarding Widget Validation (3-5 minutes)

Verify the custom onboarding persona system works correctly.

**Architecture**: The onboarding system uses:
- `OnboardingEventEmitter` singleton (module-scoped via `getOnboardingEmitter()`, NOT on `window`)
- localStorage key `storybook_onboarding_progress` for cross-frame persistence and sync
- `StorageEvent` listener for cross-frame communication (preview → manager)
- `SimpleSummaryWidget` injected into sidebar via `createRoot` (shows persona selection, progress, next tasks)
- `OnboardingPanel` registered as addon panel with title "Onboarding" (shows full task list, tutorial/quiz modes)
- Three personas: `instructor`, `learner`, `translator`

#### 6a. Widget Renders in Sidebar

```javascript
// The widget is injected before the sidebar tree by the manager addon
// It shows "Onboarding" header and "Select your role" with persona buttons
const sidebarText = await page.locator('#storybook-explorer-menu, nav').first().textContent();
expect(sidebarText).toContain('Onboarding');
// Should show persona selection: Instructor, Learner, Translator buttons
```

#### 6b. Different Personas Render Correctly

Interact via localStorage (the cross-frame sync mechanism):

```javascript
for (const persona of ['instructor', 'learner', 'translator']) {
  // Set persona via localStorage (matches emitter's persistToLocalStorage format)
  await page.evaluate((p) => {
    const data = {
      completedTasks: [],
      currentPersona: p,
      currentMode: 'tutorial',
      timestamp: Date.now(),
    };
    localStorage.setItem('storybook_onboarding_progress', JSON.stringify(data));
    // Dispatch storage event to trigger the emitter's listener
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'storybook_onboarding_progress',
      newValue: JSON.stringify(data),
    }));
  }, persona);

  // Widget should update to show persona-specific tasks and progress
  const bodyText = await page.textContent('body');
  expect(bodyText).toContain(persona.charAt(0).toUpperCase() + persona.slice(1));
}
```

#### 6c. Task Completion Tracking

```javascript
// Simulate a task completion via localStorage (how preview iframe communicates)
const completedEvent = {
  type: 'task-completed',
  taskId: 'instructor-setup-class',
  persona: 'instructor',
  timestamp: Date.now(),
};
const data = {
  completedTasks: [['instructor:instructor-setup-class', completedEvent]],
  currentPersona: 'instructor',
  currentMode: 'tutorial',
  timestamp: Date.now(),
};
localStorage.setItem('storybook_onboarding_progress', JSON.stringify(data));
// Emit storage event for cross-frame sync
window.dispatchEvent(new StorageEvent('storage', { ... }));

// Verify completion persisted
const stored = JSON.parse(localStorage.getItem('storybook_onboarding_progress'));
expect(stored.completedTasks.length).toBeGreaterThan(0);
```

#### 6d. Persona Widget Links Navigate Correctly

```javascript
// Open the Onboarding addon panel (registered with title 'Onboarding')
await page.locator('button[role="tab"]').filter({ hasText: 'Onboarding' }).click();

// Task cards have links to stories based on completionCriteria.tutorialStoryId
// These use story IDs like '📄-pages-application-pages--sections'
const links = await page.locator('a[href*="path="], [data-story-id]').all();
for (const link of links) {
  const href = await link.getAttribute('href');
  expect(href).toMatch(/\?path=\/story\//);
}
```

### Phase 7: Pages Section Route Validation (2-3 minutes)

Verify that links in the "Pages" section of Storybook navigate to other valid Storybook stories. The app uses mocked `next/navigation` and `next/router` (in `.storybook/__mocks__/`) which intercept `router.push()` and `<Link>` clicks, mapping them via `convertRouteToStory()` from `.storybook/code/route-map.ts`.

```javascript
// Visit each page story and collect rendered <a href> links
const pageStories = [
  '📄-pages-application-pages--index',
  '📄-pages-application-pages--units',
  '📄-pages-application-pages--sections',
  '📄-pages-application-pages--profile',
  '📄-pages-application-pages--settings',
];

for (const storyId of pageStories) {
  await page.goto(`http://localhost:6006/iframe.html?id=${storyId}&viewMode=story`);

  // Find internal links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.getAttribute('href'))
      .filter(href => href?.startsWith('/') && !href.startsWith('/iframe'));
  });

  // Validate against ROUTE_TO_STORY_MAP keys
  for (const link of links) {
    const normalized = link.replace(/^\/[a-z]{2}\//, '/').split('?')[0];
    // Should match a known route or a dynamic route pattern
    const isKnown = ROUTE_TO_STORY_MAP[normalized] ||
                    KNOWN_ROUTE_BASES.some(base => normalized.startsWith(base + '/'));
    if (!isKnown && !isDynamicRoute(normalized)) {
      unmappedRoutes.push(`[${storyId}] ${normalized}`);
    }
  }
}
```

**Known routes** from `ROUTE_TO_STORY_MAP`:
- `/` → index
- `/units` → units list
- `/sections` → sections list
- `/profile`, `/profile/[username]` → profile
- `/settings` → settings
- `/unit/[id]` → unit detail
- `/section/[id]` → section detail
- `/workbook/[id]` → workbook
- `/review/[id]` → peer review

### Phase 8: Storybook Server Log Analysis (1-2 minutes)

Check `test/logs/storybook.log` for build/runtime issues:

```bash
# Check for build errors
grep -i "error\|ERR!\|failed\|Cannot\|Module not found" test/logs/storybook.log | grep -v "node_modules" | tail -30

# Check for deprecation warnings that may break in future versions
grep -i "deprecat" test/logs/storybook.log | sort -u | tail -10

# Check for addon loading failures
grep -i "addon.*fail\|addon.*error\|preset.*error" test/logs/storybook.log | tail -10
```

### Phase 9: Summary Report (1 minute)

Produce a structured summary:

```
═══════════════════════════════════════════════════════════
  STORYBOOK CRAWL AUDIT RESULTS — {date}
═══════════════════════════════════════════════════════════

DISCOVERY:
  Total Stories: {N}
  Batches (size 10): {N}

CONSOLE ERRORS:
  Critical (pageerror): {N}
  Errors (console.error): {N}
  Warnings: {N}
  Stories with errors: [list]

RENDER ERRORS:
  Error boundaries triggered: {N}
  Missing component renders: {N}

WEB VITALS:
  LCP warnings (>2.5s): {N} stories
  CLS warnings (>0.1): {N} stories
  Overall: {PASS | NEEDS ATTENTION}

NETWORK:
  Failed requests: {N}
  HTTP 4xx/5xx: {N}

INTERACTION TESTS:
  Passed: {N}/{total}
  Failed: [list with story IDs]

TRANSLATION PLUGIN:
  Panel renders: {PASS | FAIL}
  Hover mode: {PASS | FAIL}
  Edit mode: {PASS | FAIL}
  Metadata loads: {PASS | FAIL}
  Language switch: {PASS | FAIL}

PERSONA ONBOARDING:
  Widget renders: {PASS | FAIL}
  Instructor tasks: {PASS | FAIL}
  Learner tasks: {PASS | FAIL}
  Translator tasks: {PASS | FAIL}
  Completion tracking: {PASS | FAIL}
  Navigation links: {PASS | FAIL}

PAGES NAVIGATION:
  Internal links found: {N}
  Mapped to stories: {N}
  Unmapped routes: {N} [list]

SERVER LOGS:
  Build errors: {N}
  Addon failures: {N}

VERDICT: {PASS | ISSUES FOUND | CRITICAL FAILURES}
═══════════════════════════════════════════════════════════
```

**Output files**:
- `test/results/storybook-crawl/report.json` — machine-readable full results
- `test/results/storybook-crawl/summary.txt` — human-readable summary
- `test/results/storybook-crawl/screenshots/` — screenshots of failed stories

## Configuration

Environment variables (set in `.env.test` or inline):

| Variable | Default | Description |
|----------|---------|-------------|
| `STORYBOOK_URL` | `http://localhost:6006` | Storybook base URL |
| `CRAWL_BATCH_SIZE` | `10` | Stories per batch |
| `CRAWL_SETTLE_MS` | `2000` | Wait time per story for rendering |
| `CRAWL_SCREENSHOT_ON_ERROR` | `true` | Screenshot failing stories |
| `CRAWL_SKIP_INTERACTIONS` | `false` | Skip Phase 4 interaction tests |
| `CRAWL_SKIP_PLUGINS` | `false` | Skip Phase 5-6 plugin validation |

## Known-Safe Allowlist

Console messages that should NOT trigger failures:

```javascript
const KNOWN_SAFE_PATTERNS = [
  'Download the React DevTools',
  'Warning: ReactDOM.render is no longer supported',
  '[webpack-dev-server]',
  '[HMR]',
  'Storybook',
  'addon-backgrounds',
  'No matching export',  // Storybook dynamic import race
  'ResizeObserver loop',  // Browser layout race condition
];
```

## Issue Categories & Fix Guidance

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

### Translation Plugin Issues

**Common causes**:
- `globalTypes.js` not exporting correct shape
- `decorator.tsx` not wrapping components properly
- Translation keys missing in locale files

**Fix**: Check `.storybook/addons/translation-mode/` files and `public/locales/`.

### Persona Widget Not Rendering

**Common causes**:
- Onboarding manager registration failed
- `onboarding-events.ts` or `onboarding-tasks.ts` export errors
- CSS conflict hiding the widget (check Lexical `div:empty:last-child` pitfall)

**Fix**: Check `.storybook/code/myOnboarding/manager.tsx` and ensure widget div is not empty.

## Related Scripts & Tests

- `npm run storybook:with-logs` — Start Storybook with log capture
- `npm run storybook:run` — Run Vitest interaction tests
- `npm run storybook:report` — Generate test report JSON
- `npm run storybook:inventory` — Generate story inventory
- `scripts/validate-storybook-routes.js` — Validate route-map coverage
- `test/storybook/onboarding-personas.test.ts` — Persona task integrity tests
- `test/storybook/smoke-test-all-stories.test.tsx` — Smoke render tests
- `test/storybook/validate-mocks.test.ts` — Mock data schema tests

## MCP Tools Used

This skill benefits from:
- **Playwright MCP** (`mcp_playwright2_*`) — For browser automation, screenshots, DOM inspection
- **Chrome DevTools MCP** (`mcp_chrome_devto2_*`) — For console/network/performance deep analysis
