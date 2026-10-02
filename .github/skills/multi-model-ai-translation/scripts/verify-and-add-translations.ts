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

const SRC_DIRS = ['src', 'app'].map((d) => path.join(process.cwd(), d));
const LOCALE_DIR = path.join(process.cwd(), 'public/locales/en');

// Keep in sync with the `namespaces` array in src/i18n/request.ts.
// Dotted entries are nested under their parent segment, not separate root keys.
const KNOWN_NAMESPACES = [
  'auth',
  'common',
  'components',
  'pages',
  'editor',
  'editor.authoring',
  'editor.files',
  'editor.ai',
  'editor.blocks',
  'editor.shared',
  'workbook',
];

interface TranslationCall {
  file: string;
  namespace: string;
  key: string;
  line: number;
  // Other namespaces the same variable name (e.g. `t`) was bound to
  // elsewhere in this file. Regex-based extraction can't see JS scoping, so
  // when a file reuses a varName across multiple components/functions with
  // different namespaces, we can't tell which scope a given t() call is in -
  // treat the key as valid if found in any of these sibling namespaces too.
  ambiguousNamespaces: string[];
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
  noNamespaceFiles: string[];
  byNamespace: Record<string, {
    total: number;
    existing: number;
    missing: number;
    keys: string[];
  }>;
}

/**
 * Resolve a useTranslations()/getTranslations() namespace argument to the
 * locale file and nested key prefix it actually maps to, mirroring the
 * longest-prefix nesting rules in src/i18n/request.ts (dotted namespaces
 * nest under their parent segment rather than being separate files).
 */
function resolveNamespace(used: string): { file: string; prefix: string } {
  const candidates = KNOWN_NAMESPACES.filter(
    (ns) => used === ns || used.startsWith(`${ns}.`),
  ).sort((a, b) => b.length - a.length);

  const file = candidates[0] ?? used;
  const prefix = used === file ? '' : used.slice(file.length + 1);
  return { file, prefix };
}

/**
 * Find every useTranslations()/getTranslations() hook binding in a file,
 * supporting next-intl's string-arg, object-arg, and no-arg call forms.
 */
function findHookBindings(
  content: string,
): Array<{ varName: string; namespace: string | null }> {
  const bindings: Array<{ varName: string; namespace: string | null }> = [];
  const seen = new Set<string>();
  const hookNames = '(?:useTranslations|getTranslations)';

  const stringForm = new RegExp(
    `(?:const|let)\\s+(\\w+)\\s*=\\s*(?:await\\s+)?${hookNames}\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`,
    'g',
  );
  let m: RegExpExecArray | null;
  while ((m = stringForm.exec(content)) !== null) {
    bindings.push({ varName: m[1], namespace: m[2] });
    seen.add(m[1]);
  }

  const objectForm = new RegExp(
    `(?:const|let)\\s+(\\w+)\\s*=\\s*(?:await\\s+)?${hookNames}\\s*\\(\\s*\\{[^}]*?namespace:\\s*['"]([^'"]+)['"][^}]*?\\}\\s*\\)`,
    'g',
  );
  while ((m = objectForm.exec(content)) !== null) {
    if (!seen.has(m[1])) {
      bindings.push({ varName: m[1], namespace: m[2] });
      seen.add(m[1]);
    }
  }

  const noArgForm = new RegExp(
    `(?:const|let)\\s+(\\w+)\\s*=\\s*(?:await\\s+)?${hookNames}\\s*\\(\\s*\\)`,
    'g',
  );
  while ((m = noArgForm.exec(content)) !== null) {
    if (!seen.has(m[1])) {
      bindings.push({ varName: m[1], namespace: null });
      seen.add(m[1]);
    }
  }

  return bindings;
}

/**
 * Extract all `<varName>('key')` calls for a specific bound translator variable.
 */
function extractKeysForVar(content: string, varName: string): string[] {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\s*\\(\\s*['"\`]([^'"\`]+)['"\`]`, 'g');
  const keys: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    if (!key.includes('${') && !key.includes('+')) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Find namespace usage in a file. Returns the resolved per-namespace keys
 * plus any hook bindings that had no namespace argument at all (a real bug,
 * not something we can safely auto-resolve - reported separately).
 */
function findNamespaceUsage(filePath: string): {
  keysByNamespace: Map<string, Set<string>>;
  noNamespace: boolean;
  siblings: Map<string, Set<string>>;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const bindings = findHookBindings(content);
  const keysByNamespace = new Map<string, Set<string>>();

  let noNamespace = false;

  // Track which namespaces share a variable name (e.g. multiple components
  // in one file each doing `const t = useTranslations(...)` with a
  // different namespace) so mismatch detection can treat them as equivalent.
  const varNamespaces = new Map<string, Set<string>>();
  for (const { varName, namespace } of bindings) {
    if (namespace === null) continue;
    if (!varNamespaces.has(varName)) varNamespaces.set(varName, new Set());
    varNamespaces.get(varName)!.add(namespace);
  }
  const siblings = new Map<string, Set<string>>();
  for (const nsSet of varNamespaces.values()) {
    if (nsSet.size <= 1) continue;
    for (const ns of nsSet) {
      if (!siblings.has(ns)) siblings.set(ns, new Set());
      for (const other of nsSet) {
        if (other !== ns) siblings.get(ns)!.add(other);
      }
    }
  }

  for (const { varName, namespace } of bindings) {
    if (namespace === null) {
      noNamespace = true;
      continue;
    }

    const keys = extractKeysForVar(content, varName);
    if (!keysByNamespace.has(namespace)) {
      keysByNamespace.set(namespace, new Set());
    }
    for (const key of keys) {
      keysByNamespace.get(namespace)!.add(key);
    }
  }

  return { keysByNamespace, noNamespace, siblings };
}

/**
 * Extract all translation calls from src/ and app/
 */
async function extractAllTranslationCalls(): Promise<{
  calls: TranslationCall[];
  noNamespaceFiles: string[];
}> {
  const files = (
    await Promise.all(
      SRC_DIRS.map((dir) => glob(path.join(dir, '**/*.{ts,tsx,js,jsx}'))),
    )
  ).flat();
  
  const calls: TranslationCall[] = [];
  const noNamespaceFiles: string[] = [];
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const keysByNamespace = findNamespaceUsage(file);
    
    for (const [namespace, keys] of keysByNamespace.keysByNamespace.entries()) {
      const ambiguousNamespaces = Array.from(keysByNamespace.siblings.get(namespace) ?? []);
      for (const key of keys) {
        calls.push({
          file: relativePath,
          namespace,
          key,
          line: 0, // Line number not needed for this use case
          ambiguousNamespaces,
        });
      }
    }

    if (keysByNamespace.noNamespace) {
      noNamespaceFiles.push(relativePath);
    }
  }
  
  return { calls, noNamespaceFiles };
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
 * Load all translation files (excludes .meta.json translator-context files,
 * .missing.json scratch files, and stray .backup files - none of those are
 * real next-intl namespaces).
 */
function loadAllTranslationFiles(): Map<string, any> {
  const files = fs
    .readdirSync(LOCALE_DIR)
    .filter(
      (f) =>
        f.endsWith('.json') &&
        !f.endsWith('.meta.json') &&
        !f.endsWith('.missing.json'),
    );
  const allTranslations = new Map<string, any>();
  
  for (const file of files) {
    const namespace = file.replace('.json', '');
    allTranslations.set(namespace, loadTranslationFile(namespace));
  }
  
  return allTranslations;
}

/**
 * Find which namespace file contains a key
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
  console.log('🔍 Scanning src/ and app/ for useTranslations()/getTranslations() calls...\n');
  
  const { calls, noNamespaceFiles } = await extractAllTranslationCalls();
  const allTranslations = loadAllTranslationFiles();

  // Files are loaded lazily and shared across every used-namespace string that
  // resolves to them (e.g. "components" and "components.aiAgentConfig" both
  // read/write public/locales/en/components.json).
  const fileCache = new Map<string, any>();
  const touchedFiles = new Set<string>();
  function getFile(file: string): any {
    if (!fileCache.has(file)) {
      fileCache.set(file, allTranslations.get(file) ?? loadTranslationFile(file));
    }
    return fileCache.get(file);
  }
  
  const report: TranslationReport = {
    totalFiles: new Set(calls.map(c => c.file)).size,
    totalCalls: calls.length,
    existingKeys: 0,
    missingKeys: 0,
    addedKeys: [],
    namespaceMismatches: [],
    noNamespaceFiles,
    byNamespace: {}
  };
  
  // Group by the literal namespace string used in useTranslations()/getTranslations()
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

    const { file, prefix } = resolveNamespace(namespace);
    const translations = getFile(file);
    const missingInNamespace: Map<string, string[]> = new Map();
    let existing = 0;
    let missing = 0;
    
    // Check each key
    for (const call of namespaceCalls) {
      const fullKey = prefix ? `${prefix}.${call.key}` : call.key;

      if (keyExists(translations, fullKey)) {
        existing++;
      } else {
        // Key not in expected namespace file - check all namespace files
        const foundInNamespace = findKeyInNamespaces(fullKey, allTranslations);

        const ambiguousSiblingFiles = call.ambiguousNamespaces.map(
          (ns) => resolveNamespace(ns).file,
        );
        if (foundInNamespace && ambiguousSiblingFiles.includes(foundInNamespace)) {
          // The same variable name (e.g. `t`) is reused across multiple
          // components/scopes in this file with different namespaces, and
          // regex extraction can't see JS scoping - this key legitimately
          // belongs to one of the file's OTHER declared namespaces, not a
          // real cross-file mismatch.
          existing++;
          continue;
        }
        
        if (foundInNamespace && foundInNamespace !== file) {
          // Key exists in a different namespace file
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
      console.log(`\n   Adding ${missingInNamespace.size} missing keys to ${file}.json...`);
      
      for (const [key, files] of missingInNamespace.entries()) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const placeholder = generatePlaceholder(key);
        setNestedKey(translations, fullKey, placeholder);
        
        report.addedKeys.push({
          namespace,
          key,
          usedInFiles: files,
          addedValue: placeholder
        });
        
        console.log(`   + ${key}: "${placeholder}" (used in ${files.length} file${files.length > 1 ? 's' : ''})`);
      }
      
      touchedFiles.add(file);
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

  for (const file of touchedFiles) {
    saveTranslationFile(file, fileCache.get(file));
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
  md += `- **Namespace mismatches**: ${report.namespaceMismatches.length}\n`;
  md += `- **Files calling useTranslations()/getTranslations() with no namespace**: ${report.noNamespaceFiles.length}\n\n`;

  if (report.noNamespaceFiles.length > 0) {
    md += '## 🚨 No-Namespace Hook Calls\n\n';
    md += 'These files call `useTranslations()`/`getTranslations()` with no namespace argument, so their\n';
    md += '`t()` keys resolve against the ROOT messages tree, not a specific namespace file. This is almost\n';
    md += 'always a bug (a dropped namespace argument) rather than an intentional root lookup - verify the\n';
    md += 'correct namespace from the keys used and restore the argument.\n\n';
    for (const file of report.noNamespaceFiles) {
      md += `- \`${file}\`\n`;
    }
    md += '\n';
  }
  
  // Namespace mismatches section
  if (report.namespaceMismatches.length > 0) {
    md += '## ⚠️ Namespace Mismatches\n\n';
    md += 'These keys exist in a different namespace file than expected. This may indicate:\n';
    md += '- Wrong `useTranslations()` namespace in the component\n';
    md += '- Key should be moved to the correct namespace file\n';
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
    if (report.noNamespaceFiles.length > 0) {
      console.log(`🚨 ${report.noNamespaceFiles.length} files call useTranslations()/getTranslations() with no namespace (likely a bug):`);
      report.noNamespaceFiles.forEach(f => console.log(`     - ${f}`));
    }
    
    if (report.namespaceMismatches.length > 0) {
      console.log(`⚠️  ${report.namespaceMismatches.length} namespace mismatches found\n`);
    } else {
      console.log('');
    }
    
    if (report.namespaceMismatches.length > 0 || report.addedKeys.length > 0 || report.noNamespaceFiles.length > 0) {
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
