#!/usr/bin/env tsx
/**
 * Translate missing keys with 3-model consensus validation
 * 
 * Combines:
 * - Partial translation (only missing keys)
 * - Multi-model consensus (Claude + GPT-4o + Gemini)
 * - Cryptographic proof generation
 * 
 * Usage: npx tsx translate-missing-with-consensus.ts <namespace> <source> <target> [mode]
 * Example: npx tsx translate-missing-with-consensus.ts editor.ai en ja provable
 * 
 * Modes:
 * - fake: Simulates all 3 models using Claude (free, fast)
 * - provable: Actual API calls to all 3 providers (costs ~$0.056 per 1K words)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

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

interface ModelResult {
  translation: string;
  metadata: {
    model: string;
    provider: string;
    timestamp: string;
    requestId: string;
    tokensUsed: number;
    fingerprint: string;
  };
}

interface ConsensusResult {
  translation: string;
  consensus: 'full' | 'partial' | 'none';
  models: {
    claude: string;
    gpt: string;
    gemini: string;
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Build translation prompt from metadata
 */
function buildTranslationPrompt(
  sourceValue: string,
  metadata: TranslationMetadata,
  targetLang: string,
  namespace: string,
  keyPath: string
): string {
  const contextParts = [];
  if (metadata.context) contextParts.push(`Context: ${metadata.context}`);
  if (metadata.component?.description) contextParts.push(`Component: ${metadata.component.description}`);
  if (metadata.usage) contextParts.push(`Usage: ${metadata.usage}`);
  if (metadata.userType) contextParts.push(`User Type: ${metadata.userType}`);
  if (metadata.tone) contextParts.push(`Tone: ${metadata.tone}`);
  
  const contextInfo = contextParts.length > 0 
    ? `\n\n**Context Information:**\n${contextParts.join('\n')}`
    : '';
  
  // Language-specific instructions
  const langMap: Record<string, { name: string; formalityNote: string }> = {
    'ja': { name: 'Japanese', formalityNote: 'Use です/ます form for polite-formal tone' },
    'es': { name: 'Spanish', formalityNote: 'Use formal "usted" form for polite-formal tone' },
    'de': { name: 'German', formalityNote: 'Use formal "Sie" form for polite-formal tone' },
    'fr': { name: 'French', formalityNote: 'Use formal "vous" form for polite-formal tone' },
    'zh': { name: 'Chinese (Simplified)', formalityNote: 'Use appropriate formal registers' }
  };
  
  const langInfo = langMap[targetLang] || { name: targetLang, formalityNote: 'Use appropriate formal registers' };
  
  return `Translate this UI text for an eLearning Platform.
The platform's content is in English and needs to be translated to ${langInfo.name} for international users.

**Namespace**: ${namespace}
**Key Path**: ${keyPath}
**Source Text (English)**: "${sourceValue}"
**Target Language**: ${langInfo.name} (${targetLang})${contextInfo}

**CRITICAL INSTRUCTIONS**:
1. Return ONLY the ${langInfo.name} translation, nothing else
2. Preserve ALL placeholders exactly: {{variable}}, {count}, %s, etc.
3. Match the specified tone: ${metadata.tone || 'polite-formal'}
4. Consider the user type: ${metadata.userType || 'all users'}
5. Keep the same formality level as the source text
6. ${langInfo.formalityNote}
7. DO NOT add quotes, explanations, or extra formatting
8. DO NOT translate to any language other than ${langInfo.name}

**Translation (in ${langInfo.name}):**`;
}

/**
 * Translate with Claude Sonnet 4
 */
async function translateWithClaude(
  sourceValue: string,
  metadata: TranslationMetadata,
  targetLang: string,
  namespace: string,
  keyPath: string
): Promise<ModelResult> {
  const prompt = buildTranslationPrompt(sourceValue, metadata, targetLang, namespace, keyPath);
  
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const content = message.content[0];
  const translation = content.type === 'text' ? content.text.trim() : '';
  const cleanTranslation = translation.replace(/^["']|["']$/g, '');

  return {
    translation: cleanTranslation,
    metadata: {
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      timestamp: new Date().toISOString(),
      requestId: message.id,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      fingerprint: crypto.createHash('sha256').update(cleanTranslation).digest('hex')
    }
  };
}

/**
 * Translate with GPT-4o
 */
async function translateWithGPT(
  sourceValue: string,
  metadata: TranslationMetadata,
  targetLang: string,
  namespace: string,
  keyPath: string
): Promise<ModelResult> {
  const prompt = buildTranslationPrompt(sourceValue, metadata, targetLang, namespace, keyPath);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: prompt
    }],
    max_tokens: 500,
    temperature: 0.3
  });

  const translation = response.choices[0].message.content?.trim() || '';
  const cleanTranslation = translation.replace(/^["']|["']$/g, '');

  return {
    translation: cleanTranslation,
    metadata: {
      model: 'gpt-4o',
      provider: 'openai',
      timestamp: new Date().toISOString(),
      requestId: response.id,
      tokensUsed: response.usage?.total_tokens || 0,
      fingerprint: crypto.createHash('sha256').update(cleanTranslation).digest('hex')
    }
  };
}

/**
 * Translate with Gemma 3
 */
async function translateWithGemma(
  sourceValue: string,
  metadata: TranslationMetadata,
  targetLang: string,
  namespace: string,
  keyPath: string
): Promise<ModelResult> {
  const model = gemini.getGenerativeModel({ model: 'gemma-3-12b-it' });
  const prompt = buildTranslationPrompt(sourceValue, metadata, targetLang, namespace, keyPath);
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const translation = response.text().trim();
  const cleanTranslation = translation.replace(/^["']|["']$/g, '');

  return {
    translation: cleanTranslation,
    metadata: {
      model: 'gemma-3-12b-it',
      provider: 'google-gemma',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      tokensUsed: 100, // Rough estimate
      fingerprint: crypto.createHash('sha256').update(cleanTranslation).digest('hex')
    }
  };
}

/**
 * Simulate all 3 models using Claude (fake mode)
 */
async function translateWithFakeConsensus(
  sourceValue: string,
  metadata: TranslationMetadata,
  targetLang: string,
  namespace: string,
  keyPath: string
): Promise<{
  claude: ModelResult;
  gpt: ModelResult;
  gemma: ModelResult;
}> {
  // Use Claude for all 3 "models"
  const claudeResult = await translateWithClaude(sourceValue, metadata, targetLang, namespace, keyPath);
  
  // Simulate GPT and Gemma using same translation
  const gptResult: ModelResult = {
    translation: claudeResult.translation,
    metadata: {
      model: 'gpt-4o (simulated)',
      provider: 'openai (simulated)',
      timestamp: new Date().toISOString(),
      requestId: 'fake-' + crypto.randomUUID(),
      tokensUsed: 0,
      fingerprint: crypto.createHash('sha256').update(claudeResult.translation).digest('hex')
    }
  };
  
  const gemmaResult: ModelResult = {
    translation: claudeResult.translation,
    metadata: {
      model: 'gemma-3-12b-it (simulated)',
      provider: 'google-gemma (simulated)',
      timestamp: new Date().toISOString(),
      requestId: 'fake-' + crypto.randomUUID(),
      tokensUsed: 0,
      fingerprint: crypto.createHash('sha256').update(claudeResult.translation).digest('hex')
    }
  };
  
  return { claude: claudeResult, gpt: gptResult, gemma: gemmaResult };
}

/**
 * Translate with all 3 models (provable mode)
 */
async function translateWithAllModels(
  sourceValue: string,
  metadata: TranslationMetadata,
  targetLang: string,
  namespace: string,
  keyPath: string
): Promise<{
  claude: ModelResult;
  gpt: ModelResult;
  gemma: ModelResult;
}> {
  console.log(`      calling ${keyPath}...`);
  
  const [claude, gpt, gemma] = await Promise.all([
    translateWithClaude(sourceValue, metadata, targetLang, namespace, keyPath),
    translateWithGPT(sourceValue, metadata, targetLang, namespace, keyPath),
    translateWithGemma(sourceValue, metadata, targetLang, namespace, keyPath)
  ]);
  
  // Rate limiting after parallel calls
  await delay(500);
  
  return { claude, gpt, gemma };
}

/**
 * Analyze consensus between 3 models
 */
function analyzeConsensus(
  claude: string,
  gpt: string,
  gemma: string
): ConsensusResult {
  // Full consensus - all 3 agree
  if (claude === gpt && gpt === gemma) {
    return {
      translation: claude,
      consensus: 'full',
      models: { claude, gpt, gemini: gemma }
    };
  }
  
  // Partial consensus - 2/3 agree
  if (claude === gpt) {
    return {
      translation: claude,
      consensus: 'partial',
      models: { claude, gpt, gemini: gemma }
    };
  }
  if (claude === gemma) {
    return {
      translation: claude,
      consensus: 'partial',
      models: { claude, gpt, gemini: gemma }
    };
  }
  if (gpt === gemma) {
    return {
      translation: gpt,
      consensus: 'partial',
      models: { claude, gpt, gemini: gemma }
    };
  }
  
  // No consensus - default to Claude
  return {
    translation: claude,
    consensus: 'none',
    models: { claude, gpt, gemini: gemma }
  };
}

/**
 * Recursively get all keys from translation object
 */
function getAllKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (typeof value === 'object' && value !== null) {
      if ('value' in value && typeof value.value === 'string') {
        keys.push(fullPath);
      } else {
        keys.push(...getAllKeys(value, fullPath));
      }
    } else if (typeof value === 'string') {
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
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: npx tsx translate-missing-with-consensus.ts <namespace> <source> <target> [mode]');
    console.error('Example: npx tsx translate-missing-with-consensus.ts editor.ai en ja provable');
    console.error('');
    console.error('Modes:');
    console.error('  fake     - Simulate all 3 models using Claude (free, fast)');
    console.error('  provable - Actual API calls to all 3 providers (~$0.056 per 1K words)');
    process.exit(1);
  }
  
  const [namespace, sourceLang, targetLang, mode = 'fake'] = args;
  
  if (mode !== 'fake' && mode !== 'provable') {
    console.error(`❌ Invalid mode: ${mode}. Use "fake" or "provable"`);
    process.exit(1);
  }
  
  // Validate API keys based on mode
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }
  
  if (mode === 'provable') {
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error: OPENAI_API_KEY required for provable mode');
      process.exit(1);
    }
    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ Error: GOOGLE_API_KEY required for provable mode');
      process.exit(1);
    }
  }
  
  const workspaceRoot = path.join(__dirname, '../../../..');
  const sourceFile = path.join(workspaceRoot, 'public/locales', sourceLang, `${namespace}.json`);
  const targetFile = path.join(workspaceRoot, 'public/locales', targetLang, `${namespace}.json`);
  
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Source file not found: ${sourceFile}`);
    process.exit(1);
  }
  
  console.log(`🔍 Analyzing ${namespace} translations...\n`);
  console.log(`   Mode: ${mode.toUpperCase()}`);
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
  
  // Translate missing keys with consensus
  console.log(`🤖 Translating ${missingKeys.length} missing keys with ${mode === 'fake' ? '1 model (simulated consensus)' : '3-model consensus'}...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const proofData: any[] = [];
  
  let totalTokens = { claude: 0, gpt: 0, gemini: 0 };
  
  for (let i = 0; i < missingKeys.length; i++) {
    const keyPath = missingKeys[i];
    
    if (i > 0 && i % 5 === 0) {
      console.log(`   Progress: ${i}/${missingKeys.length} keys translated...`);
    }
    
    try {
      const sourceEntry = getNestedValue(sourceData, keyPath);
      const sourceValue = sourceEntry.value || sourceEntry;
      const metadata = sourceEntry._meta || {};
      
      // Translate with all models
      let results;
      if (mode === 'fake') {
        results = await translateWithFakeConsensus(sourceValue, metadata, targetLang, namespace, keyPath);
      } else {
        results = await translateWithAllModels(sourceValue, metadata, targetLang, namespace, keyPath);
      }
      
      // Analyze consensus
      const consensus = analyzeConsensus(
        results.claude.translation,
        results.gpt.translation,
        results.gemma.translation
      );
      
      // Update token counts
      totalTokens.claude += results.claude.metadata.tokensUsed;
      totalTokens.gpt += results.gpt.metadata.tokensUsed;
      totalTokens.gemini += results.gemma.metadata.tokensUsed;
      
      // Create target entry
      const targetEntry: any = {
        value: consensus.translation
      };
      
      if (sourceEntry._meta) {
        targetEntry._meta = { ...sourceEntry._meta };
      }
      
      setNestedValue(targetData, keyPath, targetEntry);
      successCount++;
      
      // Store proof
      proofData.push({
        keyPath,
        source: sourceValue,
        translations: {
          claude: results.claude.translation,
          gpt: results.gpt.translation,
          gemma: results.gemma.translation,
          consensus: consensus.translation
        },
        consensusLevel: consensus.consensus,
        metadata: {
          claude: results.claude.metadata,
          gpt: results.gpt.metadata,
          gemma: results.gemma.metadata
        }
      });
      
      const consensusSymbol = consensus.consensus === 'full' ? '✅' : consensus.consensus === 'partial' ? '⚠️' : '❌';
      console.log(`   ${consensusSymbol} ${keyPath}: "${consensus.translation}" [${consensus.consensus}]`);
      
      if (consensus.consensus === 'none') {
        console.log(`      Claude: "${results.claude.translation}"`);
        console.log(`      GPT:    "${results.gpt.translation}"`);
        console.log(`      Gemma:  "${results.gemma.translation}"`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error translating ${keyPath}:`, error instanceof Error ? error.message : String(error));
      errorCount++;
    }
  }
  
  console.log(`\n   Translated ${successCount} keys (${errorCount} errors)\n`);
  
  // Save updated target file
  fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2) + '\n', 'utf-8');
  
  // Save proof document
  const cacheDir = path.join(workspaceRoot, '.translation-cache', new Date().toISOString().split('T')[0], targetLang);
  fs.mkdirSync(cacheDir, { recursive: true });
  
  const proofDocument = {
    namespace,
    sourceLang,
    targetLang,
    mode,
    timestamp: new Date().toISOString(),
    summary: {
      totalKeys: sourceKeys.length,
      existingKeys: existingKeys.length,
      translatedKeys: successCount,
      errors: errorCount,
      coverage: Math.round((existingKeys.length + successCount) / sourceKeys.length * 100)
    },
    tokens: totalTokens,
    translations: proofData,
    fingerprint: crypto.createHash('sha256')
      .update(JSON.stringify(targetData))
      .digest('hex')
  };
  
  const proofFile = path.join(cacheDir, `${namespace}-consensus-proof.json`);
  fs.writeFileSync(proofFile, JSON.stringify(proofDocument, null, 2) + '\n', 'utf-8');
  
  console.log('✅ Translation complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Namespace: ${namespace}`);
  console.log(`   - Target language: ${targetLang}`);
  console.log(`   - Mode: ${mode}`);
  console.log(`   - Total source keys: ${sourceKeys.length}`);
  console.log(`   - Previously translated: ${existingKeys.length}`);
  console.log(`   - Newly translated: ${successCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Coverage: ${Math.round((existingKeys.length + successCount) / sourceKeys.length * 100)}%`);
  
  if (mode === 'provable') {
    console.log(`\n💰 Token Usage:`);
    console.log(`   - Claude: ${totalTokens.claude} tokens`);
    console.log(`   - GPT-4o: ${totalTokens.gpt} tokens`);
    console.log(`   - Gemma:  ${totalTokens.gemini} tokens`);
  }
  
  console.log(`\n💾 Files saved:`);
  console.log(`   - Target: ${path.relative(workspaceRoot, targetFile)}`);
  console.log(`   - Proof:  ${path.relative(workspaceRoot, proofFile)}\n`);
}

main().catch(console.error);
