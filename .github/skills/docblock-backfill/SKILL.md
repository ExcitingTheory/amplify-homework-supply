---
name: docblock-backfill
description: Automatically adds and updates JSDoc/TSDoc docblocks in files with user-facing strings, synchronized with i18n locale metadata. Validates existing docs match code, backfills missing file headers, and syncs metadata fields from English locale files.
license: MIT
metadata:
  author: ExcitingTheory
  version: "1.0.0"
  related-skills: ["extract-code-documentation", "multi-model-ai-translation"]
  scope: "components, pages, utilities with user-facing strings"
---

# Docblock Backfill

Automatically maintains JSDoc/TSDoc documentation in files with user-facing strings.

## What This Skill Does

Scans source files (components, pages, utilities) for user-facing strings and ensures they have proper documentation:

1. **Validates existing docblocks** - Checks file-level JSDoc/TSDoc matches actual code
2. **Adds missing file headers** - Creates docblocks for undocumented files
3. **Syncs locale metadata** - Updates component metadata from `public/locales/en/*.json`
4. **Backfills metadata fields** - Adds missing `context`, `usage`, `impact` fields from locale data

Designed to work with the i18n translation workflow, ensuring component documentation stays synchronized with locale file metadata.

## When to Use

- **Post-translation sync** - After updating locale files with metadata (via `extract-code-documentation`)
- **Component documentation audit** - Find files missing docblocks
- **Metadata enrichment** - Backfill component-level metadata from locale files
- **Code review prep** - Ensure all user-facing components are documented
- **Onboarding assistance** - Generate documentation for undocumented legacy code
- **Consistency verification** - Validate docblocks match current code structure

## How It Works

### Phase 1: File Discovery

Scans workspace for files with user-facing strings:

```typescript
// Target file types
const patterns = [
  'src/components/**/*.{ts,tsx,js,jsx}',
  'pages/**/*.{ts,tsx,js,jsx}',
  'src/utils/**/*.{ts,tsx,js,jsx}'
];

// Excluded patterns
const exclude = [
  '**/*.test.*',
  '**/*.stories.*',
  '**/node_modules/**',
  '**/.next/**'
];
```

See [references/FILE_PATTERNS.md](./references/FILE_PATTERNS.md) for complete discovery rules.

### Phase 2: Docblock Validation

For each file found:

```typescript
// Extract existing docblock
const existingDoc = extractFileDocblock(filePath);

if (existingDoc) {
  // Validate matches current code
  const codeSignature = analyzeFileExports(filePath);
  const isValid = validateDocblock(existingDoc, codeSignature);
  
  if (!isValid) {
    // Mark for update
    issues.push({ file: filePath, type: 'outdated' });
  }
} else {
  // No docblock found
  issues.push({ file: filePath, type: 'missing' });
}
```

Validation checks:
- Component name matches export
- Props listed match TypeScript interface
- Return type matches function signature
- Dependencies listed match actual imports

See [references/VALIDATION_RULES.md](./references/VALIDATION_RULES.md) for complete criteria.

### Phase 3: Locale Metadata Sync

Cross-references with English locale files:

```typescript
// Load metadata from locale files
const localeMetadata = loadAllLocaleMetadata('public/locales/en');

// Find matching component metadata
const componentKey = getComponentLocaleKey(filePath);
const metadata = localeMetadata[componentKey];

if (metadata) {
  // Extract metadata fields
  const { context, usage, impact, component } = metadata;
  
  // Update or add to docblock
  docblock.metadata = {
    context,
    usage,
    impact,
    location: component.location,
    description: component.description
  };
}
```

Metadata structure from locale files:

```json
{
  "ChatSidebar": {
    "title": {
      "value": "AI Assistant",
      "context": "Chat panel heading shown to all users",
      "component": {
        "location": "src/components/ChatSidebar.js",
        "description": "Streaming chat interface with tool calling"
      },
      "usage": "Displayed in sidebar header",
      "impact": "high - primary navigation element"
    }
  }
}
```

See [references/LOCALE_METADATA_SPEC.md](./references/LOCALE_METADATA_SPEC.md) for complete format.

### Phase 4: Docblock Generation

Generates or updates JSDoc/TSDoc headers:

```typescript
/**
 * ChatSidebar - Streaming chat interface with tool calling
 * 
 * @description
 * Real-time AI chat component with message streaming, tool execution,
 * and context-aware responses. Integrates with Vercel AI SDK for
 * streaming chat completions and custom tool handlers.
 * 
 * @component
 * @example
 * ```tsx
 * <ChatSidebar
 *   messages={messages}
 *   onSendMessage={handleSend}
 *   systemContext={unitContext}
 * />
 * ```
 * 
 * @metadata
 * - context: Chat panel heading shown to all users
 * - usage: Displayed in sidebar header  
 * - impact: high - primary navigation element
 * - location: src/components/ChatSidebar.js
 * 
 * @see {@link public/locales/en/chat.json} for UI strings
 * @see {@link docs/CHATBOT_TOOLS.md} for tool calling reference
 */
export const ChatSidebar: React.FC<ChatSidebarProps> = ({ ... }) => {
  // ...
};
```

See [references/DOCBLOCK_TEMPLATES.md](./references/DOCBLOCK_TEMPLATES.md) for all template types.

## Quick Examples

### Example 1: Basic Component Backfill

**Input** - Component without docblock:

```typescript
// src/components/UnitCard.tsx
export const UnitCard: React.FC<UnitCardProps> = ({ unit }) => {
  return <Card>{unit.name}</Card>;
};
```

**Command**:

```bash
npx tsx scripts/backfill-docblocks.ts src/components/UnitCard.tsx
```

**Output**:

```typescript
/**
 * UnitCard - Learning unit card display component
 * 
 * @description
 * Displays unit information in card format with title, description,
 * and action buttons. Used in unit listing and assignment views.
 * 
 * @component
 * @param {UnitCardProps} props - Component properties
 * @param {Unit} props.unit - Unit data model
 * 
 * @metadata
 * - location: src/components/UnitCard.tsx
 * - usage: Unit listing grid, assignment selector
 * - impact: medium - core content display
 */
export const UnitCard: React.FC<UnitCardProps> = ({ unit }) => {
  return <Card>{unit.name}</Card>;
};
```

### Example 2: Sync Metadata from Locale Files

**Locale file** (`public/locales/en/editor.json`):

```json
{
  "toolbar": {
    "save": {
      "value": "Save",
      "context": "Editor save button - triggered after content edits",
      "component": {
        "location": "src/components/Editor3/EditorToolbar.tsx",
        "description": "Lexical editor toolbar with formatting controls"
      },
      "usage": "Primary save action, triggers DataStore update",
      "impact": "critical - data loss prevention"
    }
  }
}
```

**Command**:

```bash
npx tsx scripts/sync-metadata.ts src/components/Editor3/EditorToolbar.tsx
```

**Output** - Docblock updated with locale metadata:

```typescript
/**
 * EditorToolbar - Lexical editor toolbar with formatting controls
 * 
 * @metadata
 * - context: Editor save button - triggered after content edits
 * - usage: Primary save action, triggers DataStore update
 * - impact: critical - data loss prevention
 * - location: src/components/Editor3/EditorToolbar.tsx
 * 
 * @see {@link public/locales/en/editor.json} for UI strings
 */
```

### Example 3: Validate and Fix Outdated Docblocks

**Outdated docblock** (component changed but docs didn't):

```typescript
/**
 * @param {string} userId - User ID (OUTDATED - now uses session object)
 */
export const GradeViewer: React.FC<GradeViewerProps> = ({ session }) => {
  // ...
};
```

**Command**:

```bash
npx tsx scripts/validate-docblocks.ts --fix
```

**Output**:

```
⚠️  Found 1 outdated docblock:
  - src/components/GradeViewer.tsx
    Issue: Parameter 'userId' documented but not in function signature
    Fix: Updated to reflect current 'session' parameter

✅ Automatically updated outdated docblock
```

See [references/EXAMPLES.md](./references/EXAMPLES.md) for 10+ detailed scenarios.

## Input Parameters

### CLI Arguments

```bash
# Backfill specific file
npx tsx scripts/backfill-docblocks.ts <filepath>

# Backfill directory
npx tsx scripts/backfill-docblocks.ts src/components/

# Sync metadata from locale files
npx tsx scripts/sync-metadata.ts <filepath> [--locale-dir path/to/locales]

# Validate all docblocks
npx tsx scripts/validate-docblocks.ts [--fix] [--report]

# Dry run (don't write changes)
npx tsx scripts/backfill-docblocks.ts --dry-run
```

### Configuration File

Optional `.docblock-backfill.json`:

```json
{
  "include": [
    "src/components/**/*.{ts,tsx}",
    "pages/**/*.{ts,tsx}"
  ],
  "exclude": [
    "**/*.test.*",
    "**/*.stories.*"
  ],
  "localeDir": "public/locales/en",
  "templates": {
    "component": "jsdoc",
    "page": "tsdoc",
    "utility": "jsdoc"
  },
  "validation": {
    "requireFileDocblock": true,
    "requireMetadata": true,
    "validateParams": true
  }
}
```

See [references/CONFIGURATION.md](./references/CONFIGURATION.md) for all options.

## Output

### Report Format

```json
{
  "summary": {
    "totalFiles": 87,
    "filesWithDocblocks": 62,
    "filesWithoutDocblocks": 25,
    "outdatedDocblocks": 8,
    "metadataSynced": 15
  },
  "issues": [
    {
      "file": "src/components/UnitCard.tsx",
      "type": "missing",
      "severity": "warning",
      "action": "added-docblock"
    },
    {
      "file": "src/components/GradeViewer.tsx",
      "type": "outdated",
      "severity": "error",
      "details": "Parameter mismatch: documented 'userId' but signature has 'session'",
      "action": "updated-params"
    }
  ],
  "metadataSync": [
    {
      "file": "src/components/Editor3/EditorToolbar.tsx",
      "localeFile": "public/locales/en/editor.json",
      "fieldsAdded": ["context", "usage", "impact"]
    }
  ]
}
```

### Console Output

```
🔍 Scanning for files with user-facing strings...

📁 Found 87 files:
  - 62 with docblocks (71%)
  - 25 without docblocks (29%)
  - 8 outdated docblocks (9%)

📝 Backfilling missing docblocks...
  ✅ src/components/UnitCard.tsx
  ✅ src/components/AssignmentList.tsx
  ... (23 more)

🔄 Syncing metadata from locale files...
  ✅ src/components/Editor3/EditorToolbar.tsx (added 3 fields)
  ✅ src/components/ChatSidebar.js (updated context)
  ... (13 more)

🔧 Fixing outdated docblocks...
  ✅ src/components/GradeViewer.tsx (updated params)
  ... (7 more)

📊 Summary:
  - Added: 25 docblocks
  - Updated: 8 docblocks  
  - Metadata synced: 15 files
  - Duration: 3.2s

✅ Docblock backfill complete!
```

## Implementation

**Main Scripts** (in `scripts/` directory):

- [`backfill-docblocks.ts`](./scripts/backfill-docblocks.ts) - Add missing docblocks
- [`sync-metadata.ts`](./scripts/sync-metadata.ts) - Sync from locale files
- [`validate-docblocks.ts`](./scripts/validate-docblocks.ts) - Verify existing docs
- [`generate-docblock-report.ts`](./scripts/generate-docblock-report.ts) - Generate reports

**Workflow Integration**:

```bash
# Full workflow
npm run docblock-workflow

# Which runs:
# 1. Extract component metadata → locale files
npx tsx .github/skills/extract-code-documentation/scripts/extract-component-docblocks.ts

# 2. Add metadata structure to locale files  
npx tsx .github/skills/extract-code-documentation/scripts/add-metadata-all-namespaces.ts

# 3. Backfill docblocks from locale metadata
npx tsx .github/skills/docblock-backfill/scripts/backfill-docblocks.ts

# 4. Validate all docblocks
npx tsx .github/skills/docblock-backfill/scripts/validate-docblocks.ts --report
```

See [references/WORKFLOW_INTEGRATION.md](./references/WORKFLOW_INTEGRATION.md) for CI/CD setup.

## Use Cases

**Post-Translation Workflow**: After translators enrich locale files with metadata, backfill component docblocks

**Legacy Code Documentation**: Automatically generate baseline documentation for undocumented components

**Code Review Automation**: Pre-commit hook validates all changed files have proper docblocks

**Onboarding Material**: Generate up-to-date component documentation for new developers

**Consistency Enforcement**: Periodic audit ensures all user-facing components have standardized docs

## Best Practices

1. **Run validation before backfill** - Use `validate-docblocks.ts` to see what needs updating
2. **Sync after locale updates** - When translators add metadata, sync it back to code
3. **Use dry-run first** - Preview changes with `--dry-run` before committing
4. **Review generated docs** - AI-generated docblocks may need human refinement
5. **Integrate with CI/CD** - Fail builds if critical files lack docblocks
6. **Keep locale metadata accurate** - Docblock quality depends on locale file quality
7. **Update incrementally** - Backfill one directory at a time for easier review

## Validation Rules

File-level docblock required if file contains:

- React component exports (`export const Component: React.FC`)
- UI text strings (`t('key')`, `"User-facing text"`)
- Public API functions (exported utilities)

Validation failures:

- ❌ Missing file docblock
- ❌ Documented params don't match function signature
- ❌ Component name mismatch (JSDoc says `Foo` but export is `Bar`)
- ❌ Metadata fields present in locale but missing in docblock
- ❌ Outdated `@see` references (linked files don't exist)

See [references/VALIDATION_RULES.md](./references/VALIDATION_RULES.md) for complete list.

## Related Skills

- [extract-code-documentation](../extract-code-documentation/SKILL.md) - Complement skill: extracts docs → locale files
- [multi-model-ai-translation](../multi-model-ai-translation/SKILL.md) - Uses locale metadata for translation context
- [storybook-validation](../storybook-validation/SKILL.md) - Validates components have proper stories

## Reference Documentation

- [FILE_PATTERNS.md](./references/FILE_PATTERNS.md) - Discovery patterns and exclusions
- [VALIDATION_RULES.md](./references/VALIDATION_RULES.md) - Complete validation criteria
- [LOCALE_METADATA_SPEC.md](./references/LOCALE_METADATA_SPEC.md) - Metadata format from locale files
- [DOCBLOCK_TEMPLATES.md](./references/DOCBLOCK_TEMPLATES.md) - Templates for components, pages, utilities
- [CONFIGURATION.md](./references/CONFIGURATION.md) - Configuration file options
- [WORKFLOW_INTEGRATION.md](./references/WORKFLOW_INTEGRATION.md) - CI/CD and Git hooks
- [EXAMPLES.md](./references/EXAMPLES.md) - 10+ detailed usage examples

---

**Version**: 1.0.0 | **Status**: Production ready | **License**: MIT  
**Lines**: ~380

```
