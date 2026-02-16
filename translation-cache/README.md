# Translation Metadata Cache

This directory contains translation metadata extracted from locale files during the flattening process.

## Structure

```
translation-cache/
├── en/
│   ├── components.meta.json
│   ├── pages.meta.json
│   ├── editor.ai.meta.json
│   └── ...
├── es/
├── fr/
└── ...
```

## Metadata Format

Each `.meta.json` file contains documentation for translation keys:

```json
{
  "key.path": {
    "context": "When and where this translation appears",
    "usage": "How it's used in the UI",
    "component": {
      "location": "path/to/component.tsx",
      "description": "Component description from JSDoc"
    },
    "tone": "polite-formal",
    "userType": "all",
    "impact": "Critical for navigation",
    "alternativeTerms": ["Option 1", "Option 2"],
    "category": "label"
  }
}
```

## Purpose

- **Documentation**: Provides context for translators
- **AI Training**: Used by translation scripts to generate better translations
- **Quality Assurance**: Helps maintain consistent tone and terminology
- **Auditing**: Tracks metadata changes over time

## Regeneration

This directory is automatically generated and can be safely deleted. Regenerate by running:

```bash
node scripts/flatten-locales.js
```

Or regenerate during metadata generation:

```bash
cd .github/skills/extract-code-documentation
npx tsx scripts/generate-missing-metadata.ts
```

## Why Separate?

Metadata is kept separate from translation files to:
- ✅ Keep bundle size small (metadata not shipped to clients)
- ✅ Enable clean i18next integration (no `.value` accessor needed)
- ✅ Simplify translation file format (plain key-value pairs)
- ✅ Maintain rich documentation for development/translation workflows

## Version Control

This directory is in `.gitignore` because:
- Metadata can be regenerated from source code and locale files
- Reduces repository size  
- Prevents merge conflicts on auto-generated content

However, you can commit specific metadata files if needed for translation workflows.
