/**
 * Yjs Library - Main exports
 */

export { YjsDocProvider, type YjsProviderConfig } from './YjsProvider'
export {
  useYjsProvider,
  useYMap,
  useYArray,
  useYText,
  useAwareness,
} from './hooks'
export { SyncAdapter, type SyncAdapterConfig } from './SyncAdapter'
export {
  WorkbookCollaborationProvider,
  type WorkbookUser,
  type WorkbookCollaborationConfig,
  type WorkbookBlockData,
} from './WorkbookCollaborationProvider'
export {
  useWorkbookCollaboration,
  useWorkbookBlock,
  useTutorPresence,
  useWorkbookFeedback,
  useWorkbookStats,
  type UseWorkbookCollaborationOptions,
} from './workbookHooks'
