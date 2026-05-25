/**
 * Local Yjs WebSocket dev server for testing presence/collaboration features.
 *
 * Starts the YjsWebSocketServer on port 3001 (default) with TLS so the
 * frontend YjsProvider connects to wss://localhost:3001 during local development.
 *
 * When OPENAI_API_KEY is set, the Kai bot observer is attached with streaming
 * support — @kai mentions in chat are handled server-side and streamed into
 * the Yjs doc so all participants see the response in real-time.
 *
 * Usage: npx tsx scripts/yjs-dev-server.ts
 */

import { YjsWebSocketServer } from "../amplify/functions/yjsSync/index";
import type {
  DualBotConfig,
  BotContext,
} from "../amplify/functions/yjsSync/botObserver";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const port = parseInt(process.env.YJS_PORT || "3001", 10);

// Load TLS certificates for local dev (same certs Next.js --experimental-https uses)
const certDir = resolve(__dirname, "../test/certificates");
const keyPath = resolve(certDir, "localhost-key.pem");
const certPath = resolve(certDir, "localhost.pem");

let tlsOptions: { key: Buffer; cert: Buffer } | undefined;
if (existsSync(keyPath) && existsSync(certPath)) {
  tlsOptions = {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
  };
} else {
  console.warn(
    "[Dev] No TLS certs found in certificates/ — falling back to plain ws://",
  );
  console.warn(
    "[Dev] Run `npx next dev --experimental-https` once to generate certs",
  );
}

// ─── Bot Configuration ────────────────────────────────────────────────────────

let botConfig: DualBotConfig | undefined;

if (process.env.OPENAI_API_KEY) {
  console.log(
    "[Dev] OPENAI_API_KEY detected — enabling Kai + Sage bots with streaming",
  );

  /**
   * Create a stream function with a specific system prompt.
   */
  const createStreamFn = (baseSystemPrompt: string, maxTokens = 1024) => {
    return async (
      prompt: string,
      onChunk: (chunk: string) => void,
      context?: BotContext,
    ): Promise<string> => {
      let systemContent = baseSystemPrompt;

      if (context?.topicName) {
        systemContent += `\n\nCurrent topic: ${context.topicName}`;
      }
      if (context?.recentMessages?.length) {
        systemContent += `\n\nRecent conversation:\n`;
        for (const msg of context.recentMessages.slice(-5)) {
          systemContent += `${msg.author}: ${msg.content}\n`;
        }
      }

      const messages = [
        { role: "system" as const, content: systemContent },
        { role: "user" as const, content: prompt },
      ];

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages,
            stream: true,
            max_tokens: maxTokens,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body reader");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              onChunk(delta);
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }

      return accumulated;
    };
  };

  const kaiSystemPrompt = `You are Kai, a friendly AI teaching assistant in a collaborative classroom chat.
Be concise and helpful. Use clear language appropriate for students.
If asked about topics outside education, politely redirect.
You can help with: explaining concepts, answering questions, giving study tips, and encouragement.
Never reveal answers directly — use the Socratic method to guide students toward understanding.`;

  const sageSystemPrompt = `You are Sage, an AI assistant for instructors in a collaborative classroom chat.
Be direct and professional. Help instructors with:
- Content planning and lesson structure
- Student progress analysis and insights
- Assignment design and rubric creation
- Classroom management strategies
You have full access to grade analytics and student performance data.
Provide actionable recommendations with specific details.`;

  const kaiStream = createStreamFn(kaiSystemPrompt, 1024);
  const sageStream = createStreamFn(sageSystemPrompt, 2048);

  const createGenerateResponse = (streamFn: typeof kaiStream) => {
    return async (prompt: string, context?: BotContext): Promise<string> => {
      let result = "";
      await streamFn(
        prompt,
        (chunk) => {
          result += chunk;
        },
        context,
      );
      return result;
    };
  };

  botConfig = {
    kai: {
      generateResponse: createGenerateResponse(kaiStream),
      streamResponse: kaiStream,
      botName: "Kai",
      botAuthorId: "kai-bot",
      streamThrottleMs: 80,
    },
    sage: {
      generateResponse: createGenerateResponse(sageStream),
      streamResponse: sageStream,
      botName: "Sage",
      botAuthorId: "sage-bot",
      streamThrottleMs: 80,
    },
  };
} else {
  console.log(
    "[Dev] No OPENAI_API_KEY — bots disabled (set env var to enable)",
  );
}

// ─── Start Server ─────────────────────────────────────────────────────────────

const server = new YjsWebSocketServer({
  port,
  tlsOptions,
  botConfig,
  persistCallback: async (roomName, _update, state) => {
    // In local dev, just log persistence events (no DynamoDB)
    console.log(
      `[Dev] Would persist room "${roomName}" (${state.length} bytes)`,
    );
  },
});

const protocol = tlsOptions ? "wss" : "ws";
server.start().then(() => {
  console.log(
    `\n  Yjs WebSocket dev server running on ${protocol}://localhost:${port}`,
  );
  if (botConfig) {
    console.log(
      `  Bots: Kai + Sage ENABLED (streaming, model: ${process.env.OPENAI_MODEL || "gpt-4o-mini"})`,
    );
  }
  console.log(`  Press Ctrl+C to stop\n`);
});

process.on("SIGINT", () => {
  console.log("\n[Dev] Shutting down...");
  server.stop().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  server.stop().then(() => process.exit(0));
});
