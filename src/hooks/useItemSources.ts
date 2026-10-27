import { useEffect, useState } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  listItemSources,
  type DocumentLinkKind,
  type ItemSource,
} from "../utils/documentLinks";

const NONE: ItemSource[] = [];

interface SourcesState {
  kind: DocumentLinkKind;
  itemId: string;
  sources: ItemSource[];
}

/**
 * The documents a Question or Word was imported from. Loads once, when
 * `enabled` first becomes true (for example when a row is expanded), so a long
 * list does not issue a request per row.
 */
export function useItemSources(
  kind: DocumentLinkKind,
  itemId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
): ItemSource[] {
  const [state, setState] = useState<SourcesState | null>(null);
  const alreadyLoaded = state?.kind === kind && state.itemId === itemId;

  useEffect(() => {
    if (!enabled || !itemId || alreadyLoaded) return;
    let cancelled = false;
    listItemSources(getAmplifyClient(), kind, itemId)
      .then((sources) => {
        if (!cancelled) setState({ kind, itemId, sources });
      })
      .catch((error) => {
        console.error("[useItemSources] Could not load sources:", error);
        if (!cancelled) setState({ kind, itemId, sources: NONE });
      });
    return () => {
      cancelled = true;
    };
  }, [kind, itemId, enabled, alreadyLoaded]);

  return alreadyLoaded && state ? state.sources : NONE;
}
