import { readFileSync } from 'fs';
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  cacheOnNavigation: true,
  register: true,
  reloadOnOnline: true,
  scope: '/',
  swUrl: '/sw.js',
});

// Derive WebSocket URL from amplify_outputs.json at build time
function getWebSocketUrl() {
  // Explicit env var takes priority (local dev override)
  if (process.env.NEXT_PUBLIC_YJS_WS_URL) {
    return process.env.NEXT_PUBLIC_YJS_WS_URL;
  }
  try {
    const outputs = JSON.parse(readFileSync('./amplify_outputs.json', 'utf-8'));
    const wsConfig = outputs?.custom?.WEBSOCKET_API;
    if (wsConfig?.apiId && wsConfig?.stageName && wsConfig?.region) {
      return `wss://${wsConfig.apiId}.execute-api.${wsConfig.region}.amazonaws.com/${wsConfig.stageName}`;
    }
  } catch {
    // amplify_outputs.json not available (CI, first build, etc.)
  }
  // Use wss:// for local dev since Next.js runs with --experimental-https
  return 'wss://localhost:3001';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/x-data-grid'],

  // React Compiler: automatic memoization of all components
  reactCompiler: true,

  // Cache Components: enables PPR with "use cache" directive
  cacheComponents: true,

  // Disable dev indicators to suppress Turbopack isrManifest HMR warnings
  devIndicators: false,

  // Security headers applied to all routes.
  // CSP is set per-request in proxy.ts (requires a per-request nonce).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_YJS_WS_URL: getWebSocketUrl(),
    NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION: process.env.NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION || 'true',
    // CloudFront CDN domain — populated from amplify_outputs.json during build.
    // Leave empty for local dev; getCachedUrl and cdnImageLoader fall back gracefully.
    NEXT_PUBLIC_CDN_DOMAIN: process.env.NEXT_PUBLIC_CDN_DOMAIN || '',
  },

  // Reduce build output size for Amplify deployment
  productionBrowserSourceMaps: false,

  // Use standalone output for smaller deployments
  output: 'standalone',

  // Skip TypeScript type checking during build to avoid OOM
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images via CloudFront CDN + pre-generated WebP variants.
  // Uses a custom loader (src/utils/cdnImageLoader.js) that maps next/image
  // width requests to the nearest pre-generated variant (small/medium/large.webp).
  // Falls back gracefully when NEXT_PUBLIC_CDN_DOMAIN is not set (local dev).
  images: {
    loader: 'custom',
    loaderFile: './src/utils/cdnImageLoader.js',
  },

  // Turbopack config
  turbopack: {
    resolveAlias: {
      // Prevent onnxruntime-node (native Node addon) from being bundled into
      // client chunks. @huggingface/transformers conditionally imports it, but
      // Turbopack doesn't respect /* webpackIgnore: true */ dynamic import comments.
      'onnxruntime-node': './src/stubs/onnxruntime-node.js',
    },
  },

  // Persist Turbopack compiler artifacts on disk for faster dev restarts
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default withSerwist(withNextIntl(nextConfig));
