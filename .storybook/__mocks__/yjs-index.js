/**
 * Mock yjs/index for Storybook
 * Prevents loading real YJS dependencies
 */

// Re-export mocks
export { YjsDocProvider } from './YjsProvider';
export { WorkbookCollaborationProvider } from './WorkbookCollaborationProvider';
export {
  useWorkbookCollaboration,
  useWorkbookBlock,
  useWorkbookStats,
  useTutorPresence,
  useYjsAwareness,
} from './workbookHooks';

// Mock other exports that might be imported
export const useYjsProvider = () => null;
export const useYMap = () => ({ get: () => null, set: () => {}, toJSON: () => ({}) });
export const useYArray = () => ({ toArray: () => [], push: () => {} });
export const useYText = () => ({ toString: () => '' });
export const useAwareness = () => ({ users: [], localUser: null });
export const SyncAdapter = class MockSyncAdapter {};
export const useWorkbookFeedback = () => ({ feedback: null, setFeedback: () => {} });
