/**
 * @fileoverview SuggestionContext - Share block suggestion state across components
 * 
 * Allows BlockSuggestionPlugin to share its suggestions with sidebar panels
 * so suggestions can be displayed in both the floating menu and the sidebar tab.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const SuggestionContext = createContext({
  suggestions: [],
  isLoadingAI: false,
  useAI: false,
  setSuggestions: () => {},
  setIsLoadingAI: () => {},
  insertSuggestion: () => {},
  requestMoreSuggestions: () => {},
});

export function SuggestionProvider({ children, useAI = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const insertCallbackRef = useRef(null);
  const requestMoreCallbackRef = useRef(null);

  const insertSuggestion = useCallback((suggestion) => {
    if (insertCallbackRef.current) {
      insertCallbackRef.current(suggestion);
    }
  }, []);

  const requestMoreSuggestions = useCallback(() => {
    if (requestMoreCallbackRef.current) {
      requestMoreCallbackRef.current();
    }
  }, []);

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
        setSuggestions,
        setIsLoadingAI,
        insertSuggestion,
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
