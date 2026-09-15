#!/usr/bin/env node
/**
 * Storybook interaction audit: per-file coverage of `play:` functions.
 * Counts CSF3 named-export stories vs. how many define a `play:` function.
 * Read-only analysis — prints JSON + markdown summary to stdout.
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();

// Collect story files under src/ (component + stories dirs) — the audited scope.
const files = execSync(
  `find src -type f \\( -name '*.stories.tsx' -o -name '*.stories.jsx' -o -name '*.stories.ts' -o -name '*.stories.js' \\)`,
  { cwd: root, encoding: "utf8" },
)
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean)
  .sort();

// Named exports we should NOT treat as stories.
const NON_STORY_EXPORTS = new Set(["default"]);

function analyzeFile(rel) {
  const src = readFileSync(join(root, rel), "utf8");

  // Split on named `export const <Name>` boundaries to isolate each story block.
  const exportRe = /export\s+const\s+([A-Za-z0-9_]+)\s*[:=]/g;
  const marks = [];
  let m;
  while ((m = exportRe.exec(src)) !== null) {
    marks.push({ name: m[1], index: m.index });
  }

  const stories = [];
  for (let i = 0; i < marks.length; i++) {
    const { name, index } = marks[i];
    if (NON_STORY_EXPORTS.has(name)) continue;
    const end = i + 1 < marks.length ? marks[i + 1].index : src.length;
    const block = src.slice(index, end);
    // A CSF3 story block is an object literal; require `=> ` render or `{`.
    const isStoryObject =
      /=\s*{/.test(block) ||
      /:\s*Story[A-Za-z<>]*\s*=\s*{/.test(block) ||
      /=\s*[A-Za-z0-9_]+\.bind\(/.test(block);
    if (!isStoryObject) continue;
    // CSF3: `play:` inside the object literal. CSF2: `<Name>.play = ...` anywhere in file.
    const csf3Play =
      /\bplay:\s*async/.test(block) || /\bplay:\s*\(/.test(block);
    const csf2PlayRe = new RegExp(`\\b${name}\\.play\\s*=`);
    const hasPlay = csf3Play || csf2PlayRe.test(src);
    stories.push({ name, hasPlay });
  }

  const total = stories.length;
  const withPlay = stories.filter((s) => s.hasPlay).length;
  const missing = stories.filter((s) => !s.hasPlay).map((s) => s.name);
  return { file: rel, total, withPlay, missing };
}

const results = files.map(analyzeFile).filter((r) => r.total > 0);

const totalFiles = results.length;
const totalStories = results.reduce((a, r) => a + r.total, 0);
const totalWithPlay = results.reduce((a, r) => a + r.withPlay, 0);
const fullyCovered = results.filter((r) => r.missing.length === 0).length;
const partial = results.filter((r) => r.withPlay > 0 && r.missing.length > 0);
const none = results.filter((r) => r.withPlay === 0);

console.log("=== SUMMARY ===");
console.log(`Story files (with >=1 story): ${totalFiles}`);
console.log(`Total stories: ${totalStories}`);
console.log(
  `Stories with play: ${totalWithPlay} (${((totalWithPlay / totalStories) * 100).toFixed(1)}%)`,
);
console.log(`Fully covered files: ${fullyCovered}`);
console.log(`Partial files: ${partial.length}`);
console.log(`Zero-coverage files: ${none.length}`);

console.log("\n=== PARTIAL COVERAGE (has play but missing some) ===");
for (const r of partial.sort((a, b) => b.missing.length - a.missing.length)) {
  console.log(
    `${r.file} — ${r.withPlay}/${r.total} — missing: ${r.missing.join(", ")}`,
  );
}

console.log("\n=== ZERO COVERAGE (no play at all) ===");
for (const r of none.sort((a, b) => b.total - a.total)) {
  console.log(`${r.file} — 0/${r.total} — ${r.missing.join(", ")}`);
}
