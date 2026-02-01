#!/usr/bin/env tsx
/**
 * Translate only missing keys from a namespace to target language
 * 
 * Usage: npx tsx translate-missing-keys.ts <namespace> <source> <target>
 * Example: npx tsx translate-missing-keys.ts editor.ai en ja
 * 
 * This script:
 * 1. Loads the source namespace file (e.g., public/locales/en/editor.ai.json)
 * 2. Loads the target namespace file (e.g., public/locales/ja/editor.ai.json)
 * 3. Compares to find missing keys
 * 4. Translates only the missing keys using Claude AI
 * 5. Merges new translations into the existing target file
 */

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TranslationMetadata {
  context?: string;
  component?: {
    location?: string;
    description?: string;
  };
  usage?: string;
  impact?: string;
  userType?: string;
  tone?: string;
  alternativeTerms?: string[];
  [key: string]: any;
}

interface TranslationEntry {
  value: string;
  _meta?: TranslationMetadata;
  [key: string]: any;
}

/**
 * Recursively get all keys from a translation object
 */
function getAllKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null) {
      if ('value' in value && typeof value.value === 'string') {
        // This is a translation entry
        keys.push(fullPath);
      } else {
        // Recurse into nested object
        keys.push(...getAllKeys(value, fullPath));
      }
    } else if (typeof value === 'string') {
      // Simple string value
      keys.push(fullPath);
    }
  }
  
  return keys;
}

/**
 * Get nested value from object by path
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Set nested value in object by path
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
  
  current[parts[parts.length - 1]] = value;
}

/**
 * Translate a single key using Claude AI with metadata context
 */
async function translateKey(
  keyPath: string,
  sourceEntry: TranslationEntry,
  targetLang: string,
  namespace: string
): Promise<string> {
  const metadata = sourceEntry._meta || {};
  const sourceValue = sourceEntry.value || sourceEntry;
  
  // Build context from metadata
  const contextParts = [];
  if (metadata.context) contextParts.push(`Context: ${metadata.context}`);
  if (metadata.component?.description) contextParts.push(`Component: ${metadata.component.description}`);
  if (metadata.usage) contextParts.push(`Usage: ${metadata.usage}`);
  if (metadata.userType) contextParts.push(`User Type: ${metadata.userType}`);
  if (metadata.tone) contextParts.push(`Tone: ${metadata.tone}`);
  
  const contextInfo = contextParts.length > 0 
    ? `\n\n**Context Information:**\n${contextParts.join('\n')}`
    : '';
  
  const prompt = `Translate this UI text for a Japanese Language Learning eLearning Platform.

**Namespace**: ${namespace}
**Key Path**: ${keyPath}
**Source Text (English)**: "${sourceValue}"
**Target Language**: ${targetLang}${contextInfo}

**CRITICAL INSTRUCTIONS**:
1. Return ONLY the translated text, nothing else
2. Preserve ALL placeholders exactly: {{variable}}, {count}, %s, etc.
3. Match the specified tone: ${metadata.tone || 'polite-formal'}
4. Consider the user type: ${metadata.userType || 'all users'}
5. Keep the same formality level as the source text
6. For Japanese: Use です/ます form for polite-formal tone
7. DO NOT add quotes, explanations, or extra formatting

**Translation:**`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const translation = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  
  // Remove any quotes that might have been added
  return translation.replace(/^["']|["']$/g, '');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: npx tsx translate-missing-keys.ts <namespace> <source> <target>');
    console.error('Example: npx tsx translate-missing-keys.ts editor.ai en ja');
    process.exit(1);
  }
  
  const [namespace, sourceLang, targetLang] = args;
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('   Export your API key: export ANTHROPIC_API_KEY=sk-ant-...\n');
    process.exit(1);
  }
  
  const workspaceRoot = path.join(__dirname, '../../../..');
  const sourceFile = path.join(workspaceRoot, 'public/locales', sourceLang, `${namespace}.json`);
  const targetFile = path.join(workspaceRoot, 'public/locales', targetLang, `${namespace}.json`);
  
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Source file not found: ${sourceFile}`);
    process.exit(1);
  }
  
  console.log(`🔍 Analyzing ${namespace} translations...\n`);
  console.log(`   Source: ${sourceLang}/${namespace}.json`);
  console.log(`   Target: ${targetLang}/${namespace}.json\n`);
  
  // Load source file
  const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
  const sourceKeys = getAllKeys(sourceData);
  
  console.log(`   Source keys: ${sourceKeys.length}`);
  
  // Load or initialize target file
  let targetData = {};
  let existingKeys: string[] = [];
  
  if (fs.existsSync(targetFile)) {
    targetData = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
    existingKeys = getAllKeys(targetData);
    console.log(`   Existing translations: ${existingKeys.length}`);
  } else {
    console.log(`   Target file doesn't exist - will create new file`);
    // Ensure target directory exists
    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }
  
  // Find missing keys
  const missingKeys = sourceKeys.filter(key => !existingKeys.includes(key));
  
  if (missingKeys.length === 0) {
    console.log('\n✅ All keys are already translated! Nothing to do.\n');
    return;
  }
  
  console.log(`   Missing translations: ${missingKeys.length}\n`);
  
  // Show sample of missing keys
  console.log('📋 Missing keys to translate:');
  missingKeys.slice(0, 10).forEach(key => console.log(`   - ${key}`));
  if (missingKeys.length > 10) {
    console.log(`   ... and ${missingKeys.length - 10} more\n`);
  } else {
    console.log('');
  }
  
  // Translate missing keys
  console.log(`🤖 Translating ${missingKeys.length} missing keys to ${targetLang}...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < missingKeys.length; i++) {
    const keyPath = missingKeys[i];
    
    if (i > 0 && i % 10 === 0) {
      console.log(`   Progress: ${i}/${missingKeys.length} keys translated...`);
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      const sourceEntry = getNestedValue(sourceData, keyPath);
      const translation = await translateKey(keyPath, sourceEntry, targetLang, namespace);
      
      // Create target entry matching source structure
      const targetEntry: any = {
        value: translation
      };
      
      // Preserve metadata structure if it exists
      if (sourceEntry._meta) {
        targetEntry._meta = { ...sourceEntry._meta };
      }
      
      setNestedValue(targetData, keyPath, targetEntry);
      successCount++;
      
      console.log(`   ✅ ${keyPath}: "${translation}"`);
    } catch (error) {
      console.error(`   ❌ Error translating ${keyPath}:`, error instanceof Error ? error.message : String(error));
      errorCount++;
    }
  }
  
  console.log(`\n   Translated ${successCount} keys (${errorCount} errors)\n`);
  
  // Save updated target file
  fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2) + '\n', 'utf-8');
  
  console.log('✅ Translation complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Namespace: ${namespace}`);
  console.log(`   - Target language: ${targetLang}`);
  console.log(`   - Total source keys: ${sourceKeys.length}`);
  console.log(`   - Previously translated: ${existingKeys.length}`);
  console.log(`   - Newly translated: ${successCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Coverage: ${Math.round((existingKeys.length + successCount) / sourceKeys.length * 100)}%\n`);
  console.log(`💾 Saved to: ${path.relative(workspaceRoot, targetFile)}\n`);
}

main().catch(console.error);
