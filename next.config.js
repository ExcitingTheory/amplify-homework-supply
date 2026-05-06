const { i18n } = require('./next-i18next.config');
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  cacheOnNavigation: true,
  register: true,
  reloadOnOnline: true,
  scope: '/',
  swUrl: '/sw.js',
});

module.exports = withSerwist({
  reactStrictMode: true,
  transpilePackages: ['@mui/x-data-grid'],
  
  // Disable dev indicators to suppress Turbopack isrManifest HMR warnings
  devIndicators: false,
  
  // Internationalization
  i18n,
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_YJS_WS_URL: process.env.NEXT_PUBLIC_YJS_WS_URL || 'ws://localhost:3001',
    NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION: process.env.NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION || 'true',
  },
  
  // Reduce build output size for Amplify deployment
  productionBrowserSourceMaps: false, // Disable source maps in production
  
  // Use standalone output for smaller deployments
  output: 'standalone',
  
  // Skip TypeScript type checking during build to avoid OOM
  // Run `tsc --noEmit` separately in CI for type safety
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images
  images: {
    unoptimized: true, // Required for static export or SSR on Amplify
  },
  
  // Exclude Storybook files from production build
  pageExtensions: process.env.NODE_ENV === 'production' 
    ? ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'tsx', 'ts', 'jsx', 'js'].filter(ext => !ext.includes('stories') && !ext.includes('mdx'))
    : ['tsx', 'ts', 'jsx', 'js', 'mdx'],
  
  // Turbopack config - PDF.js worker is copied via postinstall script
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
  turbopack: {},
});
