import { useEffect, useState } from "react";
import { getAmplifyClient } from "../utils/amplifyClient";
import { listUnitDocuments, type UnitDocumentOption } from "../utils/unitDocuments";

const NONE: UnitDocumentOption[] = [];

interface State {
  unitId: string;
  documents: UnitDocumentOption[];
}

/** The documents attached to a unit. Empty until loaded, and if loading fails. */
export function useUnitDocuments(
  unitId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
): UnitDocumentOption[] {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!enabled || !unitId) return;
    let cancelled = false;
    listUnitDocuments(getAmplifyClient(), unitId)
      .then((documents) => {
        if (!cancelled) setState({ unitId, documents });
      })
      .catch((error) => {
        console.error("[useUnitDocuments] Could not load unit documents:", error);
        if (!cancelled) setState({ unitId, documents: NONE });
      });
    return () => {
      cancelled = true;
    };
  }, [unitId, enabled]);

  return state && state.unitId === unitId ? state.documents : NONE;
}
