// scripts/translate-with-proof.ts
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface TranslationKey {
  value: string;
  context: string;
  component: {
    location: string;
    description: string;
  };
  usage: string;
  impact: string;
  userType: string;
  tone: string;
  alternativeTerms?: string[];
}

interface TranslationSource {
  [key: string]: string | TranslationKey;
}

interface TranslationResult {
  translation: Record<string, string>;
  metadata: {
    model: string;
    provider: string;
    timestamp: string;
    requestId: string;
    tokensUsed: number;
    fingerprint: string; // Hash of response for verification
  };
}

// Initialize clients
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Rate limiting delay to avoid API quotas
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Progress logging helpers
function formatProgress(current: number, total: number, label: string): string {
  const percentage = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  return `  [${bar}] ${percentage}% ${label} (${current}/${total})`;
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

async function translateWithClaude(
  sourceData: TranslationSource,
  targetLang: string
): Promise<TranslationResult> {
  const translations: Record<string, string> = {};
  let totalTokens = 0;
  let lastRequestId = '';
  const keys = Object.entries(sourceData);
  const startTime = Date.now();

  console.log(`\n🤖 Claude Sonnet 4 - Starting translation of ${keys.length} keys...`);

  for (let i = 0; i < keys.length; i++) {
    const [key, data] = keys[i];
    // Handle both legacy string format and new metadata format
    const isMetadataFormat = typeof data === 'object' && 'value' in data;
    const value = isMetadataFormat ? data.value : data;
    
    // Show progress every key or every 10% of keys (whichever is more frequent)
    const shouldShowProgress = i % Math.max(1, Math.floor(keys.length / 10)) === 0 || i === keys.length - 1;
    if (shouldShowProgress) {
      const elapsed = Date.now() - startTime;
      const avgTimePerKey = i > 0 ? elapsed / i : 500;
      console.log(formatProgress(i + 1, keys.length, `Claude: "${key.substring(0, 30)}..."`));
      if (i < keys.length - 1) {
        console.log(`    ${estimateTimeRemaining(i + 1, keys.length, avgTimePerKey)}`);
      }
    }
    
    let prompt: string;
    
    if (isMetadataFormat) {
      const metadata = data as TranslationKey;
      const altTerms = metadata.alternativeTerms?.join(', ') || 'none';
      
      prompt = `Translate this UI text for an eLearning platform:

**Word/Phrase to Translate:** "${metadata.value}"

**Context:** ${metadata.context}

**Component:** ${metadata.component?.description || 'General UI'}

**Usage:** ${metadata.usage}

**User Type:** ${metadata.userType}

**Tone:** ${metadata.tone}

**Alternative Terms:** ${altTerms}

**Target Language:** ${targetLang}

**CRITICAL INSTRUCTIONS:**
- Return ONLY the translated word/phrase, nothing else
- Preserve any placeholders: {{variables}}, {count}, etc.
- Match the specified tone (${metadata.tone})
- Consider how ${metadata.userType} users will read this in context of: ${metadata.usage}
- For Japanese: Use です/ます form for "polite-formal" tone, plain form for "casual"
- Do NOT add explanations, quotes, or extra formatting
- Do NOT wrap the response in code blocks or markdown

**Translation:**`;
    } else {
      // Fallback for legacy string-only format
      prompt = `Translate this UI text for an eLearning platform to ${targetLang}.

**Text:** "${value}"

**Context:** This is from a ${key.includes('_') ? key.split('_').join(' ') : key} feature in an educational web application where instructors create content and students complete assignments.

**CRITICAL:**
- Return ONLY the translated text, no explanations
- Preserve any placeholders like {{variables}}
- Use appropriate formality for educational context
- For Japanese: Use です/ます polite form

**Translation:**`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    const translatedText = content.type === 'text' ? content.text.trim() : '';
    
    translations[key] = translatedText;
    totalTokens += message.usage.input_tokens + message.usage.output_tokens;
    lastRequestId = message.id;
    
    // Rate limiting: delay between requests (Claude has high limits, but be safe)
    if (i < keys.length - 1) {
      await delay(500); // 500ms between requests
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ Claude completed in ${elapsed}s - ${totalTokens} tokens`);

  return {
    translation: translations,
    metadata: {
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      timestamp: new Date().toISOString(),
      requestId: lastRequestId,
      tokensUsed: totalTokens,
      fingerprint: crypto.createHash('sha256')
        .update(JSON.stringify(translations))
        .digest('hex')
    }
  };
}

async function translateWithGPT(
  sourceData: TranslationSource,
  targetLang: string
): Promise<TranslationResult> {
  const translations: Record<string, string> = {};
  let totalTokens = 0;
  let lastRequestId = '';
  const keys = Object.entries(sourceData);
  const startTime = Date.now();

  console.log(`\n🤖 GPT-4o - Starting translation of ${keys.length} keys...`);

  for (let i = 0; i < keys.length; i++) {
    const [key, data] = keys[i];
    const isMetadataFormat = typeof data === 'object' && 'value' in data;
    const value = isMetadataFormat ? data.value : data;
    
    // Show progress every key or every 10% of keys
    const shouldShowProgress = i % Math.max(1, Math.floor(keys.length / 10)) === 0 || i === keys.length - 1;
    if (shouldShowProgress) {
      const elapsed = Date.now() - startTime;
      const avgTimePerKey = i > 0 ? elapsed / i : 500;
      console.log(formatProgress(i + 1, keys.length, `GPT: "${key.substring(0, 30)}..."`));
      if (i < keys.length - 1) {
        console.log(`    ${estimateTimeRemaining(i + 1, keys.length, avgTimePerKey)}`);
      }
    }
    
    let prompt: string;
    
    if (isMetadataFormat) {
      const metadata = data as TranslationKey;
      const altTerms = metadata.alternativeTerms?.join(', ') || 'none';
      
      prompt = `Translate this UI text for an eLearning platform:

**Word/Phrase to Translate:** "${metadata.value}"

**Context:** ${metadata.context}

**Component:** ${metadata.component?.description || 'General UI'}

**Usage:** ${metadata.usage}

**User Type:** ${metadata.userType}

**Tone:** ${metadata.tone}

**Alternative Terms:** ${altTerms}

**Target Language:** ${targetLang}

**CRITICAL INSTRUCTIONS:**
- Return ONLY the translated word/phrase, nothing else
- Preserve any placeholders: {{variables}}, {count}, etc.
- Match the specified tone (${metadata.tone})
- Consider how ${metadata.userType} users will read this in context of: ${metadata.usage}
- For Japanese: Use です/ます form for "polite-formal" tone, plain form for "casual"
- Do NOT add explanations, quotes, or extra formatting
- Do NOT wrap the response in code blocks or markdown

**Translation:**`;
    } else {
      prompt = `Translate this UI text for an eLearning platform to ${targetLang}.

**Text:** "${value}"

**Context:** This is from a ${key.includes('_') ? key.split('_').join(' ') : key} feature in an educational web application where instructors create content and students complete assignments.

**CRITICAL:**
- Return ONLY the translated text, no explanations
- Preserve any placeholders like {{variables}}
- Use appropriate formality for educational context
- For Japanese: Use です/ます polite form

**Translation:**`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 200,
      temperature: 0.3
    });

    const translatedText = response.choices[0].message.content?.trim() || '';
    
    translations[key] = translatedText;
    totalTokens += response.usage?.total_tokens || 0;
    lastRequestId = response.id;
    
    // Rate limiting: delay between requests
    if (i < keys.length - 1) {
      await delay(500); // 500ms between requests
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ GPT completed in ${elapsed}s - ${totalTokens} tokens`);

  return {
    translation: translations,
    metadata: {
      model: 'gpt-4o',
      provider: 'openai',
      timestamp: new Date().toISOString(),
      requestId: lastRequestId,
      tokensUsed: totalTokens,
      fingerprint: crypto.createHash('sha256')
        .update(JSON.stringify(translations))
        .digest('hex')
    }
  };
}

async function translateWithTranslateGemma(
  sourceData: TranslationSource,
  targetLang: string
): Promise<TranslationResult> {
  const model = gemini.getGenerativeModel({ model: 'gemma-3-12b-it' });
  const translations: Record<string, string> = {};
  let totalTokens = 0;
  const keys = Object.entries(sourceData);
  const startTime = Date.now();

  console.log(`\n🤖 Gemma 3-12B - Starting translation of ${keys.length} keys...`);
  console.log(`  ⚠️  Rate limited to 28 req/min (2.1s delay per key)`);

  for (let i = 0; i < keys.length; i++) {
    const [key, data] = keys[i];
    const isMetadataFormat = typeof data === 'object' && 'value' in data;
    const value = isMetadataFormat ? data.value : data;
    
    // Show progress every key or every 10% of keys
    const shouldShowProgress = i % Math.max(1, Math.floor(keys.length / 10)) === 0 || i === keys.length - 1;
    if (shouldShowProgress) {
      const elapsed = Date.now() - startTime;
      const avgTimePerKey = i > 0 ? elapsed / i : 2100;
      console.log(formatProgress(i + 1, keys.length, `Gemma: "${key.substring(0, 30)}..."`));
      if (i < keys.length - 1) {
        console.log(`    ${estimateTimeRemaining(i + 1, keys.length, avgTimePerKey)}`);
      }
    }
    
    let prompt: string;
    
    if (isMetadataFormat) {
      const metadata = data as TranslationKey;
      const altTerms = metadata.alternativeTerms?.join(', ') || 'none';
      
      prompt = `Translate this UI text for an eLearning platform:

**Word/Phrase to Translate:** "${metadata.value}"

**Context:** ${metadata.context}

**Component:** ${metadata.component?.description || 'General UI'}

**Usage:** ${metadata.usage}

**User Type:** ${metadata.userType}

**Tone:** ${metadata.tone}

**Alternative Terms:** ${altTerms}

**Target Language:** ${targetLang}

**CRITICAL INSTRUCTIONS:**
- Return ONLY the translated word/phrase, nothing else
- Preserve any placeholders: {{variables}}, {count}, etc.
- Match the specified tone (${metadata.tone})
- Consider how ${metadata.userType} users will read this in context of: ${metadata.usage}
- For Japanese: Use です/ます form for "polite-formal" tone, plain form for "casual"
- Do NOT add explanations, quotes, or extra formatting
- Do NOT wrap the response in code blocks or markdown

**Translation:**`;
    } else {
      prompt = `Translate this UI text for an eLearning platform to ${targetLang}.

**Text:** "${value}"

**Context:** This is from a ${key.includes('_') ? key.split('_').join(' ') : key} feature in an educational web application where instructors create content and students complete assignments.

**CRITICAL:**
- Return ONLY the translated text, no explanations
- Preserve any placeholders like {{variables}}
- Use appropriate formality for educational context
- For Japanese: Use です/ます polite form

**Translation:**`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();
    
    translations[key] = translatedText;
    // Gemma doesn't provide detailed token counts in the same way
    totalTokens += 100; // Rough estimate
    
    // CRITICAL: Gemma 3 has 30 requests/minute limit - add delay
    if (i < keys.length - 1) {
      await delay(2100); // 2.1 seconds = max 28 requests/minute to stay under limit
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ Gemma completed in ${elapsed}s - ${totalTokens} tokens (estimated)`);

  return {
    translation: translations,
    metadata: {
      model: 'gemma-3-12b-it',
      provider: 'google',
      timestamp: new Date().toISOString(),
      requestId: 'gemma-batch',
      tokensUsed: totalTokens,
      fingerprint: crypto.createHash('sha256')
        .update(JSON.stringify(translations))
        .digest('hex')
    }
  };
}

async function translateNamespace(
  namespace: string,
  sourceLang: string,
  targetLang: string
) {
  const overallStartTime = Date.now();
  
  console.log('\n' + '='.repeat(80));
  console.log(`📚 TRANSLATING NAMESPACE: ${namespace}`);
  console.log(`   Source: ${sourceLang} → Target: ${targetLang}`);
  console.log('='.repeat(80));

  const sourcePath = `public/locales/${sourceLang}/${namespace}.json`;
  const sourceText = fs.readFileSync(sourcePath, 'utf-8');
  const sourceData: TranslationSource = JSON.parse(sourceText);

  // Flatten nested objects for translation
  const flattenedSource = flattenObject(sourceData);
  const totalKeys = Object.keys(flattenedSource).length;
  
  console.log(`\n📊 Translation scope: ${totalKeys} keys`);
  console.log(`   Using metadata-driven translation with 3 AI models in parallel`);

  // Translate with all 3 models in parallel (now per-key with metadata)
  let claudeResult: TranslationResult;
  let gptResult: TranslationResult;
  let translateGemmaResult: TranslationResult;
  
  try {
    console.log('\n🚀 Phase 1/3: Parallel Model Translation');
    console.log('-'.repeat(80));
    const translationStartTime = Date.now();
    
    [claudeResult, gptResult, translateGemmaResult] = await Promise.all([
      translateWithClaude(flattenedSource, targetLang),
      translateWithGPT(flattenedSource, targetLang),
      translateWithTranslateGemma(flattenedSource, targetLang)
    ]);
    
    const translationElapsed = ((Date.now() - translationStartTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Phase 1 Complete - All 3 models finished in ${translationElapsed}s`);
    console.log('='.repeat(80));
  } catch (error) {
    console.error(`\n❌ Translation failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error('   All models must complete successfully. Aborting.');
    process.exit(1);
  }

  // Save individual model outputs with metadata
  console.log('\n💾 Phase 2/3: Consensus Analysis & Caching');
  console.log('-'.repeat(80));
  
  const cacheDir = `.translation-cache/${new Date().toISOString().split('T')[0]}/${targetLang}`;
  fs.mkdirSync(cacheDir, { recursive: true});

  console.log(`   💾 Saving individual model outputs to: ${cacheDir}`);
  
  if (claudeResult) {
    fs.writeFileSync(
      `${cacheDir}/${namespace}-claude.json`,
      JSON.stringify(claudeResult.translation, null, 2)
    );
    fs.writeFileSync(
      `${cacheDir}/${namespace}-claude-metadata.json`,
      JSON.stringify(claudeResult.metadata, null, 2)
    );
  }

  if (gptResult) {
    fs.writeFileSync(
      `${cacheDir}/${namespace}-gpt.json`,
      JSON.stringify(gptResult.translation, null, 2)
    );
    fs.writeFileSync(
      `${cacheDir}/${namespace}-gpt-metadata.json`,
      JSON.stringify(gptResult.metadata, null, 2)
    );
  }

  if (translateGemmaResult) {
    fs.writeFileSync(
      `${cacheDir}/${namespace}-translategemma.json`,
      JSON.stringify(translateGemmaResult.translation, null, 2)
    );
    fs.writeFileSync(
      `${cacheDir}/${namespace}-translategemma-metadata.json`,
      JSON.stringify(translateGemmaResult.metadata, null, 2)
    );
  }

  // Perform consensus analysis (handle null results from failed models)
  console.log(`   🤝 Analyzing consensus across ${totalKeys} translations...`);
  const consensus = analyzeConsensus(
    claudeResult?.translation || {},
    gptResult?.translation || {},
    translateGemmaResult?.translation || {}
  );

  // Calculate consensus statistics
  let exactMatches = 0;
  let twoOutOfThree = 0;
  let noConsensus = 0;
  
  // Get all keys from successful translations
  const allKeys = new Set([
    ...Object.keys(claudeResult?.translation || {}),
    ...Object.keys(gptResult?.translation || {}),
    ...Object.keys(translateGemmaResult?.translation || {})
  ]);
  
  for (const key of allKeys) {
    const translations = [
      claudeResult?.translation[key],
      gptResult?.translation[key],
      translateGemmaResult?.translation[key]
    ].filter(t => t !== undefined);
    
    if (translations[0] === translations[1] && translations[1] === translations[2]) {
      exactMatches++;
    } else if (
      translations[0] === translations[1] ||
      translations[0] === translations[2] ||
      translations[1] === translations[2]
    ) {
      twoOutOfThree++;
    } else {
      noConsensus++;
    }
  }

  console.log(`   📊 Consensus breakdown:`);
  console.log(`      - 3/3 exact match: ${exactMatches} (${Math.round(exactMatches/totalKeys*100)}%)`);
  console.log(`      - 2/3 consensus: ${twoOutOfThree} (${Math.round(twoOutOfThree/totalKeys*100)}%)`);
  console.log(`      - No consensus (defaulted to Claude): ${noConsensus} (${Math.round(noConsensus/totalKeys*100)}%)`);

  console.log('\n💾 Phase 3/3: Saving Final Outputs');
  console.log('-'.repeat(80));

  // Unflatten consensus back to nested structure and save
  const unflattened = unflattenObject(consensus);
  const outputPath = `public/locales/${targetLang}/${namespace}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(unflattened, null, 2));
  console.log(`   ✅ Final translation saved: ${outputPath}`);

  // Generate proof document with source data included
  const proof = {
    namespace,
    sourceLang,
    targetLang,
    timestamp: new Date().toISOString(),
    models: [
      ...(claudeResult ? [{
        name: claudeResult.metadata.model,
        provider: claudeResult.metadata.provider,
        requestId: claudeResult.metadata.requestId,
        fingerprint: claudeResult.metadata.fingerprint,
        status: 'success' as const
      }] : [{ name: 'claude-sonnet-4-20250514', provider: 'anthropic', status: 'failed' as const }]),
      ...(gptResult ? [{
        name: gptResult.metadata.model,
        provider: gptResult.metadata.provider,
        requestId: gptResult.metadata.requestId,
        fingerprint: gptResult.metadata.fingerprint,
        status: 'success' as const
      }] : [{ name: 'gpt-4o', provider: 'openai', status: 'failed' as const }]),
      ...(translateGemmaResult ? [{
        name: translateGemmaResult.metadata.model,
        provider: translateGemmaResult.metadata.provider,
        requestId: translateGemmaResult.metadata.requestId,
        fingerprint: translateGemmaResult.metadata.fingerprint,
        status: 'success' as const
      }] : [{ name: 'gemma-3-12b-it', provider: 'google-gemma', status: 'failed' as const }])
    ],
    consensusFingerprint: crypto.createHash('sha256')
      .update(JSON.stringify(consensus))
      .digest('hex'),
    consensus: {
      source: extractValues(sourceData),
      claude: claudeResult?.translation || null,
      gpt: gptResult?.translation || null,
      translategemma: translateGemmaResult?.translation || null,
      final: consensus
    }
  };

  const proofPath = `${cacheDir}/${namespace}-proof.json`;
  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
  console.log(`   🔐 Cryptographic proof saved: ${proofPath}`);

  const overallElapsed = ((Date.now() - overallStartTime) /1000).toFixed(1);
  
  console.log('\n' + '='.repeat(80));
  console.log(`🎉 TRANSLATION COMPLETE: ${namespace}`);
  console.log('='.repeat(80));
  console.log(`   Total time: ${overallElapsed}s`);
  console.log(`   Keys processed: ${totalKeys}`);
  console.log(`   Token usage:`);
  if (claudeResult) console.log(`      - Claude: ${claudeResult.metadata.tokensUsed.toLocaleString()}`);
  if (gptResult) console.log(`      - GPT: ${gptResult.metadata.tokensUsed.toLocaleString()}`);
  if (translateGemmaResult) console.log(`      - Gemma: ${translateGemmaResult.metadata.tokensUsed.toLocaleString()} (est)`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Cache: ${cacheDir}`);
  console.log('='.repeat(80) + '\n');

  return proof;
}

// Helper function to flatten nested objects with dot notation
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    // Check if it's a metadata object with 'value' field
    if (typeof value === 'object' && value !== null && 'value' in value) {
      flattened[newKey] = value;
    }
    // Check if it's a nested object (but not metadata format)
    else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !('value' in value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    }
    // It's a string value
    else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

// Helper function to unflatten dot notation back to nested objects
function unflattenObject(flattened: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(flattened)) {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  return result;
}

// Extract just the values from metadata format for comparison
function extractValues(sourceData: TranslationSource): Record<string, string> {
  return flattenObject(sourceData);
}

function analyzeConsensus(
  claude: Record<string, string>,
  gpt: Record<string, string>,
  gemini: Record<string, string>
): Record<string, string> {
  const consensus: Record<string, string> = {};
  
  // Get all keys from Claude (should match GPT and Gemini)
  for (const key of Object.keys(claude)) {
    const translations = [
      claude[key],
      gpt[key],
      gemini[key]
    ];
    
    // Exact match consensus
    if (translations[0] === translations[1] && translations[1] === translations[2]) {
      consensus[key] = translations[0];
    }
    // 2/3 consensus
    else if (translations[0] === translations[1]) {
      consensus[key] = translations[0];
    } else if (translations[0] === translations[2]) {
      consensus[key] = translations[0];
    } else if (translations[1] === translations[2]) {
      consensus[key] = translations[1];
    }
    // No consensus - default to Claude
    else {
      consensus[key] = claude[key];
    }
  }
  
  return consensus;
}

// CLI execution
const [namespace, sourceLang, targetLang] = process.argv.slice(2);
translateNamespace(namespace, sourceLang, targetLang)
  .then(proof => {
    console.log('Translation complete!');
    console.log('Proof:', proof);
  })
  .catch(console.error);