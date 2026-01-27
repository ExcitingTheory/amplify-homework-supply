---
agent: 'agent'
description: 'Multi-model i18n translation workflow with consensus validation and reverse-translation verification'
---

# i18n Translation Workflow

Multi-model translation validation system with reverse-translation verification for UI localization.

## When to Use This Workflow

- Initial translation of new namespaces into multiple target languages
- Incremental updates when source language files change
- Quality assurance of existing translations through multi-model consensus and reverse verification
- When a user says "Translate i18n files", "Translate localization files", or "Update translations"

## How to Invoke This Workflow

### Method 1: Direct Chat Command
```
User: "Translate i18n files to Japanese and Spanish using fake mode for testing"
```
GitHub Copilot will:
1. Recognize this matches the i18n-translation-workflow
2. Read this prompt file for instructions
3. Use the multi-model-ai-translation skill when needed
4. Execute the workflow steps

### Method 2: Reference the Prompt File
```
User: "Follow .github/prompts/i18n-translation-workflow.prompt.md to translate common namespace to French"
```

### Method 3: Use Skill Directly
```
User: "Use the multi-model-ai-translation skill to translate auth.json from English to German in provable mode"
```
The agent will read `.github/skills/multi-model-ai-translation/SKILL.md` directly.

## Purpose

Translate JSON i18n files across multiple languages using three AI models in parallel, validate consistency between translations, and verify accuracy through reverse translation back to English.

## Linked Resources

- 📁 **Locales Folder**: `public/locales/`  
  Contains all translation files organized by language code (en, ja, es, fr, zh, de)

## Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | `en` | Source language |
| Japanese | `ja` | Target |
| Spanish | `es` | Target |
| French | `fr` | Target |
| Chinese (Simplified) | `zh` | Target |
| German | `de` | Target |

## Usage Arguments

**Required Arguments:**
- `--source`: Source language code (default: `en`)
- `--targets`: Comma-separated target language codes (e.g., `ja,es,fr`)

**Optional Arguments:**
- `--force`: Regenerate all translations, not just new/missing keys (default: `false`)
- `--namespaces`: Specific namespaces to translate (e.g., `auth,chat`). If omitted, translates all.
- `--verify-only`: Skip translation, only run reverse-translation verification (default: `false`)
- `--runmode`: Translation execution mode (default: `provable`)
  - `fake`: Use Claude runtime to simulate multi-model translation (free, fast, no proof)
  - `provable`: Use actual API calls to Claude/GPT/Gemma with cryptographic verification (requires API keys, ~$5-10 cost)

**Example Usage:**
```
--source en --targets ja,es,fr --namespaces auth,chat --runmode=fake
--source en --targets de --force --runmode=provable
--source en --targets zh --verify-only --runmode=provable
```

**API Keys Required for Provable Mode:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=...
```

## Translation Models

Use these three models for translation (chosen for multilingual capability and accuracy):

1. **Claude Sonnet 4** (Primary) - Best for context and nuance
2. **GPT-4o** - Strong multilingual performance  
3. **Gemma 3 12B** - Open model, efficient, good for Asian languages

## Workflow Steps

**CRITICAL: Use Todo List Management**

Before starting, create a comprehensive todo list with `manage_todo_list` tool to track all phases:

**Available Agent Skills for This Workflow:**
- 📚 **multi-model-ai-translation** (`.github/skills/multi-model-ai-translation/SKILL.md`) - Parallel translation with Claude/GPT/Gemma, consensus analysis, reverse verification
- 📄 **extract-code-documentation** (`.github/skills/extract-code-documentation/SKILL.md`) - Extract component docblocks for translation metadata

When the workflow instructions mention using these capabilities, use the `read_file` tool to get detailed instructions from the SKILL.md files.

1. Phase 1: Pre-Translation Analysis
2. Phase 2: Multi-Model Translation (per namespace/language)
3. Phase 3: Consensus Analysis
4. Phase 4: Reverse Translation Verification (per namespace/language)
5. Phase 5: Output Generation

**Mark each phase as `in-progress` when starting and `completed` when finished. Update the list after EVERY step.**

---

### Phase 1: Pre-Translation Analysis

1. **Verify component docblocks exist**: Ensure all components in `src/` have `@fileoverview` JSDoc comments

2. **Generate metadata** (if not already done):
```bash
npx tsx scripts/add-translation-metadata.ts
```
Note: This extracts docblocks and creates metadata-enhanced English locale files

3. **Read source language files**: `public/locales/{source}/{namespace}.json`

4. **Validate metadata structure**: Ensure all keys have required metadata fields:
   - `value` (string)
   - `context` (string)
   - `component.location` (string)
   - `component.description` (string)
   - `usage` (string)
   - `impact` (string)
   - `userType` (string)
   - `tone` (string)
   - `alternativeTerms` (array, optional)

5. **Identify namespaces**: Find all namespace files with `file_search`:
   - Pattern: `public/locales/en/*.json`
   - Lists all namespace files (auth, chat, common, editor, errors, grades, units)

6. **Check existing translations**: `file_search` with `public/locales/{target}/*.json`

7. **Determine translation scope**:
   - If `--force` is set: Translate all keys
   - If not: Only translate new/missing keys by comparing source vs target
8. **Create translation manifest**: Document which keys need translation per namespace
9. **Flag metadata issues**: Report any keys missing required metadata before proceeding

### Phase 2: Multi-Model Translation

**Mode Selection:**

#### Fake Mode (`--runmode=fake`)
For each target language, use Claude runtime to simulate all three models:

1. **Translate with Model 1 (Claude Sonnet 4 style)**:
   - Translate all keys in scope using Claude's native translation capability
   - Preserve JSON structure and nesting
   - Maintain placeholder syntax (e.g., `{{variable}}`, `{count}`)
   - Keep interpolation unchanged
   - Store output as `{namespace}-claude.json`

2. **Translate with Model 2 (GPT-4o style)**:
   - Same source input as Model 1
   - Simulate GPT-4o translation characteristics (slightly different phrasing)
   - Store output as `{namespace}-gpt.json`

3. **Translate with Model 3 (Gemma style)**:
   - Same source input as Model 1 & 2
   - Simulate Gemma translation characteristics
   - Store output as `{namespace}-translategemma.json`

#### Provable Mode (`--runmode=provable`)
For each namespace in each target language, execute actual API calls:

```bash
# Run translation script with proof generation
npx tsx scripts/translate-with-proof.ts {namespace} {source} {target}

# Example:
npx tsx scripts/translate-with-proof.ts auth en ja
```

**Script:** [.github/skills/multi-model-ai-translation/translate-with-proof.ts](../skills/multi-model-ai-translation/translate-with-proof.ts)

**Script Behavior:**
- Makes parallel API calls to Anthropic (Claude), OpenAI (GPT-4o), Google (Gemma)
- Generates individual model outputs: `{namespace}-claude.json`, `{namespace}-gpt.json`, `{namespace}-translategemma.json`
- Creates metadata files with request IDs and fingerprints for verification
- Outputs to `.translation-cache/{date}/{target}/` directory
- Generates proof document: `{namespace}-proof.json` with cryptographic verification data

**Script Arguments:**
- `{namespace}`: Namespace to translate (e.g., `auth`, `chat`, `common`)
- `{source}`: Source language code (e.g., `en`)
- `{target}`: Target language code (e.g., `ja`, `es`, `fr`)

**Mode Selection:**

#### Fake Mode (`--runmode=fake`)
For each target language, use Claude runtime to simulate reverse translation:

1. **Reverse translate with all 3 models**:
   - Input: Final translation file from Phase 3
   - Output: Translate back to English using Claude simulating each model
   - Store as `{namespace}-reverse-claude.json`, `{namespace}-reverse-gpt.json`, `{namespace}-reverse-gemini.json`

2. **Compare reverse translations to original source**:
   - Calculate semantic similarity (not exact match - allow for paraphrasing)
   - Flag keys where reverse translation significantly differs from source
   - Threshold: If meaning deviates, mark for review

#### Provable Mode (`--runmode=provable`)
After translation scripts complete, run verification:

```bash
# Verify all translations with cryptographic proof
npx tsx scripts/verify-translations.ts
```

**Script:** [.github/skills/multi-model-ai-translation/verify-translations.ts](../skills/multi-model-ai-translation/verify-translations.ts)

**Script Behavior:**
- Reads all metadata files from `.translation-cache/{date}/{target}/`
- Verifies SHA-256 fingerprints match actual translation content
- Checks request IDs are valid and unique across models
- Validates timestamps show parallel execution (within seconds)
- Generates console output verification report with proof status per namespace/language

**Output:**
- Console output showing verification status per namespace/language
- Proof validation: ✅ Valid or ❌ Invalid for each model
- Fingerprint verification results for cryptographic proof

### Phase 3: Consensus Analysis

1. **Compare all three translations** key-by-key
2. **Identify discrepancies**:
   - Exact matches: All 3 models agree ✅
   - 2/3 consensus: Two models agree, one differs ⚠️
   - No consensus: All 3 models differ ❌
3. **Document discrepancies** in markdown table:

   | Key Path | Claude | GPT-4o | Gemma | Consensus |
   |----------|--------|--------|--------|-----------|
   | `auth.sign_in` | ログイン | サインイン | ログイン | 2/3 (Claude+Gemma) |

4. **Choose final translation**:
   - If exact match: Use that translation
   - If 2/3 consensus: Use majority translation
   - If no consensus: Flag for human review, use Claude's translation as default

5. **Generate final translation file**: `public/locales/{target}/{namespace}.json`

### Phase 4: Reverse Translation Verification

For each target language:

1. **Reverse translate with all 3 models**:
   - Input: Final translation file from Phase 3
   - Output: Translate back to English
   - Store as `{namespace}-reverse-claude.json`, `{namespace}-reverse-gpt.json`, `{namespace}-reverse-translategemma.json`

2. **Compare reverse translations to original source**:
   - Calculate semantic similarity (not exact match - allow for paraphrasing)
   - Flag keys where reverse translation significantly differs from source
   - Threshold: If meaning deviates, mark for review

3. **Generate verification report** per namespace:

   | Key Path | Original (EN) | Target Translation | Reverse (Claude) | Reverse (GPT) | Reverse (Gemma) | Status |
   |----------|---------------|-------------------|------------------|---------------|------------------|--------|
   | `chat.send_message` | Send message | メッセージを送信 | Send message | Send a message | Transmit message | ✅ Pass |
   | `auth.forgot_password` | Forgot Password? | パスワードを忘れた？ | Forgot Password? | Lost Password? | Forgot your password? | ✅ Pass |

4. **Quality metrics**:
   - Translation consistency rate: % of keys with 3/3 model agreement
   - Reverse-translation accuracy: % of keys that reverse translate correctly
   - Keys requiring human review: List of flagged items

### Phase 5: Output Generation

Generate summary report: `translation-report-{timestamp}.md`

**Report Contents:**

```markdown
# Translation Report
**Date**: {timestamp}
**Source**: {source language code}
**Targets**: {target language codes}
**Namespaces**: {list of namespaces}
**Force Mode**: {true/false}

## Summary

- Total keys translated: {count}
- Languages processed: {count}
- Translation consistency rate: {percentage}%
- Reverse-translation accuracy: {percentage}%

## Discrepancies by Language

### Japanese (ja)
- Exact matches: {count} ({percentage}%)
- 2/3 consensus: {count} ({percentage}%)
- No consensus: {count} ({percentage}%)

[Detailed tables per namespace]

### Spanish (es)
...

## Reverse Translation Issues

### Japanese (ja)
[Table of keys with semantic drift]

## Human Review Required

| Language | Namespace | Key Path | Reason |
|----------|-----------|----------|--------|
| ja | auth | confirm_password | No model consensus |
| es | editor | insert_block | Reverse translation semantic drift |

## Files Updated

- ✅ public/locales/ja/auth.json (9 keys)
- ✅ public/locales/ja/chat.json (6 keys)
- ✅ public/locales/es/common.json (45 keys)
...
```

## Metadata Requirements for English Locale Files

**CRITICAL**: Before translating, English locale files MUST contain rich metadata for each key.

**Component Descriptions from Docblocks**: The `component.functionality` field is automatically extracted from JSDoc/TSDoc `@fileoverview` comments at the top of component files in `src/`. DO NOT manually duplicate component descriptions - they are pulled from the source code.

**Required Docblock Format in Component Files**:
```typescript
/**
 * @fileoverview ComponentName - Brief description
 * 
 * Detailed explanation of what this component does, when users see it,
 * and what interactions it supports. This text is automatically extracted
 * for translation metadata.
 * 
 * @module ComponentName
 */
```

**Example English Locale Metadata Structure**:
```json
{
  "sign_in": {
    "value": "Sign In",
    "context": "Authentication form primary action button that submits user credentials",
    "component": {
      "location": "src/components/Authenticator.js",
      "functionality": "Authentication form component that handles AWS Cognito sign in/sign up flows with email/password fields"
    },
    "usage": "Button label clicked by users to authenticate and access their account",
    "impact": "Critical - primary authentication action. Users click this to access the platform.",
    "userType": "all",
    "tone": "polite-formal",
    "alternativeTerms": ["Log In", "Login", "Enter"]
  }
}
```

**Metadata Fields:**
- `value`: The actual English text (string)
- `context`: Detailed explanation of where and how this text appears in the UI (string, 1-2 sentences)
- `component.location`: File path of React component using this key (string)
- `component.functionality`: **AUTO-EXTRACTED from component @fileoverview docblock** - What the component does and when users see it (string, 2-3 sentences)
- `usage`: Specific UI element type and user interaction (string, 1 sentence)
- `impact`: Importance level and user action (string, 1 sentence)
- `userType`: Who sees this ("all", "instructors", "students", "admins") (string)
- `tone`: Desired formality ("casual", "polite-formal", "technical") (string)
- `alternativeTerms`: Optional list of synonyms to help models understand semantic range (array of strings)

**Adding Metadata to Locale Files:**

1. **Ensure component docblocks exist** - Check that all components in `src/` have `@fileoverview` comments describing their functionality
2. **Run metadata generation script**: `npx tsx scripts/add-translation-metadata.ts`
3. **Script behavior**:
   - Scans all component files in `src/` for docblocks
   - Extracts `@fileoverview` descriptions
   - Maps component locations to their functionality
   - Populates `component.functionality` field automatically
   - Generates enhanced locale files in `public/locales/en/`

**Example Metadata for Different Contexts:**

```json
{
  "forgot_password": {
    "value": "Forgot Password?",
    "context": "Link text below password field on login form, triggers password reset flow",
    "component": {
      "location": "src/components/Authenticator.js",
      "functionality": "Authentication form component that handles AWS Cognito sign in/sign up flows. This link appears below the password field and redirects users to password reset when clicked."
    },
    "usage": "Clickable link text that opens password reset interface when user cannot remember their credentials.",
    "impact": "Important - helps locked-out users regain account access. Common support request.",
    "userType": "all",
    "tone": "casual",
    "alternativeTerms": ["Can't remember password", "Reset password", "Lost password"]
  },
  "insert_block": {
    "value": "Insert Block",
    "context": "Dropdown menu option in rich text editor toolbar, allows instructor to add content blocks",
    "component": {
      "location": "src/components/Editor3/plugins/ToolbarPlugin.js",
      "functionality": "Lexical editor toolbar plugin showing formatting options. This button opens a dropdown menu listing available block types (quiz, vocabulary, audio, video, answer blocks) that instructors can insert into learning units."
    },
    "usage": "Button label that opens block insertion menu. Clicked frequently when authoring educational content.",
    "impact": "High - core instructor workflow. Used repeatedly when creating lessons.",
    "userType": "instructors",
    "tone": "technical",
    "alternativeTerms": ["Add Block", "Create Block", "New Block"]
  }
}
```

## Translation Prompt Format

**Per-Key Translation Approach:**

Instead of translating entire JSON files at once, translate each key individually with full metadata context:

```
Translate this UI text for an eLearning platform:

**Word/Phrase to Translate:** "{value}"

**Context:** {context}

**Component:** {component.description}

**Usage:** {usage}

**User Type:** {userType}

**Tone:** {tone}

**Alternative Terms:** {alternativeTerms.join(', ')}

**Target Language:** {targetLang}

**CRITICAL INSTRUCTIONS:**
- Return ONLY the translated word/phrase, nothing else
- Preserve any placeholders: {{variables}}, {count}, etc.
- Match the specified tone ({tone})
- Consider how {userType} users will read this in context of {usage}
- Component context: {component.functionality}
- For Japanese: Use です/ます form for polite-formal tone
- Do NOT add explanations, quotes, or extra formatting

**Translation:**
```

**Translation Prompt Construction:**
The above template is populated from English locale metadata. The `component.functionality` field is extracted from the component's `@fileoverview` docblock, ensuring descriptions stay in sync with actual code documentation.

## Translation Guidelines

**Context Preservation:**
- Use metadata fields to inform translation decisions
- Match tone specification (casual, polite-formal, technical)
- Consider component.description to understand UI placement
- For Japanese: Use です/ます form for "polite-formal", plain form for "casual"
- Preserve technical terms where appropriate (e.g., "API" stays "API")

**Placeholder Handling:**
- Never translate placeholders: `{{username}}`, `{count}`, `%s`, etc.
- Keep them in their original position or adjust only for grammar

**JSON Structure:**
- Translate only the `value` field
- Keep all metadata fields in English (context, component, usage, etc.)
- Maintain same data types (strings stay strings)

**Cultural Adaptation:**
- Use culturally appropriate equivalents informed by alternativeTerms
- Respect language-specific formatting (dates, numbers, currency)
- Consider userType when choosing formality level

## Error Handling

**If translation fails:**
1. Log error details (model, namespace, key)
2. Skip problematic key but continue with others
3. Mark key as "TRANSLATION_FAILED" in output
4. Include in human review list

**If reverse translation fails:**
1. Log error but don't block translation output
2. Mark verification status as "VERIFY_FAILED"
3. Include in human review list

## Incremental Updates (Default Mode)

When `--force` is NOT set:

1. **Load existing target translations**
2. **Compare with source** (English) structure
3. **Identify delta**:
   - New keys in source not in target
   - Removed keys in target not in source (mark for cleanup)
   - Nested keys that changed structure
4. **Translate only new/missing keys**
5. **Merge with existing translations**:
   - Keep existing translations intact
   - Add new translations
   - Optionally remove deprecated keys (flag in report)

## Force Regeneration Mode

When `--force` is set:

1. **Translate entire source file** from scratch
2. **Overwrite existing target files** completely
3. **Useful when**:
   - Source translations significantly improved
   - Need to change translation style/tone
   - Major refactoring of namespace structure

## Output Files Structure

```
public/
  locales/
    en/                          # Source (read-only in this workflow)
      auth.json
      chat.json
      ...
    ja/                          # Target language
      auth.json                  # Final merged translation
      chat.json
      ...
    es/
      ...
    
.translation-cache/              # Temporary working directory
  2026-01-25-12-30-00/          # Timestamp of run
    ja/
### Fake Mode Example
```
INPUT: --source en --targets ja,es --namespaces auth,chat --runmode=fake

1. Read public/locales/en/auth.json, chat.json
2. Check existing translations in ja/ and es/
3. Identify new keys (incremental mode)

FOR EACH target (ja, es):
  FOR EACH namespace (auth, chat):
    - Translate with Claude runtime (simulating all 3 models)
    - Compare 3 simulated outputs
    - Choose consensus translation
    - Merge with existing translations
    
    - Reverse translate with Claude (simulating all 3 models)
    - Verify semantic equivalence
    - Log any discrepancies

4. Generate translation-report.md
5. Update public/locales/{ja,es}/{auth,chat}.json
6. Output summary to user
```

### Provable Mode Example
```
INPUT: --source en --targets ja,es --namespaces auth,chat --runmode=provable

1. Read public/locales/en/auth.json, chat.json
2. Check existing translations in ja/ and es/
3. Identify new keys (incremental mode)
4. Verify API keys are set (ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY)

7. **Choose runmode appropriately**:
   - Use `fake` for development, testing, and demonstrations (free, fast)
   - Use `provable` for production releases, audits, or when cryptographic proof is required (~$5-10 cost)
8. **API key management**: Store API keys securely in environment variables, never commit to version control
FOR EACH target (ja, es):
  FOR EACH namespace (auth, chat):
    - Mark todo as in-progress: "Translate {namespace} to {target}"
    - Use run_in_terminal to execute:
      npx tsx scripts/translate-with-proof.ts {namespace} en {target}
      (Set timeout: 120000ms, isBackground: false)
    - Wait for script completion (parallel API calls to 3 models)
    - Mark todo as completed
    - Script outputs:
      * .translation-cache/2026-01-25/ja/auth-claude.json + metadata
      * .translation-cache/2026-01-25/ja/auth-gpt.json + metadata
      * .translation-cache/2026-01-25/ja/auth-translategemma.json + metadata
      * .translation-cache/2026-01-25/ja/auth-proof.json
    - Load 3 model outputs from cache
    - Compare outputs for consensus
    - Choose consensus translation
    - Merge with existing translations

5. Mark todo as in-progress: "Cryptographic Verification"
6. Use run_in_terminal to execute:
   npx tsx scripts/verify-translations.ts
   (Set timeout: 30000ms, isBackground: false)
7. Verify fingerprints and request IDs
8. Mark todo as completed: "Cryptographic Verification"
9. FOR EACH target language:
     FOR EACH namespace:
       Mark todo as in-progress: "Reverse translate {namespace} ({target})"
       Use run_in_terminal to execute:
         npx tsx scripts/reverse-translate.ts {namespace} en {target}
         (Set timeout: 120000ms, isBackground: false)
       Wait for cross-validation completion
       Mark todo as completed: "Reverse translate {namespace} ({target})"
10. Mark todo as in-progress: "Generate Report"
11. Use run_in_terminal to execute:
    npx tsx scripts/generate-translation-report.ts
    (Set timeout: 30000ms, isBackground: false)
12. Generate translation-report-{timestamp}.md with all proof and verification data
13. Mark todo as completed: "Generate Report"
14. Output summary with verification status
```
INPUT: --source en --targets ja,es --namespaces auth,chat

1. Read public/locales/en/auth.json, chat.json
2. Check existing translations in ja/ and es/
3. Identify new keys (incremental mode)

FOR EACH target (ja, es):
  FOR EACH namespace (auth, chat):

## Runmode Comparison

| Feature | Fake Mode | Provable Mode |
|---------|-----------|---------------|
| **Cost** | Free | ~$5-10 for all translations |
| **Speed** | Fast (seconds) | Moderate (1-2 min for parallel API calls) |
| **Proof** | None (simulated) | Cryptographic fingerprints + request IDs |
| **API Keys** | Not required | Required (3 providers) |
| **Verification** | Demonstration only | Auditable via API dashboards |
| **Best For** | Development, testing, demos | Production releases, compliance, audits |
| **Script Dependencies** | None | [translate-with-proof.ts](../skills/multi-model-ai-translation/translate-with-proof.ts), [verify-translations.ts](../skills/multi-model-ai-translation/verify-translations.ts), [reverse-translate.ts](../skills/multi-model-ai-translation/reverse-translate.ts), [generate-translation-report.ts](../skills/multi-model-ai-translation/generate-translation-report.ts) |

## Required Scripts

### Metadata Preparation Scripts

**[.github/skills/extract-code-documentation/extract-component-docblocks.ts](../skills/extract-code-documentation/extract-component-docblocks.ts)**:
- Core utility that extracts `@fileoverview` JSDoc comments from all component files in `src/`
- Scans `src/**/*.{ts,tsx,js,jsx}` (excluding tests and stories)
- Parses docblocks to extract component functionality descriptions
- Used by add-translation-metadata.ts to populate `component.functionality` field
- Provides `extractAllDocblocks()` and `findDocblock()` functions

**Run**:
```bash
npx tsx scripts/extract-component-docblocks.ts
```

**[scripts/add-translation-metadata.ts](../../scripts/add-translation-metadata.ts)**:
- Generates English locale JSON files with rich metadata from component docblocks
- Automatically extracts component descriptions via extract-component-docblocks.ts
- Populates all required metadata fields: context, component, usage, impact, userType, tone
- Must be run BEFORE translation to ensure metadata exists

**Run**:
```bash
npx tsx scripts/add-translation-metadata.ts
```

### Translation Scripts (Provable Mode)

Ensure these TypeScript scripts exist before using `--runmode=provable`:

1. **[.github/skills/multi-model-ai-translation/translate-with-proof.ts](../skills/multi-model-ai-translation/translate-with-proof.ts)**:
   - Arguments: `{namespace} {source} {target}`
   - Makes API calls to Claude, GPT-4o, Gemma
   - Outputs translation files + metadata to `.translation-cache/`
   - Generates proof document with fingerprints
   
   **Run**:
   ```bash
   npx tsx .github/skills/multi-model-ai-translation/translate-with-proof.ts {namespace} {source} {target}
   ```

2. **[.github/skills/multi-model-ai-translation/verify-translations.ts](../skills/multi-model-ai-translation/verify-translations.ts)**:
   - No arguments (reads from `.translation-cache/`)
   - Verifies SHA-256 fingerprints
   - Validates request IDs and timestamps
   - Outputs verification report to console
   
   **Run**:
   ```bash
   npx tsx .github/skills/multi-model-ai-translation/verify-translations.ts
   ```

3. **[.github/skills/multi-model-ai-translation/reverse-translate.ts](../skills/multi-model-ai-translation/reverse-translate.ts)**:
   - Arguments: `{namespace} {source} {target}`
   - Performs cross-validation reverse translation
   - Each model's forward translation is reversed back to English by the OTHER two models
   - Creates comprehensive cross-validation matrix comparing all reverse translations to original
   - Outputs results to `.translation-cache/{date}/{target}/{namespace}-reverse-results.json`
   - Reports semantic similarity scores and flags keys with drift
   
   **Run**:
   ```bash
   npx tsx .github/skills/multi-model-ai-translation/reverse-translate.ts {namespace} {source} {target}
   ```

4. **[.github/skills/multi-model-ai-translation/generate-translation-report.ts](../skills/multi-model-ai-translation/generate-translation-report.ts)**:
   - No arguments (reads from `.translation-cache/`)
   - Aggregates all translation, verification, and cross-validation data across all languages
   - Generates comprehensive `translation-report-{timestamp}.md` in project root
   - Includes:
     - Consensus analysis per namespace/language
     - Cross-validation results with semantic similarity scores
     - Cryptographic proof verification status
     - Human review items flagged for attention
     - Summary statistics across all translations
   - Automatically runs at the end of the workflow
   
   **Run**:
   ```bash
   npx tsx .github/skills/multi-model-ai-translation/generate-translation-report.ts
   ```

**Required Scripts (Provable Mode):**
All scripts below exist in `scripts/` directory and are ready to use:
- [translate-with-proof.ts](../skills/multi-model-ai-translation/translate-with-proof.ts) - Multi-model translation with proof (includes rate limiting: 500ms delay for Claude/GPT, 2s for Gemma to stay under 30 req/min limit)
- [verify-translations.ts](../skills/multi-model-ai-translation/verify-translations.ts) - Cryptographic verification
- [reverse-translate.ts](../skills/multi-model-ai-translation/reverse-translate.ts) - Cross-validation reverse translation
- [generate-translation-report.ts](../skills/multi-model-ai-translation/generate-translation-report.ts) - Report generation
- [run-full-translation.sh](../../scripts/run-full-translation.sh) - Batch script to run all translations with force mode (includes 10s delays between namespaces)

**Rate Limiting:**
- Claude: 500ms delay between keys (safe for high limits)
- GPT-4o: 500ms delay between keys (safe for high limits)  
- Gemma: 2 seconds delay between keys (30 requests/minute limit for Gemma 3)
- Batch script: Additional 10s delay between namespaces to prevent quota exhaustion

**Error Handling:**
All three models must complete successfully for each namespace. If any model fails (API error, rate limit, network issue), the entire translation for that namespace is aborted and marked as failed. This ensures translation consistency - we never proceed with partial results from only 1 or 2 models.

See [i18n-translation-implementation.md](i18n-translation-implementation.md) for full script implementation details.
    - Translate with Claude Sonnet 4
    - Translate with GPT-4o  
    - Translate with Gemma 3
    - Compare 3 outputs
    - Choose consensus translation
    - Merge with existing translations
    
    - Reverse translate with all 3 models
    - Verify semantic equivalence
    - Log any discrepancies

4. Generate translation-report.md
5. Update public/locales/{ja,es}/{auth,chat}.json
6. Output summary to user
```

## Best Practices

1. **Metadata quality is critical** - Rich component descriptions dramatically improve translation accuracy
2. **Component descriptions must be functional** - Don't just say "LoginForm component", say "Login form displayed on /auth/signin with email/password fields that authenticates users when submitted"
3. **Always run reverse verification** - Don't skip Phase 4
4. **Review no-consensus items** - Human judgment needed for 0/3 agreement
5. **Test in UI** - Load translations in app to verify context
6. **Version control** - Commit translation files separately from code
7. **Iterative refinement** - Use `--force` sparingly, prefer incremental updates
8. **Per-key context matters** - Translate key-by-key with full metadata, not entire JSON files at once
9. **NEVER CHANGE RUNMODE** - Once user specifies or defaults to a runmode, it MUST NOT be changed under ANY circumstances (API errors, quota limits, missing keys, etc.). Troubleshoot and fix errors - do not switch modes.
10. **Execute all scripts via `run_in_terminal`** with appropriate timeouts:
    - Translation scripts: 120 seconds
    - Verification/report scripts: 30 seconds
    - Metadata generation: 60 seconds
    - Always wait for completion (not background)

## Notes

- Source files are in `public/locales/en/`
- Target files created/updated in `public/locales/{code}/`
- The app uses `next-i18next` for runtime translation loading
- Translation keys follow dotted notation: `namespace.section.key`
- Some keys contain HTML or Markdown - preserve formatting
- Pluralization rules vary by language - check i18next documentation

