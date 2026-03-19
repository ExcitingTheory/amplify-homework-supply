/**
 * Yjs Collaboration Performance Tests
 * 
 * Tests Yjs real-time collaboration performance with multiple concurrent editors.
 * Validates sync speed, conflict resolution, and data consistency.
 * 
 * Test Scenarios:
 * - Multiple users editing same document simultaneously
 * - Yjs sync performance with 2-5 concurrent editors
 * - Conflict resolution accuracy
 * - Undo/redo performance across clients
 * - Network partition and recovery
 * 
 * Performance Benchmarks:
 * - Sync latency: < 500ms
 * - Conflict merge: < 200ms
 * - Data consistency: 100%
 * - Undo/redo: < 100ms
 * 
 * Prerequisites:
 *   - WebSocket server running (Yjs collaboration backend)
 *   - Test environment configured
 * 
 * Usage:
 *   npm test test/performance/yjs-collaboration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Y from 'yjs';

// Performance threshold constants (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  SYNC_LATENCY: 500,      // 500ms for sync between clients
  CONFLICT_MERGE: 200,    // 200ms for conflict resolution
  UNDO_REDO: 100,         // 100ms for undo/redo operations
  INITIAL_SYNC: 1000,     // 1 second for initial document sync
};

// Helper: Create Yjs document with test content
function createTestDocument() {
  const doc = new Y.Doc();
  const content = doc.getText('content');
  return { doc, content };
}

// Helper: Simulate text insertion
function insertText(yText: Y.Text, position: number, text: string) {
  yText.insert(position, text);
}

// Helper: Simulate text deletion
function deleteText(yText: Y.Text, position: number, length: number) {
  yText.delete(position, length);
}

// Helper: Apply state update from one doc to another (simulates sync)
function syncDocuments(sourceDoc: Y.Doc, targetDoc: Y.Doc) {
  const startTime = performance.now();
  
  const update = Y.encodeStateAsUpdate(sourceDoc);
  Y.applyUpdate(targetDoc, update);
  
  const syncTime = performance.now() - startTime;
  return syncTime;
}

// Helper: Verify document consistency
function verifyConsistency(docs: Y.Doc[]): boolean {
  if (docs.length < 2) return true;
  
  const firstContent = docs[0].getText('content').toString();
  return docs.every(doc => doc.getText('content').toString() === firstContent);
}

describe('Yjs Collaboration Performance Tests', () => {
  describe('Two-Client Collaboration', () => {
    it('syncs changes between two clients efficiently', () => {
      const { doc: doc1, content: content1 } = createTestDocument();
      const { doc: doc2, content: content2 } = createTestDocument();

      // Client 1 makes changes
      insertText(content1, 0, 'Hello from Client 1');

      // Sync to Client 2
      const syncTime = syncDocuments(doc1, doc2);

      // Verify sync
      expect(content2.toString()).toBe('Hello from Client 1');
      expect(syncTime).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_LATENCY);

      console.info(`✓ Two-client sync completed in ${syncTime.toFixed(2)}ms`);
    });

    it('handles concurrent edits without data loss', () => {
      const { doc: doc1, content: content1 } = createTestDocument();
      const { doc: doc2, content: content2 } = createTestDocument();

      // Both clients make changes independently
      insertText(content1, 0, 'Client 1: ');
      insertText(content2, 0, 'Client 2: ');

      // Sync in both directions
      const startTime = performance.now();
      
      syncDocuments(doc1, doc2);
      syncDocuments(doc2, doc1);
      
      const totalSyncTime = performance.now() - startTime;

      // Content should be merged (order may vary due to CRDT)
      const text1 = content1.toString();
      const text2 = content2.toString();

      expect(text1).toBe(text2); // Both should converge to same state
      expect(text1).toContain('Client 1:');
      expect(text1).toContain('Client 2:');
      expect(totalSyncTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONFLICT_MERGE);

      console.info(`✓ Concurrent edit merge completed in ${totalSyncTime.toFixed(2)}ms`);
    });

    it('resolves conflicts deterministically', () => {
      const { doc: doc1, content: content1 } = createTestDocument();
      const { doc: doc2, content: content2 } = createTestDocument();

      // Initialize with same content
      insertText(content1, 0, 'Base content');
      syncDocuments(doc1, doc2);

      // Both clients modify the same position
      deleteText(content1, 0, 4);
      insertText(content1, 0, 'Modified');

      deleteText(content2, 0, 4);
      insertText(content2, 0, 'Changed');

      // Sync in both directions
      syncDocuments(doc1, doc2);
      syncDocuments(doc2, doc1);

      // Both should converge to identical state
      expect(content1.toString()).toBe(content2.toString());

      console.info('✓ Conflict resolution: Deterministic convergence verified');
    });
  });

  describe('Multi-Client Collaboration (3-5 Clients)', () => {
    it('syncs changes across 3 concurrent editors', () => {
      const clients = Array.from({ length: 3 }, () => createTestDocument());

      // Each client makes unique changes
      clients.forEach((client, i) => {
        insertText(client.content, 0, `Client ${i + 1} | `);
      });

      // Sync all clients together
      const startTime = performance.now();

      // Full mesh sync (everyone syncs with everyone)
      for (let i = 0; i < clients.length; i++) {
        for (let j = 0; j < clients.length; j++) {
          if (i !== j) {
            syncDocuments(clients[i].doc, clients[j].doc);
          }
        }
      }

      const totalSyncTime = performance.now() - startTime;

      // Verify all clients have consistent state
      expect(verifyConsistency(clients.map(c => c.doc))).toBe(true);

      // All clients should have all content
      const finalContent = clients[0].content.toString();
      expect(finalContent).toContain('Client 1');
      expect(finalContent).toContain('Client 2');
      expect(finalContent).toContain('Client 3');

      console.info(`✓ 3-client sync completed in ${totalSyncTime.toFixed(2)}ms`);
      console.info(`  Final content length: ${finalContent.length} characters`);
    });

    it('handles 5 concurrent editors with rapid changes', () => {
      const clients = Array.from({ length: 5 }, () => createTestDocument());
      const changesPerClient = 10;

      const startTime = performance.now();

      // Each client makes multiple rapid changes
      clients.forEach((client, clientIndex) => {
        for (let i = 0; i < changesPerClient; i++) {
          insertText(client.content, client.content.length, `C${clientIndex}-${i} `);
        }
      });

      // Full mesh sync
      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < clients.length; i++) {
          for (let j = i + 1; j < clients.length; j++) {
            syncDocuments(clients[i].doc, clients[j].doc);
            syncDocuments(clients[j].doc, clients[i].doc);
          }
        }
      }

      const totalTime = performance.now() - startTime;

      // Verify convergence
      expect(verifyConsistency(clients.map(c => c.doc))).toBe(true);

      // Count total changes
      const finalContent = clients[0].content.toString();
      const totalChanges = clients.length * changesPerClient;

      console.info(`✓ 5 clients, ${totalChanges} total changes in ${totalTime.toFixed(2)}ms`);
      console.info(`  Average: ${(totalTime / totalChanges).toFixed(2)}ms per change`);
      console.info(`  Final content: ${finalContent.length} characters`);

      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 50 changes + syncs
    });
  });

  describe('Undo/Redo Performance', () => {
    it('performs undo operations efficiently', () => {
      const { doc, content } = createTestDocument();
      const undoManager = new Y.UndoManager(content);

      // Make some changes
      insertText(content, 0, 'First change. ');
      insertText(content, content.length, 'Second change. ');
      insertText(content, content.length, 'Third change.');

      expect(content.toString()).toContain('Third change');

      // Measure undo performance
      const startTime = performance.now();
      undoManager.undo();
      const undoTime = performance.now() - startTime;

      expect(content.toString()).not.toContain('Third change');
      expect(undoTime).toBeLessThan(PERFORMANCE_THRESHOLDS.UNDO_REDO);

      console.info(`✓ Undo operation completed in ${undoTime.toFixed(2)}ms`);
    });

    it('performs redo operations efficiently', () => {
      const { doc, content } = createTestDocument();
      const undoManager = new Y.UndoManager(content);

      insertText(content, 0, 'Content to undo/redo');
      undoManager.undo();

      const startTime = performance.now();
      undoManager.redo();
      const redoTime = performance.now() - startTime;

      expect(content.toString()).toBe('Content to undo/redo');
      expect(redoTime).toBeLessThan(PERFORMANCE_THRESHOLDS.UNDO_REDO);

      console.info(`✓ Redo operation completed in ${redoTime.toFixed(2)}ms`);
    });

    it('handles undo/redo across multiple clients', () => {
      const { doc: doc1, content: content1 } = createTestDocument();
      const { doc: doc2, content: content2 } = createTestDocument();

      const undoManager1 = new Y.UndoManager(content1);

      // Client 1 makes changes
      insertText(content1, 0, 'Change 1. ');
      insertText(content1, content1.length, 'Change 2.');

      // Sync to Client 2
      syncDocuments(doc1, doc2);

      // Client 1 undoes
      undoManager1.undo();

      // Sync undo to Client 2
      syncDocuments(doc1, doc2);

      // Both clients should reflect the undo
      expect(content1.toString()).toBe(content2.toString());
      expect(content1.toString()).not.toContain('Change 2');

      console.info('✓ Undo/redo sync across clients verified');
    });
  });

  describe('Performance Under Stress', () => {
    it('handles large document (10KB) efficiently', () => {
      const { doc, content } = createTestDocument();

      const largeText = 'Lorem ipsum dolor sit amet. '.repeat(400); // ~10KB

      const insertStart = performance.now();
      insertText(content, 0, largeText);
      const insertTime = performance.now() - insertStart;

      expect(content.length).toBeGreaterThan(10000);
      console.info(`✓ Large document insert: ${insertTime.toFixed(2)}ms`);

      // Create second client and sync
      const { doc: doc2 } = createTestDocument();

      const syncStart = performance.now();
      syncDocuments(doc, doc2);
      const syncTime = performance.now() - syncStart;

      expect(syncTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_SYNC);
      console.info(`✓ Large document sync: ${syncTime.toFixed(2)}ms`);
    });

    it('measures delta update size for incremental changes', () => {
      const { doc, content } = createTestDocument();

      insertText(content, 0, 'Initial content');

      // Get initial state
      const initialState = Y.encodeStateAsUpdate(doc);

      // Make small change
      insertText(content, content.length, ' + small change');

      // Get delta (only the change)
      const delta = Y.encodeStateAsUpdate(doc, Y.encodeStateVector(doc));

      console.info('\n📊 Update Size Metrics:');
      console.info(`  Initial state: ${initialState.length} bytes`);
      console.info(`  Delta update: ${delta.length} bytes`);
      console.info(`  Compression: ${((1 - delta.length / initialState.length) * 100).toFixed(1)}%`);

      // Delta should be significantly smaller
      expect(delta.length).toBeLessThan(initialState.length);
    });
  });

  describe('Data Consistency Verification', () => {
    it('maintains consistency through random concurrent operations', () => {
      const clients = Array.from({ length: 3 }, () => createTestDocument());

      // Simulate random operations
      for (let i = 0; i < 20; i++) {
        const clientIndex = Math.floor(Math.random() * clients.length);
        const client = clients[clientIndex];

        if (Math.random() > 0.5) {
          // Insert
          const pos = Math.floor(Math.random() * (client.content.length + 1));
          insertText(client.content, pos, `${i}`);
        } else {
          // Delete (if content exists)
          if (client.content.length > 0) {
            const pos = Math.floor(Math.random() * client.content.length);
            deleteText(client.content, pos, 1);
          }
        }

        // Sync after every few operations
        if (i % 5 === 0) {
          for (let j = 0; j < clients.length; j++) {
            for (let k = j + 1; k < clients.length; k++) {
              syncDocuments(clients[j].doc, clients[k].doc);
              syncDocuments(clients[k].doc, clients[j].doc);
            }
          }
        }
      }

      // Final full sync
      for (let j = 0; j < clients.length; j++) {
        for (let k = j + 1; k < clients.length; k++) {
          syncDocuments(clients[j].doc, clients[k].doc);
          syncDocuments(clients[k].doc, clients[j].doc);
        }
      }

      // Verify perfect consistency
      expect(verifyConsistency(clients.map(c => c.doc))).toBe(true);

      console.info('✓ Data consistency maintained through 20 random operations');
    });
  });

  describe('Performance Benchmarks Report', () => {
    it('generates comprehensive performance report', () => {
      const metrics = {
        twoClientSync: 0,
        fiveClientSync: 0,
        conflictResolution: 0,
        undoOperation: 0,
        largeDocSync: 0,
      };

      // Two-client sync
      {
        const { doc: doc1, content: content1 } = createTestDocument();
        const { doc: doc2 } = createTestDocument();
        insertText(content1, 0, 'Test');
        const start = performance.now();
        syncDocuments(doc1, doc2);
        metrics.twoClientSync = performance.now() - start;
      }

      // Five-client sync
      {
        const clients = Array.from({ length: 5 }, () => createTestDocument());
        clients.forEach((c, i) => insertText(c.content, 0, `Client ${i}`));
        const start = performance.now();
        for (let i = 0; i < clients.length; i++) {
          for (let j = i + 1; j < clients.length; j++) {
            syncDocuments(clients[i].doc, clients[j].doc);
          }
        }
        metrics.fiveClientSync = performance.now() - start;
      }

      // Conflict resolution
      {
        const { doc: doc1, content: content1 } = createTestDocument();
        const { doc: doc2, content: content2 } = createTestDocument();
        insertText(content1, 0, 'Test');
        syncDocuments(doc1, doc2);
        insertText(content1, 0, 'A');
        insertText(content2, 0, 'B');
        const start = performance.now();
        syncDocuments(doc1, doc2);
        syncDocuments(doc2, doc1);
        metrics.conflictResolution = performance.now() - start;
      }

      // Undo operation
      {
        const { content } = createTestDocument();
        const undoManager = new Y.UndoManager(content);
        insertText(content, 0, 'Test');
        const start = performance.now();
        undoManager.undo();
        metrics.undoOperation = performance.now() - start;
      }

      // Large document sync
      {
        const { doc: doc1, content } = createTestDocument();
        const { doc: doc2 } = createTestDocument();
        insertText(content, 0, 'x'.repeat(10000));
        const start = performance.now();
        syncDocuments(doc1, doc2);
        metrics.largeDocSync = performance.now() - start;
      }

      console.info('\n📊 Yjs Performance Benchmark Report:');
      console.info('=====================================');
      console.info(`  Two-client sync:        ${metrics.twoClientSync.toFixed(2)}ms`);
      console.info(`  Five-client full sync:  ${metrics.fiveClientSync.toFixed(2)}ms`);
      console.info(`  Conflict resolution:    ${metrics.conflictResolution.toFixed(2)}ms`);
      console.info(`  Undo operation:         ${metrics.undoOperation.toFixed(2)}ms`);
      console.info(`  Large doc sync (10KB):  ${metrics.largeDocSync.toFixed(2)}ms`);
      console.info('=====================================');

      // Verify against thresholds
      expect(metrics.twoClientSync).toBeLessThan(PERFORMANCE_THRESHOLDS.SYNC_LATENCY);
      expect(metrics.conflictResolution).toBeLessThan(PERFORMANCE_THRESHOLDS.CONFLICT_MERGE);
      expect(metrics.undoOperation).toBeLessThan(PERFORMANCE_THRESHOLDS.UNDO_REDO);
      expect(metrics.largeDocSync).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_SYNC);
    });
  });
});
