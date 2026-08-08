/**
 * Mock next/navigation for Storybook (App Router)
 * 
 * Replaces the Pages Router mock (next-router.js) with App Router equivalents.
 * Components that import from 'next/navigation' will get these mocks.
 * 
 * Story-level configuration via parameters.nextjs.navigation:
 * 
 * export default {
 *   parameters: {
 *     nextjs: {
 *       navigation: {
 *         pathname: '/units/unit-123',
 *         params: { id: 'unit-123', locale: 'en' },
 *         searchParams: { tab: 'content' },
 *       }
 *     }
 *   }
 * };
 */

import React from 'react';
import { convertRouteToStory } from '../code/route-map';

function navigateToStory(storyPath) {
  if (!storyPath || typeof window === 'undefined') return;

  try {
    if (window.parent && window.parent !== window) {
      const currentUrl = new URL(window.parent.location.href);
      const newUrl = new URL(currentUrl.origin + '/');
      const params = new URLSearchParams(storyPath.replace('?', ''));
      params.forEach((value, key) => {
        newUrl.searchParams.set(key, value);
      });
      window.parent.location.href = newUrl.toString();
    } else {
      window.location.href = storyPath;
    }
  } catch (error) {
    console.error('[Mock Navigation] Story navigation failed:', error);
  }
}

// Shared state that can be configured per-story via decorator
let currentNavigation = {
  pathname: '/',
  params: {},
  searchParams: new URLSearchParams(),
};

// Listeners for reactive updates via useSyncExternalStore
const navigationListeners = new Set();

/**
 * Configure navigation state for a story.
 * Called by the preview decorator before rendering.
 */
export function setNavigationState(state) {
  currentNavigation = {
    pathname: state?.pathname || '/',
    params: state?.params || {},
    searchParams: state?.searchParams instanceof URLSearchParams
      ? state.searchParams
      : new URLSearchParams(state?.searchParams || {}),
  };
  // Notify all reactive subscribers so components re-render with new params
  navigationListeners.forEach(listener => listener());
}

/**
 * Mock useRouter (next/navigation version)
 * Returns push, replace, refresh, back, forward, prefetch
 */
export function useRouter() {
  const [, forceUpdate] = React.useState(0);

  const resolveHref = (href) => {
    if (typeof href === 'string') return href;
    if (href && typeof href === 'object') {
      const pathname = href.pathname || '/';
      const query = href.query ? new URLSearchParams(href.query).toString() : '';
      const hash = href.hash ? `#${href.hash}` : '';
      return `${pathname}${query ? `?${query}` : ''}${hash}`;
    }
    return '/';
  };

  return React.useMemo(() => ({
    push: (href, options) => {
      // Try to navigate to story if route maps to one
      const resolvedHref = resolveHref(href);
      const storyPath = convertRouteToStory(resolvedHref);
      if (storyPath) {
        navigateToStory(storyPath);
      }
      currentNavigation.pathname = resolvedHref;
      forceUpdate(n => n + 1);
    },
    replace: (href, options) => {
      const resolvedHref = resolveHref(href);
      const storyPath = convertRouteToStory(resolvedHref);
      if (storyPath) {
        navigateToStory(storyPath);
      }
      currentNavigation.pathname = resolvedHref;
      forceUpdate(n => n + 1);
    },
    refresh: () => {
      forceUpdate(n => n + 1);
    },
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  }), []);
}

/**
 * Mock usePathname
 * Returns the current pathname string
 */
export function usePathname() {
  return React.useSyncExternalStore(
    (callback) => {
      navigationListeners.add(callback);
      return () => navigationListeners.delete(callback);
    },
    () => currentNavigation.pathname,
    () => currentNavigation.pathname,
  );
}

/**
 * Mock useParams
 * Returns route parameters (e.g., { id: 'abc', locale: 'en' })
 * Reactive: re-renders component when setNavigationState is called.
 */
export function useParams() {
  const params = React.useSyncExternalStore(
    (callback) => {
      navigationListeners.add(callback);
      return () => navigationListeners.delete(callback);
    },
    () => currentNavigation.params,
    () => currentNavigation.params,
  );
  return params;
}

/**
 * Mock useSearchParams
 * Returns a read-only URLSearchParams instance
 * Reactive: re-renders component when setNavigationState is called.
 */
export function useSearchParams() {
  return React.useSyncExternalStore(
    (callback) => {
      navigationListeners.add(callback);
      return () => navigationListeners.delete(callback);
    },
    () => currentNavigation.searchParams,
    () => currentNavigation.searchParams,
  );
}

/**
 * Mock useSelectedLayoutSegment
 */
export function useSelectedLayoutSegment() {
  const segments = currentNavigation.pathname.split('/').filter(Boolean);
  return segments[segments.length - 1] || null;
}

/**
 * Mock useSelectedLayoutSegments
 */
export function useSelectedLayoutSegments() {
  return currentNavigation.pathname.split('/').filter(Boolean);
}

/**
 * Mock redirect (throws to simulate server redirect)
 */
export function redirect(_url) {
  // In Storybook we just no-op
}

/**
 * Mock notFound
 */
export function notFound() {}

/**
 * Mock Link component (next/link)
 * Renders as an anchor tag with onClick handler
 */
export function Link({ href, children, ...props }) {
  const router = useRouter();
  const handleClick = (e) => {
    e.preventDefault();
    router.push(href);
  };
  return React.createElement('a', { href, onClick: handleClick, ...props }, children);
}

// Re-export for compatibility with different import patterns
export default {
  useRouter,
  usePathname,
  useParams,
  useSearchParams,
  useSelectedLayoutSegment,
  useSelectedLayoutSegments,
  redirect,
  notFound,
  Link,
};
