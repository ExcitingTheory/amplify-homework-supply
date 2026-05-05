/**
 * @fileoverview useScrolledAppBar - Shared hook for page-level AppBar shrink-on-scroll.
 * @module useScrolledAppBar
 *
 * Tracks window scroll position and returns an isScrolled boolean
 * that drives AppBar condensing (title shrink, description hide).
 * Uses hysteresis to prevent oscillation at the threshold boundary.
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * @param {Object} [options]
 * @param {number} [options.collapseThreshold=50] - Scroll position (px) to trigger collapse
 * @param {number} [options.expandThreshold=10] - Scroll position (px) to trigger expand (hysteresis)
 * @returns {boolean} isScrolled
 */
export function useScrolledAppBar({ collapseThreshold = 50, expandThreshold = 10 } = {}) {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    setIsScrolled((prev) => {
      if (!prev && scrollTop > collapseThreshold) return true;
      if (prev && scrollTop < expandThreshold) return false;
      return prev;
    });
  }, [collapseThreshold, expandThreshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return isScrolled;
}
