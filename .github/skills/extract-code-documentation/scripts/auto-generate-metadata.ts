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
import { buildMetadataPrompt } from './metadata-prompt';
import Anthropic from '@anthropic-ai/sdk';

const workspaceRoot = path.join(__dirname, '../../..');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    location: string;
    description: string;
  };
  usage: string;
  impact: string;
  userType: 'all' | 'instructors' | 'students' | 'admins';
  tone: 'polite-formal' | 'casual' | 'technical';
  alternativeTerms?: string[];
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
    
    // Pattern 1: Extract default namespace from useTranslation calls
    // i18next behavior: useTranslation(['ns1', 'ns2', 'ns3']) sets t() default to 'ns1' (first)
    let defaultNamespace = 'common'; // fallback
    
    // Match single string: useTranslation('namespace')
    const singleNsMatches = content.matchAll(/useTranslation\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
    for (const match of singleNsMatches) {
      defaultNamespace = match[1];
    }
    
    // Match array: useTranslation(['ns1', 'ns2']) - first element is default
    const arrayNsMatches = content.matchAll(/useTranslation\(\s*\[\s*['"`]([^'"`]+)['"`]/g);
    for (const match of arrayNsMatches) {
      defaultNamespace = match[1]; // First namespace in array is default
    }
    
    // Pattern 2: t('namespace:key') or t('key') or t('key', { ns: 'namespace' })
    const tCallMatches = content.matchAll(/\bt\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*\{[^}]*ns:\s*['"`]([^'"`]+)['"`][^}]*\})?/g);
    
    for (const match of tCallMatches) {
      const fullKey = match[1];
      const explicitNs = match[2]; // From { ns: 'namespace' } option
      let namespace: string;
      let keyPath: string;
      
      // Priority: explicit ns option > namespace prefix > default namespace
      if (explicitNs) {
        // t('key', { ns: 'namespace' })
        namespace = explicitNs;
        keyPath = fullKey;
      } else if (fullKey.includes(':')) {
        // t('namespace:key')
        [namespace, keyPath] = fullKey.split(':', 2);
      } else {
        // t('key') - use default namespace from useTranslation
        namespace = defaultNamespace;
        keyPath = fullKey;
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
 * Step 3 & 4: Generate metadata from usage context and docblocks using AI
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
  
  // Build docblocks context for AI
  const docblocksContext = docblockDescriptions.length > 0
    ? docblockDescriptions.map((desc, i) => `- ${uniqueLocations[i]}: ${desc}`).join('\n')
    : 'No specific component docblocks found';
  
  // Generate metadata with AI
  return await generateMetadataWithAI(key, key.namespace, docblocksContext, uniqueLocations[0] || 'unknown');
}

/**
 * Generate metadata using Claude AI
 */
async function generateMetadataWithAI(
  key: TranslationKey,
  namespace: string,
  docblocksContext: string,
  componentLocation: string
): Promise<GeneratedMetadata> {
  const prompt = buildMetadataPrompt({
    keyPath: key.keyPath,
    value: key.value,
    namespace,
    componentLocation: componentLocation || 'src/components/common',
    docblocksContext
  });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  
  // Clean and parse JSON response
  let cleanedJson = responseText;
  
  // Remove markdown code fences if present
  cleanedJson = cleanedJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Extract JSON object
  const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in Claude response for key: ${key.keyPath}`);
  }
  
  let metadata: any;
  try {
    metadata = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // If JSON parse fails, try to fix common issues
    let fixedJson = jsonMatch[0];
    
    // Fix trailing commas before closing braces/brackets
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unescaped quotes in strings (basic attempt)
    // This is a simple heuristic - may need adjustment
    fixedJson = fixedJson.replace(/: "([^"]*)"([^,}\]])/g, ': "$1\\"$2');
    
    try {
      metadata = JSON.parse(fixedJson);
    } catch (retryError) {
      // Log the problematic JSON for debugging
      console.error(`   ⚠️  Failed to parse JSON for ${key.keyPath}`);
      console.error(`   Original error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      console.error(`   Retry error: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
      console.error(`   JSON snippet: ${jsonMatch[0].substring(0, 200)}...`);
      
      throw new Error(`JSON parse failed even after cleanup attempts: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  }
  
  // Ensure required fields are present with defaults
  return {
    context: metadata.context || `Used in ${componentLocation}`,
    component: {
      location: metadata.component?.location || componentLocation,
      description: metadata.component?.description || 'Component functionality not documented'
    },
    usage: metadata.usage || `Translation key: ${key.keyPath}`,
    impact: metadata.impact || 'Provides information to users',
    userType: metadata.userType || 'all',
    tone: metadata.tone || 'polite-formal',
    alternativeTerms: metadata.alternativeTerms || []
  };
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
        // Preserve existing value, update metadata
        const existingValue = current[finalKey].value || current[finalKey];
        current[finalKey] = {
          ...current[finalKey],
          value: typeof existingValue === 'string' ? existingValue : current[finalKey].value,
          _meta: {
            ...current[finalKey]._meta,
            ...meta
          }
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
  
  // Check for API key - required for metadata generation
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('   This script requires Claude AI for metadata generation.');
    console.error('   Export your Anthropic API key: export ANTHROPIC_API_KEY=sk-ant-...\n');
    process.exit(1);
  }
  
  const localesDir = path.join(workspaceRoot, 'public/locales/en');
  
  console.log('🔍 Step 1: Scanning codebase for translation calls...');
  
  // Scan both src/ and pages/ directories
  const srcKeys = await scanTranslationCalls(path.join(workspaceRoot, 'src'));
  const pagesKeys = await scanTranslationCalls(path.join(workspaceRoot, 'pages'));
  
  // Merge keys from both directories
  const keyMap = new Map<string, TranslationKey>();
  for (const key of [...srcKeys, ...pagesKeys]) {
    const uniqueKey = `${key.namespace}:${key.keyPath}`;
    if (keyMap.has(uniqueKey)) {
      // Merge usages
      keyMap.get(uniqueKey)!.usages.push(...key.usages);
    } else {
      keyMap.set(uniqueKey, key);
    }
  }
  
  const discoveredKeys = Array.from(keyMap.values());
  const totalUsages = discoveredKeys.reduce((sum, k) => sum + k.usages.length, 0);
  console.log(`   Found ${discoveredKeys.length} unique translation keys with ${totalUsages} usages`);
  console.log(`   Across ${new Set(discoveredKeys.map(k => k.namespace)).size} namespaces`);
  console.log(`   Scanned src/ (${srcKeys.length} keys) and pages/ (${pagesKeys.length} keys)\n`);
  
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
  
  console.log('🔍 Step 4: Generating metadata with AI (Claude Sonnet 4)...');
  
  const metadata = new Map<string, GeneratedMetadata>();
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i > 0 && i % 10 === 0) {
      console.log(`   Progress: ${i}/${keys.length} keys processed...`);
      // Rate limiting: 100ms delay every 10 requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      const meta = await generateMetadata(key, docblocks);
      metadata.set(`${key.namespace}:${key.keyPath}`, meta);
      successCount++;
    } catch (error) {
      console.error(`   ⚠️  Error generating metadata for ${key.keyPath}:`, error instanceof Error ? error.message : String(error));
      errorCount++;
    }
  }
  
  console.log(`   Generated ${metadata.size} metadata entries (${successCount} successful, ${errorCount} errors)\n`);
  
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
