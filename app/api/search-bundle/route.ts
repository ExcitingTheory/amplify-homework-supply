/**
 * Search Bundle Proxy
 *
 * Serves semantic-search bundles to the people entitled to them. The bundles
 * sit at S3 keys no client storage rule can read, so this route is the only
 * way in:
 *  - unit: admins, the owner, collaborators, and anyone enrolled in a section
 *    that assigns the unit
 *  - section: admins, enrolled members, and the section's instructor
 *  - instructor: only that instructor (id must be their own identity id)
 *
 * GET /api/search-bundle?kind=unit|section|instructor&id={id}
 *
 * Supports ETag revalidation (If-None-Match -> 304) so clients and offline
 * caches only download a bundle after it changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "../_shared/auth";
import {
  canReadBundle,
  createBundleAccessData,
  instructorBundlePath,
  sectionBundlePath,
  unitBundlePath,
  type BundleKind,
} from "../_shared/searchBundleAccess";
import { loadBundleObject } from "../_shared/serverSearch";

// Record ids are UUIDs and identity ids look like "us-east-1:uuid"; refuse
// anything that could alter the S3 key.
const ID_PATTERN = /^[A-Za-z0-9_:-]{1,128}$/;
const KINDS = ["unit", "section", "instructor"];

export async function GET(request: NextRequest) {
  const auth = await validateAuth();
  if (!auth.authenticated || !auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");
  if (!kind || !KINDS.includes(kind) || !id || !ID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "Expected kind=unit|section|instructor and a valid id" },
      { status: 400 },
    );
  }

  try {
    const allowed = await canReadBundle(
      kind as BundleKind,
      {
        userId: auth.userId,
        groups: auth.groups ?? [],
        identityId: auth.identityId,
        ownerIds: auth.ownerIds ?? [auth.userId],
      },
      id,
      createBundleAccessData(),
    );
    // Same answer for "not allowed" and "does not exist" so ids cannot be probed.
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const path =
      kind === "unit"
        ? unitBundlePath(id)
        : kind === "section"
          ? sectionBundlePath(id)
          : instructorBundlePath(id);
    const bundle = await loadBundleObject(
      path,
      request.headers.get("if-none-match"),
    );
    if (!bundle) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const headers: Record<string, string> = {
      // Per-user content: revalidate every time, never share between users.
      "Cache-Control": "private, no-cache",
    };
    if (bundle.etag) headers.ETag = bundle.etag;

    if (bundle.status === 304) {
      return new NextResponse(null, { status: 304, headers });
    }
    return new NextResponse(bundle.body, {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[/api/search-bundle] Error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
