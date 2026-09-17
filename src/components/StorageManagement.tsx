import React, { useReducer, useEffect, useCallback } from "react";
import {
  storageManagementReducer,
  initialStorageManagementState,
} from "./storageManagementReducer";
import { StorageManagementView } from "./StorageManagementView";

/**
 * Storage management panel for the Settings page.
 * Shows offline storage usage, cached assignments, and AI model controls.
 */
export default function StorageManagement() {
  const [state, dispatch] = useReducer(
    storageManagementReducer,
    initialStorageManagementState,
  );
  const {
    storageBudget,
    models,
    prefetchStatuses,
    downloadStatus,
    downloadProgress,
  } = state;
  const downloading = downloadStatus === "downloading";

  const refresh = useCallback(async () => {
    try {
      const { getStorageBudget, getAvailableModels } =
        await import("../offline/ModelManager");
      const { getAllPrefetchStatuses } =
        await import("../offline/OfflineDataStore");

      const results = await Promise.allSettled([
        getStorageBudget(),
        getAvailableModels(),
        getAllPrefetchStatuses(),
      ]);

      dispatch({
        type: "SET_DATA",
        storageBudget:
          results[0].status === "fulfilled" ? results[0].value : undefined,
        models:
          results[1].status === "fulfilled" ? results[1].value : undefined,
        prefetchStatuses:
          results[2].status === "fulfilled" ? results[2].value : undefined,
      });
    } catch {
      // Modules not loaded
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDownloadModel = useCallback(async () => {
    dispatch({ type: "DOWNLOAD_START" });
    try {
      const { downloadWebLLMModel } = await import("../offline/ModelManager");
      await downloadWebLLMModel((p: number) =>
        dispatch({ type: "DOWNLOAD_PROGRESS", progress: p }),
      );
      dispatch({ type: "DOWNLOAD_COMPLETE" });
      await refresh();
    } catch (err) {
      console.error("Model download failed:", err);
      dispatch({ type: "DOWNLOAD_ERROR" });
    }
  }, [refresh]);

  const handleDeleteModel = useCallback(async () => {
    try {
      const { deleteWebLLMModel } = await import("../offline/ModelManager");
      await deleteWebLLMModel();
      await refresh();
    } catch (err) {
      console.error("Model deletion failed:", err);
    }
  }, [refresh]);

  const handleClearUnitCache = useCallback(
    async (unitId: string) => {
      try {
        const { clearUnitCache } = await import("../offline/OfflineDataStore");
        await clearUnitCache(unitId);
        await refresh();
      } catch (err) {
        console.error("Cache clear failed:", err);
      }
    },
    [refresh],
  );

  return (
    <StorageManagementView
      storageBudget={storageBudget}
      models={models}
      prefetchStatuses={prefetchStatuses}
      downloading={downloading}
      downloadProgress={downloadProgress}
      onDownloadModel={handleDownloadModel}
      onDeleteModel={handleDeleteModel}
      onClearUnitCache={handleClearUnitCache}
    />
  );
}
