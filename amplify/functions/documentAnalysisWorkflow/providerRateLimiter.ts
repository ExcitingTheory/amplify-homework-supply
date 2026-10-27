import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "node:crypto";

export type ModelProvider = "openai" | "anthropic";

export interface ProviderLimits {
  requestsPerMinute: number;
  tokensPerMinute: number;
  maxConcurrentRequests: number;
}

export const DEFAULT_PROVIDER_LIMITS: ProviderLimits = {
  requestsPerMinute: 10,
  tokensPerMinute: 300_000,
  maxConcurrentRequests: 1,
};

const DEMO_PROVIDER_LIMITS: ProviderLimits = {
  ...DEFAULT_PROVIDER_LIMITS,
};

const DEFAULT_OUTPUT_TOKEN_RESERVE = 2048;
const MIN_REQUEST_TOKEN_BUDGET = 270_000;
const LEASE_TTL_SECONDS = 20 * 60;
const MAX_CAS_ATTEMPTS = 10;
const MAX_CONCURRENT_REQUEST_LIMIT = 100;

const SETTINGS_FIELDS: Record<
  ModelProvider,
  Record<keyof ProviderLimits, string>
> = {
  openai: {
    requestsPerMinute: "documentAnalysisOpenAiRequestsPerMinute",
    tokensPerMinute: "documentAnalysisOpenAiTokensPerMinute",
    maxConcurrentRequests: "documentAnalysisOpenAiMaxConcurrentRequests",
  },
  anthropic: {
    requestsPerMinute: "documentAnalysisAnthropicRequestsPerMinute",
    tokensPerMinute: "documentAnalysisAnthropicTokensPerMinute",
    maxConcurrentRequests:
      "documentAnalysisAnthropicMaxConcurrentRequests",
  },
};

export class ProviderLimitError extends Error {
  readonly providerLimitError = true;

  constructor(message: string) {
    super(message);
    this.name = "ProviderLimitError";
  }
}

export function resolveProviderLimits(
  provider: ModelProvider,
  settings: Record<string, unknown>,
  demoMode: boolean,
): ProviderLimits {
  const defaults = DEFAULT_PROVIDER_LIMITS;
  const configured = {} as ProviderLimits;

  for (const key of Object.keys(defaults) as Array<keyof ProviderLimits>) {
    const rawValue = settings[SETTINGS_FIELDS[provider][key]];
    if (rawValue == null) {
      configured[key] = defaults[key];
      continue;
    }
    if (
      typeof rawValue !== "number" ||
      !Number.isSafeInteger(rawValue) ||
      rawValue <= 0 ||
      (key === "tokensPerMinute" && rawValue < MIN_REQUEST_TOKEN_BUDGET) ||
      (key === "maxConcurrentRequests" &&
        rawValue > MAX_CONCURRENT_REQUEST_LIMIT)
    ) {
      let message = `Invalid ${provider} document analysis limit: ${key}`;
      if (key === "tokensPerMinute" && typeof rawValue === "number") {
        message = `${provider} document analysis token budget must be at least ${MIN_REQUEST_TOKEN_BUDGET}`;
      }
      throw new ProviderLimitError(message);
    }
    configured[key] = rawValue;
  }

  if (!demoMode) return configured;
  return {
    requestsPerMinute: Math.min(
      configured.requestsPerMinute,
      DEMO_PROVIDER_LIMITS.requestsPerMinute,
    ),
    tokensPerMinute: Math.min(
      configured.tokensPerMinute,
      DEMO_PROVIDER_LIMITS.tokensPerMinute,
    ),
    maxConcurrentRequests: Math.min(
      configured.maxConcurrentRequests,
      DEMO_PROVIDER_LIMITS.maxConcurrentRequests,
    ),
  };
}

/**
 * Providers bill an image by its dimensions, not by its encoded size, so an
 * inline base64 image must not be counted as text. This is roughly what a
 * full-page image costs at the resolutions the vision pass sends.
 */
const IMAGE_TOKEN_ESTIMATE = 1500;
const INLINE_IMAGE_PATTERN = /data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi;

export function estimateRequestTokens(
  request: unknown,
  defaultOutputTokens = DEFAULT_OUTPUT_TOKEN_RESERVE,
): number {
  let serialized: string;
  try {
    serialized = JSON.stringify(request) ?? String(request);
  } catch {
    throw new ProviderLimitError("Unable to estimate model request tokens");
  }

  let imageTokens = 0;
  serialized = serialized.replace(INLINE_IMAGE_PATTERN, () => {
    imageTokens += IMAGE_TOKEN_ESTIMATE;
    return "";
  });

  const record =
    request !== null && typeof request === "object"
      ? (request as Record<string, unknown>)
      : undefined;
  const requestedOutput =
    record?.max_tokens ??
    record?.max_completion_tokens ??
    record?.max_output_tokens;
  let outputTokens = defaultOutputTokens;
  if (requestedOutput !== undefined) {
    if (
      typeof requestedOutput !== "number" ||
      !Number.isSafeInteger(requestedOutput) ||
      requestedOutput < 0
    ) {
      throw new ProviderLimitError(
        "Invalid maximum output token count in model request",
      );
    }
    outputTokens = requestedOutput;
  }

  return Math.max(
    1,
    Math.ceil(Buffer.byteLength(serialized, "utf8") / 4) +
      imageTokens +
      outputTokens,
  );
}

export function readActualTokenUsage(result: unknown): number | undefined {
  if (result === null || typeof result !== "object") return undefined;
  const usage = (result as { usage?: unknown }).usage;
  if (usage === null || typeof usage !== "object") return undefined;

  const values = usage as Record<string, unknown>;
  const total = values.total_tokens ?? values.totalTokens;
  if (typeof total === "number" && Number.isFinite(total) && total >= 0) {
    return Math.ceil(total);
  }

  const input = values.input_tokens ?? values.prompt_tokens;
  const output = values.output_tokens ?? values.completion_tokens;
  if (
    typeof input === "number" &&
    Number.isFinite(input) &&
    input >= 0 &&
    typeof output === "number" &&
    Number.isFinite(output) &&
    output >= 0
  ) {
    return Math.ceil(input + output);
  }
  return undefined;
}

export interface ReservationResult {
  allowed: boolean;
  retryAfterMs: number;
}

export interface ProviderRateLimitStore {
  tryAcquireLease(
    provider: ModelProvider,
    leaseId: string,
    maxConcurrentRequests: number,
    now: number,
  ): Promise<number | undefined>;
  releaseLease(
    provider: ModelProvider,
    slot: number,
    leaseId: string,
  ): Promise<void>;
  tryReserve(
    provider: ModelProvider,
    limits: ProviderLimits,
    estimatedTokens: number,
    now: number,
  ): Promise<ReservationResult>;
  adjustTokens(
    provider: ModelProvider,
    limits: ProviderLimits,
    tokenDelta: number,
    now: number,
  ): Promise<void>;
}

function isConditionalFailure(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "ConditionalCheckFailedException"
  );
}

function readNumber(
  item: Record<string, { N?: string } | undefined> | undefined,
  key: string,
): number | undefined {
  const value = item?.[key]?.N;
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class DynamoProviderRateLimitStore
  implements ProviderRateLimitStore
{
  constructor(
    private readonly tableName: string,
    private readonly client = new DynamoDBClient({}),
  ) {
    if (!tableName) {
      throw new ProviderLimitError(
        "DOCUMENT_ANALYSIS_LIMITER_TABLE is not configured",
      );
    }
  }

  async tryAcquireLease(
    provider: ModelProvider,
    leaseId: string,
    maxConcurrentRequests: number,
    now: number,
  ): Promise<number | undefined> {
    const nowSeconds = Math.floor(now / 1000);
    const expiresAt = nowSeconds + LEASE_TTL_SECONDS;

    for (let slot = 0; slot < maxConcurrentRequests; slot += 1) {
      try {
        await this.client.send(
          new UpdateItemCommand({
            TableName: this.tableName,
            Key: { id: { S: `${provider}#slot#${slot}` } },
            UpdateExpression: "SET #leaseId = :leaseId, #expiresAt = :expiresAt",
            ConditionExpression:
              "attribute_not_exists(#expiresAt) OR #expiresAt <= :now",
            ExpressionAttributeNames: {
              "#leaseId": "leaseId",
              "#expiresAt": "expiresAt",
            },
            ExpressionAttributeValues: {
              ":leaseId": { S: leaseId },
              ":expiresAt": { N: String(expiresAt) },
              ":now": { N: String(nowSeconds) },
            },
          }),
        );
        return slot;
      } catch (error) {
        if (!isConditionalFailure(error)) throw error;
      }
    }

    return undefined;
  }

  async releaseLease(
    provider: ModelProvider,
    slot: number,
    leaseId: string,
  ): Promise<void> {
    try {
      await this.client.send(
        new UpdateItemCommand({
          TableName: this.tableName,
          Key: { id: { S: `${provider}#slot#${slot}` } },
          UpdateExpression: "REMOVE #leaseId, #expiresAt",
          ConditionExpression: "#leaseId = :leaseId",
          ExpressionAttributeNames: {
            "#leaseId": "leaseId",
            "#expiresAt": "expiresAt",
          },
          ExpressionAttributeValues: {
            ":leaseId": { S: leaseId },
          },
        }),
      );
    } catch (error) {
      if (!isConditionalFailure(error)) throw error;
    }
  }

  async tryReserve(
    provider: ModelProvider,
    limits: ProviderLimits,
    estimatedTokens: number,
    now: number,
  ): Promise<ReservationResult> {
    if (estimatedTokens > limits.tokensPerMinute) {
      throw new ProviderLimitError(
        `Estimated ${provider} request size exceeds its tokens-per-minute limit`,
      );
    }

    const id = `${provider}#bucket`;
    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
      const { Item } = await this.client.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: { id: { S: id } },
          ConsistentRead: true,
        }),
      );

      const revision = readNumber(Item, "revision");
      if (Item && revision === undefined) {
        throw new ProviderLimitError(
          `Invalid ${provider} shared rate-limit state`,
        );
      }
      const lastUpdatedAt = readNumber(Item, "updatedAt") ?? now;
      const elapsedMs = Math.max(0, now - lastUpdatedAt);
      const requests = Math.min(
        limits.requestsPerMinute,
        (readNumber(Item, "requestTokens") ?? limits.requestsPerMinute) +
          (elapsedMs * limits.requestsPerMinute) / 60_000,
      );
      const tokens = Math.min(
        limits.tokensPerMinute,
        (readNumber(Item, "tokenTokens") ?? limits.tokensPerMinute) +
          (elapsedMs * limits.tokensPerMinute) / 60_000,
      );

      if (requests < 1 || tokens < estimatedTokens) {
        const requestWait = requests < 1
          ? ((1 - requests) * 60_000) / limits.requestsPerMinute
          : 0;
        const tokenWait = tokens < estimatedTokens
          ? ((estimatedTokens - tokens) * 60_000) / limits.tokensPerMinute
          : 0;
        return {
          allowed: false,
          retryAfterMs: Math.ceil(Math.max(requestWait, tokenWait)),
        };
      }

      const updatedAt = Math.max(lastUpdatedAt, now);
      try {
        await this.client.send(
          new UpdateItemCommand({
            TableName: this.tableName,
            Key: { id: { S: id } },
            UpdateExpression:
              "SET #requests = :requests, #tokens = :tokens, #updatedAt = :updatedAt, #revision = :nextRevision",
            ConditionExpression:
              revision === undefined
                ? "attribute_not_exists(#revision)"
                : "#revision = :revision",
            ExpressionAttributeNames: {
              "#requests": "requestTokens",
              "#tokens": "tokenTokens",
              "#updatedAt": "updatedAt",
              "#revision": "revision",
            },
            ExpressionAttributeValues: {
              ":requests": { N: String(requests - 1) },
              ":tokens": { N: String(tokens - estimatedTokens) },
              ":updatedAt": { N: String(updatedAt) },
              ":nextRevision": { N: String((revision ?? 0) + 1) },
              ...(revision === undefined
                ? {}
                : { ":revision": { N: String(revision) } }),
            },
          }),
        );
        return { allowed: true, retryAfterMs: 0 };
      } catch (error) {
        if (!isConditionalFailure(error)) throw error;
      }
    }

    return { allowed: false, retryAfterMs: 100 };
  }

  async adjustTokens(
    provider: ModelProvider,
    limits: ProviderLimits,
    tokenDelta: number,
    now: number,
  ): Promise<void> {
    if (tokenDelta === 0) return;

    const id = `${provider}#bucket`;
    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
      const { Item } = await this.client.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: { id: { S: id } },
          ConsistentRead: true,
        }),
      );
      const revision = readNumber(Item, "revision");
      const lastUpdatedAt = readNumber(Item, "updatedAt");
      const currentTokens = readNumber(Item, "tokenTokens");
      const currentRequests = readNumber(Item, "requestTokens");
      if (
        revision === undefined ||
        lastUpdatedAt === undefined ||
        currentTokens === undefined ||
        currentRequests === undefined
      ) {
        throw new ProviderLimitError(
          `Missing ${provider} shared rate-limit state during token reconciliation`,
        );
      }

      const elapsedMs = Math.max(0, now - lastUpdatedAt);
      const tokens = Math.min(
        limits.tokensPerMinute,
        currentTokens +
          (elapsedMs * limits.tokensPerMinute) / 60_000 +
          tokenDelta,
      );
      const requests = Math.min(
        limits.requestsPerMinute,
        currentRequests +
          (elapsedMs * limits.requestsPerMinute) / 60_000,
      );
      const updatedAt = Math.max(lastUpdatedAt, now);

      try {
        await this.client.send(
          new UpdateItemCommand({
            TableName: this.tableName,
            Key: { id: { S: id } },
            UpdateExpression:
              "SET #requests = :requests, #tokens = :tokens, #updatedAt = :updatedAt, #revision = :nextRevision",
            ConditionExpression: "#revision = :revision",
            ExpressionAttributeNames: {
              "#requests": "requestTokens",
              "#tokens": "tokenTokens",
              "#updatedAt": "updatedAt",
              "#revision": "revision",
            },
            ExpressionAttributeValues: {
              ":requests": { N: String(requests) },
              ":tokens": { N: String(tokens) },
              ":updatedAt": { N: String(updatedAt) },
              ":revision": { N: String(revision) },
              ":nextRevision": { N: String(revision + 1) },
            },
          }),
        );
        return;
      } catch (error) {
        if (!isConditionalFailure(error)) throw error;
      }
    }

    throw new ProviderLimitError(
      `Unable to reconcile ${provider} token usage`,
    );
  }
}

export interface ProviderRateLimitOptions<T> {
  provider: ModelProvider;
  limits: ProviderLimits;
  estimatedTokens: number;
  store: ProviderRateLimitStore;
  assertRunActive: () => Promise<void>;
  execute: () => Promise<T>;
  getActualTokens?: (result: T) => number | undefined;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  maxWaitMs?: number;
  pollIntervalMs?: number;
}

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function withProviderRateLimit<T>(
  options: ProviderRateLimitOptions<T>,
): Promise<T> {
  const now = options.now ?? Date.now;
  const pause = options.sleep ?? sleep;
  const maxWaitMs = options.maxWaitMs ?? 120_000;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const startedAt = now();
  let lastActiveCheckAt = Number.NEGATIVE_INFINITY;

  if (
    !Number.isSafeInteger(options.estimatedTokens) ||
    options.estimatedTokens <= 0
  ) {
    throw new ProviderLimitError("Estimated request token count is invalid");
  }
  if (options.estimatedTokens > options.limits.tokensPerMinute) {
    throw new ProviderLimitError(
      `Estimated ${options.provider} request size exceeds its tokens-per-minute limit`,
    );
  }

  while (now() - startedAt < maxWaitMs) {
    if (now() - lastActiveCheckAt >= 5_000) {
      try {
        await options.assertRunActive();
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "analysis run is inactive";
        throw new ProviderLimitError(
          `Provider request stopped because ${reason}`,
        );
      }
      lastActiveCheckAt = now();
    }

    const leaseId = randomUUID();
    const slot = await options.store.tryAcquireLease(
      options.provider,
      leaseId,
      options.limits.maxConcurrentRequests,
      now(),
    );
    let waitMs = pollIntervalMs;

    if (slot !== undefined) {
      try {
        const reservation = await options.store.tryReserve(
          options.provider,
          options.limits,
          options.estimatedTokens,
          now(),
        );
        if (reservation.allowed) {
          const result = await options.execute();
          const actualTokens = options.getActualTokens?.(result);
          if (
            actualTokens !== undefined &&
            Number.isSafeInteger(actualTokens) &&
            actualTokens >= 0
          ) {
            await options.store.adjustTokens(
              options.provider,
              options.limits,
              options.estimatedTokens - actualTokens,
              now(),
            );
          }
          return result;
        }
        waitMs = Math.max(100, reservation.retryAfterMs);
      } finally {
        await options.store.releaseLease(
          options.provider,
          slot,
          leaseId,
        );
      }
    }

    const remainingMs = maxWaitMs - (now() - startedAt);
    if (remainingMs <= 0) break;
    await pause(Math.min(Math.max(waitMs, 100), remainingMs));
  }

  throw new ProviderLimitError(
    `Timed out waiting for a shared ${options.provider} model request limit`,
  );
}
