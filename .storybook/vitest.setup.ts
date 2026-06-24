import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import * as projectAnnotations from "./preview";
import { registerAuditHooks } from "./vitest-audit-hooks";

// Pre-load PDF.js worker into main thread to prevent "Failed to resolve module
// specifier 'pdf.worker.mjs'" errors. react-pdf sets workerSrc to the bare
// specifier 'pdf.worker.mjs' which browsers cannot resolve via dynamic import().
// Importing the worker here registers globalThis.pdfjsWorker.WorkerMessageHandler
// so pdfjs uses it directly without attempting the unresolvable import.
import "pdfjs-dist/build/pdf.worker.mjs";

// Polyfill for Node.js modules needed by qrcode/pngjs in browser environment
if (typeof window !== "undefined") {
  // @ts-ignore - Adding global polyfill
  window.global = window;

  // Mock util module for pngjs which expects Node.js util
  if (!window.util) {
    // @ts-ignore - Creating util polyfill
    window.util = {
      inherits: function (ctor: any, superCtor: any) {
        if (!ctor || !superCtor) return;
        try {
          ctor.super_ = superCtor;
          // Only create prototype if it doesn't exist or is not already set up
          if (
            !ctor.prototype ||
            Object.getPrototypeOf(ctor.prototype) !== superCtor.prototype
          ) {
            ctor.prototype = Object.create(superCtor.prototype, {
              constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true,
              },
            });
          }
        } catch (e) {
          // Silently fail if prototype setup fails
          console.warn(
            "[vitest.setup] Failed to set up prototype inheritance:",
            e,
          );
        }
      },
    };
  }

  // Mock stream module basics that pngjs might need
  // @ts-ignore
  if (!window.stream && !window.require) {
    // @ts-ignore
    window.stream = { Writable: class {}, Readable: class {} };
  }
}

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);

// Register audit hooks for console error, network failure, and HTTP error detection
registerAuditHooks();
