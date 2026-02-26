/**
 * Mock WorkbookCollaborationProvider for Storybook
 * Prevents loading real YJS dependencies
 */

import { YjsDocProvider } from './YjsProvider';

export class WorkbookCollaborationProvider extends YjsDocProvider {
  constructor(config) {
    super({ ...config, docName: `workbook-${config.gradeId}` });
    this.gradeId = config.gradeId;
    this.user = config.user;
    this.config = config;
    this.activeTutors = new Map();
    console.log('[Mock WorkbookCollaborationProvider] Created for grade:', config.gradeId);
  }

  getWorkbookData() {
    return {};
  }

  updateBlock(blockId, data) {
    console.log('[Mock WorkbookCollaborationProvider] Update block:', blockId, data);
  }

  getTutorFeedback(blockId) {
    return null;
  }

  setTutorFeedback(blockId, feedback) {
    console.log('[Mock WorkbookCollaborationProvider] Set feedback:', blockId, feedback);
  }

  getActiveTutors() {
    return [];
  }

  getConnectedUsers() {
    return [];
  }

  syncToGrade(callback) {
    console.log('[Mock WorkbookCollaborationProvider] Sync to grade');
  }

  getCompletionPercentage() {
    return 0;
  }

  getOverallAccuracy() {
    return 0;
  }
}
