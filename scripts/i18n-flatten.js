#!/usr/bin/env node
/**
 * Flatten translation `{ value, _meta }` entries produced by the consensus
 * translator back into plain strings, matching the app's locale file format.
 * Idempotent: files already using plain strings are left unchanged.
 *
 * Usage:
 *   node scripts/i18n-flatten.js            # all target locales, all namespaces
 *   node scripts/i18n-flatten.js de agentTools   # a single locale + namespace
 */
const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "public/locales");
const [argLocale, argNs] = process.argv.slice(2);
const locales = argLocale ? [argLocale] : ["de", "es", "fr", "ja", "zh"];

function flattenValue(node) {
  if (node && typeof node === "object" && !Array.isArray(node)) {
    if (typeof node.value === "string") return node.value; // drop _meta
    const out = {};
    for (const k in node) out[k] = flattenValue(node[k]);
    return out;
  }
  return node;
}

let changed = 0;
for (const locale of locales) {
  const dir = path.join(LOCALES_DIR, locale);
  if (!fs.existsSync(dir)) continue;
  const files = argNs
    ? [`${argNs}.json`]
    : fs
        .readdirSync(dir)
        .filter(
          (f) =>
            f.endsWith(".json") &&
            !f.endsWith(".meta.json") &&
            !f.includes(".missing") &&
            !f.includes(".backup"),
        );
  for (const f of files) {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    const flat = flattenValue(JSON.parse(raw));
    const out = JSON.stringify(flat, null, 2) + "\n";
    if (out !== raw) {
      fs.writeFileSync(p, out, "utf8");
      changed++;
      console.log(`flattened ${locale}/${f}`);
    }
  }
}
console.log(`\nDone. Files changed: ${changed}`);
