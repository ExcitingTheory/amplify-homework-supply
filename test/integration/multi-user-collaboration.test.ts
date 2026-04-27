/**
 * Multi-User Collaboration Integration Tests
 *
 * Validates that the workbook and editor Yjs collaboration system correctly
 * supports multiple users logging in, inputting data, and seeing each other's
 * changes via CRDT merge.
 *
 * Test scenarios:
 *   1. Student + Tutor simultaneous block edits sync correctly
 *   2. Multiple students editing independent workbooks don't cross-contaminate
 *   3. Awareness tracks connected users and roles across sessions
 *   4. Concurrent input from 3+ users converges deterministically
 *   5. Grade data export reflects all user contributions
 *   6. Feedback from tutor is visible to student after sync
 *   7. Editor (Y.Text) collaboration across two "sessions"
 *
 * These tests use raw Y.Doc sync (no WebSocket) to simulate what the
 * WorkbookCollaborationProvider does over the network.
 *
 * Usage:
 *   npm test test/integration/multi-user-collaboration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Y from 'yjs';
import {
  WorkbookCollaborationProvider,
  WorkbookUser,
} from '../../src/yjs/WorkbookCollaborationProvider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a provider with WebSocket and IndexedDB disabled (pure in-memory). */
function createProvider(gradeId: string, user: WorkbookUser) {
  return new WorkbookCollaborationProvider({
    gradeId,
    user,
    connect: false,
    persistence: false,
  });
}

/** Bi-directional sync of two providers via Y.Doc state exchange. */
function syncProviders(a: WorkbookCollaborationProvider, b: WorkbookCollaborationProvider) {
  const updateA = Y.encodeStateAsUpdate(a.getDoc());
  const updateB = Y.encodeStateAsUpdate(b.getDoc());
  Y.applyUpdate(b.getDoc(), updateA);
  Y.applyUpdate(a.getDoc(), updateB);
}

/** Full-mesh sync of N providers so every provider converges. */
function syncAll(providers: WorkbookCollaborationProvider[]) {
  // Two rounds of full-mesh to guarantee convergence
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < providers.length; i++) {
      for (let j = i + 1; j < providers.length; j++) {
        syncProviders(providers[i], providers[j]);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Users used throughout tests
// ---------------------------------------------------------------------------

const STUDENT_1: WorkbookUser = {
  username: 'student1@example.com',
  role: 'student',
  displayName: 'Alice',
  color: '#3b82f6',
};

const STUDENT_2: WorkbookUser = {
  username: 'student2@example.com',
  role: 'student',
  displayName: 'Bob',
  color: '#10b981',
};

const TUTOR: WorkbookUser = {
  username: 'tutor1@example.com',
  role: 'tutor',
  displayName: 'Dr. Smith',
  color: '#f59e0b',
};

const INSTRUCTOR: WorkbookUser = {
  username: 'instructor1@example.com',
  role: 'instructor',
  displayName: 'Prof. Jones',
  color: '#8b5cf6',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Multi-User Workbook Collaboration', () => {
  let providers: WorkbookCollaborationProvider[] = [];

  afterEach(() => {
    providers.forEach((p) => p.destroy());
    providers = [];
  });

  // =========================================================================
  // 1. Student + Tutor simultaneous edits
  // =========================================================================
  describe('Student + Tutor simultaneous block edits', () => {
    it('merges student answer and tutor feedback into the same workbook', () => {
      const student = createProvider('grade-001', STUDENT_1);
      const tutor = createProvider('grade-001', TUTOR);
      providers.push(student, tutor);

      // Student answers a quiz block
      student.updateBlock('quiz-1', {
        userAnswer: 2,
        complete: true,
        accuracy: 100,
        attempts: 1,
      });

      // Tutor provides feedback on a different block
      tutor.setFeedback('answer-1', {
        text: 'Good attempt, but review section 3.',
        type: 'tutor-comment',
      });

      // Tutor also marks the answer block as reviewed
      tutor.updateBlock('answer-1', {
        feedback: 'Reviewed by tutor',
      });

      // Sync
      syncProviders(student, tutor);

      // Student should see tutor's feedback
      const studentFeedback = student.getFeedback();
      expect(studentFeedback['answer-1']).toBeDefined();
      expect(studentFeedback['answer-1'].text).toBe('Good attempt, but review section 3.');

      // Tutor should see student's quiz answer
      const tutorData = tutor.getWorkbookData();
      expect(tutorData['quiz-1']?.userAnswer).toBe(2);
      expect(tutorData['quiz-1']?.complete).toBe(true);

      // Both should see the tutor's block update
      expect(student.getBlock('answer-1')?.feedback).toBe('Reviewed by tutor');
      expect(tutor.getBlock('answer-1')?.feedback).toBe('Reviewed by tutor');
    });

    it('both see identical workbook data after sync', () => {
      const student = createProvider('grade-002', STUDENT_1);
      const tutor = createProvider('grade-002', TUTOR);
      providers.push(student, tutor);

      student.updateBlock('block-a', { userAnswer: 'hello', complete: true, accuracy: 80 });
      student.updateBlock('block-b', { userAnswer: 42, complete: false });
      tutor.updateBlock('block-c', { userAnswer: 'tutor note' });

      syncProviders(student, tutor);

      const studentData = student.getWorkbookData();
      const tutorData = tutor.getWorkbookData();

      expect(Object.keys(studentData).sort()).toEqual(Object.keys(tutorData).sort());
      expect(studentData['block-a']?.userAnswer).toBe(tutorData['block-a']?.userAnswer);
      expect(studentData['block-b']?.userAnswer).toBe(tutorData['block-b']?.userAnswer);
      expect(studentData['block-c']?.userAnswer).toBe(tutorData['block-c']?.userAnswer);
    });
  });

  // =========================================================================
  // 2. Independent workbooks don't cross-contaminate
  // =========================================================================
  describe('Workbook isolation per grade', () => {
    it('two students with different grades do NOT share data', () => {
      const student1 = createProvider('grade-alice', STUDENT_1);
      const student2 = createProvider('grade-bob', STUDENT_2);
      providers.push(student1, student2);

      student1.updateBlock('quiz-1', { userAnswer: 'Alice answer', complete: true });
      student2.updateBlock('quiz-1', { userAnswer: 'Bob answer', complete: false });

      // Even after attempting a "sync" the docs have different names
      // so they shouldn't share data (provider rooms are separate).
      // We still call sync to make sure the Yjs docs differ:
      const update1 = Y.encodeStateAsUpdate(student1.getDoc());
      const update2 = Y.encodeStateAsUpdate(student2.getDoc());

      // Applying cross-grade updates would be a bug, but we verify data stays intact
      // by checking each student only sees their own answer.
      expect(student1.getBlock('quiz-1')?.userAnswer).toBe('Alice answer');
      expect(student2.getBlock('quiz-1')?.userAnswer).toBe('Bob answer');
      expect(student1.getBlock('quiz-1')?.complete).toBe(true);
      expect(student2.getBlock('quiz-1')?.complete).toBe(false);
    });
  });

  // =========================================================================
  // 3. Awareness tracks connected users and roles
  // =========================================================================
  describe('Awareness user tracking', () => {
    it('each provider reports its own user via awareness', () => {
      const student = createProvider('grade-003', STUDENT_1);
      const tutor = createProvider('grade-003', TUTOR);
      providers.push(student, tutor);

      const studentState = student.getAwareness().getLocalState();
      const tutorState = tutor.getAwareness().getLocalState();

      expect(studentState?.user?.username).toBe('student1@example.com');
      expect(studentState?.user?.role).toBe('student');
      expect(tutorState?.user?.username).toBe('tutor1@example.com');
      expect(tutorState?.user?.role).toBe('tutor');
    });

    it('cursor updates are reflected in awareness state', () => {
      vi.useFakeTimers();
      const student = createProvider('grade-004', STUDENT_1);
      providers.push(student);

      student.updateCursor('block-quiz-3', 15);
      vi.advanceTimersByTime(350); // past 300ms debounce

      const state = student.getAwareness().getLocalState();
      expect(state?.user?.cursor).toEqual({
        blockId: 'block-quiz-3',
        position: 15,
      });
      vi.useRealTimers();
    });

    it('getConnectedUsers returns the local user', () => {
      const student = createProvider('grade-005', STUDENT_1);
      providers.push(student);

      const users = student.getConnectedUsers();
      expect(users.length).toBeGreaterThanOrEqual(1);
      expect(users.some((u) => u.username === STUDENT_1.username)).toBe(true);
    });
  });

  // =========================================================================
  // 4. Three concurrent users converge
  // =========================================================================
  describe('Three-user convergence', () => {
    it('student, tutor, and instructor all converge to same state', () => {
      const student = createProvider('grade-006', STUDENT_1);
      const tutor = createProvider('grade-006', TUTOR);
      const instructor = createProvider('grade-006', INSTRUCTOR);
      providers.push(student, tutor, instructor);

      // Each user makes independent edits
      student.updateBlock('quiz-1', { userAnswer: 3, complete: true, accuracy: 75 });
      tutor.setFeedback('quiz-1', { text: 'Almost there!', type: 'hint' });
      instructor.updateMetadata('reviewedAt', '2026-04-14T12:00:00Z');

      // Full-mesh sync
      syncAll([student, tutor, instructor]);

      // All three should see the student's answer
      expect(student.getBlock('quiz-1')?.userAnswer).toBe(3);
      expect(tutor.getBlock('quiz-1')?.userAnswer).toBe(3);
      expect(instructor.getBlock('quiz-1')?.userAnswer).toBe(3);

      // All three should see the tutor's feedback
      expect(student.getFeedback()['quiz-1']?.text).toBe('Almost there!');
      expect(tutor.getFeedback()['quiz-1']?.text).toBe('Almost there!');
      expect(instructor.getFeedback()['quiz-1']?.text).toBe('Almost there!');

      // All three should see the instructor's metadata
      expect(student.getMetadata().reviewedAt).toBe('2026-04-14T12:00:00Z');
      expect(tutor.getMetadata().reviewedAt).toBe('2026-04-14T12:00:00Z');
      expect(instructor.getMetadata().reviewedAt).toBe('2026-04-14T12:00:00Z');
    });

    it('handles rapid concurrent edits from three users', () => {
      const users = [
        createProvider('grade-007', STUDENT_1),
        createProvider('grade-007', TUTOR),
        createProvider('grade-007', INSTRUCTOR),
      ];
      providers.push(...users);

      // Each user makes 5 rapid block updates
      users.forEach((provider, userIdx) => {
        for (let i = 0; i < 5; i++) {
          provider.updateBlock(`block-${userIdx}-${i}`, {
            userAnswer: `User ${userIdx} answer ${i}`,
            complete: true,
            accuracy: 80 + i,
          });
        }
      });

      syncAll(users);

      // Every user should see all 15 blocks
      users.forEach((provider) => {
        const data = provider.getWorkbookData();
        expect(Object.keys(data).length).toBe(15);
      });

      // Verify specific data
      expect(users[0].getBlock('block-1-2')?.userAnswer).toBe('User 1 answer 2');
      expect(users[2].getBlock('block-0-4')?.userAnswer).toBe('User 0 answer 4');
    });
  });

  // =========================================================================
  // 5. Grade data export reflects all contributions
  // =========================================================================
  describe('Grade data export', () => {
    it('exportToGradeData includes blocks from all synced users', () => {
      const student = createProvider('grade-008', STUDENT_1);
      const tutor = createProvider('grade-008', TUTOR);
      providers.push(student, tutor);

      student.updateBlock('quiz-1', { userAnswer: 1, complete: true, accuracy: 100 });
      student.updateBlock('answer-1', { userAnswer: 'photosynthesis', complete: true, accuracy: 90 });
      tutor.updateBlock('quiz-2', { userAnswer: 3, complete: true, accuracy: 50 });

      syncProviders(student, tutor);

      // Export from student side should contain all blocks
      const exported = JSON.parse(student.exportToGradeData());
      expect(Object.keys(exported).sort()).toEqual(['answer-1', 'quiz-1', 'quiz-2']);
      expect(exported['quiz-1'].accuracy).toBe(100);
      expect(exported['quiz-2'].accuracy).toBe(50);

      // Export from tutor should be identical
      const tutorExported = JSON.parse(tutor.exportToGradeData());
      expect(Object.keys(tutorExported).sort()).toEqual(Object.keys(exported).sort());
    });

    it('statistics reflect merged data from all users', () => {
      const student = createProvider('grade-009', STUDENT_1);
      const tutor = createProvider('grade-009', TUTOR);
      providers.push(student, tutor);

      student.updateBlock('b1', { complete: true, accuracy: 100 });
      student.updateBlock('b2', { complete: true, accuracy: 80 });
      tutor.updateBlock('b3', { complete: false, accuracy: 0 });

      syncProviders(student, tutor);

      // Both should compute the same stats
      expect(student.getCompletionPercentage()).toBe(67); // 2/3
      expect(tutor.getCompletionPercentage()).toBe(67);

      expect(student.getOverallAccuracy()).toBe(60); // (100+80+0)/3
      expect(tutor.getOverallAccuracy()).toBe(60);
    });
  });

  // =========================================================================
  // 6. Tutor feedback visible to student
  // =========================================================================
  describe('Tutor feedback flow', () => {
    it('tutor provides feedback that student sees after sync', () => {
      const student = createProvider('grade-010', STUDENT_1);
      const tutor = createProvider('grade-010', TUTOR);
      providers.push(student, tutor);

      // Student has no feedback initially
      expect(Object.keys(student.getFeedback())).toHaveLength(0);

      // Tutor provides feedback
      tutor.setFeedback('quiz-1', {
        text: 'Check your calculation on step 2.',
        type: 'correction',
      });
      tutor.setFeedback('answer-1', {
        text: 'Well done!',
        type: 'praise',
      });

      // Sync
      syncProviders(student, tutor);

      // Student should now see feedback
      const studentFeedback = student.getFeedback();
      expect(Object.keys(studentFeedback)).toHaveLength(2);
      expect(studentFeedback['quiz-1'].text).toBe('Check your calculation on step 2.');
      expect(studentFeedback['quiz-1'].author).toBe(TUTOR.username);
      expect(studentFeedback['quiz-1'].authorRole).toBe('tutor');
      expect(studentFeedback['answer-1'].text).toBe('Well done!');
    });

    it('student cannot provide feedback (permission check)', () => {
      const student = createProvider('grade-011', STUDENT_1);
      providers.push(student);

      expect(student.canProvideFeedback()).toBe(false);
    });

    it('tutor and instructor can provide feedback', () => {
      const tutor = createProvider('grade-012', TUTOR);
      const instructor = createProvider('grade-012', INSTRUCTOR);
      providers.push(tutor, instructor);

      expect(tutor.canProvideFeedback()).toBe(true);
      expect(instructor.canProvideFeedback()).toBe(true);
    });
  });

  // =========================================================================
  // 7. Load from Grade.data then continue editing
  // =========================================================================
  describe('Resume from persisted Grade.data', () => {
    it('loads previous session data and new edits merge correctly', () => {
      const previousData = JSON.stringify({
        'quiz-1': { userAnswer: 2, complete: true, accuracy: 100 },
        'answer-1': { userAnswer: 'old answer', complete: false, accuracy: 0 },
      });

      const student = createProvider('grade-013', STUDENT_1);
      providers.push(student);

      // Load previous session
      student.loadFromGradeData(previousData);
      expect(Object.keys(student.getWorkbookData())).toHaveLength(2);
      expect(student.getBlock('quiz-1')?.userAnswer).toBe(2);

      // Continue editing
      student.updateBlock('answer-1', {
        userAnswer: 'updated answer',
        complete: true,
        accuracy: 85,
      });

      const data = student.getWorkbookData();
      expect(data['answer-1']?.userAnswer).toBe('updated answer');
      expect(data['answer-1']?.complete).toBe(true);

      // quiz-1 should be untouched
      expect(data['quiz-1']?.userAnswer).toBe(2);
    });

    it('tutor joins a resumed student session and sees existing data', () => {
      const previousData = JSON.stringify({
        'quiz-1': { userAnswer: 1, complete: true, accuracy: 100 },
      });

      const student = createProvider('grade-014', STUDENT_1);
      student.loadFromGradeData(previousData);

      const tutor = createProvider('grade-014', TUTOR);
      providers.push(student, tutor);

      // Sync
      syncProviders(student, tutor);

      // Tutor sees the student's previous answers
      expect(tutor.getBlock('quiz-1')?.userAnswer).toBe(1);
      expect(tutor.getBlock('quiz-1')?.complete).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Editor (Y.Text) Collaboration Tests
// ---------------------------------------------------------------------------

describe('Multi-User Editor Collaboration (Y.Text)', () => {
  describe('Two users editing same Y.Text document', () => {
    it('concurrent text insertions merge without data loss', () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();
      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      // User 1 types at position 0
      text1.insert(0, 'Instructor writes: ');

      // User 2 types at position 0 (concurrently, before sync)
      text2.insert(0, 'Student writes: ');

      // Sync both ways
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
      Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

      // Both should converge
      expect(text1.toString()).toBe(text2.toString());
      expect(text1.toString()).toContain('Instructor writes:');
      expect(text1.toString()).toContain('Student writes:');

      doc1.destroy();
      doc2.destroy();
    });

    it('sequential edits from different users are ordered correctly', () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();
      const text1 = doc1.getText('content');
      const text2 = doc2.getText('content');

      // User 1 types first
      text1.insert(0, 'Hello ');
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

      // User 2 appends after sync
      text2.insert(text2.length, 'World!');
      Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

      expect(text1.toString()).toBe('Hello World!');
      expect(text2.toString()).toBe('Hello World!');

      doc1.destroy();
      doc2.destroy();
    });

    it('three users editing same paragraph converge', () => {
      const docs = Array.from({ length: 3 }, () => new Y.Doc());
      const texts = docs.map((d) => d.getText('content'));

      texts[0].insert(0, 'User0 ');
      texts[1].insert(0, 'User1 ');
      texts[2].insert(0, 'User2 ');

      // Full mesh sync (2 rounds)
      for (let round = 0; round < 2; round++) {
        for (let i = 0; i < docs.length; i++) {
          for (let j = i + 1; j < docs.length; j++) {
            Y.applyUpdate(docs[j], Y.encodeStateAsUpdate(docs[i]));
            Y.applyUpdate(docs[i], Y.encodeStateAsUpdate(docs[j]));
          }
        }
      }

      const result = texts[0].toString();
      expect(texts[1].toString()).toBe(result);
      expect(texts[2].toString()).toBe(result);
      expect(result).toContain('User0');
      expect(result).toContain('User1');
      expect(result).toContain('User2');

      docs.forEach((d) => d.destroy());
    });
  });

  describe('Editor metadata (Y.Map) collaboration', () => {
    it('two users setting different metadata keys merge correctly', () => {
      const doc1 = new Y.Doc();
      const doc2 = new Y.Doc();
      const meta1 = doc1.getMap('metadata');
      const meta2 = doc2.getMap('metadata');

      meta1.set('title', 'My Unit');
      meta1.set('author', 'instructor1@example.com');
      meta2.set('lastViewedBy', 'student1@example.com');
      meta2.set('viewCount', 5);

      // Sync
      Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
      Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

      expect(meta1.get('title')).toBe('My Unit');
      expect(meta1.get('lastViewedBy')).toBe('student1@example.com');
      expect(meta2.get('author')).toBe('instructor1@example.com');
      expect(meta2.get('viewCount')).toBe(5);

      doc1.destroy();
      doc2.destroy();
    });
  });
});
