#!/usr/bin/env node

/**
 * Flatten locale files from {key: {_meta: {...}, value: "text"}} 
 * to {key: "text"} format for i18next compatibility.
 * 
 * Extracts metadata to separate .meta.json files in translation-cache/
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const LOCALES_DIR = path.join(__dirname, '../public/locales');
const CACHE_DIR = path.join(__dirname, '../translation-cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Recursively flatten an object, extracting _meta and value
 */
function flattenTranslations(obj, metadata = {}, prefix = '') {
  const flattened = {};
  
  for (const [key, val] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (val && typeof val === 'object') {
      // Check if this is a leaf node with _meta and value
      if (val.hasOwnProperty('value') && val.hasOwnProperty('_meta')) {
        flattened[key] = val.value;
        metadata[fullKey] = val._meta;
      } else if (val.hasOwnProperty('value')) {
        // Has value but no _meta
        flattened[key] = val.value;
      } else {
        // Nested object - recurse
        const nested = flattenTranslations(val, metadata, fullKey);
        if (Object.keys(nested).length > 0) {
          flattened[key] = nested;
        }
      }
    } else {
      // Already a plain string value
      flattened[key] = val;
    }
  }
  
  return flattened;
}

/**
 * Process a single locale file
 */
function processLocaleFile(filePath) {
  const relativePath = path.relative(LOCALES_DIR, filePath);
  const locale = path.dirname(relativePath);
  const namespace = path.basename(filePath, '.json');
  
  console.log(`Processing ${locale}/${namespace}.json...`);
  
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const metadata = {};
    const flattened = flattenTranslations(content, metadata);
    
    // Write flattened translations back to locale file
    fs.writeFileSync(
      filePath,
      JSON.stringify(flattened, null, 2) + '\n',
      'utf8'
    );
    
    // Write metadata to cache if any exists
    if (Object.keys(metadata).length > 0) {
      const cacheDir = path.join(CACHE_DIR, locale);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      const metaPath = path.join(cacheDir, `${namespace}.meta.json`);
      fs.writeFileSync(
        metaPath,
        JSON.stringify(metadata, null, 2) + '\n',
        'utf8'
      );
      
      console.log(`  ✓ Extracted ${Object.keys(metadata).length} metadata entries to ${locale}/${namespace}.meta.json`);
    }
    
    console.log(`  ✓ Flattened ${filePath}`);
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message);
  }
}

// Find all locale JSON files
const localeFiles = glob.sync('*/!(*.meta).json', {
  cwd: LOCALES_DIR,
  absolute: true,
});

console.log(`Found ${localeFiles.length} locale files to process\n`);

// Process all files
localeFiles.forEach(processLocaleFile);

console.log('\n✅ Locale flattening complete!');
console.log(`   Translations: public/locales/`);
console.log(`   Metadata cache: translation-cache/`);
