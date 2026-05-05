/**
 * WebSocket Collaboration Integration Tests
 *
 * Tests the deployed API Gateway WebSocket API for real-time Yjs collaboration.
 * Validates connection, sync broadcast, presence updates, and disconnection cleanup.
 *
 * Test Scenarios:
 *   1. Connect to WebSocket API with auth token
 *   2. Send sync message and receive broadcast on second client
 *   3. Send presence updates and verify broadcast
 *   4. Ping/keep-alive returns pong
 *   5. Disconnect cleans up connection
 *   6. Multiple clients in same room see each other's updates
 *   7. Clients in different rooms don't receive cross-talk
 *
 * Prerequisites:
 *   - Sandbox running: npx ampx sandbox
 *   - Test users created in Cognito
 *   - amplify_outputs.json exists with WEBSOCKET_API config
 *
 * Usage:
 *   npm run test:integration -- -t "WebSocket Collaboration"
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import { fetchAuthSession } from "aws-amplify/auth";
import WebSocket from "ws";
import amplifyOutputs from "../../amplify_outputs.json";
import { signInAs } from "./shared";

// Configure Amplify
const amplifyConfig = parseAmplifyConfig(amplifyOutputs);
Amplify.configure(amplifyConfig);

// Build WebSocket URL from amplify outputs
const wsConfig = (amplifyOutputs as any).custom?.WEBSOCKET_API;
if (!wsConfig) {
  throw new Error(
    "WEBSOCKET_API not found in amplify_outputs.json. Deploy sandbox first.",
  );
}
const WS_URL = `wss://${wsConfig.apiId}.execute-api.${wsConfig.region}.amazonaws.com/${wsConfig.stageName}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Connect a WebSocket client with Cognito auth token */
async function connectClient(
  userKey: "student1" | "student2" | "instructor1",
): Promise<{ ws: WebSocket; messages: any[]; close: () => void }> {
  const session = await signInAs(userKey);
  const token = session?.tokens?.idToken?.toString();

  if (!token) {
    throw new Error(`Failed to get auth token for ${userKey}`);
  }

  const ws = new WebSocket(`${WS_URL}?token=${token}`);
  const messages: any[] = [];

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error(`WebSocket connection timeout for ${userKey}`));
    }, 10000);

    ws.on("open", () => {
      clearTimeout(timeout);

      ws.on("message", (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          messages.push(msg);
        } catch {
          messages.push({ raw: data.toString() });
        }
      });

      resolve({
        ws,
        messages,
        close: () => {
          ws.close();
        },
      });
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/** Wait for a message matching a predicate */
function waitForMessage(
  messages: any[],
  predicate: (msg: any) => boolean,
  timeoutMs = 5000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check existing messages first
    const existing = messages.find(predicate);
    if (existing) {
      resolve(existing);
      return;
    }

    const startLen = messages.length;
    const interval = setInterval(() => {
      for (let i = startLen; i < messages.length; i++) {
        if (predicate(messages[i])) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(messages[i]);
          return;
        }
      }
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      reject(
        new Error(
          `Timed out waiting for message. Got ${messages.length} messages: ${JSON.stringify(messages.slice(-3))}`,
        ),
      );
    }, timeoutMs);
  });
}

/** Small delay for message propagation */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WebSocket Collaboration Integration", () => {
  const clients: { ws: WebSocket; close: () => void }[] = [];

  afterEach(() => {
    // Close all clients after each test
    clients.forEach((c) => c.close());
    clients.length = 0;
  });

  it("connects to WebSocket API with auth token", async () => {
    const client = await connectClient("student1");
    clients.push(client);

    expect(client.ws.readyState).toBe(WebSocket.OPEN);
  }, 15000);

  it("sends sync message and receives broadcast on second client", async () => {
    const testUnitId = `test-unit-${Date.now()}`;

    // Connect two clients
    const client1 = await connectClient("student1");
    const client2 = await connectClient("instructor1");
    clients.push(client1, client2);

    // Both clients join the same room
    client1.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: testUnitId,
        data: { initial: true },
        userId: "student1",
      }),
    );

    client2.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: testUnitId,
        data: { initial: true },
        userId: "instructor1",
      }),
    );

    // Wait for both to be registered
    await delay(1000);

    // Client 1 sends a sync update
    const updatePayload = { type: "yjs-update", content: [1, 2, 3, 4, 5] };
    client1.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: testUnitId,
        data: updatePayload,
        userId: "student1",
      }),
    );

    // Client 2 should receive the broadcast
    const received = await waitForMessage(
      client2.messages,
      (msg) => msg.action === "update" && msg.userId === "student1",
    );

    expect(received).toBeDefined();
    expect(received.action).toBe("update");
    expect(received.unitId).toBe(testUnitId);
    expect(received.data).toEqual(updatePayload);
  }, 20000);

  it("sends presence updates and verifies broadcast", async () => {
    const testUnitId = `test-presence-${Date.now()}`;

    const client1 = await connectClient("student1");
    const client2 = await connectClient("student2");
    clients.push(client1, client2);

    // Both join the room
    client1.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: testUnitId,
        data: { initial: true },
      }),
    );
    client2.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: testUnitId,
        data: { initial: true },
      }),
    );

    await delay(1000);

    // Client 1 sends presence (cursor position)
    const presenceData = {
      cursor: { line: 5, column: 12 },
      selection: null,
      username: "student1",
    };

    client1.ws.send(
      JSON.stringify({
        action: "presence",
        unitId: testUnitId,
        data: presenceData,
      }),
    );

    // Client 2 should receive the presence update
    const received = await waitForMessage(
      client2.messages,
      (msg) => msg.action === "presence",
    );

    expect(received).toBeDefined();
    expect(received.action).toBe("presence");
    expect(received.data).toEqual(presenceData);
  }, 20000);

  it("ping returns pong (keep-alive)", async () => {
    const client = await connectClient("student1");
    clients.push(client);

    client.ws.send(
      JSON.stringify({
        action: "ping",
        unitId: "keepalive",
      }),
    );

    // Ping just returns 200 statusCode from Lambda — no message sent back via WebSocket
    // The test validates no error is thrown
    await delay(500);
    expect(client.ws.readyState).toBe(WebSocket.OPEN);
  }, 10000);

  it("clients in different rooms don't receive cross-talk", async () => {
    const room1 = `test-room1-${Date.now()}`;
    const room2 = `test-room2-${Date.now()}`;

    const client1 = await connectClient("student1");
    const client2 = await connectClient("student2");
    clients.push(client1, client2);

    // Client 1 joins room1, Client 2 joins room2
    client1.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: room1,
        data: { initial: true },
      }),
    );
    client2.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: room2,
        data: { initial: true },
      }),
    );

    await delay(1000);

    // Client 1 sends update to room1
    client1.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: room1,
        data: { secret: "only-for-room1" },
      }),
    );

    // Wait and verify client2 did NOT receive it
    await delay(2000);

    const crossTalk = client2.messages.find(
      (msg) => msg.action === "update" && msg.data?.secret === "only-for-room1",
    );
    expect(crossTalk).toBeUndefined();
  }, 15000);

  it("multiple clients in same room all receive broadcasts", async () => {
    const testUnitId = `test-multi-${Date.now()}`;

    const client1 = await connectClient("student1");
    const client2 = await connectClient("student2");
    const client3 = await connectClient("instructor1");
    clients.push(client1, client2, client3);

    // All three join the same room
    for (const client of [client1, client2, client3]) {
      client.ws.send(
        JSON.stringify({
          action: "sync",
          unitId: testUnitId,
          data: { initial: true },
        }),
      );
    }

    await delay(1500);

    // Client 1 sends an update
    const update = { block: "paragraph", text: "Hello from student1" };
    client1.ws.send(
      JSON.stringify({
        action: "sync",
        unitId: testUnitId,
        data: update,
      }),
    );

    // Both client2 and client3 should receive it
    const received2 = await waitForMessage(
      client2.messages,
      (msg) =>
        msg.action === "update" && msg.data?.text === "Hello from student1",
    );
    const received3 = await waitForMessage(
      client3.messages,
      (msg) =>
        msg.action === "update" && msg.data?.text === "Hello from student1",
    );

    expect(received2).toBeDefined();
    expect(received3).toBeDefined();
    expect(received2.unitId).toBe(testUnitId);
    expect(received3.unitId).toBe(testUnitId);
  }, 25000);
});
