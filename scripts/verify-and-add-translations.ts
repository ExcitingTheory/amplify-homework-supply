#!/usr/bin/env tsx

/**
 * Translation Verification and Auto-Add Script
 * 
 * Automatically verifies translation keys and adds missing ones.
 * Features:
 * - Detects all useTranslation() namespaces in src/
 * - Extracts all t('key') calls  
 * - Checks if keys exist in expected namespace OR any other namespace
 * - Flags namespace mismatches (key in wrong namespace)
 * - Adds truly missing keys with placeholder values
 * - Generates metadata report
 * 
 * Usage: npx tsx scripts/verify-and-add-translations.ts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SRC_DIR = path.join(process.cwd(), 'src');
const LOCALE_DIR = path.join(process.cwd(), 'public/locales/en');

interface TranslationCall {
  file: string;
  namespace: string;
  key: string;
  line: number;
}

interface MissingTranslation {
  namespace: string;
  key: string;
  usedInFiles: string[];
  addedValue: string;
}

interface NamespaceMismatch {
  key: string;
  expectedNamespace: string;
  foundInNamespace: string;
  usedInFiles: string[];
}

interface TranslationReport {
  totalFiles: number;
  totalCalls: number;
  existingKeys: number;
  missingKeys: number;
  addedKeys: MissingTranslation[];
  namespaceMismatches: NamespaceMismatch[];
  byNamespace: Record<string, {
    total: number;
    existing: number;
    missing: number;
    keys: string[];
  }>;
}

/**
 * Extract namespace from useTranslation() call
 */
function extractNamespaceFromLine(line: string): string | null {
  const match = line.match(/useTranslation\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  return match ? match[1] : null;
}

/**
 * Extract all t('key') calls from a line
 */
function extractTranslationKeys(line: string): string[] {
  const keys: string[] = [];
  const regex = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = regex.exec(line)) !== null) {
    const key = match[1];
    // Skip template literals and concatenations
    if (!key.includes('${') && !key.includes('+')) {
      keys.push(key);
    }
  }
  
  return keys;
}

/**
 * Find namespace usage in a file
 */
function findNamespaceUsage(filePath: string): Map<string, Set<string>> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const namespaces = new Set<string>();
  const keysByNamespace = new Map<string, Set<string>>();
  
  // Find all useTranslation declarations
  for (let i = 0; i < lines.length; i++) {
    const ns = extractNamespaceFromLine(lines[i]);
    if (ns) {
      namespaces.add(ns);
      if (!keysByNamespace.has(ns)) {
        keysByNamespace.set(ns, new Set());
      }
    }
  }
  
  // Default to 'common' if no namespace found
  if (namespaces.size === 0) {
    namespaces.add('common');
    keysByNamespace.set('common', new Set());
  }
  
  // Extract all translation keys
  for (let i = 0; i < lines.length; i++) {
    const keys = extractTranslationKeys(lines[i]);
    
    for (const key of keys) {
      // If key has namespace prefix (e.g., "components:key")
      if (key.includes(':')) {
        const [ns, actualKey] = key.split(':', 2);
        if (!keysByNamespace.has(ns)) {
          keysByNamespace.set(ns, new Set());
        }
        keysByNamespace.get(ns)!.add(actualKey);
      } else {
        // Assign to first declared namespace (or common)
        const ns = namespaces.values().next().value || 'common';
        keysByNamespace.get(ns)!.add(key);
      }
    }
  }
  
  return keysByNamespace;
}

/**
 * Extract all translation calls from src directory
 */
async function extractAllTranslationCalls(): Promise<TranslationCall[]> {
  const pattern = path.join(SRC_DIR, '**/*.{ts,tsx,js,jsx}');
  const files = await glob(pattern);
  
  const calls: TranslationCall[] = [];
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const keysByNamespace = findNamespaceUsage(file);
    
    for (const [namespace, keys] of keysByNamespace.entries()) {
      for (const key of keys) {
        calls.push({
          file: relativePath,
          namespace,
          key,
          line: 0 // Line number not needed for this use case
        });
      }
    }
  }
  
  return calls;
}

/**
 * Check if a key exists in translations (supports nested keys like "foo.bar.baz")
 */
function keyExists(translations: any, key: string): boolean {
  const parts = key.split('.');
  let current = translations;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  
  return true;
}

/**
 * Set a nested key in an object
 */
function setNestedKey(obj: any, key: string, value: string): void {
  const parts = key.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

/**
 * Generate a placeholder value from a key
 */
function generatePlaceholder(key: string): string {
  const lastPart = key.split('.').pop() || key;
  
  // Convert camelCase or snake_case to Title Case
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Sort object keys recursively (alphabetically)
 */
function sortObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  
  const sorted: any = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  
  return sorted;
}

/**
 * Load translation JSON file
 */
function loadTranslationFile(namespace: string): any {
  const filePath = path.join(LOCALE_DIR, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Translation file not found: ${filePath}`);
    return {};
  }
  
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error);
    return {};
  }
}

/**
 * Load all translation files
 */
function loadAllTranslationFiles(): Map<string, any> {
  const files = fs.readdirSync(LOCALE_DIR).filter(f => f.endsWith('.json'));
  const allTranslations = new Map<string, any>();
  
  for (const file of files) {
    const namespace = file.replace('.json', '');
    allTranslations.set(namespace, loadTranslationFile(namespace));
  }
  
  return allTranslations;
}

/**
 * Find which namespace contains a key
 */
function findKeyInNamespaces(key: string, allTranslations: Map<string, any>): string | null {
  for (const [namespace, translations] of allTranslations.entries()) {
    if (keyExists(translations, key)) {
      return namespace;
    }
  }
  return null;
}

/**
 * Save translation JSON file with sorted keys
 */
function saveTranslationFile(namespace: string, translations: any): void {
  const filePath = path.join(LOCALE_DIR, `${namespace}.json`);
  const sorted = sortObjectKeys(translations);
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

/**
 * Main verification and auto-add logic
 */
async function verifyAndAddTranslations(): Promise<TranslationReport> {
  console.log('🔍 Scanning src directory for translation calls...\n');
  
  const calls = await extractAllTranslationCalls();
  const allTranslations = loadAllTranslationFiles();
  
  const report: TranslationReport = {
    totalFiles: new Set(calls.map(c => c.file)).size,
    totalCalls: calls.length,
    existingKeys: 0,
    missingKeys: 0,
    addedKeys: [],
    namespaceMismatches: [],
    byNamespace: {}
  };
  
  // Group by namespace
  const byNamespace = new Map<string, TranslationCall[]>();
  for (const call of calls) {
    if (!byNamespace.has(call.namespace)) {
      byNamespace.set(call.namespace, []);
    }
    byNamespace.get(call.namespace)!.push(call);
  }
  
  // Check each namespace
  for (const [namespace, namespaceCalls] of byNamespace.entries()) {
    console.log(`\n📦 Namespace: ${namespace}`);
    console.log(`   ${namespaceCalls.length} translation calls found`);
    
    const translations = loadTranslationFile(namespace);
    const missingInNamespace: Map<string, string[]> = new Map();
    let existing = 0;
    let missing = 0;
    
    // Check each key
    for (const call of namespaceCalls) {
      if (keyExists(translations, call.key)) {
        existing++;
      } else {
        // Key not in expected namespace - check all namespaces
        const foundInNamespace = findKeyInNamespaces(call.key, allTranslations);
        
        if (foundInNamespace && foundInNamespace !== namespace) {
          // Key exists in different namespace
          console.log(`   ⚠️  ${call.key}: found in ${foundInNamespace} (expected ${namespace})`);
          
          // Check if already in mismatches
          const existingMismatch = report.namespaceMismatches.find(
            m => m.key === call.key && m.expectedNamespace === namespace && m.foundInNamespace === foundInNamespace
          );
          
          if (existingMismatch) {
            existingMismatch.usedInFiles.push(call.file);
          } else {
            report.namespaceMismatches.push({
              key: call.key,
              expectedNamespace: namespace,
              foundInNamespace,
              usedInFiles: [call.file]
            });
          }
          
          existing++; // Count as existing since it's found somewhere
        } else {
          // Truly missing
          missing++;
          
          if (!missingInNamespace.has(call.key)) {
            missingInNamespace.set(call.key, []);
          }
          missingInNamespace.get(call.key)!.push(call.file);
        }
      }
    }
    
    console.log(`   ✅ ${existing} existing`);
    console.log(`   ❌ ${missing} missing`);
    
    // Add missing keys
    if (missingInNamespace.size > 0) {
      console.log(`\n   Adding ${missingInNamespace.size} missing keys to ${namespace}.json...`);
      
      for (const [key, files] of missingInNamespace.entries()) {
        const placeholder = generatePlaceholder(key);
        setNestedKey(translations, key, placeholder);
        
        report.addedKeys.push({
          namespace,
          key,
          usedInFiles: files,
          addedValue: placeholder
        });
        
        console.log(`   + ${key}: "${placeholder}" (used in ${files.length} file${files.length > 1 ? 's' : ''})`);
      }
      
      saveTranslationFile(namespace, translations);
    }
    
    report.existingKeys += existing;
    report.missingKeys += missing;
    report.byNamespace[namespace] = {
      total: namespaceCalls.length,
      existing,
      missing,
      keys: Array.from(new Set(namespaceCalls.map(c => c.key)))
    };
  }
  
  return report;
}

/**
 * Generate a markdown report for metadata generation
 */
function generateMetadataReport(report: TranslationReport): string {
  let md = '# Translation Verification Report\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  
  md += '## Summary\n\n';
  md += `- **Total files scanned**: ${report.totalFiles}\n`;
  md += `- **Total translation calls**: ${report.totalCalls}\n`;
  md += `- **Existing keys**: ${report.existingKeys}\n`;
  md += `- **Missing keys added**: ${report.missingKeys}\n`;
  md += `- **Namespace mismatches**: ${report.namespaceMismatches.length}\n\n`;
  
  // Namespace mismatches section
  if (report.namespaceMismatches.length > 0) {
    md += '## ⚠️ Namespace Mismatches\n\n';
    md += 'These keys exist in a different namespace than expected. This may indicate:\n';
    md += '- Wrong `useTranslation()` namespace in the component\n';
    md += '- Key should be moved to the correct namespace\n';
    md += '- Duplicate keys across namespaces\n\n';
    
    for (const mismatch of report.namespaceMismatches) {
      md += `### ${mismatch.key}\n\n`;
      md += `- **Expected namespace**: \`${mismatch.expectedNamespace}\`\n`;
      md += `- **Found in namespace**: \`${mismatch.foundInNamespace}\`\n`;
      md += `- **Used in**:\n`;
      for (const file of [...new Set(mismatch.usedInFiles)]) {
        md += `  - \`${file}\`\n`;
      }
      md += '\n';
    }
  }
  
  // Newly added keys section
  if (report.addedKeys.length > 0) {
    md += '## Newly Added Keys (Need Metadata)\n\n';
    md += 'These keys were added with placeholder values and need metadata entries:\n\n';
    
    for (const item of report.addedKeys) {
      md += `### ${item.namespace}.${item.key}\n\n`;
      md += `- **Value**: "${item.addedValue}"\n`;
      md += `- **Used in**:\n`;
      for (const file of item.usedInFiles) {
        md += `  - \`${file}\`\n`;
      }
      md += '\n';
    }
    
    md += '## Next Steps\n\n';
    md += '1. **Fix namespace mismatches** - Update `useTranslation()` calls or move keys\n';
    md += '2. Review generated placeholder values\n';
    md += '3. Generate metadata entries using `auto-generate-metadata.ts`\n';
    md += '4. Review and refine translations\n';
    md += '5. Run translation workflow for other locales\n';
  }
  
  return md;
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = await verifyAndAddTranslations();
    
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 FINAL REPORT');
    console.log('='.repeat(80));
    console.log(`\n✅ Verified ${report.totalCalls} translation calls across ${report.totalFiles} files`);
    console.log(`✅ ${report.existingKeys} keys already exist`);
    console.log(`➕ ${report.missingKeys} missing keys were added`);
    
    if (report.namespaceMismatches.length > 0) {
      console.log(`⚠️  ${report.namespaceMismatches.length} namespace mismatches found\n`);
    } else {
      console.log('');
    }
    
    if (report.namespaceMismatches.length > 0 || report.addedKeys.length > 0) {
      const reportPath = path.join(process.cwd(), 'translation-verification-report.md');
      const markdown = generateMetadataReport(report);
      fs.writeFileSync(reportPath, markdown, 'utf-8');
      
      console.log(`📝 Detailed report saved to: ${path.basename(reportPath)}`);
      
      if (report.namespaceMismatches.length > 0) {
        console.log('\n⚠️  Namespace Mismatches:');
        const mismatchesByNs = new Map<string, NamespaceMismatch[]>();
        for (const mismatch of report.namespaceMismatches.slice(0, 10)) {
          const key = `${mismatch.expectedNamespace} → ${mismatch.foundInNamespace}`;
          if (!mismatchesByNs.has(key)) {
            mismatchesByNs.set(key, []);
          }
          mismatchesByNs.get(key)!.push(mismatch);
        }
        
        for (const [direction, mismatches] of mismatchesByNs.entries()) {
          console.log(`\n   ${direction}:`);
          mismatches.slice(0, 3).forEach(m => console.log(`     - ${m.key}`));
        }
        
        if (report.namespaceMismatches.length > 10) {
          console.log(`\n   ... and ${report.namespaceMismatches.length - 10} more (see report)`);
        }
      }
      
      if (report.addedKeys.length > 0) {
        console.log('\n📋 Keys needing metadata:');
        
        const byNs = new Map<string, string[]>();
        for (const item of report.addedKeys) {
          if (!byNs.has(item.namespace)) {
            byNs.set(item.namespace, []);
          }
          byNs.get(item.namespace)!.push(item.key);
        }
        
        for (const [ns, keys] of byNs.entries()) {
          console.log(`\n   ${ns}:`);
          keys.slice(0, 5).forEach(k => console.log(`     - ${k}`));
          if (keys.length > 5) {
            console.log(`     ... and ${keys.length - 5} more`);
          }
        }
        
        console.log('\n💡 Run metadata generation next:');
        console.log('   npx tsx .github/skills/extract-code-documentation/scripts/auto-generate-metadata.ts\n');
      }
    } else {
      console.log('🎉 All translation keys are present and in correct namespaces!\n');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
