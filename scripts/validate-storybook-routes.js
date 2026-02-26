#!/usr/bin/env node
/**
 * @fileoverview Validate that all Next.js pages have corresponding Storybook route mappings
 * 
 * This script:
 * 1. Scans the pages/ directory to find all routes (static and dynamic)
 * 2. Extracts all Storybook stories from pages.stories.tsx
 * 3. Compares actual routes with ROUTE_TO_STORY_MAP in .storybook/code/route-map.ts
 * 4. Reports missing routes and suggests updates
 * 
 * Usage:
 *   node scripts/validate-storybook-routes.js
 *   node scripts/validate-storybook-routes.js --update  # Updates route-map.ts
 * 
 * @module scripts/validate-storybook-routes
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const PAGES_DIR = path.join(__dirname, '../pages');
const ROUTE_MAP_FILE = path.join(__dirname, '../.storybook/code/route-map.ts');
const STORIES_FILE = path.join(__dirname, '../src/stories/pages.stories.tsx');

/**
 * Extract all routes from the pages directory
 * 
 * @returns {Array<{route: string, filePath: string, isDynamic: boolean}>}
 */
function extractPagesRoutes() {
  const routes = [];
  
  function walkDir(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const dirName = entry.name;
        const newPrefix = prefix + '/' + dirName;
        walkDir(fullPath, newPrefix);
      } else if (entry.isFile()) {
        // Only process .jsx and .tsx files (not .mdx, .txt, etc.)
        if (!entry.name.match(/\.(jsx|tsx)$/)) {
          continue;
        }
        
        // Skip _app.jsx and _document.jsx (Next.js special files)
        if (entry.name.startsWith('_')) {
          continue;
        }
        
        // Convert filename to route
        let route = prefix;
        
        if (entry.name === 'index.jsx' || entry.name === 'index.tsx') {
          // Index files map to the directory route
          route = prefix || '/';
        } else {
          // Remove .jsx/.tsx extension
          const name = entry.name.replace(/\.(jsx|tsx)$/, '');
          route = prefix + '/' + name;
        }
        
        // Detect dynamic routes
        const isDynamic = route.includes('[') && route.includes(']');
        
        routes.push({
          route,
          filePath: path.relative(PAGES_DIR, fullPath),
          isDynamic,
        });
      }
    }
  }
  
  walkDir(PAGES_DIR);
  
  return routes.sort((a, b) => a.route.localeCompare(b.route));
}

/**
 * Extract ROUTE_TO_STORY_MAP from route-map.ts
 * 
 * @returns {Object<string, string>}
 */
function extractExistingRouteMap() {
  const content = fs.readFileSync(ROUTE_MAP_FILE, 'utf-8');
  
  // Parse the ROUTE_TO_STORY_MAP object
  const mapMatch = content.match(/export const ROUTE_TO_STORY_MAP[^=]*=\s*{([^}]+)}/s);
  
  if (!mapMatch) {
    throw new Error('Could not find ROUTE_TO_STORY_MAP in route-map.ts');
  }
  
  const mapContent = mapMatch[1];
  const routes = {};
  
  // Parse each route entry (handles both single and multi-line comments)
  const lines = mapContent.split('\n');
  for (const line of lines) {
    const match = line.match(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/);
    if (match) {
      routes[match[1]] = match[2];
    }
  }
  
  return routes;
}

/**
 * Extract all story exports from pages.stories.tsx
 * 
 * @returns {Array<{name: string, storyPath: string}>}
 */
function extractStorybookStories() {
  const content = fs.readFileSync(STORIES_FILE, 'utf-8');
  
  const stories = [];
  
  // Extract the meta title (story path prefix)
  const metaMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
  const titlePrefix = metaMatch ? metaMatch[1] : 'Pages/Application Pages';
  
  // Convert title to kebab-case for story path
  const storyPrefix = titlePrefix
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-');     // Collapse multiple hyphens
  
  // Find all exported story objects
  const exportMatches = content.matchAll(/export const (\w+)\s*=/g);
  
  for (const match of exportMatches) {
    const storyName = match[1];
    
    // Skip default export
    if (storyName === 'default') {
      continue;
    }
    
    // Convert story name to kebab-case
    const storySlug = storyName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    const storyPath = `?path=/story/${storyPrefix}--${storySlug}`;
    
    stories.push({
      name: storyName,
      storyPath,
    });
  }
  
  return stories;
}

/**
 * Generate suggested route mappings for missing routes
 * 
 * @param {Array} routes - Extracted page routes
 * @param {Array} stories - Extracted Storybook stories
 * @param {Object} existingMap - Existing route map
 * @returns {Object} Suggested additions to route map
 */
function generateSuggestedMappings(routes, stories, existingMap) {
  const suggestions = {};
  
  for (const { route, isDynamic } of routes) {
    // Skip if already mapped
    if (existingMap[route]) {
      continue;
    }
    
    // Try to find a matching story
    let matchedStory = null;
    
    // Simple heuristic: match based on route name
    const routeName = route.split('/').filter(Boolean).pop() || 'index';
    const normalizedRouteName = routeName.replace('[id]', '').toLowerCase();
    
    for (const story of stories) {
      const storyName = story.name.toLowerCase();
      if (storyName.includes(normalizedRouteName) || normalizedRouteName.includes(storyName)) {
        matchedStory = story.storyPath;
        break;
      }
    }
    
    if (matchedStory) {
      suggestions[route] = matchedStory;
    } else {
      // No match found - use placeholder
      suggestions[route] = `?path=/story/pages-application-pages--${normalizedRouteName}`;
    }
  }
  
  return suggestions;
}

/**
 * Update route-map.ts with new mappings
 * 
 * @param {Object} newMappings - Routes to add
 */
function updateRouteMapFile(newMappings) {
  let content = fs.readFileSync(ROUTE_MAP_FILE, 'utf-8');
  
  // Find the ROUTE_TO_STORY_MAP section
  const mapMatch = content.match(/(export const ROUTE_TO_STORY_MAP[^=]*=\s*{)([^}]+)(};)/s);
  
  if (!mapMatch) {
    throw new Error('Could not find ROUTE_TO_STORY_MAP in route-map.ts');
  }
  
  const prefix = mapMatch[1];
  const existingContent = mapMatch[2];
  const suffix = mapMatch[3];
  
  // Generate new entries
  const newEntries = Object.entries(newMappings)
    .map(([route, storyPath]) => `  '${route}': '${storyPath}',`)
    .join('\n');
  
  // Combine existing and new (add new entries at the end before suffix)
  const updatedMap = prefix + existingContent.trimEnd() + '\n' + newEntries + '\n' + suffix;
  
  // Replace in content
  content = content.replace(
    /export const ROUTE_TO_STORY_MAP[^=]*=\s*{[^}]+};/s,
    updatedMap
  );
  
  // Write back
  fs.writeFileSync(ROUTE_MAP_FILE, content, 'utf-8');
  
  console.log(`${colors.green}✓${colors.reset} Updated ${ROUTE_MAP_FILE}`);
}

/**
 * Main validation function
 */
function validateRoutes() {
  console.log(`${colors.bold}${colors.cyan}Storybook Route Validation${colors.reset}\n`);
  
  // Extract data
  console.log('📁 Scanning pages directory...');
  const routes = extractPagesRoutes();
  console.log(`   Found ${routes.length} routes\n`);
  
  console.log('📖 Parsing Storybook stories...');
  const stories = extractStorybookStories();
  console.log(`   Found ${stories.length} stories\n`);
  
  console.log('🗺️  Reading route map...');
  const existingMap = extractExistingRouteMap();
  console.log(`   Found ${Object.keys(existingMap).length} mapped routes\n`);
  
  // Compare
  const missing = [];
  const covered = [];
  
  for (const { route, filePath, isDynamic } of routes) {
    if (existingMap[route]) {
      covered.push({ route, filePath, storyPath: existingMap[route] });
    } else {
      missing.push({ route, filePath, isDynamic });
    }
  }
  
  // Report results
  console.log(`${colors.bold}Results:${colors.reset}`);
  console.log(`${colors.green}✓ Covered routes: ${covered.length}${colors.reset}`);
  console.log(`${colors.red}✗ Missing routes: ${missing.length}${colors.reset}\n`);
  
  if (missing.length > 0) {
    console.log(`${colors.bold}${colors.yellow}Missing Route Mappings:${colors.reset}`);
    const suggestions = generateSuggestedMappings(routes, stories, existingMap);
    
    for (const { route, filePath } of missing) {
      console.log(`\n${colors.red}✗${colors.reset} ${colors.bold}${route}${colors.reset}`);
      console.log(`  File: ${filePath}`);
      if (suggestions[route]) {
        console.log(`  ${colors.cyan}Suggested:${colors.reset} '${route}': '${suggestions[route]}'`);
      }
    }
    
    // Check for --update flag
    if (process.argv.includes('--update')) {
      console.log(`\n${colors.yellow}Updating route-map.ts...${colors.reset}`);
      updateRouteMapFile(suggestions);
      console.log(`${colors.green}✓ Route map updated successfully${colors.reset}`);
    } else {
      console.log(`\n${colors.cyan}ℹ Run with --update flag to automatically add these routes${colors.reset}`);
    }
    
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✓ All routes are mapped!${colors.reset}\n`);
    
    // Show coverage details
    console.log(`${colors.bold}Coverage Details:${colors.reset}`);
    for (const { route, storyPath } of covered) {
      console.log(`${colors.green}✓${colors.reset} ${route} → ${storyPath}`);
    }
  }
  
  console.log();
}

// Run the validation
try {
  validateRoutes();
} catch (error) {
  console.error(`${colors.red}Error:${colors.reset}`, error.message);
  process.exit(1);
}
