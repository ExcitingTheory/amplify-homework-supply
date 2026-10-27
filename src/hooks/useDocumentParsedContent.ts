import { useCallback, useEffect, useRef, useState } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  ParsedContentChunkSync,
  type ParsedContentSnapshot,
} from "../utils/parsedContentChunkSync";

export type { ParsedContentLoadState } from "../utils/parsedContentChunkSync";

const LOADING = (documentId: string): ParsedContentSnapshot => ({
  documentId,
  parsedContent: null,
  document: null,
  state: "loading",
  loadingMore: false,
});

/**
 * A document's ParsedContent, merged from its page chunks, kept current
 * without reloading. The result changes identity only when a chunk's
 * `_version` (or the document) actually changes, so effects keyed on it run
 * once per real change.
 *
 * Pass `enabled: false` to wait (for example until the user is signed in).
 */
export function useDocumentParsedContent(
  documentId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [snapshot, setSnapshot] = useState<ParsedContentSnapshot | null>(null);
  const syncRef = useRef<ParsedContentChunkSync | null>(null);

  useEffect(() => {
    if (!enabled || !documentId) {
      setSnapshot(null);
      return;
    }
    const sync = new ParsedContentChunkSync(getAmplifyClient(), documentId, setSnapshot);
    syncRef.current = sync;
    setSnapshot(sync.getSnapshot());
    sync.start();
    return () => {
      sync.stop();
      if (syncRef.current === sync) syncRef.current = null;
    };
  }, [documentId, enabled]);

  /** Fetches the chunks again, for example after an import. */
  const refresh = useCallback(() => syncRef.current?.refresh(), []);

  // Until the new document's first snapshot, report loading rather than the previous document's data.
  const current =
    snapshot && snapshot.documentId === documentId ? snapshot : LOADING(documentId ?? "");

  return { ...current, refresh };
}
