/**
 * Yjs WebSocket Server
 * 
 * Handles Y.updates from clients, broadcasts to other clients,
 * and persists snapshots to DynamoDB via Amplify GraphQL.
 */

import * as Y from 'yjs'
import { WebSocketServer, WebSocket } from 'ws'
import * as http from 'http'
import { IncomingMessage } from 'http'
import * as url from 'url'

// Room management
interface YjsRoom {
  ydoc: Y.Doc
  clients: Set<YjsWebSocket>
  lastUpdate: number
  docName: string
}

interface YjsWebSocket extends WebSocket {
  clientId: string
  roomName: string
  isAlive: boolean
}

export interface YjsServerConfig {
  port?: number
  persistCallback?: (roomName: string, update: Uint8Array, state: Uint8Array) => Promise<void>
  maxRoomAge?: number // milliseconds before cleaning up inactive rooms
}

const DEFAULT_CONFIG: YjsServerConfig = {
  port: 3001,
  maxRoomAge: 86400000, // 24 hours
}

export class YjsWebSocketServer {
  private wss: WebSocketServer | null = null
  private server: http.Server | null = null
  private rooms: Map<string, YjsRoom> = new Map()
  private config: Required<YjsServerConfig>
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(config: YjsServerConfig = {}) {
    this.config = { port: DEFAULT_CONFIG.port, persistCallback: DEFAULT_CONFIG.persistCallback, maxRoomAge: DEFAULT_CONFIG.maxRoomAge, ...config } as Required<YjsServerConfig>
  }

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = http.createServer()
        this.wss = new WebSocketServer({ server: this.server })

        // Handle new connections
        this.wss.on('connection', (ws: any, req: IncomingMessage) => {
          this._handleConnection(ws, req)
        })

        // Start heartbeat to detect stale connections
        this._startHeartbeat()

        // Listen on port
        this.server.listen(this.config.port, () => {
          console.log(`[YjsServer] Listening on port ${this.config.port}`)
          resolve()
        })

        this.server.on('error', reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
      }

      // Close all connections
      if (this.wss) {
        this.wss.clients.forEach((ws: any) => {
          ws.close()
        })
      }

      // Persist all rooms
      this._persistAllRooms()
        .then(() => {
          // Close server
          if (this.server) {
            this.server.close(() => {
              console.log('[YjsServer] Server stopped')
              resolve()
            })
          } else {
            resolve()
          }
        })
        .catch((error) => {
          console.error('[YjsServer] Error persisting rooms:', error)
          resolve()
        })
    })
  }

  /**
   * Handle new WebSocket connection
   */
  private _handleConnection(ws: YjsWebSocket, req: IncomingMessage): void {
    const urlParts = url.parse(req.url || '', true)
    const roomName = urlParts.pathname?.slice(1) // Remove leading /

    if (!roomName) {
      console.error('[YjsServer] No room name provided')
      ws.close(1008, 'No room name')
      return
    }

    // Initialize client
    ws.clientId = `${Date.now()}-${Math.random()}`
    ws.roomName = roomName
    ws.isAlive = true

    console.log(`[YjsServer] Client connected to room "${roomName}" (${ws.clientId})`)

    // Get or create room
    let room = this.rooms.get(roomName)
    if (!room) {
      room = {
        ydoc: new Y.Doc(),
        clients: new Set(),
        lastUpdate: Date.now(),
        docName: roomName,
      }
      this.rooms.set(roomName, room)
      console.log(`[YjsServer] Created new room "${roomName}"`)
    }

    room.clients.add(ws)

    // Send current state to client
    this._sendSyncStep1(ws, room)

    // Handle messages
    ws.on('message', (data: Buffer) => {
      this._handleMessage(ws, data, room)
    })

    // Handle client disconnect
    ws.on('close', () => {
      this._handleDisconnect(ws, room)
    })

    ws.on('error', (error) => {
      console.error(`[YjsServer] WebSocket error for client ${ws.clientId}:`, error)
    })

    // Send heartbeat ping
    ws.on('pong', () => {
      ws.isAlive = true
    })
  }

  /**
   * Send initial sync state to client (Sync Step 1)
   */
  private _sendSyncStep1(ws: YjsWebSocket, room: YjsRoom): void {
    const state = Y.encodeStateAsUpdate(room.ydoc)
    const message = Buffer.concat([Buffer.from([0]), state]) // 0 = sync message type
    try {
      ws.send(message)
    } catch (error) {
      console.error(`[YjsServer] Error sending sync to client ${ws.clientId}:`, error)
    }
  }

  /**
   * Handle incoming message from client
   */
  private _handleMessage(ws: YjsWebSocket, data: Buffer, room: YjsRoom): void {
    try {
      const messageType = data[0]

      if (messageType === 0) {
        // Sync step 2 - client sends state
        const stateVector = data.slice(1)
        const update = Y.encodeStateAsUpdate(room.ydoc, stateVector)
        if (update.length > 0) {
          const message = Buffer.concat([Buffer.from([0]), update])
          ws.send(message)
        }
      } else if (messageType === 1) {
        // Update message - apply and broadcast
        const update = data.slice(1)
        Y.applyUpdate(room.ydoc, update)
        room.lastUpdate = Date.now()

        // Broadcast to other clients
        this._broadcastUpdate(room, update, ws)

        // Persist periodically (debounced)
        this._schedulePersist(room)
      } else {
        console.warn(`[YjsServer] Unknown message type: ${messageType}`)
      }
    } catch (error) {
      console.error(`[YjsServer] Error handling message:`, error)
    }
  }

  /**
   * Broadcast update to all clients except sender
   */
  private _broadcastUpdate(room: YjsRoom, update: Uint8Array, sender: YjsWebSocket): void {
    const message = Buffer.concat([Buffer.from([1]), update]) // 1 = update type

    room.clients.forEach((client: YjsWebSocket) => {
      if (client !== sender && client.readyState === 1) {
        // WebSocket.OPEN
        try {
          client.send(message)
        } catch (error) {
          console.error(`[YjsServer] Error broadcasting to client ${client.clientId}:`, error)
        }
      }
    })
  }

  /**
   * Schedule room persistence (debounced)
   */
  private persistTimers: Map<string, NodeJS.Timeout> = new Map()

  private _schedulePersist(room: YjsRoom, delay: number = 5000): void {
    // Cancel previous timer
    const existing = this.persistTimers.get(room.docName)
    if (existing) {
      clearTimeout(existing)
    }

    // Schedule new persist
    const timer = setTimeout(() => {
      this._persistRoom(room).catch((error) => {
        console.error(`[YjsServer] Error persisting room ${room.docName}:`, error)
      })
    }, delay)

    this.persistTimers.set(room.docName, timer)
  }

  /**
   * Persist room to database
   */
  private async _persistRoom(room: YjsRoom): Promise<void> {
    if (!this.config.persistCallback) {
      return
    }

    try {
      const state = Y.encodeStateAsUpdate(room.ydoc)
      await this.config.persistCallback(room.docName, new Uint8Array(), state)
      console.log(`[YjsServer] Persisted room "${room.docName}"`)
    } catch (error) {
      console.error(`[YjsServer] Error persisting room "${room.docName}":`, error)
    }
  }

  /**
   * Persist all rooms
   */
  private async _persistAllRooms(): Promise<void> {
    const promises = Array.from(this.rooms.values()).map((room) =>
      this._persistRoom(room)
    )
    await Promise.all(promises)
  }

  /**
   * Handle client disconnect
   */
  private _handleDisconnect(ws: YjsWebSocket, room: YjsRoom): void {
    room.clients.delete(ws)
    console.log(
      `[YjsServer] Client disconnected from room "${room.docName}" (${ws.clientId})`
    )

    // Clean up empty rooms after timeout
    if (room.clients.size === 0) {
      setTimeout(() => {
        if (room.clients.size === 0) {
          this._persistRoom(room)
            .then(() => {
              this.rooms.delete(room.docName)
              console.log(`[YjsServer] Cleaned up empty room "${room.docName}"`)
            })
            .catch((error) => {
              console.error(`[YjsServer] Error cleaning up room:`, error)
            })
        }
      }, 30000) // Wait 30 seconds before cleanup
    }
  }

  /**
   * Start heartbeat to detect stale connections
   */
  private _startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return

      this.wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
          return ws.terminate()
        }
        ws.isAlive = false
        ws.ping()
      })
    }, 30000) // 30 seconds
  }

  /**
   * Get room information (for monitoring)
   */
  getRoomInfo(roomName: string): Record<string, any> | null {
    const room = this.rooms.get(roomName)
    if (!room) return null

    return {
      docName: room.docName,
      clientCount: room.clients.size,
      lastUpdate: room.lastUpdate,
      docSize: Y.encodeStateAsUpdate(room.ydoc).length,
    }
  }

  /**
   * Get all rooms (for monitoring)
   */
  getAllRooms(): Record<string, Record<string, any>> {
    const result: Record<string, Record<string, any>> = {}
    this.rooms.forEach((room, name) => {
      result[name] = this.getRoomInfo(name)
    })
    return result
  }
}

// Export for Lambda wrapper
export default YjsWebSocketServer
