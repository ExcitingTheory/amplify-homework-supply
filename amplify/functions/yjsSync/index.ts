/**
 * Yjs WebSocket Server
 *
 * Handles Y.updates from clients, broadcasts to other clients,
 * and persists snapshots to DynamoDB via Amplify GraphQL.
 */

import * as Y from "yjs";
import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";
import * as https from "https";
import { IncomingMessage } from "http";
import * as url from "url";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { attachBotObserver, BotConfig, DualBotConfig } from "./botObserver";

// y-protocols message types
const messageSync = 0;
const messageAwareness = 1;

// Room management
interface YjsRoom {
  ydoc: Y.Doc;
  clients: Set<YjsWebSocket>;
  lastUpdate: number;
  docName: string;
}

interface YjsWebSocket extends WebSocket {
  clientId: string;
  roomName: string;
  isAlive: boolean;
}

export interface YjsServerConfig {
  port?: number;
  persistCallback?: (
    roomName: string,
    update: Uint8Array,
    state: Uint8Array,
  ) => Promise<void>;
  maxRoomAge?: number; // milliseconds before cleaning up inactive rooms
  botConfig?: BotConfig | DualBotConfig; // Optional AI bot configuration for chat rooms
  tlsOptions?: { key: Buffer; cert: Buffer }; // TLS certs for wss:// in local dev
}

const DEFAULT_CONFIG: YjsServerConfig = {
  port: 3001,
  maxRoomAge: 86400000, // 24 hours
};

export class YjsWebSocketServer {
  private wss: WebSocketServer | null = null;
  private server: http.Server | https.Server | null = null;
  private rooms: Map<string, YjsRoom> = new Map();
  private config: Required<YjsServerConfig>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private botCleanups: Map<string, () => void> = new Map();
  // Track clients that have sent corrupt data to avoid infinite reset loops
  private corruptClients: Map<string, number> = new Map();

  constructor(config: YjsServerConfig = {}) {
    this.config = {
      port: DEFAULT_CONFIG.port,
      persistCallback: DEFAULT_CONFIG.persistCallback,
      maxRoomAge: DEFAULT_CONFIG.maxRoomAge,
      botConfig: undefined,
      tlsOptions: undefined,
      ...config,
    } as Required<YjsServerConfig>;
  }

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.config.tlsOptions
          ? https.createServer(this.config.tlsOptions)
          : http.createServer();
        this.wss = new WebSocketServer({ server: this.server });

        // Handle new connections
        this.wss.on("connection", (ws: any, req: IncomingMessage) => {
          this._handleConnection(ws, req);
        });

        // Start heartbeat to detect stale connections
        this._startHeartbeat();

        // Listen on port
        this.server.listen(this.config.port, () => {
          console.log(`[YjsServer] Listening on port ${this.config.port}`);
          resolve();
        });

        this.server.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Close all connections
      if (this.wss) {
        this.wss.clients.forEach((ws: any) => {
          ws.close();
        });
      }

      // Persist all rooms
      this._persistAllRooms()
        .then(() => {
          // Close server
          if (this.server) {
            this.server.close(() => {
              console.log("[YjsServer] Server stopped");
              resolve();
            });
          } else {
            resolve();
          }
        })
        .catch((error) => {
          console.error("[YjsServer] Error persisting rooms:", error);
          resolve();
        });
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private _handleConnection(ws: YjsWebSocket, req: IncomingMessage): void {
    const urlParts = url.parse(req.url || "", true);
    const roomName = urlParts.pathname?.slice(1); // Remove leading /

    if (!roomName) {
      console.error("[YjsServer] No room name provided");
      ws.close(1008, "No room name");
      return;
    }

    // Initialize client
    ws.clientId = `${Date.now()}-${Math.random()}`;
    ws.roomName = roomName;
    ws.isAlive = true;

    console.log(
      `[YjsServer] Client connected to room "${roomName}" (${ws.clientId})`,
    );

    // Get or create room
    let room = this.rooms.get(roomName);
    if (!room) {
      room = {
        ydoc: new Y.Doc(),
        clients: new Set(),
        lastUpdate: Date.now(),
        docName: roomName,
      };
      this.rooms.set(roomName, room);
      console.log(`[YjsServer] Created new room "${roomName}"`);

      // Attach bot observers based on room type:
      // - "chat-*" rooms get Kai only (student collaborative chat)
      // - "instructor-chat-*" rooms get Sage only (instructor-only space)
      if (this.config.botConfig && roomName.startsWith("instructor-chat-")) {
        const dualConfig =
          "sage" in this.config.botConfig ? this.config.botConfig : undefined;
        if (dualConfig?.sage) {
          const cleanup = attachBotObserver(room.ydoc, {
            kai: dualConfig.sage,
          });
          this.botCleanups.set(roomName, cleanup);
          console.log(
            `[YjsServer] Attached Sage bot observer for "${roomName}"`,
          );
        }
      } else if (this.config.botConfig && roomName.startsWith("chat-")) {
        const kaiOnly: BotConfig =
          "kai" in this.config.botConfig
            ? this.config.botConfig.kai
            : this.config.botConfig;
        const cleanup = attachBotObserver(room.ydoc, kaiOnly);
        this.botCleanups.set(roomName, cleanup);
        console.log(`[YjsServer] Attached Kai bot observer for "${roomName}"`);
      }
    }

    room.clients.add(ws);

    // Send current state to client
    this._sendSyncStep1(ws, room);

    // Handle messages
    ws.on("message", (data: Buffer) => {
      this._handleMessage(ws, data, room);
    });

    // Handle client disconnect
    ws.on("close", () => {
      this._handleDisconnect(ws, room);
    });

    ws.on("error", (error) => {
      console.error(
        `[YjsServer] WebSocket error for client ${ws.clientId}:`,
        error,
      );
    });

    // Send heartbeat ping
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  }

  /**
   * Send initial sync state to client (Sync Step 1)
   * Uses y-protocols encoding format that y-websocket client expects.
   */
  private _sendSyncStep1(ws: YjsWebSocket, room: YjsRoom): void {
    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeSyncStep1(encoder, room.ydoc);
      ws.send(encoding.toUint8Array(encoder));
    } catch (error) {
      const errorMsg = (error as Error)?.message || String(error);
      const isCorruptState =
        errorMsg.includes("is not a function") ||
        errorMsg.includes("Unexpected end of") ||
        errorMsg.includes("readAnyLookupTable") ||
        errorMsg.includes("contentRefs");

      if (isCorruptState) {
        // Room's own doc is corrupt — reset it and send empty state
        console.warn(
          `[YjsServer] Corrupt room doc "${room.docName}" during sync — resetting to empty`,
        );
        room.ydoc.destroy();
        room.ydoc = new Y.Doc();
        // Send the now-empty state
        try {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          syncProtocol.writeSyncStep1(encoder, room.ydoc);
          ws.send(encoding.toUint8Array(encoder));
        } catch {
          console.error(
            `[YjsServer] Failed to send fresh sync to client ${ws.clientId}`,
          );
        }
      } else {
        console.error(
          `[YjsServer] Error sending sync to client ${ws.clientId}:`,
          error,
        );
      }
    }
  }

  /**
   * Handle incoming message from client using y-protocols format
   */
  private _handleMessage(ws: YjsWebSocket, data: Buffer, room: YjsRoom): void {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const messageType = decoding.readVarUint(decoder);

      if (messageType === messageSync) {
        // Sync message: prepare response encoder
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        const syncMessageType = syncProtocol.readSyncMessage(
          decoder,
          encoder,
          room.ydoc,
          ws, // transactionOrigin
        );

        // If encoder has content beyond the message type prefix, send response
        if (encoding.length(encoder) > 1) {
          ws.send(encoding.toUint8Array(encoder));
        }

        // If this was a step2 or update, the doc was modified — broadcast & persist
        if (syncMessageType === syncProtocol.messageYjsSyncStep2 || syncMessageType === syncProtocol.messageYjsUpdate) {
          room.lastUpdate = Date.now();
          // Broadcast the original message to other clients
          this._broadcastRaw(room, new Uint8Array(data), ws);
          this._schedulePersist(room);
        }
      } else if (messageType === messageAwareness) {
        // Awareness message — broadcast to all other clients
        this._broadcastRaw(room, new Uint8Array(data), ws);
      } else {
        console.warn(`[YjsServer] Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error(`[YjsServer] Error handling message:`, error);

      // If the error is a decoding failure (corrupt Yjs data from client),
      // close only the offending client with code 4000 so it clears its
      // IndexedDB cache.
      const errorMsg = (error as Error)?.message || String(error);
      const isCorruptData =
        errorMsg.includes("is not a function") ||
        errorMsg.includes("Unexpected end of") ||
        errorMsg.includes("readAnyLookupTable") ||
        errorMsg.includes("contentRefs");

      if (isCorruptData) {
        const corruptCount = (this.corruptClients.get(ws.clientId) || 0) + 1;
        this.corruptClients.set(ws.clientId, corruptCount);

        if (corruptCount <= 3) {
          console.warn(
            `[YjsServer] Corrupt update from client ${ws.clientId} in room "${room.docName}" — closing client to trigger cache clear (attempt ${corruptCount})`,
          );
          try {
            ws.close(4000, "Corrupt data — clear local cache");
          } catch {
            // Client may already be disconnected
          }
        } else {
          console.warn(
            `[YjsServer] Client ${ws.clientId} persistently sending corrupt data — dropping silently`,
          );
        }
      }
    }
  }

  /**
   * Reset a room's Y.Doc to recover from corrupt state.
   * Disconnects all clients so they reconnect with fresh state.
   */
  private _resetRoom(room: YjsRoom): void {
    // Create a fresh document
    const freshDoc = new Y.Doc();
    room.ydoc.destroy();
    room.ydoc = freshDoc;
    room.lastUpdate = Date.now();

    // Re-attach bot observer if applicable
    const existingCleanup = this.botCleanups.get(room.docName);
    if (existingCleanup) {
      existingCleanup();
      this.botCleanups.delete(room.docName);

      if (
        this.config.botConfig &&
        room.docName.startsWith("instructor-chat-")
      ) {
        const dualConfig =
          "sage" in this.config.botConfig ? this.config.botConfig : undefined;
        if (dualConfig?.sage) {
          const cleanup = attachBotObserver(freshDoc, { kai: dualConfig.sage });
          this.botCleanups.set(room.docName, cleanup);
        }
      } else if (this.config.botConfig && room.docName.startsWith("chat-")) {
        const kaiOnly: BotConfig =
          "kai" in this.config.botConfig
            ? this.config.botConfig.kai
            : this.config.botConfig;
        const cleanup = attachBotObserver(freshDoc, kaiOnly);
        this.botCleanups.set(room.docName, cleanup);
      }
    }

    // Close all clients so they reconnect and get fresh state
    room.clients.forEach((client) => {
      try {
        client.close(4000, "Room reset due to corrupt state");
      } catch {
        // Client may already be disconnected
      }
    });
    room.clients.clear();

    console.log(
      `[YjsServer] Room "${room.docName}" reset — clients will reconnect with fresh state`,
    );
  }

  /**
   * Broadcast a raw message to all clients in the room except sender
   */
  private _broadcastRaw(
    room: YjsRoom,
    message: Uint8Array,
    sender: YjsWebSocket,
  ): void {
    room.clients.forEach((client: YjsWebSocket) => {
      if (client !== sender && client.readyState === 1) {
        // WebSocket.OPEN
        try {
          client.send(message);
        } catch (error) {
          console.error(
            `[YjsServer] Error broadcasting to client ${client.clientId}:`,
            error,
          );
        }
      }
    });
  }

  /**
   * Schedule room persistence (debounced)
   */
  private persistTimers: Map<string, NodeJS.Timeout> = new Map();

  private _schedulePersist(room: YjsRoom, delay: number = 5000): void {
    // Cancel previous timer
    const existing = this.persistTimers.get(room.docName);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule new persist
    const timer = setTimeout(() => {
      this._persistRoom(room).catch((error) => {
        console.error(
          `[YjsServer] Error persisting room ${room.docName}:`,
          error,
        );
      });
    }, delay);

    this.persistTimers.set(room.docName, timer);
  }

  /**
   * Persist room to database
   */
  private async _persistRoom(room: YjsRoom): Promise<void> {
    if (!this.config.persistCallback) {
      return;
    }

    try {
      const state = Y.encodeStateAsUpdate(room.ydoc);
      await this.config.persistCallback(room.docName, new Uint8Array(), state);
      console.log(`[YjsServer] Persisted room "${room.docName}"`);
    } catch (error) {
      console.error(
        `[YjsServer] Error persisting room "${room.docName}":`,
        error,
      );
    }
  }

  /**
   * Persist all rooms
   */
  private async _persistAllRooms(): Promise<void> {
    const promises = Array.from(this.rooms.values()).map((room) =>
      this._persistRoom(room),
    );
    const results = await Promise.allSettled(promises);
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.warn(
        `[YjsServer] ${failures.length} room(s) failed to persist:`,
        failures.map((f) => (f as PromiseRejectedResult).reason?.message || f),
      );
    }
  }

  /**
   * Handle client disconnect
   */
  private _handleDisconnect(ws: YjsWebSocket, room: YjsRoom): void {
    room.clients.delete(ws);
    console.log(
      `[YjsServer] Client disconnected from room "${room.docName}" (${ws.clientId})`,
    );

    // Clean up empty rooms after timeout
    if (room.clients.size === 0) {
      setTimeout(() => {
        if (room.clients.size === 0) {
          this._persistRoom(room)
            .then(() => {
              // Clean up bot observer if attached
              const botCleanup = this.botCleanups.get(room.docName);
              if (botCleanup) {
                botCleanup();
                this.botCleanups.delete(room.docName);
              }
              this.rooms.delete(room.docName);
              console.log(
                `[YjsServer] Cleaned up empty room "${room.docName}"`,
              );
            })
            .catch((error) => {
              console.error(`[YjsServer] Error cleaning up room:`, error);
            });
        }
      }, 30000); // Wait 30 seconds before cleanup
    }
  }

  /**
   * Start heartbeat to detect stale connections
   */
  private _startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  /**
   * Get room information (for monitoring)
   */
  getRoomInfo(roomName: string): Record<string, any> | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    return {
      docName: room.docName,
      clientCount: room.clients.size,
      lastUpdate: room.lastUpdate,
      docSize: Y.encodeStateAsUpdate(room.ydoc).length,
    };
  }

  /**
   * Get all rooms (for monitoring)
   */
  getAllRooms(): Record<string, Record<string, any>> {
    const result: Record<string, Record<string, any>> = {};
    this.rooms.forEach((_room, name) => {
      const roomInfo = this.getRoomInfo(name);
      if (roomInfo) {
        result[name] = roomInfo;
      }
    });
    return result;
  }
}

// Export for Lambda wrapper
export default YjsWebSocketServer;
