#!/usr/bin/env node
/**
 * Keep .meta.json translator-context files in sync with their namespace's
 * .json translation file after keys have been moved between namespaces.
 *
 * Meta files use FLAT keys equal to the full dotted path (e.g. the key
 * literally named "recordingStudio3.text", not a nested {recordingStudio3:
 * {text: ...}} tree) - unlike the translation json files, which nest.
 *
 * For every meta entry whose key no longer exists in its own namespace's
 * translation json, this looks for that exact dotted key in every other
 * namespace's translation json. If found in exactly one other namespace,
 * the meta entry is moved there (merged, never overwriting an existing
 * entry). Ambiguous (found in >1) or orphaned (found in none) entries are
 * left in place and reported for manual review.
 *
 * Usage: node scripts/sync-meta-namespaces.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const LOCALE_DIR = path.join(__dirname, "..", "public/locales/en");
const DRY_RUN = process.argv.includes("--dry-run");

function keyExistsNested(obj, keyPath) {
  let current = obj;
  for (const part of keyPath.split(".")) {
    if (!current || typeof current !== "object" || !(part in current)) return false;
    current = current[part];
  }
  return true;
}

function loadJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const files = fs
  .readdirSync(LOCALE_DIR)
  .filter((f) => f.endsWith(".json") && !f.endsWith(".meta.json") && !f.includes("missing") && !f.includes("backup"));

const translations = new Map();
for (const f of files) {
  translations.set(f.replace(".json", ""), loadJson(path.join(LOCALE_DIR, f)));
}

const metaCache = new Map();
function getMeta(ns) {
  if (!metaCache.has(ns)) {
    metaCache.set(ns, loadJson(path.join(LOCALE_DIR, `${ns}.meta.json`)) ?? {});
  }
  return metaCache.get(ns);
}

const touched = new Set();
let moved = 0;
const ambiguous = [];
const orphaned = [];

for (const ns of translations.keys()) {
  const meta = getMeta(ns);
  const ownTranslations = translations.get(ns);

  for (const key of Object.keys(meta)) {
    if (keyExistsNested(ownTranslations, key)) continue; // still correct, nothing to do

    const homes = [];
    for (const [otherNs, data] of translations.entries()) {
      if (otherNs === ns) continue;
      if (keyExistsNested(data, key)) homes.push(otherNs);
    }

    if (homes.length === 0) {
      orphaned.push(`${ns}.meta.json:${key}`);
      continue;
    }
    if (homes.length > 1) {
      ambiguous.push(`${ns}.meta.json:${key} -> [${homes.join(", ")}]`);
      continue;
    }

    const destNs = homes[0];
    const destMeta = getMeta(destNs);
    if (!(key in destMeta)) {
      destMeta[key] = meta[key];
      touched.add(destNs);
    }
    delete meta[key];
    touched.add(ns);
    moved++;
  }
}

console.log(`${DRY_RUN ? "[dry run] " : ""}Moved ${moved} meta entries across ${touched.size} file(s)`);
if (ambiguous.length) {
  console.log(`\n⚠️  ${ambiguous.length} ambiguous (found in multiple namespaces, left in place):`);
  ambiguous.forEach((a) => console.log(`   - ${a}`));
}
if (orphaned.length) {
  console.log(`\n⚠️  ${orphaned.length} orphaned (key no longer exists anywhere, left in place):`);
  orphaned.forEach((o) => console.log(`   - ${o}`));
}

if (!DRY_RUN) {
  for (const ns of touched) {
    const filePath = path.join(LOCALE_DIR, `${ns}.meta.json`);
    const meta = getMeta(ns);
    const sorted = {};
    for (const k of Object.keys(meta).sort()) sorted[k] = meta[k];
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  }
}
