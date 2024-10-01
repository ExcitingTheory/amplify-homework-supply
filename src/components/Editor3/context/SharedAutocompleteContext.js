import * as React from 'react';
import { useState, createContext } from 'react';

const AutocompleteContext = createContext();

const AutocompleteProvider = ({ children }) => {

  const [suggestion, setSuggestion] = useState('');

  return (
    <AutocompleteContext.Provider
      value={{
        suggestion,
        setSuggestion,
      }}
    >
      {children}
    </AutocompleteContext.Provider>
  );
}

export { AutocompleteProvider };

export default AutocompleteContext;