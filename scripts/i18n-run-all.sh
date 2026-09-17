#!/usr/bin/env bash
# Drives provable 3-model consensus translation across all namespaces/locales,
# flattening each result to plain strings. Safe to re-run: batches with no
# missing keys are skipped by the translator. Continues past individual failures.
set -u
cd "$(git rev-parse --show-toplevel)"

SCRIPT=".github/skills/multi-model-ai-translation/scripts/translate-missing-with-consensus.ts"
LOG="/tmp/i18n-run-all.log"
: > "$LOG"

export I18N_CONCURRENCY="${I18N_CONCURRENCY:-6}"

NAMESPACES=(agentTools common components editor editor.ai editor.authoring editor.blocks editor.files editor.shared pages stories workbook)
LOCALES=(de es fr ja zh)

echo "=== i18n backfill started $(date) (concurrency=$I18N_CONCURRENCY) ===" | tee -a "$LOG"
for ns in "${NAMESPACES[@]}"; do
  for l in "${LOCALES[@]}"; do
    echo ">>> $ns -> $l  ($(date +%H:%M:%S))" | tee -a "$LOG"
    npx tsx "$SCRIPT" "$ns" en "$l" provable >> "$LOG" 2>&1 || echo "!!! batch failed: $ns $l" | tee -a "$LOG"
    node scripts/i18n-flatten.js "$l" "$ns" >> "$LOG" 2>&1 || true
  done
done
echo "=== i18n backfill finished $(date) ===" | tee -a "$LOG"
