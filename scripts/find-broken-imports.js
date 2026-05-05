#!/usr/bin/env node
/**
 * Find broken relative imports in story files.
 * Usage: node scripts/find-broken-imports.js
 */
const fs = require('fs');
const path = require('path');

function globSync(dir, pattern) {
  const results = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        walk(full);
      } else if (entry.name.match(pattern)) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

const root = path.resolve(__dirname, '..');
const storyPattern = /\.stories\.(jsx?|tsx?)$/;
const stories = [
  ...globSync(path.join(root, 'src'), storyPattern),
  ...globSync(path.join(root, '.storybook'), storyPattern),
];

const broken = [];
const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.css', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];

for (const file of stories) {
  const content = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    const resolved = path.resolve(dir, importPath);
    const found = extensions.some(ext => fs.existsSync(resolved + ext));
    if (!found) {
      const rel = path.relative(root, file);
      broken.push(`${rel}: ${importPath}`);
    }
  }
}

broken.forEach(b => console.log(b));
console.log(`\n--- Total broken imports: ${broken.length} ---`);
