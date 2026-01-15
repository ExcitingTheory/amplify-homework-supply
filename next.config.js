module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@mui/x-data-grid'],
  
  // Reduce build output size for Amplify deployment
  productionBrowserSourceMaps: false, // Disable source maps in production
  
  // Use standalone output for smaller deployments
  output: 'standalone',
  
  // Optimize images
  images: {
    unoptimized: true, // Required for static export or SSR on Amplify
  },
  
  // Exclude Storybook files from production build
  pageExtensions: process.env.NODE_ENV === 'production' 
    ? ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'tsx', 'ts', 'jsx', 'js'].filter(ext => !ext.includes('stories') && !ext.includes('mdx'))
    : ['tsx', 'ts', 'jsx', 'js', 'mdx'],
  
  // Turbopack config - optimizations are mostly built-in
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
  // turbopack: {
  // },
};
