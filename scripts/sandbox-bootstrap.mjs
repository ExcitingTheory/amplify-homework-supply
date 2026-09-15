#!/usr/bin/env node
/**
 * Orchestrates a from-scratch `ampx sandbox` deploy across multiple phases
 * to stay under CloudFormation's ~2500-resources-per-deploy-operation cap
 * (this schema's 40+ models exceed that cap in a single shot, and even a
 * 2-phase split — one phase carrying roughly half the schema).
 *
 * AMPLIFY_BOOTSTRAP_PHASE=<N> with AMPLIFY_BOOTSTRAP_TOTAL_PHASES=<T>
 * deploys the cumulative model set for phase N (see
 * computeBootstrapPhases in amplify/custom/dataStackWaveOrder/resource.ts)
 * — each phase is a strict superset of the previous one, so phases only
 * ever ADD models, never remove ones already deployed.
 *
 * If a sandbox stack already exists (any state), phasing is skipped
 * entirely and a normal full deploy runs instead — deploying phase 1's
 * reduced schema against an already-fully-deployed stack would look like a
 * request to DELETE the isolated models' tables, which must never happen.
 *
 * All AWS inspection/cleanup here goes through the AWS SDK v3 clients
 * (@aws-sdk/client-cloudformation, @aws-sdk/client-appsync) instead of
 * shelling out to the `aws` CLI — both are already resolvable from the
 * workspace root via npm workspace hoisting (see amplify/package.json).
 *
 * Known recurring failure this script auto-remediates: AppSync's shared
 * NONE_DS data source (used by pipeline "init"/auth FunctionConfigurations
 * with no real backend) can be left DELETE_FAILED because CloudFormation
 * doesn't know model nested stacks' FunctionConfigurations must be removed
 * first — see the delete-order dependency fix in amplify/backend.ts. If
 * that ordering is ever insufficient (e.g. a differently-shaped failure),
 * this script detects the stuck stack, deletes the orphaned AppSync
 * resolvers/functions/data source/API directly via the SDK, and retries.
 */
import { spawn } from "node:child_process";
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
const BOOTSTRAP_TOTAL_PHASES = 6;
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

function isRelevantSandboxStack(stackName, scope) {
  if (!stackName.startsWith("amplify-")) return false;
  if (!stackName.includes("-sandbox-")) return false;
  if (!stackName.includes(scope)) return false;
  return /^amplify-.*-sandbox-[a-f0-9]+$/.test(stackName);
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
async function findExistingSandboxStack(identifier) {
  const scope = sanitizeIdentifier(identifier);
  const entries = [];
  let nextToken;
  do {
    const response = await cfn.send(
      new ListStacksCommand({ NextToken: nextToken }),
    );
    for (const summary of response.StackSummaries ?? []) {
      if (isRelevantSandboxStack(summary.StackName, scope)) {
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
    `[sandbox-bootstrap] Deleted ${resolversDeleted} orphaned AppSync resolver(s) on API ${apiId}.`,
  );

  const deleted = await deleteAllAppSyncFunctions(apiId);
  console.log(
    `[sandbox-bootstrap] Deleted ${deleted} orphaned AppSync function(s) on API ${apiId}.`,
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
    `[sandbox-bootstrap] Remediating stuck stack "${rootStackName}"...`,
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
      `[sandbox-bootstrap] Stack still DELETE_FAILED after cleanup attempt ${attempt}/${maxAttempts}, retrying...`,
    );
  }
  throw new Error(
    `Stack "${rootStackName}" still DELETE_FAILED after ${maxAttempts} remediation attempts.`,
  );
}

function runSandboxOnce(env) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["ampx", "sandbox", "--once"], {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ampx sandbox exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

/**
 * Runs one deploy phase, then verifies actual CloudFormation stack health
 * directly — `ampx sandbox --once` has been observed to exit 0 even when
 * the underlying CloudFormation deployment failed (e.g. AppSync 429s during
 * rollback), so the child process exit code alone can't be trusted.
 */
async function deployPhaseWithRetry(env, label, identifier) {
  for (let attempt = 1; attempt <= MAX_PHASE_ATTEMPTS; attempt++) {
    console.log(
      `[sandbox-bootstrap] ${label} (attempt ${attempt}/${MAX_PHASE_ATTEMPTS})...`,
    );
    try {
      await runSandboxOnce(env);
    } catch (err) {
      console.warn(
        `[sandbox-bootstrap] ampx exited non-zero during ${label}: ${err.message}`,
      );
    }

    const stack = await findExistingSandboxStack(identifier);
    if (!stack) {
      throw new Error(
        `${label} produced no CloudFormation stack — check ampx output above.`,
      );
    }
    if (HEALTHY_STACK_STATUSES.has(stack.status)) {
      return;
    }
    if (IN_PROGRESS_STACK_STATUSES.has(stack.status)) {
      // Deploy is still settling (e.g. async rollback) — give it a moment
      // and re-check before deciding whether remediation is needed.
      await sleep(15_000);
      continue;
    }
    if (FAILED_STACK_STATUSES.has(stack.status)) {
      console.log(
        `[sandbox-bootstrap] ${label} left stack in ${stack.status} — cleaning up before retrying.`,
      );
      await remediateAndDeleteStack(stack.name);
      continue;
    }
  }
  throw new Error(
    `${label} did not reach a healthy state after ${MAX_PHASE_ATTEMPTS} attempts.`,
  );
}

async function main() {
  const repoName = sanitizeIdentifier(path.basename(process.cwd()));
  const identifier = sanitizeIdentifier(
    process.env.AMPLIFY_IDENTIFIER || repoName || os.userInfo().username,
  );

  const existingStack = await findExistingSandboxStack(identifier);

  if (existingStack && FAILED_STACK_STATUSES.has(existingStack.status)) {
    console.log(
      `[sandbox-bootstrap] Existing stack "${existingStack.name}" is ${existingStack.status} — remediating before continuing.`,
    );
    await remediateAndDeleteStack(existingStack.name);
  } else if (existingStack) {
    console.log(
      `[sandbox-bootstrap] Found existing stack "${existingStack.name}" — skipping phased bootstrap, running normal full deploy.`,
    );
    await deployPhaseWithRetry({}, "Full deploy", identifier);
    return;
  }

  console.log(
    `[sandbox-bootstrap] No existing sandbox stack found — bootstrapping in ${BOOTSTRAP_TOTAL_PHASES} phases.`,
  );

  for (let phase = 1; phase <= BOOTSTRAP_TOTAL_PHASES; phase++) {
    await deployPhaseWithRetry(
      {
        AMPLIFY_BOOTSTRAP_PHASE: String(phase),
        AMPLIFY_BOOTSTRAP_TOTAL_PHASES: String(BOOTSTRAP_TOTAL_PHASES),
      },
      `Phase ${phase}/${BOOTSTRAP_TOTAL_PHASES}: deploying cumulative model set ${phase}`,
      identifier,
    );
  }

  console.log("[sandbox-bootstrap] Bootstrap complete.");
}

main().catch((err) => {
  console.error("[sandbox-bootstrap] Failed:", err.message);
  process.exit(1);
});
