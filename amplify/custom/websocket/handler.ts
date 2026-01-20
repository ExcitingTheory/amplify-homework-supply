import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

// Store active connections (use Array instead of Set for better compatibility)
const connections: string[] = [];

interface WebSocketMessage {
  action: string;
  connectionId?: string;
  data?: any;
  unitId?: string;
  userId?: string;
}

/**
 * WebSocket Lambda handler for real-time Yjs collaboration
 * Broadcast messages to connected clients and persist to AppSync
 * 
 * NOTE: Currently unused - moved to separate implementation
 */
export const websocketHandler: APIGatewayProxyWebsocketHandlerV2 = async (event: any) => {
  const connectionId = event.requestContext.connectionId;
  const routeKey = event.requestContext.routeKey;
  // Extract userId from Cognito claims if available
  const userId = event.requestContext?.authorizer?.claims?.sub || 'anonymous';

  console.log(`WebSocket Event - Route: ${routeKey}, Connection: ${connectionId}, User: ${userId}`);

  try {
    switch (routeKey) {
      case '$connect':
        return handleConnect(connectionId);

      case '$disconnect':
        return handleDisconnect(connectionId);

      case '$default':
        const message: WebSocketMessage = JSON.parse(event.body || '{}');
        return await handleMessage(connectionId, message, userId);

      default:
        return { statusCode: 400, body: 'Unknown route' };
    }
  } catch (error) {
    console.error('WebSocket handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};


// # Consolidated model combining assistant config with chat session data
// type AssistantChat @model @auth(
//     rules: [
//       { allow: owner },
//       { allow: groups, groups: ["Admins"] }
//     ]
//   ) {
//   id: ID!
//   owner: String
  
//   # Assistant Configuration
//   model: String  # OpenAI model (gpt-4, gpt-3.5-turbo, etc.)
//   threadInstructions: String  # System prompt/instructions for this assistant
//   additionalInstructions: String  # Supplemental instructions
//   threadId: String  # OpenAI thread ID if using Assistants API
//   moderationFlag: Boolean  # Content moderation flag
  
//   # Chat Session Data
//   messages: AWSJSON  # Chat messages as JSON array
//   draft: String  # Current draft message content (markdown)
//   archived: Boolean  # Whether chat is archived
  
//   # Usage Tracking
//   inputTokens: String  # Total input tokens used
//   outputTokens: String  # Total output tokens used
  
//   # Relationships
//   files: [File] @manyToMany(relationName: "AssistantChatFile")  # Attached files

// }

function handleConnect(connectionId: string) {
  console.log(`Client connected: ${connectionId}`);
  if (!connections.includes(connectionId)) {
    connections.push(connectionId);
  }
  return { statusCode: 200, body: 'Connected' };
}

function handleDisconnect(connectionId: string) {
  console.log(`Client disconnected: ${connectionId}`);
  const index = connections.indexOf(connectionId);
  if (index > -1) {
    connections.splice(index, 1);
  }
  return { statusCode: 200, body: 'Disconnected' };
}

async function handleMessage(
  connectionId: string,
  message: WebSocketMessage,
  userId: string
): Promise<any> {
  const { action, data, unitId } = message;

  console.log(`Message from ${connectionId}:`, { action, unitId, userId });

  switch (action) {
    case 'sync': {
      // Yjs update message - broadcast to all connected clients
      const broadcastMessage = {
        action: 'update',
        userId,
        unitId,
        data, // Yjs encoded update
        timestamp: Date.now(),
      };

      // Broadcast to all connected clients
      // Note: In production, use API Gateway Management API for actual broadcast
      let broadcastCount = 0;
      for (let i = 0; i < connections.length; i++) {
        const connId = connections[i];
        if (connId !== connectionId) {
          broadcastCount++;
          console.log(`[Broadcast] Message to ${connId}:`, broadcastMessage);
          // TODO: Implement ApiGatewayManagementApi.send(new PostToConnectionCommand({
          //   ConnectionId: connId,
          //   Data: JSON.stringify(broadcastMessage),
          // }))
        }
      }
      console.log(`[Sync] Broadcast to ${broadcastCount} clients`);

      // Persist Yjs snapshot to AppSync every N updates or on full sync
      if ((data?.isSnapshot || shouldPersist(data)) && unitId) {
        await persistToAppSync(unitId, data, userId);
      }

      return { statusCode: 200, body: 'Message processed' };
    }

    case 'presence': {
      // Broadcast presence updates (cursor position, selection, etc.)
      const presenceMessage = {
        action: 'presence',
        userId,
        data,
        timestamp: Date.now(),
      };

      let presenceCount = 0;
      for (let i = 0; i < connections.length; i++) {
        const connId = connections[i];
        if (connId !== connectionId) {
          presenceCount++;
          console.log(`[Presence] Message to ${connId}:`, presenceMessage);
          // TODO: Implement ApiGatewayManagementApi.send(new PostToConnectionCommand({
          //   ConnectionId: connId,
          //   Data: JSON.stringify(presenceMessage),
          // }))
        }
      }
      console.log(`[Presence] Updated ${presenceCount} clients`);

      return { statusCode: 200, body: 'Presence updated' };
    }

    case 'ping':
      // Keep-alive
      return { statusCode: 200, body: 'Pong' };

    default:
      console.warn(`Unknown action: ${action}`);
      return { statusCode: 400, body: `Unknown action: ${action}` };
  }
}

async function persistToAppSync(
  unitId: string,
  yUpdate: any,
  userId: string
): Promise<void> {
  try {
    // TODO: Implement AppSync mutation call
    // For now, just log
    console.log(`[Persist] Would save Yjs snapshot for unit ${unitId}:`, {
      updateSize: JSON.stringify(yUpdate).length,
      userId,
    });
    
    // Example implementation:
    // const mutation = gql`
    //   mutation UpdateUnitYjsSnapshot($id: ID!, $data: AWSJSON!, $modifiedBy: String!) {
    //     updateUnit(input: { id: $id, data: $data, lastModifiedBy: $modifiedBy }) {
    //       id
    //       data
    //       updatedAt
    //     }
    //   }
    // `;
    // const response = await graphqlClient.request(mutation, {
    //   id: unitId,
    //   data: JSON.stringify(yUpdate),
    //   modifiedBy: userId,
    // });
  } catch (error) {
    console.error(`Failed to persist Yjs snapshot:`, error);
    // Don't throw - WebSocket connection should remain alive even if persistence fails
  }
}

function shouldPersist(data: any): boolean {
  // Persist on every Nth update (e.g., every 100 updates) or based on data size
  // This reduces API calls while maintaining reasonable persistence frequency
  if (!data) return false;
  return data.updateCount % 100 === 0;
}
