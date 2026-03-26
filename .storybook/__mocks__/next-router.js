/**
 * Mock Next.js Router for Storybook
 * 
 * Features:
 * - Intercepts router.push/replace to navigate between Storybook stories
 * - Maps Next.js routes to corresponding story paths
 * - Tracks navigation for onboarding task completion
 * 
 * Usage in stories:
 * 
 * export default {
 *   title: 'Components/MyComponent',
 *   parameters: {
 *     nextRouter: {
 *       pathname: '/units/[id]',
 *       query: { id: 'unit-123' },
 *       asPath: '/units/unit-123',
 *     }
 *   }
 * };
 */

import React from 'react';
import { convertRouteToStory } from '../code/route-map';
import { getOnboardingEmitter } from '../code/onboarding-events';

// Router context that will be provided by the decorator in preview.jsx
const RouterContext = React.createContext(null);

/**
 * Mock useRouter hook
 * Returns the router from context which is configured per story
 */
export const useRouter = () => {
  const router = React.useContext(RouterContext);
  
  if (!router) {
    console.warn('[Mock Router] useRouter called outside of RouterContext. Using default router.');
    return createMockRouter();
  }
  
  return router;
};

/**
 * Navigate to a story within Storybook
 * 
 * @param storyPath - Storybook query parameter (e.g., '?path=/story/pages-units--default')
 */
function navigateToStory(storyPath) {
  if (!storyPath) {
    console.warn('[Mock Router] Cannot navigate - no story path found');
    return;
  }
  
  try {
    // Update the parent window URL (Storybook manager)
    if (window.parent && window.parent !== window) {
      const currentUrl = new URL(window.parent.location.href);
      const newUrl = new URL(currentUrl.origin + '/');
      
      // Parse story path and add to new URL
      const params = new URLSearchParams(storyPath.replace('?', ''));
      params.forEach((value, key) => {
        newUrl.searchParams.set(key, value);
      });
      
      console.log('[Mock Router] Navigating to story:', newUrl.toString());
      window.parent.location.href = newUrl.toString();
    }
  } catch (error) {
    console.error('[Mock Router] Navigation failed:', error);
  }
}

/**
 * Track navigation event for onboarding
 * 
 * @param route - Route being navigated to
 * @param method - Navigation method ('push' or 'replace')
 */
function trackNavigation(route, method) {
  try {
    const emitter = getOnboardingEmitter();
    const persona = emitter.getPersona();
    
    if (persona) {
      emitter.emit({
        type: 'action-performed',
        actionName: `router.${method}`,
        storyId: 'navigation',
        persona,
        timestamp: Date.now(),
        metadata: {
          route,
          method,
          component: 'Router',
        },
      });
    }
  } catch (error) {
    console.error('[Mock Router] Failed to track navigation:', error);
  }
}

/**
 * Create a mock router object
 */
export const createMockRouter = (overrides = {}) => ({
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
  push: async (url, as, options) => {
    console.log('[Mock Router] push:', { url, as, options });
    
    // Track navigation
    trackNavigation(url, 'push');
    
    // Convert route to story and navigate
    if (typeof url === 'string') {
      const storyPath = convertRouteToStory(url);
      if (storyPath) {
        navigateToStory(storyPath);
      }
    }
    
    return true;
  },
  replace: async (url, as, options) => {
    console.log('[Mock Router] replace:', { url, as, options });
    
    // Track navigation
    trackNavigation(url, 'replace');
    
    // Convert route to story and navigate
    if (typeof url === 'string') {
      const storyPath = convertRouteToStory(url);
      if (storyPath) {
        navigateToStory(storyPath);
      }
    }
    
    return true;
  },
  reload: () => {
    console.log('[Mock Router] reload (no-op in Storybook)');
  },
  back: () => {
    console.log('[Mock Router] back');
    window.parent.history.back();
  },
  forward: () => {
    console.log('[Mock Router] forward');
    window.parent.history.forward();
  },
  prefetch: async () => console.log('[Mock Router] prefetch'),
  beforePopState: () => console.log('[Mock Router] beforePopState'),
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
  isFallback: false,
  ...overrides,
});

/**
 * Mock withRouter HOC
 */
export const withRouter = (Component) => {
  const WithRouterComponent = (props) => {
    const router = useRouter();
    return <Component {...props} router={router} />;
  };
  
  WithRouterComponent.displayName = `withRouter(${Component.displayName || Component.name || 'Component'})`;
  
  return WithRouterComponent;
};

// Export RouterContext so preview.jsx can use it
export { RouterContext };

export default {
  useRouter,
  withRouter,
  RouterContext,
};
