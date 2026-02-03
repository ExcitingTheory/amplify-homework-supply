# AI Workflows: Generalized Patterns and Approaches

**Purpose**: Reusable AI workflow patterns applicable to any application  
**Last Updated**: February 2, 2026

---

## Overview

This document generalizes the AI workflow patterns developed for educational content creation, making them applicable to any application requiring intelligent assistance, quality assurance, and multi-language support.

---

## 1. Progressive AI Assistance Pattern

**Problem**: Users need intelligent help but API costs and latency must be minimized

**Solution**: Three-tier progressive assistance system

### Tier 1: Rule-Based (Free, Instant)
- Pattern matching and heuristics
- No API calls required
- Works offline
- Provides immediate feedback

**When to Use**:
- Structural guidance
- Input validation
- Common patterns recognition
- Offline-first features

**Implementation**:
```javascript
// Define rules based on patterns
const rules = {
  afterExplanation: ['practice', 'quiz', 'example'],
  afterPractice: ['feedback', 'quiz', 'moreExamples'],
  afterQuiz: ['summary', 'nextTopic']
};

function getSuggestions(currentContext) {
  const lastBlockType = currentContext.lastBlock?.type;
  return rules[`after${lastBlockType}`] || defaultSuggestions;
}
```

### Tier 2: AI Content Generation (Fast, Low Cost)
- Context-aware completions
- Streaming responses
- Debounced triggers
- Ghost text UI pattern

**When to Use**:
- Writing assistance
- Content suggestions
- Auto-completion
- Predictive text

**Implementation**:
```javascript
// Debounced AI completion
const [suggestion, setSuggestion] = useState('');

useEffect(() => {
  const timer = setTimeout(async () => {
    if (shouldTrigger(text)) {
      const response = await fetch('/api/complete', {
        method: 'POST',
        body: JSON.stringify({ context: text })
      });
      
      const reader = response.body.getReader();
      // Stream response character by character
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSuggestion(prev => prev + decode(value));
      }
    }
  }, 800); // Debounce delay
  
  return () => clearTimeout(timer);
}, [text]);
```

### Tier 3: AI Analysis & Reasoning (Slow, Higher Cost)
- Deep context analysis
- Explanations and reasoning
- Priority scoring
- Fallback to Tier 1 on failure

**When to Use**:
- Complex decision-making
- Quality assessment
- Recommendation systems
- Expert-level guidance

**Implementation**:
```javascript
async function getAIRecommendations(fullContext) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        context: fullContext,
        analyzedAt: new Date()
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    const { recommendations, reasoning } = await response.json();
    return { 
      recommendations, 
      reasoning, 
      source: 'ai' 
    };
  } catch (error) {
    // Fallback to Tier 1
    return { 
      recommendations: getRuleBasedSuggestions(fullContext),
      source: 'rules'
    };
  }
}
```

**Cost Comparison**:
| Tier | Response Time | Cost per Request | Use Frequency |
|------|--------------|------------------|---------------|
| 1 (Rules) | < 1ms | $0 | High |
| 2 (Completion) | 1-3s | $0.001 | Medium |
| 3 (Analysis) | 2-5s | $0.002-0.01 | Low |

---

## 2. Comprehensive Feedback Collection Pattern

**Problem**: Need to improve AI output quality over time

**Solution**: Multi-level feedback system with automatic and manual collection

### Explicit Feedback (Thumbs Up/Down)
```typescript
interface FeedbackWidget {
  contentType: string;
  generatedContent: string;
  model: string;
  contextId?: string;
  onSubmit: (feedback: Feedback) => void;
}

interface Feedback {
  type: 'positive' | 'negative';
  reasons?: string[];  // For negative feedback
  comment?: string;
  timestamp: Date;
}
```

### Implicit Feedback (Behavioral)
- Acceptance rate (Tab/click to accept)
- Dismissal rate (Esc/continue typing)
- Edit distance after acceptance
- Time to accept/dismiss

```javascript
// Track implicit feedback
function trackSuggestionOutcome(suggestion, action) {
  const feedback = {
    contentType: 'completion',
    generatedContent: suggestion,
    action, // 'accepted' | 'dismissed' | 'edited'
    timestamp: Date.now(),
    context: currentContext
  };
  
  if (action === 'dismissed') {
    submitNegativeFeedback(feedback);
  } else if (action === 'accepted') {
    submitPositiveFeedback(feedback);
  }
}
```

### Feedback Storage Schema
```sql
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY,
  content_type VARCHAR(50),    -- 'chat', 'completion', 'generation'
  feedback_type VARCHAR(20),   -- 'positive' | 'negative'
  reasons TEXT[],              -- Array of reason codes
  comment TEXT,
  model VARCHAR(50),           -- 'gpt-4', 'claude-3.5', etc.
  prompt TEXT,
  generated_content TEXT,
  context_id UUID,             -- Link to entity
  user_id UUID,
  created_at TIMESTAMP,
  metadata JSONB               -- Extensible
);
```

### Analytics Queries
```javascript
// Get feedback statistics
async function getFeedbackStats(contentType, timeRange) {
  const stats = await db.query(`
    SELECT 
      content_type,
      COUNT(*) as total,
      SUM(CASE WHEN feedback_type = 'positive' THEN 1 ELSE 0 END) as positive,
      SUM(CASE WHEN feedback_type = 'negative' THEN 1 ELSE 0 END) as negative,
      ARRAY_AGG(DISTINCT reasons) as common_reasons
    FROM ai_feedback
    WHERE content_type = $1 
      AND created_at >= $2
    GROUP BY content_type
  `, [contentType, timeRange.start]);
  
  return {
    ...stats,
    positiveRate: stats.positive / stats.total,
    commonIssues: stats.common_reasons
  };
}
```

---

## 3. LLM-as-a-Judge Testing Pattern

**Problem**: Need to test AI features without manual QA

**Solution**: Use a separate LLM to evaluate outputs

### Test Definition Structure
```typescript
interface AITest {
  name: string;
  category: 'functionality' | 'quality' | 'safety';
  input: {
    prompt: string;
    context?: any;
    parameters?: any;
  };
  expected: {
    toolCalled?: string;
    outputFormat?: string;
    requiredFields?: string[];
    successCriteria: (result: any) => boolean;
  };
}
```

### Judge Evaluation
```typescript
async function judgeResponse(test: AITest, actualOutput: any) {
  const judgmentPrompt = `
    Evaluate this AI system's response:
    
    Test: ${test.name}
    Input: ${JSON.stringify(test.input)}
    Expected: ${JSON.stringify(test.expected)}
    Actual Output: ${JSON.stringify(actualOutput)}
    
    Evaluate on these criteria:
    1. Correctness (0-40 points): Did it produce the right output?
    2. Quality (0-30 points): Was the output well-formed and useful?
    3. Efficiency (0-20 points): Did it execute efficiently?
    4. Safety (0-10 points): Are there any safety concerns?
    
    Respond with JSON:
    {
      "score": <0-100>,
      "breakdown": {
        "correctness": <0-40>,
        "quality": <0-30>,
        "efficiency": <0-20>,
        "safety": <0-10>
      },
      "reasoning": "...",
      "issues": ["..."]
    }
  `;
  
  const judgment = await callLLM(judgmentPrompt, {
    model: 'claude-3.5-sonnet',
    temperature: 0.1 // Low temperature for consistent evaluation
  });
  
  return JSON.parse(judgment);
}
```

### Test Runner
```typescript
async function runTestSuite(tests: AITest[]) {
  const results = [];
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    
    // Execute the feature
    const actualOutput = await executeFeature(test.input);
    
    // Get AI judgment
    const judgment = await judgeResponse(test, actualOutput);
    
    results.push({
      test: test.name,
      passed: judgment.score >= 70 && test.expected.successCriteria(actualOutput),
      score: judgment.score,
      judgment,
      actualOutput
    });
    
    // Rate limiting
    await sleep(500);
  }
  
  return {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results
  };
}
```

### Cost Estimation
```javascript
function estimateTestCost(numTests, avgTokensPerTest = 500) {
  const inputTokenCost = 0.003;  // per 1K tokens (Claude 4.5)
  const outputTokenCost = 0.015; // per 1K tokens
  
  const totalInputTokens = numTests * avgTokensPerTest;
  const totalOutputTokens = numTests * 200; // Estimated judgment length
  
  const cost = 
    (totalInputTokens / 1000 * inputTokenCost) +
    (totalOutputTokens / 1000 * outputTokenCost);
    
  return {
    estimatedCost: cost,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    perTest: cost / numTests
  };
}
```

---

## 4. Multi-Model Consensus Pattern

**Problem**: Need high-confidence AI outputs for critical operations

**Solution**: Run multiple models in parallel and analyze consensus

### Parallel Execution
```typescript
async function getMultiModelConsensus(prompt: string, context: any) {
  // Execute all models in parallel
  const [claude, gpt, gemini] = await Promise.all([
    callClaude(prompt, context),
    callGPT(prompt, context),
    callGemini(prompt, context)
  ]);
  
  return {
    models: { claude, gpt, gemini },
    consensus: analyzeConsensus({ claude, gpt, gemini })
  };
}
```

### Consensus Analysis
```typescript
function analyzeConsensus(outputs: Record<string, any>) {
  const values = Object.values(outputs);
  
  // For structured data, compare key by key
  if (typeof values[0] === 'object') {
    return analyzeStructuredConsensus(outputs);
  }
  
  // For text, use similarity scoring
  return analyzeTextConsensus(values);
}

function analyzeStructuredConsensus(outputs: Record<string, any>) {
  const keys = Object.keys(outputs[Object.keys(outputs)[0]]);
  const differences = [];
  
  for (const key of keys) {
    const values = Object.entries(outputs).map(([model, output]) => ({
      model,
      value: output[key]
    }));
    
    // Check if all values match
    const uniqueValues = [...new Set(values.map(v => JSON.stringify(v.value)))];
    
    if (uniqueValues.length === 1) {
      // Full consensus
      continue;
    } else if (uniqueValues.length === 2) {
      // Partial consensus - find majority
      const counts = uniqueValues.map(uv => ({
        value: JSON.parse(uv),
        count: values.filter(v => JSON.stringify(v.value) === uv).length
      }));
      
      const majority = counts.find(c => c.count >= 2);
      differences.push({
        key,
        consensus: 'partial',
        chosen: majority.value,
        alternatives: counts.filter(c => c !== majority)
      });
    } else {
      // No consensus
      differences.push({
        key,
        consensus: 'none',
        values
      });
    }
  }
  
  return {
    level: differences.length === 0 ? 'full' : 
           differences.every(d => d.consensus === 'partial') ? 'partial' : 'none',
    agreement: 1 - (differences.length / keys.length),
    differences
  };
}
```

### Reverse Translation Verification
```typescript
async function verifyWithReverseTranslation(
  original: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  // Translate back to source language
  const reverseTranslation = await translate(translation, targetLang, sourceLang);
  
  // Calculate semantic similarity
  const similarity = await calculateSemanticSimilarity(original, reverseTranslation);
  
  return {
    passed: similarity >= 0.85,
    similarity,
    reverseTranslation,
    driftDetected: similarity < 0.85
  };
}

async function calculateSemanticSimilarity(text1: string, text2: string) {
  // Get embeddings for both texts
  const [embedding1, embedding2] = await Promise.all([
    getEmbedding(text1),
    getEmbedding(text2)
  ]);
  
  // Calculate cosine similarity
  return cosineSimilarity(embedding1, embedding2);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

### Cryptographic Proof Generation
```typescript
interface TranslationProof {
  fingerprints: Record<string, string>;  // SHA-256 hashes
  requestIds: Record<string, string>;    // API request IDs
  timestamps: Record<string, string>;    // ISO timestamps
  models: string[];
  verified: boolean;
}

async function generateProof(outputs: Record<string, any>): Promise<TranslationProof> {
  const proof: TranslationProof = {
    fingerprints: {},
    requestIds: {},
    timestamps: {},
    models: Object.keys(outputs),
    verified: false
  };
  
  for (const [model, output] of Object.entries(outputs)) {
    // Generate SHA-256 fingerprint
    proof.fingerprints[model] = await sha256(JSON.stringify(output.content));
    proof.requestIds[model] = output.requestId;
    proof.timestamps[model] = output.timestamp;
  }
  
  // Verify parallel execution (timestamps within 5 seconds)
  const timestamps = Object.values(proof.timestamps).map(t => new Date(t).getTime());
  const timeRange = Math.max(...timestamps) - Math.min(...timestamps);
  proof.verified = timeRange < 5000; // 5 seconds
  
  return proof;
}

async function verifyProof(proof: TranslationProof, actualContent: any): Promise<boolean> {
  // Verify fingerprints match current content
  const currentFingerprint = await sha256(JSON.stringify(actualContent));
  const storedFingerprint = Object.values(proof.fingerprints)[0]; // Use first model
  
  return currentFingerprint === storedFingerprint;
}
```

---

## 5. Client-Side Tool Execution Pattern

**Problem**: Edge runtime can't access databases/auth, but needs to call LLM APIs

**Solution**: Hybrid architecture with server-side LLM calls and client-side execution

### Architecture
```
Client → Edge API (LLM) → Tool Decision → Client Execution → Result → Edge API → Response
         └─ Stateless ─┘                  └─ Has DB Access ─┘
```

### Tool Definition Schema
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      required?: boolean;
    }>;
    required: string[];
  };
}

// Example
const createRecordTool: ToolDefinition = {
  name: 'create_record',
  description: 'Create a new record in the database',
  parameters: {
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'Database table name',
        enum: ['users', 'posts', 'comments']
      },
      data: {
        type: 'object',
        description: 'Record data as JSON object'
      }
    },
    required: ['table', 'data']
  }
};
```

### Server-Side (Edge Runtime)
```javascript
// pages/api/chat.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { messages, tools } = await req.json();
  
  // Call LLM with tool definitions
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    tools: tools.map(t => ({ type: 'function', function: t })),
    tool_choice: 'auto'
  });
  
  // Return tool calls to client for execution
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Client-Side (Browser)
```typescript
// Use AI SDK with client-side tool execution
const { messages, append } = useChat({
  api: '/api/chat',
  experimental_tools: {
    // Define tools that execute client-side
    create_record: {
      description: 'Create a new database record',
      parameters: z.object({
        table: z.enum(['users', 'posts', 'comments']),
        data: z.record(z.any())
      }),
      // This runs in the browser with DB access
      execute: async ({ table, data }) => {
        const result = await database.save(table, data);
        return { success: true, id: result.id };
      }
    }
  },
  // Auto-execute tools without confirmation
  experimental_sendAutomaticallyWhen: (message) => {
    return message.role === 'assistant' && 
           message.parts.some(p => p.type?.startsWith('tool-'));
  }
});
```

### Error Handling & Retry
```typescript
async function executeToolWithRetry(
  toolName: string,
  args: any,
  maxRetries = 3
): Promise<any> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await executeTool(toolName, args);
      return { success: true, ...result };
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation errors
      if (error.code === 'VALIDATION_ERROR') {
        throw error;
      }
      
      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  
  return { 
    success: false, 
    error: lastError.message,
    code: lastError.code
  };
}
```

---

## 6. Code Documentation Extraction Pattern

**Problem**: Need context about code for AI to generate accurate metadata

**Solution**: Extract documentation from multiple sources and combine

### JSDoc/TSDoc Extraction
```typescript
import * as ts from 'typescript';

function extractJSDocComments(filePath: string) {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  
  const docs = [];
  
  function visit(node: ts.Node) {
    // Get JSDoc comments
    const jsDoc = ts.getJSDocCommentsAndTags(node);
    
    if (jsDoc.length > 0) {
      docs.push({
        location: {
          file: filePath,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line
        },
        tags: jsDoc.map(doc => ({
          tag: doc.tagName?.text,
          text: doc.comment
        })),
        nodeType: ts.SyntaxKind[node.kind]
      });
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return docs;
}
```

### Usage Pattern Detection
```typescript
function findTranslationUsage(codebase: string[]) {
  const usagePattern = /t\(['"]([\w.]+)['"]/g;
  const found = new Map<string, Set<string>>();
  
  for (const file of codebase) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    
    while ((match = usagePattern.exec(content)) !== null) {
      const key = match[1];
      if (!found.has(key)) {
        found.set(key, new Set());
      }
      found.get(key).add(file);
    }
  }
  
  return Array.from(found.entries()).map(([key, files]) => ({
    key,
    usageCount: files.size,
    files: Array.from(files)
  }));
}
```

### AI Metadata Generation
```typescript
async function generateMetadata(
  translationKey: string,
  currentValue: string,
  codeContext: {
    files: string[];
    jsdocs: any[];
    usage: any[];
  }
) {
  const prompt = `
    Generate translation metadata for this UI string:
    
    Key: ${translationKey}
    Current Value: "${currentValue}"
    
    Code Context:
    - Used in ${codeContext.files.length} files
    - Component descriptions: ${codeContext.jsdocs.map(d => d.tags.find(t => t.tag === 'fileoverview')?.text).join('\n')}
    - Usage patterns: ${codeContext.usage.join(', ')}
    
    Generate:
    {
      "context": "Where and why this text appears",
      "component": {
        "location": "file path",
        "description": "component purpose"
      },
      "usage": "How users interact with this",
      "impact": "Importance level (critical/high/medium/low)",
      "userType": "Who sees this (all/learners/instructors/admins)",
      "tone": "Appropriate tone (formal/casual/friendly/technical)",
      "alternativeTerms": ["synonym1", "synonym2"]
    }
  `;
  
  const response = await callLLM(prompt, { 
    model: 'claude-3.5-sonnet',
    temperature: 0.3 
  });
  
  return JSON.parse(response);
}
```

### Metadata Structure
```typescript
interface TranslationMetadata {
  context: string;
  component: {
    location: string;
    description: string;
  };
  usage: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  userType: 'all' | 'admins' | 'users' | 'guests';
  tone: 'formal' | 'casual' | 'friendly' | 'technical';
  alternativeTerms: string[];
}

interface LocaleEntry {
  value: string;
  _meta?: TranslationMetadata;
}
```

---

## 7. Observability & Tracing Pattern

**Problem**: Need to monitor LLM usage, costs, and performance

**Solution**: Comprehensive tracing with OpenTelemetry

### Initialization
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OpenAIInstrumentation } from '@arizeai/openinference-instrumentation-openai';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

function initializeTracing() {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      headers: {
        'api-key': process.env.OTEL_API_KEY
      }
    }),
    instrumentations: [
      new OpenAIInstrumentation()
    ]
  });
  
  sdk.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown().then(() => process.exit(0));
  });
}
```

### Custom Span Attributes
```typescript
import { trace } from '@opentelemetry/api';

async function tracedLLMCall(prompt: string, context: any) {
  const tracer = trace.getTracer('llm-service');
  
  return tracer.startActiveSpan('llm.completion', async (span) => {
    try {
      span.setAttributes({
        'llm.request.model': 'gpt-4',
        'llm.request.temperature': 0.7,
        'llm.request.max_tokens': 500,
        'llm.request.prompt_length': prompt.length,
        'user.id': context.userId,
        'operation.type': context.operationType
      });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
      });
      
      span.setAttributes({
        'llm.response.tokens': response.usage.total_tokens,
        'llm.response.completion_tokens': response.usage.completion_tokens,
        'llm.response.prompt_tokens': response.usage.prompt_tokens,
        'llm.response.finish_reason': response.choices[0].finish_reason
      });
      
      return response;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### Cost Tracking
```typescript
interface LLMUsageMetrics {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: Date;
  userId?: string;
  operation: string;
}

function calculateCost(usage: any, model: string): number {
  const pricing = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3.5-sonnet': { input: 0.003, output: 0.015 }
  };
  
  const price = pricing[model] || pricing['gpt-4'];
  
  return (
    (usage.prompt_tokens / 1000 * price.input) +
    (usage.completion_tokens / 1000 * price.output)
  );
}

async function trackUsage(usage: LLMUsageMetrics) {
  await database.insert('llm_usage', usage);
  
  // Alert if approaching budget
  const monthlyTotal = await getMonthlyUsage(usage.userId);
  if (monthlyTotal > BUDGET_THRESHOLD * 0.9) {
    await sendAlert('Approaching LLM budget limit', {
      current: monthlyTotal,
      budget: BUDGET_THRESHOLD
    });
  }
}
```

---

## 8. Streaming Response Pattern

**Problem**: LLM responses are slow, need better UX

**Solution**: Stream responses character-by-character

### Server-Side (Edge Runtime)
```typescript
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { prompt } = await req.json();
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true
  });
  
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    }
  });
  
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### Client-Side
```typescript
async function streamCompletion(prompt: string, onChunk: (text: string) => void) {
  const response = await fetch('/api/complete', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    onChunk(text);
  }
}

// Usage
let accumulated = '';
await streamCompletion('Write a story', (chunk) => {
  accumulated += chunk;
  updateUI(accumulated); // Update UI progressively
});
```

### With React
```tsx
import { useChat } from '@ai-sdk/react';

function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    streamProtocol: 'data'  // Use data stream protocol
  });
  
  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          <strong>{m.role}:</strong>
          <span>{m.content}</span>  {/* Auto-updates as streaming */}
        </div>
      ))}
      
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

---

## Cost Optimization Strategies

### 1. Caching
```typescript
const cache = new Map<string, { result: any, timestamp: number }>();

async function cachedLLMCall(prompt: string, maxAge = 3600000) {
  const cacheKey = hash(prompt);
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.result;
  }
  
  const result = await callLLM(prompt);
  cache.set(cacheKey, { result, timestamp: Date.now() });
  
  return result;
}
```

### 2. Batch Processing
```typescript
async function batchProcess(items: string[], batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    // Process batch in single API call
    const batchResults = await callLLM(batch.join('\n---\n'));
    results.push(...batchResults);
    
    // Rate limiting
    if (i + batchSize < items.length) {
      await sleep(1000);
    }
  }
  
  return results;
}
```

### 3. Progressive Degradation
```typescript
async function getCompletion(prompt: string, options: {
  tryModels: string[];
  fallbackToRules?: boolean;
}) {
  for (const model of options.tryModels) {
    try {
      return await callLLM(prompt, { model });
    } catch (error) {
      if (error.code === 'RATE_LIMIT' || error.code === 'QUOTA_EXCEEDED') {
        continue; // Try next model
      }
      throw error;
    }
  }
  
  if (options.fallbackToRules) {
    return getRuleBasedCompletion(prompt);
  }
  
  throw new Error('All models failed');
}
```

---

## Best Practices Summary

1. **Use progressive tiers** - Rule-based → AI completion → AI analysis
2. **Collect comprehensive feedback** - Both explicit and implicit
3. **Implement LLM judges** - Automate quality testing
4. **Seek consensus for critical ops** - Use multiple models
5. **Execute tools client-side when possible** - Better data access
6. **Extract rich context** - JSDoc, usage patterns, code analysis
7. **Trace everything** - Costs, latency, errors
8. **Stream responses** - Better perceived performance
9. **Cache aggressively** - Reduce redundant API calls
10. **Batch when possible** - More efficient API usage

---

## Conclusion

These patterns provide a foundation for building production-ready AI features in any application. They balance cost, performance, accuracy, and user experience while maintaining observability and quality assurance.

Key takeaways:
- Start with simple rules, escalate to AI when needed
- Always collect feedback for improvement
- Use multiple models for critical operations
- Monitor everything (costs, performance, quality)
- Optimize for user experience (streaming, caching)
- Automate testing with LLM judges

**Adapt these patterns to your specific domain while maintaining the core principles.**
