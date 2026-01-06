/**
 * Vector Store Context
 * Provides access to the semantic search vector store across the application
 */

import React from 'react';

const VectorStoreContext = React.createContext({
  vectorStore: null,
  search: async (query, options) => ({ results: [] }),
  isReady: false,
});

export default VectorStoreContext;
