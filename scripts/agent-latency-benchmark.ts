#!/usr/bin/env tsx
/**
 * Agent Latency Benchmarks
 *
 * Measures individual tool execution latencies and compares the agent's
 * multi-step tool-call approach against a "context-stuffed" single-prompt approach.
 *
 * Runs each tool N times and reports P50/P95/P99 latencies.
 *
 * Prerequisites:
 *   - Dev server running: `npm run dev`
 *   - OPENAI_API_KEY in environment
 *
 * Usage:
 *   npx tsx scripts/agent-latency-benchmark.ts
 *   npx tsx scripts/agent-latency-benchmark.ts --iterations=20
 *   npx tsx scripts/agent-latency-benchmark.ts --tool=semantic_search
 */

import {
  buildAgentTools,
  type AgentContext,
} from "../app/api/_shared/agentTools";

// ─── Configuration ───────────────────────────────────────────────────────────

const ITERATIONS = parseInt(
  process.argv.find((a) => a.startsWith("--iterations="))?.split("=")[1] ||
    "10",
  10,
);
const TOOL_FILTER = process.argv
  .find((a) => a.startsWith("--tool="))
  ?.split("=")[1];
const CHAT_API_URL =
  process.env.CHAT_API_URL || "http://localhost:3000/api/chat";

// ─── Mock Context ────────────────────────────────────────────────────────────

const studentCtx: AgentContext = {
  userId: "bench-student-1",
  groups: ["Learners"],
  identityId: "id-bench-student-1",
  unitId: "unit-bench",
  sectionId: "section-bench",
  courseOutline: [
    { unitId: "unit-bench", name: "Benchmark Unit", number: 1 },
    { unitId: "unit-2", name: "Second Unit", number: 2 },
    { unitId: "unit-3", name: "Third Unit", number: 3 },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatMs(ms: number): string {
  return `${ms.toFixed(0)}ms`;
}

interface BenchResult {
  tool: string;
  iterations: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  mean: number;
  errors: number;
}

// ─── Tool-Level Benchmarks ───────────────────────────────────────────────────

interface ToolBenchSpec {
  name: string;
  params: Record<string, any>;
  description: string;
}

const TOOL_BENCH_SPECS: ToolBenchSpec[] = [
  {
    name: "get_course_outline",
    params: {},
    description: "Return course outline from context (no DB call)",
  },
  {
    name: "get_student_progress",
    params: { studentId: "bench-student-1" },
    description: "Query Grade model for student progress",
  },
  {
    name: "recall_memory",
    params: {},
    description: "Query AssistantChat for conversation memory",
  },
  {
    name: "update_memory",
    params: {
      topic: "benchmark",
      insight: "testing latency",
      wasResolved: false,
    },
    description: "Create/update memory record in AssistantChat",
  },
  {
    name: "semantic_search",
    params: { query: "weather vocabulary", scope: "unit" },
    description: "Load S3 bundle + compute cosine similarity search",
  },
  {
    name: "read_file_content",
    params: { fileId: "file-bench" },
    description: "Read file content from ParsedContent model",
  },
];

async function benchmarkTool(
  tools: Record<string, any>,
  spec: ToolBenchSpec,
): Promise<BenchResult> {
  const latencies: number[] = [];
  let errors = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    try {
      await tools[spec.name].execute(spec.params);
    } catch {
      errors++;
    }
    latencies.push(performance.now() - start);
  }

  return {
    tool: spec.name,
    iterations: ITERATIONS,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    min: Math.min(...latencies),
    max: Math.max(...latencies),
    mean: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    errors,
  };
}

// ─── End-to-End Chat Benchmark ───────────────────────────────────────────────

interface E2EResult {
  scenario: string;
  p50: number;
  p95: number;
  mean: number;
  toolCalls: number;
  errors: number;
}

const E2E_SCENARIOS = [
  {
    name: "simple-question",
    description: "Question answerable without tools",
    messages: [{ role: "user", content: "What is te-form in Japanese?" }],
  },
  {
    name: "memory-recall",
    description: "Triggers recall_memory tool",
    messages: [{ role: "user", content: "What did we discuss last time?" }],
  },
  {
    name: "search-then-answer",
    description: "Triggers semantic_search + response",
    messages: [{ role: "user", content: "Find vocabulary about animals" }],
  },
  {
    name: "multi-tool",
    description: "Triggers progress + outline",
    messages: [
      {
        role: "user",
        content: "How am I doing and what's next in this course?",
      },
    ],
  },
];

async function benchmarkE2E(
  scenario: (typeof E2E_SCENARIOS)[0],
): Promise<E2EResult> {
  const latencies: number[] = [];
  const toolCounts: number[] = [];
  let errors = 0;

  for (let i = 0; i < Math.min(ITERATIONS, 5); i++) {
    const start = performance.now();
    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: scenario.messages,
          persona: "kai",
          context: {
            unit: { id: "unit-bench", name: "Benchmark" },
            sectionId: "section-bench",
          },
        }),
      });

      if (!res.ok) {
        errors++;
        latencies.push(performance.now() - start);
        continue;
      }

      const body = await res.text();
      const toolCalls = body
        .split("\n")
        .filter((l) => l.startsWith("b:")).length;
      toolCounts.push(toolCalls);
      latencies.push(performance.now() - start);
    } catch {
      errors++;
      latencies.push(performance.now() - start);
    }
  }

  return {
    scenario: scenario.name,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    mean: latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1),
    toolCalls: toolCounts.length
      ? Math.round(toolCounts.reduce((a, b) => a + b, 0) / toolCounts.length)
      : 0,
    errors,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("⚡ Agent Latency Benchmarks");
  console.log("═".repeat(60));
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Chat API: ${CHAT_API_URL}`);
  console.log("");

  // ── Part 1: Individual Tool Latencies ──
  console.log(
    "┌─────────────────────────────────────────────────────────────┐",
  );
  console.log(
    "│ Part 1: Individual Tool Execution Latency                   │",
  );
  console.log(
    "└─────────────────────────────────────────────────────────────┘",
  );
  console.log("");

  const tools = buildAgentTools(
    studentCtx,
    process.env.OPENAI_API_KEY || "test",
  );
  const specs = TOOL_FILTER
    ? TOOL_BENCH_SPECS.filter((s) => s.name === TOOL_FILTER)
    : TOOL_BENCH_SPECS;

  const toolResults: BenchResult[] = [];

  for (const spec of specs) {
    if (!tools[spec.name]) {
      console.log(`  ⊘ ${spec.name} — not available in student context`);
      continue;
    }

    process.stdout.write(`  ⏱ ${spec.name}...`);
    const result = await benchmarkTool(tools, spec);
    toolResults.push(result);
    console.log(
      ` P50=${formatMs(result.p50)} P95=${formatMs(result.p95)} mean=${formatMs(result.mean)}${result.errors ? ` (${result.errors} errors)` : ""}`,
    );
  }

  // Tool results table
  console.log("");
  console.log(
    "  Tool                     │ P50     │ P95     │ P99     │ Mean    │ Errors",
  );
  console.log(
    "  ─────────────────────────┼─────────┼─────────┼─────────┼─────────┼───────",
  );
  for (const r of toolResults) {
    const name = r.tool.padEnd(25);
    console.log(
      `  ${name}│ ${formatMs(r.p50).padEnd(8)}│ ${formatMs(r.p95).padEnd(8)}│ ${formatMs(r.p99).padEnd(8)}│ ${formatMs(r.mean).padEnd(8)}│ ${r.errors}`,
    );
  }

  // ── Part 2: End-to-End Chat Route ──
  console.log("");
  console.log(
    "┌─────────────────────────────────────────────────────────────┐",
  );
  console.log(
    "│ Part 2: End-to-End Chat Latency (requires dev server)       │",
  );
  console.log(
    "└─────────────────────────────────────────────────────────────┘",
  );
  console.log("");

  // Check if dev server is running
  let serverAvailable = false;
  try {
    const ping = await fetch(CHAT_API_URL.replace("/api/chat", "/api/health"), {
      signal: AbortSignal.timeout(2000),
    }).catch(() => null);
    serverAvailable = ping?.ok || false;
  } catch {
    // Also try root
    try {
      const ping = await fetch(CHAT_API_URL.replace("/api/chat", ""), {
        signal: AbortSignal.timeout(2000),
      });
      serverAvailable = ping.ok;
    } catch {
      serverAvailable = false;
    }
  }

  if (!serverAvailable) {
    console.log("  ⚠ Dev server not running — skipping E2E benchmarks");
    console.log("    Start with: npm run dev");
  } else {
    const e2eResults: E2EResult[] = [];

    for (const scenario of E2E_SCENARIOS) {
      process.stdout.write(`  ⏱ ${scenario.name} (${scenario.description})...`);
      const result = await benchmarkE2E(scenario);
      e2eResults.push(result);
      console.log(
        ` P50=${formatMs(result.p50)} P95=${formatMs(result.p95)} tools=${result.toolCalls}${result.errors ? ` errors=${result.errors}` : ""}`,
      );
    }

    console.log("");
    console.log(
      "  Scenario              │ P50      │ P95      │ Mean     │ Avg Tools │ Errors",
    );
    console.log(
      "  ──────────────────────┼──────────┼──────────┼──────────┼───────────┼───────",
    );
    for (const r of e2eResults) {
      const name = r.scenario.padEnd(22);
      console.log(
        `  ${name}│ ${formatMs(r.p50).padEnd(9)}│ ${formatMs(r.p95).padEnd(9)}│ ${formatMs(r.mean).padEnd(9)}│ ${String(r.toolCalls).padEnd(10)}│ ${r.errors}`,
      );
    }
  }

  // ── Summary ──
  console.log("");
  console.log("═".repeat(60));
  console.log("📈 Summary");
  const avgToolLatency =
    toolResults.length > 0
      ? toolResults.reduce((s, r) => s + r.mean, 0) / toolResults.length
      : 0;
  console.log(`  Average tool latency (mean): ${formatMs(avgToolLatency)}`);
  console.log(`  Budget: 5000ms per full turn (includes LLM generation)`);
  console.log(
    `  Tool overhead estimate: ${formatMs(avgToolLatency * 2)} for 2-tool turn`,
  );
  console.log("");
  console.log("  Comparison with context-stuffed approach:");
  console.log(
    "    Context-stuffed: 0ms tool overhead, but larger prompt = slower LLM inference",
  );
  console.log(
    "    Agent tools:     ~" +
      formatMs(avgToolLatency) +
      " per tool call, but smaller focused prompts",
  );
  console.log("");
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
