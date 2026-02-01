#!/bin/bash

# Full i18n Translation Workflow with --force mode
# Translates all namespaces to all target languages using multi-model consensus

set -e  # Exit on error

# Configuration - CORRECTED NAMESPACES
NAMESPACES=("auth" "common" "components" "editor" "editor.ai" "editor.authoring" "editor.blocks" "editor.files" "editor.shared" "pages" "workbook")
TARGET_LANGS=("ja" "es" "fr" "zh" "de")
SOURCE_LANG="en"
PROJECT_ROOT="/Users/colinbarrett-fox/Projects/new-components/amplify-homework-supply"
SCRIPT_PATH="$PROJECT_ROOT/.github/skills/multi-model-ai-translation/scripts/translate-with-proof.ts"

echo "==================================="
echo "Multi-Model Translation Workflow"
echo "==================================="
echo ""
echo "Namespaces: ${NAMESPACES[*]}"
echo "Target Languages: ${TARGET_LANGS[*]}"
echo "Source Language: $SOURCE_LANG"
echo "Mode: FORCE REGENERATION (--force)"
echo ""
echo "This will:"
echo "  - Translate ${#NAMESPACES[@]} namespaces"
echo "  - To ${#TARGET_LANGS[@]} languages"
echo "  - Using 3 AI models (Claude, GPT-4o, Gemma 3 12B)"
echo "  - Total: $((${#NAMESPACES[@]} * ${#TARGET_LANGS[@]})) translation jobs"
echo ""

# Check for API keys
if [ -z "$ANTHROPIC_API_KEY" ] || [ -z "$OPENAI_API_KEY" ] || [ -z "$GOOGLE_API_KEY" ]; then
  echo "⚠️  WARNING: Missing API keys!"
  echo ""
  echo "Required environment variables:"
  echo "  - ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+✓ Set}${ANTHROPIC_API_KEY:-✗ Missing}"
  echo "  - OPENAI_API_KEY: ${OPENAI_API_KEY:+✓ Set}${OPENAI_API_KEY:-✗ Missing}"
  echo "  - GOOGLE_API_KEY: ${GOOGLE_API_KEY:+✓ Set}${GOOGLE_API_KEY:-✗ Missing}"
  echo ""
  echo "Estimated cost with API calls: ~\$5-10 total"
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Track progress
TOTAL_JOBS=$((${#NAMESPACES[@]} * ${#TARGET_LANGS[@]}))
CURRENT_JOB=0
FAILED_JOBS=()

echo ""
echo "Starting translation workflow..."
echo ""

# Nested loop: for each namespace, translate to each target language
for namespace in "${NAMESPACES[@]}"; do
  for lang in "${TARGET_LANGS[@]}"; do
    CURRENT_JOB=$((CURRENT_JOB + 1))
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "[$CURRENT_JOB/$TOTAL_JOBS] Translating: $namespace → $lang"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Run translation with error handling
    if npx tsx "$SCRIPT_PATH" "$namespace" "$SOURCE_LANG" "$lang"; then
      echo "✅ Success: $namespace → $lang"
    else
      echo "❌ Failed: $namespace → $lang"
      FAILED_JOBS+=("$namespace → $lang")
    fi
    
    echo ""
    
    # Delay between translations to respect API rate limits
    # Gemma 3 has 30 req/min limit, with 2.1s delay between keys
    # Most namespaces complete in <1 minute, so minimal buffer needed
    if [ $CURRENT_JOB -lt $TOTAL_JOBS ]; then
      echo "  Waiting 10 seconds before next translation..."
      sleep 10
    fi
  done
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Translation Phase Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#FAILED_JOBS[@]} -eq 0 ]; then
  echo "✅ All $TOTAL_JOBS translations completed successfully!"
else
  echo "⚠️  ${#FAILED_JOBS[@]} translation(s) failed:"
  for job in "${FAILED_JOBS[@]}"; do
    echo "   - $job"
  done
fi

echo ""
echo "Next steps:"
echo "  1. Review cache: .translation-cache/$(date +%Y-%m-%d)/"
echo "  2. Verify translations: npx tsx $PROJECT_ROOT/.github/skills/multi-model-ai-translation/scripts/verify-translations.ts"
echo "  3. Run reverse translation for each: npx tsx $PROJECT_ROOT/.github/skills/multi-model-ai-translation/scripts/reverse-translate.ts <namespace> en <lang>"
echo "  4. Generate report: npx tsx $PROJECT_ROOT/.github/skills/multi-model-ai-translation/scripts/generate-translation-report.ts"
echo ""
