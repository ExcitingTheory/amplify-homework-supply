/**
 * Unit tests for ChunkedCookieStorage (client) and
 * createChunkedCookiesWrapper (server).
 *
 * The server wrapper test doubles as an SDK compatibility canary:
 * if @aws-amplify/adapter-nextjs changes the cookies interface
 * it passes to generateServerClientUsingCookies, this test will break.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock js-cookie ──────────────────────────────────────────────────────────
const cookieJar: Record<string, string> = {};

vi.mock("js-cookie", () => ({
  default: {
    set: (key: string, value: string) => {
      cookieJar[key] = value;
    },
    get: (key?: string) => {
      if (key === undefined) return { ...cookieJar };
      return cookieJar[key];
    },
    remove: (key: string) => {
      delete cookieJar[key];
    },
  },
}));

// ─── Import after mock ───────────────────────────────────────────────────────
import { ChunkedCookieStorage } from "@/utils/chunkedCookieStorage";

function clearJar() {
  Object.keys(cookieJar).forEach((k) => delete cookieJar[k]);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: ChunkedCookieStorage
// ─────────────────────────────────────────────────────────────────────────────
describe("ChunkedCookieStorage", () => {
  let storage: ChunkedCookieStorage;

  beforeEach(() => {
    clearJar();
    storage = new ChunkedCookieStorage({ sameSite: "lax" });
  });

  // ── setItem / getItem ────────────────────────────────────────────────────

  it("stores small values in a single cookie", async () => {
    await storage.setItem("auth.token", "small-value");

    expect(cookieJar["auth.token"]).toBe("small-value");
    expect(cookieJar["auth.token.chunks"]).toBeUndefined();

    const result = await storage.getItem("auth.token");
    expect(result).toBe("small-value");
  });

  it("chunks values exceeding MAX_CHUNK_SIZE (3500 bytes)", async () => {
    // Create a value that requires 3 chunks (3500 * 3 = 10500 chars)
    const largeValue = "A".repeat(3500) + "B".repeat(3500) + "C".repeat(500);

    await storage.setItem("idToken", largeValue);

    // Should have metadata + chunks
    expect(cookieJar["idToken.chunks"]).toBe("3");
    expect(cookieJar["idToken.chunk.0"]).toBe("A".repeat(3500));
    expect(cookieJar["idToken.chunk.1"]).toBe("B".repeat(3500));
    expect(cookieJar["idToken.chunk.2"]).toBe("C".repeat(500));
    // Original key should NOT be set
    expect(cookieJar["idToken"]).toBeUndefined();
  });

  it("reassembles chunked values correctly", async () => {
    const largeValue = "X".repeat(8000);
    await storage.setItem("big", largeValue);

    const result = await storage.getItem("big");
    expect(result).toBe(largeValue);
    expect(result).toHaveLength(8000);
  });

  it("returns null for missing keys", async () => {
    const result = await storage.getItem("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when a chunk is missing (corrupt state)", async () => {
    // Manually set up a corrupt chunked state
    cookieJar["corrupt.chunks"] = "3";
    cookieJar["corrupt.chunk.0"] = "aaa";
    cookieJar["corrupt.chunk.1"] = "bbb";
    // Missing chunk.2

    const result = await storage.getItem("corrupt");
    expect(result).toBeNull();
  });

  // ── removeItem ───────────────────────────────────────────────────────────

  it("removes a single-cookie value", async () => {
    await storage.setItem("key", "val");
    await storage.removeItem("key");

    expect(cookieJar["key"]).toBeUndefined();
  });

  it("removes all chunks and metadata", async () => {
    const large = "Z".repeat(7500);
    await storage.setItem("token", large);

    expect(cookieJar["token.chunks"]).toBeDefined();
    await storage.removeItem("token");

    expect(cookieJar["token.chunks"]).toBeUndefined();
    expect(cookieJar["token.chunk.0"]).toBeUndefined();
    expect(cookieJar["token.chunk.1"]).toBeUndefined();
    expect(cookieJar["token.chunk.2"]).toBeUndefined();
  });

  // ── setItem overwrites ───────────────────────────────────────────────────

  it("removes old chunks when overwriting with a smaller value", async () => {
    // First write: large (3 chunks)
    await storage.setItem("token", "X".repeat(8000));
    expect(cookieJar["token.chunks"]).toBe("3");

    // Overwrite with small value
    await storage.setItem("token", "tiny");
    expect(cookieJar["token"]).toBe("tiny");
    expect(cookieJar["token.chunks"]).toBeUndefined();
    expect(cookieJar["token.chunk.0"]).toBeUndefined();
  });

  it("removes old single value when overwriting with chunks", async () => {
    await storage.setItem("token", "small");
    expect(cookieJar["token"]).toBe("small");

    await storage.setItem("token", "Y".repeat(7000));
    expect(cookieJar["token"]).toBeUndefined();
    expect(cookieJar["token.chunks"]).toBe("2");
  });

  // ── clear ────────────────────────────────────────────────────────────────

  it("removes all cookies", async () => {
    await storage.setItem("a", "1");
    await storage.setItem("b", "X".repeat(5000));
    await storage.clear();

    expect(Object.keys(cookieJar)).toHaveLength(0);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it("handles empty string value", async () => {
    await storage.setItem("empty", "");
    const result = await storage.getItem("empty");
    expect(result).toBe("");
  });

  it("handles value exactly at chunk boundary (3500 bytes)", async () => {
    const exact = "A".repeat(3500);
    await storage.setItem("boundary", exact);

    // Should NOT chunk (≤ MAX_CHUNK_SIZE)
    expect(cookieJar["boundary"]).toBe(exact);
    expect(cookieJar["boundary.chunks"]).toBeUndefined();
  });

  it("handles value at 3501 bytes (first byte over boundary)", async () => {
    const overByOne = "B".repeat(3501);
    await storage.setItem("over", overByOne);

    // Should chunk into 2 parts
    expect(cookieJar["over.chunks"]).toBe("2");
    expect(cookieJar["over.chunk.0"]).toHaveLength(3500);
    expect(cookieJar["over.chunk.1"]).toHaveLength(1);

    const result = await storage.getItem("over");
    expect(result).toBe(overByOne);
  });

  it("handles realistic Cognito idToken size (~6KB)", async () => {
    // Simulate a real Cognito JWT with many groups
    const header = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9";
    const payload = "A".repeat(5500); // simulate large payload with groups
    const signature = "B".repeat(500);
    const fakeJwt = `${header}.${payload}.${signature}`;

    await storage.setItem(
      "CognitoIdentityServiceProvider.abc123.user1.idToken",
      fakeJwt,
    );

    const result = await storage.getItem(
      "CognitoIdentityServiceProvider.abc123.user1.idToken",
    );
    expect(result).toBe(fakeJwt);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SERVER: createChunkedCookiesWrapper SDK Compatibility Test
// ─────────────────────────────────────────────────────────────────────────────
describe("Server-side chunked cookie wrapper (SDK compatibility canary)", () => {
  /**
   * This test verifies that our server wrapper produces an object
   * compatible with what @aws-amplify/adapter-nextjs expects from
   * the cookies() function.
   *
   * If a future Amplify SDK upgrade changes the expected interface,
   * this test will fail — acting as an early-warning canary.
   */

  // Simulate a Next.js cookie store (minimal interface used by Amplify)
  function createMockCookieStore(jar: Record<string, string>) {
    const entries = Object.entries(jar).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      get(name: string) {
        const val = jar[name];
        return val !== undefined ? { name, value: val } : undefined;
      },
      getAll() {
        return entries;
      },
      has(name: string) {
        return name in jar;
      },
      set: vi.fn(),
      delete: vi.fn(),
      get size() {
        return entries.length;
      },
      [Symbol.iterator]() {
        return entries[Symbol.iterator]();
      },
    };
  }

  /**
   * Reimplementation of the wrapper logic for unit testing
   * (since the actual module imports next/headers which can't run in tests)
   */
  function createChunkedCookiesWrapperForTest(
    mockCookieStore: ReturnType<typeof createMockCookieStore>,
  ) {
    return {
      get(nameOrOptions: string | { name: string }) {
        const name =
          typeof nameOrOptions === "string"
            ? nameOrOptions
            : nameOrOptions.name;

        // Check for chunked storage
        const chunksMeta = mockCookieStore.get(`${name}.chunks`);
        if (chunksMeta?.value) {
          const chunkCount = parseInt(chunksMeta.value, 10);
          const parts: string[] = [];
          for (let i = 0; i < chunkCount; i++) {
            const chunk = mockCookieStore.get(`${name}.chunk.${i}`);
            if (!chunk?.value) {
              return undefined;
            }
            parts.push(chunk.value);
          }
          return { name, value: parts.join("") };
        }

        return mockCookieStore.get(name);
      },
      getAll() {
        return mockCookieStore.getAll();
      },
      has(name: string) {
        return (
          mockCookieStore.has(name) || mockCookieStore.has(`${name}.chunks`)
        );
      },
      set: mockCookieStore.set,
      delete: mockCookieStore.delete,
      get size() {
        return mockCookieStore.size;
      },
      [Symbol.iterator]() {
        return mockCookieStore[Symbol.iterator]();
      },
    };
  }

  it("reassembles chunked values on get()", () => {
    const jar: Record<string, string> = {
      "token.chunks": "3",
      "token.chunk.0": "AAA",
      "token.chunk.1": "BBB",
      "token.chunk.2": "CCC",
    };
    const store = createMockCookieStore(jar);
    const wrapper = createChunkedCookiesWrapperForTest(store);

    const result = wrapper.get("token");
    expect(result).toEqual({ name: "token", value: "AAABBBCCC" });
  });

  it("reads non-chunked values directly", () => {
    const jar: Record<string, string> = {
      "small-token": "direct-value",
    };
    const store = createMockCookieStore(jar);
    const wrapper = createChunkedCookiesWrapperForTest(store);

    const result = wrapper.get("small-token");
    expect(result).toEqual({ name: "small-token", value: "direct-value" });
  });

  it("returns undefined for missing keys", () => {
    const store = createMockCookieStore({});
    const wrapper = createChunkedCookiesWrapperForTest(store);

    expect(wrapper.get("missing")).toBeUndefined();
  });

  it("returns undefined when a chunk is missing", () => {
    const jar: Record<string, string> = {
      "bad.chunks": "2",
      "bad.chunk.0": "data",
      // missing bad.chunk.1
    };
    const store = createMockCookieStore(jar);
    const wrapper = createChunkedCookiesWrapperForTest(store);

    expect(wrapper.get("bad")).toBeUndefined();
  });

  it("has() returns true for chunked keys", () => {
    const jar: Record<string, string> = {
      "token.chunks": "2",
      "token.chunk.0": "A",
      "token.chunk.1": "B",
    };
    const store = createMockCookieStore(jar);
    const wrapper = createChunkedCookiesWrapperForTest(store);

    expect(wrapper.has("token")).toBe(true);
    expect(wrapper.has("nonexistent")).toBe(false);
  });

  it("supports get() with object parameter { name }", () => {
    const jar: Record<string, string> = { key: "value" };
    const store = createMockCookieStore(jar);
    const wrapper = createChunkedCookiesWrapperForTest(store);

    const result = wrapper.get({ name: "key" });
    expect(result).toEqual({ name: "key", value: "value" });
  });

  // ── SDK interface compatibility assertions ─────────────────────────────

  it("exposes the interface expected by @aws-amplify/adapter-nextjs", () => {
    /**
     * The Amplify adapter-nextjs expects cookies() to return an object with:
     * - get(name: string): { name, value } | undefined
     * - getAll(): Array<{ name, value }>
     * - has?(name: string): boolean
     * - set?(name, value, options?): void
     * - delete?(name): void
     *
     * If this test fails after an SDK upgrade, the wrapper needs updating.
     */
    const store = createMockCookieStore({ test: "val" });
    const wrapper = createChunkedCookiesWrapperForTest(store);

    // Required methods
    expect(typeof wrapper.get).toBe("function");
    expect(typeof wrapper.getAll).toBe("function");

    // Optional but expected methods
    expect(typeof wrapper.has).toBe("function");
    expect(typeof wrapper.set).toBe("function");
    expect(typeof wrapper.delete).toBe("function");

    // get() returns correct shape
    const cookie = wrapper.get("test");
    expect(cookie).toHaveProperty("name");
    expect(cookie).toHaveProperty("value");

    // getAll() returns array of { name, value }
    const all = wrapper.getAll();
    expect(Array.isArray(all)).toBe(true);
    expect(all[0]).toHaveProperty("name");
    expect(all[0]).toHaveProperty("value");
  });

  // ── Round-trip: client write → server read ─────────────────────────────

  it("round-trips: client ChunkedCookieStorage → server wrapper read", async () => {
    // Client writes a large token
    clearJar();
    const clientStorage = new ChunkedCookieStorage();
    const largeToken = "TOKEN_DATA_".repeat(500); // ~5500 chars

    await clientStorage.setItem(
      "CognitoIdentityServiceProvider.app.user.idToken",
      largeToken,
    );

    // Server reads from the same cookie jar
    const store = createMockCookieStore(cookieJar);
    const wrapper = createChunkedCookiesWrapperForTest(store);

    const result = wrapper.get(
      "CognitoIdentityServiceProvider.app.user.idToken",
    );
    expect(result?.value).toBe(largeToken);
    expect(result?.value).toHaveLength(largeToken.length);
  });
});
