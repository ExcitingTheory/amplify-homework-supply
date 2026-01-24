/**
 * Extract Material UI prop names from TypeScript definitions
 * This runs at build time to automatically populate ESLint exclusions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Common MUI packages to scan
const muiPackages = [
  '@mui/material',
  '@mui/system',
  '@mui/icons-material',
];

// Prop name pattern - matches: propName?: type; or propName: type;
const propPattern = /^\s*(\w+)\??\s*:/gm;

// Props to always exclude (common across all components)
const alwaysExclude = new Set([
  'className', 'style', 'sx', 'component', 'ref', 'key',
  'id', 'name', 'type', 'role', 'aria-label', 'aria-labelledby',
  'aria-describedby', 'data-testid', 'slot', 'slotProps',
]);

function extractPropsFromFile(filePath) {
  const props = new Set();
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let match;
    
    while ((match = propPattern.exec(content)) !== null) {
      const propName = match[1];
      // Skip common non-prop identifiers
      if (!['interface', 'type', 'export', 'import', 'function', 'const', 'let', 'var'].includes(propName)) {
        props.add(propName);
      }
    }
  } catch (err) {
    // Silently skip files that can't be read
  }
  
  return props;
}

function scanDirectory(dir, props = new Set()) {
  if (!fs.existsSync(dir)) return props;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules subdirectories, test files, and stories
      if (!['node_modules', '__tests__', 'test', 'tests', 'stories'].includes(entry.name)) {
        scanDirectory(fullPath, props);
      }
    } else if (entry.name.endsWith('.d.ts') || entry.name.endsWith('.ts')) {
      const fileProps = extractPropsFromFile(fullPath);
      fileProps.forEach(prop => props.add(prop));
    }
  }
  
  return props;
}

function main() {
  const allProps = new Set(alwaysExclude);
  
  console.log('🔍 Scanning Material UI packages for prop names...');
  
  for (const pkg of muiPackages) {
    const pkgPath = path.join(rootDir, 'node_modules', pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`  📦 Scanning ${pkg}...`);
      scanDirectory(pkgPath, allProps);
    } else {
      console.log(`  ⚠️  Package ${pkg} not found`);
    }
  }
  
  // Convert to sorted array
  const propList = Array.from(allProps).sort();
  
  console.log(`\n✅ Found ${propList.length} unique prop names`);
  
  // Write to a JSON file
  const outputPath = path.join(rootDir, 'scripts', 'mui-props.json');
  fs.writeFileSync(outputPath, JSON.stringify(propList, null, 2));
  
  console.log(`📝 Written to ${outputPath}`);
  
  return propList;
}

const props = main();
export default props;
