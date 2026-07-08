/**
 * useOfflineData — Hook that provides cached offline data for student-facing pages.
 *
 * When the app detects it's offline (navigator.onLine === false or Amplify
 * subscriptions fail), this hook provides sections and assignments from
 * IndexedDB so pages can render meaningful content instead of empty states.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getAllCachedSections,
  getAllCachedAssignments,
  getCachedAssignmentsForSection,
  getAllPrefetchStatuses,
  getCachedUnit,
  type CachedSection,
  type CachedAssignment,
  type CachedUnit,
  type PrefetchStatus,
} from "@/offline/OfflineDataStore";

interface OfflineDataState {
  isOffline: boolean;
  sections: CachedSection[];
  assignments: CachedAssignment[];
  prefetchStatuses: PrefetchStatus[];
  loading: boolean;
}

/**
 * Returns cached offline data for the student navigation pages.
 * Only loads from IndexedDB when navigator.onLine is false.
 */
export function useOfflineData(): OfflineDataState {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [sections, setSections] = useState<CachedSection[]>([]);
  const [assignments, setAssignments] = useState<CachedAssignment[]>([]);
  const [prefetchStatuses, setPrefetchStatuses] = useState<PrefetchStatus[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const loadOfflineData = useCallback(async () => {
    if (typeof window === "undefined") return;
    setLoading(true);
    try {
      const [cachedSections, cachedAssignments, statuses] = await Promise.all([
        getAllCachedSections(),
        getAllCachedAssignments(),
        getAllPrefetchStatuses(),
      ]);
      setSections(cachedSections);
      setAssignments(cachedAssignments);
      setPrefetchStatuses(statuses.filter((s) => s.status === "complete"));
    } catch (err) {
      console.warn("[useOfflineData] Failed to load from IndexedDB:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      loadOfflineData();
    };
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // If already offline on mount, load immediately
    if (!navigator.onLine) {
      loadOfflineData();
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [loadOfflineData]);

  return { isOffline, sections, assignments, prefetchStatuses, loading };
}

/**
 * Get cached assignments for a specific section (for section detail page).
 */
export function useOfflineSectionAssignments(sectionId: string | null) {
  const [assignments, setAssignments] = useState<CachedAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!sectionId || !isOffline) {
      setAssignments([]);
      return;
    }
    setLoading(true);
    getCachedAssignmentsForSection(sectionId)
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [sectionId, isOffline]);

  return { assignments, loading, isOffline };
}

/**
 * Get a cached unit (for rendering offline workbook data).
 */
export function useOfflineUnit(unitId: string | null) {
  const [unit, setUnit] = useState<CachedUnit | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!unitId) return;
    setLoading(true);
    getCachedUnit(unitId)
      .then((u) => setUnit(u ?? null))
      .catch(() => setUnit(null))
      .finally(() => setLoading(false));
  }, [unitId]);

  return { unit, loading };
}
