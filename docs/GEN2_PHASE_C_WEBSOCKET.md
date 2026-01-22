# Phase C: WebSocket API Gateway + Lambda for Real-Time Yjs Sync

**Status:** In Progress  
**Estimated Duration:** 1 week  
**Dependencies:** Phase A (Gen 2 backend), Phase B decision (Yjs hybrid approach)

## Overview

Phase C implements a hybrid real-time architecture:
- **WebSocket API Gateway + Lambda** - low-latency Yjs update broadcasting
- **AppSync mutations** - durable persistence to DynamoDB
- **Client-side Yjs** - conflict resolution via CRDT merge

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │ YjsProvider                                         │  │
│  │  - Maintains Yjs doc (Unit.data)                  │  │
│  │  - Sends updates via WebSocket                     │  │
│  │  - Merges offline changes on reconnect             │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                           │
                  WebSocket Connection
                           │
          ┌────────────────┴────────────────┐
          │                                 │
     ┌────▼─────────────────────────┐  ┌──▼──────────┐
     │ API Gateway WebSocket API    │  │  AppSync    │
     │ (wss://...)                  │  │  GraphQL    │
     └────┬─────────────────────────┘  └──────┬──────┘
          │                                    │
     ┌────▼─────────────────────────┐         │
     │ Lambda Handler               │         │
     │ - $connect: Track clients    │         │
     │ - $default: Broadcast updates│◄────────┤ Persist snapshots
     │ - $disconnect: Cleanup       │         │ (batched)
     │                              │         │
     │ Actions:                     │         │
     │ - sync: Yjs updates          │         │
     │ - presence: Cursor/selection │         │
     └────────────────────────────────────────┘
```

## Key Features

### 1. Connection Management
- Track active WebSocket connections in Lambda memory or DynamoDB
- Handle stale connections gracefully ($disconnect events)
- Support auto-reconnect with exponential backoff

### 2. Yjs Update Broadcasting
```
Client 1 sends Yjs update
    ↓
Lambda receives via $default route
    ↓
Lambda broadcasts to all other connected clients
    ↓
Each client applies update to local Yjs doc (conflict-free due to CRDT)
```

### 3. Presence (Optional)
- Broadcast cursor positions, selections, user info
- Lightweight messages (not persisted)
- Enable real-time awareness of collaborators

### 4. Persistence Strategy
```
Yjs Updates
    ↓
Lambda accumulates (e.g., every 100 updates)
    ↓
Triggers AppSync mutation to save snapshot
    ↓
Unit.data field stores serialized Yjs state
```

## File Structure

```
amplify/
├── backend-with-websocket.ts  # Main backend (NEW)
├── custom/
│   └── websocket/
│       ├── resource.ts        # CDK WebSocket API definition
│       ├── handler.ts         # Lambda event handlers
│       └── package.json       # Dependencies (graphql-request, etc.)
├── backend.ts                 # (unchanged - original backend)
├── auth/resource.ts
└── data/resource.ts
```

## Implementation Details

### WebSocket Message Format

**Yjs Update (sync action):**
```json
{
  "action": "sync",
  "unitId": "unit-123",
  "userId": "user-456",
  "data": { /* Yjs encoded update */ },
  "isSnapshot": false,
  "updateCount": 42
}
```

**Presence Update (presence action):**
```json
{
  "action": "presence",
  "userId": "user-456",
  "data": {
    "cursorPos": { "line": 10, "col": 5 },
    "selection": { "start": 0, "end": 50 },
    "userName": "Colin"
  }
}
```

### AppSync Persistence Mutation

```graphql
mutation UpdateUnitYjsSnapshot(
  $id: ID!
  $data: AWSJSON!
  $modifiedBy: String!
) {
  updateUnit(
    input: {
      id: $id
      data: $data          # Yjs snapshot
      lastModifiedBy: $modifiedBy
    }
  ) {
    id
    data
    updatedAt
  }
}
```

## Deployment

1. **Install WebSocket dependencies:**
   ```bash
   cd amplify/custom/websocket
   npm install graphql-request
   ```

2. **Update main backend to include WebSocket:**
   ```bash
   # Note: Currently using backend.ts for sandbox
   # Will integrate websocket into main backend.ts in Phase C completion
   ```

3. **Deploy with sandbox:**
   ```bash
   npx ampx sandbox --once
   ```

4. **Output:**
   - WebSocket endpoint: `wss://xxx.execute-api.us-east-1.amazonaws.com/live`
   - Use this in frontend `amplify_outputs.json`

## Frontend Integration (Phase E)

```typescript
// src/lib/yjs/YjsProvider.ts (updated)
import { WebSocket } from 'ws';

const WS_ENDPOINT = outputs.custom.websocketEndpoint;

const ws = new WebSocket(WS_ENDPOINT);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.action === 'update') {
    // Apply Yjs update from peer
    Y.applyUpdate(ydoc, new Uint8Array(message.data));
  } else if (message.action === 'presence') {
    // Update UI with peer presence
    updatePeerCursor(message.userId, message.data);
  }
};

// Send Yjs update
function sendYjsUpdate(update: Uint8Array) {
  ws.send(JSON.stringify({
    action: 'sync',
    unitId: currentUnit.id,
    userId: session.userId,
    data: Array.from(update),
    updateCount: updatesSent++
  }));
}
```

## Testing

### Local Testing (Sandbox)
1. Start sandbox: `npx ampx sandbox`
2. Retrieve WebSocket endpoint from `amplify_outputs.json`
3. Use WebSocket client (wscat, Thunder Client) to test:
   ```bash
   wscat -c wss://xxx.execute-api.us-east-1.amazonaws.com/live
   
   # Send message
   {"action": "sync", "unitId": "test-unit", "userId": "user1", "data": {"test": "data"}}
   ```

### Load Testing
- Test with N simultaneous connections
- Measure broadcast latency
- Monitor Lambda memory usage

## Known Limitations

1. **Lambda Memory State** - connections stored in memory (lost on cold start)
   - **Solution:** Move to DynamoDB Streams for persistence across invocations
   
2. **Single-Region** - No cross-region replication yet
   - **Solution:** Phase F can add global accelerator

3. **No presence persistence** - Presence data only live during session
   - **Intentional:** Reduces database writes, only sync data persisted

## Rollout Plan

- **Week 1 (this week):** Implement WebSocket API, test locally
- **Week 2:** Frontend integration, load testing
- **Week 3:** Production deployment, monitoring

## Next Steps

- [ ] Create amplify/custom/websocket/package.json with dependencies
- [ ] Test WebSocket Lambda locally with wscat
- [ ] Verify AppSync persistence calls
- [ ] Move to Phase E frontend integration
