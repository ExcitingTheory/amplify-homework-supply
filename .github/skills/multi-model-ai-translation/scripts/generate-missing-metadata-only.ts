#!/usr/bin/env tsx
/**
 * Generate metadata ONLY for keys missing _meta tags
 * 
 * Scans English locale files and generates metadata for keys that don't have _meta fields.
 * Much more efficient than regenerating all metadata.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface KeyMetadata {
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
 * Recursively find all keys in an object that are missing _meta
 */
function findKeysWithoutMeta(obj: any, parentPath: string = ''): Array<{path: string, value: string}> {
  const keysWithoutMeta: Array<{path: string, value: string}> = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      // Check if this object has a value field but no _meta
      if ('value' in value && typeof value.value === 'string') {
        if (!value._meta) {
          keysWithoutMeta.push({ path: currentPath, value: value.value });
        }
      } else if (!('value' in value)) {
        // Recurse into nested objects (but not if it has a value field)
        keysWithoutMeta.push(...findKeysWithoutMeta(value, currentPath));
      }
    } else if (typeof value === 'string') {
      // Simple string value without metadata structure
      keysWithoutMeta.push({ path: currentPath, value });
    }
  }
  
  return keysWithoutMeta;
}

/**
 * Generate metadata using Claude AI
 */
async function generateMetadata(
  keyPath: string,
  value: string,
  namespace: string
): Promise<KeyMetadata> {
  const prompt = `You are a translation metadata expert. Generate metadata for this UI translation key.

**Key Path**: ${keyPath}
**Value**: "${value}"
**Namespace**: ${namespace}
**Platform**: Japanese Language Learning eLearning Platform (Next.js + AWS Amplify)

Generate a JSON object with these fields:

{
  "context": "Detailed explanation of where and how this text appears (1-2 sentences)",
  "component": {
    "location": "Likely file path (e.g., src/components/Editor3/, src/components/auth/, etc.)",
    "description": "What the component does and when users see it (2-3 sentences)"
  },
  "usage": "Specific UI element type and user interaction (1 sentence)",
  "impact": "Importance level and user action (1 sentence)",
  "userType": "all|instructors|students|admins",
  "tone": "polite-formal|casual|technical",
  "alternativeTerms": ["synonym1", "synonym2"]
}

Guidelines:
- For namespace "editor.*": location is likely "src/components/Editor3/"
- For namespace "workbook": location is likely "src/components/Workbook/" or "src/components/Editor3/components/"
- For namespace "pages": location is likely "pages/" or "src/components/pages/"
- For namespace "components": location is likely "src/components/"
- For namespace "auth": location is likely "src/components/auth/"
- userType: "instructors" for authoring tools, "students" for learning interface, "all" for common UI
- tone: "polite-formal" for Japanese language learning context, "casual" for friendly UI, "technical" for editor features

Return ONLY the JSON object, no markdown formatting.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  
  // Clean and parse JSON
  let cleanedJson = responseText.trim();
  cleanedJson = cleanedJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in response for ${keyPath}`);
  }
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Set nested value in object
 */
function setNestedValue(obj: any, path: string, metadata: KeyMetadata): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  
  const lastKey = parts[parts.length - 1];
  
  // If it's a simple string, convert to object with value and _meta
  if (typeof current[lastKey] === 'string') {
    current[lastKey] = {
      value: current[lastKey],
      _meta: metadata
    };
  } else if (typeof current[lastKey] === 'object' && 'value' in current[lastKey]) {
    // Already has value field, just add _meta
    current[lastKey]._meta = metadata;
  }
}

/**
 * Main execution
 */
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }
  
  const localesDir = path.join(process.cwd(), 'public/locales/en');
  const files = await glob('*.json', { cwd: localesDir });
  
  console.log('🔍 Scanning English locale files for keys missing metadata...\n');
  
  let totalKeysWithoutMeta = 0;
  let totalProcessed = 0;
  let totalErrors = 0;
  
  for (const file of files) {
    const namespace = path.basename(file, '.json');
    const filePath = path.join(localesDir, file);
    
    console.log(`\n📦 Namespace: ${namespace}`);
    
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const keysWithoutMeta = findKeysWithoutMeta(content);
    
    if (keysWithoutMeta.length === 0) {
      console.log(`   ✅ All keys have metadata (${Object.keys(content).length} keys)`);
      continue;
    }
    
    console.log(`   Found ${keysWithoutMeta.length} keys without metadata`);
    totalKeysWithoutMeta += keysWithoutMeta.length;
    
    for (let i = 0; i < keysWithoutMeta.length; i++) {
      const { path: keyPath, value } = keysWithoutMeta[i];
      
      try {
        console.log(`   [${i + 1}/${keysWithoutMeta.length}] Generating metadata for: ${keyPath}`);
        
        const metadata = await generateMetadata(keyPath, value, namespace);
        setNestedValue(content, keyPath, metadata);
        
        totalProcessed++;
        
        // Rate limiting: 100ms delay every key
        if (i < keysWithoutMeta.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`   ❌ Error generating metadata for ${keyPath}:`, error instanceof Error ? error.message : String(error));
        totalErrors++;
      }
    }
    
    // Save updated file
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
    console.log(`   💾 Saved ${namespace}.json with ${keysWithoutMeta.length} new metadata entries`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(80));
  console.log(`\n✅ Total keys without metadata: ${totalKeysWithoutMeta}`);
  console.log(`✅ Successfully processed: ${totalProcessed}`);
  console.log(`❌ Errors: ${totalErrors}`);
  
  if (totalProcessed > 0) {
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review generated metadata in public/locales/en/*.json`);
    console.log(`   2. Run translation workflow to translate to other languages`);
  }
}

main().catch(console.error);
