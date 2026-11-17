export function createResponseBlockId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID().replace(/-/g, "");
  }
  return `rb${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function resolveResponseBlockId(
  persistedId: unknown,
  nodeType: string,
  serializedContent: unknown,
): string {
  if (
    typeof persistedId === "string" &&
    /^[A-Za-z0-9_-]{1,200}$/.test(persistedId)
  ) {
    return persistedId;
  }

  const input = JSON.stringify([nodeType, serializedContent]);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `legacy${(hash >>> 0).toString(36)}`;
}
