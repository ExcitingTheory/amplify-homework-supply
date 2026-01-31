# Translation Models Comparison

Detailed comparison of the three AI models used for multi-model translation.

## Models Overview

| Model | Provider | Version | Context | Strengths |
|-------|----------|---------|---------|-----------|
| Claude Sonnet 4 | Anthropic | claude-sonnet-4-20250514 | 200K | Context, nuance, instruction following |
| GPT-4o | OpenAI | gpt-4o-2024-11-20 | 128K | Speed, multilingual, cultural adaptation |
| Gemini 2.0 Flash | Google | gemini-2.0-flash-001 | 1M | Asian languages, speed, cost |

---

## Claude Sonnet 4 (Primary)

**Provider**: Anthropic  
**Model ID**: `claude-sonnet-4-20250514`  
**Context Window**: 200,000 tokens  
**Output Limit**: 8,192 tokens

### Strengths

✅ **Best for Context & Nuance**
- Excellent understanding of domain-specific terminology
- Preserves tone and formality levels accurately
- Strong instruction following for translation constraints

✅ **Legal & Medical Content**
- Most accurate for high-stakes translations
- Maintains precision in technical language
- Conservative approach minimizes errors

✅ **Cultural Sensitivity**
- Adapts content appropriately for target culture
- Avoids culturally inappropriate translations
- Handles idioms and expressions well

### Pricing

- **Input**: $3.00 per million tokens
- **Output**: $15.00 per million tokens
- **Estimated cost per 1,000 words**: ~$0.03

### Performance

- **Speed**: Medium (2-4 seconds typical)
- **Rate Limit**: 50 requests/minute
- **Token Limit**: 40,000 tokens/minute

### Best Use Cases

- Legal contracts and compliance documents
- Medical instructions and patient information
- Technical documentation requiring precision
- Content where context is critical

---

## GPT-4o

**Provider**: OpenAI  
**Model ID**: `gpt-4o-2024-11-20`  
**Context Window**: 128,000 tokens  
**Output Limit**: 16,384 tokens

### Strengths

✅ **Fast & Efficient**
- Quickest response times
- High throughput for batch processing
- Good parallelization support

✅ **Multilingual Capability**
- Strong performance across 100+ languages
- Excellent for European languages (Spanish, French, German)
- Good handling of technical vocabulary

✅ **Cultural Adaptation**
- Adapts content for local audiences
- Good awareness of regional variations (Spain vs Latin America Spanish)
- Creative freedom for marketing content

### Pricing

- **Input**: $2.50 per million tokens
- **Output**: $10.00 per million tokens
- **Estimated cost per 1,000 words**: ~$0.025

### Performance

- **Speed**: Fast (1-3 seconds typical)
- **Rate Limit**: 500 requests/minute
- **Token Limit**: 30,000 tokens/minute

### Best Use Cases

- UI localization for European languages
- Marketing copy requiring creative adaptation
- High-volume batch translation
- Real-time translation needs

---

## Gemini 2.0 Flash

**Provider**: Google  
**Model ID**: `gemini-2.0-flash-001`  
**Context Window**: 1,048,576 tokens (1M)  
**Output Limit**: 8,192 tokens

### Strengths

✅ **Asian Languages**
- Exceptional for Japanese, Chinese, Korean
- Deep understanding of CJK (Chinese-Japanese-Korean) characters
- Captures nuances in Asian language structures

✅ **Cost-Effective**
- Most affordable option
- Best value for high-volume translation
- Free tier available for testing

✅ **Massive Context Window**
- Can handle very long documents
- Useful for translating entire chapters or  articles
- Maintains consistency across large content

### Pricing

- **Input**: $0.075 per million tokens
- **Output**: $0.30 per million tokens
- **Estimated cost per 1,000 words**: ~$0.001

### Performance

- **Speed**: Very fast (1-2 seconds typical)
- **Rate Limit**: 30 requests/minute (stricter)
- **Token Limit**: 1,000,000 tokens/minute

### Best Use Cases

- Japanese, Chinese, Korean translation
- Large document translation
- High-volume/budget-conscious projects
- Educational content for Asian markets

---

## Comparison by Use Case

### Legal Documents
**Best**: Claude Sonnet 4  
**Why**: Precision, conservative approach, formal tone handling  
**Second**: GPT-4o  
**Avoid**: Gemini (unless Asian language)

### Medical Content
**Best**: Claude Sonnet 4  
**Why**: Accuracy critical, handles technical terms well  
**Second**: GPT-4o  
**Verify**: Always use reverse translation + human review

### UI Localization (European Languages)
**Best**: GPT-4o  
**Why**: Fast, culturally aware, good for romance languages  
**Second**: Claude Sonnet 4  
**Cost**: Consider Gemini for budget constraints

### UI Localization (Asian Languages)
**Best**: Gemini 2.0 Flash  
**Why**: Exceptional CJK handling, cost-effective  
**Second**: GPT-4o  
**Third**: Claude Sonnet 4

### Marketing Copy
**Best**: GPT-4o  
**Why**: Creative freedom, cultural adaptation  
**Second**: Claude Sonnet 4 (for nuanced messaging)  
**Note**: Review all three outputs for creativity

### Technical Documentation
**Best**: Claude Sonnet 4  
**Why**: Preserves technical accuracy, context understanding  
**Second**: GPT-4o  
**Verify**: Check code snippets and commands preserved

### High-Volume Batch Translation
**Best**: Gemini 2.0 Flash  
**Why**: Cost-effective, fast, large context  
**Second**: GPT-4o (if rate limits allow)  
**Note**: Claude too expensive for high volume

---

## Language-Specific Recommendations

### Spanish (es)
- ✅ GPT-4o (best regional variant handling)
- ✅ Claude Sonnet 4 (formal content)
- ⚠️ Gemini (adequate but not optimal)

### French (fr)
- ✅ Claude Sonnet 4 (formality nuances)
- ✅ GPT-4o (speed)
- ⚠️ Gemini (adequate)

### German (de)
- ✅ GPT-4o (compound words, grammar)
- ✅ Claude Sonnet 4 (technical content)
- ⚠️ Gemini (adequate)

### Japanese (ja)
- ✅ Gemini 2.0 Flash (best CJK handling)
- ✅ GPT-4o (good alternative)
- ✅ Claude Sonnet 4 (formal business communication)

### Chinese Simplified (zh)
- ✅ Gemini 2.0 Flash (native CJK support)
- ✅ GPT-4o (creative content)
- ✅ Claude Sonnet 4 (formal documents)

### Korean (ko)
- ✅ Gemini 2.0 Flash (honorifics handling)
- ✅ GPT-4o (modern slang)
- ✅ Claude Sonnet 4 (business formal)

### Arabic (ar)
- ✅ GPT-4o (RTL handling, regional variants)
- ✅ Claude Sonnet 4 (formal Arabic)
- ⚠️ Gemini (adequate)

### Russian (ru)
- ✅ GPT-4o (grammar complexity)
- ✅ Claude Sonnet 4 (formal tone)
- ⚠️ Gemini (adequate)

### Portuguese (pt)
- ✅ GPT-4o (Brazil vs Portugal distinction)
- ✅ Claude Sonnet 4 (formal)
- ⚠️ Gemini (adequate)

---

## Consensus Patterns by Model

### High Agreement Scenarios (3/3 consensus)

**Common for**:
- Simple, straightforward sentences
- Common UI strings ("Sign In", "Log Out")
- Factual statements without ambiguity
- Standard business phrases

**Typical Agreement**: 70-80% of translations

### Partial Agreement (2/3 consensus)

**Common for**:
- Nuanced professional language
- Multiple valid translation options
- Cultural expressions with variants
- Technical terms with synonyms

**Typical Patterns**:
- Claude + Gemini agree (formal approach)
- GPT + Gemini agree (cultural adaptation)
- Claude + GPT agree (less common)

### No Agreement (0/3 consensus)

**Common for**:
- Idiomatic expressions
- Creative marketing copy
- Ambiguous phrasing
- Cultural references

**Requires**: Human review to choose appropriate translation

---

## Cost Comparison

### 1,000 Words Translation

| Model | Input Tokens | Output Tokens | Cost |
|-------|--------------|---------------|------|
| Claude Sonnet 4 | ~1,500 | ~1,500 | $0.030 |
| GPT-4o | ~1,500 | ~1,500 | $0.025 |
| Gemini 2.0 Flash | ~1,500 | ~1,500 | $0.001 |

### Full Workflow (with reverse translation)

| Mode | Total Cost |
|------|------------|
| Fake | $0.00 |
| Provable (all 3 models × 2 directions) | ~$0.056 |

### Budget Recommendations

- **Small projects (<10K words)**: Use provable mode, cost negligible
- **Medium projects (10K-100K words)**: Use fake mode for drafts, provable for final
- **Large projects (>100K words)**: Consider Gemini-only or GPT-only with spot checks

---

## API Configuration

### Anthropic Claude

```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: [{
    role: "user",
    content: `Translate to ${targetLang}: ${text}`
  }]
});
```

### OpenAI GPT-4o

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: "gpt-4o-2024-11-20",
  messages: [{
    role: "user",
    content: `Translate to ${targetLang}: ${text}`
  }]
});
```

### Google Gemini

```typescript
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

const result = await model.generateContent(
  `Translate to ${targetLang}: ${text}`
);
```

---

## Model Selection Algorithm

The skill uses this hierarchy to choose the final translation:

1. **Full consensus (3/3)**: Use any (they're identical)
2. **Partial consensus (2/3)**: Use first model from majority
3. **No consensus (0/3)**: Default to Claude, flag for review

**Priority Order for Majority**:
1. Claude Sonnet 4 (most conservative)
2. GPT-4o (good balance)
3. Gemini 2.0 Flash (specialized use cases)

---

## Related Files

- [../SKILL.md](../SKILL.md) - Main skill documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API schemas
- [EXAMPLES.md](./EXAMPLES.md) - Usage examples
- [CONSENSUS_ALGORITHM.md](./CONSENSUS_ALGORITHM.md) - Consensus logic
