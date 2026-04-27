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
  type CommentThread,
  type CommentReply,
  type HistoryEntry,
} from './WorkbookCollaborationProvider'
export {
  useWorkbookCollaboration,
  useWorkbookBlock,
  useTutorPresence,
  useWorkbookFeedback,
  useWorkbookStats,
  useBlockEditors,
  usePresenceUsers,
  useWorkbookComments,
  useBlockHistory,
  type UseWorkbookCollaborationOptions,
  type PresenceUser,
} from './workbookHooks'
export {
  PeerReviewRoomProvider,
  type PeerReviewUser,
  type PeerReviewRoomConfig,
  type RoomMessage,
  type RoomState,
  type RoomStatus,
  type MessageType,
} from './PeerReviewRoomProvider'
export {
  usePeerReviewRoom,
  useRoomMessages,
  useRoomPeers,
  type UsePeerReviewRoomOptions,
} from './peerReviewHooks'
export {
  PracticeCollaborationProvider,
  type PracticeUser,
  type PracticeCollaborationConfig,
  type BlockAnswer,
  type ParticipantProgress,
  type GroupStats,
  type PracticeMessage,
} from './PracticeCollaborationProvider'
export {
  usePracticeCollaboration,
  usePracticeGroupStats,
  usePracticeParticipants,
  usePracticeBlockAnswers,
  type UsePracticeCollaborationOptions,
} from './practiceCollaborationHooks'
