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
import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 8, // concurrent runs can hit 429s; the SDK backs off between retries
});

const TRANSLATION_MODEL = process.env.TRANSLATION_MODEL || 'claude-sonnet-5-5';

// Progress logging helpers
function formatProgress(current: number, total: number, label: string): string {
  const percentage = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  return `  [${bar}] ${percentage}% (${current}/${total}) ${label}`;
}

function estimateTimeRemaining(current: number, total: number, msPerItem: number): string {
  const remaining = total - current;
  const msRemaining = remaining * msPerItem;
  const seconds = Math.floor(msRemaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `~${hours}h ${minutes % 60}m remaining`;
  if (minutes > 0) return `~${minutes}m ${seconds % 60}s remaining`;
  return `~${seconds}s remaining`;
}

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
      // A `{ value, _meta }` entry, not a group that merely has a child key named "value"
      const isEntry =
        typeof value.value === 'string' &&
        Object.keys(value).every((k) => k === 'value' || k.startsWith('_'));
      if (isEntry) {
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
 * Collect ICU argument names and plural/select option selectors so a
 * translation can be checked for structural equivalence with its source.
 */
export function icuSignature(message: string): string[] {
  const signature = new Set<string>();
  const walk = (elements: MessageFormatElement[]) => {
    for (const element of elements) {
      if (element.type === TYPE.argument || element.type === TYPE.number ||
          element.type === TYPE.date || element.type === TYPE.time) {
        signature.add(`arg:${element.value}`);
      } else if (element.type === TYPE.plural || element.type === TYPE.select) {
        signature.add(`${element.type === TYPE.plural ? 'plural' : 'select'}:${element.value}`);
        for (const [selector, option] of Object.entries(element.options)) {
          signature.add(`option:${element.value}:${selector}`);
          walk(option.value);
        }
      } else if (element.type === TYPE.pound) {
        signature.add('pound');
      } else if (element.type === TYPE.tag) {
        signature.add(`tag:${element.value}`);
        walk(element.children);
      }
    }
  };
  walk(parse(message));
  return [...signature].sort();
}

/** Returns an error description, or null when the translation keeps the source's ICU structure. */
export function validateIcu(source: string, translation: string): string | null {
  if (!translation.trim()) return 'empty translation';
  let expected: string[];
  try {
    expected = icuSignature(source);
  } catch {
    return null; // Source is not ICU; nothing structural to compare.
  }
  let actual: string[];
  try {
    actual = icuSignature(translation);
  } catch (error) {
    return `invalid ICU syntax: ${error instanceof Error ? error.message : String(error)}`;
  }
  const missing = expected.filter((item) => !actual.includes(item));
  const extra = actual.filter((item) => !expected.includes(item));
  if (missing.length || extra.length) {
    return `ICU structure mismatch (missing: ${missing.join(', ') || 'none'}; unexpected: ${extra.join(', ') || 'none'})`;
  }
  return null;
}

/**
 * Insert a new top-level key directly after its nearest preceding sibling in
 * the source file so target files keep the source ordering.
 */
export function insertTopLevelInSourceOrder(target: Record<string, any>, sourceOrder: string[], key: string, value: any): Record<string, any> {
  const index = sourceOrder.indexOf(key);
  const predecessor = sourceOrder.slice(0, Math.max(index, 0)).reverse().find((candidate) => candidate in target);
  const ordered: Record<string, any> = {};
  if (!predecessor) ordered[key] = value;
  for (const [existingKey, existingValue] of Object.entries(target)) {
    ordered[existingKey] = existingValue;
    if (existingKey === predecessor) ordered[key] = value;
  }
  return ordered;
}

/**
 * Translate a single key using Claude AI with metadata context
 */
async function translateKey(
  keyPath: string,
  sourceEntry: TranslationEntry,
  targetLang: string,
  namespace: string,
  previousError?: string
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
  
  const prompt = `Translate this UI text for an eLearning Platform.

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
8. The text uses ICU MessageFormat. Keep argument names, plural/select keywords (plural, select, one, other, =0, ...) and # exactly as in the source; translate only the human-readable text inside them
${previousError ? `\n**Your previous attempt was rejected**: ${previousError}. Fix this.\n` : ''}
**Translation:**`;

  const message = await anthropic.messages.create({
    model: TRANSLATION_MODEL,
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const translation = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
  
  // Remove any quotes that might have been added
  return translation.replace(/^["']|["']$/g, '');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const positional = args.filter((arg) => !arg.startsWith('--'));
  const optionValue = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const concurrency = Math.max(1, Number(optionValue('concurrency')) || 1);
  const verbose = !args.includes('--quiet');
  const keysFile = optionValue('keys-file');
  const keyAllowList: Set<string> | null = keysFile
    ? new Set(JSON.parse(fs.readFileSync(keysFile, 'utf-8')) as string[])
    : null;
  const prefixes = args
    .filter((arg) => arg.startsWith('--prefix='))
    .map((arg) => arg.slice('--prefix='.length))
    .filter(Boolean);
  
  if (positional.length < 3) {
    console.error('Usage: npx tsx translate-missing-keys.ts <namespace> <source> <target> [--prefix=<keyPrefix>]... [--keys-file=<json array of key paths>] [--concurrency=N] [--quiet]');
    console.error('Example: npx tsx translate-missing-keys.ts editor.ai en ja');
    console.error('Example: npx tsx translate-missing-keys.ts components en de --prefix=instructorGamificationPanel.');
    process.exit(1);
  }
  
  const [namespace, sourceLang, targetLang] = positional;
  
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
  
  console.log('\n' + '='.repeat(80));
  console.log(`📚 TRANSLATING MISSING KEYS: ${namespace}`);
  console.log(`   Source: ${sourceLang} → Target: ${targetLang}`);
  console.log('='.repeat(80) + '\n');
  console.log(`🔍 Analyzing translation coverage...`);
  
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
  
  // Find missing keys, optionally scoped to the requested key prefixes
  const missingKeys = sourceKeys
    .filter(key => !existingKeys.includes(key))
    .filter(key => prefixes.length === 0 || prefixes.some((prefix) => key.startsWith(prefix)))
    .filter(key => !keyAllowList || keyAllowList.has(key));
  if (prefixes.length > 0) {
    console.log(`   Scoped to prefixes: ${prefixes.join(', ')}`);
  }
  
  if (missingKeys.length === 0) {
    console.log('\n' + '='.repeat(80));
    console.log('✅ All keys are already translated! Nothing to do.');
    console.log('='.repeat(80) + '\n');
    return;
  }
  
  const coveragePercent = Math.round((existingKeys.length / sourceKeys.length) * 100);
  console.log(`   Current coverage: ${existingKeys.length}/${sourceKeys.length} (${coveragePercent}%)`);
  console.log(`   Missing translations: ${missingKeys.length}\n`);
  
  // Show sample of missing keys
  console.log('📋 Sample of missing keys:');
  missingKeys.slice(0, 10).forEach(key => console.log(`   - ${key}`));
  if (missingKeys.length > 10) {
    console.log(`   ... and ${missingKeys.length - 10} more\n`);
  } else {
    console.log('');
  }
  
  // Translate missing keys
  console.log(`\n🤖 Translation Phase - ${TRANSLATION_MODEL}`);
  console.log('-'.repeat(80));
  
  const translationStartTime = Date.now();
  
  let successCount = 0;
  let errorCount = 0;
  const rejectedKeys: Array<{ keyPath: string; reason: string }> = [];
  const sourceTopLevelOrder = Object.keys(sourceData);
  
  type Outcome =
    | { kind: 'ok'; keyPath: string; sourceEntry: any; translation: string }
    | { kind: 'rejected'; keyPath: string; reason: string }
    | { kind: 'error'; keyPath: string; message: string };
  const outcomes: Outcome[] = new Array(missingKeys.length);
  let completed = 0;
  let aborted = false;
  
  const translateOne = async (i: number): Promise<void> => {
    const keyPath = missingKeys[i];
    try {
      const sourceEntry = getNestedValue(sourceData, keyPath);
      const sourceText: string = typeof sourceEntry === 'string' ? sourceEntry : sourceEntry.value;
      let translation = await translateKey(keyPath, sourceEntry, targetLang, namespace);
      let validationError = validateIcu(sourceText, translation);
      if (validationError) {
        translation = await translateKey(keyPath, sourceEntry, targetLang, namespace, validationError);
        validationError = validateIcu(sourceText, translation);
      }
      outcomes[i] = validationError
        ? { kind: 'rejected', keyPath, reason: validationError }
        : { kind: 'ok', keyPath, sourceEntry, translation };
    } catch (error) {
      outcomes[i] = { kind: 'error', keyPath, message: error instanceof Error ? error.message : String(error) };
    }
    completed++;
    const failedSoFar = outcomes.filter((o) => o && o.kind === 'error').length;
    const okSoFar = outcomes.filter((o) => o && o.kind === 'ok').length;
    if (okSoFar === 0 && failedSoFar >= 3) aborted = true;
    if (completed % Math.max(1, Math.floor(missingKeys.length / 10)) === 0 || completed === missingKeys.length) {
      const elapsed = Date.now() - translationStartTime;
      console.log(formatProgress(completed, missingKeys.length, keyPath.length > 35 ? keyPath.substring(0, 35) + '...' : keyPath));
      if (completed < missingKeys.length) {
        console.log(`    ${estimateTimeRemaining(completed, missingKeys.length, elapsed / completed / concurrency)}`);
      }
    }
  };
  
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, missingKeys.length) }, async () => {
      while (!aborted && nextIndex < missingKeys.length) {
        await translateOne(nextIndex++);
      }
    }),
  );
  if (aborted) {
    const firstError = outcomes.find((o) => o && o.kind === 'error') as Extract<Outcome, { kind: 'error' }> | undefined;
    console.error(`\n❌ Aborting: the first requests all failed (${firstError?.message ?? 'unknown error'}); check the model and API key. No file was written.`);
    process.exit(1);
  }
  
  // Apply results in source order so output is deterministic regardless of concurrency
  for (const outcome of outcomes) {
    if (!outcome) continue;
    if (outcome.kind === 'error') {
      errorCount++;
      console.error(`   ❌ Error translating ${outcome.keyPath}: ${outcome.message}`);
      continue;
    }
    if (outcome.kind === 'rejected') {
      rejectedKeys.push({ keyPath: outcome.keyPath, reason: outcome.reason });
      console.error(`   ⚠️  Rejected ${outcome.keyPath}: ${outcome.reason}`);
      continue;
    }
    const { keyPath, sourceEntry, translation } = outcome;
    // Match the source entry shape: plain-string files stay plain strings
    let targetEntry: any = translation;
    if (typeof sourceEntry !== 'string') {
      targetEntry = { value: translation };
      if (sourceEntry._meta) {
        targetEntry._meta = { ...sourceEntry._meta };
      }
    }
    const [topLevelKey, ...rest] = keyPath.split('.');
    if (!(topLevelKey in targetData)) {
      targetData = insertTopLevelInSourceOrder(targetData, sourceTopLevelOrder, topLevelKey, rest.length ? {} : targetEntry);
    }
    if (rest.length) setNestedValue(targetData, keyPath, targetEntry);
    successCount++;
    if (verbose) console.log(`   ✅ ${keyPath}: "${translation}"`);
  }
  
  const translationElapsed = ((Date.now() - translationStartTime) / 1000).toFixed(1);
  
  // Final progress update
  console.log(formatProgress(missingKeys.length, missingKeys.length, 'Complete'));
  console.log(`  ✅ Translation completed in ${translationElapsed}s\n`);
  
  // Save updated target file
  console.log('💾 Saving merged translation file...');
  fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2) + '\n', 'utf-8');
  
  const finalCoverage = Math.round((existingKeys.length + successCount) / sourceKeys.length * 100);
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 TRANSLATION COMPLETE');
  console.log('='.repeat(80));
  console.log('📊 Summary:');
  console.log(`   Namespace: ${namespace}`);
  console.log(`   Target language: ${targetLang}`);
  console.log(`   Total source keys: ${sourceKeys.length}`);
  console.log(`   Previously translated: ${existingKeys.length}`);
  console.log(`   Newly translated: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Rejected (ICU validation): ${rejectedKeys.length}`);
  rejectedKeys.forEach(({ keyPath, reason }) => console.log(`     - ${keyPath}: ${reason}`));
  console.log(`   Final coverage: ${finalCoverage}% (${existingKeys.length + successCount}/${sourceKeys.length})`);
  console.log(`   Time: ${translationElapsed}s`);
  console.log(`   Output: ${path.relative(workspaceRoot, targetFile)}`);
  console.log('='.repeat(80) + '\n');
}

if (require.main === module) {
  main().catch(console.error);
}
