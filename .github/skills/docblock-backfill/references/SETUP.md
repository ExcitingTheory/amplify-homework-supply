# Docblock Backfill Skill

Automatically maintains JSDoc/TSDoc documentation in files with user-facing strings.

## Quick Start

```bash
# Validate all docblocks
npx tsx scripts/validate-docblocks.ts

# Backfill missing docblocks (dry run)
npx tsx scripts/backfill-docblocks.ts --dry-run

# Apply backfill
npx tsx scripts/backfill-docblocks.ts

# Sync metadata from locale files
npx tsx scripts/sync-metadata.ts

# Generate coverage report
npx tsx scripts/generate-docblock-report.ts
```

## What It Does

1. **Validates existing docblocks** - Ensures file-level JSDoc/TSDoc matches actual code
2. **Adds missing file headers** - Creates docblocks for undocumented files
3. **Syncs locale metadata** - Updates component metadata from `public/locales/en/*.json`
4. **Backfills metadata fields** - Adds missing `context`, `usage`, `impact` fields from locale data

## Workflow Integration

### With Translation Workflow

```bash
# 1. Extract components → locale files
npx tsx ../extract-code-documentation/scripts/extract-component-docblocks.ts

# 2. Add metadata structure
npx tsx ../extract-code-documentation/scripts/add-metadata-all-namespaces.ts

# 3. Translate (manual or automated)
# Translators enrich metadata during this step

# 4. Sync enriched metadata → code docblocks
npx tsx scripts/sync-metadata.ts

# 5. Validate all docblocks
npx tsx scripts/validate-docblocks.ts --report
```

### Git Hooks

See [references/WORKFLOW_INTEGRATION.md](./references/WORKFLOW_INTEGRATION.md) for pre-commit hook setup.

### CI/CD

See [references/WORKFLOW_INTEGRATION.md](./references/WORKFLOW_INTEGRATION.md) for GitHub Actions examples.

## Configuration

Create `.docblock-backfill.json` in project root:

```json
{
  "include": ["src/**/*.{ts,tsx,js,jsx}"],
  "exclude": ["**/*.test.*", "**/*.stories.*"],
  "validation": {
    "requireFileDocblock": true,
    "requireMetadata": true
  }
}
```

See [references/CONFIGURATION.md](./references/CONFIGURATION.md) for all options.

## Documentation

- [SKILL.md](./SKILL.md) - Complete skill documentation and usage guide
- [references/FILE_PATTERNS.md](./references/FILE_PATTERNS.md) - Discovery patterns
- [references/VALIDATION_RULES.md](./references/VALIDATION_RULES.md) - Validation criteria
- [references/LOCALE_METADATA_SPEC.md](./references/LOCALE_METADATA_SPEC.md) - Metadata format
- [references/DOCBLOCK_TEMPLATES.md](./references/DOCBLOCK_TEMPLATES.md) - JSDoc templates
- [references/CONFIGURATION.md](./references/CONFIGURATION.md) - Configuration options
- [references/WORKFLOW_INTEGRATION.md](./references/WORKFLOW_INTEGRATION.md) - CI/CD setup
- [references/EXAMPLES.md](./references/EXAMPLES.md) - 10+ usage examples

## Testing

```bash
# Run tests
npm run test

# Or directly
npx tsx test/docblock-backfill.test.ts
```

## Related Skills

- [extract-code-documentation](../extract-code-documentation/SKILL.md) - Extracts docs → locale files (opposite direction)
- [multi-model-ai-translation](../multi-model-ai-translation/SKILL.md) - Uses metadata for translation context
- [storybook-validation](../storybook-validation/SKILL.md) - Validates component stories

## License

MIT
