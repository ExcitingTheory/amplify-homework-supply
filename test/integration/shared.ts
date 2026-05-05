import { signIn, signOut, fetchAuthSession } from "aws-amplify/auth";

export type SignInParams = {
  username: string;
  password: string;
};

// Test user credentials
export const TEST_USERS = {
  admin: {
    username: "admin@example.com",
    group: "Admins",
  },
  instructor1: {
    username: "instructor1@example.com",
    group: "Instructors",
  },
  instructor2: {
    username: "instructor2@example.com",
    group: "Instructors",
  },
  student1: {
    username: "student1@example.com",
    group: "Learners",
  },
  student2: {
    username: "student2@example.com",
    group: "Learners",
  },
};

// Helper: Sign in as a test user
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "";

export async function signInAs(user: keyof typeof TEST_USERS) {
  if (!TEST_PASSWORD) {
    throw new Error(
      "TEST_USER_PASSWORD environment variable is required. " +
        "Set it to the password for test users.",
    );
  }

  const usr = TEST_USERS[user];

  try {
    // Sign out any existing session first
    await signOut();
  } catch (error) {
    // Ignore errors if not signed in
  }

  // Sign in with username and password
  await signIn({ username: usr.username, password: TEST_PASSWORD });

  const session = await fetchAuthSession();
  return session;
}

// Helper: Parse SSE (Server-Sent Events) format
export interface SSEEvent {
  type?: string;
  textDelta?: string;
  toolCallId?: string;
  toolName?: string;
  args?: any;
  argsTextDelta?: string;
  result?: any;
  finishReason?: string;
  [key: string]: any;
}

export function parseSSEStream(sseText: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = sseText.split("\n");

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        const jsonStr = line.substring(6); // Remove 'data: ' prefix
        const event = JSON.parse(jsonStr);
        events.push(event);
      } catch (error) {
        console.warn("[parseSSEStream] Failed to parse SSE line:", line, error);
      }
    }
  }

  return events;
}

// Helper: Extract full text content from SSE stream
export function extractTextFromSSE(sseText: string): string {
  const events = parseSSEStream(sseText);
  return events
    .filter((e) => e.type === "text-delta" && e.textDelta)
    .map((e) => e.textDelta)
    .join("");
}

// Helper: Check if SSE stream completed successfully
export function isSSEStreamComplete(sseText: string): boolean {
  const events = parseSSEStream(sseText);
  const lastEvent = events[events.length - 1];
  return lastEvent?.type === "finish" && lastEvent?.finishReason === "stop";
}

// ── Streaming verification helpers ──────────────────────────────────────

export interface StreamChunk {
  /** Raw bytes decoded to string */
  text: string;
  /** High-resolution timestamp when the chunk arrived */
  timestamp: number;
  /** Index of this chunk (0-based) */
  index: number;
}

export interface StreamingResult {
  /** All chunks received */
  chunks: StreamChunk[];
  /** Full concatenated text */
  fullText: string;
  /** Total number of chunks received */
  chunkCount: number;
  /** Time from first chunk to last chunk (ms) */
  totalDuration: number;
  /** All parsed SSE events from the full text */
  events: SSEEvent[];
}

/**
 * Read a streaming response body chunk-by-chunk, recording timing for each.
 * Use this instead of `body.text()` when you need to verify true streaming behavior.
 */
export async function readStreamWithTiming(
  body:
    | ReadableStream<Uint8Array>
    | { getReader(): ReadableStreamDefaultReader<Uint8Array> },
): Promise<StreamingResult> {
  const reader = (
    body as { getReader(): ReadableStreamDefaultReader<Uint8Array> }
  ).getReader();
  const decoder = new TextDecoder();
  const chunks: StreamChunk[] = [];
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    fullText += text;
    chunks.push({
      text,
      timestamp: performance.now(),
      index: chunks.length,
    });
  }

  const totalDuration =
    chunks.length > 1
      ? chunks[chunks.length - 1].timestamp - chunks[0].timestamp
      : 0;

  return {
    chunks,
    fullText,
    chunkCount: chunks.length,
    totalDuration,
    events: parseSSEStream(fullText),
  };
}

/**
 * Assert that a streaming result exhibits true incremental streaming,
 * not a single buffered response.
 */
export function assertTrueStreaming(
  result: StreamingResult,
  options?: {
    /** Minimum number of chunks expected (default: 2) */
    minChunks?: number;
    /** Minimum time spread in ms between first and last chunk (default: 50) */
    minDurationMs?: number;
    /** Minimum number of SSE events expected (default: 2) */
    minEvents?: number;
  },
) {
  const { minChunks = 2, minDurationMs = 50, minEvents = 2 } = options ?? {};

  // 1. Multiple chunks received
  if (result.chunkCount < minChunks) {
    throw new Error(
      `Expected at least ${minChunks} chunks but received ${result.chunkCount}. ` +
        `Response may be buffered, not streamed. ` +
        `Full text length: ${result.fullText.length}`,
    );
  }

  // 2. Chunks arrived over time, not all at once
  if (result.totalDuration < minDurationMs) {
    throw new Error(
      `Chunks arrived in ${result.totalDuration.toFixed(1)}ms, ` +
        `expected at least ${minDurationMs}ms spread. ` +
        `All ${result.chunkCount} chunks may have been buffered.`,
    );
  }

  // 3. SSE events are parseable
  if (result.events.length < minEvents) {
    throw new Error(
      `Expected at least ${minEvents} SSE events but parsed ${result.events.length}. ` +
        `Full text (first 200 chars): ${result.fullText.substring(0, 200)}`,
    );
  }

  // 4. Every chunk contains valid UTF-8 (no corrupted multi-byte sequences)
  for (const chunk of result.chunks) {
    if (chunk.text.includes("\uFFFD")) {
      throw new Error(
        `Chunk ${chunk.index} contains replacement character (U+FFFD), ` +
          `indicating a corrupted multi-byte sequence split across chunks.`,
      );
    }
  }
}
