import {createEmptyHistoryState} from '@lexical/react/LexicalHistoryPlugin';
import * as React from 'react';
import {createContext, useMemo} from 'react';

const SharedHistoryContext = createContext();

const AutocompleteProvider = ({ children }) => {
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

export { AutocompleteProvider };

export default SharedHistoryContext;
