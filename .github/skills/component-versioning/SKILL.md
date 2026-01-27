---
name: component-versioning
description: Automates creation of versioned component copies (Component → Component2) with updated imports, exports, and feature parity checklists
---

# Component Versioning Skill

Automatically create versioned copies of React components following the project's component versioning pattern. Saves 15 minutes of manual work per component (96.7% time reduction).

## When to Use

- Rewriting an existing component with TypeScript
- Creating major refactor with new version (Component2, Component3)
- Need to maintain original component while developing new version
- Want automatic import/export updates and feature parity tracking

## Usage

**Natural Language Invocation:**
```
"Create FileManager2 from FileManager"
"Version RecordingStudio component to RecordingStudio3"
"Make a new version of QuestionsReview as QuestionsReview2"
```

**Programmatic Invocation:**
```typescript
const result = await executeSkill('component-versioning', {
  componentPath: 'src/components/FileManager.js',
  targetVersion: 2 // Optional: auto-detects next version if omitted
});
```

## What It Does

1. **Copies Component File**
   - Creates `Component2.tsx` from `Component.jsx`
   - Preserves or upgrades file extension (.jsx → .tsx, .js → .ts)
   - Creates target directory if needed

2. **Updates Imports**
   - Finds all import statements in new file
   - Updates relative paths to include version suffix
   - Example: `import { utils } from './utils'` → `import { utils } from './utils'` (no change for non-component imports)
   - Example: `import Component from './Component'` → `import Component2 from './Component2'`

3. **Updates Exports**
   - Changes component name: `Component` → `Component2`
   - Updates `displayName` for React DevTools
   - Updates default and named exports

4. **Generates Feature Parity Checklist**
   - Extracts features from original component (props, methods, docblocks)
   - Creates markdown checklist in `docs/COMPONENT_VERSIONING_CHECKLIST_{ComponentName}.md`
   - Tracks features to maintain, improve, add, or deprecate

## Input Format

```typescript
interface ComponentVersioningInput {
  /** Absolute path to source component file */
  componentPath: string;
  
  /** Target version number (optional - auto-detects if omitted) */
  targetVersion?: number;
  
  /** Whether to also copy story file (default: true) */
  copyStory?: boolean;
  
  /** Custom output path (optional - uses same directory if omitted) */
  outputPath?: string;
}
```

## Output Format

```typescript
interface ComponentVersioningOutput {
  /** Path to newly created component file */
  newComponentPath: string;
  
  /** Path to newly created story file (if created) */
  newStoryPath?: string;
  
  /** Path to generated feature parity checklist */
  checklistPath: string;
  
  /** Version number of new component */
  version: number;
  
  /** Summary message */
  summary: string;
  
  /** Import statements that were updated */
  updatedImports: string[];
  
  /** Export statements that were updated */
  updatedExports: string[];
  
  /** Errors encountered (if any) */
  errors?: string[];
}
```

## Examples

### Example 1: Basic Component Versioning

**Input:**
```typescript
{
  componentPath: '/workspace/src/components/FileManager.js'
}
```

**Output:**
```typescript
{
  newComponentPath: '/workspace/src/components/FileManager2.tsx',
  newStoryPath: '/workspace/src/components/FileManager2.stories.tsx',
  checklistPath: '/workspace/docs/COMPONENT_VERSIONING_CHECKLIST_FileManager.md',
  version: 2,
  summary: '✅ Created FileManager2 from FileManager with 3 import updates and 2 export updates',
  updatedImports: [
    'import FileManager from \'./FileManager\' → import FileManager2 from \'./FileManager2\''
  ],
  updatedExports: [
    'export default FileManager → export default FileManager2',
    'FileManager.displayName = "FileManager" → FileManager2.displayName = "FileManager2"'
  ]
}
```

### Example 2: Explicit Version Number

**Input:**
```typescript
{
  componentPath: '/workspace/src/components/RecordingStudio2.jsx',
  targetVersion: 3
}
```

**Output:**
```typescript
{
  newComponentPath: '/workspace/src/components/RecordingStudio3.tsx',
  newStoryPath: '/workspace/src/components/RecordingStudio3.stories.tsx',
  checklistPath: '/workspace/docs/COMPONENT_VERSIONING_CHECKLIST_RecordingStudio.md',
  version: 3,
  summary: '✅ Created RecordingStudio3 from RecordingStudio2 with 5 import updates and 3 export updates',
  updatedImports: [...],
  updatedExports: [...]
}
```

### Example 3: No Story File Copying

**Input:**
```typescript
{
  componentPath: '/workspace/src/components/QuestionsReview.tsx',
  copyStory: false
}
```

**Output:**
```typescript
{
  newComponentPath: '/workspace/src/components/QuestionsReview2.tsx',
  checklistPath: '/workspace/docs/COMPONENT_VERSIONING_CHECKLIST_QuestionsReview.md',
  version: 2,
  summary: '✅ Created QuestionsReview2 from QuestionsReview with 2 import updates and 1 export update',
  updatedImports: [...],
  updatedExports: [...]
}
```

## Feature Parity Checklist Format

Generated checklist includes:

```markdown
# Component Versioning Checklist: FileManager → FileManager2

**Original Component:** src/components/FileManager.js  
**New Component:** src/components/FileManager2.tsx  
**Date Created:** 2026-01-26

## Features to Maintain

- [ ] File upload handling
- [ ] File list display with drag-and-drop reordering
- [ ] File deletion with confirmation
- [ ] File metadata editing (name, description)
- [ ] ParsedContent integration for PDFs

## Features to Improve

- [ ] TypeScript type safety for file objects
- [ ] Better error handling for upload failures
- [ ] Loading states during file operations

## New Features

- [ ] Add file preview thumbnails
- [ ] Add bulk file operations

## Deprecated Features

- [ ] Legacy DataStore direct subscriptions (use FilesContext instead)

## Migration Notes

- Original FileManager uses DataStore.observeQuery() directly
- New FileManager2 should use FilesContext for file management
- Verify all consuming components updated to import FileManager2
```

## Edge Cases & Error Handling

**File Not Found:**
```typescript
{
  errors: ['Component file not found: /workspace/src/components/NonExistent.js']
}
```

**Component Already Exists:**
```typescript
{
  errors: ['Target component already exists: /workspace/src/components/FileManager2.tsx']
}
```

**Invalid Version Number:**
```typescript
{
  errors: ['Invalid target version: 0. Must be >= 2']
}
```

**Not a React Component:**
```typescript
{
  errors: ['File does not appear to be a React component (no export found)']
}
```

## Implementation Notes

- Uses TypeScript AST parsing for accurate import/export detection
- Preserves code formatting and comments
- Handles both default and named exports
- Supports .js, .jsx, .ts, .tsx file extensions
- Auto-detects next version by scanning for existing Component2, Component3, etc.

## Related Skills

- [Mock Data Validator](../mock-data-validator/SKILL.md) - Validate Storybook mock data matches component props
- [Semantic File Search](../semantic-file-search/SKILL.md) - Find components by functionality description

## Time Savings

- Manual process: ~15 minutes (copy file, find/replace names, update imports, create checklist)
- Automated process: ~30 seconds
- **Savings: 96.7% reduction** (14.5 minutes per component)

---

**Version:** 1.0.0  
**Status:** Phase 1 MVP (Core functionality)  
**Next Phases:** Story file support (Phase 2), Advanced features (Phase 3), Testing & docs (Phase 4)
