/**
 * Arize Phoenix OpenTelemetry Instrumentation
 * 
 * Traces OpenAI API calls in Lambda functions for observability.
 * Captures prompts, completions, embeddings, audio, and image operations.
 * 
 * Usage:
 * import { initializePhoenixTracing } from '../shared/phoenix-tracer';
 * initializePhoenixTracing(); // Call once at module load
 */

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OpenAIInstrumentation } from '@arizeai/openinference-instrumentation-openai';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import type { Span } from '@opentelemetry/api';

let isInitialized = false;

/**
 * Initialize Phoenix tracing (call once per Lambda cold start)
 */
export function initializePhoenixTracing() {
  if (isInitialized) {
    console.log('[Phoenix] Already initialized');
    return;
  }

  const phoenixEndpoint = process.env.PHOENIX_COLLECTOR_ENDPOINT;
  
  if (!phoenixEndpoint) {
    console.warn('[Phoenix] PHOENIX_COLLECTOR_ENDPOINT not set - tracing disabled');
    return;
  }

  try {
    // Create provider with service identification
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.AWS_LAMBDA_FUNCTION_NAME || 'homework-supply-lambda',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.AWS_LAMBDA_FUNCTION_VERSION || '1.0.0',
        'deployment.environment': process.env.ENV || 'dev',
      }),
    });

    // Export traces to Phoenix collector
    const exporter = new OTLPTraceExporter({
      url: `${phoenixEndpoint}/v1/traces`,
      headers: {
        // Add auth headers if Phoenix requires authentication
        ...(process.env.PHOENIX_API_KEY && {
          'Authorization': `Bearer ${process.env.PHOENIX_API_KEY}`,
        }),
      },
    });

    // Use batch processor to reduce overhead
    provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
      maxQueueSize: 100,
      maxExportBatchSize: 10,
      scheduledDelayMillis: 500,
    }));

    provider.register();

    // Register OpenAI instrumentation
    registerInstrumentations({
      instrumentations: [
        new OpenAIInstrumentation(),
      ],
    });

    isInitialized = true;
    console.log('[Phoenix] Tracing initialized:', phoenixEndpoint);
  } catch (error) {
    console.error('[Phoenix] Initialization failed:', error);
  }
}

/**
 * Add custom attributes to current span
 */
export function addTraceAttributes(attributes: Record<string, string | number | boolean>) {
  if (!isInitialized) return;
  
  try {
    const { trace } = require('@opentelemetry/api');
    const span = trace.getActiveSpan();
    if (span) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }
  } catch (error) {
    console.error('[Phoenix] Failed to add attributes:', error);
  }
}

/**
 * Create a manual span for non-OpenAI operations
 */
export async function traceOperation<T>(
  operationName: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>
): Promise<T> {
  if (!isInitialized) {
    return fn(); // No tracing, just execute
  }

  try {
    const { trace } = require('@opentelemetry/api');
    const tracer = trace.getTracer(process.env.AWS_LAMBDA_FUNCTION_NAME || 'homework-supply');
    
    return await tracer.startActiveSpan(operationName, async (span: Span) => {
      try {
        // Add custom attributes
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
        
        const result = await fn();
        span.setStatus({ code: 1 }); // OK
        return result;
      } catch (error) {
        span.setStatus({
          code: 2, // ERROR
          message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  } catch (error) {
    console.error('[Phoenix] Trace operation failed:', error);
    return fn(); // Fallback to untraced execution
  }
}
