"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import ConflictResolutionDialog, {
  GradeConflictDetails,
} from "./ConflictResolutionDialog";
import { SyncStatusIndicatorView } from "./SyncStatusIndicatorView";

/**
 * Shows "X changes pending sync" chip and a dialog to inspect/retry the queue.
 */
export default function SyncStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingOps, setPendingOps] = useState<
    Array<{
      id?: number;
      model: string;
      operation: string;
      createdAt: number;
      retryCount: number;
      lastError?: string;
      payload?: string;
    }>
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Conflict resolution dialog state
  const [activeConflict, setActiveConflict] =
    useState<GradeConflictDetails | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

  // Load pending count
  const refreshCount = useCallback(async () => {
    try {
      const { getPendingCount, getAllPending } =
        await import("../offline/SyncQueue");
      const count = await getPendingCount();
      setPendingCount(count);
      if (dialogOpen) {
        const ops = await getAllPending();
        setPendingOps(ops);
      }
    } catch {
      // Module not loaded yet
    }
  }, [dialogOpen]);

  useEffect(() => {
    const stored = window.localStorage.getItem(
      "homework-supply:last-synced-at",
    );
    if (stored) setLastSyncedAt(Number(stored));
    refreshCount();
    const interval = setInterval(refreshCount, 5000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Listen for service worker sync messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        refreshCount();
      }
    };
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handler);
      return () =>
        navigator.serviceWorker.removeEventListener("message", handler);
    }
  }, [refreshCount]);

  const handleOpenConflictDialog = async (op: (typeof pendingOps)[0]) => {
    try {
      let gradeId = "unknown";
      let localData = {};
      let localVersion: number | undefined;

      if (op.payload) {
        const parsed = JSON.parse(op.payload);
        gradeId = parsed.id || "grade-sync";
        localData = parsed.data ? JSON.parse(parsed.data) : {};
        localVersion = parsed._version;
      }

      // Try fetching server grade for comparison
      let serverData = {};
      let serverVersion: number | undefined;
      try {
        const { generateClient } = await import("aws-amplify/data");
        const client = generateClient() as any;
        const { data: serverGrade } = await client.models.Grade.get({
          id: gradeId,
        });
        if (serverGrade) {
          serverVersion = serverGrade._version;
          serverData =
            typeof serverGrade.data === "string"
              ? JSON.parse(serverGrade.data)
              : serverGrade.data || {};
        }
      } catch {
        // Offline or fetch failed — show empty server data
      }

      setActiveConflict({
        gradeId,
        localVersion,
        serverVersion,
        localData,
        serverData,
        requiresInstructorReview:
          op.lastError?.includes("conflict") ||
          op.lastError?.includes("version"),
      });
      setConflictDialogOpen(true);
    } catch {
      // Fallback
    }
  };

  const handleResolveConflict = async (result: {
    strategy: "local-wins" | "server-wins" | "merge";
    mergedData: Record<string, unknown>;
    requiresInstructorReview?: boolean;
  }) => {
    if (!activeConflict) return;
    try {
      const { generateClient } = await import("aws-amplify/data");
      const client = generateClient() as any;
      await client.models.Grade.update({
        id: activeConflict.gradeId,
        data: JSON.stringify(result.mergedData),
        _version: activeConflict.serverVersion,
      });

      // Clear sync operations for this grade
      const { getAllPending } = await import("../offline/SyncQueue");
      const { deleteRecord } = await import("../offline/OfflineDataStore");
      const all = await getAllPending();
      for (const op of all) {
        if (op.id && op.payload?.includes(activeConflict.gradeId)) {
          await deleteRecord("syncQueue", op.id);
        }
      }
      refreshCount();
    } catch (err) {
      console.error(
        "[SyncStatusIndicator] Conflict resolution sync failed:",
        err,
      );
    }
  };

  const handleManualSync = useCallback(async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      const { processQueue } = await import("../offline/SyncQueue");
      await processQueue(async (model, operation, payload) => {
        const { generateClient } = await import("aws-amplify/data");
        const client = generateClient() as any;
        const modelClient = client.models[model];
        if (!modelClient) {
          throw new Error(`Unsupported sync model: ${model}`);
        }

        if (operation === "create") {
          await modelClient.create(payload);
        } else if (operation === "update") {
          await modelClient.update(payload);
        } else if (operation === "delete") {
          await modelClient.delete({
            id: payload.id,
            _version: payload._version,
          });
        }
      });

      await refreshCount();
      const syncedAt = Date.now();
      window.localStorage.setItem(
        "homework-supply:last-synced-at",
        String(syncedAt),
      );
      setLastSyncedAt(syncedAt);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, refreshCount, syncing]);

  if (pendingCount === 0 && isOnline) {
    return null; // All synced, nothing to show
  }

  return (
    <>
      <SyncStatusIndicatorView
        isOnline={isOnline}
        pendingCount={pendingCount}
        pendingOps={pendingOps}
        syncing={syncing}
        lastSyncedAt={lastSyncedAt}
        dialogOpen={dialogOpen}
        onOpenDialog={() => setDialogOpen(true)}
        onCloseDialog={() => setDialogOpen(false)}
        onSync={handleManualSync}
        onResolveOp={handleOpenConflictDialog}
      />

      <ConflictResolutionDialog
        open={conflictDialogOpen}
        conflict={activeConflict}
        onClose={() => setConflictDialogOpen(false)}
        onResolve={handleResolveConflict}
      />
    </>
  );
}
