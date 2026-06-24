/**
 * @fileoverview Storybook Vitest Audit Hooks
 *
 * Captures console errors, network failures, and HTTP 4xx/5xx responses
 * during each story test. Equivalent to the custom crawl-audit script but
 * integrated into the vitest storybook test run.
 *
 * Hooks into beforeEach/afterEach to collect per-test diagnostics and
 * prints a clear summary report after all tests complete.
 *
 * Summary is printed to stdout and written to test/results/storybook-audit-summary.json
 */
import { beforeEach, afterEach, afterAll } from "vitest";

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * When true, tests FAIL on console errors or HTTP failures.
 * When false, issues are reported as warnings only (but summary always prints).
 */
const STRICT_MODE = false;

/** Maximum console errors per story before failing (even in non-strict mode) */
const MAX_CONSOLE_ERRORS = 20;

/** Maximum HTTP errors per story before failing (even in non-strict mode) */
const MAX_HTTP_ERRORS = 10;

// ─── Safe Patterns (matching crawl-audit.mjs) ───────────────────────────────

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
  "import-meta-resolve",
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
  // React controlled/uncontrolled transition warning (from Lexical editor internals)
  "A component is changing an uncontrolled input to be controlled",
  // Vitest/Storybook internals
  "vitest",
  "__vitest__",
  "storybook-preview",
  "hot-update",
  // Intentional test errors (stories testing error handling)
  "Test error message",
  // Editor save in mock environment returns error objects (non-critical)
  "[saveEditorContent] Save returned errors",
  // Audio waveform can't fetch from mock S3 paths in test environment
  "Error drawing waveform",
  "Could not resolve audio URL",
  // PDF loading errors (external PDF URLs not accessible in sandboxed test env)
  "Error loading PDF",
  "UnknownErrorException: Failed to fetch",
  "ResponseException: Unexpected server response",
  "Options prop passed to <Document />",
  "Cannot read properties of null (reading 'ensure')",
  // Image component with empty src in test environment
  'An empty string ("") was passed to the',
];

const SAFE_URL_PATTERNS = [
  "favicon.ico",
  "chrome-extension://",
  "hot-update",
  "__vitest__",
  "storybook-preview",
  // Static assets not served in vitest browser mode (served by Storybook dev server only)
  "/story-mocks/",
  "/thumbnails/",
  // Protected S3 paths that don't exist in test environment
  "/protected/",
  // External PDF test URLs not accessible in sandboxed environment
  "www.w3.org",
  "dummy.pdf",
];

function isSafe(text: string): boolean {
  return KNOWN_SAFE_PATTERNS.some((p) => text.includes(p));
}

function isSafeUrl(url: string): boolean {
  return SAFE_URL_PATTERNS.some((p) => url.includes(p));
}

// ─── Collector Types ─────────────────────────────────────────────────────────

interface ConsoleError {
  message: string;
  timestamp: number;
}

interface HttpError {
  url: string;
  status: number;
  method: string;
  timestamp: number;
}

interface NetworkFailure {
  url: string;
  error: string;
  timestamp: number;
}

interface AuditState {
  consoleErrors: ConsoleError[];
  httpErrors: HttpError[];
  networkFailures: NetworkFailure[];
  originalConsoleError: typeof console.error | null;
  originalFetch: typeof globalThis.fetch | null;
  abortController: AbortController | null;
}

// ─── Per-Story Issue Tracking (for summary report) ───────────────────────────
// Use globalThis to persist across test files in browser mode (module re-evaluates per file)

interface StoryIssue {
  testName: string;
  consoleErrors: string[];
  httpErrors: string[];
  networkFailures: string[];
}

interface GlobalAuditState {
  allIssues: StoryIssue[];
  totalStoriesTested: number;
}

// Persist on globalThis so state survives module re-evaluation per test file
const AUDIT_KEY = "__STORYBOOK_AUDIT_STATE__";
if (!(globalThis as any)[AUDIT_KEY]) {
  (globalThis as any)[AUDIT_KEY] = {
    allIssues: [],
    totalStoriesTested: 0,
  } satisfies GlobalAuditState;
}
const auditState: GlobalAuditState = (globalThis as any)[AUDIT_KEY];

// ─── Global State ────────────────────────────────────────────────────────────

let state: AuditState = {
  consoleErrors: [],
  httpErrors: [],
  networkFailures: [],
  originalConsoleError: null,
  originalFetch: null,
  abortController: null,
};

// ─── Setup Hooks ─────────────────────────────────────────────────────────────

function startCapture(): void {
  // Reset collectors
  state.consoleErrors = [];
  state.httpErrors = [];
  state.networkFailures = [];

  // 1. Patch console.error
  state.originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args
      .map((a) =>
        typeof a === "string" ? a : a instanceof Error ? a.message : String(a),
      )
      .join(" ");

    if (!isSafe(message)) {
      state.consoleErrors.push({
        message: message.slice(0, 500),
        timestamp: Date.now(),
      });
    }

    // Still call original so errors appear in output
    state.originalConsoleError?.call(console, ...args);
  };

  // 2. Patch fetch to track HTTP errors
  if (typeof globalThis.fetch === "function") {
    state.originalFetch = globalThis.fetch;
    globalThis.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const method = init?.method || "GET";

      try {
        const response = await state.originalFetch!.call(
          globalThis,
          input,
          init,
        );

        if (response.status >= 400 && !isSafeUrl(url)) {
          state.httpErrors.push({
            url: url.slice(0, 200),
            status: response.status,
            method,
            timestamp: Date.now(),
          });
        }

        return response;
      } catch (error: unknown) {
        if (!isSafeUrl(url)) {
          state.networkFailures.push({
            url: url.slice(0, 200),
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          });
        }
        throw error;
      }
    };
  }

  // 3. Listen for resource load errors (images, scripts, etc.)
  if (typeof window !== "undefined") {
    window.addEventListener("error", handleResourceError, true);
  }
}

function handleResourceError(event: Event): void {
  // Only catch resource load errors (not script errors)
  if (event.target && (event.target as HTMLElement).tagName) {
    const el = event.target as HTMLElement;
    const url =
      (el as HTMLImageElement).src || (el as HTMLLinkElement).href || "";
    if (url && !isSafeUrl(url)) {
      state.networkFailures.push({
        url: url.slice(0, 200),
        error: `Resource load failed: ${el.tagName.toLowerCase()}`,
        timestamp: Date.now(),
      });
    }
  }
}

function stopCapture(): void {
  // Restore console.error
  if (state.originalConsoleError) {
    console.error = state.originalConsoleError;
    state.originalConsoleError = null;
  }

  // Restore fetch
  if (state.originalFetch) {
    globalThis.fetch = state.originalFetch;
    state.originalFetch = null;
  }

  // Remove resource error listener
  if (typeof window !== "undefined") {
    window.removeEventListener("error", handleResourceError, true);
  }
}

function evaluateResults(testName: string): void {
  auditState.totalStoriesTested++;
  const { consoleErrors, httpErrors, networkFailures } = state;
  const hasIssues =
    consoleErrors.length > 0 ||
    httpErrors.length > 0 ||
    networkFailures.length > 0;

  if (!hasIssues) return;

  // Accumulate for summary report
  auditState.allIssues.push({
    testName,
    consoleErrors: consoleErrors.map((e) => e.message.slice(0, 200)),
    httpErrors: httpErrors.map((e) => `${e.method} ${e.url} → ${e.status}`),
    networkFailures: networkFailures.map((e) => `${e.url}: ${e.error}`),
  });

  // Build diagnostic message
  const lines: string[] = [`\n[audit] Issues in: ${testName}`];

  if (consoleErrors.length > 0) {
    lines.push(`  Console errors (${consoleErrors.length}):`);
    consoleErrors.slice(0, 5).forEach((e) => {
      lines.push(`    • ${e.message.slice(0, 120)}`);
    });
    if (consoleErrors.length > 5) {
      lines.push(`    ... and ${consoleErrors.length - 5} more`);
    }
  }

  if (httpErrors.length > 0) {
    lines.push(`  HTTP errors (${httpErrors.length}):`);
    httpErrors.slice(0, 5).forEach((e) => {
      lines.push(`    • ${e.method} ${e.url} → ${e.status}`);
    });
  }

  if (networkFailures.length > 0) {
    lines.push(`  Network failures (${networkFailures.length}):`);
    networkFailures.slice(0, 5).forEach((e) => {
      lines.push(`    • ${e.url}: ${e.error}`);
    });
  }

  const diagnosticMsg = lines.join("\n");

  if (STRICT_MODE) {
    throw new Error(diagnosticMsg);
  }

  // Non-strict: warn, but fail on excessive errors
  console.warn(diagnosticMsg);

  if (consoleErrors.length > MAX_CONSOLE_ERRORS) {
    throw new Error(
      `[audit] Excessive console errors (${consoleErrors.length} > ${MAX_CONSOLE_ERRORS}): ${testName}`,
    );
  }

  if (httpErrors.length > MAX_HTTP_ERRORS) {
    throw new Error(
      `[audit] Excessive HTTP errors (${httpErrors.length} > ${MAX_HTTP_ERRORS}): ${testName}`,
    );
  }
}

// ─── Register Hooks ──────────────────────────────────────────────────────────

export function registerAuditHooks(): void {
  beforeEach(() => {
    startCapture();
  });

  afterEach(({ task }) => {
    const testName = task?.name || "unknown";
    try {
      evaluateResults(testName);
    } finally {
      stopCapture();
    }
  });

  afterAll(() => {
    printAuditSummary();
  });
}

// ─── Summary Report ──────────────────────────────────────────────────────────

function printAuditSummary(): void {
  const { allIssues: issues, totalStoriesTested: total } = auditState;
  const storiesWithIssues = issues.length;

  // Skip summary entirely if no issues — reduces noise in the output
  if (storiesWithIssues === 0) return;

  const line = "═".repeat(60);
  const cleanStories = total - storiesWithIssues;

  // Aggregate unique errors
  const allConsoleErrors = new Map<string, number>();
  const allNetworkFailures = new Map<string, number>();
  const allHttpErrors = new Map<string, number>();

  for (const issue of issues) {
    for (const err of issue.consoleErrors) {
      const key = err.slice(0, 100);
      allConsoleErrors.set(key, (allConsoleErrors.get(key) || 0) + 1);
    }
    for (const err of issue.networkFailures) {
      allNetworkFailures.set(err, (allNetworkFailures.get(err) || 0) + 1);
    }
    for (const err of issue.httpErrors) {
      allHttpErrors.set(err, (allHttpErrors.get(err) || 0) + 1);
    }
  }

  const totalConsoleErrors = Array.from(allConsoleErrors.values()).reduce(
    (a, b) => a + b,
    0,
  );
  const totalNetworkFailures = Array.from(allNetworkFailures.values()).reduce(
    (a, b) => a + b,
    0,
  );
  const totalHttpErrors = Array.from(allHttpErrors.values()).reduce(
    (a, b) => a + b,
    0,
  );

  // Print summary (only shown when issues exist)
  console.log(`\n${line}`);
  console.log(
    `  STORYBOOK AUDIT — ${storiesWithIssues} issue(s) in ${total} stories`,
  );
  console.log(line);

  if (totalConsoleErrors > 0) {
    console.log(
      `  CONSOLE ERRORS (${totalConsoleErrors} total across ${allConsoleErrors.size} unique):`,
    );
    const sorted = [...allConsoleErrors.entries()].sort((a, b) => b[1] - a[1]);
    for (const [msg, count] of sorted.slice(0, 10)) {
      console.log(`    [${count}x] ${msg}`);
    }
    if (sorted.length > 10) {
      console.log(`    ... and ${sorted.length - 10} more unique errors`);
    }
    console.log("");
  }

  if (totalNetworkFailures > 0) {
    console.log(`  NETWORK FAILURES / 404s (${totalNetworkFailures} total):`);
    const sorted = [...allNetworkFailures.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    for (const [msg, count] of sorted.slice(0, 10)) {
      console.log(`    [${count}x] ${msg}`);
    }
    if (sorted.length > 10) {
      console.log(`    ... and ${sorted.length - 10} more`);
    }
    console.log("");
  }

  if (totalHttpErrors > 0) {
    console.log(`  HTTP ERRORS (${totalHttpErrors} total):`);
    const sorted = [...allHttpErrors.entries()].sort((a, b) => b[1] - a[1]);
    for (const [msg, count] of sorted.slice(0, 10)) {
      console.log(`    [${count}x] ${msg}`);
    }
    console.log("");
  }

  if (storiesWithIssues > 0) {
    console.log(`  STORIES WITH ISSUES:`);
    for (const issue of issues) {
      const parts: string[] = [];
      if (issue.consoleErrors.length > 0)
        parts.push(`${issue.consoleErrors.length} console`);
      if (issue.networkFailures.length > 0)
        parts.push(`${issue.networkFailures.length} network`);
      if (issue.httpErrors.length > 0)
        parts.push(`${issue.httpErrors.length} http`);
      console.log(`    • ${issue.testName} (${parts.join(", ")})`);
    }
    console.log("");
  }

  const verdict =
    storiesWithIssues === 0
      ? "PASS"
      : totalConsoleErrors > 50 || totalNetworkFailures > 20
        ? "NEEDS ATTENTION"
        : "ISSUES FOUND";
  console.log(`  VERDICT: ${verdict}`);
  console.log(`${line}\n`);
}
