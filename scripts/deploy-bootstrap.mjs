#!/usr/bin/env node
/**
 * Orchestrates a from-scratch Amplify deploy across multiple phases to stay
 * under CloudFormation's ~2500-resources-per-deploy-operation cap (this
 * schema's 40+ models exceed that cap in a single shot, and even a 2-phase
 * split — one phase carrying roughly half the schema).
 *
 * Two modes, chosen via CLI flag (default: sandbox):
 *   --mode=sandbox                          -> `npx ampx sandbox --once` (local, personal)
 *   --mode=pipeline --branch=<b> --app-id=<id> -> `npx ampx pipeline-deploy --branch <b> --app-id <id>` (CI, matches amplify.yml)
 *
 * AMPLIFY_BOOTSTRAP_PHASE=<N> with AMPLIFY_BOOTSTRAP_TOTAL_PHASES=<T>
 * deploys the cumulative model set for phase N (see
 * computeBootstrapPhases in amplify/custom/dataStackWaveOrder/resource.ts)
 * — each phase is a strict superset of the previous one, so phases only
 * ever ADD models, never remove ones already deployed.
 *
 * The phase loop (1..T) always runs, whether or not a target stack already
 * exists (as long as it isn't in a FAILED status — see below) — re-running
 * an already-satisfied phase against a stack that already has those models
 * is a safe no-op update, since phases are cumulative supersets. An earlier
 * version skipped straight to an UNFILTERED full deploy whenever any
 * non-FAILED stack was found, reasoning that a stack must already be fully
 * deployed by then — but a stack can just as easily be CREATE_IN_PROGRESS
 * from an overlapping/concurrent build on the same branch (Amplify Hosting
 * can trigger overlapping builds on rapid successive pushes), and slamming
 * the full 40+ model schema onto it in one shot can hit CloudFormation's
 * "Limit on the number of resources in a single stack operation exceeded"
 * (observed Sept 2026). Always looping the full phase sequence instead
 * guarantees no single deploy operation ever exceeds one phase's resources.
 *
 * All AWS inspection/cleanup here goes through the AWS SDK v3 clients
 * (@aws-sdk/client-cloudformation, @aws-sdk/client-appsync) instead of
 * shelling out to the `aws` CLI — both are already resolvable from the
 * workspace root via npm workspace hoisting (see amplify/package.json).
 *
 * Known recurring failure this script can remediate: AppSync's shared
 * NONE_DS data source (used by pipeline "init"/auth FunctionConfigurations
 * with no real backend) can be left DELETE_FAILED because CloudFormation
 * doesn't know model nested stacks' FunctionConfigurations must be removed
 * first — see the delete-order dependency fix in amplify/backend.ts. If
 * that ordering is ever insufficient (e.g. a differently-shaped failure),
 * this script can detect the stuck stack and delete the orphaned AppSync
 * resolvers/functions/data source/API directly via the SDK, then retry.
 *
 * That remediation deletes a whole CloudFormation stack, which (since none
 * of this schema's DynamoDB tables have deletion protection or point-in-time
 * recovery configured) permanently destroys all table data with no backup
 * path. It must NEVER run unattended in CI, so it is gated behind an
 * explicit --allow-remediation CLI flag that amplify.yml's pipeline
 * invocation does not pass. A stuck/DELETE_FAILED stack always fails the CI
 * build loudly instead of being auto-deleted. To remediate, a human runs
 * this script locally with AWS credentials and the flag set, e.g.
 * `node scripts/deploy-bootstrap.mjs --mode=pipeline --branch main
 * --app-id <appId> --allow-remediation`.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CloudFormationClient,
  ListStacksCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  DescribeStackEventsCommand,
  DeleteStackCommand,
} from "@aws-sdk/client-cloudformation";
import {
  AppSyncClient,
  ListTypesCommand,
  ListResolversCommand,
  DeleteResolverCommand,
  ListFunctionsCommand,
  DeleteFunctionCommand,
  DeleteDataSourceCommand,
  DeleteGraphqlApiCommand,
} from "@aws-sdk/client-appsync";

// CloudFormation's "Limit on the number of resources in a single stack
// operation exceeded" and AppSync 429s recur even with full dependency
// serialization because that limit caps TOTAL resources touched in one
// deploy operation, regardless of create order. The only real fix is
// fewer resources per phase — 40+ models across 2 phases still exceeds it.
// A single connected component of relations is never split across phases
// (see computeBootstrapPhases), so raising this mainly thins out the
// isolated single-model components sharing a phase with it — it can't
// shrink the largest component's own blast radius. Raised from 6 to 8
// (Sept 2026) as one of several more-conservative-bootstrap changes,
// alongside widening backend.ts's throttle to cover the previously-
// unprotected shared ConnectionStack/FunctionDirectiveStack nested stacks.
const BOOTSTRAP_TOTAL_PHASES = 8;
const MAX_PHASE_ATTEMPTS = 3;
const FAILED_STACK_STATUSES = new Set([
  "CREATE_FAILED",
  "ROLLBACK_FAILED",
  "ROLLBACK_COMPLETE",
  "DELETE_FAILED",
  "UPDATE_ROLLBACK_FAILED",
]);
const HEALTHY_STACK_STATUSES = new Set([
  "CREATE_COMPLETE",
  "UPDATE_COMPLETE",
  "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
]);
const IN_PROGRESS_STACK_STATUSES = new Set([
  "CREATE_IN_PROGRESS",
  "ROLLBACK_IN_PROGRESS",
  "DELETE_IN_PROGRESS",
  "UPDATE_IN_PROGRESS",
  "UPDATE_ROLLBACK_IN_PROGRESS",
  "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
]);

const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const cfn = new CloudFormationClient({ region });
const appsync = new AppSyncClient({ region });

function sanitizeIdentifier(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * `stackKind` is "sandbox" (personal `ampx sandbox` stacks, named
 * `amplify-<app>-<identifier>-sandbox-<hash>`) or "branch" (Amplify Gen 2
 * pipeline/branch deploy stacks, named `amplify-<app>-<branch>-branch-<hash>`).
 */
function isRelevantStack(stackName, scope, stackKind) {
  if (!stackName.startsWith("amplify-")) return false;
  if (!stackName.includes(`-${stackKind}-`)) return false;
  if (!stackName.includes(scope)) return false;
  return new RegExp(`^amplify-.*-${stackKind}-[a-f0-9]+$`).test(stackName);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `ListStacks` returns one entry per historical state transition, not just
 * the current state — a stack deleted and recreated many times (as during
 * this project's troubleshooting) can have old non-DELETE_COMPLETE entries
 * mixed in among newer DELETE_COMPLETE ones. Group by StackName and keep
 * only the entry with the latest CreationTime.
 */
async function findExistingStack(identifier, stackKind) {
  const scope = sanitizeIdentifier(identifier);
  const entries = [];
  let nextToken;
  do {
    const response = await cfn.send(
      new ListStacksCommand({ NextToken: nextToken }),
    );
    for (const summary of response.StackSummaries ?? []) {
      if (isRelevantStack(summary.StackName, scope, stackKind)) {
        entries.push({
          name: summary.StackName,
          status: summary.StackStatus,
          created: summary.CreationTime,
        });
      }
    }
    nextToken = response.NextToken;
  } while (nextToken);

  const latestByName = new Map();
  for (const entry of entries) {
    const current = latestByName.get(entry.name);
    if (!current || entry.created > current.created) {
      latestByName.set(entry.name, entry);
    }
  }

  const live = [...latestByName.values()].find(
    (s) => s.status !== "DELETE_COMPLETE",
  );
  return live ?? null;
}

/**
 * The core data nested stack's CDK construct id is always "data" (see
 * `backend.data.resources.cfnResources.cfnGraphqlApi.stack` in
 * amplify/backend.ts), which CDK renders as a logical id like
 * "data<8-hex-hash>" — stable across deploys since it's derived from the
 * construct path, not deploy time.
 */
async function findDataNestedStack(rootStackName) {
  const response = await cfn.send(
    new DescribeStackResourcesCommand({ StackName: rootStackName }),
  );
  const resource = (response.StackResources ?? []).find(
    (r) =>
      r.ResourceType === "AWS::CloudFormation::Stack" &&
      /^data[0-9a-fA-F]+$/.test(r.LogicalResourceId ?? ""),
  );
  return resource?.PhysicalResourceId ?? null;
}

/**
 * `DescribeStackResources` can silently omit the AppSync data source
 * resource for a stack stuck in a repeated delete-fail loop (observed: 100
 * other resources listed, zero AWS::AppSync::* entries) even though
 * `DescribeStackEvents` still reports it. Scan events instead and pull the
 * API id out of the data source's ARN
 * (arn:aws:appsync:<region>:<account>:apis/<apiId>/datasources/NONE_DS).
 */
async function findGraphqlApiIdFromEvents(dataStackArn) {
  let nextToken;
  do {
    const response = await cfn.send(
      new DescribeStackEventsCommand({
        StackName: dataStackArn,
        NextToken: nextToken,
      }),
    );
    for (const event of response.StackEvents ?? []) {
      if (event.ResourceType !== "AWS::AppSync::DataSource") continue;
      const match = /^arn:aws:appsync:[^:]+:[^:]+:apis\/([^/]+)\//.exec(
        event.PhysicalResourceId ?? "",
      );
      if (match) return match[1];
    }
    nextToken = response.NextToken;
  } while (nextToken);
  return null;
}

/**
 * AppSync refuses to delete a Function while any Resolver's pipeline still
 * references it ("Cannot delete a function which is currently used by a
 * resolver"). Resolvers live not just on Query/Mutation/Subscription but on
 * every model type's own fields (e.g. AssistantChat.lastChangedAt), so
 * enumerate every type in the API via ListTypes rather than guessing.
 */
async function deleteAllResolvers(apiId) {
  let deleted = 0;
  let typesNextToken;
  do {
    const typesResponse = await appsync.send(
      new ListTypesCommand({
        apiId,
        format: "JSON",
        nextToken: typesNextToken,
      }),
    );
    for (const type of typesResponse.types ?? []) {
      const typeName = type.name;
      if (!typeName) continue;
      let resolversNextToken;
      do {
        const response = await appsync.send(
          new ListResolversCommand({
            apiId,
            typeName,
            nextToken: resolversNextToken,
          }),
        );
        for (const resolver of response.resolvers ?? []) {
          await appsync.send(
            new DeleteResolverCommand({
              apiId,
              typeName,
              fieldName: resolver.fieldName,
            }),
          );
          deleted += 1;
        }
        resolversNextToken = response.nextToken;
      } while (resolversNextToken);
    }
    typesNextToken = typesResponse.nextToken;
  } while (typesNextToken);
  return deleted;
}

async function deleteAllAppSyncFunctions(apiId) {
  let nextToken;
  let deleted = 0;
  do {
    const response = await appsync.send(
      new ListFunctionsCommand({ apiId, nextToken }),
    );
    for (const fn of response.functions ?? []) {
      await appsync.send(
        new DeleteFunctionCommand({ apiId, functionId: fn.functionId }),
      );
      deleted += 1;
    }
    nextToken = response.nextToken;
  } while (nextToken);
  return deleted;
}

async function ignoreNotFound(promise) {
  try {
    await promise;
  } catch (err) {
    if (err.name !== "NotFoundException") throw err;
  }
}

/**
 * Removes AppSync resources (functions on NONE_DS, the NONE_DS data source
 * itself, and the orphaned GraphQL API) left behind when CloudFormation
 * couldn't tear down the whole tree cleanly.
 */
async function cleanupOrphanedAppSyncResources(rootStackName) {
  const dataStackArn = await findDataNestedStack(rootStackName).catch(
    () => null,
  );
  if (!dataStackArn) return;
  const apiId = await findGraphqlApiIdFromEvents(dataStackArn).catch(
    () => null,
  );
  if (!apiId) return;

  const resolversDeleted = await deleteAllResolvers(apiId);
  console.log(
    `[deploy-bootstrap] Deleted ${resolversDeleted} orphaned AppSync resolver(s) on API ${apiId}.`,
  );

  const deleted = await deleteAllAppSyncFunctions(apiId);
  console.log(
    `[deploy-bootstrap] Deleted ${deleted} orphaned AppSync function(s) on API ${apiId}.`,
  );
  await ignoreNotFound(
    appsync.send(new DeleteDataSourceCommand({ apiId, name: "NONE_DS" })),
  );
  await ignoreNotFound(appsync.send(new DeleteGraphqlApiCommand({ apiId })));
}

async function describeStackStatus(stackName) {
  try {
    const response = await cfn.send(
      new DescribeStacksCommand({ StackName: stackName }),
    );
    return response.Stacks?.[0]?.StackStatus ?? null;
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "ValidationException") {
      return null; // stack no longer exists
    }
    throw err;
  }
}

/** Polls until the stack is gone or settles into a non-transient status. */
async function waitForDeleteSettle(stackName) {
  // Give CloudFormation a moment to move off the prior terminal status
  // before the first check, so a just-issued DeleteStack retry isn't
  // mistaken for having already failed again.
  await sleep(5_000);
  for (;;) {
    const status = await describeStackStatus(stackName);
    if (status == null) return null; // gone
    if (status === "DELETE_IN_PROGRESS") {
      await sleep(10_000);
      continue;
    }
    return status;
  }
}

/**
 * Cleans up orphaned AppSync resources and retries stack deletion, looping
 * (with its own bounded counter — no recursion) until the stack is gone.
 */
async function remediateAndDeleteStack(rootStackName, maxAttempts = 5) {
  console.log(
    `[deploy-bootstrap] Remediating stuck stack "${rootStackName}"...`,
  );
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await cleanupOrphanedAppSyncResources(rootStackName);
    await ignoreNotFound(
      cfn.send(new DeleteStackCommand({ StackName: rootStackName })),
    );

    const status = await waitForDeleteSettle(rootStackName);
    if (status == null) return; // gone
    if (status !== "DELETE_FAILED") {
      throw new Error(
        `Stack "${rootStackName}" settled in unexpected status ${status} during remediation.`,
      );
    }
    console.log(
      `[deploy-bootstrap] Stack still DELETE_FAILED after cleanup attempt ${attempt}/${maxAttempts}, retrying...`,
    );
  }
  throw new Error(
    `Stack "${rootStackName}" still DELETE_FAILED after ${maxAttempts} remediation attempts.`,
  );
}

function runDeployOnce(deployArgs, env) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", deployArgs, {
      stdio: "inherit",
      // JSII_DEPRECATED=quiet silences aws-cdk-lib's internal
      // CfnResource#addDependency deprecation warning, which fires once per
      // cross-nested-stack reference (thousands at this schema's size) and
      // drowns out real errors in CI logs — only suppresses deprecation
      // noise, never actual failures.
      env: { ...process.env, JSII_DEPRECATED: "quiet", ...env },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${deployArgs.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

// `ampx pipeline-deploy`/`sandbox --once` write amplify_outputs.json to the
// process cwd (no --outputs-out-dir override is passed here), *after* the
// CloudFormation deploy completes. That client-config generation step can
// fail on its own (e.g. AppSync throttling right after a large deploy) and
// throw uncaught, which is exactly the non-zero exit runDeployOnce reports
// above — but by then the CFN stack itself is already healthy, so the
// retry loop below must not treat "stack healthy" alone as phase success.
const outputsPath = path.join(process.cwd(), "amplify_outputs.json");

function outputsWereWritten(sinceMs) {
  try {
    return fs.statSync(outputsPath).mtimeMs >= sinceMs;
  } catch {
    return false;
  }
}

/**
 * Runs one deploy phase, then verifies actual CloudFormation stack health
 * directly — `ampx sandbox --once` has been observed to exit 0 even when
 * the underlying CloudFormation deployment failed (e.g. AppSync 429s during
 * rollback), so the child process exit code alone can't be trusted.
 */
async function deployPhaseWithRetry(
  env,
  label,
  identifier,
  deployArgs,
  stackKind,
  allowRemediation,
) {
  for (let attempt = 1; attempt <= MAX_PHASE_ATTEMPTS; attempt++) {
    console.log(
      `[deploy-bootstrap] ${label} (attempt ${attempt}/${MAX_PHASE_ATTEMPTS})...`,
    );
    const attemptStartedMs = Date.now();
    try {
      await runDeployOnce(deployArgs, env);
    } catch (err) {
      console.warn(
        `[deploy-bootstrap] ampx exited non-zero during ${label}: ${err.message}`,
      );
    }

    const stack = await findExistingStack(identifier, stackKind);
    if (!stack) {
      throw new Error(
        `${label} produced no CloudFormation stack — check ampx output above.`,
      );
    }
    if (HEALTHY_STACK_STATUSES.has(stack.status)) {
      if (!outputsWereWritten(attemptStartedMs)) {
        console.warn(
          `[deploy-bootstrap] ${label}: stack is healthy but amplify_outputs.json was not (re)written at ${outputsPath} — client-config generation likely failed after the CFN deploy. Retrying.`,
        );
        continue;
      }
      return;
    }
    if (IN_PROGRESS_STACK_STATUSES.has(stack.status)) {
      // Deploy is still settling (e.g. async rollback) — give it a moment
      // and re-check before deciding whether remediation is needed.
      await sleep(15_000);
      continue;
    }
    if (FAILED_STACK_STATUSES.has(stack.status)) {
      if (!allowRemediation) {
        throw new Error(
          `${label} left stack "${stack.name}" in ${stack.status}. Refusing ` +
            `to auto-delete it (this destroys all DynamoDB table data with ` +
            `no backup). Run this script locally with --allow-remediation to ` +
            `clean up the orphaned AppSync resources and delete the stack, ` +
            `then re-run the normal pipeline deploy.`,
        );
      }
      console.log(
        `[deploy-bootstrap] ${label} left stack in ${stack.status} — cleaning up before retrying.`,
      );
      await remediateAndDeleteStack(stack.name);
      continue;
    }
  }
  throw new Error(
    `${label} did not reach a healthy state with a freshly written amplify_outputs.json after ${MAX_PHASE_ATTEMPTS} attempts.`,
  );
}

/** Parses `--key=value` / `--key value` CLI args into a plain object. */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const eq = token.indexOf("=");
    if (eq !== -1) {
      args[token.slice(2, eq)] = token.slice(eq + 1);
    } else {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode === "pipeline" ? "pipeline" : "sandbox";
  const allowRemediation = Boolean(args["allow-remediation"]);

  let identifier;
  let deployArgs;
  let stackKind;

  if (mode === "pipeline") {
    const branch = args.branch || process.env.AWS_BRANCH;
    const appId = args["app-id"] || process.env.AWS_APP_ID;
    if (!branch || !appId) {
      throw new Error(
        "--mode=pipeline requires --branch=<branch> and --app-id=<id> (or AWS_BRANCH/AWS_APP_ID env vars).",
      );
    }
    identifier = sanitizeIdentifier(branch);
    deployArgs = [
      "ampx",
      "pipeline-deploy",
      "--branch",
      branch,
      "--app-id",
      appId,
    ];
    stackKind = "branch";
  } else {
    const repoName = sanitizeIdentifier(path.basename(process.cwd()));
    identifier = sanitizeIdentifier(
      process.env.AMPLIFY_IDENTIFIER || repoName || os.userInfo().username,
    );
    deployArgs = ["ampx", "sandbox", "--once"];
    stackKind = "sandbox";
  }

  const existingStack = await findExistingStack(identifier, stackKind);

  if (existingStack && FAILED_STACK_STATUSES.has(existingStack.status)) {
    if (!allowRemediation) {
      throw new Error(
        `Existing stack "${existingStack.name}" is ${existingStack.status}. ` +
          `Refusing to auto-delete it (this destroys all DynamoDB table data ` +
          `with no backup). Run this script locally with --allow-remediation ` +
          `to clean up the orphaned AppSync resources and delete the stack, ` +
          `then re-run the normal pipeline deploy.`,
      );
    }
    console.log(
      `[deploy-bootstrap] Existing stack "${existingStack.name}" is ${existingStack.status} — remediating before continuing.`,
    );
    await remediateAndDeleteStack(existingStack.name);
  } else if (existingStack) {
    // A non-FAILED existing stack does NOT mean bootstrapping already
    // finished — it can be CREATE_IN_PROGRESS/UPDATE_IN_PROGRESS from an
    // overlapping/concurrent build on the same branch (Amplify Hosting can
    // trigger overlapping builds on rapid successive pushes), or a healthy
    // stack that's only partway through the phase sequence. Previously this
    // branch skipped straight to an UNFILTERED "full deploy" (no
    // AMPLIFY_BOOTSTRAP_PHASE env vars), which — observed Sept 2026 — can
    // slam the ENTIRE 40-model schema onto a stack a concurrent build was
    // still incrementally constructing, hitting CloudFormation's "Limit on
    // the number of resources in a single stack operation exceeded" even
    // though phasing was supposedly in effect. Always run the SAME phase
    // loop below instead: each phase's model set is a strict cumulative
    // superset, so re-running an already-satisfied phase against a stack
    // that already has those models is a safe no-op update — this never
    // deploys more than one phase's worth of NEW resources in a single
    // operation, regardless of what an existing stack already contains.
    console.log(
      `[deploy-bootstrap] Found existing stack "${existingStack.name}" (${existingStack.status}) — continuing the phased bootstrap instead of an unfiltered full deploy.`,
    );
  } else {
    console.log(
      `[deploy-bootstrap] No existing ${mode} stack found — bootstrapping in ${BOOTSTRAP_TOTAL_PHASES} phases.`,
    );
  }

  for (let phase = 1; phase <= BOOTSTRAP_TOTAL_PHASES; phase++) {
    await deployPhaseWithRetry(
      {
        AMPLIFY_BOOTSTRAP_PHASE: String(phase),
        AMPLIFY_BOOTSTRAP_TOTAL_PHASES: String(BOOTSTRAP_TOTAL_PHASES),
      },
      `Phase ${phase}/${BOOTSTRAP_TOTAL_PHASES}: deploying cumulative model set ${phase}`,
      identifier,
      deployArgs,
      stackKind,
      allowRemediation,
    );
  }

  console.log("[deploy-bootstrap] Bootstrap complete.");
}

main().catch((err) => {
  console.error("[deploy-bootstrap] Failed:", err.message);
  process.exit(1);
});
