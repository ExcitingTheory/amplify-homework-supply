import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PROVIDER_LIMITS,
  ProviderLimitError,
  type ModelProvider,
  type ProviderLimits,
  type ProviderRateLimitStore,
  type ReservationResult,
  estimateRequestTokens,
  readActualTokenUsage,
  resolveProviderLimits,
  withProviderRateLimit,
} from "../../amplify/functions/documentAnalysisWorkflow/providerRateLimiter";

class MemoryRateLimitStore implements ProviderRateLimitStore {
  readonly leases = new Set<string>();
  readonly tokenAdjustments: number[] = [];
  reservation: ReservationResult = { allowed: true, retryAfterMs: 0 };
  releases = 0;

  async tryAcquireLease(
    provider: ModelProvider,
    _leaseId: string,
    _maxConcurrentRequests: number,
    _now: number,
  ): Promise<number | undefined> {
    if (this.leases.has(provider)) return undefined;
    this.leases.add(provider);
    return 0;
  }

  async releaseLease(
    provider: ModelProvider,
    _slot: number,
    _leaseId: string,
  ): Promise<void> {
    this.leases.delete(provider);
    this.releases += 1;
  }

  async tryReserve(
    _provider: ModelProvider,
    _limits: ProviderLimits,
    _estimatedTokens: number,
    _now: number,
  ): Promise<ReservationResult> {
    return this.reservation;
  }

  async adjustTokens(
    _provider: ModelProvider,
    _limits: ProviderLimits,
    tokenDelta: number,
    _now: number,
  ): Promise<void> {
    this.tokenAdjustments.push(tokenDelta);
  }
}

describe("document-analysis provider rate limits", () => {
  it("uses conservative defaults and caps demo settings at those values", () => {
    expect(DEFAULT_PROVIDER_LIMITS).toEqual({
      requestsPerMinute: 10,
      tokensPerMinute: 300_000,
      maxConcurrentRequests: 1,
    });
    expect(
      resolveProviderLimits("openai", {}, false),
    ).toEqual(DEFAULT_PROVIDER_LIMITS);
    expect(
      resolveProviderLimits(
        "anthropic",
        {
          documentAnalysisAnthropicRequestsPerMinute: 100,
          documentAnalysisAnthropicTokensPerMinute: 500_000,
          documentAnalysisAnthropicMaxConcurrentRequests: 20,
        },
        true,
      ),
    ).toEqual(DEFAULT_PROVIDER_LIMITS);
  });

  it("rejects invalid configured limits", () => {
    expect(() =>
      resolveProviderLimits(
        "openai",
        { documentAnalysisOpenAiTokensPerMinute: 0 },
        false,
      ),
    ).toThrow(ProviderLimitError);
    expect(() =>
      resolveProviderLimits(
        "anthropic",
        { documentAnalysisAnthropicTokensPerMinute: 269_999 },
        false,
      ),
    ).toThrow(/at least 270000/);
    expect(
      resolveProviderLimits(
        "openai",
        {
          documentAnalysisOpenAiRequestsPerMinute: 1,
          documentAnalysisOpenAiTokensPerMinute: 300_000,
        },
        false,
      ),
    ).toMatchObject({ requestsPerMinute: 1 });
    expect(
      resolveProviderLimits(
        "anthropic",
        {
          documentAnalysisAnthropicRequestsPerMinute: 2,
          documentAnalysisAnthropicTokensPerMinute: 270_000,
        },
        false,
      ),
    ).toMatchObject({ requestsPerMinute: 2, tokensPerMinute: 270_000 });
    expect(() =>
      resolveProviderLimits(
        "openai",
        { documentAnalysisOpenAiMaxConcurrentRequests: 101 },
        false,
      ),
    ).toThrow(ProviderLimitError);
  });

  it("estimates request tokens including the requested output reserve", () => {
    const estimate = estimateRequestTokens({
      messages: [{ role: "user", content: "a".repeat(4000) }],
      max_tokens: 250,
    });

    expect(estimate).toBeGreaterThan(1_200);
    expect(readActualTokenUsage({ usage: { total_tokens: 19 } })).toBe(19);
    expect(
      readActualTokenUsage({
        usage: { input_tokens: 12, output_tokens: 7 },
      }),
    ).toBe(19);
    expect(readActualTokenUsage({})).toBeUndefined();
  });

  it("estimates an inline image by a fixed cost rather than its encoded size", () => {
    const base64 = "A".repeat(400_000);
    const withImage = estimateRequestTokens({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Read this page" },
            {
              type: "image_url",
              image_url: { url: `data:image/webp;base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    expect(withImage).toBeGreaterThan(1_500);
    expect(withImage).toBeLessThan(2_000);
  });

  it("keeps concurrent requests within the shared lease cap and reconciles tokens", async () => {
    const store = new MemoryRateLimitStore();
    let active = 0;
    let maximumActive = 0;
    const execute = async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return { usage: { total_tokens: 6 } };
    };
    const run = () =>
      withProviderRateLimit({
        provider: "openai",
        limits: DEFAULT_PROVIDER_LIMITS,
        estimatedTokens: 10,
        store,
        assertRunActive: async () => {},
        execute,
        getActualTokens: readActualTokenUsage,
        pollIntervalMs: 2,
        maxWaitMs: 500,
      });

    await Promise.all([run(), run()]);

    expect(maximumActive).toBe(1);
    expect(store.releases).toBe(2);
    expect(store.tokenAdjustments).toEqual([4, 4]);
  });

  it("fails closed after a bounded quota wait without invoking the provider", async () => {
    const store = new MemoryRateLimitStore();
    store.reservation = { allowed: false, retryAfterMs: 1 };
    let clock = 0;
    const execute = vi.fn(async () => "unexpected");

    await expect(
      withProviderRateLimit({
        provider: "anthropic",
        limits: DEFAULT_PROVIDER_LIMITS,
        estimatedTokens: 10,
        store,
        assertRunActive: async () => {},
        execute,
        now: () => clock,
        sleep: async (milliseconds) => {
          clock += milliseconds;
        },
        maxWaitMs: 20,
        pollIntervalMs: 5,
      }),
    ).rejects.toThrow(ProviderLimitError);

    expect(execute).not.toHaveBeenCalled();
    expect(store.releases).toBe(1);
    expect(store.leases.size).toBe(0);
  });

  it("releases a concurrency lease when the provider call fails", async () => {
    const store = new MemoryRateLimitStore();

    await expect(
      withProviderRateLimit({
        provider: "openai",
        limits: DEFAULT_PROVIDER_LIMITS,
        estimatedTokens: 10,
        store,
        assertRunActive: async () => {},
        execute: async () => {
          throw new Error("provider failed");
        },
      }),
    ).rejects.toThrow("provider failed");

    expect(store.leases.size).toBe(0);
    expect(store.releases).toBe(1);
  });
});
