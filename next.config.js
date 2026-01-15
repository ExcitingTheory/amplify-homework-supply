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
  
  // Experimental features for better tree shaking
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@aws-amplify/ui-react',
      'lexical',
      '@lexical/react',
    ],
  },
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Enable tree shaking
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: true,
      minimize: !dev,
    };
    
    // Exclude Storybook files and dependencies in production
    if (!dev) {
      config.externals = config.externals || [];
      if (!isServer) {
        // Exclude Storybook packages from client bundle
        config.resolve.alias = {
          ...config.resolve.alias,
          '@storybook/react': false,
          '@storybook/addon-docs': false,
          '@storybook/blocks': false,
        };
      }
    }
    
    // Additional optimizations can be added here
    
    return config;
  },
};
