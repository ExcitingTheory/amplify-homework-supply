---
name: extract-code-documentation
description: Extracts JSDoc/TSDoc docblocks from source code, maps components to descriptions, and enriches data with metadata from code annotations
---

# Extract Code Documentation

Automated extraction and enrichment of code documentation from JSDoc/TSDoc comments in TypeScript/JavaScript files.

## What This Skill Does

Scans source code files for structured documentation comments (`/** ... */`) and extracts:
- Component descriptions from `@fileoverview` tags
- Module names from `@module` tags  
- Usage examples from `@example` tags
- Maps component file paths to their documentation
- Provides fuzzy lookup by component name or path

**Core Capabilities:**
1. **Parse Docblocks** - Extract JSDoc/TSDoc comments from file headers
2. **Component Mapping** - Create bidirectional map: filepath ↔ description
3. **Flexible Lookup** - Find documentation by exact path, component name, or partial match
4. **Metadata Enrichment** - Combine code documentation with other data sources (i18n locale files, prop types, etc.)

## When to Use This Skill

Use this skill when you need to:
- **Generate documentation** from existing code comments
- **Enrich translation metadata** with component functionality descriptions
- **Validate documentation coverage** across the codebase
- **Sync code comments** with external documentation systems
- **Extract component descriptions** for user-facing docs or tooling
- **Audit undocumented components** to identify missing `@fileoverview` tags

**Specific Triggers:**
- User says "Extract component documentation" or "Parse JSDoc comments"
- I18n translation workflow needs component descriptions for context
- Generating component catalogs or API documentation
- Validating that all components have required docblock headers

## How to Use This Skill

### Input Schema

```typescript
interface ExtractDocumentationInput {
  /** Glob pattern for files to scan (default: "src/**/*.{ts,tsx,js,jsx}") */
  filePattern?: string;
  
  /** Patterns to ignore (default: tests, stories, node_modules) */
  ignorePatterns?: string[];
  
  /** Require @fileoverview tag (default: false - will extract first paragraph if missing) */
  requireFileoverview?: boolean;
  
  /** Component reference to look up (optional - if provided, only finds this one) */
  componentRef?: string;
  
  /** Output format (default: "json") */
  outputFormat?: 'json' | 'markdown' | 'map';
}
```

### Output Schema

```typescript
interface ComponentDocblock {
  /** Normalized file path (e.g., "src/components/Authenticator.js") */
  filePath: string;
  
  /** Extracted description from @fileoverview or first paragraph */
  description: string;
  
  /** Module name from @module tag (optional) */
  module?: string;
  
  /** Code example from @example tag (optional) */
  example?: string;
}

interface ExtractDocumentationOutput {
  /** Map of component key → docblock data */
  docblocks: Record<string, ComponentDocblock>;
  
  /** Total components scanned */
  totalScanned: number;
  
  /** Components with valid docblocks */
  totalDocumented: number;
  
  /** Components missing docblocks */
  missingDocumentation: string[];
  
  /** Human-readable summary */
  summary: string;
  
  /** Errors encountered (optional) */
  errors?: string[];
}
```

### Usage Examples

#### 1. Extract All Component Documentation

```typescript
const result = await executeSkill('extract-code-documentation', {
  filePattern: 'src/**/*.{ts,tsx}',
  outputFormat: 'json'
});

console.log(result.summary);
// "Extracted 247 docblocks from 312 components (65 missing documentation)"

// Access specific component
const authDoc = result.docblocks['Authenticator'];
console.log(authDoc.description);
// "Authentication form component that handles AWS Cognito sign in/sign up flows..."
```

#### 2. Find Specific Component Documentation

```typescript
const result = await executeSkill('extract-code-documentation', {
  componentRef: 'ChatSidebar'
});

const chatDoc = result.docblocks['ChatSidebar'];
console.log(chatDoc);
// {
//   filePath: "src/components/ChatSidebar.js",
//   description: "AI chat interface with streaming responses and tool execution visualization",
//   module: "ChatSidebar"
// }
```

#### 3. Audit Documentation Coverage

```typescript
const result = await executeSkill('extract-code-documentation', {
  requireFileoverview: true,
  outputFormat: 'markdown'
});

console.log(result.missingDocumentation);
// ["src/components/legacy/OldForm.js", "src/utils/deprecated.ts", ...]

// Generate report
fs.writeFileSync('DOCUMENTATION_AUDIT.md', result.summary);
```

#### 4. Enrich I18n Translation Metadata

```typescript
// Extract all component docs
const docs = await executeSkill('extract-code-documentation', {});

// Load English locale file
const locale = JSON.parse(fs.readFileSync('public/locales/en/auth.json', 'utf-8'));

// Enrich with component functionality
for (const [key, value] of Object.entries(locale)) {
  if (value.component?.location) {
    const docblock = docs.docblocks[value.component.location];
    if (docblock) {
      value.component.functionality = docblock.description;
    }
  }
}

// Save enriched locale
fs.writeFileSync('public/locales/en/auth.json', JSON.stringify(locale, null, 2));
```

## Docblock Format Requirements

### Required Format

```typescript
/**
 * @fileoverview ComponentName - Brief one-line summary
 * 
 * Detailed multi-line description explaining:
 * - What the component does
 * - When users see it
 * - What interactions it supports
 * - Key functionality and purpose
 * 
 * @module ComponentName
 * @example
 * <Authenticator onSignIn={handleSignIn} />
 */
```

### Minimal Valid Format

```typescript
/**
 * Brief description of the component.
 * Can be multiple sentences explaining functionality.
 */
```

### Extraction Rules

1. **@fileoverview takes precedence** - If present, extracts this tag's content
2. **Fallback to first paragraph** - If no `@fileoverview`, uses content before first `@` tag
3. **Line cleanup** - Removes leading `*`, extra whitespace, and normalizes to single paragraph
4. **Module detection** - Extracts `@module ComponentName` if present
5. **Example extraction** - Captures `@example` block content if present

### Invalid Formats (Will Not Extract)

```typescript
// ❌ Single-line comment (not JSDoc)

/* ❌ Multi-line comment without ** */

/**
 * ❌ Only @tags with no description
 * @module Foo
 * @author Bar
 */
```

## Implementation

### Supporting Script

**[extract-component-docblocks.ts](./extract-component-docblocks.ts)**

Core extraction utilities:
- `extractAllDocblocks()` - Scans all files, returns Map<string, ComponentDocblock>
- `findDocblock(componentRef, docblocks)` - Flexible lookup by name/path
- `parseDocblock(content, filePath)` - Parses JSDoc comment from file content

**CLI Usage:**
```bash
npx tsx .github/skills/extract-code-documentation/extract-component-docblocks.ts
# Outputs: "Extracted 247 docblocks" + sample of first 10
```

**Programmatic Usage:**
```typescript
import { extractAllDocblocks, findDocblock } from './extract-component-docblocks';

const docblocks = await extractAllDocblocks();
const auth = findDocblock('Authenticator', docblocks);
console.log(auth.description);
```

### Default Configuration

```typescript
{
  filePattern: 'src/**/*.{ts,tsx,js,jsx}',
  ignorePatterns: [
    '**/*.test.*',
    '**/*.spec.*', 
    '**/*.stories.*',
    '**/node_modules/**'
  ],
  requireFileoverview: false,
  outputFormat: 'json'
}
```

## Output Formats

### JSON (Default)

```json
{
  "docblocks": {
    "Authenticator": {
      "filePath": "src/components/Authenticator.js",
      "description": "Authentication form component that handles AWS Cognito sign in/sign up flows...",
      "module": "Authenticator"
    },
    "ChatSidebar": {
      "filePath": "src/components/ChatSidebar.js",
      "description": "AI chat interface with streaming responses and tool execution...",
      "module": "ChatSidebar"
    }
  },
  "totalScanned": 312,
  "totalDocumented": 247,
  "missingDocumentation": ["src/utils/legacy.ts", "src/components/OldForm.js"],
  "summary": "Extracted 247 docblocks from 312 components (65 missing documentation)"
}
```

### Markdown

```markdown
# Component Documentation Audit

**Total Components Scanned:** 312  
**Components with Documentation:** 247  
**Missing Documentation:** 65

## Documented Components

### Authenticator
**Path:** src/components/Authenticator.js  
**Module:** Authenticator  
**Description:** Authentication form component that handles AWS Cognito sign in/sign up flows...

### ChatSidebar
**Path:** src/components/ChatSidebar.js  
**Module:** ChatSidebar  
**Description:** AI chat interface with streaming responses and tool execution...

## Missing Documentation

- src/utils/legacy.ts
- src/components/OldForm.js
- src/components/deprecated/Form.tsx
```

### Map (Programmatic)

Returns JavaScript `Map<string, ComponentDocblock>` for efficient lookups in code.

## Integration Patterns

### I18n Translation Metadata Enrichment

Used by [multi-model-ai-translation](./../multi-model-ai-translation/SKILL.md) skill to populate `component.functionality` field:

```typescript
// Step 1: Extract all docblocks
const docs = await executeSkill('extract-code-documentation', {});

// Step 2: Load locale file
const locale = require('./public/locales/en/auth.json');

// Step 3: Enrich with component descriptions
for (const [key, value] of Object.entries(locale)) {
  const componentPath = value.component?.location;
  if (componentPath) {
    const docblock = docs.docblocks[componentPath] || 
                     findDocblock(componentPath, docs.docblocks);
    if (docblock) {
      value.component.functionality = docblock.description;
    }
  }
}

// Step 4: Save enriched metadata
fs.writeFileSync('./public/locales/en/auth.json', JSON.stringify(locale, null, 2));
```

### Documentation Generation

```typescript
// Generate component catalog
const docs = await executeSkill('extract-code-documentation', {
  outputFormat: 'markdown'
});

fs.writeFileSync('COMPONENT_CATALOG.md', docs.summary);
```

### CI/CD Documentation Validation

```yaml
# .github/workflows/documentation.yml
- name: Validate Component Documentation
  run: |
    npx tsx .github/skills/extract-code-documentation/extract-component-docblocks.ts > audit.txt
    MISSING_COUNT=$(grep -c "missing documentation" audit.txt || true)
    if [ "$MISSING_COUNT" -gt 0 ]; then
      echo "::warning::$MISSING_COUNT components missing documentation"
    fi
```

## Error Handling

**File Read Errors:**
- Logs warning with file path
- Continues processing other files
- Includes in errors array in output

**Parse Failures:**
- Skips malformed docblocks
- Logs warning to console
- Tracks in missingDocumentation array

**No Docblocks Found:**
- Returns empty docblocks map
- Sets totalDocumented = 0
- Lists all scanned files in missingDocumentation

**Partial Results:**
- Always returns all successfully extracted docblocks
- Never aborts on individual file failures
- Summary includes error count

## Performance Characteristics

**Speed:**
- Scans 1000 files in ~2-3 seconds
- Regex parsing is fast (no AST traversal)
- File I/O is the bottleneck

**Memory:**
- Loads one file at a time (streaming)
- Stores only extracted metadata (not full file contents)
- Map structure allows garbage collection of large file buffers

**Scalability:**
- Linear O(n) with number of files
- No dependencies between files (parallelizable future enhancement)
- Tested with 300+ component files

## Common Use Cases

1. **Translation Metadata Preparation** (Primary)
   - Enrich i18n JSON files with component context
   - Provide translators with functional descriptions
   - Ensure translations match component purpose

2. **Documentation Generation**
   - Extract all component descriptions for Storybook
   - Generate API docs from code comments
   - Create component catalogs for design systems

3. **Quality Audits**
   - Identify components without documentation
   - Enforce docblock standards in CI/CD
   - Track documentation coverage over time

4. **Code-to-Docs Sync**
   - Keep external docs in sync with code comments
   - Update README files with extracted descriptions
   - Generate changelogs from @fileoverview changes

5. **Developer Onboarding**
   - Create searchable component index
   - Map component names to purposes
   - Provide quick reference for codebase navigation

## Comparison to Other Tools

| Feature | This Skill | TypeDoc | JSDoc CLI | TSDoc |
|---------|-----------|---------|-----------|-------|
| **Extracts @fileoverview** | ✅ Yes | ❌ No (needs full AST) | ✅ Yes | ✅ Yes |
| **Fuzzy component lookup** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **JSON output for tooling** | ✅ Yes | ⚠️ Complex | ⚠️ HTML only | ⚠️ Complex |
| **Fast (no AST parsing)** | ✅ Yes | ❌ Slow | ❌ Slow | ⚠️ Medium |
| **Lightweight (no dependencies)** | ✅ Yes | ❌ Many deps | ❌ Many deps | ⚠️ Few deps |
| **I18n metadata enrichment** | ✅ Yes | ❌ No | ❌ No | ❌ No |

**Why Not Use Existing Tools?**
- TypeDoc: Overkill for simple docblock extraction, requires full build
- JSDoc CLI: Generates HTML, not structured data for tooling
- TSDoc: Designed for API docs, not metadata enrichment
- This skill: Purpose-built for translation workflow + lightweight + fast

## Related Skills

- **[multi-model-ai-translation](./../multi-model-ai-translation/SKILL.md)** - Consumes extracted docblocks for translation context
- **component-versioning** - Could use docblocks to track version descriptions
- **storybook-validation** - Could validate component descriptions match stories

## Contributing

To enhance this skill:
1. Add support for additional JSDoc tags (@param, @returns, @deprecated)
2. Implement AST-based parsing for more complex extraction
3. Add caching layer to avoid re-scanning unchanged files
4. Create TypeScript type generator from docblocks
5. Add integration with PropTypes/TypeScript interfaces

## Support

For issues or questions:
- Check [extract-component-docblocks.ts](./extract-component-docblocks.ts) implementation
- See usage in [i18n-translation-workflow.prompt.md](../../prompts/i18n-translation-workflow.prompt.md)
- Review JSDoc specification: https://jsdoc.app/tags-fileoverview
