/**
 * HLS Manifest Proxy
 *
 * Fetches an HLS .m3u8 manifest from CloudFront (using a signed URL) and
 * rewrites every relative segment path to an absolute CloudFront signed URL,
 * so video.js can load individual .ts segments directly from CloudFront
 * without needing signed cookies.
 *
 * GET /api/hls?path=protected/{identityId}/{fileId}/{fileId}.m3u8
 *
 * Requires:
 *  - Authenticated Amplify session (Instructor or Admin group)
 *  - NEXT_PUBLIC_CDN_DOMAIN env var pointing at the CloudFront distribution
 *  - SSM parameters /homework-supply/cloudfront/private-key (SecureString)
 *    and /homework-supply/cloudfront/key-pair-id (String)
 */

import { NextRequest, NextResponse } from "next/server";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { validateAuth } from "../_shared/auth";
import { getServerClient } from "@/utils/amplifyServerClient";

// CloudFront signed URL TTL for segments: 6 hours (long enough for a full viewing session)
const SEGMENT_TTL_MS = 6 * 60 * 60 * 1000;
// Manifest signed URL TTL: 30 seconds (just long enough to fetch it server-side)
const MANIFEST_TTL_MS = 30 * 1000;

// Module-level cold-start cache for CloudFront credentials
let cfPrivateKey: string | null = null;
let cfKeyPairId: string | null = null;

async function loadCFCredentials(): Promise<{
  privateKey: string;
  keyPairId: string;
}> {
  if (cfPrivateKey && cfKeyPairId) {
    return { privateKey: cfPrivateKey, keyPairId: cfKeyPairId };
  }

  const region = process.env.AWS_REGION ?? "us-east-1";
  const ssm = new SSMClient({ region });

  const [pkResult, kpResult] = await Promise.all([
    ssm.send(
      new GetParameterCommand({
        Name: "/homework-supply/cloudfront/private-key",
        WithDecryption: true,
      }),
    ),
    ssm.send(
      new GetParameterCommand({
        Name: "/homework-supply/cloudfront/key-pair-id",
      }),
    ),
  ]);

  const privateKey = pkResult.Parameter?.Value;
  const keyPairId = kpResult.Parameter?.Value;

  if (!privateKey || !keyPairId) {
    throw new Error("CloudFront signing credentials not found in SSM");
  }

  cfPrivateKey = privateKey;
  cfKeyPairId = keyPairId;

  return { privateKey, keyPairId };
}

/**
 * Generate a CloudFront canned-policy signed URL using Node.js built-in crypto.
 * Avoids requiring @aws-sdk/cloudfront-signer in the root package.json.
 */
function signCFUrl(
  url: string,
  privateKey: string,
  keyPairId: string,
  expiresAt: number, // Unix epoch seconds
): string {
  // Dynamic import crypto (Node built-in, always available in Next.js edge/node runtime)
  const crypto = require("crypto") as typeof import("crypto");

  const policy = JSON.stringify({
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: { "AWS:EpochTime": expiresAt },
        },
      },
    ],
  });

  const sign = crypto.createSign("RSA-SHA1");
  sign.update(Buffer.from(policy));
  const rawSig = sign.sign(privateKey, "base64");

  // CloudFront base64 uses `-` `_` `~` instead of `+` `=` `/`
  const signature = rawSig
    .replace(/\+/g, "-")
    .replace(/=/g, "_")
    .replace(/\//g, "~");

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}Expires=${expiresAt}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;
}

export async function GET(request: NextRequest) {
  // 1. Require authenticated session
  const auth = await validateAuth();
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Role-based access: Instructors/Admins can sign any path.
  //    Learners must prove enrollment for the requested content.
  const groups = auth.groups ?? [];
  const isPrivileged =
    groups.includes("Admins") || groups.includes("Instructors");

  // 3. Validate query param
  const { searchParams } = new URL(request.url);
  const hlsPath = searchParams.get("path");

  if (!hlsPath) {
    return NextResponse.json(
      { error: "Missing 'path' parameter" },
      { status: 400 },
    );
  }

  // Only allow access to protected HLS output paths
  if (!hlsPath.startsWith("protected/") || !hlsPath.endsWith(".m3u8")) {
    return NextResponse.json(
      { error: "Invalid path: must be a protected .m3u8 path" },
      { status: 400 },
    );
  }

  // 4. Enrollment check for non-privileged users (Learners)
  if (!isPrivileged) {
    const authorized = await verifyHlsEnrollment(hlsPath, auth.userId!);
    if (!authorized) {
      console.warn(
        `[/api/hls] Denied: user ${auth.userId} not enrolled for path ${hlsPath}`,
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN;
  if (!cdnDomain) {
    return NextResponse.json({ error: "CDN not configured" }, { status: 503 });
  }

  try {
    const { privateKey, keyPairId } = await loadCFCredentials();

    // 3. Fetch the manifest via a short-lived signed URL
    const manifestUrl = `https://${cdnDomain}/${hlsPath}`;
    const manifestExpiresAt = Math.floor((Date.now() + MANIFEST_TTL_MS) / 1000);
    const signedManifestUrl = signCFUrl(
      manifestUrl,
      privateKey,
      keyPairId,
      manifestExpiresAt,
    );

    const manifestRes = await fetch(signedManifestUrl);
    if (!manifestRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch manifest: ${manifestRes.status}` },
        {
          status:
            manifestRes.status >= 400 && manifestRes.status < 500 ? 404 : 502,
        },
      );
    }

    const manifestText = await manifestRes.text();

    // 4. Rewrite relative segment paths (.ts) to absolute CloudFront signed URLs
    // The base path for resolution is the directory containing the manifest
    const manifestDir = hlsPath.substring(0, hlsPath.lastIndexOf("/") + 1);
    const segmentExpiresAt = Math.floor((Date.now() + SEGMENT_TTL_MS) / 1000);

    const rewritten = manifestText
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        // Skip HLS directives, comments, and empty lines
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("http")) {
          return line;
        }
        // Rewrite relative segment paths (.ts) and potential variant playlist paths (.m3u8)
        if (trimmed.endsWith(".ts") || trimmed.endsWith(".m3u8")) {
          const segmentPath = trimmed.startsWith("/")
            ? trimmed.slice(1) // absolute-root path
            : `${manifestDir}${trimmed}`; // relative path
          const segmentUrl = `https://${cdnDomain}/${segmentPath}`;
          return signCFUrl(segmentUrl, privateKey, keyPairId, segmentExpiresAt);
        }
        return line;
      })
      .join("\n");

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/x-mpegURL",
        // Do not cache — signed URLs have their own TTL
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[/api/hls] Error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Verify that a Learner is enrolled in a section that has a unit
 * containing the requested HLS file.
 *
 * Path format: protected/{identityId}/{fileId}/{fileId}.m3u8
 *
 * Strategy:
 * 1. If the path's identityId matches the user's own identity → allow (own recording)
 * 2. Otherwise, look up the File by path → find linked Units via UnitFile →
 *    check if any Assignment exists linking the unit to a section the learner belongs to.
 */
async function verifyHlsEnrollment(
  hlsPath: string,
  userId: string,
): Promise<boolean> {
  try {
    const client = getServerClient() as any;

    // Look up File record by path to find the associated unit(s)
    const { data: files } = await client.models.File.list({
      filter: {
        path: { beginsWith: hlsPath.split("/").slice(0, 3).join("/") },
      },
      limit: 1,
      selectionSet: ["id", "identityId", "owner", "unitFiles.unitID"],
    });

    if (!files || files.length === 0) {
      // File not in DB — could be a direct path; deny by default
      return false;
    }

    const file = files[0];

    // If user owns this file (their own recording), allow
    if (file.owner === userId) {
      return true;
    }

    // Get unitIDs from the UnitFile join
    const unitIds: string[] = (file.unitFiles || [])
      .map((uf: any) => uf.unitID)
      .filter(Boolean);

    if (unitIds.length === 0) {
      // File not linked to any unit — deny
      return false;
    }

    // Check if user has an assignment for any of these units
    // (Assignment.owner = learner userId when assigned)
    for (const unitID of unitIds) {
      const { data: assignments } = await client.models.Assignment.list({
        filter: { unitID: { eq: unitID }, owner: { eq: userId } },
        limit: 1,
        selectionSet: ["id"],
      });

      if (assignments && assignments.length > 0) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("[/api/hls] Enrollment check failed:", err);
    // Fail closed — deny access on error
    return false;
  }
}
