import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROVIDER_LIMITS,
  estimateRequestTokens,
} from "../../amplify/functions/documentAnalysisWorkflow/providerRateLimiter";
import {
  ANTHROPIC_VERIFIER_MAX_OUTPUT_TOKENS,
  OPENAI_DOCUMENT_ANALYSIS_MAX_OUTPUT_TOKENS,
  OPENAI_SYNTHESIS_MAX_OUTPUT_TOKENS,
  OPENAI_VERIFIER_MAX_OUTPUT_TOKENS,
} from "../../amplify/functions/documentAnalysis/modelLimits";

describe("document-analysis request budgets", () => {
  it("uses each provider model's documented maximum output tokens", () => {
    expect(OPENAI_DOCUMENT_ANALYSIS_MAX_OUTPUT_TOKENS).toBe(16_384);
    expect(OPENAI_SYNTHESIS_MAX_OUTPUT_TOKENS).toBe(16_384);
    expect(OPENAI_VERIFIER_MAX_OUTPUT_TOKENS).toBe(16_384);
    expect(ANTHROPIC_VERIFIER_MAX_OUTPUT_TOKENS).toBe(128_000);
  });

  it("keeps bounded page extraction within the minimum provider budget", () => {
    const request = {
      model: "gpt-4o",
      max_tokens: OPENAI_DOCUMENT_ANALYSIS_MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: "Extract educational content as JSON." },
        { role: "user", content: "x".repeat(10_500) },
      ],
    };

    expect(estimateRequestTokens(request)).toBeLessThanOrEqual(300_000);
  });

  it("keeps bounded vision requests within the minimum provider budget", () => {
    const request = {
      model: "gpt-4o",
      max_tokens: OPENAI_DOCUMENT_ANALYSIS_MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: "Extract facts visible on this page." },
        {
          role: "user",
          content: [
            { type: "text", text: "x".repeat(5_250) },
            {
              type: "image_url",
              image_url: {
                url: `data:image/webp;base64,${"A".repeat(400_000)}`,
              },
            },
          ],
        },
      ],
    };

    expect(estimateRequestTokens(request)).toBeLessThanOrEqual(300_000);
  });

  it("keeps bounded synthesis and verifier requests within the minimum budget", () => {
    const synthesis = estimateRequestTokens({
      model: "gpt-4o",
      max_tokens: OPENAI_SYNTHESIS_MAX_OUTPUT_TOKENS,
      messages: [{ role: "user", content: "x".repeat(16_000) }],
    });
    const verifier = estimateRequestTokens({
      model: "gpt-4o-mini",
      max_tokens: OPENAI_VERIFIER_MAX_OUTPUT_TOKENS,
      messages: [{ role: "user", content: "x".repeat(16_000) }],
    });
    const anthropicVerifier = estimateRequestTokens({
      model: "claude-sonnet-5-5",
      max_tokens: ANTHROPIC_VERIFIER_MAX_OUTPUT_TOKENS,
      messages: [{ role: "user", content: "x".repeat(16_000) }],
    });

    expect(synthesis).toBeLessThanOrEqual(300_000);
    expect(verifier).toBeLessThanOrEqual(300_000);
    expect(anthropicVerifier).toBeLessThanOrEqual(300_000);
    expect(anthropicVerifier * 2).toBeLessThanOrEqual(
      DEFAULT_PROVIDER_LIMITS.tokensPerMinute,
    );
  });
});
