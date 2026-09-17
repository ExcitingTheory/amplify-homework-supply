#!/usr/bin/env node
/**
 * i18n copy-duplicates pass.
 *
 * Fills missing locale keys whose English source string is byte-identical to an
 * already-translated key in the same locale. Only copies when the reuse
 * translation's placeholders (single-brace {name}) exactly match the English
 * source's placeholders. Reuse candidates containing i18next-style {{double}}
 * braces or quote corruption are skipped and left for the translation batch.
 *
 * Usage: node scripts/i18n-copy-duplicates.js [--write]
 *   (dry-run by default; pass --write to modify locale files)
 */
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");
const ROOT = path.join(__dirname, "..");
const LOCALES_DIR = path.join(ROOT, "public/locales");
const SOURCE = "en";
const TARGETS = ["de", "es", "fr", "ja", "zh"];

const namespaces = fs
  .readdirSync(path.join(LOCALES_DIR, SOURCE))
  .filter(
    (f) =>
      f.endsWith(".json") &&
      !f.endsWith(".meta.json") &&
      !f.includes(".missing") &&
      !f.includes(".backup"),
  )
  .map((f) => f.replace(/\.json$/, ""));

// Flatten leaf string values (handles both plain strings and {value} entries).
function flatten(obj, prefix, acc) {
  for (const k in obj) {
    const key = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (typeof v.value === "string") acc[key] = v.value;
      else flatten(v, key, acc);
    } else if (typeof v === "string") {
      acc[key] = v;
    }
  }
  return acc;
}

function setNested(obj, keyPath, value) {
  const parts = keyPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null)
      cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

const singleBraceNames = (s) =>
  [...s.matchAll(/\{([^{}]+)\}/g)]
    .map((m) => m[1].trim())
    .sort()
    .join(",");
const hasDoubleBrace = (s) => /\{\{|\}\}/.test(s);
const looksCorrupted = (s) => /""|\\"\\"/.test(s);

function loadNs(locale, ns) {
  const p = path.join(LOCALES_DIR, locale, `${ns}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Build EN leaf map per namespace once.
const enByNs = {};
for (const ns of namespaces)
  enByNs[ns] = flatten(loadNs(SOURCE, ns) || {}, "", {});

const report = { byLocale: {}, totalCopied: 0, totalSkipped: 0 };

for (const locale of TARGETS) {
  // Build reuse map: enValue -> clean existing translation (across all namespaces).
  const reuse = new Map();
  for (const ns of namespaces) {
    const tgt = loadNs(locale, ns);
    if (!tgt) continue;
    const tgtFlat = flatten(tgt, "", {});
    for (const key in tgtFlat) {
      const enVal = enByNs[ns][key];
      const trVal = tgtFlat[key];
      if (enVal == null || typeof trVal !== "string" || trVal === "") continue;
      if (hasDoubleBrace(trVal) || looksCorrupted(trVal)) continue; // unclean source
      if (!reuse.has(enVal)) reuse.set(enVal, trVal);
    }
  }

  let copied = 0;
  let skipped = 0;
  const copiedKeys = [];

  for (const ns of namespaces) {
    const enFlat = enByNs[ns];
    const tgtObj = loadNs(locale, ns) || {};
    const tgtFlat = flatten(tgtObj, "", {});
    const missing = Object.keys(enFlat).filter((k) => !(k in tgtFlat));
    let changed = false;

    for (const key of missing) {
      const enVal = enFlat[key];
      const cand = reuse.get(enVal);
      if (cand == null) {
        skipped++;
        continue;
      }
      // Placeholder-name parity guard (single-brace).
      if (singleBraceNames(enVal) !== singleBraceNames(cand)) {
        skipped++;
        continue;
      }
      setNested(tgtObj, key, cand);
      changed = true;
      copied++;
      copiedKeys.push(`${ns}:${key}`);
    }

    if (changed && WRITE) {
      const outPath = path.join(LOCALES_DIR, locale, `${ns}.json`);
      fs.writeFileSync(outPath, JSON.stringify(tgtObj, null, 2) + "\n", "utf8");
    }
  }

  report.byLocale[locale] = { copied, skipped, copiedKeys };
  report.totalCopied += copied;
  report.totalSkipped += skipped;
  console.log(`${locale}: copied=${copied} remaining(skipped)=${skipped}`);
}

console.log(
  `\nTOTAL copied=${report.totalCopied} remaining=${report.totalSkipped} (${WRITE ? "WRITTEN" : "dry-run"})`,
);
fs.writeFileSync("/tmp/i18n-copy-report.json", JSON.stringify(report));
