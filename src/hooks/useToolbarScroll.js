/**
 * @fileoverview useToolbarScroll - Shared hook for toolbar horizontal scroll with arrow indicators.
 * @module useToolbarScroll
 *
 * Provides scroll state and handlers for horizontally scrollable toolbars.
 * Arrow visibility matches MUI TabScrollButton behavior for consistency.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @param {Object} [options]
 * @param {number} [options.scrollAmount=200] - Pixels to scroll per arrow click
 * @returns {{ toolbarRef: React.RefObject, showLeftArrow: boolean, showRightArrow: boolean, scrollToolbar: (direction: 'left' | 'right') => void, checkToolbarOverflow: () => void }}
 */
export function useToolbarScroll({ scrollAmount = 200 } = {}) {
  const toolbarRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkToolbarOverflow = useCallback(() => {
    if (toolbarRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = toolbarRef.current;
      const hasOverflow = scrollWidth > clientWidth;
      setShowLeftArrow(hasOverflow && scrollLeft > 5);
      setShowRightArrow(hasOverflow && scrollLeft + clientWidth < scrollWidth - 5);
    }
  }, []);

  const scrollToolbar = useCallback(
    (direction) => {
      if (toolbarRef.current) {
        const targetScroll =
          direction === 'left'
            ? toolbarRef.current.scrollLeft - scrollAmount
            : toolbarRef.current.scrollLeft + scrollAmount;

        toolbarRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        });

        // Check overflow after scroll animation completes
        setTimeout(checkToolbarOverflow, 350);
      }
    },
    [scrollAmount, checkToolbarOverflow],
  );

  // Check overflow on mount, resize, and content changes
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;

    // Initial check with small delay for render
    const timer = setTimeout(checkToolbarOverflow, 100);

    window.addEventListener('resize', checkToolbarOverflow);

    const observer = new MutationObserver(checkToolbarOverflow);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkToolbarOverflow);
      observer.disconnect();
    };
  }, [checkToolbarOverflow]);

  return {
    toolbarRef,
    showLeftArrow,
    showRightArrow,
    scrollToolbar,
    checkToolbarOverflow,
  };
}
