/**
 * Mock implementation of YJS workbookHooks for Storybook
 * 
 * Provides realistic mock implementations that simulate the full production
 * workbookHooks API, matching the TypeScript interface from yjs/workbookHooks.ts
 */

import { useState, useEffect, useCallback } from 'react';

// Store for workbook data - synced with Grade.data from mock store
const workbookDataStore = {};

/**
 * Mock hook for workbook collaboration
 * Returns the Grade data and simulates collaborative behavior
 * Matches the API from yjs/workbookHooks.ts useWorkbookCollaboration
 */
export function useWorkbookCollaboration(options = {}) {
  const { gradeId, user, initialData, onTutorJoin, onTutorLeave, onSyncToGrade, autoSyncToGrade = true, syncInterval = 3000 } = options || {};
  const [workbookData, setWorkbookData] = useState({});
  const [isSynced, setIsSynced] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTutors, setActiveTutors] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  
  useEffect(() => {
    // Initialize from store or initial data
    if (gradeId) {
      const existing = workbookDataStore[gradeId];
      if (existing) {
        setWorkbookData(existing);
      } else if (initialData) {
        const parsed = typeof initialData === 'string' ? JSON.parse(initialData) : initialData;
        workbookDataStore[gradeId] = parsed;
        setWorkbookData(parsed);
      }
      
      // Simulate sync delay
      setTimeout(() => {
        setIsSynced(true);
        setIsConnected(true);
      }, 100);
      
      // Add current user to connected users
      if (user) {
        setConnectedUsers([user]);
      }
    }
  }, [gradeId, initialData, user]);
  
  const updateBlock = useCallback((blockId, data) => {
    console.log('[Mock] updateBlock:', blockId, data);
    setWorkbookData(prev => {
      const updated = { ...prev, [blockId]: { ...prev[blockId], ...data } };
      workbookDataStore[gradeId] = updated;
      return updated;
    });
  }, [gradeId]);
  
  const getBlock = useCallback((blockId) => {
    return workbookData[blockId];
  }, [workbookData]);
  
  const deleteBlock = useCallback((blockId) => {
    console.log('[Mock] deleteBlock:', blockId);
    setWorkbookData(prev => {
      const updated = { ...prev };
      delete updated[blockId];
      workbookDataStore[gradeId] = updated;
      return updated;
    });
  }, [gradeId]);
  
  const setFeedback = useCallback((blockId, feedback) => {
    console.log('[Mock] setFeedback:', blockId, feedback);
    updateBlock(blockId, { feedback });
  }, [updateBlock]);
  
  const updateCursor = useCallback((blockId, position) => {
    console.log('[Mock] updateCursor:', blockId, position);
    // Mock cursor updates - no-op in Storybook
  }, []);
  
  const exportToGradeData = useCallback(() => {
    return JSON.stringify(workbookData);
  }, [workbookData]);
  
  const getCompletionPercentage = useCallback(() => {
    const blocks = Object.values(workbookData);
    if (blocks.length === 0) return 0;
    const completed = blocks.filter(b => b?.complete).length;
    return Math.round((completed / blocks.length) * 100);
  }, [workbookData]);
  
  const getOverallAccuracy = useCallback(() => {
    const blocks = Object.values(workbookData).filter(b => b?.accuracy !== undefined);
    if (blocks.length === 0) return 0;
    const total = blocks.reduce((sum, b) => sum + (b.accuracy || 0), 0);
    return Math.round(total / blocks.length);
  }, [workbookData]);
  
  return {
    provider: gradeId ? { connected: true, gradeId } : null,
    workbookData,
    activeTutors,
    connectedUsers,
    isSynced,
    isConnected,
    hasTutorPresent: activeTutors.length > 0,
    updateBlock,
    getBlock,
    deleteBlock,
    setFeedback,
    updateCursor,
    exportToGradeData,
    getCompletionPercentage,
    getOverallAccuracy,
  };
}

/**
 * Mock hook for individual workbook block
 * Matches the API from yjs/workbookHooks.ts useWorkbookBlock
 */
export function useWorkbookBlock(provider, blockId) {
  const [blockData, setBlockData] = useState(null);
  
  useEffect(() => {
    if (provider && provider.gradeId) {
      const data = workbookDataStore[provider.gradeId];
      if (data && data[blockId]) {
        setBlockData(data[blockId]);
      }
    }
  }, [provider, blockId]);
  
  const updateData = useCallback((data) => {
    console.log('[Mock] useWorkbookBlock updateData:', blockId, data);
    if (provider && provider.gradeId) {
      const gradeId = provider.gradeId;
      const currentData = workbookDataStore[gradeId] || {};
      const updated = { ...currentData, [blockId]: { ...currentData[blockId], ...data } };
      workbookDataStore[gradeId] = updated;
      setBlockData(updated[blockId]);
    }
  }, [provider, blockId]);
  
  const deleteData = useCallback(() => {
    console.log('[Mock] useWorkbookBlock deleteData:', blockId);
    if (provider && provider.gradeId) {
      const gradeId = provider.gradeId;
      const currentData = workbookDataStore[gradeId] || {};
      delete currentData[blockId];
      workbookDataStore[gradeId] = currentData;
      setBlockData(null);
    }
  }, [provider, blockId]);
  
  return {
    blockData,
    updateData,
    deleteData,
    isComplete: blockData?.complete === true,
    accuracy: blockData?.accuracy,
  };
}

/**
 * Mock hook for tutor presence
 * Matches the API from yjs/workbookHooks.ts useTutorPresence
 */
export function useTutorPresence(provider, blockId) {
  // In Storybook, no tutors are present
  return [];
}

/**
 * Mock hook for workbook feedback notifications
 * Matches the API from yjs/workbookHooks.ts useWorkbookFeedback
 */
export function useWorkbookFeedback(provider, onNewFeedback) {
  const [allFeedback, setAllFeedback] = useState({});
  
  useEffect(() => {
    if (provider && provider.gradeId) {
      const data = workbookDataStore[provider.gradeId] || {};
      const feedback = {};
      Object.keys(data).forEach(blockId => {
        if (data[blockId]?.feedback) {
          feedback[blockId] = data[blockId].feedback;
        }
      });
      setAllFeedback(feedback);
    }
  }, [provider]);
  
  return allFeedback;
}

/**
 * Mock hook for workbook statistics
 * Matches the API from yjs/workbookHooks.ts useWorkbookStats
 */
export function useWorkbookStats(provider) {
  const [stats, setStats] = useState({
    completion: 0,
    accuracy: 0,
    totalBlocks: 0,
    completedBlocks: 0,
    averageAttempts: 0,
  });
  
  useEffect(() => {
    if (provider && provider.gradeId) {
      const data = workbookDataStore[provider.gradeId] || {};
      const blockIds = Object.keys(data);
      const completedBlocks = blockIds.filter(id => data[id]?.complete === true);
      
      const attempts = blockIds
        .map(id => data[id]?.attempts || 0)
        .filter(a => a > 0);
      
      const avgAttempts = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a, 0) / attempts.length)
        : 0;
      
      const blocks = Object.values(data);
      const completion = blocks.length > 0
        ? Math.round((completedBlocks.length / blocks.length) * 100)
        : 0;
      
      const blocksWithAccuracy = blocks.filter(b => b?.accuracy !== undefined);
      const accuracy = blocksWithAccuracy.length > 0
        ? Math.round(blocksWithAccuracy.reduce((sum, b) => sum + (b.accuracy || 0), 0) / blocksWithAccuracy.length)
        : 0;
      
      setStats({
        completion,
        accuracy,
        totalBlocks: blockIds.length,
        completedBlocks: completedBlocks.length,
        averageAttempts: avgAttempts,
      });
    }
  }, [provider]);
  
  return stats;
}
