/**
 * useComponent Inspector Hook
 * 
 * Registers component in debug tree and tracks lifecycle
 * Automatically unregisters on unmount
 */

import { useEffect, useRef } from 'react';
import { sanitizeProps, sanitizeState } from './sanitizeComponentData';

/**
 * Hook to register component in debug tree
 * Tracks component lifecycle, props, state, and render count
 * 
 * @param componentName - Name of the component
 * @param props - Component props
 * @param state - Component state (optional)
 * @returns Current render count
 * 
 * @example
 * ```typescript
 * function MyComponent(props: MyProps) {
 *   const [count, setCount] = useState(0);
 *   const renderCount = useComponentInspector('MyComponent', props, { count });
 *   
 *   return <div>{count} (render #{renderCount})</div>;
 * }
 * ```
 */
export function useComponentInspector(
  componentName: string,
  props: Record<string, unknown>,
  state?: Record<string, unknown>
): number {
  const componentIdRef = useRef<string | undefined>(undefined);
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    // Only register if ComponentTreeStore is available
    if (typeof window !== 'undefined' && window.__COMPONENT_TREE__) {
      const sanitizedProps = sanitizeProps(props);
      const sanitizedState = state ? sanitizeState(state) : undefined;
      
      // Register or update component (pass existing ID for re-renders)
      componentIdRef.current = window.__COMPONENT_TREE__.register(
        componentName,
        sanitizedProps,
        sanitizedState,
        componentIdRef.current
      );
    }
    
    // Unregister on unmount
    return () => {
      if (typeof window !== 'undefined' && window.__COMPONENT_TREE__ && componentIdRef.current) {
        window.__COMPONENT_TREE__.unregister(componentIdRef.current);
      }
    };
  }, [componentName, props, state]);
  
  // Return render count for debugging purposes
  return renderCount.current;
}

export default useComponentInspector;
