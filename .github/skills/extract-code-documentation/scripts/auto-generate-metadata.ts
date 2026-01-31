#!/usr/bin/env tsx
/**
 * Automatically generate translation metadata by analyzing codebase usage
 * 
 * This script:
 * 1. Reads existing locale files
 * 2. Searches codebase for where each translation key is used
 * 3. Extracts component docblocks from files using each key
 * 4. Generates metadata automatically based on actual usage
 * 5. Merges generated metadata into locale files
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { extractAllDocblocks, findDocblock } from './extract-component-docblocks';

const workspaceRoot = path.join(__dirname, '../../..');

interface TranslationKey {
  namespace: string;
  key: string;
  keyPath: string; // Nested path like "actions.save"
  value: string;
  usages: TranslationUsage[];
}

interface TranslationUsage {
  file: string;
  line: number;
  context: string; // Surrounding code context
  componentName?: string;
}

interface GeneratedMetadata {
  context: string;
  component: {
    location: string[];
    functionality: string;
  };
  usage: string;
  impact: string;
  userType: 'all' | 'instructor' | 'student' | 'admin';
  category: 'button' | 'label' | 'heading' | 'message' | 'placeholder' | 'error' | 'status' | 'navigation';
}

/**
 * Step 1: Scan codebase for all translation function calls
 */
async function scanTranslationCalls(sourceDir: string): Promise<TranslationKey[]> {
  const translationCalls = new Map<string, TranslationKey>();
  
  const files = await glob('**/*.{js,jsx,ts,tsx}', {
    cwd: sourceDir,
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
    absolute: true
  });
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativeFile = path.relative(sourceDir, file);
    
    // Pattern 1: useTranslation('namespace')
    const useTranslationMatches = content.matchAll(/useTranslation\(['"`]([^'"`]+)['"`]\)/g);
    let currentNamespace = 'common'; // default
    
    for (const match of useTranslationMatches) {
      currentNamespace = match[1];
    }
    
    // Pattern 2: t('namespace:key') or t('key')
    const tCallMatches = content.matchAll(/\bt\(['"`]([^'"`]+)['"`]/g);
    
    for (const match of tCallMatches) {
      const fullKey = match[1];
      let namespace = currentNamespace;
      let keyPath = fullKey;
      
      // Check if namespace is specified in the key
      if (fullKey.includes(':')) {
        [namespace, keyPath] = fullKey.split(':', 2);
      }
      
      const uniqueKey = `${namespace}:${keyPath}`;
      
      if (!translationCalls.has(uniqueKey)) {
        translationCalls.set(uniqueKey, {
          namespace,
          key: keyPath.split('.').pop() || keyPath,
          keyPath,
          value: '', // Will be filled from locale file or marked as missing
          usages: []
        });
      }
      
      // Find line number
      const lines = content.split('\n');
      const lineIndex = lines.findIndex(line => line.includes(match[0]));
      
      translationCalls.get(uniqueKey)!.usages.push({
        file: relativeFile,
        line: lineIndex + 1,
        context: lines.slice(Math.max(0, lineIndex - 1), Math.min(lines.length, lineIndex + 2)).join('\n'),
        componentName: extractComponentName(file)
      });
    }
  }
  
  return Array.from(translationCalls.values());
}

/**
 * Step 2: Read locale files and match with found keys
 */
async function enrichWithLocaleData(
  keys: TranslationKey[],
  localesDir: string
): Promise<{ keys: TranslationKey[], missingKeys: TranslationKey[], newNamespaces: string[] }> {
  const existingNamespaces = new Set<string>();
  const localeFiles = await glob('*.json', { cwd: localesDir });
  
  for (const file of localeFiles) {
    existingNamespaces.add(path.basename(file, '.json'));
  }
  
  const missingKeys: TranslationKey[] = [];
  const newNamespaces = Array.from(new Set(keys.map(k => k.namespace)))
    .filter(ns => !existingNamespaces.has(ns));
  
  // Try to find values from locale files
  for (const key of keys) {
    const localeFile = path.join(localesDir, `${key.namespace}.json`);
    
    if (fs.existsSync(localeFile)) {
      try {
        const content = JSON.parse(fs.readFileSync(localeFile, 'utf-8'));
        const value = getNestedValue(content, key.keyPath);
        
        if (value) {
          // Extract value from metadata structure or plain string
          key.value = typeof value === 'object' && 'value' in value ? value.value : value;
        } else {
          key.value = `MISSING: ${key.keyPath}`;
          missingKeys.push(key);
        }
      } catch (error) {
        console.error(`   ⚠️  Invalid JSON in ${key.namespace}.json - skipping this namespace`);
        console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        key.value = `INVALID_JSON: ${key.namespace}`;
        missingKeys.push(key);
      }
    } else {
      key.value = `NEW_NAMESPACE: ${key.namespace}`;
      missingKeys.push(key);
    }
  }
  
  return { keys, missingKeys, newNamespaces };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// findKeyUsages function removed - usages are now collected during scanTranslationCalls

/**
 * Extract component name from file path
 */
function extractComponentName(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  // Handle index files
  if (basename === 'index') {
    return path.basename(path.dirname(filePath));
  }
  return basename;
}

/**
 * Step 3 & 4: Generate metadata from usage context and docblocks
 */
async function generateMetadata(
  key: TranslationKey,
  docblocks: Map<string, any>
): Promise<GeneratedMetadata> {
  const locations = key.usages.map(u => u.file);
  const uniqueLocations = Array.from(new Set(locations));
  
  // Try to find docblocks for components using this key
  const docblockDescriptions: string[] = [];
  for (const location of uniqueLocations) {
    const docblock = findDocblock(location, docblocks);
    if (docblock?.description) {
      docblockDescriptions.push(docblock.description);
    }
  }
  
  // Infer category from key structure and value
  const category = inferCategory(key);
  
  // Infer user type from namespace and file paths
  const userType = inferUserType(key);
  
  // Build context description
  const context = generateContext(key);
  
  // Build usage description
  const usage = generateUsage(key, category);
  
  // Build impact description
  const impact = generateImpact(key, category);
  
  return {
    context,
    component: {
      location: uniqueLocations,
      functionality: docblockDescriptions[0] || 'Component functionality not documented'
    },
    usage,
    impact,
    userType,
    category
  };
}

/**
 * Infer category from key name and value
 */
function inferCategory(key: TranslationKey): GeneratedMetadata['category'] {
  const keyLower = key.keyPath.toLowerCase();
  const valueLower = key.value.toLowerCase();
  
  // Check key path patterns
  if (keyLower.includes('button') || keyLower.includes('action') || keyLower.includes('submit')) {
    return 'button';
  }
  if (keyLower.includes('error') || key.namespace === 'errors') {
    return 'error';
  }
  if (keyLower.includes('heading') || keyLower.includes('title')) {
    return 'heading';
  }
  if (keyLower.includes('placeholder')) {
    return 'placeholder';
  }
  if (keyLower.includes('status')) {
    return 'status';
  }
  if (keyLower.includes('nav') || keyLower.includes('menu')) {
    return 'navigation';
  }
  if (keyLower.includes('message') || keyLower.includes('description')) {
    return 'message';
  }
  
  // Check for button-like values
  if (valueLower.match(/^(save|cancel|delete|edit|create|submit|add|remove)/)) {
    return 'button';
  }
  
  // Default to label
  return 'label';
}

/**
 * Infer user type from namespace and file paths
 */
function inferUserType(key: TranslationKey): GeneratedMetadata['userType'] {
  const pathsStr = key.usages.map(u => u.file).join(' ').toLowerCase();
  
  if (pathsStr.includes('instructor') || key.namespace === 'editor' || key.namespace === 'units') {
    return 'instructor';
  }
  if (pathsStr.includes('student') || pathsStr.includes('workbook') || key.namespace === 'grades') {
    return 'student';
  }
  if (pathsStr.includes('admin')) {
    return 'admin';
  }
  
  return 'all';
}

/**
 * Generate context description
 */
function generateContext(key: TranslationKey): string {
  const locations = key.usages.map(u => {
    const parts = u.file.split('/');
    if (parts.includes('components')) {
      return `${parts[parts.length - 1]} component`;
    }
    if (parts.includes('pages')) {
      return `${parts[parts.length - 1].replace(/\.(js|tsx?)$/, '')} page`;
    }
    return parts[parts.length - 1];
  });
  
  if (locations.length === 0) {
    return `Translation key not currently used in codebase`;
  }
  
  return `Used in ${Array.from(new Set(locations)).join(', ')}`;
}

/**
 * Generate usage description
 */
function generateUsage(key: TranslationKey, category: string): string {
  const templates = {
    button: `Button label for ${key.keyPath.split('.').pop()} action`,
    label: `Label text for ${key.keyPath.split('.').pop()} field`,
    heading: `Heading text for ${key.keyPath.split('.').pop()} section`,
    error: `Error message displayed when ${key.keyPath.split('.').pop()} fails`,
    placeholder: `Placeholder text for ${key.keyPath.split('.').pop()} input`,
    status: `Status indicator showing ${key.keyPath.split('.').pop()} state`,
    navigation: `Navigation item for ${key.keyPath.split('.').pop()}`,
    message: `Message displayed for ${key.keyPath.split('.').pop()}`
  };
  
  return templates[category as keyof typeof templates] || `Text for ${key.keyPath}`;
}

/**
 * Generate impact description
 */
function generateImpact(key: TranslationKey, category: string): string {
  if (category === 'button') {
    return `Triggers ${key.keyPath.split('.').pop()} action when clicked`;
  }
  if (category === 'error') {
    return `Alerts user to ${key.keyPath.split('.').pop()} error condition`;
  }
  if (category === 'heading') {
    return `Labels the ${key.keyPath.split('.').pop()} section for users`;
  }
  
  return `Provides ${category} information to users`;
}

/**
 * Step 5: Merge metadata into locale files
 */
async function mergeMetadataIntoLocales(
  keys: TranslationKey[],
  metadata: Map<string, GeneratedMetadata>,
  localesDir: string
) {
  // Group keys by namespace
  const byNamespace = new Map<string, TranslationKey[]>();
  for (const key of keys) {
    if (!byNamespace.has(key.namespace)) {
      byNamespace.set(key.namespace, []);
    }
    byNamespace.get(key.namespace)!.push(key);
  }
  
  // Update each namespace file
  for (const [namespace, namespaceKeys] of Array.from(byNamespace.entries())) {
    const filePath = path.join(localesDir, `${namespace}.json`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Merge metadata into content
    for (const key of namespaceKeys) {
      const meta = metadata.get(`${namespace}:${key.keyPath}`);
      if (!meta) continue;
      
      // Navigate to the key location in the object
      const pathParts = key.keyPath.split('.');
      let current: any = content;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      const finalKey = pathParts[pathParts.length - 1];
      
      // If it's a simple string, convert to object with metadata
      if (typeof current[finalKey] === 'string') {
        current[finalKey] = {
          value: current[finalKey],
          _meta: meta
        };
      } else if (current[finalKey] && typeof current[finalKey] === 'object') {
        // Update existing metadata
        current[finalKey]._meta = {
          ...current[finalKey]._meta,
          ...meta
        };
      }
    }
    
    // Write updated content
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
    console.log(`✅ Updated ${namespace}.json with ${namespaceKeys.length} metadata entries`);
  }
}

/**
 * Main execution
 */
async function main() {
  const workspaceRoot = path.join(__dirname, '../../../..');
  
  // Change to workspace root so extractAllDocblocks() works correctly
  process.chdir(workspaceRoot);
  
  const localesDir = path.join(workspaceRoot, 'public/locales/en');
  const sourceDir = path.join(workspaceRoot, 'src');
  
  console.log('🔍 Step 1: Scanning codebase for translation calls...');
  const discoveredKeys = await scanTranslationCalls(sourceDir);
  const totalUsages = discoveredKeys.reduce((sum, k) => sum + k.usages.length, 0);
  console.log(`   Found ${discoveredKeys.length} unique translation keys with ${totalUsages} usages`);
  console.log(`   Across ${new Set(discoveredKeys.map(k => k.namespace)).size} namespaces\n`);
  
  console.log('🔍 Step 2: Comparing with locale files...');
  const { keys, missingKeys, newNamespaces } = await enrichWithLocaleData(discoveredKeys, localesDir);
  console.log(`   Locale files: ${(await glob('*.json', { cwd: localesDir })).length}`);
  console.log(`   Missing keys: ${missingKeys.length}`);
  console.log(`   New namespaces needed: ${newNamespaces.length > 0 ? newNamespaces.join(', ') : 'none'}\n`);
  
  if (missingKeys.length > 0) {
    console.log('⚠️  Missing translations:');
    missingKeys.slice(0, 10).forEach(k => {
      console.log(`   - ${k.namespace}:${k.keyPath} (used in ${k.usages.length} places)`);
    });
    if (missingKeys.length > 10) {
      console.log(`   ... and ${missingKeys.length - 10} more\n`);
    }
  }
  
  console.log('🔍 Step 3: Extracting component docblocks...');
  const docblocks = await extractAllDocblocks();
  console.log(`   Extracted ${docblocks.size} component docblocks\n`);
  
  console.log('🔍 Step 4: Generating metadata from usage context...');
  const metadata = new Map<string, GeneratedMetadata>();
  for (const key of keys) {
    const meta = await generateMetadata(key, docblocks);
    metadata.set(`${key.namespace}:${key.keyPath}`, meta);
  }
  console.log(`   Generated ${metadata.size} metadata entries\n`);
  
  console.log('🔍 Step 5: Updating locale files with metadata...');
  await mergeMetadataIntoLocales(keys, metadata, localesDir);
  
  console.log('\n✅ Metadata generation complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Translation keys in code: ${keys.length}`);
  console.log(`   - Keys with values: ${keys.filter(k => !k.value.startsWith('MISSING')).length}`);
  console.log(`   - Missing from locale files: ${missingKeys.length}`);
  console.log(`   - New namespaces needed: ${newNamespaces.length}`);
  console.log(`   - Average usages per key: ${(totalUsages / keys.length).toFixed(1)}`);
  
  console.log(`\n📝 Next steps:`);
  if (missingKeys.length > 0) {
    console.log(`   1. Add ${missingKeys.length} missing translations to locale files`);
  }
  if (newNamespaces.length > 0) {
    console.log(`   2. Create new namespace files: ${newNamespaces.join(', ')}.json`);
  }
  console.log(`   3. Review auto-generated metadata in locale files`);
  console.log(`   4. Run translation workflow to translate to other languages`);
}

main().catch(console.error);
