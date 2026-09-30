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

function removeIfExists(dirPath) {
  if (!existsSync(dirPath)) return;
  const size = dirSize(dirPath);
  rmSync(dirPath, { recursive: true, force: true });
  freedBytes += size;
  console.log(
    `[prune-standalone] removed ${path.relative(root, dirPath)} (${(size / 1e6).toFixed(1)}MB)`,
  );
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
