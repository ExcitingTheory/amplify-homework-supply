import { useCallback, useEffect, useState } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  importedEntryKeys,
  listDocumentLinks,
  type DocumentLinkKind,
} from "../utils/documentLinks";

const NO_KEYS: ReadonlySet<string> = new Set();

interface LinkState {
  documentId: string;
  kind: DocumentLinkKind;
  keys: ReadonlySet<string>;
}

function sameKeys(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const key of a) if (!b.has(key)) return false;
  return true;
}

/**
 * The entries of a document already imported into the bank, as normalized
 * keys (see `questionEntryKey` / `wordEntryKey`). `loaded` is false until the
 * first answer, so a screen can wait before choosing what to pre-select.
 * The set keeps its identity while the keys are unchanged. Call `refresh()`
 * after an import.
 */
export function useDocumentLinks(
  documentId: string | undefined,
  kind: DocumentLinkKind,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [state, setState] = useState<LinkState | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!enabled || !documentId) {
      setState(null);
      return;
    }
    let cancelled = false;
    (async () => {
      let keys: ReadonlySet<string>;
      try {
        keys = importedEntryKeys(await listDocumentLinks(getAmplifyClient(), documentId, kind));
      } catch (error) {
        // Without links every entry is simply offered for import.
        console.error("[useDocumentLinks] Could not load document links:", error);
        keys = NO_KEYS;
      }
      if (cancelled) return;
      setState((previous) =>
        previous && previous.documentId === documentId && previous.kind === kind && sameKeys(previous.keys, keys)
          ? previous
          : { documentId, kind, keys },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId, kind, enabled, refreshCount]);

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), []);

  const current = state && state.documentId === documentId && state.kind === kind ? state : null;
  return { importedKeys: current?.keys ?? NO_KEYS, loaded: current !== null, refresh };
}
