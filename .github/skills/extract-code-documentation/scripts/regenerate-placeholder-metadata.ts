#!/usr/bin/env tsx
/**
 * Regenerate metadata for entries with placeholder text
 * 
 * This script:
 * 1. Scans all locale files for entries with [NEEDS_* or "functionality not documented"
 * 2. Re-runs AI metadata generation for those specific keys
 * 3. Updates the locale files with proper metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { extractAllDocblocks, findDocblock } from './extract-component-docblocks';
import { buildMetadataPrompt } from './metadata-prompt';
import Anthropic from '@anthropic-ai/sdk';

const workspaceRoot = path.join(__dirname, '../../../..');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PlaceholderEntry {
  namespace: string;
  keyPath: string;
  value: string;
  currentMeta: any;
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
 * Check if a value contains placeholder text
 */
function hasPlaceholder(value: any): boolean {
  if (!value) return false;
  
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  return stringValue.includes('[NEEDS_') || 
         stringValue.includes('functionality not documented') ||
         stringValue.includes('NEEDS_CONTEXT') ||
         stringValue.includes('NEEDS_DESCRIPTION') ||
         stringValue.includes('NEEDS_USAGE') ||
         stringValue.includes('NEEDS_IMPACT') ||
         stringValue.includes('NEEDS_LOCATION');
}

/**
 * Recursively scan object for entries with placeholder metadata
 * Handles both {value, _meta} structure and plain string values
 */
function scanForPlaceholders(
  obj: any,
  namespace: string,
  filePath: string,
  currentPath: string = '',
  results: PlaceholderEntry[] = []
): PlaceholderEntry[] {
  if (!obj || typeof obj !== 'object') return results;
  
  for (const [key, value] of Object.entries(obj)) {
    const keyPath = currentPath ? `${currentPath}.${key}` : key;
    
    // Handle plain string values (legacy format)
    if (typeof value === 'string') {
      // Plain strings don't have metadata to check for placeholders
      // Skip them - they need metadata generation, not placeholder fixing
      continue;
    }
    
    // Handle object values
    if (typeof value === 'object' && value !== null) {
      // Check if this is a translation entry with {value, _meta} structure
      if ('value' in value && typeof value.value === 'string') {
        // This is a translation entry - check if _meta has placeholders
        const meta = value._meta || {};
        
        if (hasPlaceholder(meta)) {
          results.push({
            namespace,
            keyPath,
            value: value.value,
            currentMeta: meta,
            filePath
          });
        }
        // Don't recurse into translation entries - they're leaf nodes
      } else {
        // This is a namespace/grouping object - recurse into it
        scanForPlaceholders(value, namespace, filePath, keyPath, results);
      }
    }
  }
  
  return results;
}

/**
 * Scan all locale files for placeholder entries
 */
async function findAllPlaceholders(localesBaseDir: string): Promise<PlaceholderEntry[]> {
  const allPlaceholders: PlaceholderEntry[] = [];
  
  // Find all JSON files in the en directory
  const localeFiles = await glob('*.json', { 
    cwd: path.join(localesBaseDir, 'en'),
    absolute: false 
  });
  
  for (const file of localeFiles) {
    const namespace = path.basename(file, '.json');
    const filePath = path.join(localesBaseDir, 'en', file);
    
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const placeholders = scanForPlaceholders(content, namespace, filePath);
      allPlaceholders.push(...placeholders);
    } catch (error) {
      console.error(`   ⚠️  Error reading ${file}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  return allPlaceholders;
}

/**
 * Generate metadata using Claude AI
 */
async function generateMetadataWithAI(
  entry: PlaceholderEntry,
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
  
  // Remove markdown code fences if present
  cleanedJson = cleanedJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Extract JSON object
  const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in Claude response for key: ${entry.keyPath}`);
  }
  
  let metadata: any;
  try {
    metadata = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // If JSON parse fails, try to fix common issues
    let fixedJson = jsonMatch[0];
    
    // Fix trailing commas before closing braces/brackets
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    try {
      metadata = JSON.parse(fixedJson);
    } catch (retryError) {
      console.error(`   ⚠️  Failed to parse JSON for ${entry.keyPath}`);
      console.error(`   Original error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      console.error(`   JSON snippet: ${jsonMatch[0].substring(0, 200)}...`);
      
      throw new Error(`JSON parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  }
  
  // Ensure required fields are present with defaults
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
  newMeta: GeneratedMetadata
): void {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Navigate to the key location
  const pathParts = keyPath.split('.');
  let current: any = content;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (!current[pathParts[i]]) {
      current[pathParts[i]] = {};
    }
    current = current[pathParts[i]];
  }
  
  const finalKey = pathParts[pathParts.length - 1];
  
  // Update metadata
  if (current[finalKey] && typeof current[finalKey] === 'object') {
    current[finalKey]._meta = newMeta;
  } else if (typeof current[finalKey] === 'string') {
    current[finalKey] = {
      value: current[finalKey],
      _meta: newMeta
    };
  }
  
  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
}

/**
 * Main execution
 */
async function main() {
  const workspaceRoot = path.join(__dirname, '../../../..');
  process.chdir(workspaceRoot);
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('   Export your Anthropic API key: export ANTHROPIC_API_KEY=sk-ant-...\n');
    process.exit(1);
  }
  
  const localesBaseDir = path.join(workspaceRoot, 'public/locales');
  
  console.log('🔍 Step 1: Scanning locale files for placeholder metadata...');
  const placeholders = await findAllPlaceholders(localesBaseDir);
  
  console.log(`   Found ${placeholders.length} entries with placeholder metadata`);
  
  if (placeholders.length === 0) {
    console.log('✅ No placeholders found - all metadata is complete!\n');
    return;
  }
  
  // Group by namespace for reporting
  const byNamespace = new Map<string, number>();
  for (const p of placeholders) {
    byNamespace.set(p.namespace, (byNamespace.get(p.namespace) || 0) + 1);
  }
  
  console.log('\n📊 Placeholders by namespace:');
  for (const [ns, count] of Array.from(byNamespace.entries())) {
    console.log(`   - ${ns}: ${count} entries`);
  }
  
  console.log('\n🔍 Step 2: Extracting component docblocks...');
  const docblocks = await extractAllDocblocks();
  console.log(`   Extracted ${docblocks.size} component docblocks\n`);
  
  console.log('🔍 Step 3: Regenerating metadata with AI (Claude Sonnet 4)...');
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < placeholders.length; i++) {
    const entry = placeholders[i];
    
    if (i > 0 && i % 10 === 0) {
      console.log(`   Progress: ${i}/${placeholders.length} entries processed...`);
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      // Try to find docblock for component
      const componentLocation = entry.currentMeta?.component?.location || '';
      const docblock = componentLocation ? findDocblock(componentLocation, docblocks) : null;
      
      const docblocksContext = docblock?.description 
        ? `- ${componentLocation}: ${docblock.description}`
        : 'No specific component docblocks found';
      
      const newMeta = await generateMetadataWithAI(entry, docblocksContext, componentLocation);
      
      // Update the file
      updateMetadataInFile(entry.filePath, entry.keyPath, newMeta);
      
      successCount++;
    } catch (error) {
      const errorMsg = `${entry.namespace}:${entry.keyPath} - ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ⚠️  Error: ${errorMsg}`);
      errors.push(errorMsg);
      errorCount++;
    }
  }
  
  console.log(`\n✅ Regeneration complete!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Total placeholder entries: ${placeholders.length}`);
  console.log(`   - Successfully regenerated: ${successCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Namespaces updated: ${byNamespace.size}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more`);
    }
  }
  
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review updated metadata in locale files`);
  console.log(`   2. Fix any remaining errors manually`);
  console.log(`   3. Run translation workflow to update other languages`);
}

main().catch(console.error);
