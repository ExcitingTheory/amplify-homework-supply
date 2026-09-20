# Phoenix Agent Evaluations

Automated evaluation framework for testing the Kai/Sage AI agents using [Arize Phoenix](https://phoenix.arize.com).

## Start with Open-Source Phoenix

Validate tracing and evaluations against the open-source project before connecting
shared or production data to Phoenix Cloud. This keeps setup reproducible and gives
the team a place to verify redaction, project names, span attributes, and failure
behavior without exporting application data.

Official resources:

- [Phoenix open-source repository and releases](https://github.com/Arize-ai/phoenix)
- [Phoenix installation and deployment documentation](https://arize.com/docs/phoenix/self-hosting)
- [Phoenix Cloud portal](https://app.phoenix.arize.com/)
- [TypeScript tracing quickstart](https://arize.com/docs/phoenix/get-started/ts-get-started-tracing)
- [Phoenix TypeScript API](https://arize.com/docs/phoenix/resources/typescript-api)

Local setup options:

```bash
# Python package
pip install arize-phoenix
phoenix serve

# Or Docker
docker run --rm -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest
```

Open `http://localhost:6006`, create a dedicated development project, and send a
single redaction-safe test trace before running an evaluation dataset. For Phoenix
Cloud, create a separate project in the portal, obtain its endpoint and API key from
project settings, and store the key in the repository's approved secret manager.
Never commit it or expose it through a `NEXT_PUBLIC_*` variable.

The application currently initializes tracing in `instrumentation.ts` and adds manual
tool spans in `app/api/_shared/agentTools.ts`. Treat monitoring as workable only after
the following are verified in both local and cloud environments:

- OpenAI calls and manual tool spans appear under the intended environment project.
- Collector URL handling adds `/v1/traces` exactly once.
- Authentication uses the header format issued by the selected Phoenix deployment.
- Prompt, response, user, document, and tool attributes follow the approved redaction
  and retention policy.
- Failed exports do not break generation requests, and failures are themselves visible.
- Dashboards or alerts cover generation errors, latency, token use, tool failures,
  negative feedback rate, and evaluation regressions.
- Feedback records correlate to traces through opaque IDs rather than copied secrets
  or unnecessary personal data.

## Setup

### 1. No Extra Dependencies Required

The eval script uses Phoenix's REST API directly and OpenAI (already installed).
No additional npm packages are needed.

### 2. Start or Connect to Phoenix

Either run locally:
```bash
pip install arize-phoenix
phoenix serve
```

Or connect to a hosted instance by setting:
```bash
ENABLE_TRACING=true
PHOENIX_COLLECTOR_ENDPOINT=https://your-instance.arize.com
PHOENIX_API_KEY=your-api-key
```

### 3. Environment Variables

Add to `.env.local` (or export):
```bash
PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006
ENABLE_TRACING=true
OPENAI_API_KEY=sk-...
# Optional: restrict to specific chat API URL
CHAT_API_URL=http://localhost:3000/api/chat
```

## Running Evals

```bash
# Run all eval datasets
npx tsx scripts/phoenix-agent-evals.ts

# Run a specific dataset
npx tsx scripts/phoenix-agent-evals.ts --dataset=tool-selection
npx tsx scripts/phoenix-agent-evals.ts --dataset=safety
npx tsx scripts/phoenix-agent-evals.ts --dataset=response-quality

# Verbose mode (shows each test case as it runs)
npx tsx scripts/phoenix-agent-evals.ts --verbose
```

The script works in two modes:
- **With Phoenix running**: Uploads datasets, creates experiments, logs results to Phoenix UI
- **Without Phoenix**: Runs evals locally and prints results to console (graceful fallback)

## Eval Datasets

| Dataset | Cases | Evaluators | Description |
|---------|-------|------------|-------------|
| `tool-selection` | 6 | tool-selection-accuracy, response-relevance, latency | Validates correct tool is called for each query type |
| `safety` | 3 | safety-boundary, latency | Tests data boundaries, prompt injection resistance |
| `response-quality` | 2 | response-relevance, faithfulness, latency | Checks pedagogical quality and groundedness |

## Evaluator Details

### Code-Based Evaluators
- **tool-selection-accuracy**: Checks if the expected tools were actually called. Score = matched/expected.
- **latency-budget**: 5 second budget per turn. Score degrades linearly above budget.
- **safety-boundary**: Scans response for disallowed phrases (other student data, direct answers, system prompts).

### LLM-Based Evaluators (GPT-4o-mini via OpenAI SDK)
- **response-relevance**: LLM judge classifying response as relevant/irrelevant to the question.
- **faithfulness**: LLM judge checking if response is factually grounded in provided ground truth.

## Viewing Results

After running, open Phoenix UI:
- Local: http://localhost:6006
- Navigate to **Datasets** → **Experiments** to see results
- Each experiment shows per-case scores and explanations
- Traces from the chat API are automatically linked via OTLP spans

## Architecture

```
┌─────────────────────────────────────────────────┐
│  scripts/phoenix-agent-evals.ts                 │
│  ┌───────────┐  ┌──────────────┐  ┌─────────┐  │
│  │ Datasets  │→ │ Agent Task   │→ │ Evals   │  │
│  │ (test     │  │ (POST /api/  │  │ (code + │  │
│  │  cases)   │  │  chat)       │  │  LLM)   │  │
│  └───────────┘  └──────┬───────┘  └────┬────┘  │
└─────────────────────────┼───────────────┼───────┘
                          │               │
                          ▼               ▼
               ┌──────────────────────────────────┐
               │  Arize Phoenix                    │
               │  ┌──────────┐  ┌──────────────┐  │
               │  │  Traces  │  │ Experiments  │  │
               │  │  (OTLP)  │  │ (Results)    │  │
               │  └──────────┘  └──────────────┘  │
               └──────────────────────────────────┘
```

## Extending

To add new test cases, add entries to the appropriate dataset array in `scripts/phoenix-agent-evals.ts`:

```typescript
const MY_NEW_DATASET: AgentTestCase[] = [
  {
    input: {
      messages: [{ role: "user", content: "Your test question" }],
      persona: "kai",
      context: { unit: { id: "unit-1", name: "..." } },
    },
    output: {
      expectedTools: ["tool_name"],
      expectedTopics: ["topic1", "topic2"],
      groundTruth: "Expected factual content...",
      shouldNotContain: ["phrases that should NOT appear"],
    },
    metadata: {
      category: "your-category",
      description: "What this tests",
    },
  },
];
```

Then register it in the `datasets` map in `main()`.
