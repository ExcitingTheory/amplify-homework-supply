/**
 * useGlobalChatShortcut - Keyboard shortcut to toggle global chat
 * 
 * Listens for Cmd/Ctrl + Shift + C to toggle the global chat drawer.
 * 
 * @example
 * // In _app.jsx
 * function MyApp({ Component, pageProps }) {
 *   useGlobalChatShortcut();
 *   return <Component {...pageProps} />;
 * }
 * 
 * @see docs/GLOBAL_CHAT_INTEGRATION_PLAN.md
 */

import { useEffect, useContext } from 'react';
import ChatContext from '../context/chatContext';

/**
 * Hook to enable keyboard shortcut for toggling chat
 * 
 * Shortcut: Cmd+Shift+C (Mac) or Ctrl+Shift+C (Windows/Linux)
 * 
 * @param {boolean} [enabled=true] - Whether the shortcut is enabled
 */
export function useGlobalChatShortcut(enabled = true) {
    const { isChatOpen, setIsChatOpen } = useContext(ChatContext);
    
    useEffect(() => {
        if (!enabled) {
            return;
        }
        
        const handleKeyDown = (event) => {
            // Check for Cmd+Shift+C (Mac) or Ctrl+Shift+C (Windows/Linux)
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifierKey = isMac ? event.metaKey : event.ctrlKey;
            
            if (modifierKey && event.shiftKey && event.key === 'C') {
                // Prevent default browser behavior
                event.preventDefault();
                event.stopPropagation();
                
                // Toggle chat
                console.log('[useGlobalChatShortcut] Toggling chat via keyboard shortcut');
                setIsChatOpen(prev => !prev);
            }
        };
        
        // Add event listener
        window.addEventListener('keydown', handleKeyDown);
        
        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, isChatOpen, setIsChatOpen]);
}

export default useGlobalChatShortcut;
