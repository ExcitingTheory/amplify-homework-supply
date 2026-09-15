// Regenerates .storybook/optimize-deps.ts from Vite's resolved optimize metadata.
//
// Why: Storybook lazily loads story modules, so Vite discovers many deps only as
// stories are visited. Each discovery wave forces a re-optimize + full page
// reload. Pre-declaring every dep in optimizeDeps.include makes Vite bundle them
// in a single startup pass, eliminating the reload waterfall.
//
// Usage:
//   1. rm -rf node_modules/.cache/storybook node_modules/.vite
//   2. npm run storybook   (let it boot; open a few heavy stories, e.g. the
//      Editor kitchen-sink, InstructorDashboard, ChatSidebar, so their deps are
//      discovered and written to the metadata)
//   3. node scripts/generate-optimize-deps.mjs
//
// The metadata lives at node_modules/.cache/storybook/<ver>/<hash>/sb-vite/deps/_metadata.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const cacheDir = path.join(root, "node_modules/.cache/storybook");

function findMetadata(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMetadata(full));
    } else if (
      entry.name === "_metadata.json" &&
      full.includes(`${path.sep}deps${path.sep}`)
    ) {
      results.push(full);
    }
  }
  return results;
}

// Framework/runtime internals that Storybook's builder manages itself — never
// list these in optimizeDeps.include.
const isInternal = (d) =>
  d.startsWith("next/dist") ||
  d.startsWith("sb-original/") ||
  d.startsWith("storybook/internal") ||
  d.startsWith("@storybook/") ||
  d.includes(" > ") ||
  // Test-runtime modules provided externally by Vitest browser mode — including
  // these as optimize entry points breaks the vitest storybook project with
  // "The entry point 'vitest' cannot be marked as external".
  d === "vitest" ||
  d.startsWith("vitest/") ||
  d.startsWith("@vitest/") ||
  d === "styled-jsx" ||
  d === "styled-jsx/style" ||
  d === "react" ||
  d === "react-dom" ||
  d === "react-dom/client" ||
  d === "react/jsx-runtime" ||
  d === "react/jsx-dev-runtime" ||
  d === "react-dom/test-utils" ||
  d === "next/image" ||
  d === "next/legacy/image" ||
  d === "next/navigation" ||
  d === "@opentelemetry/api" ||
  d === "@mdx-js/react";

const metaFiles = findMetadata(cacheDir);
if (metaFiles.length === 0) {
  console.error(
    "No Vite optimize metadata found. Boot Storybook and open a few heavy stories first, then re-run.",
  );
  process.exit(1);
}

const deps = new Set();
for (const file of metaFiles) {
  const meta = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const dep of Object.keys(meta.optimized || {})) {
    if (!isInternal(dep)) deps.add(dep);
  }
}

const sorted = [...deps].sort();
const body = sorted.map((d) => `  ${JSON.stringify(d)},`).join("\n");

const header = `// AUTO-GENERATED — do not edit by hand.
// The list below is every dependency Vite pre-bundles for the Storybook browser
// graph. It is derived from the resolved optimize metadata so that ALL of these
// deps are pre-bundled in a single pass on startup, instead of being discovered
// lazily as stories load (which forces repeated re-optimization + full page
// reloads — the "rebundles 2–3 times during page load" problem).
//
// Regenerate after adding heavy deps or new icon imports:
//   1. rm -rf node_modules/.cache/storybook node_modules/.vite
//   2. npm run storybook  (let it fully boot and open a few heavy stories)
//   3. node scripts/generate-optimize-deps.mjs
//
// Most entries are @mui/icons-material/* and @mui/material/* deep imports.

export const optimizeDepsInclude: string[] = [
${body}
];
`;

const outPath = path.join(root, ".storybook/optimize-deps.ts");
fs.writeFileSync(outPath, header);
console.log(
  `Wrote ${path.relative(root, outPath)} with ${sorted.length} entries.`,
);
