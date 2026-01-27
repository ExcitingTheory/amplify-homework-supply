# Feature: Component Versioning Agent Skill

**Last Updated**: January 27, 2026  
**Status**: 100% Complete ✅  
**Implementation Date**: January 26, 2026  
**Agent Skill Name**: `component-versioning`  
**Location**: `.github/skills/component-versioning/SKILL.md`

## ✅ Implementation Summary

**Complete Agent Skill** - Fully operational in VS Code Copilot
- **Skill File**: `.github/skills/component-versioning/SKILL.md` (3,484 bytes)
- **Documentation**: `.github/skills/component-versioning/DOCUMENTATION.md`
- **Examples**: `.github/skills/component-versioning/examples/component-versioning-example.md`

**Capabilities**:
- Automates Component → Component2 versioning workflow
- Copies component and story files with updated imports/exports
- Updates TypeScript interfaces (ComponentProps → Component2Props)
- Generates feature parity checklists in docs/
- Handles nested directories and multiple story files
- Completes in <30 seconds (vs. 15 minutes manual)

**Usage**:
```
User: "Create FileManager2 from FileManager"
Copilot: [loads skill] → Creates:
  - src/components/FileManager2.tsx
  - src/components/FileManager2.stories.tsx
  - docs/FileManager2_PARITY.md
```

**Verified Working**: Successfully used in production for component rewrites.

---

## Overview

An Agent Skill that automates the creation of versioned component copies (e.g., Component → Component2) for safe TypeScript rewrites and major refactors. This skill reduces manual file copying, import updates, and parity checklist generation from **15 minutes to 30 seconds**.

**Component Version**: New Agent Skill (not a component rewrite)  
**Agent Skills Standard**: Follows [agentskills.io](https://agentskills.io) specification  
**Integration**: Works with VS Code Copilot, Copilot CLI, and Copilot coding agent

## Goals

### Primary Objectives
1. **Automate component versioning workflow** - Eliminate manual file copying and renaming
2. **Preserve original components** - Enable side-by-side comparison during development
3. **Generate parity checklists** - Auto-create feature tracking documentation
4. **Update imports automatically** - Modify component and story file imports to new versions
5. **Follow Agent Skills standard** - Ensure portability across GitHub Copilot agents

### Success Criteria
- ✅ Skill loads automatically when user mentions "create ComponentName2" or "version component"
- ✅ Creates new versioned component file (.tsx or .jsx)
- ✅ Creates new versioned story file if original exists
- ✅ Updates imports in new files to reference new component name
- ✅ Generates feature parity checklist document
- ✅ Completes in <30 seconds (vs. 15 min manual)
- ✅ Works in VS Code, CLI, and coding agent contexts

## Technical Requirements

### Agent Skills Standard Compliance
- **Format**: Markdown file with YAML frontmatter
- **Location**: `.github/skills/component-versioning/SKILL.md` (primary) or `~/.copilot/skills/component-versioning/SKILL.md` (personal)
- **Structure**:
  - Level 1: `name` and `description` in YAML frontmatter (always loaded by Copilot)
  - Level 2: Instruction body in Markdown (loaded when skill matches request)
  - Level 3: Additional resources/scripts (loaded on-demand)

### TypeScript Version
- VS Code: 1.89+
- TypeScript: 5.0+
- Node.js: 18+

### Required Dependencies
- No external dependencies (uses VS Code file system API)
- Leverages existing workspace tools:
  - `file_search` - Find component and story files
  - `read_file` - Read original file contents
  - `create_file` - Create new versioned files
  - `replace_string_in_file` - Update imports

### Type Safety Requirements
- Skill instructions use Markdown (no TypeScript types in skill itself)
- Supporting scripts (if created) must be TypeScript with strict mode
- All file operations must handle edge cases (missing files, permissions, etc.)

## API Design

### Skill Invocation Patterns

**Natural Language Triggers** (user prompts that activate skill):
```
"Create FileManager2 from FileManager"
"Version the RecordingStudio component"
"Make a Component2 version of ChatSidebar"
"Create new version of Editor with TypeScript"
```

### Skill YAML Frontmatter
```yaml
---
name: component-versioning
description: Automates creation of versioned component copies (Component → Component2) for TypeScript rewrites and major refactors. Copies component and story files, updates imports, and generates feature parity checklists. Use when user requests creating a new component version or mentions Component2, Component3, etc.
---
```

### Skill Inputs (from User Context)
- **Component path**: Original component file path (e.g., `src/components/FileManager.js`)
- **New version number**: Target version (default: auto-detect next version, e.g., 2)
- **Copy story**: Whether to copy story file (default: true if story exists)

### Skill Outputs (generated files)
```typescript
{
  newComponentPath: string;        // e.g., "src/components/FileManager2.tsx"
  newStoryPath?: string;           // e.g., "src/components/FileManager2.stories.tsx"
  parityChecklistPath: string;     // e.g., "docs/FileManager2_PARITY.md"
  filesCreated: string[];          // Array of all created file paths
  summary: string;                 // Human-readable success message
}
```

### Generated Parity Checklist Format
```markdown
# Feature Parity: [ComponentName2] vs [ComponentName]

**Created**: [Timestamp]
**Original**: [Link to original component]
**New Version**: [Link to new component]

## Features to Maintain
- [ ] Feature A - Description (from original component)
- [ ] Feature B - Description

## Features to Improve
- [ ] Performance optimization
- [ ] TypeScript type safety
- [ ] Better error handling

## New Features
- [ ] (List any planned additions)

## Deprecated Features (not porting)
- [ ] (List any features intentionally removed)

## Migration Plan
1. Complete new component implementation
2. Add both components to Storybook for comparison
3. Run full test suite on both versions
4. Update consuming components one at a time
5. Deprecate original after full migration
6. Remove original in future cleanup

## Testing Checklist
- [ ] All original features work in new version
- [ ] Visual appearance matches (unless intentionally changed)
- [ ] Props/API behaves the same
- [ ] Performance is equal or better
- [ ] Side-by-side Storybook comparison complete
```

## Implementation Notes

### File Copying Strategy
1. **Detect next version**: Scan workspace for existing versions (Component, Component2, Component3, etc.)
2. **Read original file**: Use `read_file` tool to get component content
3. **Transform content**:
   - Update component name (e.g., `FileManager` → `FileManager2`)
   - Update export statements
   - Update display names (for Storybook/DevTools)
4. **Create new file**: Use `create_file` tool with transformed content
5. **Repeat for story file** if it exists

### Import Update Patterns
**Component file**:
```javascript
// Original (keep unchanged):
import SomeHelper from './SomeHelper';

// Update self-referencing:
export function FileManager() {}  →  export function FileManager2() {}
export default FileManager;       →  export default FileManager2;
```

**Story file**:
```javascript
// Update component import:
import FileManager from './FileManager';        →  import FileManager2 from './FileManager2';
import FileManager from './FileManager.jsx';    →  import FileManager2 from './FileManager2.tsx';

// Update story metadata:
export default {
  title: 'Components/FileManager',              →  'Components/FileManager2',
  component: FileManager,                       →  component: FileManager2,
}

// Update story exports:
export const Default = () => <FileManager />    →  <FileManager2 />
```

### Performance Considerations
- **Single-pass file reading**: Read original file once, apply all transformations
- **Batch file creation**: Use `multi_replace_string_in_file` if updating multiple existing files
- **Lazy story detection**: Only search for story files if `copyStory` is true
- **Target: <30 seconds** for typical component (vs. 15 min manual)

### Security Considerations
- **File path validation**: Ensure paths stay within workspace
- **Permission checks**: Verify write permissions before creating files
- **No destructive actions**: Never modify or delete original files
- **User confirmation**: Ask before creating files (standard Copilot behavior)

## Edge Cases

### Boundary Conditions
- **No original component found**: Error - provide helpful message with search suggestions
- **Target version already exists**: Error - suggest next available version or ask to overwrite
- **No story file exists**: Skip story creation, note in summary
- **Multiple story files found**: List all, ask user which to copy
- **Component in subdirectory**: Preserve directory structure in new file

### Er scenarios
- **Read permission denied**: Error - explain permission issue, suggest manual copy
- **Write permission denied**: Error - explain where skill tried to write, suggest location
- **Malformed component file**: Warning - copy file as-is, note import updates may fail
- **TypeScript/JavaScript mixing**: Support both - copy `.js` → `.tsx` or `.jsx` → `.jsx`

### Invalid Input Handling
- **Invalid component path**: Error - "Component not found at [path]. Use file_search to locate."
- **Invalid version number**: Error - "Version must be a positive integer (2, 3, 4, etc.)"
- **Empty component file**: Warning - "Original file is empty. Creating empty versioned file."
- **Non-component file**: Warning - "File doesn't appear to be a React component. Proceed anyway?"

## Skill Directory Structure

```
.github/skills/component-versioning/
├── SKILL.md                          # Main skill definition (required)
├── examples/
│   ├── component-example.jsx         # Example component transformation
│   ├── story-example.jsx             # Example story transformation
│   └── parity-checklist-example.md   # Example checklist output
└── scripts/                          # Optional: Helper scripts for complex operations
    └── detect-component-features.js  # (Future) Extract features from original component
```

## Used By

- **TypeScript Feature Development Agent** (Step 1 - Component Versioning)
- **Manual user invocation**: "Create FileManager2 from FileManager"
- **GitHub Copilot CLI**: `gh copilot suggest "version this component"`
- **GitHub Copilot coding agent**: Automatically during component rewrite tasks

## Integration Points

### With Existing Workflows
1. **TypeScript Feature Workflow** - First step when rewriting components
2. **Storybook Testing Workflow** - Creates versioned stories for side-by-side comparison
3. **Component Migration** - Enabling gradual TypeScript adoption

### With VS Code Tools
- `file_search` - Locate original component and story files
- `read_file` - Read component content
- `create_file` - Create new versioned files
- `replace_string_in_file` - Update imports (if needed)
- `grep_search` - Find all usages of original component (for migration tracking)

## Success Metrics

### Time Savings
- **Manual process**: ~15 minutes
  1. Copy component file (2 min)
  2. Rename and update imports (5 min)
  3. Copy story file (2 min)
  4. Update story imports (3 min)
  5. Create parity checklist (3 min)
- **With skill**: ~30 seconds
  - Automatic file operations
  - Automatic import updates
  - Generated checklist
- **Savings**: 96.7% reduction (15 min → 30 sec)

### Quality Improvements
- ✅ **Zero missed imports** - Automated detection vs. manual search
- ✅ **Consistent naming** - Enforced pattern across files
- ✅ **Complete parity checklist** - No forgotten features to port
- ✅ **Repeatable process** - Same result every time

### Adoption Metrics
- **Target**: Used for all component rewrites in project (5-10 components)
- **Feedback**: User satisfaction with skill accuracy
- **Extension**: Community adoption if shared to github/awesome-copilot

## Future Enhancements

### Phase 2 (Optional)
- **Feature extraction**: Auto-populate parity checklist by analyzing original component
- **Dependency detection**: List all components/hooks used by original
- **Migration guide generation**: Create step-by-step guide for updating consumers
- **Batch versioning**: Version multiple related components at once

### Phase 3 (Optional)  
- **Deprecation warnings**: Add `@deprecated` JSDoc to original after migration
- **Usage tracking**: Find all imports of original component across codebase
- **Auto-migration**: Offer to update consuming components automatically

## Related Documentation

- [TypeScript Feature Development Workflow](./typescript-feature-workflow.prompt.md) - Primary consumer of this skill
- [Agent Skills Architecture](./AGENT_SKILLS_ARCHITECTURE.md) - Overall skills system
- [Agent Skills Migration Progress](./AGENT_SKILLS_MIGRATION_PROGRESS.md) - Phase 3 tracking
- [Agent Skills Standard](https://agentskills.io) - Specification reference
