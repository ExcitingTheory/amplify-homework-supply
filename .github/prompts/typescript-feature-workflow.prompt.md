---
description: Guide users through structured TypeScript feature development with comprehensive specification, testing, and iterative implementation
tags: [typescript, testing, feature-development, workflow]
---

# TypeScript Feature Development Workflow

Your goal is to guide the user through a structured TypeScript feature development process with comprehensive specification, testing, and iterative implementation.

## When to Use This Workflow

Activate this workflow when the user:
- Starts developing a new TypeScript feature
- Mentions "create a feature", "build a component", or "implement a new [feature]"
- Asks for help with TypeScript development workflow
- Needs guidance on feature specification or testing strategy
- Is rewriting an existing component with TypeScript

## Workflow Overview

This workflow consists of 7 iterative steps that ensure high-quality TypeScript feature development:

1. Create a feature specification document
2. Create a testing and validation guide
3. Break down the feature into development phases
4. Generate a TODO list for the selected phase
  4.1. Flatten the TODO list into individual tasks following Phase{Number}_Task{Number}_Subtask{Number} format, e.g., where subtasks are optional:
  4.2. Phase1_Task1_Subtask1, Phase1_Task1_Subtask2, Phase2_Task1, etc.
5. Implement code with TypeScript compilation validation
6. Add comprehensive unit tests
7. Repeat until feature parity is achieved

---

## ⚠️ MANDATORY ENFORCEMENT RULE ⚠️

**TypeScript Compilation Validation is REQUIRED after EVERY code change.**

You **MUST** run `tsc --noEmit --project tsconfig.json` using the `run_in_terminal` tool after implementing each TODO item. Do NOT proceed to the next task, step, or phase until TypeScript compilation completes with **zero errors** (exit code 0).

**Workflow Blocker**: If `tsc` returns errors:
1. STOP immediately
2. Display all errors to the user
3. Fix errors or ask user how to proceed
4. Re-run `tsc --noEmit --project tsconfig.json` after fixes in `run_in_terminal`
5. Only proceed there are no errors

This rule applies to:
- After writing implementation code
- After writing test code
- After refactoring
- Before moving to next TODO
- Before completing a phase

**No exceptions.** Type safety is the foundation of this workflow.

---

## Step 1: Feature Specification

### Component Versioning Strategy (For Rewrites/Major Refactors)

**IMPORTANT**: When rewriting an existing component or making major changes, create a new versioned component instead of modifying the original.

**Naming Convention**:
- First rewrite: `ComponentName2` (e.g., `FileManager2`, `QuestionsReview2`)
- Second rewrite: `ComponentName3` (e.g., `Editor3`, `RecordingStudio3`)
- Increment number for each major rewrite

**Benefits**:
1. **Feature Parity Validation** - Side-by-side comparison with original
2. **Safe Rollback** - Keep original working during development
3. **Gradual Migration** - Switch components incrementally
4. **Testing** - Test both versions simultaneously
5. **Documentation** - Clear version history

**Process**:
```bash
# 1. Create new versioned component in workspace
cp ${workspaceFolder}/src/components/Component.jsx ${workspaceFolder}/src/components/Component2.tsx

# 2. Create new story file
cp ${workspaceFolder}/src/components/Component.stories.jsx ${workspaceFolder}/src/components/Component2.stories.tsx

# 3. Update imports in new files
# Change: import Component from './Component'
# To: import Component2 from './Component2'

# 4. Keep original component unchanged until new version is validated
```

**Feature Spec Requirements for Rewrites**:
- [ ] Document all features from original component
- [ ] Identify features to keep vs. deprecate
- [ ] Define new features/improvements
- [ ] Create feature parity checklist
- [ ] Plan migration strategy (when to switch components)

**Feature Parity Checklist** (add to FEATURE_SPEC.md):
```markdown
## Feature Parity with [OriginalComponent]

### Features to Maintain
- [ ] Feature A - Description
- [ ] Feature B - Description
- [ ] Feature C - Description

### Features to Improve
- [ ] Feature D - What's being improved
- [ ] Feature E - What's being improved

### New Features
- [ ] Feature F - New capability
- [ ] Feature G - New capability

### Deprecated Features (not porting)
- [ ] Feature H - Why deprecated
- [ ] Feature I - Why deprecated

### Migration Plan
1. Complete new component implementation
2. Add both components to Storybook for comparison
3. Run full test suite on both versions
4. Update consuming components one at a time
5. Deprecate original after full migration
6. Remove original in future cleanup
```

**Testing Both Versions**:
```markdown
# Keep both story files active during development
 - Component.stories.jsx (original)
 - Component2.stories.tsx (new version)

# In Storybook, compare side-by-side:
 - Visual appearance
 - Functionality
 - Performance
 - Edge cases
```

**When to Use Versioning**:
- ✅ Complete TypeScript rewrite of JS component
- ✅ Major architectural changes (e.g., class → hooks)
- ✅ Significant API/props changes
- ✅ Different technology (e.g., different editor library)
- ❌ Minor bug fixes (just fix original)
- ❌ Small refactors (update in place)

### Feature Specification Document

When the user describes a feature, ask clarifying questions about:
- Feature purpose and goals
- Expected inputs and outputs
- Dependencies and integrations
- Performance requirements
- Edge cases and error handling
- **If rewrite**: All features from original component that must be maintained

Then create a detailed specification document ([FEATURE_SPEC.md](../../docs/FEATURE_SPEC.md)) that includes:

```markdown
# Feature: [Feature Name]

## Overview
Brief description of the feature

**Component Version**: [If rewrite: Component2, Component3, etc.]  
**Original Component**: [If rewrite: Link to original component file, e.g., [Component.jsx](${workspaceFolder}/src/components/Component.jsx)]  
**Rewrite Reason**: [If rewrite: Why creating new version vs. updating original]

## Goals
- Primary objectives
- Success criteria
- **[If rewrite]** Feature parity requirements with original

## Technical Requirements
- TypeScript version
- Required dependencies
- Type safety requirements

## API Design
- Function signatures
- Interface definitions
- Type definitions
- **[If rewrite]** Props comparison (original vs. new)

## Feature Parity
**[For rewrites only - see Component Versioning Strategy section above]**

### Features to Maintain
- List all features from original that must work identically

### Features to Improve  
- List features being enhanced with explanations

### New Features
- List net-new capabilities

### Deprecated Features
- List features intentionally not porting with rationale

## Implementation Notes
- Key algorithms or approaches
- Performance considerations
- Security considerations
- **[If rewrite]** Migration strategy for consuming components

## Edge Cases
- Boundary conditions
- Error scenarios
- Invalid input handling
```

## Step 2: Testing and Validation Guide

Create a comprehensive testing guide ([TESTING_GUIDE.md](../../docs/TESTING_GUIDE.md)) that includes:

```markdown
# Testing Guide: [Feature Name]

## Test Strategy
- Unit test coverage goals (aim for >80%)
- Integration test requirements
- Test framework (Jest/Vitest/etc.)

## Test Scenarios

### Happy Path Tests
- Normal operation scenarios
- Expected inputs

### Edge Case Tests
- Boundary conditions
- Null/undefined handling
- Empty inputs

### Error Handling Tests
- Invalid inputs
- Exception scenarios
- Type errors

## Validation Checklist
- [ ] All functions have tests
- [ ] Type safety validated
- [ ] Error cases covered
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] No linting errors
```

## Step 3: Phase Breakdown

Ask the user how they want to divide the work. Common approaches:
- By component or module
- By functionality (CRUD operations)
- By priority (MVP → enhancements)
- By complexity (simple → complex)

Create a phase breakdown document showing:
```markdown
# Development Phases

## Phase 1: [Name]
- Core types and interfaces
- Basic functionality
- Estimated effort: [time]

## Phase 2: [Name]
- Additional features
- Integration points
- Estimated effort: [time]

## Phase 3: [Name]
- Edge cases and error handling
- Performance optimizations
- Estimated effort: [time]
```

Ask: "Which phase would you like to start with?"

## Step 4: Generate Phase TODO List

For the selected phase, create a detailed TODO list:

```markdown

# TODO naming pattern: 

pattern: `Phase[N]-Task[1...x]-Subtask[1...x]`

- Phase1:Create-necessary-files-file1
- Phase1:Create-necessary-files-file2
- Phase1:Import-dependencies-dependency1
- Phase1:Import-dependencies-dependency2
- Phase1:Define-types-and-interfaces-TypeA
- Phase1:Define-types-and-interfaces-TypeB

## Implementation: Implement function A
  - [ ] Write code
  - [ ] **[MANDATORY]** Run `tsc --noEmit` and verify 0 errors before proceeding

## Implementation: Implement function B
  - [ ] Write code
  - [ ] **[MANDATORY]** Run `tsc --noEmit` and verify 0 errors before proceeding

## Implementation: Add error handling
  - [ ] Write code
  - [ ] **[MANDATORY]** Run `tsc --noEmit` and verify 0 errors before proceeding

## Implementation: Add input validation
  - [ ] Write code
  - [ ] **[MANDATORY]** Run `tsc --noEmit` and verify 0 errors before proceeding

## Testing: Write unit tests for function A
  - [ ] Write tests
  - [ ] **[MANDATORY]** Run `tsc --noEmit` on test files
  - [ ] Run tests and verify passing

## Testing: Write unit tests for function B
  - [ ] Write tests
  - [ ] **[MANDATORY]** Run `tsc --noEmit` on test files
  - [ ] Run tests and verify passing

## Testing: Test error scenarios
  - [ ] Write tests
  - [ ] **[MANDATORY]** Run `tsc --noEmit` on test files
  - [ ] Run tests and verify passing

## Final Validation
  - [ ] Run full `tsc --noEmit --project ${workspaceFolder}/tsconfig.json` for entire project
  - [ ] Check for project errors by finding all tsconfig.json files (excluding node_modules)
  - [ ] Run all tests
  - [ ] Check coverage
```

## Step 5: Implementation with Validation

**CRITICAL**: TypeScript compilation validation is **MANDATORY** after each implementation. DO NOT proceed to the next TODO item or step until compilation passes without errors.

For each TODO item, follow this exact sequence:

### 5.1: Write Implementation Code
- Implement the code for the current TODO item
- Save all files

### 5.2: **MANDATORY** TypeScript Compilation Check

**YOU MUST run TypeScript compilation after EVERY implementation before proceeding.**

Run with `run_in_terminal`:
```bash
tsc --noEmit --project ${workspaceFolder}/tsconfig.json --strict
```

For subfolder projects:
```bash
tsc --noEmit --project ${workspaceFolder}/subpath/tsconfig.json --strict
```

### 5.3: Handle Compilation Results

**If errors found** (exit code ≠ 0):
1. Use `get_errors` to retrieve detailed Problems panel issues
2. **STOP** - Do not proceed to next TODO
3. Show all TypeScript errors to user
4. Explain how to fix each error
5. Ask: "Should I fix these errors now, or would you like to handle them?"
6. After fixing, **re-run compilation** (return to 5.2)

**If no errors** (exit code = 0):
- Display: "✅ TypeScript compilation successful (0 errors)"
- Proceed to next TODO item or ask about next steps

## Step 6: Add Unit Tests

After each implementation, create corresponding unit tests:

```typescript
import { describe, it, expect } from 'vitest'; // or jest
import { functionName } from './module';

describe('functionName', () => {
  it('should handle normal input correctly', () => {
    const result = functionName(validInput);
    expect(result).toBe(expectedOutput);
  });

  it('should handle edge cases', () => {
    const result = functionName(edgeCase);
    expect(result).toBe(expectedEdgeCaseOutput);
  });

  it('should throw error for invalid input', () => {
    expect(() => functionName(invalidInput)).toThrow();
  });
});
```

**Run tests** with `run_in_terminal`:
```bash
npm test path/to/testfile.spec.ts
# or
npx vitest run path/to/testfile.spec.ts
```

**Check test failures**: Use `test_failure` to get detailed failure diagnostics

## Step 6.5: Storybook Validation (For Components with Stories)

**When to run**: After implementing components that have or need Storybook stories

**Goal**: Ensure stories correctly load mock data and render components

**Quick Check**:

1. **Find story files** with `file_search`: `src/**/*ComponentName*.stories.*`
2. **Start Storybook** with `run_in_terminal` (background): `npm run storybook`
3. **Open browser** with `open_simple_browser`: `http://localhost:6006`
4. **Check for errors** with `get_errors`

**Manual Checks**:
- Navigate to story and check:
  - Renders without errors
  - Mock data displays correctly
  - Console has no red errors

**Full Validation** (for major features or when issues found):

Follow the **[Storybook Testing Workflow](./storybook-testing-workflow.prompt.md)**:

1. **Inventory** - Catalog new/updated stories in [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md)
2. **Validate Mock Data** - Ensure mock structure matches component props
3. **Test Rendering** - Manual or automated visual validation
4. **Document Issues** - Add findings to [STORYBOOK_TESTING_RESULTS.md](../../docs/STORYBOOK_TESTING_RESULTS.md)
5. **Fix Issues** - Update mocks or stories as needed

**Build validation**:
```bash
npm run build-storybook
```

**Run story tests**:
```bash
npm run test -- story-rendering
```

**Critical Checks**:
- [ ] Story imports mock data correctly
- [ ] Mock data structure matches component props
- [ ] All required context providers wrapped around component
- [ ] No console errors (red) in browser
- [ ] Component renders expected content
- [ ] Interactive elements work (if applicable)

**Layout Validation with Box Model Overlay**:

For UI component layout verification, use browser DevTools box model overlay from tool call webbrowser:

**How to Enable** (Chrome/Edge):
1. Right-click element → Inspect → Hover over element in DOM tree
2. Or: Select element → Styles panel shows box model
3. Or: Console → `document.querySelector('selector')` → Hover

**Color Legend**:
- 🔵 Blue = Content (element dimensions)
- 🟢 Green = Padding
- 🟡 Yellow = Border  
- 🟤 Brown = Margin
- 🟣 Purple = Gap (flexbox/grid)

**Use Cases**:
- **Component Rewrites**: Compare layout between original and new version
- **Spacing Issues**: Identify unexpected margins/padding
- **Alignment Problems**: Verify flex/grid layouts
- **Responsive Design**: Check breakpoint behavior

**Best Practice**: When reporting layout issues, provide:
1. Screenshots with box model overlay enabled (shows exact spacing values)
2. Relevant DOM tree structure (shows actual element hierarchy)

**Providing DOM Tree Structure**:

To give full context for layout issues, include the rendered DOM:

**How to Get DOM Tree**:
1. Right-click element → Inspect → Elements panel shows tree
2. Right-click element in DevTools → Copy → Copy outerHTML
3. Or manually copy visible hierarchy with indentation

**Example DOM Tree** (include in code block):
```html
<div class="component-wrapper">
  <div class="component-header">
    <h2>Title</h2>
  </div>
  <div class="component-body">
    <!-- Content structure -->
  </div>
</div>
```

**When to Provide**:
- Comparing layout between Component and Component2
- Debugging spacing/alignment issues
- Showing how nesting affects layout
- Documenting actual vs. expected structure

**Documentation Updates**:
- [ ] Update [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md) with new stories
- [ ] Add mock data to [.storybook/__mocks__/ui-data/](../../.storybook/__mocks__/ui-data/) if needed
- [ ] Update story with proper context providers

**For comprehensive Storybook testing**, refer to [storybook-testing-workflow.prompt.md](./storybook-testing-workflow.prompt.md) for the full 7-phase validation process.

## Step 7: Iteration Until Parity

After completing a phase:

1. **Check against [FEATURE_SPEC.md](../../docs/FEATURE_SPEC.md)**: Review if requirements are met
2. **Check against [TESTING_GUIDE.md](../../docs/TESTING_GUIDE.md)**: Verify all test scenarios covered
3. **Run full validation** using tools:
   - TypeScript compilation: Use `run_in_terminal` with `tsc --noEmit --project ${workspaceFolder}/tsconfig.json`
   - Tests: Use `run_in_terminal` with `npm test`
   - Coverage: Use `run_in_terminal` with `npm test -- --coverage`
   - Review the feature spec and testing guide to identify any remaining TODOs, compare against current to-do list and add any missing items.

4. **Ask**: "This phase is complete. Would you like to:
   - Continue to the next phase?
   - Refactor/improve current code?
   - Add more tests?

## Between-Step Validation Checklist

**ENFORCEMENT RULE**: After completing ANY TODO item, you **MUST** run TypeScript compilation before proceeding. This is non-negotiable.

### Mandatory After Each TODO Item:

**1. TypeScript Compilation** (REQUIRED):
```bash
tsc --noEmit --project ${workspaceFolder}/tsconfig.json --strict
```
- **If exit code ≠ 0**: STOP and fix errors before proceeding
- **If exit code = 0**: Proceed with optional checks below

### Optional Additional Checks:

**2. Get Problems Panel**: Use `get_errors` to see all VS Code errors/warnings

**3. Run Tests**: `npm test path/to/file.test.ts`

**4. Code Review**: 
- Search TODOs: `grep_search` with pattern `TODO|FIXME`
- Check usage: `list_code_usages` for specific symbols

**5. Linting**: `npm run lint`

### Validation Workflow

```
1. Write code
   ↓
2. Save files
   ↓
3. ✅ MANDATORY: Run tsc --noEmit
   ↓
4. Exit code = 0? 
   → NO: Fix errors, goto step 2
   → YES: Continue
   ↓
5. Optional: Run additional checks
   ↓
6. Move to next TODO item
```

**Remember**: TypeScript compilation is the **minimum required validation**. All other checks are recommended but optional.

## Coding Standards

Follow these TypeScript best practices:
- Use strict mode (`"strict": true` in [tsconfig.json](../../tsconfig.json))
- Prefer interfaces for object shapes
- Use type inference where possible
- Avoid `any` types
- Use const assertions for literal types
- Document complex type definitions
- Use utility types (Partial, Pick, Omit, etc.)
- Implement proper error handling with typed errors

## Commands Reference

**All commands executed via `run_in_terminal`**:

```bash
# Type checking
tsc --noEmit --project ${workspaceFolder}/tsconfig.json

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint
```

## Final Validation

When all phases are complete, perform final validation using tools to examine the current state:

**Execute these checks systematically**:

1. **Find all TypeScript files**: `file_search` with `src/**/*.{ts,tsx}`
2. **Search for TODOs**: `grep_search` with pattern `TODO|FIXME`
3. **Get changed files**: `get_changed_files`
4. **Run full type check**: `tsc --noEmit --project ${workspaceFolder}/tsconfig.json`
5. **Run all tests**: `npm test`
6. **Check for errors**: `get_errors`
7. **Check coverage**: `npm test -- --coverage`

**Validation checklist**:
- [ ] All feature spec requirements met
- [ ] All TODOs completed
- [ ] All tests passing
- [ ] TypeScript compilation successful (no errors)
- [ ] Code coverage meets target
- [ ] [FEATURE_SPEC.md](../../docs/FEATURE_SPEC.md) requirements met
- [ ] [TESTING_GUIDE.md](../../docs/TESTING_GUIDE.md) scenarios covered
- [ ] Documentation updated
- [ ] Create change log entry, verify the change log is in sync with the new feature spec
- [ ] **[For component rewrites]** Feature parity validation:
  - [ ] All original features working in new version
  - [ ] Side-by-side comparison in Storybook complete
  - [ ] Performance metrics equal or better than original
  - [ ] Migration plan documented for consuming components
  - [ ] Original component marked as deprecated (if ready)
- [ ] **Storybook validation complete** (if feature includes UI components):
  - [ ] All component stories render correctly
  - [ ] Mock data structures validated
  - [ ] No console errors in Storybook
  - [ ] Story documentation updated
  - [ ] Run full [Storybook Testing Workflow](./storybook-testing-workflow.prompt.md) if needed
  - [ ] **[For rewrites]** Both original and new version stories present for comparison

**Storybook Final Check**:

**Build validation**:
```bash
npm run build-storybook
```

**Run story render tests**:
```bash
npm run test -- story-rendering
```

**Manual verification**:
1. Start Storybook (background): `npm run storybook`
2. Open browser: `open_simple_browser` → `http://localhost:6006`

3. Check all new/updated stories render correctly

**For component rewrites**:
- Compare original vs new version stories side-by-side
- Verify feature parity visually
- Test all interactions in both versions

**Feature Parity Validation (For Rewrites)**:

1. Start Storybook (if not running): `npm run storybook` (background)
2. Open browser: `http://localhost:6006`

3. Navigate to both component stories:
   - Original: Component.stories
   - New: Component2.stories

4. For each story variant, verify:

# 3. For each story variant, verify:
# - Visual appearance matches (unless intentionally changed)
# - All interactions work identically
# - Props/API behaves the same
# - Performance is equal or better
# 
# Layout Comparison Tips:
# - Enable box model overlay (right-click → Inspect → hover element)
# - Compare spacing: Blue (content), Green (padding), Brown (margin), Purple (gaps)
# - Take screenshots with overlay to document any layout differences
# - Copy DOM tree structure: Right-click → Inspect → Copy outerHTML
# - Compare DOM hierarchy between original and new version
# - Verify responsive behavior at multiple breakpoints

# 4. Document any intentional differences in [FEATURE_SPEC.md](../../docs/FEATURE_SPEC.md)
```

Ask: "Would you like me to generate a final summary report of the completed feature?"

**[For Component Rewrites]**: Also ask: "Should I create a migration guide for components consuming the original version?"
---

## Step 8: Documentation Accuracy Verification (MANDATORY)

**CRITICAL**: Before marking any feature as complete, verify documentation claims against actual code.

### Documentation Lifecycle Rules

#### 1. Document Naming Conventions (REQUIRED)

Use these suffixes based on document purpose:

| Suffix | Purpose | When Created | When Updated |
|--------|---------|--------------|--------------|
| `*_PLAN.md` | Roadmap/specification | Start of feature | Rarely (only if scope changes) |
| `*_STATUS.md` | Living status tracker | Start of feature | After every phase/milestone |
| `*_GUIDE.md` | How-to reference | End of feature | When patterns change |
| `*_QUICK_REFERENCE.md` | Cheat sheet | End of feature | When API changes |

**NEVER use `*_COMPLETE.md`** - Instead, update `*_STATUS.md` with completion markers.

#### 2. Status Document Structure (REQUIRED)

Every feature must have ONE canonical `*_STATUS.md` with this structure:

```markdown
# [Feature Name] Status

**Last Updated**: YYYY-MM-DD  
**Overall Status**: 🟢 Complete | 🟡 In Progress | 🔴 Not Started  
**Verified**: [Link to verification command output or test results]

## Implementation Status

### ✅ Implemented (Working in Production)
- [x] Feature A - [Verified](path/to/actual/file.ts) [Tests](path/to/test.ts)
  - Verification: `grep -l "FeatureA" src/**/*.ts` shows usage
  - Tests: `npm test -- feature-a.test.ts` passes
- [x] Feature B - [Verified](path/to/actual/file.ts) [Tests](path/to/test.ts)

### ⚠️ In Progress (Partially Working)
- [ ] Feature C - 60% complete
  - ✅ Backend implementation done
  - ❌ Frontend integration pending
  - Verification: Backend works but no UI

### ❌ Not Started (Planned)
- [ ] Feature D - Deferred to Phase 2
  - Reason: Depends on Feature C completion

## Testing Status
- Unit Tests: X/Y passing ([Results](link))
- Integration Tests: X/Y passing ([Results](link))
- E2E Tests: X/Y passing ([Results](link))

## Verification Commands

\```bash
# Verify implementation exists
grep -r "FeaturePattern" src/ --include="*.ts"

# Verify tests pass
npm test -- feature.test.ts

# Verify TypeScript compiles
tsc --noEmit --project tsconfig.json
\```

## Related Documentation
- [Planning Doc](FEATURE_PLAN.md)
- [User Guide](FEATURE_GUIDE.md)
- [API Reference](API.md#feature-section)
```

#### 3. Verification Requirements (MANDATORY)

Before marking ANY item as ✅ Implemented:

1. **File Existence**: Link to actual file path
   ```bash
   ls -la path/to/claimed/file.ts
   ```

2. **Usage Verification**: Show it's actually used
   ```bash
   grep -r "import.*FeatureName" src/ --include="*.{ts,tsx}"
   ```

3. **Test Verification**: Show tests pass
   ```bash
   npm test -- path/to/feature.test.ts
   ```

4. **Type Safety**: Show TypeScript compiles
   ```bash
   tsc --noEmit --project tsconfig.json
   ```

**Rule**: If you can't verify with a command, don't mark it complete.

#### 4. Documentation Update Workflow

**After completing each phase**:

1. **Update Status Doc**:
   ```bash
   # Edit docs/FEATURE_STATUS.md
   # Move completed items from "In Progress" to "Implemented"
   # Add verification links and test results
   # Update "Last Updated" timestamp
   ```

2. **Verify All Claims**:
   ```bash
   # For each ✅ Implemented item, run verification command
   # Update doc with actual command output
   # Link to files and test results
   ```

3. **Delete Obsolete Docs** (after merging content):
   ```bash
   # Delete redundant docs after content is merged
   # Git history preserves deleted files: git show HEAD~1:docs/FILE.md
   rm docs/OLD_DOC.md
   ```

**After feature 100% complete**:

1. **Create Guide**: `docs/FEATURE_GUIDE.md` with usage examples
2. **Create Quick Ref**: `docs/FEATURE_QUICK_REFERENCE.md` with common patterns
3. **Update Main Tracking**: Add to `docs/README.md` or feature index
4. **Delete Planning Docs**: Remove `*_PLAN.md` after merging (git history preserves)

#### 5. Common Anti-Patterns (AVOID)

❌ **Don't**:
- Create multiple status docs for same feature
- Use "COMPLETE" in filename before 100% done
- Claim completion without verification links
- Leave outdated docs in main docs folder (delete after merging)
- Create "Phase X Complete" docs (update status doc instead)

✅ **Do**:
- ONE status doc per feature (single source of truth)
- Link to actual code files as proof
- Show test results, not just claims
- Delete redundant docs after merging (git preserves history)
- Use status markers (✅ ⚠️ ❌) consistently

#### 6. Enforcement Checklist

Before proceeding to next phase or marking feature complete:

- [ ] Status doc updated with current state
- [ ] All ✅ items have verification links
- [ ] All claimed files exist and contain expected code
- [ ] All claimed tests pass
- [ ] TypeScript compiles with no errors
- [ ] Obsolete docs deleted after merging content
- [ ] Main tracking doc updated

**Automated Check** (add to pre-commit hook):
```bash
# Verify all linked files in STATUS docs exist
grep -h '\[.*\](.*\.ts)' docs/*_STATUS.md | \
  sed 's/.*(\(.*\))/\1/' | \
  xargs -I {} test -f {} || echo "ERROR: Broken link in STATUS doc"
```

---