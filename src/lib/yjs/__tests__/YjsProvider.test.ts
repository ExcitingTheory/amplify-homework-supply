/**
 * YjsProvider Tests
 * 
 * Unit tests for Yjs provider functionality
 */

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
      expect(ymap).to.be.instanceOf(Y.Map)
    })

    it('should create a Y.Array', () => {
      const yarray = provider.getArray('test')
      expect(yarray).to.be.instanceOf(Y.Array)
    })

    it('should create a Y.Text', () => {
      const ytext = provider.getText('test')
      expect(ytext).to.be.instanceOf(Y.Text)
    })

    it('should get underlying Y.Doc', () => {
      const ydoc = provider.getDoc()
      expect(ydoc).to.be.instanceOf(Y.Doc)
    })
  })

  describe('Y.Map Operations', () => {
    it('should set and get values in Y.Map', () => {
      const ymap = provider.getMap('test')

      ymap.set('key1', 'value1')
      ymap.set('key2', 42)

      expect(ymap.get('key1')).to.equal('value1')
      expect(ymap.get('key2')).to.equal(42)
    })

    it('should observe Y.Map changes', (done) => {
      const ymap = provider.getMap('test')
      let callCount = 0

      const unobserve = provider.onUpdate((update) => {
        callCount++
      })

      ymap.set('key', 'value')

      setTimeout(() => {
        expect(callCount).to.be.greaterThan(0)
        unobserve()
        done()
      }, 100)
    })
  })

  describe('Y.Array Operations', () => {
    it('should push items to Y.Array', () => {
      const yarray = provider.getArray('test')

      yarray.push(['item1', 'item2'])

      expect(yarray.length).to.equal(2)
      expect(yarray.toArray()).to.deep.equal(['item1', 'item2'])
    })

    it('should insert items in Y.Array', () => {
      const yarray = provider.getArray('test')

      yarray.push(['a', 'c'])
      yarray.insert(1, ['b'])

      expect(yarray.toArray()).to.deep.equal(['a', 'b', 'c'])
    })

    it('should delete items from Y.Array', () => {
      const yarray = provider.getArray('test')

      yarray.push(['a', 'b', 'c'])
      yarray.delete(1, 1)

      expect(yarray.toArray()).to.deep.equal(['a', 'c'])
    })
  })

  describe('Y.Text Operations', () => {
    it('should insert text', () => {
      const ytext = provider.getText('test')

      ytext.insert(0, 'Hello')

      expect(ytext.toString()).to.equal('Hello')
    })

    it('should delete text', () => {
      const ytext = provider.getText('test')

      ytext.insert(0, 'Hello World')
      ytext.delete(5, 6)

      expect(ytext.toString()).to.equal('Hello')
    })

    it('should format text', () => {
      const ytext = provider.getText('test')

      ytext.insert(0, 'Hello')
      ytext.format(0, 5, { bold: true })

      // Note: format returns void, we're just testing it doesn't throw
      expect(ytext.length).to.equal(5)
    })
  })

  describe('Awareness', () => {
    it('should get awareness', () => {
      const awareness = provider.getAwareness()
      expect(awareness).to.be.instanceOf(Awareness)
    })

    it('should set and get local state', () => {
      const awareness = provider.getAwareness()
      const state = { user: { name: 'John' }, color: '#ff0000' }

      provider.setAwareness(state)
      const localState = awareness.getLocalState()

      expect(localState).to.deep.equal(state)
    })

    it('should get connected clients', () => {
      const awareness = provider.getAwareness()
      const clients = provider.getConnectedClients()

      expect(Array.isArray(clients)).to.be.true
      expect(clients.length).to.be.greaterThan(0) // At least current client
    })
  })

  describe('State Management', () => {
    it('should get encoded state', () => {
      const ymap = provider.getMap('test')
      ymap.set('key', 'value')

      const state = provider.getState()
      expect(state).to.be.instanceOf(Uint8Array)
      expect(state.length).to.be.greaterThan(0)
    })

    it('should get state vector', () => {
      const ymap = provider.getMap('test')
      ymap.set('key', 'value')

      const vector = provider.getStateVector()
      expect(vector).to.be.instanceOf(Uint8Array)
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

      expect(ymap2.get('key')).to.be.equal('value')

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
        expect(eventFired).to.be.true
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

      expect(ymap.size).to.be.equal(0)
    })

    it('should destroy provider gracefully', () => {
      const ymap = provider.getMap('test')
      ymap.set('key', 'value')

      expect(() => {
        provider.destroy()
      }).not.to.throw()
    })
  })
})
