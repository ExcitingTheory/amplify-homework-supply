import { test as base, expect } from "@playwright/test";
import { writeFile } from "fs/promises";

type ConsoleEntry = {
  type: string;
  text: string;
  location?: { url?: string; lineNumber?: number; columnNumber?: number };
  timestamp: string;
};

type NetworkEntry = {
  phase: "response" | "requestfailed";
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  resourceType: string;
  failureText?: string;
  timestamp: string;
};

type Vitals = {
  fcp: number | null;
  lcp: number | null;
  cls: number;
  inp: number | null;
  navigation: {
    domContentLoaded: number | null;
    loadEventEnd: number | null;
    responseEnd: number | null;
    domInteractive: number | null;
  };
};

const MAX_NETWORK_ENTRIES = 1500;

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const consoleEntries: ConsoleEntry[] = [];
    const networkEntries: NetworkEntry[] = [];

    await page.addInitScript(() => {
      const w = window as any;
      if (w.__journeyVitalsInstalled) return;

      w.__journeyVitalsInstalled = true;
      w.__journeyVitals = {
        fcp: null,
        lcp: null,
        cls: 0,
        inp: null,
      };

      try {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        w.__journeyNavigation = nav
          ? {
              domContentLoaded: nav.domContentLoadedEventEnd,
              loadEventEnd: nav.loadEventEnd,
              responseEnd: nav.responseEnd,
              domInteractive: nav.domInteractive,
            }
          : null;
      } catch {
        w.__journeyNavigation = null;
      }

      try {
        const paintObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              w.__journeyVitals.fcp = entry.startTime;
            }
          }
        });
        paintObs.observe({ type: "paint", buffered: true });
      } catch {
        // paint observer unsupported
      }

      try {
        const lcpObs = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) w.__journeyVitals.lcp = last.startTime;
        });
        lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // lcp observer unsupported
      }

      try {
        const clsObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              w.__journeyVitals.cls += entry.value || 0;
            }
          }
        });
        clsObs.observe({ type: "layout-shift", buffered: true });
      } catch {
        // cls observer unsupported
      }

      try {
        const inpObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            const duration = typeof entry.duration === "number" ? entry.duration : null;
            if (duration != null) {
              w.__journeyVitals.inp =
                w.__journeyVitals.inp == null
                  ? duration
                  : Math.max(w.__journeyVitals.inp, duration);
            }
          }
        });
        inpObs.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
      } catch {
        // INP observer unsupported
      }
    });

    page.on("console", (msg) => {
      consoleEntries.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString(),
      });
    });

    page.on("response", (response) => {
      if (networkEntries.length >= MAX_NETWORK_ENTRIES) return;
      const req = response.request();
      networkEntries.push({
        phase: "response",
        method: req.method(),
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        resourceType: req.resourceType(),
        timestamp: new Date().toISOString(),
      });
    });

    page.on("requestfailed", (request) => {
      if (networkEntries.length >= MAX_NETWORK_ENTRIES) return;
      networkEntries.push({
        phase: "requestfailed",
        method: request.method(),
        url: request.url(),
        resourceType: request.resourceType(),
        failureText: request.failure()?.errorText,
        timestamp: new Date().toISOString(),
      });
    });

    await use(page);

    let vitals: Vitals = {
      fcp: null,
      lcp: null,
      cls: 0,
      inp: null,
      navigation: {
        domContentLoaded: null,
        loadEventEnd: null,
        responseEnd: null,
        domInteractive: null,
      },
    };

    try {
      vitals = await page.evaluate(() => {
        const w = window as any;
        const metric = w.__journeyVitals || {};
        const nav = w.__journeyNavigation || null;
        return {
          fcp: metric.fcp ?? null,
          lcp: metric.lcp ?? null,
          cls: metric.cls ?? 0,
          inp: metric.inp ?? null,
          navigation: {
            domContentLoaded: nav?.domContentLoaded ?? null,
            loadEventEnd: nav?.loadEventEnd ?? null,
            responseEnd: nav?.responseEnd ?? null,
            domInteractive: nav?.domInteractive ?? null,
          },
        };
      });
    } catch {
      // page may be gone or cross-origin; keep null metrics
    }

    const diagnostics = {
      test: testInfo.title,
      file: testInfo.file,
      project: testInfo.project.name,
      status: testInfo.status,
      retry: testInfo.retry,
      metrics: vitals,
      console: {
        total: consoleEntries.length,
        errors: consoleEntries.filter((e) => e.type === "error").length,
        warnings: consoleEntries.filter((e) => e.type === "warning").length,
        entries: consoleEntries,
      },
      network: {
        total: networkEntries.length,
        failed: networkEntries.filter((e) => e.phase === "requestfailed").length,
        httpErrors: networkEntries.filter((e) => e.phase === "response" && (e.status || 0) >= 400).length,
        entries: networkEntries,
      },
    };

    const filePath = testInfo.outputPath("journey-diagnostics.json");
    await writeFile(filePath, JSON.stringify(diagnostics, null, 2), "utf8");
    await testInfo.attach("journey-diagnostics", {
      path: filePath,
      contentType: "application/json",
    });
  },
});

export { expect };
