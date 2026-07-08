/**
 * @fileoverview useDrillLibrary — Fetches the drill session library for a unit.
 *
 * Returns:
 *  • `ownIncomplete` — user's own incomplete session (if any) for resume
 *  • `templates` — completed sessions from any user for this unit (replay)
 *  • `loading` — whether the query is in progress
 */

import { useState, useEffect, useCallback } from "react";
import { getAmplifyClient } from "../../utils/amplifyClient";

// ============================================================================
// Types
// ============================================================================

export interface DrillLibraryEntry {
  id: string;
  owner: string;
  drillType: string;
  blockCount: number;
  blocksCompleted: number;
  accuracy: number | null;
  complete: boolean;
  xpAwarded: number;
  createdAt: string;
  updatedAt: string;
}

export interface DrillLibraryResult {
  /** User's own incomplete session — resumable */
  ownIncomplete: DrillLibraryEntry | null;
  /** Completed sessions available as replay templates */
  templates: DrillLibraryEntry[];
  /** Whether the library is loading */
  loading: boolean;
  /** Refresh the library */
  refresh: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useDrillLibrary(unitId: string): DrillLibraryResult {
  const [ownIncomplete, setOwnIncomplete] = useState<DrillLibraryEntry | null>(
    null,
  );
  const [templates, setTemplates] = useState<DrillLibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = useCallback(async () => {
    if (!unitId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const client = getAmplifyClient();

      // Query all sessions for this unit using the byUnit index
      const { data: sessions } =
        await client.models.PracticeSession.listPracticeSessionByUnitID(
          { unitID: unitId },
          { sortDirection: "DESC", limit: 50 },
        );

      if (!sessions || sessions.length === 0) {
        setOwnIncomplete(null);
        setTemplates([]);
        setLoading(false);
        return;
      }

      // Get current user to identify own sessions
      const { fetchAuthSession } = await import("aws-amplify/auth");
      const authSession = await fetchAuthSession();
      const currentUsername =
        (authSession?.tokens?.idToken?.payload?.[
          "cognito:username"
        ] as string) || "";

      const entries: DrillLibraryEntry[] = sessions
        .filter((s: any) => s && !s._deleted)
        .map((s: any) => ({
          id: s.id,
          owner: s.owner || "",
          drillType: s.drillType || "MIXED",
          blockCount: s.blockCount || 0,
          blocksCompleted: s.blocksCompleted || 0,
          accuracy: s.accuracy ?? null,
          complete: s.complete || false,
          xpAwarded: s.xpAwarded || 0,
          createdAt: s.createdAt || "",
          updatedAt: s.updatedAt || "",
        }));

      // Find user's own incomplete session (most recent first)
      const myIncomplete =
        entries.find((e) => e.owner === currentUsername && !e.complete) || null;

      // Completed sessions as templates (exclude user's own incomplete)
      const completedTemplates = entries.filter(
        (e) => e.complete && e.blockCount > 0,
      );

      setOwnIncomplete(myIncomplete);
      setTemplates(completedTemplates);
    } catch (err) {
      console.error("[useDrillLibrary] Failed to fetch library:", err);
      setOwnIncomplete(null);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  return { ownIncomplete, templates, loading, refresh: fetchLibrary };
}
