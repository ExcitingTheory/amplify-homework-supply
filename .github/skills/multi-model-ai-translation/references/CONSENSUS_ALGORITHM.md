# Consensus Algorithm

How the multi-model translation skill determines consensus and selects the final translation.

## Overview

The consensus algorithm compares outputs from three models (Claude, GPT-4o, Gemini) and determines:
1. Level of agreement (full, partial, none)
2. Which translation to use as final output
3. What differences exist and why they matter

## Consensus Levels

### Full Consensus (3/3)

**Definition**: All three models produce identical outputs.

**Agreement Score**: 1.0

**Decision**: Use any model's output (they're identical).

**Frequency**: ~70-80% for simple, unambiguous content.

**Example**:
```json
{
  "claude": "Bonjour",
  "gpt": "Bonjour",  
  "translategemma": "Bonjour",
  "consensus": {
    "level": "full",
    "agreement": 1.0,
    "chosen": "claude"
  }
}
```

---

### Partial Consensus (2/3)

**Definition**: Two models agree, one differs.

**Agreement Score**: 0.67 (2÷3)

**Decision**: Use first model from majority (priority: Claude > GPT > Gemini).

**Frequency**: ~15-20% for nuanced or technical content.

**Example**:
```json
{
  "claude": "Las partes acuerdan arbitraje vinculante.",
  "gpt": "Las partes aceptan arbitraje obligatorio.",
  "translategemma": "Las partes acuerdan arbitraje vinculante.",
  "consensus": {
    "level": "partial",
    "agreement": 0.67,
    "chosen": "claude",
    "reason": "Claude and Gemini agree (2/3 majority)"
  }
}
```

---

### No Consensus (0/3)

**Definition**: All three models produce different outputs.

**Agreement Score**: 0.0

**Decision**: Default to Claude, flag for human review.

**Frequency**: ~5-10% for idiomatic, creative, or ambiguous content.

**Example**:
```json
{
  "claude": "早起的鸟儿有虫吃。",  // Literal
  "gpt": "捷足先登。",           // Equivalent idiom
  "translategemma": "勤劳的人会得到回报。",  // Meaning-based
  "consensus": {
    "level": "none",
    "agreement": 0.0,
    "chosen": "claude",
    "reason": "No consensus - requires human review",
    "flagged": true
  }
}
```

---

## Comparison Algorithm

### String Comparison

For simple string translations:

```typescript
function calculateConsensus(outputs: { claude: string, gpt: string, gemini: string }) {
  const normalized = {
    claude: outputs.claude.trim().toLowerCase(),
    gpt: outputs.gpt.trim().toLowerCase(),
    gemini: outputs.gemini.trim().toLowerCase()
  };
  
  // Check full consensus
  if (normalized.claude === normalized.gpt && normalized.gpt === normalized.gemini) {
    return { level: 'full', agreement: 1.0, chosen: outputs.claude };
  }
  
  // Check partial consensus
  if (normalized.claude === normalized.gemini) {
    return { level: 'partial', agreement: 0.67, chosen: outputs.claude, majority: ['claude', 'gemini'] };
  }
  if (normalized.claude === normalized.gpt) {
    return { level: 'partial', agreement: 0.67, chosen: outputs.claude, majority: ['claude', 'gpt'] };
  }
  if (normalized.gpt === normalized.gemini) {
    return { level: 'partial', agreement: 0.67, chosen: outputs.gpt, majority: ['gpt', 'gemini'] };
  }
  
  // No consensus
  return { level: 'none', agreement: 0.0, chosen: outputs.claude, flagged: true };
}
```

### Object Comparison (Structured Content)

For JSON objects (i18n files):

```typescript
function calculateObjectConsensus(outputs: { claude: object, gpt: object, gemini: object }) {
  const allKeys = new Set([
    ...Object.keys(outputs.claude),
    ...Object.keys(outputs.gpt),
    ...Object.keys(outputs.gemini)
  ]);
  
  let totalKeys = allKeys.size;
  let fullConsensusKeys = 0;
  let partialConsensusKeys = 0;
  const differences = [];
  
  for (const key of allKeys) {
    const claudeVal = outputs.claude[key];
    const gptVal = outputs.gpt[key];
    const geminiVal = outputs.gemini[key];
    
    // Normalize
    const c = normalize(claudeVal);
    const g = normalize(gptVal);
    const m = normalize(geminiVal);
    
    if (c === g && g === m) {
      fullConsensusKeys++;
    } else if (c === m || c === g || g === m) {
      partialConsensusKeys++;
      differences.push({
        path: key,
        claude: claudeVal,
        gpt: gptVal,
        translategemma: geminiVal,
        chosen: chooseFromMajority(c, g, m, claudeVal, gptVal, geminiVal)
      });
    } else {
      differences.push({
        path: key,
        claude: claudeVal,
        gpt: gptVal,
        translategemma: geminiVal,
        chosen: claudeVal,
        flagged: true
      });
    }
  }
  
  const agreement = (fullConsensusKeys + (partialConsensusKeys * 0.67)) / totalKeys;
  const level = agreement === 1.0 ? 'full' : agreement >= 0.5 ? 'partial' : 'none';
  
  return { level, agreement, differences };
}
```

---

## Model Priority

When selecting from a majority, use this priority order:

1. **Claude Sonnet 4** - Most conservative, best for precision
2. **GPT-4o** - Good balance, fast
3. **Gemini 2.0 Flash** - Specialized (CJK), cost-effective

**Rationale**:
- Claude tends to be most literal and accurate
- GPT-4o provides good creative balance
- Gemini prioritized only for Asian languages

---

## Consensus Threshold

The `consensusThreshold` parameter controls acceptance:

```typescript
interface ConsensusConfig {
  consensusThreshold: number;  // 0.0 to 1.0
}
```

### Threshold Settings

| Threshold | Behavior | Use Case |
|-----------|----------|----------|
| 1.0 | Require full consensus (3/3) | Medical, legal, safety-critical |
| 0.67 | Accept partial consensus (2/3) | Default, general content |
| 0.5 | Accept majority (2/3 or better) | UI strings, documentation |
| 0.0 | Accept any output, compare all | Marketing, creative content |

### Example Usage

```typescript
// Medical content - require full agreement
{
  source: "Take one tablet twice daily with food.",
  targetLanguage: "es",
  consensusThreshold: 1.0  // Must be 3/3 or flag for review
}
```

```typescript
// Creative marketing - evaluate all options
{
  source: "Unleash your potential.",
  targetLanguage: "ja",
  consensusThreshold: 0.0  // Show all three, user chooses
}
```

---

## Difference Detection

### String Differences

Detected differences categorized by type:

1. **Synonym Variation**: Same meaning, different word choice
   - Example: "acuerdan" vs "aceptan" (agree vs accept)
   - Severity: Low

2. **Structural Variation**: Same meaning, different grammar
   - Example: "Mot de passe oublié ?" vs "Oublié votre mot de passe ?"
   - Severity: Low

3. **Semantic Variation**: Related but distinct meanings
   - Example: "articles" vs "éléments" (items)
   - Severity: Medium

4. **Meaning Divergence**: Fundamentally different interpretations
   - Example: Literal vs idiomatic translation
   - Severity: High (requires review)

### Detection Logic

```typescript
function categorizeDifference(claude: string, gpt: string, gemini: string) {
  // Use semantic similarity (embedding comparison)
  const similarities = {
    claudeGpt: cosineSimilarity(embed(claude), embed(gpt)),
    claudeGemini: cosineSimilarity(embed(claude), embed(gemini)),
    gptGemini: cosineSimilarity(embed(gpt), embed(gemini))
  };
  
  const avgSimilarity = (similarities.claudeGpt + similarities.claudeGemini + similarities.gptGemini) / 3;
  
  if (avgSimilarity > 0.95) return 'synonym';
  if (avgSimilarity > 0.85) return 'structural';
  if (avgSimilarity > 0.70) return 'semantic';
  return 'divergent';
}
```

---

## Handling Special Cases

### Placeholder Preservation

Placeholders like `{{name}}`, `{count}` must match exactly:

```typescript
function validatePlaceholders(original: string, translated: string) {
  const originalPlaceholders = original.match(/\{\{.*?\}\}|\{.*?\}/g) || [];
  const translatedPlaceholders = translated.match(/\{\{.*?\}\}|\{.*?\}/g) || [];
  
  // Must have same placeholders in same order
  if (JSON.stringify(originalPlaceholders) !== JSON.stringify(translatedPlaceholders)) {
    return { valid: false, error: 'Placeholder mismatch' };
  }
  
  return { valid: true };
}
```

### Whitespace Normalization

Before comparison, normalize whitespace:

```typescript
function normalize(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .toLowerCase();
}
```

### Case Sensitivity

Generally case-insensitive comparison, except:
- Proper nouns (names, places)
- Acronyms (API, UI, etc.)
- Brand names

---

## Consensus Reporting

### Full Report Structure

```typescript
interface ConsensusReport {
  level: 'full' | 'partial' | 'none';
  agreement: number;
  differences: Array<{
    path: string;
    claude: string;
    gpt: string;
    translategemma: string;
    chosen: string;
    severity?: 'low' | 'medium' | 'high';
    category?: 'synonym' | 'structural' | 'semantic' | 'divergent';
    flagged?: boolean;
  }>;
  summary: string;
}
```

### Example Reports

**Full Consensus**:
```json
{
  "level": "full",
  "agreement": 1.0,
  "differences": [],
  "summary": "All three models produced identical translations."
}
```

**Partial Consensus**:
```json
{
  "level": "partial",
  "agreement": 0.67,
  "differences": [{
    "path": "login",
    "claude": "Se connecter",
    "gpt": "Connexion",
    "translategemma": "Se connecter",
    "chosen": "Se connecter",
    "severity": "low",
    "category": "synonym"
  }],
  "summary": "2 of 3 models agreed. 1 difference found (low severity)."
}
```

**No Consensus**:
```json
{
  "level": "none",
  "agreement": 0.0,
  "differences": [{
    "path": "root",
    "claude": "早起的鸟儿有虫吃。",
    "gpt": "捷足先登。",
    "translategemma": "勤劳的人会得到回报。",
    "chosen": "早起的鸟儿有虫吃。",
    "severity": "high",
    "category": "divergent",
    "flagged": true
  }],
  "summary": "No consensus. All models produced different translations. Manual review required."
}
```

---

## Performance Optimization

### Parallel Execution

All three API calls execute in parallel:

```typescript
const [claudeResult, gptResult, geminiResult] = await Promise.all([
  callClaude(text, targetLang),
  callGPT(text, targetLang),
  callGemini(text, targetLang)
]);
```

**Time Savings**: ~10 seconds (sequential) → ~4 seconds (parallel)

### Caching

Cache consensus results for repeated translations:

```typescript
const cacheKey = `${hash(source)}_${targetLang}`;
const cached = await cache.get(cacheKey);
if (cached && cached.timestamp > Date.now() - 86400000) {
  return cached.result;  // Use cached if < 24 hours old
}
```

---

## Related Files

- [../SKILL.md](../SKILL.md) - Main skill documentation
- [MODELS_COMPARISON.md](./MODELS_COMPARISON.md) - Model capabilities
- [EXAMPLES.md](./EXAMPLES.md) - Usage examples showing consensus
- [CRYPTOGRAPHIC_PROOF.md](./CRYPTOGRAPHIC_PROOF.md) - Proof generation
