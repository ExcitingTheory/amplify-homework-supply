/**
 * @fileoverview Storybook Vitest Audit Hooks
 *
 * Captures console errors, network failures, and HTTP 4xx/5xx responses
 * during each story test. Equivalent to the custom crawl-audit script but
 * integrated into the vitest storybook test run.
 *
 * Hooks into beforeEach/afterEach to collect per-test diagnostics and
 * optionally fail or warn based on policy.
 */
import { beforeEach, afterEach } from "vitest";

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * When true, tests FAIL on console errors or HTTP failures.
 * When false, issues are reported as warnings only.
 * Toggle below to enable strict mode.
 */
const STRICT_MODE = false;

/** Maximum console errors before failing (even in non-strict mode) */
const MAX_CONSOLE_ERRORS = 20;

/** Maximum HTTP errors before failing (even in non-strict mode) */
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
  // Vitest/Storybook internals
  "vitest",
  "__vitest__",
  "storybook-preview",
  "hot-update",
];

const SAFE_URL_PATTERNS = [
  "favicon.ico",
  "chrome-extension://",
  "hot-update",
  "__vitest__",
  "storybook-preview",
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
  const { consoleErrors, httpErrors, networkFailures } = state;
  const hasIssues =
    consoleErrors.length > 0 ||
    httpErrors.length > 0 ||
    networkFailures.length > 0;

  if (!hasIssues) return;

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
}
