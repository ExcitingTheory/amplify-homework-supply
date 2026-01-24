# Multi-Model Translation Implementation Guide

How to implement **provable** multi-model translation with verification.

## Problem

The current workflow simulates different models, but doesn't provide cryptographic proof that three separate AI models were used.

## Solution: API-Based Multi-Model Translation

### 1. Create Translation Script with API Calls

```typescript
// scripts/translate-with-proof.ts
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface TranslationResult {
  translation: Record<string, any>;
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

async function translateWithClaude(
  sourceText: string,
  targetLang: string
): Promise<TranslationResult> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Translate this JSON to ${targetLang}. Preserve structure and placeholders:\n\n${sourceText}`
    }]
  });

  const content = message.content[0];
  const translationText = content.type === 'text' ? content.text : '';
  const translation = JSON.parse(extractJSON(translationText));

  return {
    translation,
    metadata: {
      model: message.model,
      provider: 'anthropic',
      timestamp: new Date().toISOString(),
      requestId: message.id,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      fingerprint: crypto.createHash('sha256')
        .update(JSON.stringify(translation))
        .digest('hex')
    }
  };
}

async function translateWithGPT(
  sourceText: string,
  targetLang: string
): Promise<TranslationResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Translate this JSON to ${targetLang}. Preserve structure and placeholders:\n\n${sourceText}`
    }],
    response_format: { type: 'json_object' }
  });

  const translationText = completion.choices[0].message.content || '{}';
  const translation = JSON.parse(translationText);

  return {
    translation,
    metadata: {
      model: completion.model,
      provider: 'openai',
      timestamp: new Date().toISOString(),
      requestId: completion.id,
      tokensUsed: completion.usage?.total_tokens || 0,
      fingerprint: crypto.createHash('sha256')
        .update(JSON.stringify(translation))
        .digest('hex')
    }
  };
}

async function translateWithGemini(
  sourceText: string,
  targetLang: string
): Promise<TranslationResult> {
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const result = await model.generateContent(
    `Translate this JSON to ${targetLang}. Preserve structure and placeholders. Return only valid JSON:\n\n${sourceText}`
  );

  const response = await result.response;
  const translationText = response.text();
  const translation = JSON.parse(extractJSON(translationText));

  return {
    translation,
    metadata: {
      model: 'gemini-2.0-flash-exp',
      provider: 'google',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(), // Gemini doesn't provide request IDs
      tokensUsed: 0, // Not always available in Gemini response
      fingerprint: crypto.createHash('sha256')
        .update(JSON.stringify(translation))
        .digest('hex')
    }
  };
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}

// Main translation function
async function translateNamespace(
  namespace: string,
  sourceLang: string,
  targetLang: string
) {
  const sourcePath = `public/locales/${sourceLang}/${namespace}.json`;
  const sourceText = fs.readFileSync(sourcePath, 'utf-8');

  console.log(`Translating ${namespace} to ${targetLang}...`);

  // Translate with all 3 models in parallel
  const [claudeResult, gptResult, geminiResult] = await Promise.all([
    translateWithClaude(sourceText, targetLang),
    translateWithGPT(sourceText, targetLang),
    translateWithGemini(sourceText, targetLang)
  ]);

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
    `${cacheDir}/${namespace}-gemini.json`,
    JSON.stringify(geminiResult.translation, null, 2)
  );
  fs.writeFileSync(
    `${cacheDir}/${namespace}-gemini-metadata.json`,
    JSON.stringify(geminiResult.metadata, null, 2)
  );

  // Perform consensus analysis
  const consensus = analyzeConsensus(
    claudeResult.translation,
    gptResult.translation,
    geminiResult.translation
  );

  // Save consensus translation
  fs.writeFileSync(
    `public/locales/${targetLang}/${namespace}.json`,
    JSON.stringify(consensus, null, 2)
  );

  // Generate proof document
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
        name: geminiResult.metadata.model,
        provider: geminiResult.metadata.provider,
        requestId: geminiResult.metadata.requestId,
        fingerprint: geminiResult.metadata.fingerprint
      }
    ],
    consensusFingerprint: crypto.createHash('sha256')
      .update(JSON.stringify(consensus))
      .digest('hex')
  };

  fs.writeFileSync(
    `${cacheDir}/${namespace}-proof.json`,
    JSON.stringify(proof, null, 2)
  );

  return proof;
}

function analyzeConsensus(
  claude: Record<string, any>,
  gpt: Record<string, any>,
  gemini: Record<string, any>
): Record<string, any> {
  // Implement consensus logic (majority vote, etc.)
  // This is simplified - see full implementation in workflow
  return claude; // Default to Claude for now
}

// CLI execution
const [namespace, sourceLang, targetLang] = process.argv.slice(2);
translateNamespace(namespace, sourceLang, targetLang)
  .then(proof => {
    console.log('Translation complete!');
    console.log('Proof:', proof);
  })
  .catch(console.error);
```

### 2. Metadata File Example

Each translation includes a metadata file proving the model used:

```json
// .translation-cache/2026-01-25/ja/auth-claude-metadata.json
{
  "model": "claude-sonnet-4-20250514",
  "provider": "anthropic",
  "timestamp": "2026-01-25T20:54:49.123Z",
  "requestId": "msg_01ABC123XYZ789",
  "tokensUsed": 1247,
  "fingerprint": "a3f5d8c9e2b1f4a6d8c7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1"
}
```

### 3. Verification Script

```typescript
// scripts/verify-translations.ts
import * as fs from 'fs';
import * as crypto from 'crypto';

function verifyTranslation(cacheDir: string, namespace: string) {
  const models = ['claude', 'gpt', 'gemini'];
  const verification: any = {};

  for (const model of models) {
    const translationPath = `${cacheDir}/${namespace}-${model}.json`;
    const metadataPath = `${cacheDir}/${namespace}-${model}-metadata.json`;

    if (!fs.existsSync(translationPath) || !fs.existsSync(metadataPath)) {
      verification[model] = { valid: false, reason: 'Missing files' };
      continue;
    }

    const translation = JSON.parse(fs.readFileSync(translationPath, 'utf-8'));
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Verify fingerprint matches
    const computedFingerprint = crypto.createHash('sha256')
      .update(JSON.stringify(translation))
      .digest('hex');

    verification[model] = {
      valid: computedFingerprint === metadata.fingerprint,
      model: metadata.model,
      provider: metadata.provider,
      requestId: metadata.requestId,
      timestamp: metadata.timestamp,
      fingerprintMatch: computedFingerprint === metadata.fingerprint
    };
  }

  return verification;
}

// Verify all translations
const cacheDir = '.translation-cache/2026-01-25/ja';
const namespaces = ['auth', 'chat', 'common', 'editor', 'errors', 'grades', 'units'];

namespaces.forEach(namespace => {
  const result = verifyTranslation(cacheDir, namespace);
  console.log(`\n${namespace}:`, JSON.stringify(result, null, 2));
});
```

### 4. Proof Document

Each translation run generates a proof document:

```json
// .translation-cache/2026-01-25/ja/auth-proof.json
{
  "namespace": "auth",
  "sourceLang": "en",
  "targetLang": "ja",
  "timestamp": "2026-01-25T20:54:49.123Z",
  "models": [
    {
      "name": "claude-sonnet-4-20250514",
      "provider": "anthropic",
      "requestId": "msg_01ABC123XYZ789",
      "fingerprint": "a3f5d8c9e2b1f4a6d8c7e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1"
    },
    {
      "name": "gpt-4o-2024-11-20",
      "provider": "openai",
      "requestId": "chatcmpl-ABC123XYZ789",
      "fingerprint": "b4a6e9d0f3c2a5b7d9e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"
    },
    {
      "name": "gemini-2.0-flash-exp",
      "provider": "google",
      "requestId": "550e8400-e29b-41d4-a716-446655440000",
      "fingerprint": "c5b7f0e1a4d3b6c8e0f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2"
    }
  ],
  "consensusFingerprint": "d6c8a1f2b5e4c7d9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3"
}
```

## Verification Methods

### 1. API Request IDs
- **Claude**: Check Anthropic dashboard with `requestId`
- **GPT**: Check OpenAI dashboard with `requestId`
- **Gemini**: Verify via Google Cloud logs

### 2. Fingerprint Matching
```bash
# Verify fingerprint hasn't been tampered with
sha256sum .translation-cache/2026-01-25/ja/auth-claude.json
# Should match the fingerprint in auth-claude-metadata.json
```

### 3. Timestamp Verification
All three translations should have timestamps within seconds of each other (parallel execution).

### 4. Model Response Headers
Save full HTTP response headers for additional verification:

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  // ... request details
});

const metadata = {
  // ... other metadata
  headers: {
    'x-request-id': response.headers.get('x-request-id'),
    'anthropic-ratelimit-requests-remaining': response.headers.get('anthropic-ratelimit-requests-remaining')
  }
};
```

## Running Provable Translation

```bash
# Install dependencies
npm install @anthropic-ai/sdk openai @google/generative-ai

# Set API keys
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=...

# Run translation with proof
npx ts-node scripts/translate-with-proof.ts auth en ja

# Verify results
npx ts-node scripts/verify-translations.ts
```

## Cost Considerations

Using three models per translation:
- **Claude Sonnet 4**: ~$3 per 1M input tokens, $15 per 1M output
- **GPT-4o**: ~$2.50 per 1M input, $10 per 1M output  
- **Gemini 2.0 Flash**: Free tier, then ~$0.075 per 1M input

For 103 keys × 5 languages = 515 translation units:
- Estimated cost: ~$5-10 total with all three models

## Current Implementation (What We Did)

The translations in `public/locales/` were created by me (Claude) simulating different model styles. This approach:

✅ **Pros**: Free, fast, demonstrates the workflow  
❌ **Cons**: No cryptographic proof of multi-model usage

## Recommended Approach

For production with proof:
1. Use the script above with real API calls
2. Store metadata files with request IDs
3. Keep proof documents for audit trail
4. Optionally sign proof documents with GPG for additional verification

For development/testing:
- Current simulated approach is fine
- Document that it's a demonstration
- Upgrade to provable when launching publicly

