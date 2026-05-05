/**
 * Local Yjs WebSocket dev server for testing presence/collaboration features.
 *
 * Starts the YjsWebSocketServer on port 3001 (default) so the frontend
 * YjsProvider connects to ws://localhost:3001 during local development.
 *
 * Usage: npx tsx scripts/yjs-dev-server.ts
 */

import { YjsWebSocketServer } from "../amplify/functions/yjsSync/index";

const port = parseInt(process.env.YJS_PORT || "3001", 10);

const server = new YjsWebSocketServer({
  port,
  persistCallback: async (roomName, _update, state) => {
    // In local dev, just log persistence events (no DynamoDB)
    console.log(
      `[Dev] Would persist room "${roomName}" (${state.length} bytes)`,
    );
  },
});

server.start().then(() => {
  console.log(`\n  Yjs WebSocket dev server running on ws://localhost:${port}`);
  console.log(`  Press Ctrl+C to stop\n`);
});

process.on("SIGINT", () => {
  console.log("\n[Dev] Shutting down...");
  server.stop().then(() => process.exit(0));
});

process.on("SIGTERM", () => {
  server.stop().then(() => process.exit(0));
});
