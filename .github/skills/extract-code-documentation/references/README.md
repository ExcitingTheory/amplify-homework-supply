# Extract Code Documentation Skill

Automated translation metadata generation system that discovers translations from actual code usage.

## Quick Start

```bash
cd .github/skills/extract-code-documentation
npx tsx scripts/auto-generate-metadata.ts
```

## How It Works

### vs. Old Manual Approach

**OLD (add-translation-metadata.ts)**:
- 1400+ lines of hardcoded metadata
- Manual maintenance required
- Metadata can drift from actual usage

**NEW (auto-generate-metadata.ts)**:
- Scans codebase for ALL translation calls
- Generates metadata from actual usage context
- Discovers missing translations automatically
- Identifies new namespaces needed

### Workflow

1. **Scan Codebase** - Find all `useTranslation()` and `t()` calls in `src/**/*.{js,jsx,ts,tsx}`
2. **Extract Keys** - Parse namespace + key paths from actual code
3. **Compare with Locales** - Match against `public/locales/en/*.json` files
4. **Extract Docblocks** - Read `/** */` JSDoc comments from component files
5. **Generate Metadata** - Create `_meta` objects from usage context
6. **Update Locales** - Merge metadata into JSON files programmatically

### Translation Call Patterns

```javascript
// Pattern 1: Explicit namespace in useTranslation
const { t } = useTranslation('components');
t('chatSidebar.submit'); // → components:chatSidebar.submit

// Pattern 2: Explicit namespace:key format
t('errors:validation.required'); // → errors:validation.required

// Pattern 3: Default namespace
const { t } = useTranslation(); // Defaults to 'common'
t('actions.save'); // → common:actions.save
```

### Generated Metadata Structure

```json
{
  "chatSidebar": {
    "submit": {
      "value": "Submit",
      "_meta": {
        "context": "Used in ChatSidebar.js component",
        "component": {
          "location": ["components/ChatSidebar.js"],
          "functionality": "Component functionality not documented"
        },
        "usage": "Button label for submit action",
        "impact": "Triggers submit action when clicked",
        "userType": "all",
        "category": "button"
      }
    }
  }
}
```

### Metadata Fields

- **context**: Which component/file uses this key
- **component.location**: Array of file paths using this translation
- **component.functionality**: Extracted from `/** @fileoverview */` JSDoc comment (if present)
- **usage**: Inferred from key name and category
- **impact**: Inferred from category (button → "Triggers X action", error → "Displays X error")
- **userType**: `all` | `learners` | `instructors` | `admins` - inferred from file path
- **category**: `button` | `label` | `heading` | `message` | `placeholder` | `error` | `status` | `navigation`

### Category Inference Rules

- **button**: Keys containing `button`, `action`, `submit`
- **error**: Keys containing `error` or in `errors` namespace
- **heading**: Keys containing `heading`, `title`
- **placeholder**: Keys containing `placeholder`
- **status**: Keys containing `status`
- **navigation**: Keys containing `nav`, `menu`
- **message**: Keys containing `message`, `description`
- **label**: Default fallback

### User Type Inference

- **learners**: Files in `pages/workbook/`, `components/Grade*`
- **instructors**: Files in `pages/teacher/`, `components/SectionEditor*`
- **admins**: Files in `pages/admin/`
- **all**: Default

## Output Example

```
🔍 Step 1: Scanning codebase for translation calls...
   Found 77 unique translation keys with 90 usages
   Across 1 namespaces

🔍 Step 2: Comparing with locale files...
   Locale files: 10
   Missing keys: 23
   New namespaces needed: none

⚠️  Missing translations:
   - components:chatSidebar.attachFilesToMessage (used in 1 places)
   - components:chatSidebar.history (used in 1 places)
   ... and 21 more

🔍 Step 3: Extracting component docblocks...
   Extracted 183 component docblocks

🔍 Step 4: Generating metadata from usage context...
   Generated 77 metadata entries

🔍 Step 5: Updating locale files with metadata...
✅ Updated components.json with 77 metadata entries

✅ Metadata generation complete!

📊 Summary:
   - Translation keys in code: 77
   - Keys with values: 54
   - Missing from locale files: 23
   - New namespaces needed: 0
   - Average usages per key: 1.2

📝 Next steps:
   1. Add 23 missing translations to locale files
   2. Review auto-generated metadata in locale files
   3. Run translation workflow to translate to other languages
```

## Adding JSDoc Comments for Better Metadata

To improve generated metadata, add file-level JSDoc comments to components:

```javascript
/**
 * @fileoverview Chat sidebar for AI-assisted learning conversations.
 * Displays message history, file attachments, and streaming responses.
 */
import React from 'react';

export function ChatSidebar() {
  // ...
}
```

The `@fileoverview` description will be extracted and included in the metadata's `component.functionality` field.

## Handling Missing Translations

When the script finds translation calls in code that don't exist in locale files:

1. **View missing keys**: Check the "Missing translations" section of output
2. **Add to locale files**: Manually add the translation with a value
3. **Re-run script**: Metadata will be generated for the new keys

Example adding a missing key to `public/locales/en/components.json`:

```json
{
  "chatSidebar": {
    "attachFilesToMessage": "Attach files to message"
  }
}
```

## Creating New Namespaces

If the script detects translation calls with a new namespace (e.g., `t('validation:required')`):

1. Create new file: `public/locales/en/validation.json`
2. Add keys: `{ "required": "This field is required" }`
3. Re-run script: Metadata will be generated

## Testing

```bash
# Type check
npx tsc --noEmit

# Run test suite  
npx tsx test/extract-code-documentation.test.ts
```

## Files

- `scripts/auto-generate-metadata.ts` - Main automated metadata generator  
- `scripts/extract-component-docblocks.ts` - JSDoc/TSDoc parser
- `scripts/add-translation-metadata.ts` - DEPRECATED manual approach (1400+ lines)
- `test/extract-code-documentation.test.ts` - Test suite

## Related Skills

- **docblock-backfill** - Validates and backfills JSDoc comments in files
- **multi-model-ai-translation** - Translates content using multiple AI models with consensus
