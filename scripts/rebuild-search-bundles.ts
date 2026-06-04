#!/usr/bin/env npx tsx
/**
 * Admin CLI: Rebuild Search Bundles
 *
 * Pages all Unit records via DynamoDB, groups by owner identityId,
 * then invokes the rebuildSearchBundle Lambda for each instructor.
 *
 * Usage:
 *   npm run search:reindex              # all instructors, skip fresh
 *   npm run search:reindex -- --force   # regenerate all embeddings
 *   npm run search:reindex -- --user <identityId>  # single instructor
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({});
const FUNCTION_NAME =
  process.env.REBUILD_SEARCH_BUNDLE_FUNCTION || "rebuildSearchBundle";
const CONCURRENCY_CAP = 5;

interface Args {
  force: boolean;
  user?: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  return {
    force: args.includes("--force"),
    user: args.find((_, i) => args[i - 1] === "--user"),
  };
}

async function invokeLambda(identityId: string, force: boolean): Promise<any> {
  const payload = {
    source: "admin-reindex" as const,
    identityId,
    force,
  };

  const command = new InvokeCommand({
    FunctionName: FUNCTION_NAME,
    Payload: Buffer.from(JSON.stringify(payload)),
    InvocationType: "RequestResponse",
  });

  const response = await lambda.send(command);
  const result = response.Payload
    ? JSON.parse(Buffer.from(response.Payload).toString())
    : null;
  return result;
}

async function getAllInstructorIdentities(): Promise<string[]> {
  // In a real implementation, this would page through DynamoDB Unit table
  // and collect unique owner/identityId values.
  // For now, this is a placeholder that should be replaced with actual
  // Amplify Data Client or DynamoDB SDK calls.
  console.error(
    "[rebuild-search-bundles] TODO: Implement DynamoDB scan for instructor identities.\n" +
      "For now, use --user <identityId> to target a specific instructor.",
  );
  return [];
}

async function processInBatches(
  identities: string[],
  force: boolean,
): Promise<void> {
  const results: {
    identityId: string;
    success: boolean;
    items?: number;
    error?: string;
  }[] = [];
  const startTime = Date.now();

  for (let i = 0; i < identities.length; i += CONCURRENCY_CAP) {
    const batch = identities.slice(i, i + CONCURRENCY_CAP);
    const batchResults = await Promise.allSettled(
      batch.map(async (identityId) => {
        const result = await invokeLambda(identityId, force);
        return { identityId, result };
      }),
    );

    for (const settled of batchResults) {
      if (settled.status === "fulfilled") {
        const { identityId, result } = settled.value;
        const body = result?.body || result;
        results.push({
          identityId,
          success: true,
          items: body?.itemsProcessed,
        });
        console.log(
          `  ✓ ${identityId}: ${body?.itemsProcessed || 0} items, strategy=${body?.strategy}`,
        );
      } else {
        results.push({
          identityId: batch[batchResults.indexOf(settled)],
          success: false,
          error: settled.reason?.message,
        });
        console.error(
          `  ✗ ${batch[batchResults.indexOf(settled)]}: ${settled.reason?.message}`,
        );
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalItems = results.reduce((sum, r) => sum + (r.items || 0), 0);

  console.log("\n--- Summary ---");
  console.log(`Time: ${elapsed}s`);
  console.log(`Instructors: ${succeeded} succeeded, ${failed} failed`);
  console.log(`Total items indexed: ${totalItems}`);
}

async function main() {
  const { force, user } = parseArgs();

  console.log(`[rebuild-search-bundles] force=${force} user=${user || "all"}`);
  console.log(`[rebuild-search-bundles] Function: ${FUNCTION_NAME}`);
  console.log(`[rebuild-search-bundles] Concurrency: ${CONCURRENCY_CAP}\n`);

  let identities: string[];

  if (user) {
    identities = [user];
  } else {
    identities = await getAllInstructorIdentities();
    if (identities.length === 0) {
      process.exit(1);
    }
  }

  console.log(`Processing ${identities.length} instructor(s)...\n`);
  await processInBatches(identities, force);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
