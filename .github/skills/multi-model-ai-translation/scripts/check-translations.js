#!/usr/bin/env node
/**
 * Translation Key Validator
 * 
 * Scans all source files for translation keys and verifies they exist
 * in the corresponding locale files.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Load all locale files
const localesDir = path.join(__dirname, '../public/locales/en');
const namespaces = {};

fs.readdirSync(localesDir).forEach(file => {
  if (file.endsWith('.json') && !file.endsWith('.backup')) {
    const namespace = file.replace('.json', '');
    const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
    namespaces[namespace] = JSON.parse(content);
  }
});

console.log('📚 Loaded namespaces:', Object.keys(namespaces).join(', '));

// Find all source files
const sourceFiles = glob.sync('**/*.{js,jsx,ts,tsx}', {
  cwd: path.join(__dirname, '..'),
  ignore: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'dist/**', '.storybook/**', 'scripts/**'],
  absolute: true
});

console.log(`\n🔍 Scanning ${sourceFiles.length} files...\n`);

const issues = [];
const usedKeys = new Set();

sourceFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Find useTranslation declarations
  const useTranslationMatch = content.match(/useTranslation\(['"](.*?)['"]\)/g) || [];
  const namespaceInFile = useTranslationMatch[0]?.match(/useTranslation\(['"](.*?)['"]\)/)?.[1] || 
                           (content.includes('useTranslation()') ? 'common' : null);
  
  // Find all t() calls
  const tCallRegex = /t\(['"]((?:[^:'"]+:)?[^'"]+)['"]/g;
  let match;
  
  while ((match = tCallRegex.exec(content)) !== null) {
    const keyPath = match[1];
    usedKeys.add(keyPath);
    
    // Parse namespace and key
    let namespace, key;
    if (keyPath.includes(':')) {
      [namespace, key] = keyPath.split(':');
    } else {
      namespace = namespaceInFile;
      key = keyPath;
    }
    
    if (!namespace) {
      issues.push({
        file: relativePath,
        line: content.substring(0, match.index).split('\n').length,
        issue: `No namespace specified for key: ${keyPath}`,
        severity: 'warning'
      });
      continue;
    }
    
    // Check if namespace exists
    if (!namespaces[namespace]) {
      issues.push({
        file: relativePath,
        line: content.substring(0, match.index).split('\n').length,
        issue: `Namespace "${namespace}" not found (key: ${key})`,
        severity: 'error'
      });
      continue;
    }
    
    // Check if key exists
    const keys = key.split('.');
    let current = namespaces[namespace];
    let found = true;
    
    for (const k of keys) {
      if (!current || typeof current !== 'object' || !(k in current)) {
        found = false;
        break;
      }
      current = current[k];
    }
    
    if (!found) {
      issues.push({
        file: relativePath,
        line: content.substring(0, match.index).split('\n').length,
        issue: `Key "${key}" not found in namespace "${namespace}"`,
        severity: 'error'
      });
    }
  }
});

// Report issues
if (issues.length === 0) {
  console.log('✅ All translation keys are valid!\n');
  console.log(`Found ${usedKeys.size} unique translation keys in use.`);
} else {
  console.log(`❌ Found ${issues.length} issues:\n`);
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (errors.length > 0) {
    console.log(`\n🔴 Errors (${errors.length}):`);
    errors.forEach(({ file, line, issue }) => {
      console.log(`  ${file}:${line} - ${issue}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach(({ file, line, issue }) => {
      console.log(`  ${file}:${line} - ${issue}`);
    });
  }
  
  process.exit(1);
}
