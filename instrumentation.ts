/**
 * Next.js Instrumentation Hook
 *
 * Initializes Arize Phoenix OpenTelemetry tracing on the server.
 * Automatically instruments all OpenAI SDK calls made from server actions
 * and API routes so they appear in the Phoenix dashboard.
 *
 * Controlled by environment variables:
 *   ENABLE_TRACING=true
 *   PHOENIX_COLLECTOR_ENDPOINT=https://app.phoenix.arize.com/s/...
 *   PHOENIX_API_KEY=...
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run on the server runtime (not edge, not client)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.ENABLE_TRACING !== "true") {
      console.log(
        "[Instrumentation] Tracing disabled (ENABLE_TRACING !== true)",
      );
      return;
    }

    const phoenixEndpoint = process.env.PHOENIX_COLLECTOR_ENDPOINT;
    if (
      !phoenixEndpoint ||
      phoenixEndpoint.includes("<value will be resolved")
    ) {
      console.warn(
        "[Instrumentation] PHOENIX_COLLECTOR_ENDPOINT not set — tracing disabled",
      );
      return;
    }

    try {
      const { NodeTracerProvider } =
        await import("@opentelemetry/sdk-trace-node");
      const { OTLPTraceExporter } =
        await import("@opentelemetry/exporter-trace-otlp-http");
      const { BatchSpanProcessor } =
        await import("@opentelemetry/sdk-trace-base");
      const { OpenAIInstrumentation } =
        await import("@arizeai/openinference-instrumentation-openai");
      const { registerInstrumentations } =
        await import("@opentelemetry/instrumentation");
      const { Resource } = await import("@opentelemetry/resources");
      const { SemanticResourceAttributes } =
        await import("@opentelemetry/semantic-conventions");

      const provider = new NodeTracerProvider({
        resource: new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: "homework-supply-nextjs",
          [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
          "deployment.environment": process.env.NODE_ENV || "development",
        }),
      });

      const exporter = new OTLPTraceExporter({
        url: `${phoenixEndpoint}/v1/traces`,
        headers: {
          ...(process.env.PHOENIX_API_KEY && {
            Authorization: `Bearer ${process.env.PHOENIX_API_KEY}`,
          }),
        },
      });

      provider.addSpanProcessor(
        new BatchSpanProcessor(exporter, {
          maxQueueSize: 100,
          maxExportBatchSize: 10,
          scheduledDelayMillis: 500,
        }),
      );

      provider.register();

      registerInstrumentations({
        instrumentations: [new OpenAIInstrumentation()],
      });

      console.log(
        "[Instrumentation] Phoenix tracing initialized:",
        phoenixEndpoint,
      );
    } catch (error) {
      console.error("[Instrumentation] Phoenix initialization failed:", error);
    }
  }
}
