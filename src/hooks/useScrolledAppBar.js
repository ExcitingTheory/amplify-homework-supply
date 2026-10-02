"use client";
/**
 * @fileoverview useScrolledAppBar - Shared hook for page-level AppBar shrink-on-scroll.
 * @module useScrolledAppBar
 *
 * Tracks window scroll position and returns an isScrolled boolean
 * that drives AppBar condensing (title shrink, description hide).
 * Uses hysteresis to prevent oscillation at the threshold boundary.
 */

import { useEffect, useState } from "react";

/**
 * True for the document itself or an element that scrolls the page content
 * (e.g. Storybook's fullscreen wrapper) — not horizontal strips, menus, or
 * drawers, whose scroll events would otherwise read as "back at the top".
 */
function isPageScroller(target) {
  if (!target || target === document || target === document.documentElement) {
    return true;
  }
  if (target.nodeType !== 1) return false;
  const main = document.querySelector("main");
  return Boolean(main && target !== main && target.contains(main));
}

/**
 * @param {Object} [options]
 * @param {number} [options.collapseThreshold=50] - Scroll position (px) to trigger collapse
 * @param {number} [options.expandThreshold=10] - Scroll position (px) to trigger expand (hysteresis)
 * @returns {boolean} isScrolled
 */
export function useScrolledAppBar({
  collapseThreshold = 50,
  expandThreshold = 10,
} = {}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let frame = null;
    let scroller = null;

    const update = () => {
      frame = null;
      const scrollTop =
        scroller &&
        scroller.nodeType === 1 &&
        scroller !== document.documentElement
          ? scroller.scrollTop
          : window.scrollY || document.documentElement.scrollTop;
      setIsScrolled((prev) => {
        if (!prev && scrollTop > collapseThreshold) return true;
        if (prev && scrollTop < expandThreshold) return false;
        return prev;
      });
    };

    // Coalesce bursts of scroll events into one read per animation frame.
    const handleScroll = (event) => {
      if (!isPageScroller(event.target)) return;
      scroller = event.target;
      if (frame == null) frame = requestAnimationFrame(update);
    };

    // capture:true because scroll events don't bubble, and the page may scroll
    // inside a wrapper element rather than the window.
    window.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [collapseThreshold, expandThreshold]);

  return isScrolled;
}
