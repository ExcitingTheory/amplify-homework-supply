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
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    if (values) {
      return Object.entries(values).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, String(v)),
        key,
      );
    }
    return key;
  },
  useLocale: () => "en",
  useMessages: () => ({}),
  useFormatter: () => ({
    number: (n: number) => String(n),
    dateTime: (d: Date) => d.toISOString(),
  }),
  NextIntlClientProvider: ({ children }: any) => children,
}));

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
