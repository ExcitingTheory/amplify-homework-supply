For a college course application, here are your practical options:

## Best Options

**OpenAI Embeddings API** (recommended for most cases)
- Model: `text-embedding-3-small` (1536 dimensions, or 512/256 with truncation)
- Cost: ~$0.02 per 1 million tokens (extremely cheap for 1-3k items)
- Quality: Excellent for semantic search
- Implementation: Simple REST API call

```javascript
const response = await fetch('https://api.openai.com/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small',
    input: 'photosynthesis',
    dimensions: 512 // optional: reduce size
  })
});
```

**Voyage AI or Cohere** (alternatives)
- Similar pricing and quality
- Voyage has models optimized for educational content
- Cohere offers `embed-english-light-v3.0` for efficient embeddings

## When to Generate Embeddings

**Pre-compute on your server** (strongly recommended):
- Generate embeddings once when you create/update course content
- Store them in your database alongside the text
- Serve pre-computed vectors to the browser
- **Why**: Cheaper, faster, no API keys in browser, consistent quality

**Generate in browser** (only for dynamic user queries):
- When student types a search query
- For real-time "find similar" features
- Keep API keys secure using a backend proxy

## Architecture Pattern

```
1. Content Creation (one-time):
   Course content → Your server → OpenAI API → Store vectors in DB

2. Student App Load:
   Browser requests → Your API → Returns {text, vector, metadata}[]

3. Student Search:
   User query → Your server (proxy) → OpenAI API → Get query vector
   → Send to browser → Browser does similarity search locally
```

## Free/Local Options (if needed)

**Transformers.js** (runs in browser via WASM):
- Model: `Xenova/all-MiniLM-L6-v2` (384 dimensions)
- Pros: Free, no API calls, works offline
- Cons: Slower (~100ms per embedding), larger bundle size (~30MB)
- Good for: Privacy-sensitive apps or completely offline use

```javascript
import { pipeline } from '@xenova/transformers';
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const output = await extractor('photosynthesis', { pooling: 'mean', normalize: true });
const vector = Array.from(output.data);
```

## My Recommendation

For a college course app: **Pre-compute embeddings with OpenAI's API on your backend**. For 2,000 items, you'll spend about $0.05 total, get excellent quality, and students will have instant search with no API calls needed.

What's your budget and privacy constraints? That would help narrow it down further.