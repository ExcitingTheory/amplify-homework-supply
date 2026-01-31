# Automated Translation Metadata Workflow

**Status:** ✅ IMPLEMENTED (Replaces 1400-line manual approach)

## Overview

The automated metadata generation system scans your codebase for actual translation usage, compares with locale files, and generates metadata programmatically. No more manual maintenance of hardcoded metadata.

## Quick Start

```bash
cd .github/skills/extract-code-documentation
npx tsx scripts/auto-generate-metadata.ts
```

## What Changed

### Before (Manual Approach)

**File:** `add-translation-metadata.ts` (1400+ lines)

Problems:
- ❌ Hardcoded metadata for hundreds of keys
- ❌ Manual maintenance required for each new translation
- ❌ Metadata drifts from actual code usage
- ❌ No way to detect missing translations
- ❌ Can't discover new namespaces automatically

```typescript
// OLD - Manual metadata definition
async function getCommonMetadata() {
  return {
    "actions": {
      "save": {
        "value": "Save",
        "_meta": {
          "context": "Manually written description...",
          "component": { "location": ["manually tracked"] },
          // ... hundreds more lines
        }
      }
    }
  };
}
```

### After (Automated Approach)

**File:** `auto-generate-metadata.ts` (~480 lines)

Benefits:
- ✅ Scans codebase for ALL `t()` and `useTranslation()` calls
- ✅ Discovers actual usage automatically
- ✅ Identifies missing translations and new namespaces
- ✅ Generates metadata from real usage context
- ✅ Extracts component docblocks for functionality descriptions
- ✅ Self-maintaining - just re-run when code changes

```typescript
// NEW - Automated discovery
async function scanTranslationCalls(sourceDir: string) {
  // Scans all files for useTranslation('namespace') and t('key')
  // Returns actual usage data with file locations and line numbers
  // Automatically tracks which components use which keys
}
```

## Architecture

### Workflow Steps

```
1. SCAN CODE
   ↓
   Find all useTranslation('namespace') → track namespace context
   Find all t('key') calls → extract key paths
   Result: 77 unique keys with 90 usages across 323 files
   
2. COMPARE WITH LOCALES
   ↓
   Match keys against public/locales/en/*.json
   Identify: 
   - Keys WITH values (54)
   - MISSING keys (23)
   - NEW namespaces needed (0)
   
3. EXTRACT DOCBLOCKS
   ↓
   Read /** @fileoverview */ from component files
   Result: 183 component docblocks
   
4. GENERATE METADATA
   ↓
   For each key:
   - context: "Used in Component.tsx"
   - component.location: ["components/Component.tsx"]
   - component.functionality: From docblock or "not documented"
   - usage: Inferred from key name and category
   - impact: Inferred from category
   - userType: Inferred from file path
   - category: Inferred from key patterns
   
5. UPDATE LOCALE FILES
   ↓
   Merge _meta into JSON files without data loss
   Result: Updated components.json with 77 metadata entries
```

### Code Discovery Patterns

| Pattern | Example | Result |
|---------|---------|--------|
| **Namespace from hook** | `const { t } = useTranslation('components');`<br>`t('chatSidebar.submit')` | `components:chatSidebar.submit` |
| **Explicit namespace** | `t('errors:validation.required')` | `errors:validation.required` |
| **Default namespace** | `const { t } = useTranslation();`<br>`t('actions.save')` | `common:actions.save` |
| **Nested keys** | `t('sidebar.navigation.home')` | Handles dot notation automatically |

### Metadata Inference Rules

#### Category

```typescript
'button'      // Keys with: button, action, submit
'error'       // Keys with: error, OR in errors namespace
'heading'     // Keys with: heading, title
'placeholder' // Keys with: placeholder
'status'      // Keys with: status
'navigation'  // Keys with: nav, menu
'message'     // Keys with: message, description
'label'       // Default fallback
```

#### User Type

```typescript
'learners'     // Files in: pages/workbook/, components/Grade*
'instructors'  // Files in: pages/teacher/, components/Section*
'admins'       // Files in: pages/admin/
'all'          // Default
```

#### Usage Description

Generated from category and key name:

```typescript
// category: 'button', key: 'submit'
usage: "Button label for submit action"

// category: 'error', key: 'validation'  
usage: "Error message for validation field"

// category: 'placeholder', key: 'search'
usage: "Placeholder text for search field"
```

#### Impact Description

Generated from category:

```typescript
// category: 'button'
impact: "Triggers {action} action when clicked"

// category: 'error'
impact: "Displays {field} error to user"

// category: 'heading'
impact: "Provides structural heading for {field} section"
```

## Output Example

```bash
$ npx tsx scripts/auto-generate-metadata.ts

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

## Generated Metadata Structure

```json
{
  "chatSidebar": {
    "submit": {
      "value": "Submit",
      "_meta": {
        "context": "Used in ChatSidebar.js component",
        "component": {
          "location": [
            "components/ChatSidebar.js"
          ],
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

## Improving Metadata Quality

### Add JSDoc Comments

To get better `component.functionality` descriptions, add file-level JSDoc comments:

```javascript
/**
 * @fileoverview Chat sidebar for AI-assisted learning conversations.
 * Displays message history, file attachments, and streaming responses.
 * Supports drag-and-drop file uploads and tool execution visualization.
 */
import React from 'react';

export function ChatSidebar() {
  // ...
}
```

After adding docblock, re-run script:
```bash
npx tsx scripts/auto-generate-metadata.ts
```

Now `component.functionality` will be:
```
"Chat sidebar for AI-assisted learning conversations. Displays message history..."
```

## Handling Missing Translations

### Workflow

1. **Run script and see missing keys**
   ```
   ⚠️  Missing translations:
      - components:chatSidebar.clearHistory (used in 1 places)
   ```

2. **Add value to locale file**
   ```json
   // public/locales/en/components.json
   {
     "chatSidebar": {
       "clearHistory": "Clear History"
     }
   }
   ```

3. **Re-run script to generate metadata**
   ```bash
   npx tsx scripts/auto-generate-metadata.ts
   ```

4. **Metadata automatically added**
   ```json
   {
     "chatSidebar": {
       "clearHistory": {
         "value": "Clear History",
         "_meta": {
           "context": "Used in ChatSidebar.js component",
           "usage": "Button label for clearHistory action",
           "category": "button",
           // ... auto-generated
         }
       }
     }
   }
   ```

## Creating New Namespaces

If code uses `t('validation:required')` but `validation.json` doesn't exist:

### Script Output

```
New namespaces needed: validation
```

### Steps

1. **Create namespace file**
   ```bash
   touch public/locales/en/validation.json
   ```

2. **Add initial keys**
   ```json
   {
     "required": "This field is required",
     "email": "Please enter a valid email address"
   }
   ```

3. **Re-run script**
   ```bash
   npx tsx scripts/auto-generate-metadata.ts
   ```

4. **Metadata auto-generated for new namespace**

## Comparison

| Feature | Manual (add-translation-metadata.ts) | Automated (auto-generate-metadata.ts) |
|---------|--------------------------------------|---------------------------------------|
| **Lines of code** | 1400+ | ~480 |
| **Discovers usage** | ❌ No | ✅ Yes (scans actual code) |
| **Finds missing keys** | ❌ No | ✅ Yes (23 found in example) |
| **Detects new namespaces** | ❌ No | ✅ Yes |
| **Maintenance** | ❌ Manual updates | ✅ Re-run script |
| **Accuracy** | ⚠️ Can drift | ✅ Always matches code |
| **Component locations** | ❌ Hardcoded | ✅ Auto-tracked |
| **Docblock integration** | ❌ No | ✅ Yes (183 extracted) |
| **Usage statistics** | ❌ No | ✅ Yes (usages per key) |

## Integration with Translation Workflow

### Before Running AI Translation

```bash
# Step 1: Generate metadata from code usage
cd .github/skills/extract-code-documentation
npx tsx scripts/auto-generate-metadata.ts

# Step 2: Verify metadata in locale files
cat public/locales/en/components.json | jq '.chatSidebar.submit._meta'

# Step 3: Run translation workflow (uses metadata for context)
# See docs/I18N_TRANSLATION_STATUS.md
```

### Adding a New Translated String

1. **Add to code**
   ```javascript
   const { t } = useTranslation('components');
   <Button>{t('myNewButton.label')}</Button>
   ```

2. **Run discovery**
   ```bash
   npx tsx scripts/auto-generate-metadata.ts
   ```
   
   Output:
   ```
   ⚠️  Missing translations:
      - components:myNewButton.label (used in 1 places)
   ```

3. **Add translation value**
   ```json
   {
     "myNewButton": {
       "label": "My New Button"
     }
   }
   ```

4. **Re-run to generate metadata**
   ```bash
   npx tsx scripts/auto-generate-metadata.ts
   ```

5. **Metadata automatically added**
   ```json
   {
     "myNewButton": {
       "label": {
         "value": "My New Button",
         "_meta": {
           "context": "Used in MyComponent.tsx",
           "category": "button",
           // ... auto-generated
         }
       }
     }
   }
   ```

## Files

| File | Purpose | Status |
|------|---------|--------|
| `auto-generate-metadata.ts` | **NEW** automated generator | ✅ Use this |
| `add-translation-metadata.ts` | **DEPRECATED** manual approach | ⚠️ Don't use |
| `extract-component-docblocks.ts` | JSDoc parser (used by auto) | ✅ Dependency |
| `test/extract-code-documentation.test.ts` | Test suite | ✅ Tests docblock extraction |

## Testing

```bash
cd .github/skills/extract-code-documentation

# Type check
npx tsc --noEmit

# Run tests
npx tsx test/extract-code-documentation.test.ts

# Test auto-generation
npx tsx scripts/auto-generate-metadata.ts
```

## Next Steps

1. **Run on your codebase** - See what's missing
2. **Add JSDoc comments** - Improve component documentation
3. **Add missing translations** - Fix the 23 missing keys
4. **Re-run periodically** - Keep metadata in sync
5. **Integrate into CI** - Catch missing translations early

## Related Documentation

- [README.md](./README.md) - Detailed usage guide
- [SKILL.md](./SKILL.md) - Original docblock extraction skill
- [../../docs/I18N_TRANSLATION_STATUS.md](../../docs/I18N_TRANSLATION_STATUS.md) - Translation workflow
