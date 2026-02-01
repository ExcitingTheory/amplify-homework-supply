#!/usr/bin/env tsx
/**
 * Generate metadata ONLY for keys missing _meta tags
 * 
 * This script:
 * 1. Scans all English locale files
 * 2. Identifies keys that don't have _meta fields
 * 3. Generates metadata using Claude AI with the shared prompt template
 * 4. Updates only the missing metadata entries
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { extractAllDocblocks, findDocblock } from './extract-component-docblocks';
import { buildMetadataPrompt } from './metadata-prompt';
import Anthropic from '@anthropic-ai/sdk';

const workspaceRoot = path.join(__dirname, '../../../..');
const localesDir = path.join(workspaceRoot, 'public/locales/en');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface KeyWithoutMeta {
  namespace: string;
  keyPath: string;
  value: string;
  filePath: string;
  usageFiles: string[];
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
 * Recursively scan an object to find keys without _meta tags
 */
function findKeysWithoutMeta(
  obj: any,
  namespace: string,
  currentPath: string = '',
  results: KeyWithoutMeta[] = [],
  filePath: string = ''
): KeyWithoutMeta[] {
  for (const key in obj) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null) {
      // Check if this is a translation object with a value field
      if ('value' in value && typeof value.value === 'string') {
        // This is a translation entry - check for _meta
        if (!value._meta) {
          results.push({
            namespace,
            keyPath: newPath,
            value: value.value,
            filePath,
            usageFiles: []
          });
        }
      } else {
        // Keep recursing
        findKeysWithoutMeta(value, namespace, newPath, results, filePath);
      }
    } else if (typeof value === 'string') {
      // Plain string value without metadata structure
      results.push({
        namespace,
        keyPath: newPath,
        value: value,
        filePath,
        usageFiles: []
      });
    }
  }
  
  return results;
}

/**
 * Scan all English locale files for keys missing metadata
 */
async function scanForMissingMeta(): Promise<KeyWithoutMeta[]> {
  const files = await glob('*.json', { cwd: localesDir });
  const missingMeta: KeyWithoutMeta[] = [];
  
  for (const file of files) {
    const namespace = path.basename(file, '.json');
    const filePath = path.join(localesDir, file);
    
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const keysWithoutMeta = findKeysWithoutMeta(content, namespace, '', [], filePath);
      missingMeta.push(...keysWithoutMeta);
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  return missingMeta;
}

/**
 * Find which component files use a specific translation key
 */
async function findKeyUsages(keyPath: string, namespace: string): Promise<string[]> {
  const srcPattern = path.join(workspaceRoot, 'src/**/*.{ts,tsx,js,jsx}');
  const pagesPattern = path.join(workspaceRoot, 'pages/**/*.{ts,tsx,js,jsx}');
  
  const files = [
    ...(await glob(srcPattern)),
    ...(await glob(pagesPattern))
  ];
  
  const usages: string[] = [];
  
  // Build search patterns for this key
  const searchPatterns = [
    `t('${keyPath}'`,
    `t("${keyPath}"`,
    `t(\`${keyPath}\``,
    `'${namespace}:${keyPath}'`,
    `"${namespace}:${keyPath}"`,
  ];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    if (searchPatterns.some(pattern => content.includes(pattern))) {
      usages.push(path.relative(workspaceRoot, file));
    }
  }
  
  return usages;
}

/**
 * Generate metadata using Claude AI with the shared prompt template
 */
async function generateMetadata(
  key: KeyWithoutMeta,
  docblocks: Map<string, any>
): Promise<GeneratedMetadata> {
  // Find component location from usage files
  let componentLocation = key.usageFiles[0] || 'src/components/common';
  
  // Try to find docblock for the component
  const docblockDescriptions: string[] = [];
  for (const usageFile of key.usageFiles) {
    const docblock = findDocblock(usageFile, docblocks);
    if (docblock?.description) {
      docblockDescriptions.push(`${usageFile}: ${docblock.description}`);
    }
  }
  
  const docblocksContext = docblockDescriptions.length > 0
    ? docblockDescriptions.join('\n')
    : 'No specific component docblocks found';
  
  // Build prompt using the shared template
  const prompt = buildMetadataPrompt({
    keyPath: key.keyPath,
    value: key.value,
    namespace: key.namespace,
    componentLocation,
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
  let cleanedJson = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error(`No JSON object found in Claude response for key: ${key.keyPath}`);
  }
  
  let metadata: any;
  try {
    metadata = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // Try to fix common issues
    let fixedJson = jsonMatch[0].replace(/,(\s*[}\]])/g, '$1');
    metadata = JSON.parse(fixedJson);
  }
  
  // Ensure required fields with defaults
  return {
    context: metadata.context || `Used in ${key.namespace} namespace`,
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
 * Set nested value in object
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  
  const finalKey = parts[parts.length - 1];
  
  // If current value is a plain string, convert to object with value and _meta
  if (typeof current[finalKey] === 'string') {
    current[finalKey] = {
      value: current[finalKey],
      _meta: value
    };
  } else if (current[finalKey] && typeof current[finalKey] === 'object') {
    // Already an object, just add _meta
    current[finalKey]._meta = value;
  } else {
    // New entry
    current[finalKey] = {
      value: '',
      _meta: value
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning English locale files for keys missing _meta tags...\n');
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('   Export your Anthropic API key: export ANTHROPIC_API_KEY=sk-ant-...\n');
    process.exit(1);
  }
  
  // Scan for missing metadata
  const missingMeta = await scanForMissingMeta();
  console.log(`   Found ${missingMeta.length} keys without _meta tags\n`);
  
  if (missingMeta.length === 0) {
    console.log('✅ All keys have metadata! Nothing to generate.\n');
    return;
  }
  
  // Show sample of missing keys
  console.log('   Sample of keys needing metadata:');
  missingMeta.slice(0, 10).forEach(key => {
    console.log(`   - ${key.namespace}:${key.keyPath}`);
  });
  if (missingMeta.length > 10) {
    console.log(`   ... and ${missingMeta.length - 10} more\n`);
  } else {
    console.log('');
  }
  
  // Extract component docblocks
  console.log('🔍 Extracting component docblocks...');
  const docblocks = await extractAllDocblocks();
  console.log(`   Extracted ${docblocks.size} component docblocks\n`);
  
  // Find usages for each key
  console.log('🔍 Finding key usages in codebase...');
  for (const key of missingMeta) {
    key.usageFiles = await findKeyUsages(key.keyPath, key.namespace);
  }
  console.log(`   Analyzed usage locations\n`);
  
  // Generate metadata with AI
  console.log(`🤖 Generating metadata for ${missingMeta.length} keys using Claude Sonnet 4...\n`);
  
  const metadataByNamespace = new Map<string, Map<string, GeneratedMetadata>>();
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < missingMeta.length; i++) {
    const key = missingMeta[i];
    
    if (i > 0 && i % 10 === 0) {
      console.log(`   Progress: ${i}/${missingMeta.length} keys processed...`);
      // Rate limiting: 100ms delay every 10 requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      const meta = await generateMetadata(key, docblocks);
      
      if (!metadataByNamespace.has(key.namespace)) {
        metadataByNamespace.set(key.namespace, new Map());
      }
      metadataByNamespace.get(key.namespace)!.set(key.keyPath, meta);
      
      successCount++;
    } catch (error) {
      console.error(`   ⚠️  Error generating metadata for ${key.namespace}:${key.keyPath}:`, 
        error instanceof Error ? error.message : String(error));
      errorCount++;
    }
  }
  
  console.log(`   Generated ${successCount} metadata entries (${errorCount} errors)\n`);
  
  // Update locale files
  console.log('💾 Updating locale files with new metadata...\n');
  
  for (const [namespace, metadataMap] of metadataByNamespace.entries()) {
    const filePath = path.join(localesDir, `${namespace}.json`);
    
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      for (const [keyPath, metadata] of metadataMap.entries()) {
        setNestedValue(content, keyPath, metadata);
      }
      
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf-8');
      console.log(`   ✅ Updated ${namespace}.json with ${metadataMap.size} new metadata entries`);
    } catch (error) {
      console.error(`   ❌ Error updating ${namespace}.json:`, 
        error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log('\n✅ Metadata generation complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Keys needing metadata: ${missingMeta.length}`);
  console.log(`   - Successfully generated: ${successCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Namespaces updated: ${metadataByNamespace.size}`);
}

main().catch(console.error);
