# API Reference - Multi-Model AI Translation

Complete TypeScript interface definitions for the Multi-Model AI Translation skill.

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

## Language Codes

Uses ISO 639-1 two-letter codes:

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `ja` | Japanese |
| `zh` | Chinese |
| `ko` | Korean |
| `ar` | Arabic |
| `ru` | Russian |
| `pt` | Portuguese |

See full list: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

## Context Domain Values

Recommended `context.domain` values:

- `medical` - Medical/healthcare content
- `legal` - Legal documents, contracts
- `technical` - Software documentation, manuals
- `ui` - User interface strings
- `marketing` - Marketing copy, advertisements
- `academic` - Research papers, educational content
- `financial` - Financial reports, statements
- `general` - General purpose content

## Context Tone Values

Recommended `context.tone` values:

- `formal` - Professional, business communication
- `casual` - Conversational, friendly
- `technical` - Precise, specialized terminology
- `polite-formal` - Respectful, ceremonious
- `neutral` - Balanced, objective

## Context Audience Values

Recommended `context.audience` values:

- `general` - General public
- `experts` - Subject matter experts
- `children` - Younger audiences
- `professionals` - Business professionals
- `elderly` - Older adults

## Consensus Levels

```typescript
type ConsensusLevel = 'full' | 'partial' | 'none';

// Full: All 3 models agree exactly (agreement = 1.0)
// Partial: 2 of 3 models agree (agreement = 0.67)
// None: All 3 models differ (agreement = 0.0)
```

## Semantic Similarity Scale

Reverse translation verification scores:

- `0.95-1.0`: Excellent (meaning preserved)
- `0.85-0.94`: Good (minor paraphrasing)
- `0.70-0.84`: Fair (semantic drift detected)
- `< 0.70`: Poor (meaning changed - FAIL)

## Cryptographic Proof Format

```typescript
interface ProofDocument {
  timestamp: string;  // ISO 8601
  source: string;
  target: string;
  sourceLanguage: string;
  targetLanguage: string;
  
  models: {
    claude: {
      output: string;
      fingerprint: string;  // SHA-256 hex
      requestId: string;
      timestamp: string;
    };
    gpt: {
      output: string;
      fingerprint: string;
      requestId: string;
      timestamp: string;
    };
    translategemma: {
      output: string;
      fingerprint: string;
      requestId: string;
      timestamp: string;
    };
  };
  
  consensus: {
    chosen: string;
    agreement: number;
    level: ConsensusLevel;
  };
  
  verification: {
    passed: boolean;
    semanticSimilarity: number;
  };
  
  verified: boolean;  // All fingerprints match current content
}
```

## Verification Commands

Verify a proof document:

```bash
# Recalculate fingerprints and compare
npx tsx scripts/verify-translations.ts proof.json

# Check request IDs in API dashboards:
# - Anthropic: https://console.anthropic.com
# - OpenAI: https://platform.openai.com/usage
# - Google: https://aistudio.google.com/app/apikey
```

## Usage Examples

### Minimal Example

```typescript
{
  source: "Hello, World!",
  targetLanguage: "es",
  mode: "fake"
}
```

### Full Configuration

```typescript
{
  source: "The parties agree to binding arbitration.",
  targetLanguage: "es",
  sourceLanguage: "en",
  mode: "provable",
  context: {
    domain: "legal",
    tone: "formal",
    audience: "professionals",
    preservePlaceholders: false
  },
  verifyReverse: true,
  consensusThreshold: 0.67
}
```

### Structured Content (i18n)

```typescript
{
  source: {
    "welcome": "Welcome to our platform",
    "login": "Log In",
    "forgot_password": "Forgot your password?"
  },
  targetLanguage: "fr",
  mode: "fake",
  context: {
    domain: "ui",
    tone: "polite-formal",
    preservePlaceholders: true
  }
}
```

## Rate Limits

API rate limits per model:

| Model | RPM | TPM | Delay |
|-------|-----|-----|-------|
| Claude Sonnet 4 | 50 | 40,000 | 500ms |
| GPT-4o | 500 | 30,000 | 500ms |
| Gemini 2.0 Flash | 30 | 1,000,000 | 2s |

**RPM**: Requests per minute  
**TPM**: Tokens per minute  
**Delay**: Recommended delay between requests

## Cost Estimates

Approximate costs per 1,000 words:

| Mode | Claude | GPT-4o | Gemini | Total |
|------|--------|--------|--------|-------|
| Fake | $0 | $0 | $0 | **$0** |
| Provable | $0.03 | $0.025 | $0.001 | **$0.056** |

**Note**: Costs include forward translation + reverse translation (if enabled).

## Error Codes

```typescript
enum TranslationErrorCode {
  RATE_LIMIT = 'RATE_LIMIT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  INVALID_LANGUAGE = 'INVALID_LANGUAGE',
  CONSENSUS_FAILED = 'CONSENSUS_FAILED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT'
}
```

## Related Files

- [../SKILL.md](../SKILL.md) - Main skill documentation
- [EXAMPLES.md](./EXAMPLES.md) - Detailed usage examples
- [MODELS_COMPARISON.md](./MODELS_COMPARISON.md) - Model capabilities
- [CONSENSUS_ALGORITHM.md](./CONSENSUS_ALGORITHM.md) - How consensus works
- [CRYPTOGRAPHIC_PROOF.md](./CRYPTOGRAPHIC_PROOF.md) - Proof generation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Error handling
