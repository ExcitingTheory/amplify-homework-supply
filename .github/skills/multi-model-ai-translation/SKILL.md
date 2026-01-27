---
name: multi-model-ai-translation
description: Translates content using multiple AI models in parallel (Claude, GPT-4o, Gemma) with consensus analysis, reverse translation verification, and cryptographic proof generation. Use for high-quality translations requiring accuracy validation, multi-model consensus, or auditable provenance.
---

# Multi-Model AI Translation

Parallel multi-model translation system with consensus analysis, reverse translation verification, and cryptographic proof generation.

## What This Skill Does

Executes translations using three leading AI models simultaneously (Claude Sonnet 4, GPT-4o, Gemma 3 12B), compares outputs to identify consensus, validates accuracy through reverse translation, and optionally generates cryptographic proof of translation provenance.

## When to Use

- **High-stakes translations** - Legal, medical, technical content requiring accuracy
- **Quality assurance** - Validate translation quality through multi-model consensus
- **Auditable translations** - Need cryptographic proof for compliance/audits
- **Multilingual content** - UI text, documentation, marketing materials
- **Comparison testing** - Evaluate different AI translation approaches
- **Semantic verification** - Use reverse translation to detect meaning drift

## How It Works

### Translation Modes

**1. Fake Mode** (Free, Fast)
- Uses Claude runtime to simulate all three models
- Demonstrates workflow without API costs
- No cryptographic proof
- Best for: Development, testing, demos

**2. Provable Mode** (~$5-10 cost)
- Actual parallel API calls to all three providers
- Generates cryptographic fingerprints (SHA-256)
- Records request IDs for verification
- Auditable via API dashboards
- Best for: Production releases, compliance, audits

### Workflow Phases

**Phase 1: Multi-Model Translation**
1. Send same source text to all three models in parallel
2. Each model translates independently
3. Store outputs separately with metadata

**Phase 2: Consensus Analysis**
4. Compare all three translations key-by-key
5. Detect agreement levels:
   - 3/3 exact match ✅
   - 2/3 consensus ⚠️
   - 0/3 no consensus ❌
6. Choose final translation (prefer majority)

**Phase 3: Reverse Translation Verification**
7. Translate final output back to source language
8. Compare reverse translation to original
9. Calculate semantic similarity
10. Flag keys with meaning drift

**Phase 4: Proof Generation** (Provable mode only)
11. Generate SHA-256 fingerprints of all outputs
12. Record API request IDs
13. Validate timestamps show parallel execution
14. Create verification document

## Input Schema

```typescript
interface MultiModelTranslationInput {
  /** Source text or structured data to translate */
  source: string | object;
  
  /** Target language code (ISO 639-1) */
  targetLanguage: string;
  
  /** Source language code (default: auto-detect) */
  sourceLanguage?: string;
  
  /** Translation mode */
  mode: 'fake' | 'provable';
  
  /** Context to inform translation */
  context?: {
    domain?: string;          // e.g., "medical", "legal", "ui", "marketing"
    tone?: string;            // e.g., "formal", "casual", "technical"
    audience?: string;        // e.g., "general", "experts", "children"
    preservePlaceholders?: boolean;  // Keep {{variables}}, {count}, etc.
  };
  
  /** Enable reverse translation verification */
  verifyReverse?: boolean;  // default: true
  
  /** Consensus threshold (0.0-1.0) */
  consensusThreshold?: number;  // default: 0.67 (2/3 agreement)
}
```

## Output Schema

```typescript
interface MultiModelTranslationOutput {
  /** Final consensus translation */
  translation: string | object;
  
  /** Individual model outputs */
  models: {
    claude: string | object;
    gpt: string | object;
    translategemma: string | object;
  };
  
  /** Consensus analysis */
  consensus: {
    level: 'full' | 'partial' | 'none';
    agreement: number;  // 0.0-1.0
    differences: Array<{
      path: string;
      claude: string;
      gpt: string;
      translategemma: string;
      chosen: string;
    }>;
  };
  
  /** Reverse translation verification (if enabled) */
  verification?: {
    passed: boolean;
    semanticSimilarity: number;  // 0.0-1.0
    reverseTranslations: {
      claude: string;
      gpt: string;
      translategemma: string;
    };
    driftDetected: boolean;
  };
  
  /** Cryptographic proof (provable mode only) */
  proof?: {
    fingerprints: {
      claude: string;  // SHA-256
      gpt: string;
      translategemma: string;
    };
    requestIds: {
      claude: string;
      gpt: string;
      translategemma: string;
    };
    timestamps: {
      claude: string;
      gpt: string;
      translategemma: string;
    };
    verified: boolean;
  };
  
  /** Execution metadata */
  metadata: {
    sourceLanguage: string;
    targetLanguage: string;
    mode: 'fake' | 'provable';
    duration: number;  // milliseconds
    cost?: number;     // USD (provable mode only)
  };
}
```

## Usage Examples

### Simple Translation (Fake Mode)

```
User: "Translate 'Hello, World!' to Japanese using multi-model approach"
```

**Agent Actions**:
1. Use Claude runtime to simulate all three models
2. Generate three translations
3. Compare for consensus
4. Return result with agreement level

**Output**:
```json
{
  "translation": "こんにちは、世界！",
  "consensus": {
    "level": "full",
    "agreement": 1.0,
    "differences": []
  },
  "metadata": {
    "mode": "fake",
    "duration": 2500
  }
}
```

### Translation with Verification (Provable Mode)

```
User: "Translate this contract clause to Spanish with proof and verification"
```

**Input**:
```json
{
  "source": "The parties agree to binding arbitration.",
  "targetLanguage": "es",
  "mode": "provable",
  "context": {
    "domain": "legal",
    "tone": "formal"
  },
  "verifyReverse": true
}
```

**Agent Actions**:
1. Call Claude API: "Las partes acuerdan un arbitraje vinculante."
2. Call GPT-4o API: "Las partes aceptan el arbitraje obligatorio."
3. Call Gemma API: "Las partes acuerdan arbitraje vinculante."
4. Detect 2/3 consensus (Claude + Gemma)
5. Reverse translate consensus back to English
6. Verify semantic match
7. Generate fingerprints and proof

**Output**:
```json
{
  "translation": "Las partes acuerdan un arbitraje vinculante.",
  "consensus": {
    "level": "partial",
    "agreement": 0.67,
    "differences": [{
      "path": "root",
      "claude": "Las partes acuerdan un arbitraje vinculante.",
      "gpt": "Las partes aceptan el arbitraje obligatorio.",
      "translategemma": "Las partes acuerdan arbitraje vinculante.",
      "chosen": "claude"
    }]
  },
  "verification": {
    "passed": true,
    "semanticSimilarity": 0.95,
    "reverseTranslations": {
      "claude": "The parties agree to binding arbitration.",
      "gpt": "The parties agree to mandatory arbitration.",
      "translategemma": "The parties agree to binding arbitration."
    },
    "driftDetected": false
  },
  "proof": {
    "fingerprints": {
      "claude": "a1b2c3...",
      "gpt": "d4e5f6...",
      "translategemma": "g7h8i9..."
    },
    "requestIds": {
      "claude": "req_abc123",
      "gpt": "chatcmpl-xyz789",
      "translategemma": "gen_123abc"
    },
    "verified": true
  },
  "metadata": {
    "mode": "provable",
    "duration": 4200,
    "cost": 0.15
  }
}
```

### Structured Content Translation (JSON i18n)

```
User: "Translate UI strings to French with consensus validation"
```

**Input**:
```json
{
  "source": {
    "welcome": "Welcome to our platform",
    "login": "Log In",
    "forgot_password": "Forgot Password?"
  },
  "targetLanguage": "fr",
  "mode": "fake",
  "context": {
    "domain": "ui",
    "tone": "polite-formal",
    "preservePlaceholders": true
  }
}
```

**Output**:
```json
{
  "translation": {
    "welcome": "Bienvenue sur notre plateforme",
    "login": "Se connecter",
    "forgot_password": "Mot de passe oublié?"
  },
  "consensus": {
    "level": "full",
    "agreement": 1.0
  }
}
```

## Translation Models

**Claude Sonnet 4** (Primary)
- Best for context and nuance
- Excellent instruction following
- Strong multilingual capability
- Cost: ~$3 per million input tokens

**GPT-4o**
- Strong multilingual performance
- Fast parallel processing
- Good cultural adaptation
- Cost: ~$2.50 per million input tokens

**Gemini 2.0 Flash**
- Fastest response time
- Excellent for Asian languages
- Good technical accuracy
- Cost: ~$0.075 per million input tokens

## Consensus Resolution Strategy

**Full Consensus (3/3)**:
- All models agree exactly
- Use translation with confidence
- No further review needed

**Partial Consensus (2/3)**:
- Two models agree, one differs
- Use majority translation
- Log difference for review
- Consider context to resolve

**No Consensus (0/3)**:
- All three models differ
- Flag for human review
- Default to Claude translation
- Provide all three options

## Reverse Translation Verification

Validates translation accuracy by translating back to source:

1. **Translate consensus output back to source language**
2. **Compare reverse translation to original**
3. **Calculate semantic similarity** (not exact match)
4. **Flag if similarity < threshold** (default 0.85)

**Semantic Similarity Scoring**:
- 0.95-1.0: Excellent (meaning preserved)
- 0.85-0.94: Good (minor paraphrasing)
- 0.70-0.84: Fair (semantic drift detected)
- <0.70: Poor (meaning changed - FAIL)

## Cryptographic Proof (Provable Mode)

Generates verifiable evidence of translation:

**Fingerprints (SHA-256)**:
- Hash of each model's output
- Proves content hasn't changed
- Enables tamper detection

**Request IDs**:
- Unique identifier from each API
- Traceable in provider dashboards
- Proves actual API usage

**Timestamps**:
- UTC timestamps of API calls
- Validates parallel execution
- Shows translation timeline

**Verification**:
- Compare stored fingerprint to actual content hash
- Validate request IDs in API logs
- Confirm timestamps within expected range

## Implementation

**Supporting Scripts** (in `.github/skills/multi-model-ai-translation/` directory):

1. **[translate-with-proof.ts](./translate-with-proof.ts)**
   - Executes parallel API calls
   - Generates proof documents
   - Handles rate limiting

2. **[verify-translations.ts](./verify-translations.ts)**
   - Validates cryptographic fingerprints
   - Checks request IDs
   - Confirms timestamps

3. **[reverse-translate.ts](./reverse-translate.ts)**
   - Performs reverse translation
   - Calculates semantic similarity
   - Flags drift

4. **[generate-translation-report.ts](./generate-translation-report.ts)**
   - Aggregates all validation data
   - Generates comprehensive report
   - Includes consensus and verification results

**API Requirements (Provable Mode)**:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=...
```

**Rate Limiting**:
- Claude: 500ms delay between requests
- GPT-4o: 500ms delay between requests
- Gemma: 2s delay (30 req/min limit for Gemma 3)

## Error Handling

**API Failures**:
- If any model fails, entire translation aborts
- Never proceed with partial results (1 or 2 models)
- Ensures consistency across all models
- Retry with exponential backoff

**Quota Limits**:
- Detect rate limit errors
- Apply appropriate delays
- Never switch modes to work around limits
- Report quota exhaustion clearly

**Network Issues**:
- Retry transient failures (3 attempts)
- Timeout after 30 seconds per request
- Log all network errors
- Provide clear error messages

## Performance

**Fake Mode**:
- Cost: Free
- Speed: 2-5 seconds
- Proof: None

**Provable Mode**:
- Cost: ~$0.05-0.15 per 1000 words
- Speed: 4-8 seconds (parallel execution)
- Proof: Full cryptographic verification

**Optimization**:
- Parallel API calls (not sequential)
- Batch processing for multiple items
- Caching of common translations
- Rate limit compliance built-in

## Use Cases

### UI Localization
- Translate interface text to multiple languages
- Validate consistency across similar strings
- Detect cultural adaptation issues
- Maintain placeholder syntax

### Legal Documents
- High-accuracy translation requirement
- Cryptographic proof for audits
- Reverse verification critical
- Formal tone preservation

### Technical Documentation
- Preserve technical terminology
- Validate code examples unchanged
- Ensure accuracy of instructions
- Multi-language consistency

### Marketing Content
- Cultural adaptation important
- Tone matching critical
- Creative freedom allowed
- A/B test different translations

## Related Skills

- [extract-code-documentation](../extract-code-documentation/SKILL.md) - Extract context for translation metadata
- [storybook-validation](../storybook-validation/SKILL.md) - Validate translated UI in stories

## Related Documentation

- [i18n Translation Workflow](../../prompts/i18n-translation-workflow.prompt.md) - Full workflow implementation
- [Translation Scripts](../../../scripts/) - Implementation details

## Best Practices

1. **Always verify high-stakes translations** - Use reverse translation for legal, medical, technical
2. **Provide rich context** - Domain, tone, and audience improve accuracy
3. **Review no-consensus items** - Human judgment needed for 0/3 agreement
4. **Preserve placeholders** - Never translate {{variables}}, {count}, etc.
5. **Use provable mode for production** - Free mode for development only
6. **Test translations in context** - Load into actual UI to verify
7. **Batch similar content** - More efficient than one-by-one
8. **Monitor costs** - Set budgets for API usage
