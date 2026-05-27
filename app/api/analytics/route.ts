/**
 * Analytics Event Ingestion API Route
 *
 * Receives buffered analytics events from the client SDK (src/utils/analytics.ts),
 * enriches them with geo data from CloudFront headers, and writes to Kinesis.
 *
 * Events are sent via navigator.sendBeacon — Content-Type may be text/plain.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  KinesisClient,
  PutRecordsCommand,
  type PutRecordsRequestEntry,
} from "@aws-sdk/client-kinesis";
import { validateAuth } from "../_shared/auth";

const STREAM_NAME =
  process.env.ANALYTICS_STREAM_NAME || "homework-supply-analytics";
const REGION = process.env.AWS_REGION || "us-east-1";

let kinesisClient: KinesisClient | null = null;

function getKinesisClient(): KinesisClient {
  if (!kinesisClient) {
    kinesisClient = new KinesisClient({ region: REGION });
  }
  return kinesisClient;
}

interface ClientEvent {
  name: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  userRole?: string;
  sectionId?: string;
  squadId?: string;
  unitId?: string;
  path?: string;
  attributes?: Record<string, string>;
  metrics?: Record<string, number>;
}

export async function POST(request: NextRequest) {
  // Authenticate — only logged-in users can submit analytics
  const auth = await validateAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let events: ClientEvent[];
  try {
    const body = await request.text();
    events = JSON.parse(body);
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: "Expected array" }, { status: 400 });
    }
    // Limit batch size to prevent abuse
    if (events.length > 100) {
      events = events.slice(0, 100);
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract geo from CloudFront headers (free with Amplify/CloudFront)
  const geo = {
    country: request.headers.get("CloudFront-Viewer-Country") || "unknown",
    region:
      request.headers.get("CloudFront-Viewer-Country-Region-Name") || undefined,
    city: request.headers.get("CloudFront-Viewer-City") || undefined,
    timezone: request.headers.get("CloudFront-Viewer-Time-Zone") || undefined,
  };

  // Enrich events with server-side data
  const enrichedEvents = events.map((event) => ({
    ...event,
    // Override userId with server-verified identity
    userId: auth.userId,
    geo,
  }));

  // Write to Kinesis
  try {
    const client = getKinesisClient();
    const records: PutRecordsRequestEntry[] = enrichedEvents.map((event) => ({
      Data: Buffer.from(JSON.stringify(event)),
      // Partition by userId for ordered per-user events
      PartitionKey: auth.userId || event.sessionId || "anonymous",
    }));

    await client.send(
      new PutRecordsCommand({
        StreamName: STREAM_NAME,
        Records: records,
      }),
    );
  } catch (err) {
    console.error("[Analytics API] Kinesis write failed:", err);
    // Return 202 anyway — analytics failures should not block the client
    return new NextResponse(null, { status: 202 });
  }

  return new NextResponse(null, { status: 204 });
}
