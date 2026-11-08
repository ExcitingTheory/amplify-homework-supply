// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@serwist/next/worker", () => ({ defaultCache: [] }));
vi.mock("serwist", () => {
  class Strategy {
    addEventListeners() {}
  }
  return {
    CacheFirst: Strategy,
    ExpirationPlugin: Strategy,
    CacheableResponsePlugin: Strategy,
    NetworkFirst: Strategy,
    StaleWhileRevalidate: Strategy,
    Serwist: Strategy,
  };
});

describe("service worker request routing", () => {
  let fetchHandler: (event: { request: Request; respondWith: ReturnType<typeof vi.fn> }) => void;
  let activateHandler: (event: { waitUntil: ReturnType<typeof vi.fn> }) => void;
  const cachedResponse = new Response("cached media");
  const cacheMatch = vi.fn();
  const cacheDelete = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    cacheMatch.mockResolvedValue(cachedResponse);
    cacheDelete.mockResolvedValue(true);
    vi.stubGlobal("self", {
      addEventListener(type: string, handler: typeof fetchHandler & typeof activateHandler) {
        if (type === "fetch") fetchHandler = handler;
        if (type === "activate") activateHandler = handler;
      },
    });
    vi.stubGlobal("caches", { match: cacheMatch, delete: cacheDelete });
    await import("../../src/sw");
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["POST", "https://bucket.s3.us-east-1.amazonaws.com/file"],
    ["POST", "https://example.appsync-api.us-east-1.amazonaws.com/graphql"],
    ["GET", "https://example.appsync-api.us-east-1.amazonaws.com/graphql"],
    ["GET", "https://cognito-idp.us-east-1.amazonaws.com/"],
    ["GET", "https://example.execute-api.us-east-1.amazonaws.com/"],
    ["GET", "https://bucket.s3.amazonaws.com.attacker.test/file"],
  ])("does not media-cache %s %s", (method, url) => {
    const respondWith = vi.fn();
    fetchHandler({ request: new Request(url, { method }), respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    expect(cacheMatch).not.toHaveBeenCalled();
  });

  it.each([
    "https://bucket.s3.us-east-1.amazonaws.com/audio.mp3?signature=first",
    "https://s3.amazonaws.com/bucket/audio.mp3?signature=second",
    "https://bucket.s3-us-west-2.amazonaws.com/audio.mp3",
    "https://bucket.s3.cn-north-1.amazonaws.com.cn/audio.mp3",
  ])("retains path-keyed media caching for %s", async (url) => {
    const respondWith = vi.fn();
    fetchHandler({ request: new Request(url), respondWith });
    expect(respondWith).toHaveBeenCalledOnce();
    expect(await respondWith.mock.calls[0][0]).toBe(cachedResponse);
    const parsed = new URL(url);
    expect(cacheMatch).toHaveBeenCalledWith(`${parsed.origin}${parsed.pathname}`);
  });

  it("removes the legacy cache containing unsafe responses on activation", async () => {
    const waitUntil = vi.fn();
    activateHandler({ waitUntil });
    await waitUntil.mock.calls[0][0];
    expect(cacheDelete).toHaveBeenCalledWith("s3-media-v2");
  });
});
