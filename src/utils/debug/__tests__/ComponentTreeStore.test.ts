import { describe, it, expect, beforeEach, vi } from 'vitest';
import ComponentTreeStore, { ComponentMetadata } from '../ComponentTreeStore';

describe('ComponentTreeStore', () => {
  let store: ComponentTreeStore;

  beforeEach(() => {
    // Create fresh instance for each test
    store = new ComponentTreeStore();
  });

  describe('register', () => {
    it('should register a new component', () => {
      const id = store.register('TestComponent', { foo: 'bar' }, { count: 0 });
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      
      const tree = store.getTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('TestComponent');
      expect(tree[0].id).toBe(id);
    });

    it('should store component metadata correctly', () => {
      const props = { label: 'Click me', disabled: false };
      const state = { isHovered: false };
      
      const id = store.register('Button', props, state);
      const tree = store.getTree();
      
      expect(tree[0]).toMatchObject({
        id,
        name: 'Button',
        props,
        state,
        renderCount: 1,
      });
      expect(tree[0].mountTime).toBeDefined();
      expect(tree[0].lastRenderTime).toBeDefined();
    });

    it('should increment render count on re-registration', () => {
      const id = store.register('Counter', {}, { count: 0 });
      
      expect(store.getTree()[0].renderCount).toBe(1);
      
      store.register('Counter', {}, { count: 1 }, id);
      expect(store.getTree()[0].renderCount).toBe(2);
      
      store.register('Counter', {}, { count: 2 }, id);
      expect(store.getTree()[0].renderCount).toBe(3);
    });

    it('should handle components with no state', () => {
      const id = store.register('StatelessComponent', { message: 'hello' });
      
      const tree = store.getTree();
      expect(tree[0].state).toBeUndefined();
    });

    it('should handle nested component relationships', () => {
      const parentId = store.register('Parent', {}, {});
      const child1Id = store.register('Child1', {}, {}, undefined, parentId);
      const child2Id = store.register('Child2', {}, {}, undefined, parentId);
      
      const tree = store.getTree();
      const parent = tree.find(c => c.id === parentId);
      
      expect(parent?.children).toContain(child1Id);
      expect(parent?.children).toContain(child2Id);
      expect(parent?.children).toHaveLength(2);
    });
  });

  describe('unregister', () => {
    it('should remove a component from the tree', () => {
      const id = store.register('Component', {}, {});
      
      expect(store.getTree()).toHaveLength(1);
      
      store.unregister(id);
      
      expect(store.getTree()).toHaveLength(0);
    });

    it('should handle unregistering non-existent component gracefully', () => {
      expect(() => {
        store.unregister('non-existent-id');
      }).not.toThrow();
      
      expect(store.getTree()).toHaveLength(0);
    });

    it('should remove component from parent children array', () => {
      const parentId = store.register('Parent', {}, {});
      const childId = store.register('Child', {}, {}, undefined, parentId);
      
      const parent = store.getTree().find(c => c.id === parentId);
      expect(parent?.children).toContain(childId);
      
      store.unregister(childId);
      
      const updatedParent = store.getTree().find(c => c.id === parentId);
      expect(updatedParent?.children).not.toContain(childId);
      expect(updatedParent?.children).toHaveLength(0);
    });
  });

  describe('getTree', () => {
    it('should return empty array when no components registered', () => {
      expect(store.getTree()).toEqual([]);
    });

    it('should return all registered components', () => {
      store.register('Component1', {}, {});
      store.register('Component2', {}, {});
      store.register('Component3', {}, {});
      
      expect(store.getTree()).toHaveLength(3);
    });

    it('should return a copy of the tree (not mutable reference)', () => {
      store.register('Component', {}, {});
      
      const tree1 = store.getTree();
      const tree2 = store.getTree();
      
      expect(tree1).toEqual(tree2);
      expect(tree1).not.toBe(tree2); // Different array instances
    });
  });

  describe('subscribe', () => {
    it('should call subscriber on component registration', async () => {
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      
      store.register('Component', {}, {});
      
      // Flush queueMicrotask
      await new Promise(resolve => queueMicrotask(resolve));
      
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ name: 'Component' })
      ]));
    });

    it('should call subscriber on component unregistration', async () => {
      const id = store.register('Component', {}, {});
      
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      
      store.unregister(id);
      
      // Flush queueMicrotask
      await new Promise(resolve => queueMicrotask(resolve));
      
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    it('should call subscriber on component re-render', async () => {
      const subscriber = vi.fn();
      const id = store.register('Component', {}, { count: 0 });
      
      store.subscribe(subscriber);
      
      // Flush microtask from register
      await new Promise(resolve => queueMicrotask(resolve));
      subscriber.mockClear();
      
      store.register('Component', {}, { count: 1 }, id);
      
      // Flush queueMicrotask
      await new Promise(resolve => queueMicrotask(resolve));
      
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should support multiple subscribers', async () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      
      store.subscribe(subscriber1);
      store.subscribe(subscriber2);
      
      store.register('Component', {}, {});
      
      // Flush queueMicrotask
      await new Promise(resolve => queueMicrotask(resolve));
      
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', async () => {
      const subscriber = vi.fn();
      const unsubscribe = store.subscribe(subscriber);
      
      store.register('Component1', {}, {});
      
      // Flush queueMicrotask
      await new Promise(resolve => queueMicrotask(resolve));
      expect(subscriber).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      subscriber.mockClear();
      
      store.register('Component2', {}, {});
      
      // Flush queueMicrotask
      await new Promise(resolve => queueMicrotask(resolve));
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('exportJSON', () => {
    it('should export tree as JSON string', () => {
      store.register('Component', { foo: 'bar' }, { count: 0 });
      
      const json = store.exportJSON();
      
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all component metadata in export', () => {
      const id = store.register('TestComponent', { label: 'test' }, { active: true });
      
      const exported = JSON.parse(store.exportJSON());
      
      expect(exported.tree).toHaveLength(1);
      expect(exported.tree[0]).toMatchObject({
        id,
        name: 'TestComponent',
        props: { label: 'test' },
        state: { active: true },
        renderCount: 1,
      });
      expect(exported.tree[0].mountTime).toBeDefined();
      expect(exported.tree[0].lastRenderTime).toBeDefined();
      expect(exported.timestamp).toBeDefined();
      expect(exported.metadata.totalComponents).toBe(1);
    });

    it('should export empty tree when no components registered', () => {
      const json = store.exportJSON();
      const exported = JSON.parse(json);
      expect(exported.tree).toEqual([]);
      expect(exported.metadata.totalComponents).toBe(0);
    });

    it('should handle circular references in props', () => {
      const circularProps: any = { name: 'test' };
      circularProps.self = circularProps;
      
      // Should not throw
      expect(() => {
        store.register('Component', circularProps, {});
        store.exportJSON();
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all components from tree', () => {
      store.register('Component1', {}, {});
      store.register('Component2', {}, {});
      store.register('Component3', {}, {});
      
      expect(store.getTree()).toHaveLength(3);
      
      store.clear();
      
      expect(store.getTree()).toHaveLength(0);
    });

    it('should notify subscribers after clearing', async () => {
      store.register('Component', {}, {});
      
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      
      store.clear();
      
      // Flush queueMicrotask
      await new Promise(resolve => queueMicrotask(resolve));
      
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    it('should reset component IDs', () => {
      const id1 = store.register('Component1', {}, {});
      store.clear();
      const id2 = store.register('Component2', {}, {});
      
      // IDs should be different (new counter)
      expect(id1).not.toBe(id2);
    });
  });

  describe('edge cases', () => {
    it('should handle components with undefined props', () => {
      const id = store.register('Component', undefined as any, {});
      const tree = store.getTree();
      
      // sanitizeProps(undefined) returns {}
      expect(tree[0].props).toEqual({});
    });

    it('should handle components with null state', () => {
      const id = store.register('Component', {}, null as any);
      const tree = store.getTree();
      
      // null is falsy, so the ternary returns undefined
      expect(tree[0].state).toBeUndefined();
    });

    it('should handle very long component names', () => {
      const longName = 'A'.repeat(1000);
      const id = store.register(longName, {}, {});
      
      expect(store.getTree()[0].name).toBe(longName);
    });

    it('should handle components with complex nested props', () => {
      const complexProps = {
        user: { id: 1, name: 'John', roles: ['admin', 'user'] },
        config: { theme: 'dark', settings: { notifications: true } },
        callbacks: { onClick: () => {}, onSubmit: () => {} },
      };
      
      const id = store.register('ComplexComponent', complexProps, {});
      const tree = store.getTree();
      
      expect(tree[0].props).toBeDefined();
    });
  });
});
