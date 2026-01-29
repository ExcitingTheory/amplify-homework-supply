---
name: storybook-validation
description: Validates all Storybook stories for correct rendering, mock data structure alignment, and accessibility. Automatically catalogs stories, verifies mock data matches component props, checks imports and context providers, runs rendering tests, performs a11y audits, and generates validation reports. Use when testing Storybook, debugging story rendering issues, validating mock data, or before releasing features.
---

# Storybook Validation

Autonomous validation of all Storybook stories, mock data structures, and component rendering.

## What This Skill Does

This skill executes a 7-phase validation workflow:

1. **Inventory & Baseline** - Discovers all story files and variants
2. **Mock Data Validation** - Verifies mock data matches component TypeScript interfaces
3. **Mock Loading** - Checks import paths and context provider setup
4. **Rendering Validation** - Tests visual rendering, console errors, and accessibility
5. **Deep Dives** - Validates critical components (ChatSidebar, Editor3, etc.)
6. **Automated Testing** - Runs existing test suites
7. **Documentation** - Generates reports and optionally fixes issues

## When to Use This Skill

- After adding/modifying components or stories
- When stories aren't rendering correctly
- Before releasing new features
- As part of CI/CD validation
- Weekly/monthly quality checks
- When mock data structures change

## Execution Phases

### Phase 1: Inventory (2-5 minutes)

Discovers all `*.stories.*` files and counts variants:

```bash
# Finds stories in src/ and pages/
npx tsx .github/skills/storybook-validation/scripts/generate-story-inventory.ts
```

**Output**: `docs/STORYBOOK_INVENTORY.md` with story catalog

### Phase 2: Mock Data Validation (2-5 minutes)

Compares mock data to component prop types:

- Reads TypeScript interfaces from components
- Loads mock data from `.storybook/__mocks__/ui-data/`
- Validates structure alignment
- Uses Zod schemas if available

**Critical Validations**:
- ChatSidebar: `message.parts` array format (not legacy `content`)
- Editor3: Lexical state with `root.children` structure  
- FileManager2: ParsedContent status flow

### Phase 3: Mock Loading (1-3 minutes)

Verifies imports and setup:

```bash
# Find all mock imports
grep -r "from.*__mocks__" **/*.stories.*

# Verify files exist
find .storybook/__mocks__/ui-data -type f
```

Checks `.storybook/preview.js` for global decorators and context providers.

### Phase 4: Rendering Validation (5-10 minutes)

Tests actual story rendering:

1. Starts Storybook: `npm run storybook`
2. Runs `@storybook/test-runner` if installed
3. Collects console errors/warnings
4. Runs `@storybook/addon-a11y` checks
5. Optionally runs Chromatic for visual regression

Note: This phase requires a running Storybook instance and additional testing dependencies.

**Output**: Console error catalog, a11y violations

### Phase 5: Deep Dives (3-7 minutes)

Component-specific validation:

**ChatSidebar** (HIGH PRIORITY):
```typescript
// Verify message format
interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{
    type: 'text' | 'tool-*';
    text?: string;
  }>;
}
```

**Editor3** (HIGH PRIORITY):
- Validates Lexical JSON state structure
- Checks custom nodes (QuizNode, AnswerNode, etc.)

**FileManager2** (MEDIUM):
- Validates ParsedContent structure
- Checks status progression

### Phase 6: Testing (2-5 minutes)

Runs validation tests:

```bash
npx vitest run .github/skills/storybook-validation/test/validate-mocks.test.ts
```

### Phase 7: Documentation (1-2 minutes)

Generates artifacts:
- `docs/STORYBOOK_INVENTORY.md` - Story catalog with status
- `docs/STORYBOOK_TESTING_RESULTS.md` - Validation summary
- `docs/STORYBOOK_MOCK_DATA_GUIDE.md` - Best practices

Optionally applies auto-fixes for common issues.

## Usage Examples

### Validate All Stories

```typescript
// Full validation workflow
const result = await executeSkill('storybook-validation', {
  phases: [1, 2, 3, 4, 5, 6, 7],
  minSeverity: 'warning',
  visualRegression: true
});

console.log(result.summary);
// {
//   totalStories: 56,
//   passed: 45,
//   warnings: 8,
//   failed: 3,
//   notTested: 0
// }
```

### Focus on Specific Components

```typescript
const result = await executeSkill('storybook-validation', {
  components: ['ChatSidebar', 'Editor3'],
  phases: [1, 2, 5],
  minSeverity: 'error'
});
```

### Quick Check (Skip Deep Dives)

```typescript
const result = await executeSkill('storybook-validation', {
  phases: [1, 2, 3, 4, 6],
  visualRegression: false
});
```

## Expected Output

```typescript
{
  summary: {
    totalStories: 56,
    passed: 45,
    warnings: 8,
    failed: 3,
    notTested: 0
  },
  stories: [
    {
      path: 'src/components/ChatSidebar.stories.jsx',
      component: 'ChatSidebar',
      variants: 7,
      status: 'passed',
      issues: []
    }
    // ... more stories
  ],
  artifacts: {
    inventoryPath: 'docs/STORYBOOK_INVENTORY.md',
    resultsPath: 'docs/STORYBOOK_TESTING_RESULTS.md',
    mockGuidePath: 'docs/STORYBOOK_MOCK_DATA_GUIDE.md'
  },
  issues: [
    {
      phase: 2,
      severity: 'error',
      component: 'ChatSidebar',
      story: 'Default',
      message: 'Mock data uses legacy message.content instead of message.parts',
      fix: 'Update mock to use parts array format',
      location: { file: '.storybook/__mocks__/ui-data/chat-bot-2.json', line: 15 }
    }
  ],
  tests: {
    mockValidation: { passed: true, total: 12, passedCount: 12, failedCount: 0 },
    rendering: { passed: false, total: 56, passedCount: 53, failedCount: 3 },
    a11y: { passed: true, total: 56, passedCount: 56, failedCount: 0 }
  },
  timing: {
    1: 2500,  // 2.5 seconds
    2: 3200,
    3: 1800,
    4: 45000, // 45 seconds (Storybook startup)
    5: 8000,
    6: 12000,
    7: 1500
  }
}
```

## Common Issues and Fixes

### Issue: Stories Don't Render

**Symptom**: Blank screen, React errors in console

**Check**:
1. Mock data structure matches component props
2. All context providers present in story
3. Import paths resolve correctly

**Fix**: Update mock data or add missing providers

### Issue: Message Format Errors

**Symptom**: `Cannot read property 'text' of undefined` in ChatSidebar

**Root Cause**: Using legacy `message.content` instead of `message.parts`

**Fix**:
```typescript
// ❌ Legacy format
{ id: '1', role: 'user', content: 'Hello' }

// ✅ Correct format
{ 
  id: '1', 
  role: 'user', 
  parts: [{ type: 'text', text: 'Hello' }] 
}
```

### Issue: Context Provider Missing

**Symptom**: `useContext() returned undefined`

**Check**: Story wraps component with all required providers

**Fix**:
```typescript
export const Default = () => (
  <UnitContext.Provider value={mockUnitContext}>
    <SettingsContext.Provider value={mockSettings}>
      <Component />
    </SettingsContext.Provider>
  </UnitContext.Provider>
);
```

## Prerequisites

**Required**:
- Storybook installed: `npm run storybook` works
- TypeScript compilation: `npm run typecheck` passes
- Test framework: Vitest configured

**Optional**:
- `@storybook/test-runner` for automated rendering tests
- `@storybook/addon-a11y` for accessibility checks (already installed)
- Chromatic token for visual regression

## Performance

**Time Estimates** (56 stories):
- Phase 1 (Inventory): 2-5 minutes
- Phase 2 (Mock Validation): 2-5 minutes
- Phase 3 (Import Checks): 1-3 minutes
- Phase 4 (Rendering): 5-10 minutes
- Phase 5 (Deep Dives): 3-7 minutes
- Phase 6 (Tests): 2-5 minutes
- Phase 7 (Documentation): 1-2 minutes

**Total**: 15-30 minutes (vs 70 hours manual)

## Integration

### CI/CD

```yaml
# .github/workflows/storybook-validation.yml
- name: Generate story inventory
  run: npx tsx .github/skills/storybook-validation/scripts/generate-story-inventory.ts

- name: Validate mock data schemas
  run: npx vitest run .github/skills/storybook-validation/test/validate-mocks.test.ts

- name: Validate component prop types
  run: npx tsx .github/skills/storybook-validation/scripts/validate-component-mocks.ts || true
```

### Pre-commit Hook

```json
{
  "scripts": {
    "pre-commit": "npm run storybook:validate -- --phases 1,2,3"
  }
}
```

## Related Skills

- `semantic-file-search` - Find related components and mocks
- `typescript-migration` - Ensure type definitions exist
- `test-generation` - Create new test files

## Implementation

**Source Code**: `.github/skills/storybook-validation/storybook-validation.ts`
**Tests**: `.github/skills/storybook-validation/storybook-validation.test.ts`
**Scripts**: `.github/skills/storybook-validation/scripts/`
**Schemas**: `.github/skills/storybook-validation/schemas/`

## Success Criteria

- ✅ All story files discovered and cataloged
- ✅ Mock data validated against component props
- ✅ All stories render without critical errors
- ✅ No P0/P1 a11y violations from mock data
- ✅ Test suites pass
- ✅ Documentation generated

## Troubleshooting

**Skill not loading**: Check `chat.useAgentSkills` setting enabled in VS Code

**Import errors**: Verify `.storybook/__mocks__/` paths match imports

**Storybook won't start**: Check port 6006 is free, or update port in skill

**TypeScript errors**: Run `npm run typecheck` to validate before running skill
