/**
 * storageManagementReducer — State for StorageManagement component.
 *
 * Manages data loading (storage budget, models, prefetch statuses)
 * and download state machine (idle → downloading → idle).
 */

// ============================================================================
// Types
// ============================================================================

export interface StorageBudget {
  used: number;
  quota: number;
  percentUsed: number;
}

export interface AIModel {
  id: string;
  name: string;
  sizeBytes: number;
  backend: string;
  ready: boolean;
}

export interface PrefetchStatus {
  unitId: string;
  status: string;
  progress: number;
  lastUpdated: number;
}

export type DownloadStatus = "idle" | "downloading";

export interface StorageManagementState {
  storageBudget: StorageBudget;
  models: AIModel[];
  prefetchStatuses: PrefetchStatus[];
  downloadStatus: DownloadStatus;
  downloadProgress: number;
}

// ============================================================================
// Actions
// ============================================================================

export type StorageManagementAction =
  | {
      type: "SET_DATA";
      storageBudget?: StorageBudget;
      models?: AIModel[];
      prefetchStatuses?: PrefetchStatus[];
    }
  | { type: "DOWNLOAD_START" }
  | { type: "DOWNLOAD_PROGRESS"; progress: number }
  | { type: "DOWNLOAD_COMPLETE" }
  | { type: "DOWNLOAD_ERROR" };

// ============================================================================
// Initial State
// ============================================================================

export const initialStorageManagementState: StorageManagementState = {
  storageBudget: { used: 0, quota: 0, percentUsed: 0 },
  models: [],
  prefetchStatuses: [],
  downloadStatus: "idle",
  downloadProgress: 0,
};

// ============================================================================
// Reducer
// ============================================================================

export function storageManagementReducer(
  state: StorageManagementState,
  action: StorageManagementAction,
): StorageManagementState {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        ...(action.storageBudget !== undefined && {
          storageBudget: action.storageBudget,
        }),
        ...(action.models !== undefined && { models: action.models }),
        ...(action.prefetchStatuses !== undefined && {
          prefetchStatuses: action.prefetchStatuses,
        }),
      };

    case "DOWNLOAD_START":
      return { ...state, downloadStatus: "downloading", downloadProgress: 0 };

    case "DOWNLOAD_PROGRESS":
      return { ...state, downloadProgress: action.progress };

    case "DOWNLOAD_COMPLETE":
      return { ...state, downloadStatus: "idle", downloadProgress: 0 };

    case "DOWNLOAD_ERROR":
      return { ...state, downloadStatus: "idle", downloadProgress: 0 };

    default:
      return state;
  }
}
