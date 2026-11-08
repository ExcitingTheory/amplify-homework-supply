/**
 * @fileoverview SuggestionContext - Share block suggestion state across components
 * 
 * Allows BlockSuggestionPlugin to share its suggestions with sidebar panels
 * so suggestions are displayed only in the open block-suggestions sidebar tab.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const SuggestionContext = createContext({
  suggestions: [],
  isLoadingAI: false,
  useAI: false,
  active: false,
  error: null,
  setError: () => {},
  setSuggestions: () => {},
  setIsLoadingAI: () => {},
  insertSuggestion: () => {},
  requestMoreSuggestions: () => {},
  rejectSuggestion: () => {},
  registerInsertCallback: () => {},
});

export function SuggestionProvider({ children, useAI = false, active = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState(null);
  const insertCallbackRef = useRef(null);
  const requestMoreCallbackRef = useRef(null);

  const insertSuggestion = useCallback((suggestion) => {
    if (active && insertCallbackRef.current) {
      insertCallbackRef.current(suggestion);
    }
  }, [active]);

  const rejectSuggestion = useCallback((suggestion) => {
    setSuggestions((items) => (items || []).filter((item) => item !== suggestion));
  }, []);

  const requestMoreSuggestions = useCallback(() => {
    if (active && requestMoreCallbackRef.current) {
      requestMoreCallbackRef.current();
    }
  }, [active]);

  const registerInsertCallback = useCallback((insertCallback, requestMoreCallback) => {
    insertCallbackRef.current = insertCallback;
    requestMoreCallbackRef.current = requestMoreCallback;
  }, []);

  return (
    <SuggestionContext.Provider
      value={{
        suggestions,
        isLoadingAI,
        useAI,
        active,
        error,
        setError,
        setSuggestions,
        setIsLoadingAI,
        insertSuggestion,
        rejectSuggestion,
        requestMoreSuggestions,
        registerInsertCallback,
      }}
    >
      {children}
    </SuggestionContext.Provider>
  );
}

export function useSuggestions() {
  const context = useContext(SuggestionContext);
  if (!context) {
    throw new Error('useSuggestions must be used within a SuggestionProvider');
  }
  return context;
}

export default SuggestionContext;
