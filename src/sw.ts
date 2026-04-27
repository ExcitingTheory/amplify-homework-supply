/**
 * Homework Supply Service Worker
 *
 * Provides offline caching for the PWA:
 * - App shell (HTML/JS/CSS) via StaleWhileRevalidate
 * - Fonts via CacheFirst (30 days)
 * - Static images via CacheFirst (7 days)
 * - S3 media (audio/video/PDF) via CacheFirst (7 days), keyed by object path
 * - API calls via NetworkFirst with IndexedDB fallback
 * - PDF.js worker via CacheFirst
 */

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  CacheFirst,
  ExpirationPlugin,
  CacheableResponsePlugin,
  NetworkFirst,
  StaleWhileRevalidate,
  Serwist,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ── Custom runtime caching rules ──────────────────────────────────────────────

const fontCache = new CacheFirst({
  cacheName: 'fonts-cache',
  plugins: [
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
});

const imageCache = new CacheFirst({
  cacheName: 'images-cache',
  plugins: [
    new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
});

const s3MediaCache = new CacheFirst({
  cacheName: 's3-media-v1',
  plugins: [
    new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
});

const apiCache = new NetworkFirst({
  cacheName: 'api-cache',
  networkTimeoutSeconds: 10,
  plugins: [
    new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
  ],
});

const pdfWorkerCache = new CacheFirst({
  cacheName: 'pdf-worker-cache',
  plugins: [
    new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
});

/**
 * Strip presigned URL query params so S3 objects are cached by their path key,
 * not by ephemeral tokens.
 */
function stripS3QueryParams(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

/**
 * Detect S3 media requests (audio, video, PDF, images from S3 buckets).
 */
function isS3MediaRequest(url: URL): boolean {
  const hostname = url.hostname;
  return (
    hostname.includes('.s3.') ||
    hostname.includes('s3.amazonaws.com') ||
    hostname.includes('.s3-') ||
    hostname.endsWith('.amazonaws.com')
  );
}

const customRuntimeCaching = [
  // Fonts - CacheFirst, 30 days
  {
    matcher({ url }: { url: URL }) {
      return (
        url.pathname.startsWith('/Cormorant/') ||
        url.pathname.startsWith('/DM_Sans/') ||
        url.pathname.startsWith('/Inter/') ||
        url.pathname.startsWith('/Noto_Sans_JP/') ||
        url.pathname.startsWith('/Oswald/') ||
        /\.(woff2?|ttf|otf|eot)$/i.test(url.pathname)
      );
    },
    handler: fontCache,
  },
  // PDF.js worker - CacheFirst
  {
    matcher({ url }: { url: URL }) {
      return url.pathname.includes('pdf.worker');
    },
    handler: pdfWorkerCache,
  },
  // S3 media is handled by the custom fetch handler below (strips presigned
  // URL query params for cache keying), so it is NOT included here.
  // Static images - CacheFirst, 7 days
  {
    matcher({ url }: { url: URL }) {
      return /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i.test(url.pathname);
    },
    handler: imageCache,
  },
  // API calls - NetworkFirst
  {
    matcher({ url }: { url: URL }) {
      return (
        url.pathname.startsWith('/api/') ||
        url.hostname.includes('appsync-api') ||
        url.hostname.includes('execute-api')
      );
    },
    handler: apiCache,
  },
  // Default Next.js caching rules for everything else
  ...defaultCache,
];

// ── Background Sync for grade submissions ─────────────────────────────────────

self.addEventListener('sync', (event: ExtendableEvent & { tag?: string }) => {
  if (event.tag === 'grade-sync') {
    event.waitUntil(processSyncQueue());
  }
});

/**
 * Process pending sync operations from IndexedDB.
 * This is called by the Background Sync API when connectivity is restored.
 */
async function processSyncQueue(): Promise<void> {
  // Post message to any active client to trigger queue processing
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
  }
}

// ── Custom fetch handler for S3 presigned URLs ───────────────────────────────

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // For S3 media, normalise the cache key by stripping query params
  if (isS3MediaRequest(url)) {
    const cacheKey = stripS3QueryParams(url);
    event.respondWith(
      caches.match(cacheKey).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open('s3-media-v1').then((cache) => {
              cache.put(cacheKey, clone);
            });
          }
          return response;
        }).catch(() => {
          // If both cache and network fail, return offline response
          return new Response('Offline - media unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      }),
    );
  }
});

// ── Serwist initialization ───────────────────────────────────────────────────

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customRuntimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
