---
description: Guide users through systematic Storybook testing to ensure stories correctly load mock data and render components
tags: [storybook, testing, mock-data, validation, components]
---

# Storybook Testing & Validation Workflow

Your goal is to guide the user through a structured Storybook testing process that ensures all stories correctly load mock data and render components as expected.

## Quick Start: Automated vs Manual

This workflow can be executed in two ways:

### 🤖 **Automated** (Recommended) - Agent Skill
Use the [Storybook Validation Agent Skill](../skills/storybook-validation/SKILL.md):
```typescript
const result = await executeSkill('storybook-validation', {
  phases: [1, 2, 3, 4, 5, 6, 7],
  minSeverity: 'warning',
  visualRegression: true
});
```
- ✅ **Autonomous execution** of all 7 phases
- ✅ **70 hours → 5 hours** (manual → automated)
- ✅ **Structured output** with artifacts and reports
- ✅ **See**: [Agent Skills Documentation](../../docs/AGENT_SKILLS.md)

### 📋 **Manual** (Detailed Control)
Follow the step-by-step guide below for fine-grained control and learning.

---

## When to Use This Workflow

Activate this workflow when the user:
- Mentions "storybook testing", "validate stories", or "check storybook"
- Reports stories not rendering or displaying incorrectly
- Needs to validate mock data structures
- Asks about Storybook validation or testing procedures
- Completes feature development and needs to validate Storybook integration
- References `storybook-testing-workflow.prompt.md` from TypeScript Feature Workflow

## Workflow Overview

This workflow consists of 7 iterative phases that ensure high-quality Storybook component presentation:

1. **Inventory & Baseline** - Catalog stories, mocks, and current render status
2. **Mock Data Structure Validation** - Verify mock data matches component expectations
3. **Mock Data Loading Verification** - Ensure imports and global setup work correctly
4. **Component Rendering Validation** - Visual testing, console errors, accessibility
5. **Component Deep Dives** - Focus on critical/complex components
6. **Automated Testing Setup** - Create validation test suites
7. **Documentation & Fixes** - Repair issues and document patterns

**Assumption**: Components are functionally correct; issues are in the story/mock presentation layer.

---

## Agent Skill Implementation Status

The following phases can be automated using the [Storybook Validation Agent Skill](../skills/storybook-validation/SKILL.md):

| Phase | Automation Status | Manual Time | Automated Time | Notes |
|-------|------------------|-------------|----------------|-------|
| 1. Inventory | 🟢 Ready | 4-6 hours | 2-5 min | File search + export parsing |
| 2. Mock Validation | 🟡 Scaffold | 6-8 hours | 2-5 min | Zod schemas needed |
| 3. Mock Loading | 🟡 Scaffold | 4-6 hours | 1-3 min | Import path validation |
| 4. Rendering | 🟡 Scaffold | 6-8 hours | 5-10 min | Requires Storybook startup |
| 5. Deep Dives | 🟡 Scaffold | 8-10 hours | 3-7 min | Component-specific checks |
| 6. Testing | 🟢 Ready | 6-8 hours | 2-5 min | Run existing test suites |
| 7. Documentation | 🟡 Scaffold | 4-6 hours | 1-2 min | File generation |

**Legend**: 🟢 Fully implemented | 🟡 Scaffold exists, needs tool integration | 🔴 Not started

**See**:
- Implementation: [.github/skills/storybook-validation/storybook-validation.ts](../skills/storybook-validation/storybook-validation.ts)
- Tests: [.github/skills/storybook-validation/storybook-validation.test.ts](../skills/storybook-validation/storybook-validation.test.ts)
- Usage Guide: [docs/AGENT_SKILLS.md](../../docs/AGENT_SKILLS.md)

---

## Phase 1: Inventory & Baseline (4-6 hours)

### Step 1.1: Map All Stories

**Goal**: Create complete list of existing stories and their dependencies

**Actions**:

1. Find all story files: `file_search` with pattern `src/**/*.stories.{tsx,jsx,ts,js}`
2. Find story exports: `grep_search` for `^export (const|default)` in `**/*.stories.*`

**Create**: [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md) with table:
```markdown
| # | Component | File Path | Variants | Status | Notes |
|---|-----------|-----------|----------|--------|-------|
| 1 | ChatSidebar | src/components/ChatSidebar.stories.jsx | 7 | 🔍 | Not tested |
```

**Status Legend**:
- ✅ Renders correctly
- ⚠️ Renders with warnings
- ❌ Fails to render
- 🔍 Not yet tested

### Step 1.2: Inventory Mock Data Files

**Goal**: Catalog all mock data files and their structure

**Actions**:

1. Find mock data files: `file_search` with `.storybook/__mocks__/ui-data/**/*`
2. Find TypeScript types: `file_search` with `.storybook/__mocks__/**/*.{ts,d.ts}`
3. List mock modules: `list_dir` on `.storybook/__mocks__/`

**Add to [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md)**: Mock data table with:
- Mock file name
- Data structure (interface/type)
- Used by which stories
- Last updated date

### Step 1.3: Check Story Render Status

**Goal**: Identify which stories currently render vs fail

**Actions**:

1. Start Storybook (background): `npm run storybook`
2. Open browser: `http://localhost:6006`

3. Create testing checklist: [STORYBOOK_TESTING_CHECKLIST.md](../../docs/STORYBOOK_TESTING_CHECKLIST.md)

4. Open browser console (Cmd+Option+J on macOS)

5. Navigate through each story systematically

6. Document errors in console/UI

**Testing Process** for each story:
- [ ] Visual Check: Does it render something?
- [ ] Console Check: Any red errors?
- [ ] Console Check: Any yellow warnings?
- [ ] Interaction Check: Do controls/buttons work?
- [ ] Mark status in [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md)

**Create**: [STORYBOOK_TESTING_RESULTS.md](../../docs/STORYBOOK_TESTING_RESULTS.md) with summary:
```markdown
## Executive Summary
- ✅ Passed: XX story files (~XX%)
- ⚠️ Warnings: XX story files (~XX%)
- ❌ Failed: XX story files (~XX%)
- 🔍 Not Tested: XX story files (~XX%)
```

**Deliverable**: Complete inventory with render status for all stories

---

## Phase 2: Mock Data Structure Validation (6-8 hours)

### Step 2.1: Compare Mock Data to Component Props

**Goal**: Verify mock data structure matches component expectations

**For Each Failed/Warning Story**:

1. **Read component file** to find prop types:
   ```typescript
   interface ComponentProps {
     messages: Message[];
     onSend: (text: string) => void;
   }
   ```

2. **Read mock data file**:
   ```javascript
   export const mockMessages = [
     { id: '1', role: 'user', content: 'Hello' }
   ];
   ```

3. **Compare structures**:
   - Do field names match?
   - Are types correct (string vs number)?
   - Are nested structures aligned?
   - Do array structures match?

4. **Document mismatches** in [STORYBOOK_TESTING_RESULTS.md](../../docs/STORYBOOK_TESTING_RESULTS.md):
   - 🔴 Critical: Missing required fields
   - 🟡 Warning: Type mismatch
   - 🟢 OK: Structures match

**Validation Script** (optional):
```typescript
// scripts/validate-mock-data.ts
import { describe, it, expect } from 'vitest';

describe('Mock Data Structure Validation', () => {
  it('should match component prop types', () => {
    // Compare mock to expected interface

  });
});
```

### Step 2.2: Extract Actual Runtime Data

**Goal**: Compare mock data to real data from running app

**CRITICAL**: Before modifying components, check git history:

1. Use `get_changed_files` to see modifications
2. Use `grep_search` to find patterns in `src/**/*`
3. Check git history:
```bash
# View component history
git log --oneline -- ${file}

# View working version from commit
git show <commit>:${file}
```

**Capture Real Data** (in running app):
```javascript
// Add to component temporarily
useEffect(() => {
  console.log('ACTUAL DATA STRUCTURE:', JSON.stringify(data, null, 2));
}, [data]);
```

**Save snapshot**: Copy console output to [REAL_DATA_SNAPSHOT.json](../../.storybook/__mocks__/ui-data/REAL_DATA_SNAPSHOT.json)

**Compare**: Create diff between mock and real data structures

**Deliverable**: Diff report showing structural differences

### Step 2.3: Validate Mock Data in Story Contexts

**Goal**: Ensure stories wrap components with correct context providers that supply necessary data but mocked any external API calls. Other methods are defined in more detail at [Storybook Mocking Modules Documentation](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules). 

**Check Each Story File**:
```typescript
// Example validation
export const Default = () => (
  <AuthContext.Provider value={mockAuth}>       {/* ✓ Present */}
    <UnitContext.Provider value={mockUnit}>     {/* ✓ Present */}
      <SettingsContext.Provider value={...}>    {/* ❌ Missing? */}
        <Component />
      </SettingsContext.Provider>
    </UnitContext.Provider>
  </AuthContext.Provider>
);
```

**Checklist per Story**:
- [ ] All `useContext()` calls have corresponding providers
- [ ] Provider values match expected structure
- [ ] Provider values include all required fields
- [ ] Nested contexts in correct order

**Deliverable**: List of stories with missing/incorrect context setup

---

## Phase 3: Mock Data Loading Verification (4-6 hours)

### Step 3.1: Check Import Paths

**Goal**: Verify all mock imports resolve correctly

**Actions**:

1. Find mock imports: `grep_search` for `from.*__mocks__` in `**/*.stories.*`
2. Verify mock files exist: `file_search` with `.storybook/__mocks__/ui-data/**/*.{json,js}`

**Common Issues**:
- Relative path errors: `../../__mocks__` vs `.storybook/__mocks__`
- Missing exports: `import { mockData }` when file exports `default mockData`
- Case sensitivity: `chatMessages.js` vs `ChatMessages.js`

**Deliverable**: List of import errors with fixes

### Step 3.2: Validate Mock Setup Files

**Goal**: Ensure `.storybook/preview.js` and decorators work correctly

**Check**:

1. Read preview file: `.storybook/preview.js` or `.storybook/preview.tsx`
2. Verify global decorators are applied

3. Check if context providers wrap all stories

4. Validate mock modules are imported

**Test in Browser Console**:
```javascript
// Check global mocks
console.log('UnitContext:', window.__UNIT_CONTEXT__);
console.log('AuthContext:', window.__AUTH_CONTEXT__);
```

**Deliverable**: Validation of global mock setup

### Step 3.3: Test Data Reactivity

**Goal**: Verify stories respond to mock data changes

**For Interactive Stories**:
```typescript
export const Interactive = () => {
  const [messages, setMessages] = useState(mockMessages);
  
  const addMessage = (text: string) => {
    setMessages([...messages, { id: Date.now(), role: 'user', content: text }]);
  };
  
  return <ChatSidebar messages={messages} onSend={addMessage} />;
};
```

**Test Cases**:
- Click button → State updates → Component re-renders
- Form submit → Data changes → UI reflects change
- Context update → Consuming component updates

**Deliverable**: List of stories with broken reactivity

---

## Phase 4: Component Rendering Validation (6-8 hours)

### Step 4.1: Visual Validation

**Goal**: Ensure components render as expected visually

**Manual Testing Process**:

1. Start Storybook (background): `npm run storybook`
2. Open browser: `http://localhost:6006`

3. Navigate through each story

4. Document expected vs actual rendering

5. Take screenshots of broken stories

6. Flag unexpected renderings

**Layout Debugging with Box Model Overlay** (Chrome/Edge DevTools):

For layout issues, spacing problems, or visual inconsistencies, enable the box model overlay:

1. **Enable Overlay**: Right-click element → Inspect → Elements tab → Hover over element in DOM tree
2. **Or**: Select element in Elements tab → Styles panel shows box model diagram
3. **Or**: Console → `document.querySelector('selector')` → Hover in console output

**Box Model Color Legend**:
- 🔵 **Blue** = Content (actual element size)
- 🟢 **Green** = Padding (space inside element)
- 🟡 **Yellow** = Border (element border)
- 🟤 **Brown/Tan** = Margin (space outside element)
- 🟣 **Purple** = Gap (flexbox/grid gaps)

**When to Use**:
- Comparing original vs. rewritten component layouts
- Debugging unexpected spacing or alignment
- Verifying responsive design breakpoints
- Identifying margin collapse issues
- Checking padding/margin consistency

**Pro Tips**:
- Take screenshots WITH overlay enabled to document layout issues
- Compare overlays between original and new component versions
- Use persistent overlay: Elements → Computed → Scroll to box model → Click segments
- Check multiple viewport sizes for responsive layouts

**Provide DOM Tree for Context**:

When reporting layout issues or requesting help, include the relevant portion of the DOM tree:

1. **Get DOM Tree**: Right-click element → Inspect → Elements panel shows tree structure
2. **Copy Snippet**: Right-click element in Elements panel → Copy → Copy outerHTML
3. **Or Copy Tree**: Select element → Expand relevant children → Manually format hierarchy
4. **Include in Report**: Paste in code block with language hint

Example:
```html
<div class="chat-container">
  <div class="chat-messages">
    <div class="message user-message">
      <span class="message-text">Hello</span>
    </div>
    <div class="message assistant-message">
      <span class="message-text">Hi there!</span>
    </div>
  </div>
  <div class="chat-input">
    <!-- Input controls -->
  </div>
</div>
```

**When to Provide DOM Tree**:
- Debugging unexpected layout/spacing issues
- Comparing original vs. rewritten component structure
- Reporting rendering bugs with specific element context
- Showing how component actually renders vs. expected structure

**What to Include**:
- Relevant parent containers (2-3 levels up)
- The problematic element and its siblings
- Child elements if layout issue involves nested content
- Keep it focused - don't include entire page DOM

**Optional - Automated Visual Testing**:

**Option A: Chromatic** (package installed, needs token):
```bash
# Add to package.json scripts:
# "chromatic": "chromatic --project-token=<your-token>"

npm run chromatic
```

**Option B: Vitest + Playwright** (already available):
```typescript
// test/storybook/visual-snapshots.test.ts
import { test, expect } from '@playwright/test';

test('ChatSidebar renders correctly', async ({ page }) => {
  await page.goto('http://localhost:6007/?path=/story/chatsidebar--default');
  await expect(page).toHaveScreenshot();
});
```

**Deliverable**: Screenshot gallery with status annotations

### Step 4.2: Console Error Scanning

**Goal**: Identify runtime errors and warnings in stories

**Check workspace issues** with `get_errors` (Problems panel)

**Manual Process**:
1. Open each story
2. Check browser console for:
   - ❌ Errors (red) - Critical
   - ⚠️ Warnings (yellow) - Review needed
   - 🔵 Info/logs (blue) - Should be minimal
3. Document error messages

**Common Issues to Look For**:
- `Cannot read property 'X' of undefined` → Missing mock data
- `useContext() returned undefined` → Missing provider
- `Invalid prop type` → Mock data type mismatch
- `key` prop warnings → Array data missing IDs

**Deliverable**: Error catalog with root causes in [STORYBOOK_TESTING_RESULTS.md](../../docs/STORYBOOK_TESTING_RESULTS.md)

### Step 4.3: Accessibility Audits

**Goal**: Ensure mocked data doesn't break a11y

**Setup** (if not already installed):
```bash
npm install --save-dev @storybook/addon-a11y
```

**Check**:
1. Enable a11y addon panel in Storybook
2. Review violations for each story
3. Identify if violations are from:
   - Component code (not our focus)
   - Mock data (our focus - e.g., missing alt text)
   - Story setup (e.g., missing labels)

**Deliverable**: A11y issues specific to mock data

---

## Phase 5: Component Deep Dives (8-10 hours)

### Priority Components

For each critical component, perform deep validation:

#### 5.1: ChatSidebar Validation (HIGH PRIORITY)

**CRITICAL - Message Format**:
```typescript
// Correct format (from @ai-sdk/react useChat hook)
interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{
    type: 'text' | 'tool-*';
    text?: string;
    toolCallId?: string;
    input?: object;
    output?: object;
  }>;
}

// Extract text from parts array
const text = message.parts
  .filter(p => p.type === 'text')
  .map(p => p.text)
  .join('');
```

**Validation Steps**:

1. Read component: `src/components/ChatSidebar.js`
2. Find mock data files: `.storybook/__mocks__/ui-data/chat-bot-*.json`
3. Verify message structure uses `parts` array
4. Check for changes with `get_changed_files`
5. Compare to working version:
   ```bash
   git log --oneline -- ${workspaceFolder}/src/components/ChatSidebar.js
   git show HEAD:${workspaceFolder}/src/components/ChatSidebar.js
   ```

6. Update mocks to match actual data structure

**Files to Check**:
- [ChatSidebar.js](../../src/components/ChatSidebar.js)
- [ChatSidebar.stories.jsx](../../src/components/ChatSidebar.stories.jsx)
- Mock files: [.storybook/__mocks__/ui-data/](../../.storybook/__mocks__/ui-data/) (chat-bot-2.*.json)

#### 5.2: Editor3 Validation (HIGH PRIORITY)

**Lexical State Structure**:
```typescript
// Lexical editor state in Unit.data field
interface EditorState {
  root: {
    children: Array<{
      type: 'paragraph' | 'heading' | 'quiz' | 'answer';
      children: Array<{ text: string }>;
      // ... other node properties
    }>;
  };
}
```

**Validation Steps**:
1. Read [Editor3](../../src/components/Editor3/) and [Workbook](../../src/components/Editor3/Workbook.jsx) components
2. Check how Lexical state is initialized
3. Find or create mock Lexical state JSON
4. Verify custom nodes: QuizNode, AnswerNode, MeaningAssociationNode
5. Update story files with proper initial state

**Files to Check**:
- [Editor.stories.jsx](../../src/components/Editor3/Editor.stories.jsx)
- [Workbook.stories.jsx](../../src/components/Editor3/Workbook.stories.jsx)
- Create: Mock data in [.storybook/__mocks__/ui-data/](../../.storybook/__mocks__/ui-data/) (lexical-state-*.json)

#### 5.3: FileManager2 Validation (MEDIUM PRIORITY)

**ParsedContent Structure**:
```typescript
interface ParsedContent {
  id: string;
  fileID: string;
  text: string;
  vocabulary: Word[];
  status: 'uploaded' | 'extracting' | 'analyzing' | 'completed';
}
```

**Validation Steps**:
1. Read [FileManager2](../../src/components/FileManager2/) component
2. Check parsedContent data expectations
3. Compare to mock data in [.storybook/__mocks__/ui-data/](../../.storybook/__mocks__/ui-data/) (file-details.json)
4. Update mock structure if needed

#### 5.4: API Mock Response Validation

**Issue**: `Cannot destructure property 'body'` errors

**Expected Structure** (for Edge Runtime API responses):
```typescript
// pages/api/chat.js expects StreamingTextResponse
interface ChatResponse {
  body: ReadableStream;
  headers: Headers;
}
```

**Validation Steps**:
1. Check error in AI completion plugins
2. Find API mock in [.storybook/__mocks__/](../../.storybook/__mocks__/) (chat-api.js or similar)
3. Update response to match expected structure
4. Test AI completion stories

**Files to Check**:
- [.storybook/__mocks__/](../../.storybook/__mocks__/) (chat-api.js)
- [AIContentCompletionPlugin.js](../../src/components/Editor3/plugins/AIContentCompletionPlugin.js)
- [BlockSuggestionPluginAI.stories.jsx](../../src/components/Editor3/plugins/BlockSuggestionPluginAI.stories.jsx)

---

## Phase 6: Automated Testing Setup (6-8 hours)

### Step 6.1: Create Mock Data Validation Tests

**Goal**: Automated checks for mock data structure

**Setup**:
```typescript
// test/storybook/validate-mocks.test.ts
import { describe, it, expect } from 'vitest';
import { mockMessages } from '${workspaceFolder}/.storybook/__mocks__/ui-data/chatMessages';

describe('Mock Data Structure Validation', () => {
  describe('Chat Messages', () => {
    it('should have parts array format', () => {
      expect(mockMessages[0]).toHaveProperty('parts');
      expect(Array.isArray(mockMessages[0].parts)).toBe(true);
    });

    it('should have text parts with correct structure', () => {
      const textParts = mockMessages[0].parts.filter(p => p.type === 'text');
      expect(textParts.length).toBeGreaterThan(0);
      expect(textParts[0]).toHaveProperty('text');
    });
  });

  // Add tests for each mock data file
});
```

**Run tests**:
```bash
npm run test -- validate-mocks
```

### Step 6.2: Story Render Tests

**Goal**: Automated rendering checks using existing tools

**Using Vitest + Storybook Integration**:
```typescript
// test/storybook/story-rendering.test.ts
import { describe, it, expect } from 'vitest';
import { composeStories } from '@storybook/react';
import * as ChatSidebarStories from '../../src/components/ChatSidebar.stories';

describe('Story Rendering Tests', () => {
  const { Default, WithMessages } = composeStories(ChatSidebarStories);

  it('should render ChatSidebar Default story', () => {
    const { container } = render(<Default />);
    expect(container.firstChild).toBeTruthy();
  });
});
```

**Run tests**:
```bash
npm run test
# or for watch mode
npm run test:watch
```

### Step 6.3: CI/CD Integration (Optional)

**Goal**: Run story validation on PRs

**GitHub Actions** (example):
```yaml
# .github/workflows/storybook-tests.yml
name: Storybook Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build-storybook
      - run: npm run test -- validate-mocks
```

---

## Phase 7: Documentation & Fixes (4-6 hours)

### Step 7.1: Create Mock Data Guide

**Goal**: Document correct patterns for creating story mocks

**Create**: [STORYBOOK_MOCK_DATA_GUIDE.md](../../docs/STORYBOOK_MOCK_DATA_GUIDE.md)

**Content**:
```markdown
# Storybook Mock Data Guide

## Extracting Mock Data from Runtime

1. Find component in running app
2. Open browser console
3. Log the data: `console.log(JSON.stringify(data, null, 2))`
4. Save to `.storybook/__mocks__/ui-data/[name].json`

## Mock Structure Rules

- **Always match runtime structure** - Don't invent/assume fields
- **Use actual data when possible** - Copy from working components
- **Check git history** - `git show HEAD:${file}`
- **Verify mock data format in [.storybook/__mocks__/ui-data/](../../.storybook/__mocks__/ui-data/)** - Source of truth
- **Include all required fields** - Check component prop types
- **Preserve type information** - String vs Number matters

## Common Patterns

### Message Format (AI SDK)
\`\`\`typescript
// Correct: parts array format
{
  id: '1',
  role: 'user',
  parts: [
    { type: 'text', text: 'Hello' }
  ]
}
\`\`\`

### Lexical Editor State
\`\`\`typescript
{
  root: {
    children: [
      {
        type: 'paragraph',
        children: [{ text: 'Content here' }]
      }
    ]
  }
}
\`\`\`

### Context Provider Values
\`\`\`typescript
export const mockUnitContext = {
  currentUnit: { id: '1', name: 'Test Unit', data: '{}' },
  session: { username: 'testuser' },
  saveEditorContent: () => Promise.resolve(),
  // ... all required fields
};
\`\`\`
```

### Step 7.2: Fix Identified Issues

**Goal**: Repair broken stories based on validation findings

**Priority Order**:
1. 🔴 P0 - Critical: Stories that don't render at all
2. 🟡 P1 - High: Stories with console errors/warnings
3. 🟢 P2 - Medium: Stories with minor issues

**For Each Fix**:
1. Read component to understand expectations
2. Read current mock data
3. Compare structures
4. Update mock data or story setup
5. Test in Storybook
6. Update [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md) status
7. **Run validation**:
```bash
npm run typecheck && npm run test
```

### Step 7.3: Update Documentation

**Update Files**:
- [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md) - Mark all as ✅ or ⚠️
- [STORYBOOK_TESTING_RESULTS.md](../../docs/STORYBOOK_TESTING_RESULTS.md) - Add "Fixed" section
- Create [STORYBOOK_MOCK_DATA_GUIDE.md](../../docs/STORYBOOK_MOCK_DATA_GUIDE.md) - Best practices
- Update [.storybook/README.md](../../.storybook/README.md) - Document mock patterns

---

## Validation Checklist

### Before Starting
- [ ] **Storybook runs without errors**: `npm run storybook`
- [ ] **Build succeeds**: `npm run build-storybook`
- [ ] **TypeScript compiles**: `npm run typecheck`

### After Phase 1
- [ ] [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md) created with all stories
- [ ] [STORYBOOK_TESTING_CHECKLIST.md](../../docs/STORYBOOK_TESTING_CHECKLIST.md) created
- [ ] [STORYBOOK_TESTING_RESULTS.md](../../docs/STORYBOOK_TESTING_RESULTS.md) created
- [ ] All stories manually tested and statused

### After Phase 2
- [ ] Mock data structures validated against components
- [ ] Real runtime data captured for comparison
- [ ] Context providers validated in all stories
- [ ] Mismatches documented with severity

### After Phase 3
- [ ] All import paths verified
- [ ] Global mock setup validated
- [ ] Data reactivity tested

### After Phase 4
- [ ] Visual rendering validated (manual or automated)
- [ ] Console errors cataloged
- [ ] Accessibility issues documented

### After Phase 5
- [ ] Critical components deep-dived (ChatSidebar, Editor, etc.)
- [ ] Git history checked before modifying components
- [ ] Mock data updated to match actual structures

### After Phase 6
- [ ] Mock validation tests created
- [ ] Story render tests created
- [ ] **All tests passing**: `npm run test`
- [ ] (Optional) CI/CD integration complete

### After Phase 7
- [ ] All P0 issues fixed
- [ ] [STORYBOOK_MOCK_DATA_GUIDE.md](../../docs/STORYBOOK_MOCK_DATA_GUIDE.md) created
- [ ] Documentation updated
- [ ] Final validation: All stories render correctly

---

## Commands Reference

### Storybook Commands
```bash
# Start Storybook (background)
npm run storybook

# Build Storybook (validates all stories)
npm run build-storybook
```

### TypeScript & Testing
```bash
# TypeScript validation
npm run typecheck

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode  
npm run test:watch
```

### File Operations
- Find story files: `file_search` with `src/**/*.stories.*`
- Find mock data: `file_search` with `.storybook/__mocks__/ui-data/**/*`
- Search patterns: `grep_search` in `src/**/*`

### Git Commands
```bash
# Check git history
git log --oneline -- ${file}

# View component at specific commit
git show <commit>:${file}
```

---

## Integration with TypeScript Feature Workflow

This Storybook testing workflow should be run:

1. **During Feature Development** - Create stories alongside components
2. **After Implementation** - Validate new stories work correctly
3. **Before Final Validation** - Ensure all stories pass
4. **As Part of CI/CD** - Automated validation on PRs

**In [TypeScript Feature Workflow](./typescript-feature-workflow.prompt.md)**: Run after Step 6 (Add Unit Tests) and before Step 7 (Final Validation).

---

## Quick Reference

### High Priority Stories (Test First)
1. ChatSidebar - Message format critical
2. Editor3 - Lexical state critical
3. Workbook - Grade data critical
4. FileManager2 - ParsedContent format
5. AI Completion Plugins - API mock structure

### Common Pitfalls
- ❌ Don't modify components without checking git history
- ❌ Don't assume data structure - capture from runtime
- ❌ Don't create new subscriptions - use existing contexts
- ✅ Always verify mock data matches actual runtime data
- ✅ Check [.storybook/__mocks__/ui-data/](../../.storybook/__mocks__/ui-data/) as source of truth
- ✅ Use parts array format for AI SDK messages

### Status Tracking
- Update [STORYBOOK_INVENTORY.md](../../docs/STORYBOOK_INVENTORY.md) as you test
- Document issues in [STORYBOOK_TESTING_RESULTS.md](../../docs/STORYBOOK_TESTING_RESULTS.md)
- Create fixes based on priority (P0 → P1 → P2)

---

**When complete, you should have**:
- ✅ All stories rendering correctly
- ✅ Mock data matching component expectations
- ✅ Automated tests validating mock structures
- ✅ Documentation of patterns and best practices
- ✅ CI/CD integration (optional but recommended)

---

## Next Steps: Automation

After completing this workflow manually once:

1. **Implement Agent Skill** - Use the scaffold in [.github/skills/storybook-validation/storybook-validation.ts](../skills/storybook-validation/storybook-validation.ts)
2. **Add Tool Integration** - Connect to `file_search`, `grep_search`, `run_in_terminal`, etc.
3. **Run Tests** - Validate with [.github/skills/storybook-validation/storybook-validation.test.ts](../skills/storybook-validation/storybook-validation.test.ts)
4. **Automate CI** - Add to `.github/workflows/storybook-validation.yml`

**Resources**:
- [Agent Skills Overview](../../docs/AGENT_SKILLS.md)
- [Storybook Validation Skill](../skills/storybook-validation/SKILL.md)
- [Semantic File Search Example](../skills/semantic-file-search/semantic-file-search.ts) - Reference implementation

**Time Savings**: 70 hours manual → 5 hours automated (93% reduction) after one-time 76-hour setup investment.
