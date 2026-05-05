#!/usr/bin/env node
/**
 * i18n Translation Key Checker
 *
 * Compares all locale files against the English (en) reference and reports:
 * 1. Keys missing in non-English locales
 * 2. Extra keys in non-English locales (not in en)
 * 3. Summary per locale
 *
 * Usage:
 *   node scripts/check-i18n.js [--fix-structure]
 *
 * Options:
 *   --fix-structure  Add missing keys with empty string values
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'public', 'locales');
const referenceLocale = 'en';
const fixStructure = process.argv.includes('--fix-structure');

// Flatten nested JSON into dot-notation keys
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Set a nested key to a value
function setNestedKey(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

// Read all locale directories
const locales = fs.readdirSync(localesDir).filter((dir) => {
  return fs.statSync(path.join(localesDir, dir)).isDirectory();
});

console.log(`📍 Reference locale: ${referenceLocale}`);
console.log(`🌐 Locales found: ${locales.join(', ')}\n`);

// Load reference (en) namespaces
const referenceNamespaces = {};
const enDir = path.join(localesDir, referenceLocale);
for (const file of fs.readdirSync(enDir)) {
  if (!file.endsWith('.json')) continue;
  const ns = file.replace('.json', '');
  const content = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf8'));
  referenceNamespaces[ns] = flattenKeys(content);
}

const totalRefKeys = Object.values(referenceNamespaces).reduce((sum, keys) => sum + keys.length, 0);
console.log(`📚 Reference has ${Object.keys(referenceNamespaces).length} namespaces, ${totalRefKeys} total keys\n`);

let totalMissing = 0;
let totalExtra = 0;
const results = {};

for (const locale of locales) {
  if (locale === referenceLocale) continue;

  const localeDir = path.join(localesDir, locale);
  const missing = [];
  const extra = [];

  for (const [ns, refKeys] of Object.entries(referenceNamespaces)) {
    const filePath = path.join(localeDir, `${ns}.json`);

    if (!fs.existsSync(filePath)) {
      // Entire namespace file missing
      for (const key of refKeys) {
        missing.push(`${ns}:${key}`);
      }
      continue;
    }

    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const localeKeys = new Set(flattenKeys(content));
    const refKeySet = new Set(refKeys);

    // Keys in en but not in this locale
    for (const key of refKeys) {
      if (!localeKeys.has(key)) {
        missing.push(`${ns}:${key}`);
      }
    }

    // Keys in this locale but not in en
    for (const key of localeKeys) {
      if (!refKeySet.has(key)) {
        extra.push(`${ns}:${key}`);
      }
    }

    // Optionally fix structure by adding missing keys
    if (fixStructure && missing.length > 0) {
      const missingInFile = refKeys.filter((k) => !localeKeys.has(k));
      if (missingInFile.length > 0) {
        for (const key of missingInFile) {
          setNestedKey(content, key, '');
        }
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
      }
    }
  }

  results[locale] = { missing, extra };
  totalMissing += missing.length;
  totalExtra += extra.length;
}

// Print results
for (const [locale, { missing, extra }] of Object.entries(results)) {
  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ ${locale}: Complete (all keys present)`);
    continue;
  }

  console.log(`\n⚠️  ${locale}:`);
  if (missing.length > 0) {
    console.log(`   Missing ${missing.length} keys:`);
    for (const key of missing.slice(0, 20)) {
      console.log(`     - ${key}`);
    }
    if (missing.length > 20) {
      console.log(`     ... and ${missing.length - 20} more`);
    }
  }
  if (extra.length > 0) {
    console.log(`   Extra ${extra.length} keys (not in ${referenceLocale}):`);
    for (const key of extra.slice(0, 10)) {
      console.log(`     + ${key}`);
    }
    if (extra.length > 10) {
      console.log(`     ... and ${extra.length - 10} more`);
    }
  }
}

// Summary
console.log('\n' + '─'.repeat(50));
console.log(`📊 Summary: ${totalMissing} missing keys, ${totalExtra} extra keys across ${Object.keys(results).length} locales`);

if (totalMissing > 0 && !fixStructure) {
  console.log(`\n💡 Run with --fix-structure to add missing keys as empty strings`);
}

process.exit(totalMissing > 0 ? 1 : 0);
