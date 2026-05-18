/**
 * Chunked Cookie Server Utils
 *
 * Provides a server-side `runWithAmplifyServerContext` and `getServerClient`
 * that understand the chunked cookie storage format used on the client.
 *
 * When the client stores a large token (e.g., idToken) as chunks:
 *   {key}.chunks = "3"
 *   {key}.chunk.0 = "..." (first 3500 chars)
 *   {key}.chunk.1 = "..." (next 3500 chars)
 *   {key}.chunk.2 = "..." (remainder)
 *
 * The standard Amplify server adapter only reads `{key}` directly, missing
 * chunked values. This module wraps the cookie adapter to reassemble chunks.
 */
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data";
import { cookies } from "next/headers";
import outputs from "@/../amplify_outputs.json";

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

/**
 * Server-side Amplify Data Client that works with chunked cookies.
 *
 * We provide a custom cookies() wrapper that intercepts get() calls
 * and reassembles chunked values.
 */
export function getServerClient() {
  const chunkedCookies = createChunkedCookiesWrapper(cookies);
  return generateServerClientUsingCookies({
    config: outputs,
    cookies: chunkedCookies as typeof cookies,
  });
}

/**
 * Wraps Next.js cookies() function to support reading chunked cookie values.
 */
function createChunkedCookiesWrapper(nextCookies: typeof cookies) {
  // Return a function that mimics the cookies() API
  const wrapper = async () => {
    const cookieStore = await nextCookies();

    return {
      get(nameOrOptions: string | { name: string }) {
        const name =
          typeof nameOrOptions === "string"
            ? nameOrOptions
            : nameOrOptions.name;

        // Check for chunked storage
        const chunksMeta = cookieStore.get(`${name}.chunks`);
        if (chunksMeta?.value) {
          const chunkCount = parseInt(chunksMeta.value, 10);
          const parts: string[] = [];
          for (let i = 0; i < chunkCount; i++) {
            const chunk = cookieStore.get(`${name}.chunk.${i}`);
            if (!chunk?.value) {
              console.warn(
                `[ChunkedCookieServer] Missing chunk ${i} of ${chunkCount} for key: ${name}`,
              );
              return undefined;
            }
            parts.push(chunk.value);
          }
          return { name, value: parts.join("") };
        }

        // No chunks — read directly
        return cookieStore.get(name);
      },

      getAll() {
        return cookieStore.getAll();
      },

      has(name: string) {
        return cookieStore.has(name) || cookieStore.has(`${name}.chunks`);
      },

      set(...args: any[]) {
        try {
          (cookieStore as any).set(...args);
        } catch {
          // no-op in read-only server component context
        }
      },

      delete(...args: any[]) {
        try {
          (cookieStore as any).delete(...args);
        } catch {
          // no-op in read-only server component context
        }
      },

      get size() {
        return cookieStore.size;
      },

      [Symbol.iterator]() {
        return cookieStore[Symbol.iterator]();
      },
    };
  };

  return wrapper;
}
