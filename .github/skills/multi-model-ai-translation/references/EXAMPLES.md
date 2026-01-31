# Translation Examples

Detailed usage examples for the Multi-Model AI Translation skill.

## Example 1: Simple Translation (Fake Mode)

**Scenario**: Quick translation without API costs or proof generation.

**User Request**:
```
User: "Translate 'Hello, World!' to Japanese using multi-model approach"
```

**Input**:
```typescript
{
  source: "Hello, World!",
  targetLanguage: "ja",
  mode: "fake"
}
```

**Agent Actions**:
1. Use Claude runtime to simulate all three models
2. Generate three translations:
   - Claude: "こんにちは、世界！"
   - GPT-4o: "こんにちは、世界！"
   - Gemini: "こんにちは、世界！"
3. Compare for consensus (all identical)
4. Return result with full agreement

**Output**:
```json
{
  "translation": "こんにちは、世界！",
  "models": {
    "claude": "こんにちは、世界！",
    "gpt": "こんにちは、世界！",
    "translategemma": "こんにちは、世界！"
  },
  "consensus": {
    "level": "full",
    "agreement": 1.0,
    "differences": []
  },
  "metadata": {
    "sourceLanguage": "en",
    "targetLanguage": "ja",
    "mode": "fake",
    "duration": 2500
  }
}
```

**Use Case**: Development, testing, demos - no API costs.

---

## Example 2: Translation with Verification (Provable Mode)

**Scenario**: High-stakes legal translation requiring accuracy validation and audit trail.

**User Request**:
```
User: "Translate this contract clause to Spanish with proof and verification"
```

**Input**:
```typescript
{
  source: "The parties agree to binding arbitration.",
  targetLanguage: "es",
  sourceLanguage: "en",
  mode: "provable",
  context: {
    domain: "legal",
    tone: "formal",
    audience: "professionals"
  },
  verifyReverse: true,
  consensusThreshold: 0.67
}
```

**Agent Actions**:

**Phase 1: Parallel Translation**
1. Call Anthropic Claude API:
   - Output: "Las partes acuerdan un arbitraje vinculante."
   - Request ID: `req_abc123xyz`
   - Timestamp: `2026-01-29T14:32:01.234Z`

2. Call OpenAI GPT-4o API:
   - Output: "Las partes aceptan el arbitraje obligatorio."
   - Request ID: `chatcmpl-def456uvw`
   - Timestamp: `2026-01-29T14:32:01.456Z`

3. Call Google Gemini API:
   - Output: "Las partes acuerdan arbitraje vinculante."
   - Request ID: `gen_ghi789rst`
   - Timestamp: `2026-01-29T14:32:02.123Z`

**Phase 2: Consensus Analysis**
- Claude + Gemini agree (use "acuerdan")
- GPT differs (uses "aceptan")
- Agreement: 2/3 = 0.67 (partial consensus)
- Choose: Claude (first of majority)

**Phase 3: Reverse Translation**
- Translate "Las partes acuerdan un arbitraje vinculante." back to English
- Claude reverse: "The parties agree to binding arbitration."
- GPT reverse: "The parties agree to mandatory arbitration."
- Gemini reverse: "The parties agree to binding arbitration."
- Semantic similarity: 0.95 (excellent)
- Drift detected: No (meaning preserved)

**Phase 4: Cryptographic Proof**
- Generate SHA-256 fingerprints of each output
- Record request IDs for verification
- Validate timestamps show parallel execution
- Create proof document

**Output**:
```json
{
  "translation": "Las partes acuerdan un arbitraje vinculante.",
  "models": {
    "claude": "Las partes acuerdan un arbitraje vinculante.",
    "gpt": "Las partes aceptan el arbitraje obligatorio.",
    "translategemma": "Las partes acuerdan arbitraje vinculante."
  },
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
      "claude": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      "gpt": "d4e5f6a1b2c3789012345678901234567890abcdef1234567890abcdef789012",
      "translategemma": "g7h8i9j0k1l2345678901234567890abcdef1234567890abcdef345678901234"
    },
    "requestIds": {
      "claude": "req_abc123xyz",
      "gpt": "chatcmpl-def456uvw",
      "translategemma": "gen_ghi789rst"
    },
    "timestamps": {
      "claude": "2026-01-29T14:32:01.234Z",
      "gpt": "2026-01-29T14:32:01.456Z",
      "translategemma": "2026-01-29T14:32:02.123Z"
    },
    "verified": true
  },
  "metadata": {
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "mode": "provable",
    "duration": 4200,
    "cost": 0.15
  }
}
```

**Use Case**: Legal contracts, compliance documentation, auditable translations.

---

## Example 3: Structured Content Translation (JSON i18n)

**Scenario**: Translating user interface strings with placeholder preservation.

**User Request**:
```
User: "Translate UI strings to French with consensus validation"
```

**Input**:
```typescript
{
  source: {
    "welcome": "Welcome to our platform",
    "login": "Log In",
    "forgot_password": "Forgot Password?",
    "greeting": "Hello, {{name}}!",
    "item_count": "You have {count} items"
  },
  targetLanguage: "fr",
  sourceLanguage: "en",
  mode: "fake",
  context: {
    domain: "ui",
    tone: "polite-formal",
    audience: "general",
    preservePlaceholders: true
  }
}
```

**Agent Actions**:
1. Simulate three model translations
2. Detect placeholders: `{{name}}`, `{count}`
3. Ensure placeholders preserved in all outputs
4. Compare translations key-by-key
5. Build consensus output

**Output**:
```json
{
  "translation": {
    "welcome": "Bienvenue sur notre plateforme",
    "login": "Se connecter",
    "forgot_password": "Mot de passe oublié ?",
    "greeting": "Bonjour, {{name}} !",
    "item_count": "Vous avez {count} articles"
  },
  "models": {
    "claude": {
      "welcome": "Bienvenue sur notre plateforme",
      "login": "Se connecter",
      "forgot_password": "Mot de passe oublié ?",
      "greeting": "Bonjour, {{name}} !",
      "item_count": "Vous avez {count} articles"
    },
    "gpt": {
      "welcome": "Bienvenue sur notre plateforme",
      "login": "Connexion",
      "forgot_password": "Mot de passe oublié ?",
      "greeting": "Bonjour {{name}} !",
      "item_count": "Vous avez {count} éléments"
    },
    "translategemma": {
      "welcome": "Bienvenue sur notre plateforme",
      "login": "Se connecter",
      "forgot_password": "Mot de passe oublié ?",
      "greeting": "Bonjour, {{name}} !",
      "item_count": "Vous avez {count} articles"
    }
  },
  "consensus": {
    "level": "partial",
    "agreement": 0.80,
    "differences": [
      {
        "path": "login",
        "claude": "Se connecter",
        "gpt": "Connexion",
        "translategemma": "Se connecter",
        "chosen": "Se connecter"
      },
      {
        "path": "item_count",
        "claude": "Vous avez {count} articles",
        "gpt": "Vous avez {count} éléments",
        "translategemma": "Vous avez {count} articles",
        "chosen": "Vous avez {count} articles"
      }
    ]
  },
  "metadata": {
    "sourceLanguage": "en",
    "targetLanguage": "fr",
    "mode": "fake",
    "duration": 3200
  }
}
```

**Use Case**: UI localization, mobile apps, web applications.

---

## Example 4: Medical Content (High Accuracy Required)

**Scenario**: Translating patient information requiring high precision.

**Input**:
```typescript
{
  source: "Take one tablet twice daily with food. May cause drowsiness.",
  targetLanguage: "es",
  mode: "provable",
  context: {
    domain: "medical",
    tone: "formal",
    audience: "general"
  },
  verifyReverse: true,
  consensusThreshold: 1.0  // Require full agreement
}
```

**Agent Actions**:
1. Parallel API calls to all three models
2. Compare translations
3. Check for full consensus (all identical)
4. Reverse translate for verification
5. Verify semantic similarity > 0.95

**Expected Behavior**:
- If all three models agree → proceed
- If any differ → flag for human review (threshold not met)
- Reverse similarity check must pass

**Use Case**: Medical instructions, healthcare documentation, prescription information.

---

## Example 5: Marketing Copy (Creative Freedom)

**Scenario**: Translating marketing tagline with cultural adaptation.

**Input**:
```typescript
{
  source: "Unleash your potential. Dream bigger.",
  targetLanguage: "ja",
  mode: "provable",
  context: {
    domain: "marketing",
    tone: "inspirational",
    audience: "general"
  },
  verifyReverse: true,
  consensusThreshold: 0.0  // Allow creativity, evaluate all options
}
```

**Agent Actions**:
1. All three models provide culturally adapted translations
2. All may differ (creative interpretations)
3. Agent presents all three options to user
4. User chooses preferred version

**Example Outputs**:
- Claude: "可能性を解き放ち、より大きな夢を描きましょう。"
- GPT-4o: "あなたの可能性を開花させよう。もっと大きく夢見よう。"
- Gemini: "潜在能力を発揮し、より高い夢を目指そう。"

**Use Case**: Marketing campaigns, creative content, slogans requiring cultural nuance.

---

## Example 6: Technical Documentation

**Scenario**: Translating API documentation with technical accuracy.

**Input**:
```typescript
{
  source: "The fetchData() method returns a Promise that resolves with the API response.",
  targetLanguage: "de",
  mode: "provable",
  context: {
    domain: "technical",
    tone: "technical",
    audience: "experts",
    preservePlaceholders: true
  },
  verifyReverse: true
}
```

**Expected Output**:
- Preserves: `fetchData()`, `Promise`, `API`
- Translates: Grammatical structure and connective language
- Maintains: Technical precision

**Use Case**: Developer documentation, technical manuals, API references.

---

## Example 7: No Consensus Scenario

**Scenario**: All three models produce different outputs.

**Input**:
```typescript
{
  source: "The early bird catches the worm.",  // Idiomatic expression
  targetLanguage: "zh",
  mode: "provable"
}
```

**Possible Outputs**:
- Claude: "早起的鸟儿有虫吃。" (literal translation)
- GPT-4o: "捷足先登。" (equivalent idiom)
- Gemini: "勤劳的人会得到回报。" (meaning-based)

**Consensus**:
```json
{
  "level": "none",
  "agreement": 0.0,
  "differences": [/* all three differ */]
}
```

**Agent Response**:
"⚠️ No consensus reached. All three models produced different translations. Please review options and choose the most appropriate for your context."

**Use Case**: Idiomatic expressions, cultural references, ambiguous content.

---

## Example 8: Batch Processing Multiple Strings

**Input**:
```typescript
{
  source: [
    "Sign In",
    "Sign Out",
    "Forgot Password?",
    "Create Account",
    "Reset Password"
  ],
  targetLanguage: "ko",
  mode: "fake",
  context: {
    domain: "ui",
    tone: "polite-formal"
  }
}
```

**Output** (array of translations):
```json
{
  "translation": [
    "로그인",
    "로그아웃",
    "비밀번호를 잊으셨나요?",
    "계정 만들기",
    "비밀번호 재설정"
  ],
  "consensus": {
    "level": "full",
    "agreement": 1.0
  }
}
```

**Use Case**: Batch UI localization, translation memory building.

---

## Best Practices from Examples

1. **Always provide context** - Domain, tone, audience improve accuracy
2. **Use fake mode for development** - Test workflow before incurring costs
3. **Enable reverse verification for high-stakes** - Legal, medical, financial
4. **Set appropriate consensus thresholds**:
   - 1.0 for critical content (medical, legal)
   - 0.67 for general content (default)
   - 0.0 for creative content (marketing, artistic)
5. **Preserve placeholders in UI strings** - Use `preservePlaceholders: true`
6. **Review no-consensus items manually** - Human judgment needed
7. **Batch similar content** - More efficient than one-by-one
8. **Verify translations in actual context** - Load into UI to test

## Related Files

- [../SKILL.md](../SKILL.md) - Main skill documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete schemas and types
- [MODELS_COMPARISON.md](./MODELS_COMPARISON.md) - Model capabilities
- [CONSENSUS_ALGORITHM.md](./CONSENSUS_ALGORITHM.md) - How consensus works
