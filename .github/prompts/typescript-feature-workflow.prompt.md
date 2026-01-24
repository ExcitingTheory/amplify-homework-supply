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
5. Implement code with TypeScript compilation validation
6. Add comprehensive unit tests
7. Repeat until feature parity is achieved

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
```bash
# Keep both story files active during development
# - Component.stories.jsx (original)
# - Component2.stories.tsx (new version)

# In Storybook, compare side-by-side:
# - Visual appearance
# - Functionality
# - Performance
# - Edge cases
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
# TODO: Phase [N] - [Phase Name]

## Setup
- [ ] Create necessary files
- [ ] Import dependencies
- [ ] Define types and interfaces

## Implementation
- [ ] Implement function A
- [ ] Implement function B
- [ ] Add error handling
- [ ] Add input validation

## Testing
- [ ] Write unit tests for function A
- [ ] Write unit tests for function B
- [ ] Test error scenarios

## Validation
- [ ] Run tsc for type checking
- [ ] Run tests
- [ ] Check coverage
```

## Step 5: Implementation with Validation

For each TODO item:

1. **Write the implementation code**
2. **Offer to validate**: "Would you like me to run `tsc` to validate compilation?"
3. **If yes, run**: `tsc --noEmit` to check for TypeScript errors
4. **If errors found**: Show errors and offer to fix them
5. **If no errors**: "✓ TypeScript compilation successful. Ready for the next step."

Example validation command:
```bash
tsc --noEmit --project ${workspaceFolder}/tsconfig.json --strict
```

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

Offer to run tests: "Would you like me to run the test suite?"

## Step 6.5: Storybook Validation (For Components with Stories)

**When to run**: After implementing components that have or need Storybook stories

**Goal**: Ensure stories correctly load mock data and render components

**Quick Check**:
```bash
# Does component have stories?
find src -name "*ComponentName*.stories.*"

# If yes, validate them
npm run storybook
# Navigate to story and check:
# - Renders without errors
# - Mock data displays correctly
# - Console has no red errors
```

**Full Validation** (for major features or when issues found):

Follow the **[Storybook Testing Workflow](./storybook-testing-workflow.prompt.md)**:

1. **Inventory** - Catalog new/updated stories in [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md)
2. **Validate Mock Data** - Ensure mock structure matches component props
3. **Test Rendering** - Manual or automated visual validation
4. **Document Issues** - Add findings to [STORYBOOK_TESTING_RESULTS.md](../../docs/STORYBOOK_TESTING_RESULTS.md)
5. **Fix Issues** - Update mocks or stories as needed

**Commands**:
```bash
# Start Storybook
npm run storybook

# Build to validate all stories
npm run build-storybook

# Run story render tests (if created)
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

For UI component layout verification, use browser DevTools box model overlay:

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
3. **Run full validation**:
   - TypeScript compilation: `tsc --noEmit --project ${workspaceFolder}/tsconfig.json`
   - Tests: `npm test` or equivalent
   - Coverage: Check if coverage goals met

4. **Ask**: "This phase is complete. Would you like to:
   - Continue to the next phase?
   - Refactor/improve current code?
   - Add more tests?
   - Review the feature spec?"

## Between-Step Validation Checklist

Before moving to the next TODO item, always offer to:
- [ ] Run TypeScript compiler (`tsc --noEmit --project ${workspaceFolder}/tsconfig.json`)
- [ ] Run current tests
- [ ] Review code for type safety
- [ ] Check for any linting issues

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

```bash
# Type checking a TypeScript project
tsc --noEmit --project ${workspaceFolder}/tsconfig.json

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint
```

## Final Validation

When all phases are complete, perform final validation, without relying on previous results but examining the current state of the codebase:
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
```bash
# Validate all stories build successfully
npm run build-storybook

# Run story render tests
npm run test -- story-rendering

# Manual verification
npm run storybook
# Check all new/updated stories render correctly

# For component rewrites:
# - Compare original vs new version stories side-by-side
# - Verify feature parity visually
# - Test all interactions in both versions
```

**Feature Parity Validation (For Rewrites)**:
```bash
# 1. Open Storybook with both versions
npm run storybook

# 2. Navigate to both component stories
# - Original: Component.stories
# - New: Component2.stories

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
