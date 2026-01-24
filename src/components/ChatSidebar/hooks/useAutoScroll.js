/**
 * useAutoScroll Hook
 * 
 * Manages automatic scrolling behavior for chat messages.
 * - Auto-scrolls to bottom when new messages arrive (if already at bottom)
 * - Shows "new messages" indicator when user has scrolled up
 * - Provides manual scroll-to-bottom function
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * @param {Array} messages - Array of message objects
 * @param {React.RefObject} containerRef - Ref to scrollable container
 * @param {Object} options - Configuration options
 * @param {number} options.bottomThreshold - Distance from bottom to consider "at bottom" (px)
 * @param {boolean} options.smoothScroll - Use smooth scrolling animation
 * @returns {Object} Scroll state and control functions
 */
export const useAutoScroll = (
  messages, 
  containerRef,
  options = {}
) => {
  const {
    bottomThreshold = 50,
    smoothScroll = true,
  } = options;
  
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const previousMessageCountRef = useRef(messages.length);
  
  /**
   * Check if scrolled to bottom
   */
  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return false;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom < bottomThreshold;
  }, [containerRef, bottomThreshold]);
  
  /**
   * Handle scroll event
   */
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    
    // Clear "new messages" indicator when user scrolls to bottom
    if (atBottom) {
      setHasNewMessages(false);
    }
  }, [checkIfAtBottom]);
  
  /**
   * Scroll to bottom programmatically
   */
  const scrollToBottom = useCallback((force = false) => {
    if (!containerRef.current) return;
    
    const behavior = smoothScroll && !force ? 'smooth' : 'auto';
    
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior,
    });
    
    setIsAtBottom(true);
    setHasNewMessages(false);
  }, [containerRef, smoothScroll]);
  
  /**
   * Auto-scroll on new messages if at bottom
   */
  useEffect(() => {
    const messageCountChanged = messages.length !== previousMessageCountRef.current;
    const newMessagesAdded = messages.length > previousMessageCountRef.current;
    
    if (messageCountChanged) {
      previousMessageCountRef.current = messages.length;
      
      if (newMessagesAdded) {
        if (isAtBottom) {
          // Auto-scroll if already at bottom
          // Use setTimeout to ensure DOM has updated
          setTimeout(() => scrollToBottom(), 0);
        } else {
          // Show indicator if user has scrolled up
          setHasNewMessages(true);
        }
      }
    }
  }, [messages.length, isAtBottom, scrollToBottom]);
  
  /**
   * Scroll to bottom on initial mount
   */
  useEffect(() => {
    if (messages.length > 0) {
      // Force instant scroll on mount
      scrollToBottom(true);
    }
  }, []); // Only on mount
  
  return {
    isAtBottom,
    hasNewMessages,
    scrollToBottom,
    handleScroll,
  };
};

export default useAutoScroll;
