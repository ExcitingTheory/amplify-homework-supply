#!/usr/bin/env node
/**
 * Normalize i18next-style {{placeholder}} to next-intl ICU {placeholder}.
 *
 * The app consumes translations via next-intl `t(key, { name })`, which uses
 * single-brace ICU. Any {{double}} braces render literally and are bugs.
 * All {{...}} tokens in the locale files are verified to be plain identifiers,
 * so a targeted raw-text replace is safe and preserves file formatting.
 *
 * Usage: node scripts/i18n-normalize-braces.js [--write]
 */
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");
const LOCALES_DIR = path.join(__dirname, "..", "public/locales");
const locales = ["en", "de", "es", "fr", "ja", "zh"];
const RE = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

let filesChanged = 0;
let totalReplacements = 0;

for (const locale of locales) {
  const dir = path.join(LOCALES_DIR, locale);
  for (const f of fs.readdirSync(dir)) {
    if (
      !f.endsWith(".json") ||
      f.endsWith(".meta.json") ||
      f.includes(".missing") ||
      f.includes(".backup")
    )
      continue;
    const p = path.join(dir, f);
    const raw = fs.readFileSync(p, "utf8");
    const matches = raw.match(RE);
    if (!matches) continue;
    const next = raw.replace(RE, "{$1}");
    JSON.parse(next); // validate structure remains parseable
    totalReplacements += matches.length;
    filesChanged++;
    if (WRITE) fs.writeFileSync(p, next, "utf8");
    console.log(`${locale}/${f}: ${matches.length} replaced`);
  }
}

console.log(
  `\n${WRITE ? "WROTE" : "DRY-RUN"}: ${totalReplacements} replacements across ${filesChanged} files`,
);
