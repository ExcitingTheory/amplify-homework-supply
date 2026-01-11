import React, { createContext, useContext } from 'react';

/**
 * Context for managing tab state across the editor
 * Provides tab indices, open states, and setters for left/right sidebars
 */
const TabContext = createContext({
    // Left sidebar state
    leftTab: 4, // files
    leftOpen: false,
    leftWidth: 350,
    setLeftTab: () => {},
    setLeftOpen: () => {},
    setLeftWidth: () => {},
    
    // Right sidebar state
    rightTab: 1, // chat
    rightOpen: false,
    rightWidth: 350,
    setRightTab: () => {},
    setRightOpen: () => {},
    setRightWidth: () => {},
    
    // Batch update
    updateState: () => {},
    
    // Focus management
    focusItem: null, // { type, id, timestamp }
    setFocusItem: () => {},
});

/**
 * Hook to access tab context
 * @returns {object} Tab context value
 */
export function useTabContext() {
    const context = useContext(TabContext);
    if (!context) {
        console.warn('[useTabContext] Used outside of TabProvider, returning default values');
    }
    return context;
}

/**
 * Provider component for tab state
 */
export function TabProvider({ children, value }) {
    return (
        <TabContext.Provider value={value}>
            {children}
        </TabContext.Provider>
    );
}

export default TabContext;
