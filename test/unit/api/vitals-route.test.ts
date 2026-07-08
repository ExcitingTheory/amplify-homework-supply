/**
 * Tests for /api/vitals application-level controls (A4):
 *  - 1 KB payload size cap
 *  - Metric name allow-list
 *  - Valid payload → 204
 *
 * Rate limiting is NOT tested here — it belongs at AWS WAF (CloudFront Web ACL,
 * rate-based rule) and is therefore infrastructure, not application code.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Kinesis mock ──────────────────────────────────────────────────────────────
// vi.mock() factories are hoisted before variable declarations, so the send
// function must be created with vi.hoisted() to be available inside the factory.
// KinesisClient must be a regular function (not arrow) since it's called with `new`.
const mockKinesisSend = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock("@aws-sdk/client-kinesis", () => {
  function MockKinesisClient() {
    return { send: mockKinesisSend };
  }
  // PutRecordCommand is called with `new` — must be a regular function
  function MockPutRecordCommand(this: unknown, _input: unknown) {
    // noop constructor
  }
  return {
    KinesisClient: MockKinesisClient,
    PutRecordCommand: MockPutRecordCommand,
  };
});

// ── Import after mocks are set up ─────────────────────────────────────────────
import { POST } from "../../../app/api/vitals/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("http://localhost/api/vitals", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: raw,
  }) as unknown as Request;
}

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    type: "web-vital",
    name: "LCP",
    value: 1200,
    rating: "good",
    delta: 1200,
    id: "v3-abc123",
    path: "/en/learn/unit-1",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/vitals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("returns 204 for a valid LCP payload", async () => {
    const res = await POST(makeRequest(validPayload()) as any);
    expect(res.status).toBe(204);
    expect(mockKinesisSend).toHaveBeenCalledOnce();
  });

  it("accepts all six standard metric names", async () => {
    for (const name of ["CLS", "FID", "FCP", "INP", "LCP", "TTFB"]) {
      mockKinesisSend.mockClear();
      const res = await POST(makeRequest(validPayload({ name })) as any);
      expect(res.status).toBe(204);
    }
  });

  // ── Payload size cap ────────────────────────────────────────────────────────

  it("rejects a body exceeding 1 KB", async () => {
    // Content-Length is a forbidden Fetch header in the test environment;
    // test the post-read body size guard instead.
    const large = { ...validPayload(), pad: "x".repeat(1_100) };
    const res = await POST(makeRequest(large) as any);
    expect(res.status).toBe(413);
    expect(mockKinesisSend).not.toHaveBeenCalled();
  });

  // ── Allow-list ──────────────────────────────────────────────────────────────

  it("rejects an unknown metric name", async () => {
    const res = await POST(
      makeRequest(validPayload({ name: "CUSTOM_METRIC" })) as any,
    );
    expect(res.status).toBe(400);
    expect(mockKinesisSend).not.toHaveBeenCalled();
  });

  it("rejects type !== 'web-vital'", async () => {
    const res = await POST(makeRequest(validPayload({ type: "event" })) as any);
    expect(res.status).toBe(400);
  });

  it("rejects non-numeric value", async () => {
    const res = await POST(makeRequest(validPayload({ value: "fast" })) as any);
    expect(res.status).toBe(400);
  });

  it("rejects invalid JSON", async () => {
    const res = await POST(makeRequest("{not-json}") as any);
    expect(res.status).toBe(400);
  });

  // ── Kinesis failure handling ────────────────────────────────────────────────

  it("returns 202 (not 500) when Kinesis write fails", async () => {
    mockKinesisSend.mockRejectedValueOnce(new Error("Kinesis unavailable"));
    const res = await POST(makeRequest(validPayload()) as any);
    expect(res.status).toBe(202);
  });
});
