#!/usr/bin/env node
/**
 * Generate Route List for i18n Testing
 * 
 * Scans the pages/ directory to automatically discover all routes
 * and generates a list for Cypress i18n validation tests.
 * 
 * Usage:
 *   node scripts/generate-route-list.js
 *   node scripts/generate-route-list.js --output cypress/fixtures/routes.json
 * 
 * @module scripts/generate-route-list
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../pages');
const DEFAULT_OUTPUT = path.join(__dirname, '../cypress/fixtures/routes.json');

/**
 * Convert file path to Next.js route
 * @param {string} filePath - File path relative to pages/
 * @returns {string} Next.js route
 */
function filePathToRoute(filePath) {
  // Remove .js, .jsx, .ts, .tsx extensions
  let route = filePath.replace(/\.(jsx?|tsx?)$/, '');
  
  // Convert index to /
  if (route.endsWith('/index')) {
    route = route.replace('/index', '');
  }
  
  // Convert empty string to /
  if (route === 'index' || route === '') {
    route = '/';
  } else if (!route.startsWith('/')) {
    route = '/' + route;
  }
  
  return route;
}

/**
 * Check if file should be ignored
 * @param {string} fileName - File name
 * @returns {boolean} True if should ignore
 */
function shouldIgnoreFile(fileName) {
  const ignorePatterns = [
    '_app',
    '_document',
    '_error',
    '.mdx',
    '.test.',
    '.spec.',
    'api/', // Ignore API routes
  ];
  
  return ignorePatterns.some(pattern => fileName.includes(pattern));
}

/**
 * Recursively scan directory for page files
 * @param {string} dir - Directory to scan
 * @param {string} relativePath - Relative path from pages/
 * @returns {Array<{route: string, file: string, isDynamic: boolean}>} List of routes
 */
function scanDirectory(dir, relativePath = '') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      routes.push(...scanDirectory(fullPath, relPath));
    } else if (entry.isFile()) {
      // Skip ignored files
      if (shouldIgnoreFile(relPath)) {
        continue;
      }
      
      // Convert to route
      const route = filePathToRoute(relPath);
      const isDynamic = route.includes('[') && route.includes(']');
      
      routes.push({
        route,
        file: relPath,
        isDynamic,
        hasCatchAll: route.includes('[...'),
      });
    }
  }
  
  return routes;
}

/**
 * Categorize routes by type
 * @param {Array} routes - List of route objects
 * @returns {Object} Categorized routes
 */
function categorizeRoutes(routes) {
  const categorized = {
    static: [],
    dynamic: [],
    catchAll: [],
  };
  
  for (const route of routes) {
    if (route.hasCatchAll) {
      categorized.catchAll.push(route);
    } else if (route.isDynamic) {
      categorized.dynamic.push(route);
    } else {
      categorized.static.push(route);
    }
  }
  
  return categorized;
}

/**
 * Generate mock IDs for dynamic routes
 * @param {Array} dynamicRoutes - List of dynamic routes
 * @returns {Array} Routes with mock URLs
 */
function generateMockUrls(dynamicRoutes) {
  return dynamicRoutes.map(route => {
    // Replace [id] with mock-id
    const mockUrl = route.route.replace(/\[([^\]]+)\]/g, (match, param) => {
      return `mock-${param}`;
    });
    
    return {
      ...route,
      mockUrl,
      params: route.route.match(/\[([^\]]+)\]/g)?.map(p => p.slice(1, -1)) || [],
    };
  });
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const outputPath = args.includes('--output') 
    ? args[args.indexOf('--output') + 1]
    : DEFAULT_OUTPUT;
  
  console.log('🔍 Scanning pages directory...');
  console.log(`   Path: ${PAGES_DIR}`);
  
  // Scan all routes
  const allRoutes = scanDirectory(PAGES_DIR);
  
  console.log(`\n✅ Found ${allRoutes.length} routes`);
  
  // Categorize routes
  const categorized = categorizeRoutes(allRoutes);
  
  console.log(`   Static routes: ${categorized.static.length}`);
  console.log(`   Dynamic routes: ${categorized.dynamic.length}`);
  console.log(`   Catch-all routes: ${categorized.catchAll.length}`);
  
  // Generate mock URLs for dynamic routes
  const dynamicWithMocks = generateMockUrls(categorized.dynamic);
  const catchAllWithMocks = generateMockUrls(categorized.catchAll);
  
  // Build final output
  const output = {
    generated: new Date().toISOString(),
    total: allRoutes.length,
    static: categorized.static.map(r => r.route),
    dynamic: dynamicWithMocks.map(r => ({
      route: r.route,
      mockUrl: r.mockUrl,
      params: r.params,
    })),
    catchAll: catchAllWithMocks.map(r => ({
      route: r.route,
      mockUrl: r.mockUrl,
      params: r.params,
    })),
    allRoutes: allRoutes.map(r => ({
      route: r.route,
      file: r.file,
      isDynamic: r.isDynamic,
    })),
  };
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write to file
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n📝 Route list written to: ${outputPath}`);
  
  // Print summary
  console.log('\n📊 Route Summary:');
  console.log('\n Static Routes:');
  categorized.static.forEach(r => {
    console.log(`   ${r.route}`);
  });
  
  console.log('\n Dynamic Routes (with mock URLs):');
  dynamicWithMocks.forEach(r => {
    console.log(`   ${r.route} → ${r.mockUrl}`);
  });
  
  if (catchAllWithMocks.length > 0) {
    console.log('\n Catch-All Routes:');
    catchAllWithMocks.forEach(r => {
      console.log(`   ${r.route} → ${r.mockUrl}`);
    });
  }
  
  console.log('\n✨ Done!\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { scanDirectory, categorizeRoutes, generateMockUrls };
