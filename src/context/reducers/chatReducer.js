export const initialState = {
  assistantChat: null,
  chatHistories: [],
  isLoadingChat: false,
  chatCreationError: null,
  subscriptionReady: false,
  isChatOpen: false,
  pageContext: {
    unit: null,
    files: [],
    dictionary: [],
    questions: [],
    sections: [],
    editorRef: null,
    vectorStoreSearch: null,
  },
  messages: [],
};

export const actionTypes = {
  SET_ASSISTANT_CHAT: 'SET_ASSISTANT_CHAT',
  SET_CHAT_HISTORIES: 'SET_CHAT_HISTORIES',
  SET_LOADING_CHAT: 'SET_LOADING_CHAT',
  SET_CHAT_CREATION_ERROR: 'SET_CHAT_CREATION_ERROR',
  SET_SUBSCRIPTION_READY: 'SET_SUBSCRIPTION_READY',
  SET_CHAT_OPEN: 'SET_CHAT_OPEN',
  SET_PAGE_CONTEXT: 'SET_PAGE_CONTEXT',
  SET_MESSAGES: 'SET_MESSAGES',
  CHAT_CREATION_STARTED: 'CHAT_CREATION_STARTED',
  CHAT_CREATION_SUCCEEDED: 'CHAT_CREATION_SUCCEEDED',
  CHAT_CREATION_FAILED: 'CHAT_CREATION_FAILED',
  SUBSCRIPTION_SYNCED: 'SUBSCRIPTION_SYNCED',
};

export function chatReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_ASSISTANT_CHAT: {
      const incoming = action.payload;
      // Skip if same chat and not a newer version
      if (state.assistantChat && incoming &&
          incoming.id === state.assistantChat.id &&
          incoming._version != null &&
          incoming._version <= (state.assistantChat._version || 0)) {
        return state; // Not newer, skip re-render
      }
      return { ...state, assistantChat: incoming };
    }
    case actionTypes.SET_CHAT_HISTORIES: {
      const incoming = action.payload;
      // Skip if same length and no version changes
      if (state.chatHistories.length === incoming.length &&
          incoming.length > 0) {
        const anyNewer = incoming.some(item => {
          const existing = state.chatHistories.find(e => e.id === item.id);
          return !existing || (item._version || 0) > (existing._version || 0);
        });
        if (!anyNewer) return state; // No changes, skip re-render
      }
      return { ...state, chatHistories: incoming };
    }
    case actionTypes.SET_LOADING_CHAT:
      return { ...state, isLoadingChat: action.payload };
    case actionTypes.SET_CHAT_CREATION_ERROR:
      return { ...state, chatCreationError: action.payload };
    case actionTypes.SET_SUBSCRIPTION_READY:
      return { ...state, subscriptionReady: action.payload };
    case actionTypes.SET_CHAT_OPEN:
      return { ...state, isChatOpen: action.payload };
    case actionTypes.SET_PAGE_CONTEXT:
      return { ...state, pageContext: action.payload };
    case actionTypes.SET_MESSAGES:
      return { ...state, messages: action.payload };
    case actionTypes.CHAT_CREATION_STARTED:
      return { ...state, isLoadingChat: true, chatCreationError: null };
    case actionTypes.CHAT_CREATION_SUCCEEDED:
      return { ...state, isLoadingChat: false };
    case actionTypes.CHAT_CREATION_FAILED:
      return { ...state, isLoadingChat: false, chatCreationError: action.payload };
    case actionTypes.SUBSCRIPTION_SYNCED:
      return { ...state, subscriptionReady: true, chatHistories: action.payload };
    default:
      return state;
  }
}
