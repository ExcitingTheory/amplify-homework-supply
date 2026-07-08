/**
 * Module-level translation override store.
 *
 * Lives in the preview bundle (imported by both the next-intl mock and the
 * decorator), so all modules share the same singleton Map.
 *
 * The Translations panel pushes changes via the Storybook channel
 * (`translation-mode/live-update`).  The decorator receives them and calls
 * `setTranslationOverride`.  The next-intl mock subscribes via
 * `useSyncExternalStore` so components re-render immediately.
 */

const overrideMap = new Map<string, string>();
let version = 0;
const listeners = new Set<() => void>();

function makeKey(namespace: string, key: string, lang: string): string {
  // Use null-byte separator to avoid accidental collisions in keys/namespaces
  return `${namespace}\0${key}\0${lang}`;
}

/** Apply a single override.  Increments the version and notifies subscribers. */
export function setTranslationOverride(
  namespace: string,
  key: string,
  lang: string,
  value: string
): void {
  overrideMap.set(makeKey(namespace, key, lang), value);
  version++;
  listeners.forEach((fn) => fn());
}

/** Return the overridden value, or `undefined` if none exists. */
export function getTranslationOverride(
  namespace: string,
  key: string,
  lang: string
): string | undefined {
  return overrideMap.get(makeKey(namespace, key, lang));
}

/** Subscribe function for `useSyncExternalStore`. */
export function subscribeTranslationOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Snapshot function for `useSyncExternalStore` — returns an ever-increasing integer. */
export function getTranslationOverrideVersion(): number {
  return version;
}
