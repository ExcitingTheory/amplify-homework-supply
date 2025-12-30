import {createEmptyHistoryState} from '@lexical/react/LexicalHistoryPlugin';
import * as React from 'react';
import {createContext, useMemo} from 'react';

// Create context with default value
const SharedHistoryContext = createContext({
  historyState: createEmptyHistoryState()
});

const SharedHistoryProvider = ({ children }) => {
  const historyContext = useMemo(
    () => ({historyState: createEmptyHistoryState()}),
    [],
  );


  return (
    <SharedHistoryContext.Provider
      value={historyContext}
    >
      {children}
    </SharedHistoryContext.Provider>
  );
}

export { SharedHistoryProvider };

export default SharedHistoryContext;
