---
name: extract-code-documentation
description: AI-powered translation metadata generation from codebase usage patterns and JSDoc/TSDoc docblocks
---

# Extract Code Documentation

Generate AI-powered translation metadata for i18n locale files by analyzing code usage and component documentation.

## What This Skill Does

Provides three approaches to generate AI-powered metadata for i18n locale files:

### Approach 1: Codebase Analysis (auto-generate-metadata.ts)
1. **Discover** translation keys from actual code usage (`useTranslation()`, `t()`)
2. **Extract** component descriptions from JSDoc `@fileoverview`
3. **Generate** metadata with Claude Sonnet 4 (context, usage, tone, alternatives)
4. **Update** locale JSON files with `_meta` objects
5. **Report** missing translations not yet in locale files

### Approach 2: Fix Placeholders (regenerate-placeholder-metadata.ts)
1. **Scan** locale files for entries with `[NEEDS_*` or "functionality not documented"
2. **Regenerate** metadata for incomplete entries only
3. **Preserve** existing complete metadata
4. **Update** locale files with proper metadata

### Approach 3: Fill Missing (generate-missing-metadata.ts)
1. **Scan** locale files for entries without `_meta` fields
2. **Convert** plain string values to `{value, _meta}` structure
3. **Generate** metadata for entries missing it
4. **Update** locale files with new metadata

All approaches use the same AI prompt template for consistency.

## When to Use

**Invoke this skill when user asks to:**
- Generate or update translation metadata
- Enrich i18n/locale files with context
- Extract component documentation
- Sync locale files with codebase changes
- Audit documentation coverage
- Fix placeholder or incomplete metadata
- Add metadata to entries missing it

**Script Selection Guide:**
- "scan my code" / "find translations" → `auto-generate-metadata.ts`
- "fix [NEEDS_*" / "regenerate placeholders" → `regenerate-placeholder-metadata.ts`
- "add metadata to everything" / "fill in missing _meta" → `generate-missing-metadata.ts`

**Typical phrases:**
- "generate translation metadata"
- "update i18n metadata" 
- "enrich locale files"
- "extract component docs"
- "fix placeholder metadata"
- "add missing metadata"

## Available Scripts

Three scripts provide different metadata generation approaches:

### 1. Generate All Metadata (Initial Setup)
**Use when:** First-time setup or complete regeneration from codebase analysis

```bash
cd .github/skills/extract-code-documentation
npx tsx scripts/auto-generate-metadata.ts
```

- Scans codebase for all `t()` and `useTranslation()` calls
- Discovers translation keys from actual usage
- Generates metadata for all keys found in code
- Reports missing translations not yet in locale files

### 2. Fix Placeholder Metadata
**Use when:** Entries have incomplete metadata with `[NEEDS_*` or "functionality not documented"

```bash
cd .github/skills/extract-code-documentation
npx tsx scripts/regenerate-placeholder-metadata.ts
```

- Scans locale files for placeholder text
- Regenerates only entries with incomplete metadata
- Preserves existing complete metadata
- Fixed 276/277 entries in recent run

### 3. Generate Missing Metadata
**Use when:** Some entries lack `_meta` fields entirely

```bash
cd .github/skills/extract-code-documentation
npx tsx scripts/generate-missing-metadata.ts
```

- Scans locale files for entries without `_meta` objects
- Converts plain string entries to `{value, _meta}` structure
- Generates metadata for entries missing it
- Preserves entries that already have metadata

**Requirements:** All scripts require `ANTHROPIC_API_KEY` environment variable

**Typical Output:**
```
🔍 Step 1: Scanning locale files...
   Found 277 entries without metadata
📊 Missing metadata by namespace:
   - components: 250 entries
   - common: 15 entries
   - editor: 8 entries
🔍 Step 2: Extracting component docblocks...
   Extracted 183 component docblocks
🔍 Step 3: Generating metadata with AI...
   Progress: 10/277 entries processed...
   Progress: 270/277 entries processed...
✅ Generation complete!
   Successfully generated: 276
   Errors: 1
```

## Agent Execution

**Check for API key first:**
```bash
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY required"
  exit 1
fi
```

**Determine which script to run:**

1. **User wants to generate metadata from codebase usage** → Run `auto-generate-metadata.ts`
   - First-time setup
   - "scan my code for translations"
   - "generate metadata from usage"
   
2. **User wants to fix incomplete metadata** → Run `regenerate-placeholder-metadata.ts`
   - "fix placeholder metadata"
   - "regenerate [NEEDS_*" 
   - "update incomplete metadata"
   
3. **User wants to add metadata to entries without it** → Run `generate-missing-metadata.ts`
   - "add metadata to all entries"
   - "generate missing _meta fields"
   - "convert plain strings to metadata"

**Run the appropriate script:**
```bash
cd .github/skills/extract-code-documentation
npx tsx scripts/[chosen-script].ts
```

**Report results to user:**
- Number of entries found/processed
- Number of metadata entries generated successfully
- Which namespaces/files were updated
- Any errors encountered (scripts continue on errors)

**On failure:** All scripts continue processing remaining entries and report success/error counts at end.

## Generated Metadata

Each locale entry gets AI-generated `_meta`:

```json
{
  "loginButton": {
    "value": "Sign In",
    "_meta": {
      "context": "Login button in authentication form...",
      "component": {
        "location": "src/components/Authenticator.js",
        "description": "Authentication form component..."
      },
      "usage": "Primary action button...",
      "impact": "Critical - enables user access",
      "userType": "all",
      "tone": "polite-formal",
      "alternativeTerms": ["Log In", "Login", "Sign On"]
    }
  }
}
```

**Fields:** context, component (location + description from JSDoc), usage, impact, userType, tone, alternativeTerms

## Script Architecture

**Shared Modules:**
- [metadata-prompt.ts](./scripts/metadata-prompt.ts) - Shared AI prompt template used by all scripts
- [extract-component-docblocks.ts](./scripts/extract-component-docblocks.ts) - JSDoc extraction utilities

**Main Scripts:**
- [auto-generate-metadata.ts](./scripts/auto-generate-metadata.ts) - Codebase analysis and generation
- [regenerate-placeholder-metadata.ts](./scripts/regenerate-placeholder-metadata.ts) - Fix incomplete metadata
- [generate-missing-metadata.ts](./scripts/generate-missing-metadata.ts) - Add metadata to entries without it

All scripts share the same AI prompt template for consistency across metadata generation.

## Additional Utilities

**Standalone docblock extraction** (no AI, no API key):
```bash
npx tsx scripts/extract-component-docblocks.ts
```

Outputs list of components with/without JSDoc `@fileoverview` for documentation audits.

## Related Skills

- [multi-model-ai-translation](../multi-model-ai-translation/SKILL.md) - Multi-model translation with consensus
- [docblock-backfill](../docblock-backfill/SKILL.md) - Sync docblocks with locale metadata

## Reference Documentation

- [references/README.md](./references/README.md) - Complete schemas and API docs
- [scripts/auto-generate-metadata.ts](./scripts/auto-generate-metadata.ts) - Codebase scan implementation
- [scripts/regenerate-placeholder-metadata.ts](./scripts/regenerate-placeholder-metadata.ts) - Placeholder fix implementation
- [scripts/generate-missing-metadata.ts](./scripts/generate-missing-metadata.ts) - Missing metadata implementation
- [scripts/metadata-prompt.ts](./scripts/metadata-prompt.ts) - Shared AI prompt template

---

**Version**: 1.1.0 | **Status**: Production ready | **Scripts**: 3 main + 2 utilities