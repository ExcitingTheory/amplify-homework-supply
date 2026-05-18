/**
 * ChunkedCookieStorage
 *
 * A KeyValueStorageInterface implementation that splits large values
 * across multiple cookies to stay under the ~4096 byte browser limit.
 *
 * Cookie naming scheme:
 *   - Metadata: `{key}.chunks` = number of chunks (e.g., "3")
 *   - Chunks:   `{key}.chunk.0`, `{key}.chunk.1`, `{key}.chunk.2`
 *   - If value fits in one cookie: stored directly as `{key}` (no chunking)
 *
 * This solves the Cognito idToken cookie being silently dropped when users
 * have many groups (section-{id}-instructors/learners).
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — js-cookie has no type declarations in this project
import JsCookie from "js-cookie";

// Safe cookie value size (leaving room for key name, attributes, encoding)
const MAX_CHUNK_SIZE = 3500;

export interface ChunkedCookieStorageOptions {
  domain?: string;
  path?: string;
  expires?: number;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
}

export class ChunkedCookieStorage {
  private path: string;
  private domain?: string;
  private expires: number;
  private sameSite?: "strict" | "lax" | "none";
  private secure: boolean;

  constructor(options: ChunkedCookieStorageOptions = {}) {
    this.path = options.path || "/";
    this.domain = options.domain;
    this.expires = options.expires ?? 365;
    this.secure = options.secure ?? true;
    this.sameSite = options.sameSite || "lax";
  }

  private getCookieOptions(): JsCookie.CookieAttributes {
    return {
      path: this.path,
      domain: this.domain,
      expires: this.expires,
      secure: this.secure,
      sameSite: this.sameSite,
    };
  }

  async setItem(key: string, value: string): Promise<void> {
    // First, remove any existing chunks for this key
    await this.removeItem(key);

    const opts = this.getCookieOptions();

    if (value.length <= MAX_CHUNK_SIZE) {
      // Fits in a single cookie — store directly
      JsCookie.set(key, value, opts);
    } else {
      // Split into chunks
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += MAX_CHUNK_SIZE) {
        chunks.push(value.slice(i, i + MAX_CHUNK_SIZE));
      }

      // Store chunk count metadata
      JsCookie.set(`${key}.chunks`, String(chunks.length), opts);

      // Store each chunk
      for (let i = 0; i < chunks.length; i++) {
        JsCookie.set(`${key}.chunk.${i}`, chunks[i], opts);
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    // Check if there are chunks
    const chunkCountStr = JsCookie.get(`${key}.chunks`);

    if (chunkCountStr) {
      // Reassemble from chunks
      const chunkCount = parseInt(chunkCountStr, 10);
      const parts: string[] = [];

      for (let i = 0; i < chunkCount; i++) {
        const chunk = JsCookie.get(`${key}.chunk.${i}`);
        if (chunk === undefined) {
          // Missing chunk — data is corrupted, treat as not found
          console.warn(
            `[ChunkedCookieStorage] Missing chunk ${i} of ${chunkCount} for key: ${key}`,
          );
          return null;
        }
        parts.push(chunk);
      }

      return parts.join("");
    }

    // No chunks — try direct read
    const value = JsCookie.get(key);
    return value ?? null;
  }

  async removeItem(key: string): Promise<void> {
    const opts = this.getCookieOptions();

    // Remove direct cookie
    JsCookie.remove(key, opts);

    // Remove any chunks
    const chunkCountStr = JsCookie.get(`${key}.chunks`);
    if (chunkCountStr) {
      const chunkCount = parseInt(chunkCountStr, 10);
      for (let i = 0; i < chunkCount; i++) {
        JsCookie.remove(`${key}.chunk.${i}`, opts);
      }
      JsCookie.remove(`${key}.chunks`, opts);
    }
  }

  async clear(): Promise<void> {
    const allCookies = JsCookie.get();
    const opts = this.getCookieOptions();
    for (const key of Object.keys(allCookies)) {
      JsCookie.remove(key, opts);
    }
  }
}
