/**
 * Offline module — barrel export for all offline functionality.
 */

// Data persistence
export {
  cacheUnit,
  getCachedUnit,
  cacheWord,
  getCachedWordsForUnit,
  cacheQuestion,
  getCachedQuestionsForUnit,
  cacheFile,
  getCachedFilesForUnit,
  getCachedFileBlob,
  cacheGrade,
  getCachedGrade,
  getUnsyncedGrades,
  cacheStudentMemory,
  getCachedStudentMemory,
  cacheSection,
  getCachedSection,
  getAllCachedSections,
  cacheAssignment,
  getCachedAssignment,
  getCachedAssignmentsForSection,
  getAllCachedAssignments,
  setPrefetchStatus,
  getPrefetchStatus,
  getAllPrefetchStatuses,
  getStorageEstimate,
  clearUnitCache,
  type CachedUnit,
  type CachedWord,
  type CachedQuestion,
  type CachedFile,
  type CachedGrade,
  type CachedStudentMemory,
  type CachedSection,
  type CachedAssignment,
  type PrefetchStatus,
} from "./OfflineDataStore";

// Sync queue
export {
  enqueue,
  getPendingCount,
  processQueue,
  clearQueue,
  getAllPending,
  type SyncOperation,
  type SyncResult,
} from "./SyncQueue";

// Assignment prefetch
export { prefetchAssignment } from "./prefetchAssignment";

// Grade offline-aware save
export {
  saveGradeOfflineAware,
  getOfflineGrade,
  type SaveGradeParams,
  type SaveGradeResult,
} from "./saveGradeOffline";

// Conflict resolution
export {
  resolveGradeConflict,
  syncGradeWithConflictResolution,
} from "./conflictResolution";

// On-device AI
export {
  offlineChatEngine,
  gradeAnswerHeuristic,
  buildOfflineSystemPrompt,
  type ChatMessage,
  type OfflineChatContext,
  type GradeResult,
} from "./OfflineChatEngine";

// AI Router
export { aiRouter, type GradeParams, type AIRouterConfig } from "./AIRouter";

// Model management
export {
  getStorageBudget,
  isWebLLMModelReady,
  getAvailableModels,
  downloadWebLLMModel,
  deleteWebLLMModel,
  formatBytes,
  type StorageBudget,
  type ModelInfo,
} from "./ModelManager";

// Grade reconciliation
export {
  reconcileOfflineGrades,
  type ReconciliationResult,
} from "./reconcileGrades";

// Offline search tools
export {
  offlineSemanticSearch,
  offlineVocabLookup,
  offlineGetProgress,
  offlineGetContent,
  augmentContextWithSearch,
  executeOfflineTool,
  OFFLINE_TOOL_DESCRIPTIONS,
  type LocalSearchResult,
  type OfflineToolResult,
} from "./OfflineSearchTools";
