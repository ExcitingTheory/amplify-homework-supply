"use client";

/**
 * @fileoverview Lets pages that already own the relevant data (the dashboard)
 * report setup progress to the shell-level page hint, so the hint does not
 * need its own data subscriptions.
 */

import React from "react";
import type { HintProgress } from "@/utils/pageHints";

interface PageHintContextValue {
  progress: HintProgress | null;
  setProgress: (progress: HintProgress | null) => void;
}

const PageHintContext = React.createContext<PageHintContextValue>({
  progress: null,
  setProgress: () => {},
});

export function PageHintProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = React.useState<HintProgress | null>(null);
  const value = React.useMemo(
    () => ({ progress, setProgress }),
    [progress],
  );
  return (
    <PageHintContext.Provider value={value}>
      {children}
    </PageHintContext.Provider>
  );
}

export function usePageHintProgress(): HintProgress | null {
  return React.useContext(PageHintContext).progress;
}

/** Reports progress while mounted; pass null until the data has loaded. */
export function useReportPageHintProgress(progress: HintProgress | null) {
  const { setProgress } = React.useContext(PageHintContext);
  const ownedSections = progress?.ownedSectionCount;
  const ownedUnits = progress?.ownedUnitCount;
  const ownedAssignments = progress?.ownedAssignmentCount;
  const joinedSections = progress?.joinedSectionCount;
  const hasProgress = progress !== null;

  React.useEffect(() => {
    if (!hasProgress) {
      setProgress(null);
      return undefined;
    }
    setProgress({
      ownedSectionCount: ownedSections ?? 0,
      ownedUnitCount: ownedUnits ?? 0,
      ownedAssignmentCount: ownedAssignments ?? 0,
      joinedSectionCount: joinedSections ?? 0,
    });
    return () => setProgress(null);
  }, [
    hasProgress,
    ownedSections,
    ownedUnits,
    ownedAssignments,
    joinedSections,
    setProgress,
  ]);
}
