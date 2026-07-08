/**
 * Web Vitals Ingestion API Route
 *
 * Receives individual Web Vitals measurements from instrumentation-client.ts,
 * enriches with geo data from CloudFront headers, and writes to Kinesis.
 *
 * Measurements are sent via navigator.sendBeacon — Content-Type may be text/plain.
 *
 * Abuse controls:
 *  - Payload hard cap: 1 KB — a real vital record is ~200 bytes
 *  - Metric name allow-list: only the six standard web-vitals names are accepted
 *  - In-process sliding window rate limiter (IP-based, 30 req/min)
 */

import { NextRequest, NextResponse } from "next/server";
import { KinesisClient, PutRecordCommand } from "@aws-sdk/client-kinesis";

const STREAM_NAME =
  process.env.ANALYTICS_STREAM_NAME || "homework-supply-analytics";
const REGION = process.env.AWS_REGION || "us-east-1";

// ── Kinesis client ────────────────────────────────────────────────────────────

let kinesisClient: KinesisClient | null = null;

function getKinesisClient(): KinesisClient {
  if (!kinesisClient) {
    kinesisClient = new KinesisClient({ region: REGION });
  }
  return kinesisClient;
}

// ── Payload constraints ───────────────────────────────────────────────────────

/** Hard cap on raw request body size. Real web-vital payloads are ~200 bytes. */
const MAX_BODY_BYTES = 1_024; // 1 KB

/** Only the six metrics defined by the web-vitals spec are accepted. */
const ALLOWED_VITAL_NAMES = new Set([
  "CLS",
  "FID",
  "FCP",
  "INP",
  "LCP",
  "TTFB",
]);

// ── In-process sliding window rate limiter ────────────────────────────────────
//
// Each entry tracks the request count within a fixed window. The window resets
// (and the entry is overwritten) when the first request arrives after expiry.
//
// This is scoped to a single server process. In a multi-instance deployment the
// effective limit is (instances × RATE_LIMIT) per window — appropriate for a
// low-value telemetry endpoint where the goal is cost control, not strict AAA.

const RATE_LIMIT = 30; // max requests per IP per window
const RATE_WINDOW_MS = 60_000; // 60 seconds
const MAX_RATE_LIMIT_MAP_SIZE = 10_000; // evict oldest entries if map grows too large

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Returns true if the request is within the allowed rate, false if it should
 * be rejected. Automatically resets the window after RATE_WINDOW_MS.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    // New window — evict oldest entries if the map is at capacity
    if (rateLimitMap.size >= MAX_RATE_LIMIT_MAP_SIZE) {
      const oldest = rateLimitMap.keys().next().value;
      if (oldest !== undefined) rateLimitMap.delete(oldest);
    }
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface VitalPayload {
  type: "web-vital";
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  path: string;
  timestamp: string;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 1. Payload size cap ───────────────────────────────────────────────────
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  // ── 2. Rate limiting ──────────────────────────────────────────────────────
  // CloudFront-Viewer-Address is the most accurate source behind CloudFront.
  // Fall back to x-forwarded-for for local/non-CDN environments.
  const ip =
    request.headers.get("CloudFront-Viewer-Address")?.split(":")[0] ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  if (ip !== "unknown" && !checkRateLimit(ip)) {
    return new NextResponse(null, { status: 429 });
  }

  // ── 3. Parse and validate payload ─────────────────────────────────────────
  let vital: VitalPayload;
  try {
    const body = await request.text();
    // Double-check body length after read (Content-Length can be spoofed)
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 413 });
    }
    vital = JSON.parse(body);
    if (
      vital.type !== "web-vital" ||
      !vital.name ||
      !ALLOWED_VITAL_NAMES.has(vital.name) ||
      vital.value == null ||
      typeof vital.value !== "number"
    ) {
      return NextResponse.json({ error: "Invalid vital" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 4. Enrich with geo from CloudFront headers ────────────────────────────
  const geo = {
    country: request.headers.get("CloudFront-Viewer-Country") || "unknown",
    region:
      request.headers.get("CloudFront-Viewer-Country-Region-Name") || undefined,
    city: request.headers.get("CloudFront-Viewer-City") || undefined,
    timezone: request.headers.get("CloudFront-Viewer-Time-Zone") || undefined,
  };

  const enrichedVital = { ...vital, geo };

  // ── 5. Write to Kinesis ───────────────────────────────────────────────────
  try {
    const client = getKinesisClient();
    await client.send(
      new PutRecordCommand({
        StreamName: STREAM_NAME,
        Data: Buffer.from(JSON.stringify(enrichedVital)),
        PartitionKey: vital.path || "/",
      }),
    );
  } catch (err) {
    // Log a sample of errors (avoid flooding CloudWatch on sustained failures)
    if (Math.random() < 0.1) {
      console.error("[Vitals API] Kinesis write failed (sampled 10%):", err);
    }
    // Return 202 so sendBeacon doesn't retry — we accept data loss over retry storms
    return new NextResponse(null, { status: 202 });
  }

  return new NextResponse(null, { status: 204 });
}
