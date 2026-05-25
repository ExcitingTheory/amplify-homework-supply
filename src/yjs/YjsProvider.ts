/**
 * YjsProvider - Unified Yjs provider with WebSocket + IndexedDB persistence
 *
 * Provides real-time sync across clients with automatic offline persistence
 * and reconnection handling.
 */

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { Awareness } from "y-protocols/awareness";

export interface YjsProviderConfig {
  wsUrl?: string;
  docName: string;
  resyncInterval?: number;
  maxBackoffTime?: number;
  connect?: boolean;
  persistence?: boolean;
}

export class YjsDocProvider {
  private ydoc: Y.Doc;
  private docName: string;
  private wsProvider: WebsocketProvider | null = null;
  private indexeddb: IndexeddbPersistence | null = null;
  private awareness: Awareness;
  private config: Required<YjsProviderConfig>;
  private hasLoggedConnectionError = false;
  private resetCount = 0;
  private static MAX_RESETS = 2;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private lastStatusLog = '';

  private defaultConfig: Required<Omit<YjsProviderConfig, "docName">> = {
    wsUrl:
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_YJS_WS_URL ||
          `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
        : "ws://localhost:3001",
    resyncInterval: 5000,
    maxBackoffTime: 30000,
    connect: true,
    persistence: true,
  };

  constructor(config: YjsProviderConfig) {
    this.docName = config.docName;
    this.ydoc = new Y.Doc();
    // Filter out undefined values so they don't override defaults
    const definedConfig = Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined),
    );
    this.config = {
      ...this.defaultConfig,
      ...definedConfig,
    } as Required<YjsProviderConfig>;

    // Create standalone awareness (always available, even without WebSocket)
    this.awareness = new Awareness(this.ydoc);

    // Set up IndexedDB persistence (only in browser environments)
    if (this.config.persistence && typeof indexedDB !== "undefined") {
      this.indexeddb = new IndexeddbPersistence(this.docName, this.ydoc);
    }

    // Set up WebSocket sync (if connect=true)
    if (this.config.connect) {
      this.setupWebSocket();
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
        },
      );

      // Handle sync status
      this.wsProvider.on("sync", (isSynced: boolean) => {
        if (isSynced) {
          console.log(`[YjsProvider] ${this.docName} synced with server`);
        }
      });

      // Handle connection status - only log changes to reduce noise
      this.wsProvider.on("status", ({ status }: { status: string }) => {
        if (status !== this.lastStatusLog) {
          this.lastStatusLog = status;
          console.log(
            `[YjsProvider] ${this.docName} connection status: ${status}`,
          );
        }
      });

      // Handle errors - log first occurrence, then debug to reduce spam
      this.wsProvider.on("connection-error", (error: Event) => {
        if (!this.hasLoggedConnectionError) {
          this.hasLoggedConnectionError = true;
          console.warn(
            `[YjsProvider] ${this.docName} connection error (further retries logged as debug):`,
            error,
          );
        } else {
          console.debug(
            `[YjsProvider] ${this.docName} connection retry failed`,
          );
        }
      });

      // Handle server-initiated close with code 4000 (corrupt state reset)
      // Clear local IndexedDB to prevent replaying corrupt data on reconnect.
      // Limit resets to prevent infinite loops.
      this.wsProvider.on("connection-close", (event: CloseEvent | null) => {
        if (event?.code === 4000) {
          this.resetCount++;
          if (this.resetCount > YjsDocProvider.MAX_RESETS) {
            console.warn(
              `[YjsProvider] ${this.docName} exceeded max resets (${YjsDocProvider.MAX_RESETS}) — staying disconnected`,
            );
            if (this.wsProvider) {
              this.wsProvider.destroy();
              this.wsProvider = null;
            }
            return;
          }
          console.warn(
            `[YjsProvider] ${this.docName} server rejected corrupt data — clearing local cache (reset ${this.resetCount}/${YjsDocProvider.MAX_RESETS})`,
          );
          // 1. Stop auto-reconnect and destroy current provider
          if (this.wsProvider) {
            this.wsProvider.destroy();
            this.wsProvider = null;
          }
          // 2. Clear corrupt IndexedDB data
          this.clearLocalPersistence();
          // 3. Reset the local Y.Doc and awareness to empty state
          this.awareness.destroy();
          this.ydoc.destroy();
          this.ydoc = new Y.Doc();
          this.awareness = new Awareness(this.ydoc);
          // 4. Notify consumers that doc was replaced
          this.emit('doc-reset', this.ydoc);
          // 5. Reconnect with fresh state after a short delay
          this.hasLoggedConnectionError = false;
          setTimeout(() => this.setupWebSocket(), 1000);
        }
      });
    } catch (error) {
      console.error(
        `[YjsProvider] Failed to setup WebSocket for ${this.docName}:`,
        error,
      );
    }
  }

  /**
   * Get the underlying Y.Doc
   */
  getDoc(): Y.Doc {
    return this.ydoc;
  }

  /**
   * Get a Y.Map from the document
   */
  getMap(name: string): Y.Map<any> {
    return this.ydoc.getMap(name);
  }

  /**
   * Get a Y.Array from the document
   */
  getArray(name: string): Y.Array<any> {
    return this.ydoc.getArray(name);
  }

  /**
   * Get a Y.Text from the document
   */
  getText(name: string): Y.Text {
    return this.ydoc.getText(name);
  }

  /**
   * Get awareness for presence tracking
   */
  getAwareness(): Awareness {
    return this.awareness;
  }

  /**
   * Set local awareness state (user presence, cursor position, etc.)
   */
  setAwareness(state: Record<string, any>): void {
    this.awareness.setLocalState(state);
  }

  /**
   * Get awareness state for a specific client
   */
  getClientState(clientId: number): Record<string, any> | null {
    return this.awareness.getStates().get(clientId) || null;
  }

  /**
   * Get all connected clients
   */
  getConnectedClients(): number[] {
    return Array.from(this.awareness.getStates().keys());
  }

  /**
   * Check if synced with server
   */
  isSynced(): boolean {
    if (!this.wsProvider) {
      return false;
    }
    return (this.wsProvider as any).synced;
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): void {
    if (this.wsProvider) {
      this.wsProvider.connect();
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.wsProvider) {
      this.wsProvider.disconnect();
    }
  }

  /**
   * Get the encoded state (snapshot) for persistence
   */
  getState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.ydoc);
  }

  /**
   * Get state vector for diff updates
   */
  getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.ydoc);
  }

  /**
   * Apply an update from another client.
   * Guarded against corrupt data — returns false if the update failed to apply.
   */
  applyUpdate(update: Uint8Array): boolean {
    try {
      Y.applyUpdate(this.ydoc, update);
      return true;
    } catch (err) {
      console.warn(
        `[YjsProvider] ${this.docName} failed to apply update (corrupt data):`,
        (err as Error).message,
      );
      return false;
    }
  }

  /**
   * Subscribe to awareness changes
   */
  onAwarenessChange(callback: (changes: any) => void): () => void {
    this.awareness.on("change", callback);
    return () => {
      this.awareness.off("change", callback);
    };
  }

  /**
   * Subscribe to update events
   */
  onUpdate(callback: (update: Uint8Array, origin: any) => void): () => void {
    const updateHandler = (update: Uint8Array, origin: any) => {
      callback(update, origin);
    };
    this.ydoc.on("update", updateHandler);
    return () => {
      this.ydoc.off("update", updateHandler);
    };
  }

  /**
   * Clear all data locally
   */
  clear(): void {
    Y.transact(this.ydoc, () => {
      // Remove all maps and arrays
      this.ydoc.share.forEach((value) => {
        if (value instanceof Y.Map) {
          Array.from(value.keys()).forEach((k) => value.delete(k));
        } else if (value instanceof Y.Array) {
          value.delete(0, value.length);
        }
      });
    });
  }

  /**
   * Clear local IndexedDB persistence for this document.
   * Used to recover from corrupt state without replaying bad data on reconnect.
   */
  clearLocalPersistence(): void {
    if (this.indexeddb) {
      this.indexeddb.clearData();
      console.log(
        `[YjsProvider] Cleared IndexedDB persistence for "${this.docName}"`,
      );
    }
  }

  /**
   * Subscribe to provider events (e.g., 'doc-reset' when Y.Doc is replaced)
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from provider events
   */
  off(event: string, callback: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(...args);
      } catch (e) {
        console.warn(`[YjsProvider] Error in ${event} listener:`, e);
      }
    });
  }

  /**
   * Destroy provider and clean up resources
   */
  destroy(): void {
    if (this.wsProvider) {
      this.wsProvider.destroy();
    }
    if (this.indexeddb) {
      this.indexeddb.destroy();
    }
    this.awareness.destroy();
    this.ydoc.destroy();
    this.listeners.clear();
  }
}

export default YjsDocProvider;
