/**
 * Client Instrumentation Hook (Next.js 16)
 *
 * Runs before any React code executes in the browser.
 * Sets up earliest-possible performance marks, error tracking, and Web Vitals collection.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */

import { onLCP, onINP, onCLS, onTTFB, onFCP } from "web-vitals";
import type { Metric } from "web-vitals";

// Mark application initialization for performance measurement
performance.mark("app-init");

// Global error handler — catches errors before React hydration
window.addEventListener("error", (event) => {
  console.error("[Client Instrumentation] Uncaught error:", event.error);
});

// Unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("[Client Instrumentation] Unhandled rejection:", event.reason);
});

// ============================================================================
// Web Vitals — collect LCP, INP, CLS, TTFB, FCP and send to /api/vitals
// ============================================================================

function sendMetric(metric: Metric) {
  const payload = JSON.stringify({
    type: "web-vital",
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/vitals", payload);
  } else {
    fetch("/api/vitals", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }
}

onLCP(sendMetric);
onINP(sendMetric);
onCLS(sendMetric);
onTTFB(sendMetric);
onFCP(sendMetric);
