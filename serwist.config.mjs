// @ts-check
import { serwist } from "@serwist/next/config";

// Configurator mode: the service worker is built by `serwist build` after
// `next build` has prerendered every route. Client-side registration options
// (swUrl, register, cacheOnNavigation, reloadOnOnline, scope, disable) live on
// the <SerwistProvider> in app/layout.tsx.
export default serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  esbuildOptions: {
    target: ["chrome111", "edge111", "firefox111", "safari16"],
  },
  // Precache prerendered HTML routes in addition to build assets.
  precachePrerendered: true,
  // The default "public/**/*" pattern also picks up files that are not served
  // at their public path. Extensionless LICENSE files go through the locale
  // middleware and 404, and a single failed precache request fails the
  // service worker install. The html files in public/ are scratch pages whose
  // precache URL is wrongly emitted as "/public/<name>".
  globIgnores: [
    "public/**/LICENSE*",
    "public/**/OFL.txt",
    "public/**/README.txt",
    "public/_hat_alpha*.html",
  ],
});
