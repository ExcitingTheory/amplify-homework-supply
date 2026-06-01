"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "../utils/analytics";

/**
 * Automatically tracks page views on route changes.
 * Uses Next.js usePathname to detect navigation.
 */
export function usePageViewTracking() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname === previousPathRef.current) return;

    previousPathRef.current = pathname;
    trackPageView(pathname);
  }, [pathname]);
}
