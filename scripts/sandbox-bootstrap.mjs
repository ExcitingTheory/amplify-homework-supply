#!/usr/bin/env node
/**
 * Orchestrates a from-scratch `ampx sandbox` deploy in two phases to stay
 * under CloudFormation's 2500-resources-per-deploy-operation cap (this
 * schema's full model set exceeds that in a single shot).
 *
 * Phase 1: AMPLIFY_BOOTSTRAP_PHASE=1 deploys everything except the
 *          relation-free "isolated" models (see amplify/data/resource.ts).
 * Phase 2: full schema — an incremental update that only ADDS the isolated
 *          models, safely under budget since it doesn't touch phase-1
 *          resources.
 *
 * If a sandbox stack already exists (any state), phasing is skipped
 * entirely and a normal full deploy runs instead — deploying phase 1's
 * reduced schema against an already-fully-deployed stack would look like a
 * request to DELETE the isolated models' tables, which must never happen.
 */
import { spawn, execFileSync } from "node:child_process";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sanitizeIdentifier(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Same sanitization Amplify applies to the app/package name when composing
 * the stack name — must match so the search below is scoped to THIS
 * project's stacks only, not any other Amplify Gen2 project on the same
 * AWS account that happens to share a sandbox identifier (e.g. same
 * developer username used across multiple repos).
 */
function getAppName() {
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"),
  );
  return sanitizeIdentifier(pkg.name);
}

/**
 * `list-stacks` returns one entry per historical state transition, not just
 * the current state — a stack deleted and recreated many times (as during
 * this project's troubleshooting) can have old non-DELETE_COMPLETE entries
 * mixed in among newer DELETE_COMPLETE ones. Group by StackId (unique per
 * physical stack instance) and check only the latest entry for each.
 */
function findExistingSandboxStack(identifier) {
  const appName = getAppName();
  // Root sandbox stack only — nested category stacks (data/auth/storage/...)
  // share the same "-<identifier>-sandbox-<hash>" substring with a suffix.
  // Anchored to this project's app name to avoid matching an unrelated
  // Amplify Gen2 project's stack that shares the same sandbox identifier.
  const rootStackRe = new RegExp(
    `^amplify-${appName}-${identifier}-sandbox-[a-f0-9]+$`,
  );

  let stdout;
  try {
    stdout = execFileSync(
      "aws",
      [
        "cloudformation",
        "list-stacks",
        "--query",
        `StackSummaries[?contains(StackName, '-${appName}-${identifier}-sandbox-')].{Id:StackId,Name:StackName,Status:StackStatus,Created:CreationTime}`,
        "--output",
        "json",
      ],
      { encoding: "utf-8" },
    );
  } catch (err) {
    console.error(
      "[sandbox-bootstrap] Failed to query CloudFormation for existing stacks:",
      err.message,
    );
    throw err;
  }

  const entries = JSON.parse(stdout).filter((s) => rootStackRe.test(s.Name));

  // Each delete+recreate produces a new StackId under the same StackName, and
  // list-stacks returns one entry per StackId's final status — so group by
  // Name and keep only the entry with the latest CreationTime.
  const latestByName = new Map();
  for (const entry of entries) {
    const current = latestByName.get(entry.Name);
    if (!current || entry.Created > current.Created) {
      latestByName.set(entry.Name, entry);
    }
  }

  const live = [...latestByName.values()].find(
    (s) => s.Status !== "DELETE_COMPLETE",
  );
  return live?.Name ?? null;
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

async function main() {
  const identifier = sanitizeIdentifier(
    process.env.AMPLIFY_IDENTIFIER || os.userInfo().username,
  );

  const existingStack = findExistingSandboxStack(identifier);

  if (existingStack) {
    console.log(
      `[sandbox-bootstrap] Found existing stack "${existingStack}" — skipping phased bootstrap, running normal full deploy.`,
    );
    await runSandboxOnce({});
    return;
  }

  console.log(
    "[sandbox-bootstrap] No existing sandbox stack found — bootstrapping in two phases.",
  );

  console.log(
    "[sandbox-bootstrap] Phase 1/2: deploying relationally-required models (AMPLIFY_BOOTSTRAP_PHASE=1)...",
  );
  await runSandboxOnce({ AMPLIFY_BOOTSTRAP_PHASE: "1" });

  console.log(
    "[sandbox-bootstrap] Phase 2/2: deploying full schema (adds isolated models)...",
  );
  await runSandboxOnce({});

  console.log("[sandbox-bootstrap] Bootstrap complete.");
}

main().catch((err) => {
  console.error("[sandbox-bootstrap] Failed:", err.message);
  process.exit(1);
});
