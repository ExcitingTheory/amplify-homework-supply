const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Load all locale files
const locales = {};
const localeFiles = [
  'components.json', 'common.json', 'workbook.json', 'auth.json',
  'editor.ai.json', 'pages.json', 'editor.json', 'editor.files.json',
  'editor.blocks.json', 'editor.shared.json', 'editor.authoring.json'
];

function extractKeys(obj, prefix = '') {
  const keys = new Set();
  for (const [key, val] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object') {
      if (val.value !== undefined) {
        keys.add(fullKey);
      } else {
        extractKeys(val, fullKey).forEach(k => keys.add(k));
      }
    }
  }
  return keys;
}

for (const file of localeFiles) {
  const namespace = file.replace('.json', '');
  const content = JSON.parse(fs.readFileSync(`public/locales/en/${file}`, 'utf8'));
  locales[namespace] = extractKeys(content);
}

// Find all t() calls in source files
const sourceFiles = glob.sync('src/**/*.{js,jsx,ts,tsx}', {
  ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
});

const missingKeys = new Map();

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Extract namespace from useTranslation
  const namespaceMatch = content.match(/useTranslation\(['"]([^'"]+)['"]\)/g);
  const namespaces = namespaceMatch ? 
    namespaceMatch.map(m => m.match(/useTranslation\(['"]([^'"]+)['"]\)/)[1]) : 
    [];
  
  // Find all t() calls with string literals
  const tCallRegex = /\bt\(['"`]([^'"`]+)['"`]\)/g;
  let match;
  
  while ((match = tCallRegex.exec(content)) !== null) {
    const fullKey = match[1];
    
    // Skip template literals with ${} - these are dynamic keys
    if (fullKey.includes('${')) {
      continue;
    }
    
    // Check if key has explicit namespace prefix
    if (fullKey.includes(':')) {
      const [explicitNs, ...keyParts] = fullKey.split(':');
      const key = keyParts.join(':');
      
      const keyExists = locales[explicitNs] && locales[explicitNs].has(key);
      
      if (!keyExists) {
        const missingKey = `${explicitNs}:${key}`;
        if (!missingKeys.has(missingKey)) {
          missingKeys.set(missingKey, []);
        }
        const shortFile = file.replace('src/', '');
        if (!missingKeys.get(missingKey).includes(shortFile)) {
          missingKeys.get(missingKey).push(shortFile);
        }
      }
    } else {
      // Use implicit namespace from useTranslation
      const key = fullKey;
      
      // Check each namespace
      for (const ns of namespaces) {
        const keyExists = locales[ns] && locales[ns].has(key);
        
        if (!keyExists) {
          const missingKey = `${ns}:${key}`;
          if (!missingKeys.has(missingKey)) {
            missingKeys.set(missingKey, []);
          }
          const shortFile = file.replace('src/', '');
          if (!missingKeys.get(missingKey).includes(shortFile)) {
            missingKeys.get(missingKey).push(shortFile);
          }
        }
      }
    }
  }
}

if (missingKeys.size > 0) {
  console.log(`\nFound ${missingKeys.size} missing translation keys:\n`);
  
  const sorted = Array.from(missingKeys.entries()).sort();
  for (const [key, files] of sorted) {
    console.log(`❌ ${key}`);
    console.log(`   Used in: ${files[0]}`);
    if (files.length > 1) {
      console.log(`   (and ${files.length - 1} more files)`);
    }
  }
} else {
  console.log('\n✅ No missing translation keys found!');
}
