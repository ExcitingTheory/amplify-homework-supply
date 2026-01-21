/**
 * YjsProvider Tests
 * 
 * Unit tests for Yjs provider functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { YjsDocProvider } from '../YjsProvider'

describe('YjsDocProvider', () => {
  let provider: YjsDocProvider

  beforeEach(() => {
    provider = new YjsDocProvider({
      docName: 'test-doc',
      connect: false, // Don't connect to WebSocket in tests
      persistence: false, // Don't use IndexedDB in tests
    })
  })

  afterEach(() => {
    provider.destroy()
  })

  describe('Basic Operations', () => {
    it('should create a Y.Map', () => {
      const ymap = provider.getMap('test')
      expect(ymap).toBeInstanceOf(Y.Map)
    })

    it('should create a Y.Array', () => {
      const yarray = provider.getArray('test')
      expect(yarray).toBeInstanceOf(Y.Array)
    })

    it('should create a Y.Text', () => {
      const ytext = provider.getText('test')
      expect(ytext).toBeInstanceOf(Y.Text)
    })

    it('should get underlying Y.Doc', () => {
      const ydoc = provider.getDoc()
      expect(ydoc).toBeInstanceOf(Y.Doc)
    })
  })

  describe('Y.Map Operations', () => {
    it('should set and get values in Y.Map', () => {
      const ymap = provider.getMap('test')

      ymap.set('key1', 'value1')
      ymap.set('key2', 42)

      expect(ymap.get('key1')).toBe('value1')
      expect(ymap.get('key2')).toBe(42)
    })

    it('should observe Y.Map changes', (done) => {
      const ymap = provider.getMap('test')
      let callCount = 0

      const unobserve = provider.onUpdate((update) => {
        callCount++
      })

      ymap.set('key', 'value')

      setTimeout(() => {
        expect(callCount).toBeGreaterThan(0)
        unobserve()
        done()
      }, 100)
    })
  })

  describe('Y.Array Operations', () => {
    it('should push items to Y.Array', () => {
      const yarray = provider.getArray('test')

      yarray.push(['item1', 'item2'])

      expect(yarray.length).toBe(2)
      expect(yarray.toArray()).toEqual(['item1', 'item2'])
    })

    it('should insert items in Y.Array', () => {
      const yarray = provider.getArray('test')

      yarray.push(['a', 'c'])
      yarray.insert(1, ['b'])

      expect(yarray.toArray()).toEqual(['a', 'b', 'c'])
    })

    it('should delete items from Y.Array', () => {
      const yarray = provider.getArray('test')

      yarray.push(['a', 'b', 'c'])
      yarray.delete(1, 1)

      expect(yarray.toArray()).toEqual(['a', 'c'])
    })
  })

  describe('Y.Text Operations', () => {
    it('should insert text', () => {
      const ytext = provider.getText('test')

      ytext.insert(0, 'Hello')

      expect(ytext.toString()).toBe('Hello')
    })

    it('should delete text', () => {
      const ytext = provider.getText('test')

      ytext.insert(0, 'Hello World')
      ytext.delete(5, 6)

      expect(ytext.toString()).toBe('Hello')
    })

    it('should format text', () => {
      const ytext = provider.getText('test')

      ytext.insert(0, 'Hello')
      ytext.format(0, 5, { bold: true })

      // Note: format returns void, we're just testing it doesn't throw
      expect(ytext.length).toBe(5)
    })
  })

  describe('Awareness', () => {
    it('should get awareness', () => {
      const awareness = provider.getAwareness()
      expect(awareness).toBeInstanceOf(Awareness)
    })

    it('should set and get local state', () => {
      const awareness = provider.getAwareness()
      const state = { user: { name: 'John' }, color: '#ff0000' }

      provider.setAwareness(state)
      const localState = awareness.getLocalState()

      expect(localState).toEqual(state)
    })

    it('should get connected clients', () => {
      const awareness = provider.getAwareness()
      const clients = provider.getConnectedClients()

      expect(Array.isArray(clients)).toBe(true)
      expect(clients.length).toBeGreaterThan(0) // At least current client
    })
  })

  describe('State Management', () => {
    it('should get encoded state', () => {
      const ymap = provider.getMap('test')
      ymap.set('key', 'value')

      const state = provider.getState()
      expect(state).toBeInstanceOf(Uint8Array)
      expect(state.length).toBeGreaterThan(0)
    })

    it('should get state vector', () => {
      const ymap = provider.getMap('test')
      ymap.set('key', 'value')

      const vector = provider.getStateVector()
      expect(vector).toBeInstanceOf(Uint8Array)
    })

    it('should apply updates', () => {
      const provider1 = new YjsDocProvider({
        docName: 'test-1',
        connect: false,
        persistence: false,
      })
      const provider2 = new YjsDocProvider({
        docName: 'test-2',
        connect: false,
        persistence: false,
      })

      // Make change in provider1
      const ymap1 = provider1.getMap('data')
      ymap1.set('key', 'value')

      // Get update
      const state = provider1.getState()

      // Apply to provider2
      provider2.applyUpdate(state)
      const ymap2 = provider2.getMap('data')

      expect(ymap2.get('key')).toBe('value')

      provider1.destroy()
      provider2.destroy()
    })
  })

  describe('Transaction Handling', () => {
    it('should handle transactions', (done) => {
      const ydoc = provider.getDoc()
      let eventFired = false

      const unsubscribe = provider.onUpdate(() => {
        eventFired = true
      })

      Y.transact(ydoc, () => {
        const ymap = ydoc.getMap('test')
        ymap.set('key', 'value')
      })

      setTimeout(() => {
        expect(eventFired).toBe(true)
        unsubscribe()
        done()
      }, 100)
    })
  })

  describe('Cleanup', () => {
    it('should clear all data', () => {
      const ymap = provider.getMap('test')
      ymap.set('key1', 'value1')
      ymap.set('key2', 'value2')

      provider.clear()

      expect(ymap.size).toBe(0)
    })

    it('should destroy provider gracefully', () => {
      const ymap = provider.getMap('test')
      ymap.set('key', 'value')

      expect(() => {
        provider.destroy()
      }).not.toThrow()
    })
  })
})
