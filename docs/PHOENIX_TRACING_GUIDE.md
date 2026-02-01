# Arize Phoenix Tracing Guide

Complete guide for instrumenting Lambda functions with [Arize Phoenix](https://docs.arize.com/phoenix) for LLM observability and tracing.

## Overview

Phoenix provides end-to-end tracing for AI applications with:
- **LLM call tracking** - Monitor OpenAI API calls (completions, embeddings, audio, images)
- **Streaming support** - Full support for Vercel AI SDK streaming
- **Tool execution** - Track AI tool calls and their results
- **Performance metrics** - Latency, token usage, costs
- **Prompt engineering** - Debug prompt/response pairs
- **Error tracking** - Capture failures and exceptions

---

## Architecture

### Lambda Functions to Instrument

1. **chatStream** - AI SDK streaming chat with GPT-4o and tools
2. **contentCompletionStream** - AI SDK streaming content completion
3. **ai** - Traditional OpenAI API REST calls
4. **documentAnalysis** - Document processing with embeddings
5. **embeddings** - Vector embedding generation

### Instrumentation Types

| Function | SDK | Instrumentation Package |
|----------|-----|------------------------|
| chatStream | Vercel AI SDK | `@arizeai/openinference-instrumentation-vercel` |
| contentCompletionStream | Vercel AI SDK | `@arizeai/openinference-instrumentation-vercel` |
| ai, documentAnalysis, embeddings | OpenAI Node SDK | `@arizeai/openinference-instrumentation-openai` |

---

## Installation

### Step 1: Install Phoenix Packages

For **AI SDK streaming handlers** (chatStream, contentCompletionStream):

```bash
cd amplify/functions/chatStream
npm install @arizeai/openinference-instrumentation-vercel
npm install @opentelemetry/api @opentelemetry/sdk-trace-node
npm install @opentelemetry/exporter-trace-otlp-http
npm install @opentelemetry/resources @opentelemetry/semantic-conventions
```

```bash
cd amplify/functions/contentCompletionStream
npm install @arizeai/openinference-instrumentation-vercel
npm install @opentelemetry/api @opentelemetry/sdk-trace-node
npm install @opentelemetry/exporter-trace-otlp-http
npm install @opentelemetry/resources @opentelemetry/semantic-conventions
```

For **OpenAI SDK handlers** (ai, documentAnalysis, embeddings):

```bash
cd amplify/functions/ai
npm install @arizeai/openinference-instrumentation-openai
npm install @opentelemetry/api @opentelemetry/sdk-trace-node
npm install @opentelemetry/exporter-trace-otlp-http
npm install @opentelemetry/resources @opentelemetry/semantic-conventions
```

Repeat for `documentAnalysis` and `embeddings`.

### Step 2: Create Shared Tracing Module

Create `amplify/functions/shared/phoenix-tracer.ts`:

```typescript
/**
 * Phoenix/OpenTelemetry Tracer Configuration
 * 
 * Initializes distributed tracing for Lambda functions with Arize Phoenix.
 * Supports both Vercel AI SDK and OpenAI SDK instrumentation.
 * 
 * Environment Variables:
 * - PHOENIX_ENDPOINT: Phoenix collector endpoint (optional, defaults to localhost)
 * - PHOENIX_COLLECTOR_ENDPOINT: Alternative variable name
 * - OTEL_EXPORTER_OTLP_ENDPOINT: OpenTelemetry standard endpoint
 * - ENABLE_TRACING: Set to "true" to enable (optional, defaults to true in dev/staging)
 */

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

let isInitialized = false;

export interface TracerConfig {
  serviceName: string;
  instrumentationType: 'vercel-ai' | 'openai' | 'both';
  endpoint?: string;
  enableTracing?: boolean;
}

/**
 * Initialize Phoenix tracing for a Lambda function
 * 
 * @param config - Tracer configuration
 * @returns True if tracing was initialized
 * 
 * @example
 * // In handler.ts
 * import { initializeTracing } from '../shared/phoenix-tracer';
 * 
 * initializeTracing({
 *   serviceName: 'chatStream',
 *   instrumentationType: 'vercel-ai'
 * });
 */
export function initializeTracing(config: TracerConfig): boolean {
  // Prevent double initialization
  if (isInitialized) {
    console.log('[Phoenix] Tracer already initialized, skipping');
    return true;
  }

  // Check if tracing is enabled
  const enableTracing = config.enableTracing ?? 
    process.env.ENABLE_TRACING === 'true' ||
    process.env.NODE_ENV === 'development' ||
    process.env.AWS_EXECUTION_ENV?.includes('dev');

  if (!enableTracing) {
    console.log('[Phoenix] Tracing disabled via config/environment');
    return false;
  }

  try {
    // Determine endpoint (support multiple env var names)
    const endpoint = config.endpoint || 
      process.env.PHOENIX_ENDPOINT ||
      process.env.PHOENIX_COLLECTOR_ENDPOINT ||
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      'http://localhost:6006'; // Default Phoenix dev server

    console.log('[Phoenix] Initializing tracer:', {
      serviceName: config.serviceName,
      instrumentationType: config.instrumentationType,
      endpoint,
    });

    // Create resource with service name
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
    });

    // Create tracer provider
    const provider = new NodeTracerProvider({
      resource,
    });

    // Create OTLP exporter for Phoenix
    const exporter = new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
      headers: {
        // Add auth headers if needed
        ...(process.env.PHOENIX_API_KEY && {
          'Authorization': `Bearer ${process.env.PHOENIX_API_KEY}`
        }),
      },
    });

    // Add batch span processor
    provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
      maxQueueSize: 100,
      scheduledDelayMillis: 500,
    }));

    // Register the provider
    provider.register();

    // Register instrumentations
    const instrumentations = [];

    if (config.instrumentationType === 'vercel-ai' || config.instrumentationType === 'both') {
      // Vercel AI SDK instrumentation
      try {
        const { VercelAIInstrumentation } = require('@arizeai/openinference-instrumentation-vercel');
        instrumentations.push(new VercelAIInstrumentation());
        console.log('[Phoenix] Registered Vercel AI SDK instrumentation');
      } catch (error) {
        console.warn('[Phoenix] Failed to load Vercel AI instrumentation:', error);
      }
    }

    if (config.instrumentationType === 'openai' || config.instrumentationType === 'both') {
      // OpenAI SDK instrumentation
      try {
        const { OpenAIInstrumentation } = require('@arizeai/openinference-instrumentation-openai');
        instrumentations.push(new OpenAIInstrumentation());
        console.log('[Phoenix] Registered OpenAI SDK instrumentation');
      } catch (error) {
        console.warn('[Phoenix] Failed to load OpenAI instrumentation:', error);
      }
    }

    if (instrumentations.length > 0) {
      registerInstrumentations({
        instrumentations,
      });
    }

    isInitialized = true;
    console.log('[Phoenix] Tracing initialized successfully');
    return true;

  } catch (error) {
    console.error('[Phoenix] Failed to initialize tracing:', error);
    return false;
  }
}

/**
 * Gracefully shutdown tracing (call in Lambda shutdown hooks if needed)
 */
export async function shutdownTracing(): Promise<void> {
  if (!isInitialized) return;
  
  try {
    // Flush any pending spans
    console.log('[Phoenix] Shutting down tracer...');
    // Note: Provider shutdown would go here if we stored the reference
    isInitialized = false;
  } catch (error) {
    console.error('[Phoenix] Error during tracer shutdown:', error);
  }
}

/**
 * Check if tracing is currently active
 */
export function isTracingEnabled(): boolean {
  return isInitialized;
}
```

### Step 3: Update Package Dependencies

Add to `amplify/functions/shared/package.json` (or each function's package.json):

```json
{
  "name": "@amplify-homework-supply/shared",
  "version": "1.0.0",
  "dependencies": {
    "@arizeai/openinference-instrumentation-vercel": "^0.2.0",
    "@arizeai/openinference-instrumentation-openai": "^0.2.0",
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-trace-node": "^1.28.0",
    "@opentelemetry/sdk-trace-base": "^1.28.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.54.0",
    "@opentelemetry/resources": "^1.28.0",
    "@opentelemetry/semantic-conventions": "^1.28.0",
    "@opentelemetry/instrumentation": "^0.54.0"
  }
}
```

---

## Instrumentation Examples

### ChatStream Handler (Vercel AI SDK)

Update `amplify/functions/chatStream/handler.ts`:

```typescript
/**
 * Chat Stream HTTP API Handler for Gen 2
 * WITH PHOENIX TRACING
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';

// PHOENIX: Import and initialize tracer BEFORE any AI SDK code
import { initializeTracing } from '../shared/phoenix-tracer';

// Initialize Phoenix tracing
initializeTracing({
  serviceName: 'chatStream',
  instrumentationType: 'vercel-ai',
});

// ... rest of imports and constants

export const handler: APIGatewayProxyHandlerV2 = async (event: any) => {
  try {
    const requestContext = event.requestContext as any;
    console.log('[Chat] Request received:', {
      path: event.rawPath,
      method: event.requestContext?.http?.method,
      hasAuth: !!requestContext?.authorizer,
      userId: requestContext?.authorizer?.jwt?.claims?.sub,
    });
    
    const { messages, context: chatContext } = JSON.parse(event.body || '{}');

    // PHOENIX: Automatic tracing - streamText calls are auto-instrumented
    const openai = await getOpenAI();
    const systemMessage = buildSystemMessage(chatContext);

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemMessage.content,
      messages: await convertToModelMessages(messages),
      tools,
      temperature: 0.7,
      maxOutputTokens: 2000,
    });

    // Stream response
    const uiStream = result.toUIMessageStream();
    let body = '';
    
    for await (const chunk of uiStream) {
      body += `data: ${JSON.stringify(chunk)}\n\n`;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
      body,
    };
  } catch (error) {
    console.error('[Chat] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### ContentCompletionStream Handler

Update `amplify/functions/contentCompletionStream/handler.ts`:

```typescript
/**
 * Content Completion Stream HTTP API Handler
 * WITH PHOENIX TRACING
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// PHOENIX: Initialize tracing
import { initializeTracing } from '../shared/phoenix-tracer';

initializeTracing({
  serviceName: 'contentCompletionStream',
  instrumentationType: 'vercel-ai',
});

// ... rest of code (streamText auto-instrumented)
```

### AI Handler (OpenAI SDK)

Update `amplify/functions/ai/handler.ts`:

```typescript
/**
 * AI Function (OpenAI SDK)
 * WITH PHOENIX TRACING
 */

import OpenAI from 'openai';

// PHOENIX: Initialize tracing BEFORE creating OpenAI client
import { initializeTracing } from '../shared/phoenix-tracer';

initializeTracing({
  serviceName: 'ai-function',
  instrumentationType: 'openai',
});

// OpenAI client creation is now auto-instrumented
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// All openai.chat.completions.create(), openai.embeddings.create(), etc. are traced
```

---

## Environment Configuration

### Lambda Function Environment Variables

Add these environment variables to your Lambda function definitions in `amplify/backend.ts`:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

// ... other imports

const backend = defineBackend({
  auth,
  data,
  // ... other resources
});

// Add Phoenix configuration to streaming functions
const chatStreamFunction = backend.functions['chatStream'];
if (chatStreamFunction) {
  chatStreamFunction.addEnvironment('PHOENIX_ENDPOINT', process.env.PHOENIX_ENDPOINT || 'https://your-phoenix-instance.com');
  chatStreamFunction.addEnvironment('ENABLE_TRACING', process.env.ENABLE_TRACING || 'true');
  // Optional: Add API key if using cloud Phoenix
  if (process.env.PHOENIX_API_KEY) {
    chatStreamFunction.addEnvironment('PHOENIX_API_KEY', process.env.PHOENIX_API_KEY);
  }
}

const contentCompletionStreamFunction = backend.functions['contentCompletionStream'];
if (contentCompletionStreamFunction) {
  contentCompletionStreamFunction.addEnvironment('PHOENIX_ENDPOINT', process.env.PHOENIX_ENDPOINT || 'https://your-phoenix-instance.com');
  contentCompletionStreamFunction.addEnvironment('ENABLE_TRACING', process.env.ENABLE_TRACING || 'true');
  if (process.env.PHOENIX_API_KEY) {
    contentCompletionStreamFunction.addEnvironment('PHOENIX_API_KEY', process.env.PHOENIX_API_KEY);
  }
}

// Repeat for ai, documentAnalysis, embeddings functions
```

### Local Development (.env)

Create `.env.local` for local testing:

```bash
# Phoenix Configuration
PHOENIX_ENDPOINT=http://localhost:6006
ENABLE_TRACING=true

# Optional: Cloud Phoenix
# PHOENIX_ENDPOINT=https://app.phoenix.arize.com
# PHOENIX_API_KEY=your-api-key-here

# Existing OpenAI config
OPENAI_API_KEY=sk-...
```

### Production Configuration

For production, use AWS Systems Manager Parameter Store or Secrets Manager:

```bash
# Store Phoenix endpoint
aws ssm put-parameter \
  --name "/amplify-homework-supply/production/phoenix-endpoint" \
  --value "https://phoenix.yourdomain.com" \
  --type "String"

# Store Phoenix API key (if needed)
aws ssm put-parameter \
  --name "/amplify-homework-supply/production/phoenix-api-key" \
  --value "your-api-key" \
  --type "SecureString"
```

Then retrieve in Lambda via IAM permissions.

---

## Running Phoenix

### Option 1: Local Development (Docker)

```bash
# Run Phoenix locally with Docker
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest

# Or with docker-compose
cat > docker-compose.phoenix.yml <<EOF
version: '3.8'
services:
  phoenix:
    image: arizephoenix/phoenix:latest
    ports:
      - "6006:6006"  # Web UI
      - "4317:4317"  # gRPC collector
      - "4318:4318"  # HTTP collector
    environment:
      - PHOENIX_WORKING_DIR=/phoenix-data
    volumes:
      - ./phoenix-data:/phoenix-data
EOF

docker-compose -f docker-compose.phoenix.yml up -d
```

Access Phoenix UI at: http://localhost:6006

### Option 2: Cloud Phoenix (Arize)

1. Sign up at https://app.phoenix.arize.com
2. Get your API key from settings
3. Use endpoint: `https://app.phoenix.arize.com`

### Option 3: Self-Hosted Phoenix

Deploy Phoenix to your infrastructure:
- AWS ECS/Fargate
- Kubernetes
- VM with Docker

See: https://docs.arize.com/phoenix/deployment/self-hosting

---

## What Gets Traced

### Vercel AI SDK (chatStream, contentCompletionStream)

Phoenix automatically captures:

- **Model calls** - `streamText()` invocations
- **Model configuration** - Temperature, max tokens, model name
- **Messages** - Full conversation history (system, user, assistant)
- **Tool calls** - Tool definitions, inputs, outputs
  - `search_content`
  - `create_section`
  - `insert_quiz`
  - `insert_answer_block`
  - etc.
- **Streaming chunks** - Token-by-token generation
- **Token usage** - Prompt tokens, completion tokens, total
- **Latency** - Time to first token (TTFT), total duration
- **Errors** - Exceptions, API errors

### OpenAI SDK (ai, documentAnalysis, embeddings)

Phoenix automatically captures:

- **Chat completions** - `openai.chat.completions.create()`
- **Embeddings** - `openai.embeddings.create()`
- **Audio** - Transcription (Whisper), TTS
- **Images** - DALL-E, Vision API
- **Function calls** - Deprecated function calling
- **Token usage** - Per-request metrics
- **Costs** - Estimated cost per call
- **Errors** - Rate limits, API errors

### Trace Attributes

Each trace includes:

```typescript
{
  // LLM attributes
  "llm.model_name": "gpt-4o",
  "llm.temperature": 0.7,
  "llm.max_tokens": 2000,
  "llm.prompt_messages": [...],
  "llm.completions": [...],
  "llm.token_count.prompt": 245,
  "llm.token_count.completion": 187,
  "llm.token_count.total": 432,
  
  // Tool attributes
  "llm.tools": [...],
  "llm.tool_calls": [...],
  
  // Service attributes
  "service.name": "chatStream",
  "service.version": "1.0.0",
  
  // Custom attributes (can be added)
  "user.id": "user-123",
  "unit.id": "unit-456",
  "section.id": "section-789"
}
```

---

## Adding Custom Attributes

### Per-Request Context

Add custom span attributes for better filtering:

```typescript
import { trace } from '@opentelemetry/api';

export const handler: APIGatewayProxyHandlerV2 = async (event: any) => {
  const tracer = trace.getTracer('chatStream');
  
  return tracer.startActiveSpan('chat-request', async (span) => {
    try {
      const requestContext = event.requestContext as any;
      const userId = requestContext?.authorizer?.jwt?.claims?.sub;
      
      // Add custom attributes
      span.setAttributes({
        'user.id': userId,
        'conversation.length': messages.length,
        'unit.id': chatContext?.unit?.id,
        'unit.name': chatContext?.unit?.name,
        'files.count': chatContext?.files?.length || 0,
        'words.count': chatContext?.dictionary?.length || 0,
      });

      // ... existing handler code

      span.end();
      return response;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2 }); // ERROR
      span.end();
      throw error;
    }
  });
};
```

---

## Querying Traces in Phoenix

### Phoenix UI

1. Open http://localhost:6006 (or your Phoenix URL)
2. Navigate to "Traces" view
3. Filter by:
   - Service name (`chatStream`, `contentCompletionStream`)
   - Model name (`gpt-4o`, `text-embedding-3-small`)
   - Latency (slow requests)
   - Token usage (expensive requests)
   - User/Unit ID (custom attributes)

### Example Queries

**Find expensive chat requests:**
```
llm.token_count.total > 1000
```

**Find slow requests:**
```
duration > 5000ms
```

**Find requests by user:**
```
user.id = "user-123"
```

**Find failed requests:**
```
status = ERROR
```

**Find tool usage:**
```
llm.tool_calls.*.name = "insert_quiz"
```

---

## Performance Impact

### Overhead

- **Latency**: ~5-15ms additional overhead per request
- **Memory**: ~10-20MB additional memory usage
- **Network**: Batched span exports every 500ms (minimal impact)

### Optimization Tips

1. **Batch span processor** - Already configured in tracer
2. **Conditional tracing** - Disable in production if needed:
   ```typescript
   enableTracing: process.env.NODE_ENV !== 'production'
   ```
3. **Sample rate** - Trace only 10% of requests:
   ```typescript
   import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
   
   const provider = new NodeTracerProvider({
     resource,
     sampler: new TraceIdRatioBasedSampler(0.1), // 10% sampling
   });
   ```

---

## Troubleshooting

### Traces Not Appearing

1. **Check Phoenix is running:**
   ```bash
   curl http://localhost:6006/health
   ```

2. **Verify environment variables:**
   ```typescript
   console.log('PHOENIX_ENDPOINT:', process.env.PHOENIX_ENDPOINT);
   console.log('ENABLE_TRACING:', process.env.ENABLE_TRACING);
   ```

3. **Check Lambda logs:**
   ```bash
   sam logs -n chatStream --tail
   ```

4. **Test manual span creation:**
   ```typescript
   import { trace } from '@opentelemetry/api';
   const tracer = trace.getTracer('test');
   tracer.startActiveSpan('test-span', (span) => {
     console.log('Span created:', span.spanContext());
     span.end();
   });
   ```

### Common Issues

**Issue: "Instrumentation not registered"**
- Ensure `initializeTracing()` is called BEFORE importing AI SDK modules
- Check that instrumentation packages are installed

**Issue: "Cannot find module '@arizeai/openinference-instrumentation-vercel'"**
- Run `npm install` in function directory
- Verify package.json includes the dependency

**Issue: "Connection refused to Phoenix endpoint"**
- Verify Phoenix is running
- Check firewall/network settings
- For Lambda, ensure security groups allow outbound to Phoenix

---

## Testing Instrumentation

### Unit Test with Mock Tracer

```typescript
// chatStream.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trace } from '@opentelemetry/api';

describe('chatStream with tracing', () => {
  beforeEach(() => {
    vi.stubEnv('PHOENIX_ENDPOINT', 'http://localhost:6006');
    vi.stubEnv('ENABLE_TRACING', 'true');
  });

  it('should create spans for streamText calls', async () => {
    const mockSpan = {
      setAttributes: vi.fn(),
      recordException: vi.fn(),
      setStatus: vi.fn(),
      end: vi.fn(),
    };

    vi.spyOn(trace.getTracer('chatStream'), 'startActiveSpan')
      .mockImplementation((name, fn) => fn(mockSpan));

    // ... test handler

    expect(mockSpan.setAttributes).toHaveBeenCalled();
    expect(mockSpan.end).toHaveBeenCalled();
  });
});
```

### Integration Test

```bash
# Start Phoenix locally
docker run -d -p 6006:6006 arizephoenix/phoenix:latest

# Run Lambda locally with SAM
sam local start-api --env-vars env.json

# Make request
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'

# Check Phoenix UI
open http://localhost:6006
```

---

## Migration Checklist

- [ ] Install Phoenix packages in all Lambda functions
- [ ] Create shared `phoenix-tracer.ts` module
- [ ] Update `chatStream` handler with tracing
- [ ] Update `contentCompletionStream` handler with tracing
- [ ] Update `ai` handler with tracing
- [ ] Update `documentAnalysis` handler with tracing
- [ ] Update `embeddings` handler with tracing
- [ ] Configure environment variables
- [ ] Deploy Phoenix (local, cloud, or self-hosted)
- [ ] Test tracing in dev environment
- [ ] Add custom attributes for user/unit context
- [ ] Configure sampling for production
- [ ] Set up monitoring alerts in Phoenix
- [ ] Document runbook for troubleshooting

---

## Additional Resources

- [Phoenix Documentation](https://docs.arize.com/phoenix)
- [Vercel AI SDK Instrumentation](https://github.com/Arize-ai/openinference/tree/main/js/packages/openinference-instrumentation-vercel)
- [OpenAI Instrumentation](https://github.com/Arize-ai/openinference/tree/main/js/packages/openinference-instrumentation-openai)
- [OpenTelemetry Node SDK](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/)
- [AWS Lambda with OpenTelemetry](https://aws-otel.github.io/docs/getting-started/lambda)

---

## Support

For issues with Phoenix integration:
1. Check Phoenix GitHub issues: https://github.com/Arize-ai/phoenix/issues
2. Join Arize Slack: https://join.slack.com/t/arize-ai/shared_invite/...
3. Contact via: support@arize.com
