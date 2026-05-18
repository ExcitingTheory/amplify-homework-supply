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
  return 'ws://localhost:3001';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/x-data-grid'],

  // Disable dev indicators to suppress Turbopack isrManifest HMR warnings
  devIndicators: false,

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_YJS_WS_URL: getWebSocketUrl(),
    NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION: process.env.NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION || 'true',
  },

  // Reduce build output size for Amplify deployment
  productionBrowserSourceMaps: false,

  // Use standalone output for smaller deployments
  output: 'standalone',

  // Skip TypeScript type checking during build to avoid OOM
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images
  images: {
    unoptimized: true,
  },

  // Turbopack config
  turbopack: {},
};

export default withSerwist(withNextIntl(nextConfig));
