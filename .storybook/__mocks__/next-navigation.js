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

// Shared state that can be configured per-story via decorator
let currentNavigation = {
  pathname: '/',
  params: {},
  searchParams: new URLSearchParams(),
};

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
}

/**
 * Mock useRouter (next/navigation version)
 * Returns push, replace, refresh, back, forward, prefetch
 */
export function useRouter() {
  const [, forceUpdate] = React.useState(0);

  return React.useMemo(() => ({
    push: (href, options) => {
      console.log('[Mock Navigation] push:', href, options);
      // Try to navigate to story if route maps to one
      const storyPath = convertRouteToStory(href);
      if (storyPath && typeof window !== 'undefined') {
        const iframe = window.parent;
        if (iframe) {
          iframe.postMessage({ type: 'storybook-navigate', path: storyPath }, '*');
        }
      }
      currentNavigation.pathname = typeof href === 'string' ? href : href.toString();
      forceUpdate(n => n + 1);
    },
    replace: (href, options) => {
      console.log('[Mock Navigation] replace:', href, options);
      currentNavigation.pathname = typeof href === 'string' ? href : href.toString();
      forceUpdate(n => n + 1);
    },
    refresh: () => {
      console.log('[Mock Navigation] refresh');
      forceUpdate(n => n + 1);
    },
    back: () => {
      console.log('[Mock Navigation] back');
    },
    forward: () => {
      console.log('[Mock Navigation] forward');
    },
    prefetch: (href) => {
      console.log('[Mock Navigation] prefetch:', href);
    },
  }), []);
}

/**
 * Mock usePathname
 * Returns the current pathname string
 */
export function usePathname() {
  return currentNavigation.pathname;
}

/**
 * Mock useParams
 * Returns route parameters (e.g., { id: 'abc', locale: 'en' })
 */
export function useParams() {
  return currentNavigation.params;
}

/**
 * Mock useSearchParams
 * Returns a read-only URLSearchParams instance
 */
export function useSearchParams() {
  return currentNavigation.searchParams;
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
export function redirect(url) {
  console.log('[Mock Navigation] redirect:', url);
  // In Storybook we just log — can't actually redirect
}

/**
 * Mock notFound
 */
export function notFound() {
  console.log('[Mock Navigation] notFound called');
}

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
