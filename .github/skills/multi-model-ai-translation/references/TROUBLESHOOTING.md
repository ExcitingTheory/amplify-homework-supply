# Troubleshooting

Common issues with multi-model AI translation and how to resolve them.

## API Errors

### Rate Limit Exceeded

**Error Message**:
```
RateLimitError: Rate limit exceeded. Please try again later.
```

**Cause**: Exceeded API provider's rate limit (requests per minute or tokens per minute).

**Solution**:

1. **Check rate limits** for each provider:
   - Claude: 50 requests/minute, 40K tokens/minute
   - GPT-4o: 500 requests/minute, 30K tokens/minute  
   - Gemini: 30 requests/minute, 1M tokens/minute

2. **Add delays between requests**:
   ```typescript
   await sleep(2000);  // Wait 2 seconds for Gemini
   ```

3. **Use exponential backoff**:
   ```typescript
   let retries = 0;
   while (retries < 3) {
     try {
       return await callAPI();
     } catch (error) {
       if (error.type === 'rate_limit_error') {
         await sleep(Math.pow(2, retries) * 1000);
         retries++;
       } else {
         throw error;
       }
     }
   }
   ```

4. **Batch requests** to stay under limits
5. **Upgrade API tier** for higher limits

---

### Quota Exceeded

**Error Message**:
```
QuotaExceeded: You have exceeded your monthly quota.
```

**Cause**: Used all allocated API credits for the month.

**Solution**:

1. **Check usage** in provider dashboard:
   - Anthropic: https://console.anthropic.com → Billing
   - OpenAI: https://platform.openai.com/usage
   - Google: https://aistudio.google.com

2. **Add credits** or upgrade plan
3. **Use fake mode** instead of provable mode for testing
4. **Wait for quota reset** (usually monthly)

---

### Invalid API Key

**Error Message**:
```
AuthenticationError: Invalid API key provided.
```

**Cause**: API key missing, expired, or incorrect.

**Solution**:

1. **Check environment variables**:
   ```bash
   echo $ANTHROPIC_API_KEY
   echo $OPENAI_API_KEY
   echo $GOOGLE_API_KEY
   ```

2. **Verify key format**:
   - Anthropic: `sk-ant-...`
   - OpenAI: `sk-...`
   - Google: `AIza...`

3. **Regenerate keys** if expired:
   - Anthropic: https://console.anthropic.com/settings/keys
   - OpenAI: https://platform.openai.com/api-keys
   - Google: https://aistudio.google.com/app/apikey

4. **Set environment variables**:
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   export OPENAI_API_KEY=sk-...
   export GOOGLE_API_KEY=AIza...
   ```

---

### Model Unavailable

**Error Message**:
```
ModelUnavailable: The model is currently unavailable.
```

**Cause**: API provider experiencing outage or maintenance.

**Solution**:

1. **Check status pages**:
   - Anthropic: https://status.anthropic.com
   - OpenAI: https://status.openai.com
   - Google: https://status.cloud.google.com

2. **Retry after delay** (temporary outage)
3. **Fall back to 2-model consensus** if one provider down
4. **Switch to fake mode** if all providers unavailable

---

### Network Timeout

**Error Message**:
```
TimeoutError: Request timed out after 30000ms
```

**Cause**: Network latency or slow API response.

**Solution**:

1. **Increase timeout**:
   ```typescript
   const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
   ```

2. **Check network connection**
3. **Retry request**
4. **Use async mode** for long-running translations

---

## Translation Quality Issues

### No Consensus (All Models Differ)

**Symptom**: Agreement score 0.0, all three outputs different.

**Cause**: Ambiguous source text, idiomatic expressions, or cultural references.

**Solution**:

1. **Review all three outputs** - one may be best for context
2. **Provide more context**:
   ```typescript
   {
     context: {
       domain: 'marketing',  // Clarify domain
       tone: 'formal',       // Specify tone
       audience: 'experts'   // Define audience
     }
   }
   ```

3. **Rephrase source text** to be less ambiguous
4. **Lower consensus threshold**:
   ```typescript
   { consensusThreshold: 0.0 }  // Accept any, compare all
   ```

5. **Get human review** for final decision

---

### Semantic Drift (Reverse Translation Fails)

**Symptom**: `verification.passed: false`, semantic similarity < 0.85.

**Cause**: Translation changed meaning during forward or reverse pass.

**Solution**:

1. **Review differences**:
   ```json
   {
     "verification": {
       "passed": false,
       "semanticSimilarity": 0.72,
       "reverseTranslations": {
         "claude": "The parties accept mandatory arbitration.",
         "gpt": "The participants agree to binding arbitration.",
         "translategemma": "Both sides agree to arbitration."
       }
     }
   }
   ```

2. **Adjust source text** to be more literal
3. **Provide domain context** for technical terms
4. **Use lower threshold** if paraphrasing acceptable:
   ```typescript
   { verifyReverse: true, minSimilarity: 0.70 }
   ```

5. **Manually verify** meaning preservation

---

### Placeholder Loss

**Symptom**: Placeholders like `{{name}}` or `{count}` missing or translated.

**Cause**: `preservePlaceholders` not set, or model didn't preserve them.

**Solution**:

1. **Enable preservation**:
   ```typescript
   {
     context: {
       preservePlaceholders: true
     }
   }
   ```

2. **Add explicit instruction**:
   ```typescript
   {
     systemPrompt: "Preserve all placeholders like {{...}} and {...} exactly."
   }
   ```

3. **Validate placeholders** in output:
   ```typescript
   function validatePlaceholders(original, translated) {
     const orig = original.match(/\{\{.*?\}\}|\{.*?\}/g) || [];
     const trans = translated.match(/\{\{.*?\}\}|\{.*?\}/g) || [];
     return JSON.stringify(orig) === JSON.stringify(trans);
   }
   ```

4. **Reject and retry** if placeholders altered

---

## Verification Issues

### Fingerprint Mismatch

**Symptom**: `verified: false` when running verification.

**Cause**: Proof document was modified after generation.

**Solution**:

1. **Check file integrity** - ensure no edits were made
2. **Recalculate fingerprints**:
   ```bash
   echo -n "Las partes acuerdan un arbitraje vinculante." | shasum -a 256
   ```

3. **Compare to stored fingerprint** in proof document
4. **Regenerate proof** if document corrupted

---

### Request ID Not Found

**Symptom**: Can't find request ID in API dashboard.

**Cause**: Request ID format wrong, or API provider purged logs.

**Solution**:

1. **Check request ID format**:
   - Claude: `req_abc123xyz`
   - GPT: `chatcmpl-def456uvw`
   - Gemini: `gen_ghi789rst`

2. **Check log retention**:
   - Anthropic: 30 days
   - OpenAI: 30 days
   - Google: 7 days minimum

3. **Verify timestamp** matches when proof generated
4. **Save proof immediately** after generation (don't delay verification)

---

### Timestamps Not Parallel

**Symptom**: Timestamps > 10 seconds apart.

**Cause**: Sequential API calls instead of parallel.

**Solution**:

1. **Use `Promise.all`** for parallel execution:
   ```typescript
   const [claude, gpt, gemini] = await Promise.all([
     callClaude(),
     callGPT(),
     callGemini()
   ]);
   ```

2. **Check for `await` in loop** (sequential):
   ```typescript
   // ❌ Sequential (WRONG)
   for (const model of models) {
     results.push(await callModel(model));
   }
   
   // ✅ Parallel (CORRECT)
   const results = await Promise.all(models.map(callModel));
   ```

3. **Verify parallel execution** in timestamps

---

## Configuration Issues

### Wrong Language Code

**Error Message**:
```
InvalidLanguage: Language code "japanese" is not supported.
```

**Cause**: Used language name instead of ISO 639-1 code.

**Solution**:

1. **Use 2-letter ISO codes**:
   - ❌ "japanese"
   - ✅ "ja"

2. **Reference list**:
   - English: `en`
   - Spanish: `es`
   - French: `fr`
   - German: `de`
   - Japanese: `ja`
   - Chinese: `zh`
   - Korean: `ko`
   
   Full list: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

---

### Mode Not Specified

**Error Message**:
```
ValidationError: mode is required
```

**Cause**: Didn't specify `fake` or `provable` mode.

**Solution**:

```typescript
// ✅ Correct
{
  source: "Hello",
  targetLanguage: "es",
  mode: "fake"  // or "provable"
}
```

---

### Missing Context

**Symptom**: Poor translation quality, unexpected results.

**Cause**: Insufficient context for translation.

**Solution**:

Provide rich context:
```typescript
{
  source: "Sign the contract",
  targetLanguage: "es",
  mode: "fake",
  context: {
    domain: "legal",        // ✅ Helps choose formal terminology
    tone: "formal",         // ✅ Ensures professional language
    audience: "professionals"  // ✅ Targets appropriate register
  }
}
```

---

## Performance Issues

### Slow Response Time

**Symptom**: Translation takes > 10 seconds.

**Cause**: Network latency, large content, or sequential execution.

**Solution**:

1. **Verify parallel execution** (should be ~4 seconds)
2. **Check network speed**:
   ```bash
   ping console.anthropic.com
   ping api.openai.com
   ping generativelanguage.googleapis.com
   ```

3. **Split large content** into smaller batches
4. **Use streaming** for real-time feedback (not implemented yet)
5. **Cache common translations**

---

### High Cost

**Symptom**: API costs higher than expected.

**Cause**: Using provable mode for all translations, or translating same content repeatedly.

**Solution**:

1. **Use fake mode for development**:
   - Saves ~$0.056 per 1,000 words
   - Only use provable for final/production

2. **Cache translations**:
   ```typescript
   const cacheKey = `${hash(source)}_${targetLang}`;
   const cached = await cache.get(cacheKey);
   if (cached) return cached.translation;
   ```

3. **Batch similar content** - more efficient than one-by-one
4. **Use Gemini for high-volume** - 50x cheaper than Claude

---

## Debugging

### Enable Debug Logging

```typescript
{
  debug: true,  // Enables verbose logging
  logRequests: true,  // Logs API requests/responses
  logConsensus: true  // Logs consensus calculation
}
```

### Check API Responses

```typescript
// Log full API responses
console.log('Claude response:', JSON.stringify(claudeResponse, null, 2));
console.log('GPT response:', JSON.stringify(gptResponse, null, 2));
console.log('Gemini response:', JSON.stringify(geminiResponse, null, 2));
```

### Verify Request Payload

```typescript
const payload = {
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: [{
    role: "user",
    content: `Translate to ${targetLang}: ${text}`
  }]
};
console.log('Sending to Claude:', JSON.stringify(payload, null, 2));
```

---

## Common Patterns

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retry ${i + 1} after ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Graceful Degradation

```typescript
async function translateWithFallback(text: string, targetLang: string) {
  try {
    // Try provable mode with all 3 models
    return await translate({ mode: 'provable' });
  } catch (error) {
    console.warn('Provable mode failed, falling back to fake mode');
    // Fall back to fake mode
    return await translate({ mode: 'fake' });
  }
}
```

### Validation Pipeline

```typescript
async function validateTranslation(result: TranslationOutput) {
  const checks = {
    hasOutput: !!result.translation,
    consensusValid: result.consensus.agreement >= 0.67,
    placeholdersPreserved: validatePlaceholders(result.source, result.translation),
    reverseVerified: result.verification?.passed === true
  };
  
  if (Object.values(checks).every(v => v === true)) {
    console.log('✅ Translation validated');
    return result;
  } else {
    console.error('❌ Validation failed:', checks);
    throw new Error('Translation validation failed');
  }
}
```

---

## Getting Help

### Check Documentation

- [SKILL.md](../SKILL.md) - Main documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API reference
- [EXAMPLES.md](./EXAMPLES.md) - Usage examples
- [MODELS_COMPARISON.md](./MODELS_COMPARISON.md) - Model capabilities

### Provider Documentation

- Anthropic: https://docs.anthropic.com
- OpenAI: https://platform.openai.com/docs
- Google: https://ai.google.dev/docs

### Status Pages

- Anthropic: https://status.anthropic.com
- OpenAI: https://status.openai.com
- Google: https://status.cloud.google.com

### Support

- GitHub Issues: `ExcitingTheory/amplify-homework-supply`
- Email: [support contact if applicable]

---

## Frequently Asked Questions

**Q: Why use fake mode vs provable mode?**  
A: Fake mode is free and fast for development. Provable mode costs ~$0.056per 1,000 words but provides cryptographic proof.

**Q: Can I use only one model instead of three?**  
A: This skill requires all three for consensus. For single-model, use provider SDK directly.

**Q: How accurate is reverse translation verification?**  
A: Detects meaning drift with ~95% accuracy. Always supplement with human review for critical content.

**Q: What if two models fail?**  
A: Entire translation aborts. Skill requires all three models for consensus methodology.

**Q: Can I add custom models?**  
A: Not currently supported. Skill architecture designed for exactly three models.

**Q: How long are proofs valid?**  
A: Indefinitely if fingerprints verify. Request IDs expire after 30 days in API logs.
