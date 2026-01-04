/**
 * React Hooks for Embedding Generation
 * Provides easy-to-use hooks for generating and managing embeddings
 */

import { useState, useCallback, useEffect } from 'react';
import {
  generateUnitEmbedding,
  generateSectionEmbedding,
  generateWordEmbedding,
  generateQuestionEmbedding,
  generateAllSectionEmbeddings,
  getOrGenerateUnitEmbedding
} from './embeddingGenerator';

/**
 * Hook for managing unit embeddings
 * @param {string} unitId - Unit ID
 * @returns {object} Embedding state and functions
 */
export function useUnitEmbedding(unitId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generate = useCallback(async (options = {}) => {
    if (!unitId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await generateUnitEmbedding(unitId, options);
      setResult(res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  const getOrGenerate = useCallback(async (maxAge) => {
    if (!unitId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await getOrGenerateUnitEmbedding(unitId, maxAge);
      setResult(res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  return {
    loading,
    error,
    result,
    generate,
    getOrGenerate
  };
}

/**
 * Hook for managing section embeddings
 * @param {string} sectionId - Section ID
 * @returns {object} Embedding state and functions
 */
export function useSectionEmbedding(sectionId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generate = useCallback(async (options = {}) => {
    if (!sectionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await generateSectionEmbedding(sectionId, options);
      setResult(res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  return {
    loading,
    error,
    result,
    generate
  };
}

/**
 * Hook for auto-generating embeddings on save
 * Useful for Word and Question components
 * @param {string} type - 'word' or 'question'
 * @param {string} itemId - Item ID
 * @param {boolean} autoGenerate - Whether to auto-generate on mount
 */
export function useAutoEmbedding(type, itemId, autoGenerate = false) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async () => {
    if (!itemId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      if (type === 'word') {
        result = await generateWordEmbedding(itemId);
      } else if (type === 'question') {
        result = await generateQuestionEmbedding(itemId);
      }
      return result;
    } catch (err) {
      setError(err);
      console.error(`Error generating ${type} embedding:`, err);
    } finally {
      setLoading(false);
    }
  }, [type, itemId]);

  useEffect(() => {
    if (autoGenerate && itemId) {
      generate();
    }
  }, [autoGenerate, itemId, generate]);

  return {
    loading,
    error,
    generate
  };
}

/**
 * Hook for batch section embedding generation
 * @param {string} unitId - Unit ID
 */
export function useBatchSectionEmbeddings(unitId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  const generateAll = useCallback(async () => {
    if (!unitId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await generateAllSectionEmbeddings(unitId);
      setSummary(res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  return {
    loading,
    error,
    summary,
    generateAll
  };
}

/**
 * Hook for handling unit publish workflow with embeddings
 * @param {object} unit - Unit object
 */
export function useUnitPublish(unit) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);

  const publish = useCallback(async () => {
    if (!unit) return;
    
    setPublishing(true);
    setError(null);
    
    try {
      // Generate unit embedding
      const unitResult = await generateUnitEmbedding(unit.id);
      
      // Optionally generate section embeddings too
      const sectionResults = await generateAllSectionEmbeddings(unit.id);
      
      // Update unit status (you'll need to implement this)
      // await DataStore.save(Unit.copyOf(unit, updated => {
      //   updated.status = 'PUBLISHED';
      // }));
      
      return {
        unit: unitResult,
        sections: sectionResults
      };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setPublishing(false);
    }
  }, [unit]);

  return {
    publishing,
    error,
    publish
  };
}
