/**
 * Client Instrumentation Hook (Next.js 16)
 *
 * Runs before any React code executes in the browser.
 * Sets up earliest-possible performance marks and error tracking.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
 */

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
