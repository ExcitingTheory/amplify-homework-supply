/**
 * Web Vitals Ingestion API Route
 *
 * Receives individual Web Vitals measurements from instrumentation-client.ts,
 * enriches with geo data from CloudFront headers, and writes to Kinesis.
 *
 * Measurements are sent via navigator.sendBeacon — Content-Type may be text/plain.
 */

import { NextRequest, NextResponse } from "next/server";
import { KinesisClient, PutRecordCommand } from "@aws-sdk/client-kinesis";

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

interface VitalPayload {
  type: "web-vital";
  name: string;
  value: number;
  rating: string;
  delta: number;
  id: string;
  path: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  // Web Vitals don't require auth — they fire before hydration.
  // We still enrich with geo but don't gate on login.
  let vital: VitalPayload;
  try {
    const body = await request.text();
    vital = JSON.parse(body);
    if (vital.type !== "web-vital" || !vital.name || vital.value == null) {
      return NextResponse.json({ error: "Invalid vital" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract geo from CloudFront headers
  const geo = {
    country: request.headers.get("CloudFront-Viewer-Country") || "unknown",
    region:
      request.headers.get("CloudFront-Viewer-Country-Region-Name") || undefined,
    city: request.headers.get("CloudFront-Viewer-City") || undefined,
    timezone: request.headers.get("CloudFront-Viewer-Time-Zone") || undefined,
  };

  const enrichedVital = { ...vital, geo };

  // Write to Kinesis
  try {
    const client = getKinesisClient();
    await client.send(
      new PutRecordCommand({
        StreamName: STREAM_NAME,
        Data: Buffer.from(JSON.stringify(enrichedVital)),
        // Partition by path for per-page aggregation
        PartitionKey: vital.path || "/",
      }),
    );
  } catch (err) {
    console.error("[Vitals API] Kinesis write failed:", err);
    return new NextResponse(null, { status: 202 });
  }

  return new NextResponse(null, { status: 204 });
}
