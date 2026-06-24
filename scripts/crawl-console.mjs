import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = resolve(__dirname, '../test/results');
const SCREENSHOTS_DIR = resolve(RESULTS_DIR, 'screenshots');

// ── Load Amplify outputs for Cognito config ──────────────────────────────────
const amplifyOutputs = JSON.parse(readFileSync(resolve(__dirname, '../amplify_outputs.json'), 'utf8'));
const COGNITO_REGION = amplifyOutputs.auth.aws_region;
const COGNITO_CLIENT_ID = amplifyOutputs.auth.user_pool_client_id;
const COGNITO_USER_POOL_ID = amplifyOutputs.auth.user_pool_id;

// In-memory key-value storage for Amplify token provider (Node.js has no localStorage)
class InMemoryStorage {
  constructor() { this.store = new Map(); }
  async setItem(key, value) { this.store.set(key, value); }
  async getItem(key) { return this.store.get(key) ?? null; }
  async removeItem(key) { this.store.delete(key); }
  async clear() { this.store.clear(); }
}

// Configure Amplify for server-side auth with in-memory token storage
Amplify.configure(amplifyOutputs, { ssr: true });
cognitoUserPoolsTokenProvider.setKeyValueStorage(new InMemoryStorage());

// ── Configuration from environment (.env.test) ──────────────────────────────
const BASE_URL = process.env.CRAWL_BASE_URL || 'https://localhost:3000';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
const PAGE_SETTLE_MS = parseInt(process.env.CRAWL_PAGE_SETTLE_MS || '2000', 10);
const NETWORKIDLE_TIMEOUT = parseInt(process.env.CRAWL_NETWORKIDLE_TIMEOUT || '10000', 10);

// Users per role
const USERS = [
  {
    role: 'admin',
    email: process.env.CRAWL_ADMIN_USERNAME || 'admin@example.com',
  },
  {
    role: 'instructor',
    email: process.env.CRAWL_INSTRUCTOR_USERNAME || 'instructor1@example.com',
  },
  {
    role: 'learner',
    email: process.env.CRAWL_LEARNER_USERNAME || 'student1@example.com',
  },
];

// ── Route auto-discovery from filesystem ────────────────────────────────────

function discoverRoutes() {
  const appDir = resolve(__dirname, '../app/[locale]');
  const routes = { static: [], dynamic: [] };

  function walk(dir, prefix = '') {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const segment = entry.name;
        walk(join(dir, segment), `${prefix}/${segment}`);
      } else if (entry.name.match(/^page\.(jsx|tsx)$/)) {
        const route = prefix || '/';
        if (route.includes('[')) {
          routes.dynamic.push(route);
        } else {
          routes.static.push(route);
        }
      }
    }
  }

  walk(appDir);
  return routes;
}

// Role-based access rules for discovered routes
const ROLE_ACCESS = {
  '/admin/analytics': ['admin'],
  '/admin/archives': ['admin'],
  '/admin/moderation': ['admin'],
  '/admin/settings': ['admin'],
  '/admin/words': ['admin'],
  '/instructor/grade/[id]': ['admin', 'instructor'],
  '/unit/[id]': ['admin', 'instructor'],
  '/section/[id]': ['admin', 'instructor'],
  '/section/[id]/settings/ai': ['admin', 'instructor'],
  '/section/[id]/settings/gamification': ['admin', 'instructor'],
  '/units': ['admin', 'instructor'],
};

function getRoutesForRole(role) {
  const { static: staticRoutes, dynamic: dynamicRoutes } = discoverRoutes();

  // Filter static routes by role access
  const accessibleStatic = staticRoutes.filter(route => {
    const allowed = ROLE_ACCESS[route];
    if (!allowed) return true; // No restriction = all roles
    return allowed.includes(role);
  });

  // Resolve dynamic routes from seed data
  const resolvedDynamic = resolveDynamicRoutes(role, dynamicRoutes);

  return { static: accessibleStatic, dynamic: resolvedDynamic };
}

function resolveDynamicRoutes(role, dynamicPatterns) {
  const fixturePath = resolve(__dirname, '../test/integration/seed-data.json');
  if (!existsSync(fixturePath)) {
    console.warn('⚠️  No seed-data.json found — skipping dynamic routes. Run seed first.');
    return [];
  }

  const data = JSON.parse(readFileSync(fixturePath, 'utf8'));
  const resolved = [];

  const publishedUnit = data.units?.find(u => u.status === 'PUBLISHED');

  for (const pattern of dynamicPatterns) {
    const allowed = ROLE_ACCESS[pattern];
    if (allowed && !allowed.includes(role)) continue;

    if (pattern === '/workbook/[id]' && publishedUnit) {
      resolved.push(`/workbook/${publishedUnit.id}`);
    } else if (pattern === '/unit/[id]' && publishedUnit && (role === 'admin' || role === 'instructor')) {
      resolved.push(`/unit/${publishedUnit.id}`);
    } else if (pattern === '/section/[id]' && data.sections?.[0] && (role === 'admin' || role === 'instructor')) {
      resolved.push(`/section/${data.sections[0].id}`);
    } else if (pattern === '/section/[id]/settings/ai' && data.sections?.[0] && (role === 'admin' || role === 'instructor')) {
      resolved.push(`/section/${data.sections[0].id}/settings/ai`);
    } else if (pattern === '/section/[id]/settings/gamification' && data.sections?.[0] && (role === 'admin' || role === 'instructor')) {
      resolved.push(`/section/${data.sections[0].id}/settings/gamification`);
    } else if (pattern === '/instructor/grade/[id]' && data.grades?.[0] && (role === 'admin' || role === 'instructor')) {
      resolved.push(`/instructor/grade/${data.grades[0].id}`);
    } else if (pattern === '/squad/[id]' && data.squads?.[0]) {
      resolved.push(`/squad/${data.squads[0].id}`);
    } else if (pattern === '/review/[id]' && data.homeworkRoom) {
      resolved.push(`/review/${data.homeworkRoom.id}`);
    } else if (pattern === '/profile/[username]' && data.users?.student1?.sub) {
      resolved.push(`/profile/${data.users.student1.sub}`);
    }
  }

  return resolved;
}

// ── Subscription storm detection ────────────────────────────────────────────

function analyzeMessages(messages) {
  const analysis = { storms: [], resubscribes: [], extraDispatches: [], rerenders: [], wsIssues: [] };

  // Detect subscription storms: same message repeated rapidly
  const msgCounts = {};
  for (const msg of messages) {
    const key = msg.text.substring(0, 100);
    msgCounts[key] = (msgCounts[key] || 0) + 1;
  }
  for (const [key, count] of Object.entries(msgCounts)) {
    if (count >= 5) {
      analysis.storms.push({ message: key, count });
    }
  }

  // Detect resubscribe patterns — higher threshold to avoid false positives
  // Normal subscription setup emits observeQuery/subscription logs; only flag abnormal churn
  const resubPatterns = messages.filter(m =>
    m.text.includes('fetchFiles already called') ||
    (m.text.includes('observeQuery') && m.text.includes('error')) ||
    m.text.includes('resubscrib') ||
    m.text.includes('DuplicatedOperationError')
  );
  if (resubPatterns.length > 2) {
    analysis.resubscribes = resubPatterns.map(m => m.text.substring(0, 150));
  }

  // Detect excessive dispatches
  const dispatchPatterns = messages.filter(m =>
    m.text.includes('dispatch') ||
    m.text.includes('SUBSCRIPTION_UPDATE') ||
    m.text.includes('SET_LOGS')
  );
  if (dispatchPatterns.length > 10) {
    analysis.extraDispatches = dispatchPatterns.slice(0, 5).map(m => m.text.substring(0, 150));
    analysis.extraDispatches.push(`... and ${dispatchPatterns.length - 5} more`);
  }

  // Detect rerender warnings
  const rerenderPatterns = messages.filter(m =>
    m.text.includes('Maximum update depth') ||
    m.text.includes('too many re-renders') ||
    m.text.includes('Cannot update a component')
  );
  if (rerenderPatterns.length > 0) {
    analysis.rerenders = rerenderPatterns.map(m => m.text.substring(0, 200));
  }

  // Separate WebSocket issues: benign race vs protocol errors
  const wsMessages = messages.filter(m =>
    m.text.includes('WebSocket') || m.text.includes('wss://')
  );
  for (const ws of wsMessages) {
    if (ws.text.includes('closed before the connection is established')) {
      analysis.wsIssues.push({ type: 'race', text: ws.text.substring(0, 150) });
    } else if (ws.text.includes('Unexpected end of array') || ws.text.includes('protocol')) {
      analysis.wsIssues.push({ type: 'protocol-error', text: ws.text.substring(0, 150) });
    } else {
      analysis.wsIssues.push({ type: 'other', text: ws.text.substring(0, 150) });
    }
  }

  return analysis;
}

// ── Cognito programmatic authentication ─────────────────────────────────────

async function authenticateWithCognito(email, password) {
  // Use Amplify's signIn (handles SRP auth flow)
  // Must sign out first to avoid "already signed in" conflicts
  try {
    await signOut();
  } catch (_) { /* ignore if not signed in */ }

  const result = await signIn({ username: email, password });
  if (!result.isSignedIn) {
    throw new Error(`signIn not complete: step=${result.nextStep?.signInStep}`);
  }

  // Fetch the session tokens
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  const accessToken = session.tokens?.accessToken?.toString();

  if (!idToken || !accessToken) {
    throw new Error('No tokens in session after signIn');
  }

  return { idToken, accessToken };
}

function buildAmplifyStorageTokens(email, tokens) {
  // Amplify v6 stores tokens in localStorage with this key pattern
  const keyPrefix = `CognitoIdentityServiceProvider.${COGNITO_CLIENT_ID}`;
  // Parse the sub from the ID token
  const idTokenPayload = JSON.parse(Buffer.from(tokens.idToken.split('.')[1], 'base64').toString());
  const username = idTokenPayload.sub;

  return {
    [`${keyPrefix}.${username}.idToken`]: tokens.idToken,
    [`${keyPrefix}.${username}.accessToken`]: tokens.accessToken,
    [`${keyPrefix}.${username}.clockDrift`]: '0',
    [`${keyPrefix}.LastAuthUser`]: username,
  };
}

/**
 * Pre-authenticate all users sequentially (Amplify signIn is stateful).
 * Returns a map of role -> storageItems for localStorage injection.
 */
async function preAuthenticateAll(users, password) {
  const tokenMap = {};
  for (const { role, email } of users) {
    console.log(`[pre-auth] Authenticating ${role} (${email})...`);
    try {
      const tokens = await authenticateWithCognito(email, password);
      tokenMap[role] = buildAmplifyStorageTokens(email, tokens);
      console.log(`[pre-auth] ${role} authenticated.`);
    } catch (e) {
      console.error(`[pre-auth] ${role} FAILED: ${e.message}`);
      tokenMap[role] = null;
    }
  }
  return tokenMap;
}

// ── Main crawl logic ────────────────────────────────────────────────────────

async function crawlAsUser(browser, user, storageItems) {
  const { role, email } = user;
  const { static: staticPages, dynamic: dynamicPages } = getRoutesForRole(role);
  const pages = [...staticPages, ...dynamicPages];

  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ROLE: ${role.toUpperCase()} (${email})`);
  console.log(`  Pages: ${pages.length} (${staticPages.length} static + ${dynamicPages.length} dynamic)`);
  console.log(`${'='.repeat(70)}\n`);

  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // Enable CDP for memory metrics
  const cdpSession = await context.newCDPSession(page);
  await cdpSession.send('Performance.enable');
  await cdpSession.send('HeapProfiler.enable');

  const pageResults = {};
  let currentPageMessages = [];
  let currentNetworkRequests = [];

  // Collect ALL console messages (not just errors) for storm detection
  page.on('console', (msg) => {
    const type = msg.type();
    currentPageMessages.push({ type, text: msg.text() });
  });
  page.on('pageerror', (err) => {
    currentPageMessages.push({ type: 'pageerror', text: err.message });
  });

  // Network request tracking
  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      currentNetworkRequests.push({ url: url.substring(0, 200), status, type: 'failed' });
    }
  });

  page.on('requestfailed', (request) => {
    const failure = request.failure();
    currentNetworkRequests.push({
      url: request.url().substring(0, 200),
      status: 0,
      type: 'aborted',
      reason: failure?.errorText || 'unknown',
    });
  });

  // Login via pre-collected token injection into localStorage + cookies
  console.log(`[${role}] Logging in as ${email}...`);
  try {
    if (!storageItems) {
      throw new Error('Pre-authentication failed for this role');
    }

    // Navigate to page first to establish origin for localStorage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Inject tokens into localStorage
    await page.evaluate((items) => {
      for (const [key, value] of Object.entries(items)) {
        localStorage.setItem(key, value);
      }
    }, storageItems);

    // Also inject tokens as cookies for server-side Route Handler auth.
    // Amplify's server adapter reads the same key names from cookies.
    // Large values (JWTs) are chunked at 3500 chars per cookie.
    // We use the client-side Amplify cookie format (same as cookieStorage adapter).
    const baseUrl = new URL(BASE_URL);
    const cookieDomain = baseUrl.hostname;
    const CHUNK_SIZE = 3500;

    for (const [key, value] of Object.entries(storageItems)) {
      if (value.length > CHUNK_SIZE) {
        // Store as chunked cookies
        const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
        await context.addCookies([{
          name: `${key}.chunks`,
          value: String(chunkCount),
          domain: cookieDomain,
          path: '/',
          secure: true,
          sameSite: 'Lax',
        }]);
        for (let i = 0; i < chunkCount; i++) {
          await context.addCookies([{
            name: `${key}.chunk.${i}`,
            value: value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
            domain: cookieDomain,
            path: '/',
            secure: true,
            sameSite: 'Lax',
          }]);
        }
      } else {
        await context.addCookies([{
          name: key,
          value,
          domain: cookieDomain,
          path: '/',
          secure: true,
          sameSite: 'Lax',
        }]);
      }
    }

    // Reload to pick up authenticated state — then wait for client to sync cookies
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    // Let the Amplify client initialize and establish subscriptions before continuing
    await page.waitForTimeout(5000);
    console.log(`[${role}] Logged in.\n`);
  } catch (e) {
    console.error(`[${role}] LOGIN FAILED: ${e.message}`);
    await context.close();
    return { role, pages: {}, loginFailed: true };
  }

  currentPageMessages = [];
  currentNetworkRequests = [];

  for (const path of pages) {
    currentPageMessages = [];
    currentNetworkRequests = [];
    const url = `${BASE_URL}${path}`;
    console.log(`[${role}] ${path}`);

    // Measure heap before navigation (force GC for accurate baseline)
    let heapBefore = 0;
    try {
      await cdpSession.send('HeapProfiler.collectGarbage');
      const metricsBefore = await cdpSession.send('Performance.getMetrics');
      heapBefore = metricsBefore.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0;
    } catch { /* ignore CDP errors */ }

    // Timing: navigate + wait for networkidle with fallback
    const startTime = Date.now();
    let domContentLoadedMs = 0;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      domContentLoadedMs = Date.now() - startTime;
      // Wait for network to settle OR timeout — whichever comes first
      await page.waitForLoadState('networkidle', { timeout: NETWORKIDLE_TIMEOUT }).catch(() => {});
    } catch (e) {
      currentPageMessages.push({ type: 'navigation-error', text: e.message });
    }
    const loadTimeMs = Date.now() - startTime;

    // Additional settle time for subscriptions/async effects (not counted in loadTimeMs)
    await page.waitForTimeout(PAGE_SETTLE_MS);

    // Measure heap after page load (force GC for accurate measurement)
    let heapAfter = 0;
    try {
      await cdpSession.send('HeapProfiler.collectGarbage');
      const metricsAfter = await cdpSession.send('Performance.getMetrics');
      heapAfter = metricsAfter.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0;
    } catch { /* ignore CDP errors */ }
    const heapDeltaMB = ((heapAfter - heapBefore) / 1024 / 1024).toFixed(1);

    const errors = currentPageMessages.filter(m => m.type === 'error' || m.type === 'pageerror');
    const warnings = currentPageMessages.filter(m => m.type === 'warning');
    const stormAnalysis = analyzeMessages(currentPageMessages);
    const failedRequests = currentNetworkRequests.filter(r => r.type === 'failed');

    // Screenshot on error
    let screenshotPath = null;
    if (errors.length > 0 || stormAnalysis.storms.length > 0) {
      try {
        mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        const safeName = `${role}-${path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.png`;
        screenshotPath = join(SCREENSHOTS_DIR, safeName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch { /* screenshot failures are non-fatal */ }
    }

    // Build page result
    const pageResult = {
      path,
      domContentLoadedMs,
      loadTimeMs,
      heapDeltaMB: parseFloat(heapDeltaMB),
      errors: errors.map(e => e.text.substring(0, 300)),
      warnings: warnings.map(w => w.text.substring(0, 200)),
      storms: stormAnalysis.storms,
      resubscribes: stormAnalysis.resubscribes,
      rerenders: stormAnalysis.rerenders,
      wsIssues: stormAnalysis.wsIssues,
      failedRequests,
      screenshotPath: screenshotPath ? relative(RESULTS_DIR, screenshotPath) : null,
      messages: [...currentPageMessages],
    };
    pageResults[path] = pageResult;

    // Console output with timing
    const issues = [];
    if (errors.length > 0) issues.push(`${errors.length} errors`);
    if (warnings.length > 0) issues.push(`${warnings.length} warnings`);
    if (stormAnalysis.storms.length > 0) issues.push(`${stormAnalysis.storms.length} storms`);
    if (stormAnalysis.resubscribes.length > 0) issues.push('resubscribes');
    if (stormAnalysis.rerenders.length > 0) issues.push('rerenders');
    if (failedRequests.length > 0) issues.push(`${failedRequests.length} failed requests`);

    const timingStr = loadTimeMs > 8000 ? `${(loadTimeMs / 1000).toFixed(1)}s SLOW` :
                      `${(loadTimeMs / 1000).toFixed(1)}s`;
    const dclStr = `dcl:${(domContentLoadedMs / 1000).toFixed(1)}s`;
    const heapStr = parseFloat(heapDeltaMB) > 50 ? ` heap:+${heapDeltaMB}MB LEAK?` : '';

    if (issues.length > 0) {
      console.log(`  x ${issues.join(', ')} — ${dclStr} total:${timingStr}${heapStr}`);
      errors.slice(0, 3).forEach(e => console.log(`    [ERROR] ${e.text.substring(0, 200)}`));
      warnings.slice(0, 2).forEach(w => console.log(`    [WARN] ${w.text.substring(0, 200)}`));
      stormAnalysis.storms.forEach(s => console.log(`    [STORM] "${s.message}" x${s.count}`));
      stormAnalysis.rerenders.forEach(r => console.log(`    [RERENDER] ${r}`));
      failedRequests.slice(0, 3).forEach(r => console.log(`    [${r.status}] ${r.url}`));
      const wsProtocolErrors = stormAnalysis.wsIssues.filter(w => w.type === 'protocol-error');
      wsProtocolErrors.forEach(w => console.log(`    [WS-PROTOCOL] ${w.text}`));
      if (screenshotPath) console.log(`    screenshot: ${relative(RESULTS_DIR, screenshotPath)}`);
    } else {
      console.log(`  ok — ${dclStr} total:${timingStr}${heapStr}`);
    }

    // Navigate away to close WebSocket connections before next page
    await page.goto('about:blank', { waitUntil: 'load' }).catch(() => {});
    await page.waitForTimeout(500);
  }

  await context.close();
  return { role, pages: pageResults, loginFailed: false };
}

async function main() {
  const startTime = Date.now();
  console.log(`Crawl Console - ${new Date().toISOString()}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Roles: ${USERS.map(u => u.role).join(', ')}`);
  console.log(`Settings: networkidle=${NETWORKIDLE_TIMEOUT}ms, settle=${PAGE_SETTLE_MS}ms\n`);

  // Ensure output directories exist
  mkdirSync(RESULTS_DIR, { recursive: true });
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Pre-authenticate all users sequentially (Amplify signIn is stateful)
  const tokenMap = await preAuthenticateAll(USERS, PASSWORD);

  // Run all roles simultaneously with separate browser contexts (isolated IndexedDB/cache)
  const results = await Promise.all(USERS.map(user => crawlAsUser(browser, user, tokenMap[user.role])));

  await browser.close();
  const totalTimeMs = Date.now() - startTime;

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('  SUMMARY');
  console.log(`${'='.repeat(70)}\n`);

  let grandTotalErrors = 0;
  let grandTotalWarnings = 0;
  let grandTotalStorms = 0;
  let grandTotalFailedRequests = 0;
  const slowPages = [];
  const leakyPages = [];

  // JSON output structure
  const jsonReport = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    settings: { networkIdleTimeout: NETWORKIDLE_TIMEOUT, pageSettleMs: PAGE_SETTLE_MS },
    totalTimeMs,
    roles: {},
    totals: {},
    slowPages: [],
    leakyPages: [],
    discoveredRoutes: discoverRoutes(),
  };

  for (const result of results) {
    if (result.loginFailed) {
      console.log(`[${result.role}] LOGIN FAILED - skipped\n`);
      jsonReport.roles[result.role] = { loginFailed: true };
      continue;
    }

    let roleErrors = 0;
    let roleWarnings = 0;
    let roleStorms = 0;
    let roleFailedRequests = 0;
    const problemPages = [];

    const roleJson = { pages: {}, totals: {} };

    for (const [path, pageResult] of Object.entries(result.pages)) {
      const { errors, warnings, storms, failedRequests, domContentLoadedMs, loadTimeMs, heapDeltaMB } = pageResult;

      roleErrors += errors.length;
      roleWarnings += warnings.length;
      roleStorms += storms.length;
      roleFailedRequests += failedRequests.length;

      if (loadTimeMs > 8000) {
        slowPages.push({ role: result.role, path, loadTimeMs });
      }
      if (heapDeltaMB > 50) {
        leakyPages.push({ role: result.role, path, heapDeltaMB });
      }

      if (errors.length > 0 || storms.length > 0 || pageResult.rerenders.length > 0 || failedRequests.length > 0) {
        problemPages.push(pageResult);
      }

      // Add to JSON (without raw messages to keep it manageable)
      roleJson.pages[path] = {
        domContentLoadedMs,
        loadTimeMs,
        heapDeltaMB,
        errorCount: errors.length,
        warningCount: warnings.length,
        stormCount: storms.length,
        failedRequestCount: failedRequests.length,
        errors: errors.slice(0, 5),
        storms,
        failedRequests,
        wsIssues: pageResult.wsIssues.filter(w => w.type !== 'race'), // Only non-benign
        screenshot: pageResult.screenshotPath,
      };
    }

    grandTotalErrors += roleErrors;
    grandTotalWarnings += roleWarnings;
    grandTotalStorms += roleStorms;
    grandTotalFailedRequests += roleFailedRequests;

    roleJson.totals = { errors: roleErrors, warnings: roleWarnings, storms: roleStorms, failedRequests: roleFailedRequests };
    jsonReport.roles[result.role] = roleJson;

    const pageCount = Object.keys(result.pages).length;
    console.log(`[${result.role}] ${pageCount} pages — ${roleErrors} errors, ${roleWarnings} warnings, ${roleStorms} storms, ${roleFailedRequests} failed requests`);

    for (const pageResult of problemPages) {
      console.log(`  ${pageResult.path}: (${(pageResult.loadTimeMs / 1000).toFixed(1)}s)`);
      pageResult.errors.slice(0, 3).forEach(e => console.log(`    [ERROR] ${e.substring(0, 200)}`));
      pageResult.storms.forEach(s => console.log(`    [STORM] "${s.message}" x${s.count}`));
      pageResult.rerenders.forEach(r => console.log(`    [RERENDER] ${r}`));
      pageResult.failedRequests.slice(0, 3).forEach(r => console.log(`    [${r.status}] ${r.url}`));
      const wsProto = pageResult.wsIssues.filter(w => w.type === 'protocol-error');
      wsProto.forEach(w => console.log(`    [WS-PROTOCOL] ${w.text}`));
      if (pageResult.resubscribes.length > 0) {
        console.log(`    [RESUBSCRIBE] ${pageResult.resubscribes.length} abnormal subscription messages`);
      }
    }
    console.log('');
  }

  // Performance section
  if (slowPages.length > 0) {
    console.log('  SLOW PAGES (>8s):');
    slowPages.forEach(p => console.log(`    [${p.role}] ${p.path} — ${(p.loadTimeMs / 1000).toFixed(1)}s`));
    console.log('');
  }

  if (leakyPages.length > 0) {
    console.log('  POTENTIAL MEMORY LEAKS (>10MB heap growth):');
    leakyPages.forEach(p => console.log(`    [${p.role}] ${p.path} — +${p.heapDeltaMB}MB`));
    console.log('');
  }

  console.log(`--------------------------------------------------------------`);
  console.log(`Total: ${grandTotalErrors} errors, ${grandTotalWarnings} warnings, ${grandTotalStorms} storms, ${grandTotalFailedRequests} failed requests`);
  console.log(`Across ${results.filter(r => !r.loginFailed).length} roles in ${(totalTimeMs / 1000).toFixed(1)}s`);
  console.log(`--------------------------------------------------------------\n`);

  // Finalize JSON report
  jsonReport.totals = {
    errors: grandTotalErrors,
    warnings: grandTotalWarnings,
    storms: grandTotalStorms,
    failedRequests: grandTotalFailedRequests,
  };
  jsonReport.slowPages = slowPages;
  jsonReport.leakyPages = leakyPages;

  // Write structured JSON output
  const jsonPath = join(RESULTS_DIR, 'crawl-results.json');
  writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`JSON report: ${relative(process.cwd(), jsonPath)}`);

  if (grandTotalErrors > 0 || grandTotalStorms > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('Script failed:', e.message);
  process.exit(1);
});
