// @ts-check
import { serwist } from "@serwist/next/config";

// Configurator mode: the service worker is built by `serwist build` after
// `next build` has prerendered every route. Client-side registration options
// (swUrl, register, cacheOnNavigation, reloadOnOnline, scope, disable) live on
// the <SerwistProvider> in app/layout.tsx.
export default serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // Precache prerendered HTML routes in addition to build assets.
  precachePrerendered: true,
});
