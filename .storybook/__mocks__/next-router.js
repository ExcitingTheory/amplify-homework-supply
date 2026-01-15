/**
 * Mock Next.js Router for Storybook
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
    return true;
  },
  replace: async (url, as, options) => {
    console.log('[Mock Router] replace:', { url, as, options });
    return true;
  },
  reload: () => console.log('[Mock Router] reload'),
  back: () => console.log('[Mock Router] back'),
  forward: () => console.log('[Mock Router] forward'),
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
