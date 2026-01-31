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

async function translateWithClaude(
  sourceData: TranslationSource,
  targetLang: string
): Promise<TranslationResult> {
  const translations: Record<string, string> = {};
  let totalTokens = 0;
  let lastRequestId = '';
  const keys = Object.entries(sourceData);

  for (let i = 0; i < keys.length; i++) {
    const [key, data] = keys[i];
    // Handle both legacy string format and new metadata format
    const isMetadataFormat = typeof data === 'object' && 'value' in data;
    const value = isMetadataFormat ? data.value : data;
    
    let prompt: string;
    
    if (isMetadataFormat) {
      const metadata = data as TranslationKey;
      const altTerms = metadata.alternativeTerms?.join(', ') || 'none';
      
      prompt = `Translate this UI text for an eLearning platform:

**Word/Phrase to Translate:** "${metadata.value}"

**Context:** ${metadata.context}

**Component:** ${metadata.component.description}

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

  for (let i = 0; i < keys.length; i++) {
    const [key, data] = keys[i];
    const isMetadataFormat = typeof data === 'object' && 'value' in data;
    const value = isMetadataFormat ? data.value : data;
    
    let prompt: string;
    
    if (isMetadataFormat) {
      const metadata = data as TranslationKey;
      const altTerms = metadata.alternativeTerms?.join(', ') || 'none';
      
      prompt = `Translate this UI text for an eLearning platform:

**Word/Phrase to Translate:** "${metadata.value}"

**Context:** ${metadata.context}

**Component:** ${metadata.component.description}

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

  for (let i = 0; i < keys.length; i++) {
    const [key, data] = keys[i];
    const isMetadataFormat = typeof data === 'object' && 'value' in data;
    const value = isMetadataFormat ? data.value : data;
    
    let prompt: string;
    
    if (isMetadataFormat) {
      const metadata = data as TranslationKey;
      const altTerms = metadata.alternativeTerms?.join(', ') || 'none';
      
      prompt = `Translate this UI text for an eLearning platform:

**Word/Phrase to Translate:** "${metadata.value}"

**Context:** ${metadata.context}

**Component:** ${metadata.component.description}

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

  return {
    translation: translations,
    metadata: {
      model: 'gemma-3-12b-it',
      provider: 'google-gemma',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      tokensUsed: totalTokens,
      fingerprint: crypto.createHash('sha256')
        .update(JSON.stringify(translations))
        .digest('hex')
    }
  };
}

// Main translation function
async function translateNamespace(
  namespace: string,
  sourceLang: string,
  targetLang: string
) {
  const sourcePath = `public/locales/${sourceLang}/${namespace}.json`;
  const sourceText = fs.readFileSync(sourcePath, 'utf-8');
  const sourceData: TranslationSource = JSON.parse(sourceText);

  // Flatten nested objects for translation
  const flattenedSource = flattenObject(sourceData);
  
  console.log(`Translating ${namespace} to ${targetLang}...`);
  console.log(`Processing ${Object.keys(flattenedSource).length} keys with metadata-driven translation...`);

  // Translate with all 3 models in parallel (now per-key with metadata)
  let claudeResult: TranslationResult;
  let gptResult: TranslationResult;
  let translateGemmaResult: TranslationResult;
  
  try {
    console.log('  Starting parallel translation with 3 models...');
    [claudeResult, gptResult, translateGemmaResult] = await Promise.all([
      translateWithClaude(flattenedSource, targetLang).catch(err => {
        throw new Error(`Claude translation failed: ${err.message}`);
      }),
      translateWithGPT(flattenedSource, targetLang).catch(err => {
        throw new Error(`GPT translation failed: ${err.message}`);
      }),
      translateWithTranslateGemma(flattenedSource, targetLang).catch(err => {
        throw new Error(`TranslateGemma translation failed: ${err.message}`);
      })
    ]);
    console.log('  ✓ All models completed successfully');
  } catch (error) {
    console.error(`\\n❌ Translation failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error('  All models must complete successfully. Aborting.');
    process.exit(1);
  }

  // Save individual model outputs with metadata
  const cacheDir = `.translation-cache/${new Date().toISOString().split('T')[0]}/${targetLang}`;
  fs.mkdirSync(cacheDir, { recursive: true });

  fs.writeFileSync(
    `${cacheDir}/${namespace}-claude.json`,
    JSON.stringify(claudeResult.translation, null, 2)
  );
  fs.writeFileSync(
    `${cacheDir}/${namespace}-claude-metadata.json`,
    JSON.stringify(claudeResult.metadata, null, 2)
  );

  fs.writeFileSync(
    `${cacheDir}/${namespace}-gpt.json`,
    JSON.stringify(gptResult.translation, null, 2)
  );
  fs.writeFileSync(
    `${cacheDir}/${namespace}-gpt-metadata.json`,
    JSON.stringify(gptResult.metadata, null, 2)
  );

  fs.writeFileSync(
    `${cacheDir}/${namespace}-translategemma.json`,
    JSON.stringify(translateGemmaResult.translation, null, 2)
  );
  fs.writeFileSync(
    `${cacheDir}/${namespace}-translategemma-metadata.json`,
    JSON.stringify(translateGemmaResult.metadata, null, 2)
  );

  // Perform consensus analysis
  const consensus = analyzeConsensus(
    claudeResult.translation,
    gptResult.translation,
    translateGemmaResult.translation
  );

  // Unflatten consensus back to nested structure and save
  const unflattened = unflattenObject(consensus);
  fs.writeFileSync(
    `public/locales/${targetLang}/${namespace}.json`,
    JSON.stringify(unflattened, null, 2)
  );

  // Generate proof document with source data included
  const proof = {
    namespace,
    sourceLang,
    targetLang,
    timestamp: new Date().toISOString(),
    models: [
      {
        name: claudeResult.metadata.model,
        provider: claudeResult.metadata.provider,
        requestId: claudeResult.metadata.requestId,
        fingerprint: claudeResult.metadata.fingerprint
      },
      {
        name: gptResult.metadata.model,
        provider: gptResult.metadata.provider,
        requestId: gptResult.metadata.requestId,
        fingerprint: gptResult.metadata.fingerprint
      },
      {
        name: translateGemmaResult.metadata.model,
        provider: translateGemmaResult.metadata.provider,
        requestId: translateGemmaResult.metadata.requestId,
        fingerprint: translateGemmaResult.metadata.fingerprint
      }
    ],
    consensusFingerprint: crypto.createHash('sha256')
      .update(JSON.stringify(consensus))
      .digest('hex'),
    consensus: {
      source: extractValues(sourceData),
      claude: claudeResult.translation,
      gpt: gptResult.translation,
      translategemma: translateGemmaResult.translation,
      final: consensus
    }
  };

  fs.writeFileSync(
    `${cacheDir}/${namespace}-proof.json`,
    JSON.stringify(proof, null, 2)
  );

  console.log(`✅ Translation complete for ${namespace}!`);
  console.log(`Cache: ${cacheDir}`);
  console.log(`Total tokens: Claude=${claudeResult.metadata.tokensUsed}, GPT=${gptResult.metadata.tokensUsed}, TranslateGemma=${translateGemmaResult.metadata.tokensUsed}`);

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
      flattened[newKey] = value.value;
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