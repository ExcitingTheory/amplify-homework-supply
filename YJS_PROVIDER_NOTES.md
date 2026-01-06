# Yjs Provider Setup & Selection Guide

## Overview

Yjs providers handle the synchronization of your Y.Doc across multiple clients. They're the "transport layer" that makes real-time collaboration work. Choosing the right provider depends on your infrastructure, scale, and requirements.

---

## Provider Types

### 1. **y-websocket** (Most Popular)
**Best for:** Production apps, scalable architecture, AWS/cloud deployments

#### Pros:
- Battle-tested and reliable
- Scales well with load balancers
- Low latency
- Works with any WebSocket server
- Can integrate with your existing backend

#### Cons:
- Requires server infrastructure
- Need to manage WebSocket connections
- Server needs to handle Y.Doc updates

#### Setup:

```javascript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();

const wsProvider = new WebsocketProvider(
  'wss://your-server.com',     // WebSocket URL
  'room-name',                  // Room/document ID
  ydoc,
  {
    connect: true,              // Auto-connect
    awareness: true,            // Share cursor/presence
    params: {                   // Additional connection params
      auth: 'your-token'
    },
    resyncInterval: 5000,       // Re-sync every 5s
    maxBackoffTime: 5000        // Max reconnection delay
  }
);

// Listen to connection status
wsProvider.on('status', event => {
  console.log(event.status); // 'connected' | 'disconnected'
});

// Listen to sync status
wsProvider.on('sync', isSynced => {
  console.log('Synced:', isSynced);
});
```

#### Server Setup (Node.js):

```javascript
// server.js
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

const wss = new WebSocketServer({ port: 1234 });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req, {
    // Optional: Persist documents
    persistence: {
      bindState: async (docName, ydoc) => {
        // Load from database
        const data = await loadFromDB(docName);
        if (data) {
          Y.applyUpdate(ydoc, data);
        }
      },
      writeState: async (docName, ydoc) => {
        // Save to database
        const update = Y.encodeStateAsUpdate(ydoc);
        await saveToDB(docName, update);
      }
    }
  });
});
```

#### AWS Lambda WebSocket Setup:

```javascript
// For AWS API Gateway WebSocket
import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import * as Y from 'yjs';

export const handler = async (event) => {
  const { requestContext, body } = event;
  const { connectionId, routeKey } = requestContext;
  
  if (routeKey === '$connect') {
    // Handle connection
    return { statusCode: 200 };
  }
  
  if (routeKey === '$disconnect') {
    // Handle disconnection
    return { statusCode: 200 };
  }
  
  // Handle messages
  const message = JSON.parse(body);
  
  // Process Y.js updates
  if (message.type === 'update') {
    const update = new Uint8Array(message.update);
    // Broadcast to other connections
    await broadcastUpdate(connectionId, update);
  }
  
  return { statusCode: 200 };
};
```

---

### 2. **y-webrtc** (Peer-to-Peer)
**Best for:** Serverless, privacy-focused, small teams

#### Pros:
- No server required (after initial signaling)
- True peer-to-peer communication
- Low latency between peers
- Free to run
- Better privacy (data doesn't touch servers)

#### Cons:
- Limited to ~10-15 concurrent users
- Requires public signaling servers
- Network topology matters (firewalls, NAT)
- Less reliable than WebSocket

#### Setup:

```javascript
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

const ydoc = new Y.Doc();

const webrtcProvider = new WebrtcProvider(
  'room-name',                  // Room/document ID
  ydoc,
  {
    signaling: [
      'wss://signaling.yjs.dev', // Public signaling server
      'wss://y-webrtc-signaling-eu.herokuapp.com'
    ],
    password: 'optional-room-password',
    awareness: true,
    maxConns: 20,              // Max peer connections
    filterBcConns: true,       // Filter broadcast connections
    peerOpts: {}               // SimplePeer options
  }
);

// Monitor connected peers
webrtcProvider.on('peers', event => {
  console.log('Connected peers:', event.webrtcPeers);
  console.log('Total peers:', event.bcPeers);
});
```

**Custom Signaling Server:**

```javascript
// Deploy your own signaling server
import { SignalingServer } from 'y-webrtc/bin/server';

const signalingServer = new SignalingServer({ port: 4444 });
```

---

### 3. **y-indexeddb** (Local Persistence)
**Best for:** Offline support, local-first apps

#### Pros:
- Persists data in browser
- Works offline
- No server needed for single-user scenarios
- Fast local access

#### Cons:
- Not a network provider (combine with others)
- Browser storage limits
- Data only on that device

#### Setup:

```javascript
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

const ydoc = new Y.Doc();

const indexeddbProvider = new IndexeddbPersistence(
  'document-name',              // Database name
  ydoc
);

indexeddbProvider.on('synced', () => {
  console.log('Content loaded from IndexedDB');
});

// Often combined with network provider
const wsProvider = new WebsocketProvider('wss://server.com', 'room', ydoc);
```

---

### 4. **Custom Providers**
**Best for:** Specific infrastructure requirements, existing backends

You can create custom providers that integrate with:
- AWS AppSync
- Firebase Realtime Database
- Supabase Realtime
- Socket.io
- Your existing message queue

#### Basic Custom Provider Template:

```javascript
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

class CustomProvider {
  constructor(roomName, ydoc) {
    this.roomName = roomName;
    this.doc = ydoc;
    this.awareness = new awarenessProtocol.Awareness(ydoc);
    
    this._synced = false;
    
    // Listen to document updates
    this.doc.on('update', this._docUpdateHandler.bind(this));
    
    // Connect to your backend
    this.connect();
  }
  
  connect() {
    // Connect to your messaging service
    this.socket = connectToYourBackend(this.roomName);
    
    this.socket.on('message', this._messageHandler.bind(this));
  }
  
  _docUpdateHandler(update, origin) {
    // Don't send updates that originated from remote
    if (origin !== this) {
      // Send update to your backend
      this.socket.send({
        type: 'update',
        update: Array.from(update)
      });
    }
  }
  
  _messageHandler(message) {
    if (message.type === 'update') {
      // Apply remote update
      const update = new Uint8Array(message.update);
      Y.applyUpdate(this.doc, update, this);
    }
  }
  
  destroy() {
    this.doc.off('update', this._docUpdateHandler);
    this.socket.disconnect();
  }
}
```

---

## Provider Selection Matrix

| Use Case | Provider | Why |
|----------|----------|-----|
| Production web app | y-websocket | Scalable, reliable, integrates with existing infrastructure |
| Small team/prototype | y-webrtc | No server costs, quick setup |
| Offline-first app | y-indexeddb + y-websocket | Local persistence + sync when online |
| Mobile app | y-websocket | Better battery life, more reliable than WebRTC |
| High security | Custom provider | Full control over data routing |
| Existing AWS infrastructure | y-websocket + API Gateway | Integrates with AWS services |
| Firebase users | Custom provider | Use Firebase Realtime Database |
| Large documents (>10MB) | y-websocket + persistence | Better handling of large state |

---

## Combining Multiple Providers

Best practice for production apps:

```javascript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

const ydoc = new Y.Doc();

// 1. Local persistence (loads immediately)
const indexeddb = new IndexeddbPersistence('doc-123', ydoc);

// 2. Network sync (syncs with others)
const websocket = new WebsocketProvider(
  'wss://your-server.com',
  'doc-123',
  ydoc,
  { connect: true }
);

// Wait for local data to load first
indexeddb.once('synced', () => {
  console.log('Local data loaded');
  
  // Then connect to network
  websocket.connect();
});

// Cleanup
function cleanup() {
  websocket.destroy();
  indexeddb.destroy();
  ydoc.destroy();
}
```

---

## AWS-Specific Setup Recommendations

### Option 1: API Gateway WebSocket + Lambda

```javascript
// Client-side
const wsProvider = new WebsocketProvider(
  'wss://your-id.execute-api.us-east-1.amazonaws.com/production',
  roomName,
  ydoc,
  {
    params: { token: authToken }
  }
);
```

### Option 2: EC2/ECS with y-websocket Server

```javascript
// Deploy y-websocket server on EC2/ECS
// Use ALB with sticky sessions
const wsProvider = new WebsocketProvider(
  'wss://yjs.yourdomain.com',
  roomName,
  ydoc
);
```

### Option 3: AppSync + Custom Provider

```javascript
// Use AppSync subscriptions as transport
import { API, graphqlOperation } from '@aws-amplify/api';

class AppSyncProvider {
  constructor(roomName, ydoc) {
    this.subscription = API.graphql(
      graphqlOperation(onUpdateDocument, { room: roomName })
    ).subscribe({
      next: ({ value }) => {
        const update = new Uint8Array(value.data.onUpdateDocument.update);
        Y.applyUpdate(ydoc, update, this);
      }
    });
  }
}
```

---

## Performance Optimization

### 1. Connection Pooling
```javascript
// Reuse WebSocket connections across documents
const connectionPool = new Map();

function getProvider(roomName, ydoc) {
  const key = 'wss://server.com';
  
  if (!connectionPool.has(key)) {
    connectionPool.set(key, new WebsocketProvider(key, roomName, ydoc));
  }
  
  return connectionPool.get(key);
}
```

### 2. Lazy Loading
```javascript
// Don't connect until user starts editing
let provider = null;

editor.addEventListener('focus', () => {
  if (!provider) {
    provider = new WebsocketProvider('wss://server.com', roomName, ydoc);
  }
}, { once: true });
```

### 3. Document Compression
```javascript
// Compress updates before sending
import { encodeStateAsUpdate } from 'yjs';
import pako from 'pako';

const update = encodeStateAsUpdate(ydoc);
const compressed = pako.deflate(update);
socket.send(compressed);
```

---

## Recommended Setup for Your Use Case

Given your requirements (Amplify + DataStore + offline + file uploads):

```javascript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import YjsAmplifySync from './YjsAmplifySync';

// 1. Local persistence
const indexeddb = new IndexeddbPersistence('app-data', ydoc);

// 2. Network sync
const websocket = new WebsocketProvider(
  'wss://your-api-gateway.amazonaws.com/prod',
  'room-id',
  ydoc
);

// 3. DataStore sync (your custom implementation)
const amplifySync = new YjsAmplifySync(Model, {
  debounceDelay: 3000,
  fileUploadDelay: 10000,
  embeddingWorker: generateEmbedding
});
```

This gives you:
- ✅ Real-time collaboration (WebSocket)
- ✅ Offline support (IndexedDB)
- ✅ AWS integration (DataStore)
- ✅ Delayed writes and uploads
- ✅ Embedding generation

---

## Troubleshooting

### WebSocket won't connect
- Check CORS settings
- Verify SSL certificate
- Check firewall rules
- Test with `wss://demos.yjs.dev`

### WebRTC peers not connecting
- Check NAT/firewall configuration
- Use public STUN/TURN servers
- Verify signaling server is accessible

### High memory usage
- Use `ydoc.gc = true` for garbage collection
- Implement document splitting for large data
- Compress historical updates

### Sync conflicts
- Yjs handles this automatically with CRDT
- If using custom logic, let Yjs merge first
- Don't override Yjs conflict resolution