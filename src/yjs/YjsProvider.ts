/**
 * YjsProvider - Unified Yjs provider with WebSocket + IndexedDB persistence
 * 
 * Provides real-time sync across clients with automatic offline persistence
 * and reconnection handling.
 */

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { Awareness } from 'y-protocols/awareness'

export interface YjsProviderConfig {
  wsUrl?: string
  docName: string
  resyncInterval?: number
  maxBackoffTime?: number
  connect?: boolean
  persistence?: boolean
}

export class YjsDocProvider {
  private ydoc: Y.Doc
  private docName: string
  private wsProvider: WebsocketProvider | null = null
  private indexeddb: IndexeddbPersistence | null = null
  private awareness: Awareness
  private config: Required<YjsProviderConfig>

  private defaultConfig: Required<Omit<YjsProviderConfig, 'docName'>> = {
    wsUrl: typeof window !== 'undefined' 
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
      : 'ws://localhost:3001',
    resyncInterval: 5000,
    maxBackoffTime: 30000,
    connect: true,
    persistence: true,
  }

  constructor(config: YjsProviderConfig) {
    this.docName = config.docName
    this.ydoc = new Y.Doc()
    this.config = { ...this.defaultConfig, ...config }
    
    // Create standalone awareness (always available, even without WebSocket)
    this.awareness = new Awareness(this.ydoc)

    // Set up IndexedDB persistence
    if (this.config.persistence) {
      this.indexeddb = new IndexeddbPersistence(this.docName, this.ydoc)
    }

    // Set up WebSocket sync (if connect=true)
    if (this.config.connect) {
      this.setupWebSocket()
    }
  }

  private setupWebSocket(): void {
    try {
      this.wsProvider = new WebsocketProvider(
        this.config.wsUrl,
        this.docName,
        this.ydoc,
        {
          resyncInterval: this.config.resyncInterval,
          maxBackoffTime: this.config.maxBackoffTime,
          awareness: this.awareness, // Use our awareness instance
        }
      )

      // Handle sync status
      this.wsProvider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          console.log(`[YjsProvider] ${this.docName} synced with server`)
        }
      })

      // Handle connection status
      this.wsProvider.on('status', ({ status }: { status: string }) => {
        console.log(`[YjsProvider] ${this.docName} connection status: ${status}`)
      })

      // Handle errors
      this.wsProvider.on('connection-error', (error: Event) => {
        console.error(`[YjsProvider] ${this.docName} connection error:`, error)
      })
    } catch (error) {
      console.error(`[YjsProvider] Failed to setup WebSocket for ${this.docName}:`, error)
    }
  }

  /**
   * Get the underlying Y.Doc
   */
  getDoc(): Y.Doc {
    return this.ydoc
  }

  /**
   * Get a Y.Map from the document
   */
  getMap(name: string): Y.Map<any> {
    return this.ydoc.getMap(name)
  }

  /**
   * Get a Y.Array from the document
   */
  getArray(name: string): Y.Array<any> {
    return this.ydoc.getArray(name)
  }

  /**
   * Get a Y.Text from the document
   */
  getText(name: string): Y.Text {
    return this.ydoc.getText(name)
  }

  /**
   * Get awareness for presence tracking
   */
  getAwareness(): Awareness {
    return this.awareness
  }

  /**
   * Set local awareness state (user presence, cursor position, etc.)
   */
  setAwareness(state: Record<string, any>): void {
    this.awareness.setLocalState(state)
  }

  /**
   * Get awareness state for a specific client
   */
  getClientState(clientId: number): Record<string, any> | null {
    return this.awareness.getStates().get(clientId) || null
  }

  /**
   * Get all connected clients
   */
  getConnectedClients(): number[] {
    return Array.from(this.awareness.getStates().keys())
  }

  /**
   * Check if synced with server
   */
  isSynced(): boolean {
    if (!this.wsProvider) {
      return false
    }
    return (this.wsProvider as any).synced
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): void {
    if (this.wsProvider) {
      this.wsProvider.connect()
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.wsProvider) {
      this.wsProvider.disconnect()
    }
  }

  /**
   * Get the encoded state (snapshot) for persistence
   */
  getState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.ydoc)
  }

  /**
   * Get state vector for diff updates
   */
  getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.ydoc)
  }

  /**
   * Apply an update from another client
   */
  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.ydoc, update)
  }

  /**
   * Subscribe to awareness changes
   */
  onAwarenessChange(callback: (changes: any) => void): () => void {
    this.awareness.on('change', callback)
    return () => {
      this.awareness.off('change', callback)
    }
  }

  /**
   * Subscribe to update events
   */
  onUpdate(callback: (update: Uint8Array, origin: any) => void): () => void {
    const updateHandler = (update: Uint8Array, origin: any) => {
      callback(update, origin)
    }
    this.ydoc.on('update', updateHandler)
    return () => {
      this.ydoc.off('update', updateHandler)
    }
  }

  /**
   * Clear all data locally
   */
  clear(): void {
    Y.transact(this.ydoc, () => {
      // Remove all maps and arrays
      this.ydoc.share.forEach((value) => {
        if (value instanceof Y.Map) {
          Array.from(value.keys()).forEach(k => value.delete(k))
        } else if (value instanceof Y.Array) {
          value.delete(0, value.length)
        }
      })
    })
  }

  /**
   * Destroy provider and clean up resources
   */
  destroy(): void {
    if (this.wsProvider) {
      this.wsProvider.destroy()
    }
    if (this.indexeddb) {
      this.indexeddb.destroy()
    }
    this.awareness.destroy()
    this.ydoc.destroy()
  }
}

export default YjsDocProvider
