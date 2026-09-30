#!/usr/bin/env node
/**
 * Deletes build-time-only tooling from .next/standalone/node_modules.
 *
 * next-server.js's own trace (.next/next-server.js.nft.json) statically references
 * webpack's dev-mode HMR/lazy-compilation code (shared bootstrap file for both `next dev`
 * and standalone prod), which drags webpack — and its own deps (terser/uglify-js) — plus
 * typescript, @swc/core-*, @esbuild/*, caniuse-lite, babel-plugin-react-compiler, and
 * @img/sharp-* into the standalone output. `outputFileTracingExcludes` in next.config.mjs
 * cannot reach this file (verified: it only affects per-route traces, not next-server.js's
 * own trace), so this runs as a postbuild step instead.
 *
 * Verified safe: `grep` over the full compiled .next/server output found no runtime
 * require() of any of these packages, and they are devDependencies (or transitive
 * build tooling) with no legitimate role in an already-compiled production server.
 */
import { rmSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), ".next/standalone/node_modules");

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

// onnxruntime-node's own postinstall script downloads GPU execution provider
// binaries (CUDA/TensorRT) on Linux x64 that aren't part of the npm package itself
// (invisible to `npm pack --dry-run`). Amplify Hosting compute is CPU-only serverless
// — these are pure dead weight (the CUDA provider alone was 327MB, the actual root
// cause of onnxruntime-node showing up far larger on CI than expected).
const gpuProviderPattern =
  /^libonnxruntime_providers_(cuda|tensorrt|rocm|migraphx|dml)\.so$/;

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

if (!existsSync(root)) {
  console.log(
    "[prune-standalone] .next/standalone/node_modules not found, skipping (not a standalone build?)",
  );
  process.exit(0);
}

for (const name of targets) {
  removeIfExists(path.join(root, name));
}

for (const onnxDir of findAllDirsNamed(root, "onnxruntime-node")) {
  removeGpuProviders(onnxDir);
}

for (const [scope, matches] of globTargets) {
  const scopeDir = path.join(root, scope);
  if (!existsSync(scopeDir)) continue;
  for (const entry of readdirSync(scopeDir, { withFileTypes: true })) {
    if (entry.isDirectory() && matches(entry.name)) {
      removeIfExists(path.join(scopeDir, entry.name));
    }
  }
}

console.log(
  `[prune-standalone] total freed: ${(freedBytes / 1e6).toFixed(1)}MB`,
);

// .next/cache (webpack's persistent build cache, mainly) is ONLY for speeding up
// future rebuilds in the SAME environment — it's dead weight in the deployed artifact
// and was the actual dominant contributor to Amplify's build-output-size check staying
// stuck at ~534MB no matter how much node_modules pruning we did above (confirmed:
// .next/cache/webpack alone measured 2.1GB in a from-scratch build). amplify.yml's own
// artifact "files" excludes already try to skip cache/webpack + cache/turbopack, but
// since that alone didn't fix the reported size, delete it outright here too so there's
// no ambiguity about whether that exclude filter is actually honored by Amplify's size
// check. Trade-off: this also deletes Amplify's OWN build-cache upload target (the
// "cache: paths: .next/cache/**/*" in amplify.yml), so every future CI build will be a
// full cold compile instead of incremental — acceptable to unblock deployment.
const nextCacheDir = path.join(process.cwd(), ".next/cache");
removeIfExists(nextCacheDir);

// Report what's left so the next CI build reveals the current biggest offenders
// without needing a separate manual `du`/`find` pass.
const remaining = existsSync(root)
  ? readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .flatMap((e) => {
        if (!e.name.startsWith("@")) {
          return [{ name: e.name, path: path.join(root, e.name) }];
        }
        const scopeDir = path.join(root, e.name);
        return readdirSync(scopeDir, { withFileTypes: true })
          .filter((sub) => sub.isDirectory())
          .map((sub) => ({
            name: `${e.name}/${sub.name}`,
            path: path.join(scopeDir, sub.name),
          }));
      })
      .map(({ name, path: p }) => ({ name, size: dirSize(p) }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 20)
  : [];

console.log("[prune-standalone] remaining top 20 node_modules by size:");
for (const { name, size } of remaining) {
  console.log(`[prune-standalone]   ${(size / 1e6).toFixed(1)}MB  ${name}`);
}

// onnxruntime-node has repeatedly shown up far larger than expected on CI —
// dump every copy found anywhere in the tree (not just top-level) plus a
// full recursive breakdown of each one's own bin/ contents.
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
      // descend into nested node_modules only, to avoid walking all source files
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

const onnxCopies = findAllDirsNamed(root, "onnxruntime-node");
console.log(
  `[prune-standalone] found ${onnxCopies.length} onnxruntime-node cop${onnxCopies.length === 1 ? "y" : "ies"}:`,
);
for (const copyPath of onnxCopies) {
  console.log(
    `[prune-standalone] --- ${path.relative(root, copyPath)} (${(dirSize(copyPath) / 1e6).toFixed(1)}MB) ---`,
  );
  printTree(copyPath, "  ", 4);
}
