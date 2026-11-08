#!/usr/bin/env npx tsx
/**
 * Admin CLI: Rebuild Search Bundles
 *
 * Invokes the deployed rebuildSearchBundle Lambda. The Lambda discovers every
 * instructor identity from S3, rebuilds each instructor bundle, then writes the
 * admin-only platform bundle (admin/search-index/platform.json). The same job
 * also runs nightly via EventBridge; use this to reindex on demand.
 *
 * Usage:
 *   npx tsx scripts/rebuild-search-bundles.ts                       # all instructors + platform
 *   npx tsx scripts/rebuild-search-bundles.ts --user <identityId>   # one instructor (and their unit bundles)
 *
 * The function name is read from REBUILD_SEARCH_BUNDLE_FUNCTION, falling back to
 * custom.REBUILD_SEARCH_BUNDLE.functionName in amplify_outputs.json.
 */

import { readFileSync } from "node:fs";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

interface Args {
  user?: string;
}

function parseArgs(argv: string[]): Args {
  const flag = argv.indexOf("--user");
  return { user: flag >= 0 ? argv[flag + 1] : undefined };
}

function resolveFunctionName(): string {
  const fromEnv = process.env.REBUILD_SEARCH_BUNDLE_FUNCTION;
  if (fromEnv) return fromEnv;

  try {
    const outputs = JSON.parse(readFileSync("amplify_outputs.json", "utf8"));
    const name = outputs?.custom?.REBUILD_SEARCH_BUNDLE?.functionName;
    if (name) return name;
  } catch {
    // Fall through to the error below.
  }
  throw new Error(
    "Unknown function name. Set REBUILD_SEARCH_BUNDLE_FUNCTION or deploy a backend whose amplify_outputs.json includes custom.REBUILD_SEARCH_BUNDLE.functionName.",
  );
}

async function invoke(
  lambda: LambdaClient,
  functionName: string,
  payload: Record<string, unknown>,
): Promise<any> {
  const response = await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(payload)),
      InvocationType: "RequestResponse",
    }),
  );
  const result = response.Payload
    ? JSON.parse(Buffer.from(response.Payload).toString())
    : null;
  if (response.FunctionError) {
    throw new Error(
      `Lambda ${response.FunctionError}: ${result?.errorMessage ?? JSON.stringify(result)}`,
    );
  }
  return result;
}

async function main() {
  const { user } = parseArgs(process.argv.slice(2));
  const functionName = resolveFunctionName();
  const lambda = new LambdaClient({});

  const payload = user
    ? { source: "admin-reindex", identityId: user }
    : { source: "platform-reindex" };

  console.log(`[rebuild-search-bundles] Function: ${functionName}`);
  console.log(`[rebuild-search-bundles] Payload: ${JSON.stringify(payload)}`);

  const startedAt = Date.now();
  const result = await invoke(lambda, functionName, payload);
  const body = result?.body ?? result;

  console.log(
    `\nDone in ${((Date.now() - startedAt) / 1000).toFixed(1)}s (status ${result?.statusCode}).`,
  );
  console.log(`Items indexed: ${body?.itemsProcessed ?? 0}`);
  console.log(`Index strategy: ${body?.strategy ?? "n/a"}`);
  if (!user) {
    console.log(`Instructors indexed: ${body?.instructors ?? 0}`);
    const failed: string[] = body?.failedInstructors ?? [];
    if (failed.length > 0) {
      console.error(
        `Failed instructors (${failed.length}): ${failed.join(", ")}`,
      );
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
