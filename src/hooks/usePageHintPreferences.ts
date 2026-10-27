"use client";

import React from "react";
import SettingsContext from "@/context/settingsContext";
import { getHintPreferences, withHintSeen } from "@/utils/pageHints";

type SettingsContextValue = {
  settings?: Record<string, unknown> | null;
  updateSettings?: (updates: Record<string, unknown>) => Promise<unknown>;
};

/** Page hint preferences stored on the user's Settings record. */
export function usePageHintPreferences() {
  const { settings, updateSettings } = (React.useContext(SettingsContext) ||
    {}) as SettingsContextValue;
  const preferences = getHintPreferences(settings);
  // Ids recorded this session whose settings echo may not have arrived yet, so
  // back-to-back hints don't overwrite each other.
  const recordedRef = React.useRef<Set<string>>(new Set());

  const setShowTips = React.useCallback(
    (show: boolean) => updateSettings?.({ pageHintsEnabled: show }),
    [updateSettings],
  );

  const markSeen = React.useCallback(
    (id: string) => {
      recordedRef.current.add(id);
      const seen = [...recordedRef.current].reduce(
        withHintSeen,
        getHintPreferences(settings).seen,
      );
      return updateSettings?.({ pageHintsSeen: seen });
    },
    [settings, updateSettings],
  );

  /** Clears the seen list so every hint can appear again, and re-enables tips. */
  const resetTips = React.useCallback(() => {
    recordedRef.current.clear();
    return updateSettings?.({ pageHintsEnabled: true, pageHintsSeen: [] });
  }, [updateSettings]);

  return {
    ready: Boolean(settings),
    showTips: preferences.enabled,
    seen: preferences.seen,
    hasSeenTips: preferences.seen.length > 0,
    setShowTips,
    markSeen,
    resetTips,
  };
}
