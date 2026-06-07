import { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// DynamoDB clients
const ddbClient = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(ddbClient);

// API Gateway Management API client for sending messages to WebSocket clients
let apiGatewayClient: ApiGatewayManagementApiClient | null = null;

interface WebSocketMessage {
  action: string;
  connectionId?: string;
  data?: any;
  unitId?: string; // Also used as roomId for review-* rooms
  userId?: string;
  updateCount?: number;
  isSnapshot?: boolean;
}

/**
 * Identifies whether a document name is a peer review room.
 */
function isReviewRoom(docName: string): boolean {
  return docName.startsWith("review-");
}

/**
 * Extracts the room ID from a review document name.
 * e.g., 'review-abc123' -> 'abc123'
 */
function extractRoomId(docName: string): string {
  return docName.replace("review-", "");
}

interface ConnectionRecord {
  connectionId: string;
  unitId: string; // Stores the document name (unitId or review-{roomId})
  userId: string;
  connectedAt: number;
  ttl: number; // TTL for auto-cleanup (24 hours from now)
}

/**
 * WebSocket Lambda handler for real-time Yjs collaboration
 * Uses DynamoDB to track connections across Lambda instances
 * Persists Yjs snapshots to Amplify Data (Unit table)
 */
export const handler: APIGatewayProxyWebsocketHandlerV2 = async (
  event: any,
) => {
  const connectionId = event.requestContext.connectionId;
  const routeKey = event.requestContext.routeKey;
  // Extract userId from Cognito claims if available
  const userId = event.requestContext?.authorizer?.claims?.sub || "anonymous";

  // Initialize API Gateway Management API client with endpoint from event
  if (!apiGatewayClient) {
    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    apiGatewayClient = new ApiGatewayManagementApiClient({ endpoint });
  }

  console.log(
    `WebSocket Event - Route: ${routeKey}, Connection: ${connectionId}, User: ${userId}`,
  );

  try {
    switch (routeKey) {
      case "$connect":
        // Connection established - but we don't know unitId yet
        // Will be added on first message with unitId
        return { statusCode: 200, body: "Connected" };

      case "$disconnect":
        return handleDisconnect(connectionId);

      case "$default":
        const message: WebSocketMessage = JSON.parse(event.body || "{}");
        return await handleMessage(connectionId, message, userId);

      default:
        return { statusCode: 400, body: "Unknown route" };
    }
  } catch (error) {
    console.error("WebSocket handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

/**
 * Add connection to DynamoDB
 */
async function addConnection(
  connectionId: string,
  unitId: string,
  userId: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = now + 86400; // 24 hours from now

  await ddb.send(
    new PutCommand({
      TableName: process.env.CONNECTIONS_TABLE_NAME!,
      Item: {
        connectionId,
        unitId,
        userId,
        connectedAt: now,
        ttl,
      },
    }),
  );
}

/**
 * Get all connection IDs for a specific unit
 */
async function getConnectionIds(unitId: string): Promise<string[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: process.env.CONNECTIONS_TABLE_NAME!,
      IndexName: "UnitIdIndex",
      KeyConditionExpression: "unitId = :unitId",
      ExpressionAttributeValues: {
        ":unitId": unitId,
      },
    }),
  );

  return (result.Items || []).map((item) => item.connectionId);
}

async function handleDisconnect(connectionId: string) {
  console.log(`Client disconnected: ${connectionId}`);

  await ddb.send(
    new DeleteCommand({
      TableName: process.env.CONNECTIONS_TABLE_NAME!,
      Key: { connectionId },
    }),
  );

  return { statusCode: 200, body: "Disconnected" };
}

async function handleMessage(
  connectionId: string,
  message: WebSocketMessage,
  userId: string,
): Promise<any> {
  const { action, data, unitId } = message;

  console.log(`Message from ${connectionId}:`, { action, unitId, userId });

  if (!unitId) {
    return { statusCode: 400, body: "Missing unitId" };
  }

  // Determine document type
  const isReview = isReviewRoom(unitId);

  // For review rooms, validate that the user is authorized
  if (isReview && action === "sync") {
    const authorized = await authorizeReviewAccess(unitId, userId);
    if (!authorized) {
      console.warn(
        `[Auth] Denied review room access for user ${userId} to ${unitId}`,
      );
      return { statusCode: 403, body: "Not authorized for this review room" };
    }
  }

  switch (action) {
    case "sync": {
      // Add this connection to DynamoDB (idempotent)
      await addConnection(connectionId, unitId, userId);

      // Yjs update message - broadcast to all connected clients
      const broadcastMessage = {
        action: "update",
        userId,
        unitId,
        data, // Yjs encoded update (Uint8Array or base64 string)
        timestamp: Date.now(),
      };

      // Get ALL connections for this unit from DynamoDB
      const connectionIds = await getConnectionIds(unitId);
      const otherConnectionIds = connectionIds.filter(
        (id) => id !== connectionId,
      );

      // Broadcast to all connected clients using binary WebSocket frames
      let broadcastCount = 0;
      const failedConnections: string[] = [];

      for (const connId of otherConnectionIds) {
        try {
          await sendToConnection(connId, broadcastMessage);
          broadcastCount++;
        } catch (error: any) {
          console.error(`Failed to send to ${connId}:`, error);
          // Remove stale connections (410 Gone = connection no longer exists)
          if (
            error.statusCode === 410 ||
            error.$metadata?.httpStatusCode === 410
          ) {
            failedConnections.push(connId);
          }
        }
      }

      // Clean up stale connections from DynamoDB
      for (const staleId of failedConnections) {
        await ddb.send(
          new DeleteCommand({
            TableName: process.env.CONNECTIONS_TABLE_NAME!,
            Key: { connectionId: staleId },
          }),
        );
        console.log(`Removed stale connection: ${staleId}`);
      }

      console.log(
        `[Sync] Broadcast to ${broadcastCount} clients (${failedConnections.length} stale removed)`,
      );

      // Persist Yjs snapshot to Amplify Data every N updates or on full sync
      // Only persist for unit documents, NOT review rooms (review rooms use their own persistence)
      if (
        !isReview &&
        (data?.isSnapshot || shouldPersist(data, message.updateCount)) &&
        unitId
      ) {
        await persistToAmplifyData(unitId, data, userId);
      }

      return { statusCode: 200, body: "Message processed" };
    }

    case "presence": {
      // Add this connection to DynamoDB
      await addConnection(connectionId, unitId, userId);

      // Broadcast presence updates (cursor position, selection, etc.)
      const presenceMessage = {
        action: "presence",
        userId,
        data,
        timestamp: Date.now(),
      };

      // Get ALL connections for this unit from DynamoDB
      const connectionIds = await getConnectionIds(unitId);
      const otherConnectionIds = connectionIds.filter(
        (id) => id !== connectionId,
      );

      let presenceCount = 0;
      const failedConnections: string[] = [];

      for (const connId of otherConnectionIds) {
        try {
          await sendToConnection(connId, presenceMessage);
          presenceCount++;
        } catch (error: any) {
          if (
            error.statusCode === 410 ||
            error.$metadata?.httpStatusCode === 410
          ) {
            failedConnections.push(connId);
          }
        }
      }

      // Clean up stale connections
      for (const staleId of failedConnections) {
        await ddb.send(
          new DeleteCommand({
            TableName: process.env.CONNECTIONS_TABLE_NAME!,
            Key: { connectionId: staleId },
          }),
        );
      }

      console.log(`[Presence] Updated ${presenceCount} clients`);

      return { statusCode: 200, body: "Presence updated" };
    }

    case "ping":
      // Keep-alive
      return { statusCode: 200, body: "Pong" };

    case "chat": {
      // Chat message in a collaboration room — moderate text content
      await addConnection(connectionId, unitId, userId);

      const chatText = data?.text || data?.message || "";
      const messageId = data?.messageId || `msg-${Date.now()}-${connectionId.slice(0, 8)}`;

      // Broadcast the message to peers immediately (non-blocking moderation)
      const chatMessage = {
        action: "chat",
        userId,
        unitId,
        data: { ...data, messageId },
        timestamp: Date.now(),
      };

      const chatConnectionIds = await getConnectionIds(unitId);
      // Send to ALL connections including sender (confirmation)
      const allChatConnections = chatConnectionIds;

      for (const connId of allChatConnections) {
        try {
          await sendToConnection(connId, chatMessage);
        } catch (error: any) {
          if (
            error.statusCode === 410 ||
            error.$metadata?.httpStatusCode === 410
          ) {
            await ddb.send(
              new DeleteCommand({
                TableName: process.env.CONNECTIONS_TABLE_NAME!,
                Key: { connectionId: connId },
              }),
            );
          }
        }
      }

      // Moderate text asynchronously — retract + notify if flagged
      if (chatText && chatText.length > 0 && isReview) {
        moderateChatMessage(chatText, unitId, userId, messageId, allChatConnections).catch(
          (err) =>
            console.warn(
              "[Moderation] Chat moderation failed (non-blocking):",
              err,
            ),
        );
      }

      return { statusCode: 200, body: "Chat message sent" };
    }

    default:
      console.warn(`Unknown action: ${action}`);
      return { statusCode: 400, body: `Unknown action: ${action}` };
  }
}

/**
 * Persist Yjs snapshot to Amplify Data (Unit table in DynamoDB)
 */
async function persistToAmplifyData(
  unitId: string,
  yUpdate: any,
  userId: string,
): Promise<void> {
  try {
    console.log(`[Persist] Saving Yjs snapshot for unit ${unitId}`);

    // Update the Unit table directly using DynamoDB DocumentClient
    // The 'data' field in Unit model stores Lexical/Yjs JSON content
    await ddb.send(
      new UpdateCommand({
        TableName: process.env.UNIT_TABLE_NAME!,
        Key: { id: unitId },
        UpdateExpression: "SET #data = :data, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#data": "data",
        },
        ExpressionAttributeValues: {
          ":data": yUpdate, // Store the Yjs update as JSON
          ":updatedAt": new Date().toISOString(),
        },
      }),
    );

    console.log(`[Persist] Successfully saved Yjs snapshot for unit ${unitId}`);
  } catch (error) {
    console.error(`Failed to persist Yjs snapshot:`, error);
    // Don't throw - WebSocket connection should remain alive even if persistence fails
  }
}

function shouldPersist(data: any, updateCount?: number): boolean {
  // Persist on every Nth update (e.g., every 100 updates) or based on data size
  // This reduces DynamoDB writes while maintaining reasonable persistence frequency
  if (!data) return false;

  // If updateCount is provided, use it for throttling
  if (updateCount !== undefined) {
    return updateCount % 100 === 0;
  }

  // Fallback: check if data has updateCount property
  return data.updateCount && data.updateCount % 100 === 0;
}

/**
 * Send message to a WebSocket connection
 * Supports both JSON messages and binary data (Uint8Array for Yjs)
 */
async function sendToConnection(
  connectionId: string,
  message: any,
): Promise<void> {
  if (!apiGatewayClient) {
    throw new Error("API Gateway Management API client not initialized");
  }

  let data: string | Uint8Array;

  // Check if message.data contains binary Yjs update (Uint8Array or number array)
  if (
    message.data &&
    (message.data instanceof Uint8Array || Array.isArray(message.data))
  ) {
    // Convert to Uint8Array if it's a regular array
    const binaryData =
      message.data instanceof Uint8Array
        ? message.data
        : new Uint8Array(message.data);

    // Send as binary WebSocket frame
    // The client will receive this as ArrayBuffer
    data = binaryData;
  } else {
    // Send as text WebSocket frame (JSON)
    data = JSON.stringify(message);
  }

  const command = new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: data,
  });

  await apiGatewayClient.send(command);
}

/**
 * Authorize a user for a review room.
 *
 * Validates that the user is either:
 * 1. The owner of the HomeworkRoom
 * 2. Listed in invitedUserIds
 * 3. An admin or instructor (via Cognito groups — handled by API Gateway authorizer)
 *
 * Uses the HOMEWORK_ROOM_TABLE_NAME env var to query HomeworkRoom by room ID.
 */
async function authorizeReviewAccess(
  docName: string,
  userId: string,
): Promise<boolean> {
  const roomId = extractRoomId(docName);

  try {
    const result = await ddb.send(
      new QueryCommand({
        TableName: process.env.HOMEWORK_ROOM_TABLE_NAME!,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
          ":id": roomId,
        },
      }),
    );

    const room = result.Items?.[0];
    if (!room) {
      console.warn(`[Auth] Review room ${roomId} not found`);
      return false;
    }

    // Owner always has access
    if (room.ownerId === userId || room.owner === userId) {
      return true;
    }

    // Check if user is in the invited list
    const invitedUserIds: string[] = room.invitedUserIds || [];
    if (invitedUserIds.includes(userId)) {
      return true;
    }

    // Room is closed — no new connections
    if (room.status === "REVIEW_COMPLETE") {
      console.warn(`[Auth] Review room ${roomId} is closed`);
      return false;
    }

    return false;
  } catch (error) {
    console.error(`[Auth] Error checking review room access:`, error);
    // Fail closed — deny access on error
    return false;
  }
}

/**
 * Moderate a chat message from a collaboration room.
 * If flagged:
 *   1. Broadcasts a 'retract' event to all connected peers so clients can hide/redact
 *   2. Creates MODERATION_FLAGGED notifications for the section instructor
 * Non-blocking — errors are logged but don't affect the chat flow.
 */
async function moderateChatMessage(
  text: string,
  docName: string,
  userId: string,
  messageId: string,
  connectionIds: string[],
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Moderation] OPENAI_API_KEY not configured — skipping chat moderation",
    );
    return;
  }

  // Call OpenAI moderation API
  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: text,
    }),
  });

  if (!response.ok) {
    console.warn(`[Moderation] API error: ${response.statusText}`);
    return;
  }

  const moderationData = await response.json();
  const result = moderationData.results[0];

  if (!result.flagged) return;

  const flaggedCategories = Object.entries(result.categories || {})
    .filter(([, v]) => v === true)
    .map(([k]) => k as string);

  console.warn("[Moderation] Chat message flagged:", {
    userId,
    docName,
    messageId,
    categories: flaggedCategories,
  });

  // 1. Broadcast retract event to all connected peers
  const retractMessage = {
    action: "retract",
    messageId,
    reason: "content_policy",
    timestamp: Date.now(),
  };

  for (const connId of connectionIds) {
    try {
      await sendToConnection(connId, retractMessage);
    } catch (error: any) {
      // Stale connections are fine — they'll get cleaned up on next message
      if (error.statusCode !== 410 && error.$metadata?.httpStatusCode !== 410) {
        console.warn(`[Moderation] Failed to send retract to ${connId}`);
      }
    }
  }

  console.log(`[Moderation] Retract sent to ${connectionIds.length} peers for message ${messageId}`);

  // 2. Notify section instructor(s) and admins
  const roomId = extractRoomId(docName);
  try {
    const roomResult = await ddb.send(
      new QueryCommand({
        TableName: process.env.HOMEWORK_ROOM_TABLE_NAME!,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": roomId },
      }),
    );

    const room = roomResult.Items?.[0];
    if (!room) return;

    const sectionId = room.sectionID;
    if (!sectionId) return;

    // Look up section to find instructor
    const sectionResult = await ddb.send(
      new QueryCommand({
        TableName:
          process.env.SECTION_TABLE_NAME ||
          process.env.UNIT_TABLE_NAME!.replace("Unit", "Section"),
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": sectionId },
      }),
    );

    const section = sectionResult.Items?.[0];
    if (!section) return;

    const recipientIds: string[] = [];
    if (section.instructor) recipientIds.push(section.instructor);
    if (section.owner && section.owner !== section.instructor)
      recipientIds.push(section.owner);

    if (recipientIds.length === 0) return;

    // Create notifications via DynamoDB directly (no GraphQL client in WebSocket Lambda)
    const notificationTableName = process.env.NOTIFICATION_TABLE_NAME;
    if (!notificationTableName) {
      console.warn("[Moderation] NOTIFICATION_TABLE_NAME not configured");
      return;
    }

    const now = new Date().toISOString();
    for (const recipientId of recipientIds) {
      await ddb.send(
        new PutCommand({
          TableName: notificationTableName,
          Item: {
            id: `mod-${roomId}-${Date.now()}-${recipientId.slice(0, 8)}`,
            recipientId,
            type: "MODERATION_FLAGGED",
            category: "MODERATION",
            title: "Chat message flagged in collaboration room",
            body: `A message in a collaboration room was flagged for: ${flaggedCategories.join(", ")}`,
            linkPath: `/review/${roomId}`,
            linkLabel: "Review Room",
            referenceId: roomId,
            referenceType: "HomeworkRoom",
            senderName: "Moderation System",
            seen: false,
            interacted: false,
            metadata: JSON.stringify({
              userId,
              messageId,
              flaggedCategories,
              roomId,
              sectionId,
              retracted: true,
            }),
            createdAt: now,
            updatedAt: now,
            __typename: "Notification",
          },
        }),
      );
    }

    console.log(
      `[Moderation] Notified ${recipientIds.length} instructor(s) about flagged chat in room ${roomId}`,
    );
  } catch (err) {
    console.warn("[Moderation] Failed to notify instructors:", err);
  }
}
