/**
 * rebuildNgramIndex Lambda handler
 *
 * Invoked via the `rebuildNgramIndex()` AppSync mutation (Admin-only).
 * Scans all published units in DynamoDB, reads their Lexical JSON from S3,
 * builds bigram and trigram frequency tables from node type sequences, and
 * writes the result to protected/units/ngrams/v1.json.
 *
 * The file is served via CloudFront behind the protected/units/* signed cookie
 * issued at app load by getUnitsCdnCookie — no separate auth call is needed.
 */

import type { Handler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromEnv } from "@aws-sdk/credential-providers";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { Schema } from "../../data/resource";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET = process.env.STORAGE_BUCKET!;

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const LIST_PUBLISHED_UNITS = /* GraphQL */ `
  query ListPublishedUnits($filter: ModelUnitFilterInput, $nextToken: String) {
    listUnits(filter: $filter, limit: 500, nextToken: $nextToken) {
      items {
        id
        publishedContentVersion
      }
      nextToken
    }
  }
`;

function getClient() {
  Amplify.configure(
    {
      API: {
        GraphQL: {
          endpoint: process.env.API_ENDPOINT!,
          region: process.env.AWS_REGION!,
          defaultAuthMode: "iam",
        },
      },
    },
    {
      Auth: {
        credentialsProvider: {
          getCredentialsAndIdentityId: async () => ({
            credentials: await fromEnv()(),
          }),
          clearCredentialsAndIdentityId: () => {},
        },
      },
    },
  );
  return generateClient<Schema>({ authMode: "iam" });
}

// ─── Ngram building ───────────────────────────────────────────────────────────

/**
 * Extract a flat sequence of node types from a Lexical JSON tree.
 * Only top-level content block types are included.
 */
function extractNodeTypeSequence(node: any, out: string[] = []): string[] {
  if (!node || typeof node !== "object") return out;
  if (node.type && node.type !== "root" && node.type !== "text") {
    out.push(node.type as string);
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      extractNodeTypeSequence(child, out);
    }
  }
  return out;
}

function buildNgrams(
  sequences: string[][],
): Record<string, Record<string, number>> {
  const ngrams: Record<string, Record<string, number>> = {};

  function increment(key: string, next: string) {
    if (!ngrams[key]) ngrams[key] = {};
    ngrams[key][next] = (ngrams[key][next] ?? 0) + 1;
  }

  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 1; i++) {
      // Unigram → next
      increment(seq[i], seq[i + 1]);
      // Bigram → next
      if (i > 0) {
        const bigramKey = `${seq[i - 1]}|${seq[i]}`;
        increment(bigramKey, seq[i + 1]);
      }
    }
  }

  return ngrams;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler: Handler = async () => {
  console.log("[rebuildNgramIndex] Starting index rebuild");

  // 1. List all published units (paginate)
  const client = getClient();
  const allUnits: Array<{
    id: string;
    publishedContentVersion: number | null;
  }> = [];
  let nextToken: string | null = null;

  do {
    const { data, errors } = (await client.graphql({
      query: LIST_PUBLISHED_UNITS,
      variables: {
        filter: { publishedContentVersion: { gt: 0 } },
        ...(nextToken ? { nextToken } : {}),
      },
    } as any)) as any;

    if (errors?.length) {
      console.error("[rebuildNgramIndex] List error:", errors);
      break;
    }

    const items = data?.listUnits?.items ?? [];
    allUnits.push(...items.filter((u: any) => u != null));
    nextToken = data?.listUnits?.nextToken ?? null;
  } while (nextToken);

  console.log("[rebuildNgramIndex] Found", allUnits.length, "published units");

  // 2. Fetch and parse Lexical JSON for each unit
  const sequences: string[][] = [];
  let processedCount = 0;

  await Promise.all(
    allUnits.map(async (unit) => {
      const publishedKey = `protected/units/${unit.id}/published.json`;
      try {
        const result = await s3.send(
          new GetObjectCommand({ Bucket: BUCKET, Key: publishedKey }),
        );
        if (!result.Body) return;
        const text = await result.Body.transformToString("utf-8");
        const lexical = JSON.parse(text);
        const seq = extractNodeTypeSequence(lexical?.root ?? lexical);
        if (seq.length > 0) {
          sequences.push(seq);
          processedCount++;
        }
      } catch {
        // Unit may not have a published.json yet — skip silently
      }
    }),
  );

  console.log("[rebuildNgramIndex] Processed", processedCount, "units");

  // 3. Build ngrams
  const ngrams = buildNgrams(sequences);

  const index = {
    version: 1,
    updatedAt: new Date().toISOString(),
    unitCount: processedCount,
    ngrams,
  };

  // 4. Write to protected/units/ngrams/v1.json
  const indexKey = "protected/units/ngrams/v1.json";
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: indexKey,
      Body: JSON.stringify(index),
      ContentType: "application/json",
      CacheControl: "public, max-age=3600, stale-while-revalidate=300",
    }),
  );

  console.log(
    "[rebuildNgramIndex] Wrote index to:",
    indexKey,
    "ngram keys:",
    Object.keys(ngrams).length,
  );
  return {
    success: true,
    unitCount: processedCount,
    ngramKeyCount: Object.keys(ngrams).length,
  };
};
