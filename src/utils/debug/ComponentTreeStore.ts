/**
 * ComponentTreeStore - Tracks React component hierarchy for debugging
 * 
 * Maintains a registry of mounted components with their props, state, and metadata.
 * Provides real-time updates through subscriptions.
 * 
 * @example
 * ```typescript
 * // Register component
 * window.__COMPONENT_TREE__.register({
 *   name: 'MyComponent',
 *   props: { id: 123 },
 *   state: { count: 0 },
 *   mountTime: Date.now(),
 *   renderCount: 1,
 *   lastRenderTime: Date.now()
 * });
 * 
 * // Subscribe to updates
 * const unsubscribe = window.__COMPONENT_TREE__.subscribe(tree => {
 *   console.log('Component tree updated:', tree);
 * });
 * ```
 */

import { sanitizeProps, sanitizeState } from './sanitizeComponentData';

/**
 * Metadata about a single component instance
 */
export interface ComponentMetadata {
  /** Unique identifier (generated from name + mountTime) */
  id: string;
  /** Component name */
  name: string;
  /** Sanitized props object */
  props?: Record<string, unknown>;
  /** Sanitized state object */
  state?: Record<string, unknown>;
  /** Timestamp when component mounted */
  mountTime: number;
  /** Number of times component has rendered */
  renderCount: number;
  /** Timestamp of most recent render */
  lastRenderTime: number;
  /** Child component IDs (for future hierarchy support) */
  children: string[];
}

/**
 * Data required to register a new component (before ID and children are added)
 */
export type ComponentRegistrationData = Omit<ComponentMetadata, 'id' | 'children'>;

/**
 * Listener function that receives updated component tree
 */
export type TreeListener = (tree: ComponentMetadata[]) => void;

/**
 * ComponentTreeStore class - Maintains global component registry
 */
class ComponentTreeStore {
  private tree: Map<string, ComponentMetadata>;
  private listeners: Set<TreeListener>;

  constructor() {
    this.tree = new Map();
    this.listeners = new Set();
  }

  /**
   * Register a component in the tree
   * @param name - Component name
   * @param props - Component props
   * @param state - Component state (optional)
   * @param existingId - Existing component ID for re-renders (optional)
   * @param parentId - Parent component ID (optional)
   * @returns Component ID
   */
  register(
    name: string,
    props: Record<string, unknown>,
    state?: Record<string, unknown>,
    existingId?: string,
    parentId?: string
  ): string {
    const now = Date.now();
    
    // Sanitize props and state to remove circular references
    const sanitizedProps = sanitizeProps(props);
    const sanitizedState = state ? sanitizeState(state) : undefined;
    
    if (existingId && this.tree.has(existingId)) {
      // Update existing component (re-render)
      const existing = this.tree.get(existingId)!;
      this.tree.set(existingId, {
        ...existing,
        props: sanitizedProps,
        state: sanitizedState,
        renderCount: existing.renderCount + 1,
        lastRenderTime: now,
      });
      this.notifyListeners();
      return existingId;
    }
    
    // Create new component
    const id = `${name}-${now}`;
    this.tree.set(id, {
      id,
      name,
      props: sanitizedProps,
      state: sanitizedState,
      mountTime: now,
      renderCount: 1,
      lastRenderTime: now,
      children: [],
    });
    
    // Add to parent if specified
    if (parentId && this.tree.has(parentId)) {
      const parent = this.tree.get(parentId)!;
      parent.children.push(id);
    }
    
    this.notifyListeners();
    return id;
  }

  /**
   * Unregister a component from the tree
   * @param id - Component ID to remove
   */
  unregister(id: string): void {
    // Remove from all parent children arrays
    for (const component of this.tree.values()) {
      const childIndex = component.children.indexOf(id);
      if (childIndex !== -1) {
        component.children.splice(childIndex, 1);
      }
    }
    
    // Remove component itself
    this.tree.delete(id);
    this.notifyListeners();
  }

  /**
   * Get the current component tree
   * @returns Array of all registered components
   */
  getTree(): ComponentMetadata[] {
    return [...this.tree.values()];
  }

  /**
   * Subscribe to tree updates
   * @param listener - Callback function receiving updated tree
   * @returns Unsubscribe function
   */
  subscribe(listener: TreeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of tree changes
   * @private
   */
  private notifyListeners(): void {
    const tree = this.getTree();
    this.listeners.forEach(listener => listener(tree));
  }

  /**
   * Export tree as JSON
   * @returns JSON representation of component tree
   */
  exportJSON(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      tree: this.getTree(),
      metadata: {
        totalComponents: this.tree.size,
        version: '1.0.0',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      }
    }, null, 2);
  }

  /**
   * Clear all components from the tree
   */
  clear(): void {
    this.tree.clear();
    this.notifyListeners();
  }
}

// Initialize global singleton
if (typeof window !== 'undefined') {
  window.__COMPONENT_TREE__ = new ComponentTreeStore();
}

export default ComponentTreeStore;
