#!/usr/bin/env tsx
/**
 * Generate metadata for entries that don't have _meta fields
 * 
 * This script:
 * 1. Scans all locale files for entries without _meta
 * 2. Generates AI metadata for those entries
 * 3. Updates the locale files
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { extractAllDocblocks, findDocblock } from './extract-component-docblocks';
import { buildMetadataPrompt } from './metadata-prompt';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MissingMetaEntry {
  namespace: string;
  keyPath: string;
  value: string;
  filePath: string;
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
 * Recursively scan object for entries without _meta
 * Handles both {value, _meta} structure and plain string values
 */
function scanForMissingMeta(
  obj: any,
  namespace: string,
  filePath: string,
  currentPath: string = '',
  results: MissingMetaEntry[] = []
): MissingMetaEntry[] {
  if (!obj || typeof obj !== 'object') return results;
  
  for (const [key, value] of Object.entries(obj)) {
    const keyPath = currentPath ? `${currentPath}.${key}` : key;
    
    // Handle plain string values (legacy format - needs conversion)
    if (typeof value === 'string') {
      results.push({
        namespace,
        keyPath,
        value: value,
        filePath
      });
      continue;
    }
    
    // Handle object values
    if (typeof value === 'object' && value !== null) {
      // Check if this is a translation entry with {value, _meta} structure
      if ('value' in value && typeof value.value === 'string') {
        // This is a translation entry - check if _meta is missing or malformed
        if (!value._meta || typeof value._meta !== 'object' || Object.keys(value._meta).length === 0) {
          results.push({
            namespace,
            keyPath,
            value: value.value,
            filePath
          });
        }
        // Don't recurse into translation entries - they're leaf nodes
      } else {
        // This is a namespace/grouping object - recurse into it
        scanForMissingMeta(value, namespace, filePath, keyPath, results);
      }
    }
  }
  
  return results;
}

/**
 * Scan all locale files for entries without metadata
 */
async function findAllMissingMeta(localesBaseDir: string): Promise<MissingMetaEntry[]> {
  const allMissing: MissingMetaEntry[] = [];
  
  const localeFiles = await glob('*.json', { 
    cwd: path.join(localesBaseDir, 'en'),
    absolute: false 
  });
  
  console.log(`   Scanning ${localeFiles.length} locale files...`);
  
  for (const file of localeFiles) {
    const namespace = path.basename(file, '.json');
    const filePath = path.join(localesBaseDir, 'en', file);
    
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const missing = scanForMissingMeta(content, namespace, filePath);
      
      if (missing.length > 0) {
        console.log(`   - ${namespace}.json: ${missing.length} entries missing metadata`);
      }
      
      allMissing.push(...missing);
    } catch (error) {
      console.error(`   ⚠️  Error reading ${file}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  return allMissing;
}

/**
 * Generate metadata using Claude AI
 */
async function generateMetadataWithAI(
  entry: MissingMetaEntry,
  docblocksContext: string,
  componentLocation: string
): Promise<GeneratedMetadata> {
  const prompt = buildMetadataPrompt({
    keyPath: entry.keyPath,
    value: entry.value,
    namespace: entry.namespace,
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
  cleanedJson = cleanedJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in Claude response for key: ${entry.keyPath}`);
  }
  
  let metadata: any;
  try {
    metadata = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    let fixedJson = jsonMatch[0];
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    try {
      metadata = JSON.parse(fixedJson);
    } catch (retryError) {
      console.error(`   ⚠️  Failed to parse JSON for ${entry.keyPath}`);
      console.error(`   Original error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      throw new Error(`JSON parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  }
  
  return {
    context: metadata.context || `Used in ${entry.namespace} namespace`,
    component: {
      location: metadata.component?.location || componentLocation || 'src/components/common',
      description: metadata.component?.description || 'Component functionality not yet documented'
    },
    usage: metadata.usage || `Translation key: ${entry.keyPath}`,
    impact: metadata.impact || 'Provides information to users',
    userType: metadata.userType || 'all',
    tone: metadata.tone || 'polite-formal',
    alternativeTerms: metadata.alternativeTerms || []
  };
}

/**
 * Update locale file with new metadata
 */
function updateMetadataInFile(
  filePath: string,
  keyPath: string,
  value: string,
  newMeta: GeneratedMetadata
): void {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  const pathParts = keyPath.split('.');
  let current: any = content;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (!current[pathParts[i]]) {
      current[pathParts[i]] = {};
    }
    current = current[pathParts[i]];
  }
  
  const finalKey = pathParts[pathParts.length - 1];
  
  // Convert to object with value and _meta
  current[finalKey] = {
    value: value,
    _meta: newMeta
  };
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
}

/**
 * Main execution
 */
async function main() {
  const workspaceRoot = path.join(__dirname, '../../../..');
  process.chdir(workspaceRoot);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('   Export your Anthropic API key: export ANTHROPIC_API_KEY=sk-ant-...\n');
    process.exit(1);
  }
  
  const localesBaseDir = path.join(workspaceRoot, 'public/locales');
  
  console.log('🔍 Step 1: Scanning locale files for entries without _meta...');
  const missingMeta = await findAllMissingMeta(localesBaseDir);
  
  console.log(`   Found ${missingMeta.length} entries without metadata`);
  
  if (missingMeta.length === 0) {
    console.log('✅ All entries have metadata!\n');
    return;
  }
  
  // Group by namespace
  const byNamespace = new Map<string, number>();
  for (const m of missingMeta) {
    byNamespace.set(m.namespace, (byNamespace.get(m.namespace) || 0) + 1);
  }
  
  console.log('\n📊 Missing metadata by namespace:');
  for (const [ns, count] of Array.from(byNamespace.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`   - ${ns}: ${count} entries`);
  }
  
  console.log('\n🔍 Step 2: Extracting component docblocks...');
  const docblocks = await extractAllDocblocks();
  console.log(`   Extracted ${docblocks.size} component docblocks\n`);
  
  console.log('🔍 Step 3: Generating metadata with AI (Claude Sonnet 4)...');
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < missingMeta.length; i++) {
    const entry = missingMeta[i];
    
    if (i > 0 && i % 10 === 0) {
      console.log(`   Progress: ${i}/${missingMeta.length} entries processed...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      const componentLocation = `src/components/${entry.namespace}`;
      const docblock = findDocblock(componentLocation, docblocks);
      
      const docblocksContext = docblock?.description 
        ? `- ${componentLocation}: ${docblock.description}`
        : 'No specific component docblocks found';
      
      const newMeta = await generateMetadataWithAI(entry, docblocksContext, componentLocation);
      updateMetadataInFile(entry.filePath, entry.keyPath, entry.value, newMeta);
      
      successCount++;
    } catch (error) {
      const errorMsg = `${entry.namespace}:${entry.keyPath} - ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ⚠️  Error: ${errorMsg}`);
      errors.push(errorMsg);
      errorCount++;
    }
  }
  
  console.log(`\n✅ Generation complete!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Total entries without metadata: ${missingMeta.length}`);
  console.log(`   - Successfully generated: ${successCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Namespaces updated: ${byNamespace.size}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more`);
    }
  }
}

main().catch(console.error);
