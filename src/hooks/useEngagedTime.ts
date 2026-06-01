"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const READING_WINDOW_MS = 90_000; // 90s reading window — generous for L2 learners on rich content
const PERSIST_INTERVAL_MS = 30_000; // Save every 30s while active
const TICK_INTERVAL_MS = 1_000; // Accumulate every 1s

interface UseEngagedTimeOptions {
  /** Initial accumulated time in ms (from Grade.engagedTimeMs) */
  initialMs?: number;
  /** Reading window in ms — how long the timer runs after last interaction before pausing (default 90s) */
  readingWindow?: number;
  /** Whether tracking is enabled (false to pause externally) */
  enabled?: boolean;
  /** Called periodically and on pause with accumulated ms */
  onPersist?: (totalMs: number) => void;
  /** Persist interval in ms (default 30s) */
  persistInterval?: number;
}

interface UseEngagedTimeReturn {
  /** Current accumulated engaged time in ms */
  engagedTimeMs: number;
  /** Whether the timer is currently running */
  isActive: boolean;
  /** Manually pause tracking */
  pause: () => void;
  /** Manually resume tracking */
  resume: () => void;
  /** Reset accumulated time */
  reset: (newInitialMs?: number) => void;
}

/**
 * Tracks engaged time — only accumulates while:
 * 1. The document/tab is visible (Page Visibility API)
 * 2. The window is focused
 * 3. User interacted within the reading window (90s default)
 *
 * The reading window allows passive reading without penalizing students
 * who aren't constantly moving the mouse, while still pausing if they
 * walk away. Any interaction resets the window.
 *
 * Calls onPersist periodically so the value can be saved to the Grade record.
 */
export function useEngagedTime({
  initialMs = 0,
  readingWindow = READING_WINDOW_MS,
  enabled = true,
  onPersist,
  persistInterval = PERSIST_INTERVAL_MS,
}: UseEngagedTimeOptions = {}): UseEngagedTimeReturn {
  const [engagedTimeMs, setEngagedTimeMs] = useState(initialMs);
  const [isActive, setIsActive] = useState(false);

  // Refs for internal state that shouldn't trigger rerenders
  const accumulatedRef = useRef(initialMs);
  const isActiveRef = useRef(false);
  const readingWindowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const lastPersistRef = useRef(initialMs);
  const enabledRef = useRef(enabled);
  const onPersistRef = useRef(onPersist);

  // Keep refs in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    onPersistRef.current = onPersist;
  }, [onPersist]);

  const startTicking = useCallback(() => {
    if (tickIntervalRef.current) return;
    tickIntervalRef.current = setInterval(() => {
      accumulatedRef.current += TICK_INTERVAL_MS;
      setEngagedTimeMs(accumulatedRef.current);
    }, TICK_INTERVAL_MS);
  }, []);

  const stopTicking = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const persist = useCallback(() => {
    if (accumulatedRef.current !== lastPersistRef.current) {
      lastPersistRef.current = accumulatedRef.current;
      onPersistRef.current?.(accumulatedRef.current);
    }
  }, []);

  const activate = useCallback(() => {
    if (!enabledRef.current) return;
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      setIsActive(true);
      startTicking();
    }
  }, [startTicking]);

  const deactivate = useCallback(() => {
    if (isActiveRef.current) {
      isActiveRef.current = false;
      setIsActive(false);
      stopTicking();
      persist();
    }
  }, [stopTicking, persist]);

  const resetReadingWindow = useCallback(() => {
    if (readingWindowTimerRef.current) {
      clearTimeout(readingWindowTimerRef.current);
    }
    readingWindowTimerRef.current = setTimeout(() => {
      deactivate();
    }, readingWindow);
  }, [readingWindow, deactivate]);

  const handleInteraction = useCallback(() => {
    if (!enabledRef.current) return;
    activate();
    resetReadingWindow();
  }, [activate, resetReadingWindow]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      deactivate();
    } else if (enabledRef.current) {
      // Tab became visible again — resume with a fresh reading window
      activate();
      resetReadingWindow();
    }
  }, [deactivate, activate, resetReadingWindow]);

  const handleWindowBlur = useCallback(() => {
    deactivate();
  }, [deactivate]);

  const handleWindowFocus = useCallback(() => {
    if (!enabledRef.current) return;
    // Window refocused — resume with a fresh reading window
    if (!document.hidden) {
      activate();
      resetReadingWindow();
    }
  }, [activate, resetReadingWindow]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) {
      deactivate();
      return;
    }

    const interactionEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
    ] as const;

    // Start reading window immediately (user must interact to begin tracking)
    resetReadingWindow();

    for (const event of interactionEvents) {
      document.addEventListener(event, handleInteraction, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      for (const event of interactionEvents) {
        document.removeEventListener(event, handleInteraction);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);

      if (readingWindowTimerRef.current)
        clearTimeout(readingWindowTimerRef.current);
      stopTicking();
      persist();
    };
  }, [
    enabled,
    handleInteraction,
    handleVisibilityChange,
    handleWindowBlur,
    handleWindowFocus,
    resetReadingWindow,
    stopTicking,
    deactivate,
    persist,
  ]);

  // Periodic persist while active
  useEffect(() => {
    if (!enabled || !onPersist) return;

    persistIntervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        persist();
      }
    }, persistInterval);

    return () => {
      if (persistIntervalRef.current) {
        clearInterval(persistIntervalRef.current);
        persistIntervalRef.current = null;
      }
    };
  }, [enabled, onPersist, persistInterval, persist]);

  const pause = useCallback(() => {
    deactivate();
  }, [deactivate]);

  const resume = useCallback(() => {
    handleInteraction();
  }, [handleInteraction]);

  const reset = useCallback(
    (newInitialMs = 0) => {
      stopTicking();
      accumulatedRef.current = newInitialMs;
      lastPersistRef.current = newInitialMs;
      setEngagedTimeMs(newInitialMs);
      isActiveRef.current = false;
      setIsActive(false);
    },
    [stopTicking],
  );

  return { engagedTimeMs, isActive, pause, resume, reset };
}
