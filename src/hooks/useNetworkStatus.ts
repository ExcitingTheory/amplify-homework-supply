"use client";
import { useState, useEffect, useCallback } from "react";

export interface NetworkStatus {
  /** Whether the browser reports an active network connection */
  isOnline: boolean;
  /** Timestamp of last connectivity change */
  lastChanged: number;
}

/**
 * Hook that tracks browser online/offline state.
 * Fires immediately on mount and whenever connectivity changes.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    lastChanged: 0,
  });

  const handleOnline = useCallback(() => {
    setStatus({ isOnline: true, lastChanged: Date.now() });
  }, []);

  const handleOffline = useCallback(() => {
    setStatus({ isOnline: false, lastChanged: Date.now() });
  }, []);

  useEffect(() => {
    // Sync with actual browser state after hydration
    setStatus({ isOnline: navigator.onLine, lastChanged: Date.now() });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}
