/**
 * Utility functions for syncing vertical tab state with localStorage and URL
 * 
 * Storage format in localStorage:
 * {
 *   leftTab: number,
 *   rightTab: number,
 *   leftOpen: boolean,
 *   rightOpen: boolean,
 *   leftWidth: number,
 *   rightWidth: number
 * }
 * 
 * URL format:
 * ?sidebars=files,chat (both open with specific tabs)
 * ?sidebars=files (only left open)
 * ?sidebars=chat (only right open)  
 * ?sidebars= or omitted (both closed)
 * 
 * Tab names:
 * - Left: assignments, toc, dictionary, questions, files, config
 * - Right: history, chat, settings
 */

const STORAGE_KEY = 'editor-tab-state';
const DEFAULT_WIDTH = 350;

// Tab name mappings
const LEFT_TAB_NAMES = ['assignments', 'toc', 'dictionary', 'questions', 'files', 'config'];
const RIGHT_TAB_NAMES = ['history', 'chat', 'settings'];

const DEFAULT_LEFT_TAB = 4; // files
const DEFAULT_RIGHT_TAB = 1; // chat

/**
 * Convert tab index to name
 * @param {number} index - Tab index
 * @param {string} side - 'left' or 'right'
 * @returns {string} Tab name
 */
function tabIndexToName(index, side) {
  const names = side === 'left' ? LEFT_TAB_NAMES : RIGHT_TAB_NAMES;
  return names[index] || names[side === 'left' ? DEFAULT_LEFT_TAB : DEFAULT_RIGHT_TAB];
}

/**
 * Convert tab name to index
 * @param {string} name - Tab name
 * @param {string} side - 'left' or 'right'
 * @returns {number} Tab index
 */
function tabNameToIndex(name, side) {
  const names = side === 'left' ? LEFT_TAB_NAMES : RIGHT_TAB_NAMES;
  const index = names.indexOf(name);
  return index >= 0 ? index : (side === 'left' ? DEFAULT_LEFT_TAB : DEFAULT_RIGHT_TAB);
}

/**
 * Encode sidebar state with tab names
 * @param {number} leftTab - Left tab index
 * @param {number} rightTab - Right tab index
 * @param {boolean} leftOpen - Left sidebar open
 * @param {boolean} rightOpen - Right sidebar open
 * @returns {string} Encoded state (e.g., 'files,chat', 'files', 'chat', or '')
 */
function encodeSidebarState(leftTab, rightTab, leftOpen, rightOpen) {
  const parts = [];
  if (leftOpen) {
    parts.push(tabIndexToName(leftTab, 'left'));
  }
  if (rightOpen) {
    parts.push(tabIndexToName(rightTab, 'right'));
  }
  return parts.join(',');
}

/**
 * Decode sidebar state from tab names
 * @param {string} state - Encoded state (e.g., 'files,chat', 'files', 'chat')
 * @returns {object} { leftTab: number|null, rightTab: number|null, leftOpen: boolean, rightOpen: boolean }
 */
function decodeSidebarState(state) {
  if (!state) return { leftTab: null, rightTab: null, leftOpen: false, rightOpen: false };
  
  const parts = state.split(',').filter(p => p.trim());
  const result = { leftTab: null, rightTab: null, leftOpen: false, rightOpen: false };
  
  for (const part of parts) {
    const trimmed = part.trim();
    // Check if it's a left tab name
    if (LEFT_TAB_NAMES.includes(trimmed)) {
      result.leftTab = tabNameToIndex(trimmed, 'left');
      result.leftOpen = true;
    }
    // Check if it's a right tab name
    else if (RIGHT_TAB_NAMES.includes(trimmed)) {
      result.rightTab = tabNameToIndex(trimmed, 'right');
      result.rightOpen = true;
    }
  }
  
  return result;
}

/**
 * Load tab state from localStorage
 * @returns {object} Tab state object
 */
export function loadTabState() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading tab state from localStorage:', error);
    return null;
  }
}

/**
 * Save tab state to localStorage
 * @param {object} state - Tab state object
 */
export function saveTabState(state) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving tab state to localStorage:', error);
  }
}

/**
 * Parse tab state from URL query parameters
 * Format: ?sidebars=files,chat
 * @param {object} query - Next.js router query object
 * @returns {object} Parsed tab state
 */
export function parseTabStateFromURL(query) {
  const state = {};
  
  if (query.sidebars !== undefined) {
    const decoded = decodeSidebarState(query.sidebars);
    if (decoded.leftTab !== null) state.leftTab = decoded.leftTab;
    if (decoded.rightTab !== null) state.rightTab = decoded.rightTab;
    state.leftOpen = decoded.leftOpen;
    state.rightOpen = decoded.rightOpen;
  }
  
  if (query.leftWidth !== undefined) {
    state.leftWidth = parseInt(query.leftWidth, 10);
  }
  
  if (query.rightWidth !== undefined) {
    state.rightWidth = parseInt(query.rightWidth, 10);
  }
  
  return state;
}

/**
 * Build URL query parameters from tab state
 * Format: ?sidebars=files,chat
 * @param {object} state - Tab state object
 * @returns {object} Query parameters object
 */
export function buildTabStateQuery(state) {
  const query = {};
  
  const sidebarState = encodeSidebarState(
    state.leftTab ?? DEFAULT_LEFT_TAB,
    state.rightTab ?? DEFAULT_RIGHT_TAB,
    state.leftOpen ?? false,
    state.rightOpen ?? false
  );
  if (sidebarState) {
    query.sidebars = sidebarState;
  }
  
  if (state.leftWidth !== undefined && state.leftWidth !== DEFAULT_WIDTH) {
    query.leftWidth = state.leftWidth.toString();
  }
  
  if (state.rightWidth !== undefined && state.rightWidth !== DEFAULT_WIDTH) {
    query.rightWidth = state.rightWidth.toString();
  }
  
  return query;
}

/**
 * Merge URL state with localStorage state, preferring URL values
 * When no state provided, defaults to files/chat tabs but both closed
 * @param {object} urlState - State from URL query params
 * @param {object} localState - State from localStorage
 * @returns {object} Merged state object
 */
export function mergeTabState(urlState, localState) {
  return {
    leftTab: urlState.leftTab ?? localState?.leftTab ?? DEFAULT_LEFT_TAB,
    rightTab: urlState.rightTab ?? localState?.rightTab ?? DEFAULT_RIGHT_TAB,
    leftOpen: urlState.leftOpen ?? localState?.leftOpen ?? false,
    rightOpen: urlState.rightOpen ?? localState?.rightOpen ?? false,
    leftWidth: urlState.leftWidth ?? localState?.leftWidth ?? DEFAULT_WIDTH,
    rightWidth: urlState.rightWidth ?? localState?.rightWidth ?? DEFAULT_WIDTH,
  };
}

/**
 * Clear tab state from localStorage (useful for testing)
 */
export function clearTabState() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing tab state from localStorage:', error);
  }
}
