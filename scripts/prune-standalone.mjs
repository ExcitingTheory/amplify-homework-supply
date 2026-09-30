#!/usr/bin/env node
/**
 * Deletes build-time-only tooling from node_modules AFTER the build.
 *
 * Per AWS's own troubleshooting guide (docs.aws.amazon.com/amplify/latest/userguide/
 * troubleshooting-SSR.html#build-output-too-large), Amplify Hosting repackages the Next.js
 * build into its own "compute"/"static" artifact for the SSR Web Compute size check — and
 * their documented fix targets the PROJECT ROOT `node_modules` (e.g. `node_modules/@swc/
 * core-linux-x64-gnu/...`), not `.next/standalone/node_modules`. Verified: pruning only
 * `.next/standalone/node_modules` (plus deleting 2.2GB of `.next/cache`) had ZERO effect on
 * the reported build-output size across multiple CI builds, confirming Amplify's size check
 * doesn't read `.next/standalone` at all. This now prunes BOTH roots — root `node_modules`
 * per AWS's documented fix, and `.next/standalone/node_modules` kept for safety/parity.
 *
 * Root causes of the bloat (all confirmed via `grep` over compiled .next/server output:
 * zero runtime require() of any of these):
 * - webpack/terser/uglify-js/typescript/canvas/caniuse-lite/babel-plugin-react-compiler —
 *   build-time-only tooling, hoisted into shared node_modules via this repo's npm workspaces.
 * - @swc/core-*, @esbuild/* — build compilers, never needed by an already-compiled server.
 * - @img/sharp-* — transitive, unused at runtime (custom CDN image loader is used instead).
 * - onnxruntime-node's own postinstall downloads GPU providers (CUDA ~327MB, TensorRT) on
 *   Linux even though Amplify compute is CPU-only serverless — 100% dead weight.
 */
import { rmSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const targets = [
  "webpack",
  "terser",
  "uglify-js",
  "typescript",
  "canvas",
  "caniuse-lite",
  "babel-plugin-react-compiler",
];

const globTargets = [
  ["@swc", (name) => name.startsWith("core-")],
  ["@esbuild", () => true],
  ["@img", (name) => name.startsWith("sharp-")],
];

const gpuProviderPattern =
  /^libonnxruntime_providers_(cuda|tensorrt|rocm|migraphx|dml)\.so$/;

let freedBytes = 0;

function dirSize(dirPath) {
  let total = 0;
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    total += entry.isDirectory() ? dirSize(full) : statSync(full).size;
  }
  return total;
}

function removeIfExists(itemPath) {
  if (!existsSync(itemPath)) return;
  const size = statSync(itemPath).isDirectory()
    ? dirSize(itemPath)
    : statSync(itemPath).size;
  rmSync(itemPath, { recursive: true, force: true });
  freedBytes += size;
  console.log(
    `[prune-standalone] removed ${path.relative(process.cwd(), itemPath)} (${(size / 1e6).toFixed(1)}MB)`,
  );
}

function removeGpuProviders(dirPath) {
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      removeGpuProviders(full);
    } else if (gpuProviderPattern.test(entry.name)) {
      removeIfExists(full);
    }
  }
}

// Finds every directory named `targetName` anywhere under `dirPath`, descending only
// into nested `node_modules` folders (not arbitrary source trees) to stay fast.
function findAllDirsNamed(dirPath, targetName, found = []) {
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dirPath, entry.name);
    if (entry.name === targetName) found.push(full);
    if (entry.name === "node_modules" || entry.name === targetName) {
      findAllDirsNamed(full, targetName, found);
    } else if (!entry.name.startsWith(".")) {
      const nestedNm = path.join(full, "node_modules");
      if (existsSync(nestedNm)) findAllDirsNamed(nestedNm, targetName, found);
    }
  }
  return found;
}

function printTree(dirPath, prefix, depth) {
  if (depth <= 0) return;
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  const sized = entries.map((e) => {
    const full = path.join(dirPath, e.name);
    return {
      name: e.name,
      isDir: e.isDirectory(),
      size: e.isDirectory() ? dirSize(full) : statSync(full).size,
      full,
    };
  });
  sized.sort((a, b) => b.size - a.size);
  for (const item of sized) {
    console.log(
      `[prune-standalone] ${prefix}${(item.size / 1e6).toFixed(1)}MB  ${item.name}${item.isDir ? "/" : ""}`,
    );
    if (item.isDir) printTree(item.full, prefix + "  ", depth - 1);
  }
}

function pruneNodeModules(nmRoot, label) {
  if (!existsSync(nmRoot)) {
    console.log(`[prune-standalone] ${label} not found, skipping`);
    return;
  }
  console.log(`[prune-standalone] pruning ${label}...`);

  for (const name of targets) {
    removeIfExists(path.join(nmRoot, name));
  }

  for (const onnxDir of findAllDirsNamed(nmRoot, "onnxruntime-node")) {
    removeGpuProviders(onnxDir);
  }

  for (const [scope, matches] of globTargets) {
    const scopeDir = path.join(nmRoot, scope);
    if (!existsSync(scopeDir)) continue;
    for (const entry of readdirSync(scopeDir, { withFileTypes: true })) {
      if (entry.isDirectory() && matches(entry.name)) {
        removeIfExists(path.join(scopeDir, entry.name));
      }
    }
  }

  // Report what's left so the next CI build reveals the current biggest offenders
  // without needing a separate manual `du`/`find` pass.
  const remaining = readdirSync(nmRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => {
      if (!e.name.startsWith("@")) {
        return [{ name: e.name, path: path.join(nmRoot, e.name) }];
      }
      const scopeDir = path.join(nmRoot, e.name);
      return readdirSync(scopeDir, { withFileTypes: true })
        .filter((sub) => sub.isDirectory())
        .map((sub) => ({
          name: `${e.name}/${sub.name}`,
          path: path.join(scopeDir, sub.name),
        }));
    })
    .map(({ name, path: p }) => ({ name, size: dirSize(p) }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 20);

  console.log(`[prune-standalone] ${label} remaining top 20 by size:`);
  for (const { name, size } of remaining) {
    console.log(`[prune-standalone]   ${(size / 1e6).toFixed(1)}MB  ${name}`);
  }

  const onnxCopies = findAllDirsNamed(nmRoot, "onnxruntime-node");
  console.log(
    `[prune-standalone] ${label}: found ${onnxCopies.length} onnxruntime-node cop${onnxCopies.length === 1 ? "y" : "ies"}`,
  );
  for (const copyPath of onnxCopies) {
    console.log(
      `[prune-standalone] --- ${path.relative(nmRoot, copyPath)} (${(dirSize(copyPath) / 1e6).toFixed(1)}MB) ---`,
    );
    printTree(copyPath, "  ", 4);
  }
}

// AWS's documented fix targets the project ROOT node_modules — this is the one that
// actually affects Amplify's build-output-size check.
pruneNodeModules(path.join(process.cwd(), "node_modules"), "root node_modules");

// Keep pruning .next/standalone too, in case anything downstream does read from it.
pruneNodeModules(
  path.join(process.cwd(), ".next/standalone/node_modules"),
  ".next/standalone/node_modules",
);

console.log(
  `[prune-standalone] total freed: ${(freedBytes / 1e6).toFixed(1)}MB`,
);

// .next/cache (webpack's persistent build cache) is only for speeding up future
// rebuilds in the SAME environment — dead weight in any deployed artifact.
removeIfExists(path.join(process.cwd(), ".next/cache"));

