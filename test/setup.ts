/**
 * Vitest Setup File
 *
 * Runs before all tests to configure global test environment
 */

import { expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// Load test environment variables from .env.test
const envPath = resolve(process.cwd(), ".env.test");
if (existsSync(envPath)) {
  const envConfig = readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
  console.info("✓ Loaded .env.test");
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next-intl globally for all component tests
vi.mock("next-intl", () => {
  const interpolate = (key: string, values?: Record<string, any>) =>
    values
      ? Object.entries(values).reduce(
          (str, [k, v]) =>
            typeof v === "function" ? str : str.replace(`{${k}}`, String(v)),
          key,
        )
      : key;
  const createT = () => {
    const t = (key: string, values?: Record<string, any>) =>
      interpolate(key, values);
    // Rich/markup variants return the key too, so tests can query by key.
    t.rich = (key: string, values?: Record<string, any>) =>
      interpolate(key, values);
    t.markup = (key: string, values?: Record<string, any>) =>
      interpolate(key, values);
    t.raw = (key: string) => key;
    t.has = () => true;
    return t;
  };
  // Stable translator per namespace, like next-intl, so effects/memos that
  // depend on `t` don't re-run on every render.
  const translators = new Map<string, ReturnType<typeof createT>>();
  return {
    useTranslations: (namespace?: string) => {
      const cacheKey = namespace ?? "";
      if (!translators.has(cacheKey)) translators.set(cacheKey, createT());
      return translators.get(cacheKey)!;
    },
    useLocale: () => "en",
    useMessages: () => ({}),
    useFormatter: () => ({
      number: (n: number) => String(n),
      dateTime: (d: Date) => d.toISOString(),
    }),
    NextIntlClientProvider: ({ children }: any) => children,
  };
});

// next-intl's createNavigation needs an intl provider and imports extensionless
// "next/navigation", which Node ESM can't resolve. Components only need plain
// anchors/router stubs in unit tests; suites can override with their own mock.
vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  return {
    Link: React.forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        href?: string | { pathname?: string };
        prefetch?: boolean;
        locale?: string;
      }
    >(function Link({ href, prefetch: _prefetch, locale: _locale, ...props }, ref) {
      const resolved =
        typeof href === "string" ? href : (href?.pathname ?? undefined);
      return React.createElement("a", { ...props, href: resolved, ref });
    }),
    redirect: vi.fn(),
    usePathname: () => "/",
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
    getPathname: ({ href }: { href: string }) => href,
  };
});

// Extend Vitest matchers with TypeScript support
declare module "vitest" {
  interface Assertion {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
}

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  // Keep error for debugging
};

// Mock Web Worker for test environment (used by embeddingWorkerManager etc.)
if (typeof globalThis.Worker === "undefined") {
  globalThis.Worker = class MockWorker {
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onerror: ((ev: ErrorEvent) => void) | null = null;
    constructor() {}
    postMessage() {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return false;
    }
  } as any;
}

// Global test setup
beforeAll(() => {
  console.info("🧪 Starting integration test suite...");
});

afterAll(() => {
  console.info("✅ Integration test suite complete");
});
