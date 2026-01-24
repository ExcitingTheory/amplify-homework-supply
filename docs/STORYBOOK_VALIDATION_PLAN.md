# Storybook Validation Plan

**Created**: January 24, 2026  
**Purpose**: Systematic validation of mock data loading and component rendering in Storybook  
**Assumption**: Components are functionally correct; issues are in story/mock presentation layer

## Overview

This plan focuses on verifying that Storybook stories correctly:
1. Load mock data from `.storybook/__mocks__/ui-data/`
2. Present data in the format components expect
3. Render components with proper props and context
4. Match actual runtime data structures

---

## Phase 1: Inventory & Baseline (4-6 hours)

### 1.1 Map All Stories
**Goal**: Create complete list of existing stories and their dependencies

**Steps**:
```bash
# Find all story files
find src -name "*.stories.tsx" -o -name "*.stories.jsx" -o -name "*.stories.ts" -o -name "*.stories.js"

# Count stories per component type
grep -r "export default" src/**/*.stories.* --include="*.stories.*" | wc -l
```

**Deliverable**: Spreadsheet/table with:
- Component name
- Story file path
- Number of story variants
- Mock data dependencies
- Current status (renders/broken)

### 1.2 Inventory Mock Data Files
**Goal**: Catalog all mock data files and their structure

**Steps**:
```bash
# List all mock data
find .storybook/__mocks__/ui-data -type f

# Check for TypeScript interfaces/types
find .storybook/__mocks__ -name "*.ts" -o -name "*.d.ts"
```

**Deliverable**: Table with:
- Mock file name
- Data structure (interface/type)
- Used by which stories
- Last updated date

### 1.3 Check Story Render Status
**Goal**: Identify which stories currently render vs fail

**Steps**:
1. Start Storybook: `npm run storybook`
2. Open browser console
3. Navigate through each story systematically
4. Document errors in console/UI

**Deliverable**: Status sheet:
- ✅ Renders correctly
- ⚠️ Renders with warnings
- ❌ Fails to render
- 🔍 Renders but looks wrong

---

## Phase 2: Mock Data Structure Validation (6-8 hours)

### 2.1 Compare Mock Data to Component Props
**Goal**: Verify mock data structure matches component expectations

**For Each Story**:
1. **Find component prop types**:
   ```typescript
   // Example: ChatSidebar.tsx
   interface ChatSidebarProps {
     messages: Message[];
     onSendMessage: (text: string) => void;
     // ...
   }
   ```

2. **Find mock data structure**:
   ```javascript
   // .storybook/__mocks__/ui-data/chatMessages.js
   export const mockMessages = [
     { id: '1', role: 'user', content: '...' }
   ];
   ```

3. **Validate match**:
   - Do field names match? (`role` vs `author`?)
   - Do nested structures align? (Should be `message.parts` array with `{type: 'text', text: string}` objects)
   - Are required fields present?
   - Do array structures match?

**Tool**: Create validation script `scripts/validate-mock-data.ts`:
```typescript
// Pseudo-code
import { mockMessages } from '.storybook/__mocks__/ui-data/chatMessages';
import { Message } from '@ai-sdk/react';

function validateStructure(mock: any, interface: any): Report {
  // Compare keys, types, nested objects
  // Report mismatches
}
```

**Deliverable**: Report of mismatches with severity:
- 🔴 Critical: Missing required fields
- 🟡 Warning: Type mismatch (string vs number)
- 🟢 OK: Structures match

### 2.2 Extract Actual Runtime Data
**Goal**: Compare mock data to real data from running app

**Steps**:
1. **Capture real data snapshots**:
   ```javascript
   // In browser console during actual app usage
   // Example: ChatSidebar
   console.log(JSON.stringify(messages, null, 2));
   
   // Save to file
   copy(JSON.stringify(messages, null, 2));
   ```

2. **Create baseline examples**:
   ```bash
   mkdir -p .storybook/__mocks__/baseline-data
   # Save actual data snapshots here
   ```

3. **Compare structures**:
   ```typescript
   // scripts/compare-mock-to-real.ts
   const realData = require('.storybook/__mocks__/baseline-data/chatMessages.json');
   const mockData = require('.storybook/__mocks__/ui-data/chatMessages.js');
   
   deepCompare(realData, mockData);
   ```

**Deliverable**: Diff report showing:
- Fields in real data but missing in mock
- Fields in mock but not in real data
- Type mismatches
- Structure differences

### 2.3 Validate Context Providers
**Goal**: Ensure stories wrap components with correct context providers

**Check Each Story**:
```typescript
// Example: Does story provide all required contexts?
export const Default = () => (
  <AuthContext.Provider value={mockAuth}>      {/* ✓ Present */}
    <UnitContext.Provider value={mockUnit}>    {/* ✓ Present */}
      <ChatSidebar />
    </UnitContext.Provider>
  </AuthContext.Provider>
  // Missing: SettingsContext? FilesContext?
);
```

**Validation Checklist per Story**:
- [ ] All `useContext()` calls have corresponding providers in story
- [ ] Provider values match expected structure
- [ ] Provider values include all required fields
- [ ] Nested contexts in correct order

**Deliverable**: List of stories with missing/incorrect context setup

---

## Phase 3: Mock Data Loading Verification (4-6 hours)

### 3.1 Check Import Paths
**Goal**: Verify all mock imports resolve correctly

**Steps**:
```bash
# Check for broken imports
grep -r "from.*__mocks__" src/**/*.stories.* 

# Verify files exist
# Custom script to validate import paths
```

**Common Issues**:
- Relative path errors: `../../__mocks__` vs `.storybook/__mocks__`
- Missing exports: `import { mockData }` when file exports `default mockData`
- Case sensitivity: `chatMessages.js` vs `ChatMessages.js`

**Deliverable**: List of import errors with fixes

### 3.2 Validate Mock Setup Files
**Goal**: Ensure `.storybook/preview.js` and decorators work correctly

**Check**:
```javascript
// .storybook/preview.js
export const parameters = {
  // Are mocks being applied globally?
};

export const decorators = [
  // Are context providers wrapping all stories?
  (Story) => (
    <MockProviders>
      <Story />
    </MockProviders>
  )
];
```

**Tests**:
1. Open Storybook console
2. Check if global mocks are active: `console.log(window.awsAmplify)`
3. Verify context values: `console.log(React.useContext(UnitContext))`

**Deliverable**: Validation of global mock setup

### 3.3 Test Data Reactivity
**Goal**: Verify stories respond to mock data changes

**For Stories with Interactive Elements**:
```typescript
// Example: Test if updating mock state re-renders component
export const WithInteraction = () => {
  const [messages, setMessages] = useState(mockMessages);
  
  // Does adding a message cause re-render?
  const addMessage = () => setMessages([...messages, newMessage]);
  
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

### 4.1 Visual Regression Testing
**Goal**: Ensure components render as expected visually

**Available Options**:

**Option A: Manual Screenshot Gallery** (Recommended for now)
```bash
# Start Storybook
npm run storybook

# Open in browser, use browser's built-in screenshot tools
# Or use Test Runner (see Option B)
```

**Option B: Chromatic (Optional - requires setup)**
```bash
# Package already installed, just needs script + token
# Add to package.json scripts:
# "chromatic": "chromatic --project-token=<your-token>"

# Then run:
npm run chromatic
```

**Option C: Vitest + Playwright (Use existing tools)**
```bash
# You already have @vitest/browser-playwright
# Create visual snapshot tests:
test/storybook/visual-snapshots.test.ts
```

**Process**:
1. Start Storybook and manually navigate through stories
2. Document expected vs actual rendering in spreadsheet
3. Take screenshots of broken stories for comparison
4. Flag unexpected renderings for investigation

**Deliverable**: Screenshot gallery with status annotations

### 4.2 Console Error Scanning
**Goal**: Identify runtime errors and warnings in stories

**Automated Check**:
```typescript
// .storybook/test-runner.ts (if using test-runner addon)
import { toMatchImageSnapshot } from 'jest-image-snapshot';

export default {
  async postRender(page, context) {
    // Check for console errors
    const errors = await page.evaluate(() => {
      return window.__consoleErrors || [];
    });
    
    expect(errors).toHaveLength(0);
  }
};
```

**Manual Process**:
1. Open each story
2. Check console for:
   - ❌ Errors (red)
   - ⚠️ Warnings (yellow)
   - 🔵 Info/logs (blue - should be minimal)
3. Document error messages

**Common Issues to Look For**:
- `Cannot read property 'X' of undefined` → Missing mock data
- `useContext() returned undefined` → Missing provider
- `Invalid prop type` → Mock data type mismatch
- `key` prop warnings → Array data missing IDs

**Deliverable**: Error catalog with root causes

### 4.3 Accessibility Audits
**Goal**: Ensure mocked data doesn't break a11y

**Setup**:
```bash
# Use Storybook's built-in a11y addon
npm install --save-dev @storybook/addon-a11y
```

**Check**:
1. Enable a11y addon panel in Storybook
2. Review violations for each story
3. Identify if violations are from:
   - Component code (not our focus)
   - Mock data (e.g., missing alt text in mock images)
   - Story setup (e.g., missing labels)

**Deliverable**: A11y issues specific to mock data

---

## Phase 5: Specific Component Deep Dives (8-10 hours)

### 5.1 ChatSidebar Validation
**Priority**: HIGH (mentioned in copilot-instructions as reference)

**Checks**:
1. **Message Format**:
   ```typescript
   // Verify messages match useChat() structure
   interface Message {
     id: string;
     role: 'user' | 'assistant';
     content: string;  // NOT parts array!
     toolInvocations?: ToolInvocation[];
   }
   ```

2. **Mock vs Real Comparison**:
   - Load `ChatSidebar.stories.jsx`
   - Compare `mockMessages` to actual `useChat()` output
   - Verify `message.parts` is array format, extract text via `.filter(p => p.type === 'text').map(p => p.text).join('')`

3. **Git History Check**:
   ```bash
   git log --oneline -- src/components/ChatSidebar.js
   git show HEAD:src/components/ChatSidebar.js > /tmp/current-chat.js
   # Compare to story mock data
   ```

**Deliverable**: Validation report for ChatSidebar story accuracy

### 5.2 Editor3 Validation
**Priority**: HIGH (complex component with custom nodes)

**Checks**:
1. **Lexical State Mock**:
   ```typescript
   // Verify mock editor state matches Lexical JSON format
   const mockEditorState = {
     root: {
       children: [/* ... */],
       direction: 'ltr',
       format: '',
       indent: 0,
       type: 'root',
       version: 1
     }
   };
   ```

2. **Custom Node Data**:
   - QuizNode data structure
   - AnswerNode data structure
   - MeaningAssociationNode data structure
   - Verify all required fields present in mocks

3. **Context Dependencies**:
   - UnitContext with `editorStateRef`
   - `saveEditorContent()` function mock
   - Dictionary data for autocomplete

**Deliverable**: Editor story validation checklist

### 5.3 File Upload Components
**Priority**: MEDIUM

**Checks**:
1. **S3 Mock Data**:
   ```typescript
   // Verify mock file objects match Storage API
   interface MockFile {
     key: string;
     level: 'public' | 'protected' | 'private';
     contentType: string;
     size: number;
   }
   ```

2. **Upload Progress**:
   - Does mock `onProgress` callback work?
   - Do percentage calculations display?

3. **File Preview**:
   - Do mock URLs resolve in story?
   - Are cached URLs being mocked?

**Deliverable**: File handling story validation

### 5.4 Grade/Assignment Components
**Priority**: MEDIUM

**Checks**:
1. **Grade Data Structure**:
   ```typescript
   // Verify Grade.data JSON matches actual format
   const mockGrade = {
     id: '...',
     data: JSON.stringify({
       'block-id-1': { complete: true, accuracy: 85 },
       'block-id-2': { complete: false, accuracy: 0 }
     }),
     accuracy: 85,
     complete: false
   };
   ```

2. **Rubric Data**:
   - Does mock rubric match `gradedBlockTypes`?
   - Are all block IDs present?

**Deliverable**: Grading story validation

---

## Phase 6: Automated Testing Setup (6-8 hours)

### 6.1 Create Mock Data Validation Tests
**Goal**: Automated checks for mock data structure

**Setup**:
```typescript
// test/storybook/validate-mocks.test.ts
import { describe, it, expect } from 'vitest';
import { mockMessages } from '.storybook/__mocks__/ui-data/chatMessages';

describe('Mock Data Structure Validation', () => {
  describe('Chat Messages', () => {
    it('should have required Message fields', () => {
      mockMessages.forEach(msg => {
        expect(msg).toHaveProperty('id');
        expect(msg).toHaveProperty('role');
        expect(msg).toHaveProperty('content');
        expect(typeof msg.content).toBe('string'); // NOT array!
      });
    });
  });
  
  // Add tests for each mock data file
});
```

**Run**: `npm run test -- validate-mocks`

**Deliverable**: Test suite for mock data validation

### 6.2 Story Render Tests
**Goal**: Automated rendering checks

**Using Existing Vitest + Storybook Integration**:

You already have `@storybook/addon-vitest` installed. Create tests:

```typescript
// test/storybook/story-rendering.test.ts
import { describe, it, expect } from 'vitest';
import { composeStories } from '@storybook/react';
import * as ChatSidebarStories from '../../src/components/ChatSidebar.stories';

describe('Story Rendering Tests', () => {
  const { Default, WithMessages } = composeStories(ChatSidebarStories);
  
  it('ChatSidebar Default story should render', () => {
    const { container } = render(<Default />);
    expect(container).toBeTruthy();
    expect(container.querySelector('[data-error]')).toBeNull();
  });
});
```

**Run**: `npm run test` or `npm run test:watch`

**Deliverable**: Automated render test suite using existing Vitest setup

### 6.3 CI/CD Integration
**Goal**: Run Stor (using existing test scripts):
```yaml
# .github/workflows/storybook-tests.yml
name: Storybook Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run typecheck        # TypeScript validation
      - run: npm run build-storybook   # Ensure stories build
      - run: npm run test              # Run Vitest tests including story tests
      - run: npm run build-storybook
      - run: npm run test-storybook
```

**Deliverable**: CI pipeline for story validation

---

## Phase 7: Documentation & Fixes (4-6 hours)

### 7.1 Create Mock Data Guide
**Goal**: Document correct patterns for creating story mocks

**Content**:
```markdown
# Storybook Mock Data Guide

## Extracting Mock Data from Runtime

1. Find component in running app
2. Open browser console
3. Log the data: `console.log(JSON.stringify(data, null, 2))`
4. Save to `.storybook/__mocks__/ui-data/`

## Mock Structure Rules

- **Always match runtime structure** - Don't invent/assume fields
- **Use actual data when possible** - Copy from working components
- **Include all required fields** - Check component prop types
- **Preserve type information** - String vs Number matters
```

**Deliverable**: `docs/STORYBOOK_MOCK_DATA_GUIDE.md`

### 7.2 Fix Identified Issues
**Goal**: Repair broken stories based on validation findings

**Priority Order**:
1. 🔴 Critical: Stories that don't render at all
2. 🟡 Medium: Stories with console errors/warnings
3. 🟢 Low: Stories with minor visual issues

**Process per Fix**:
1. Identify root cause from validation report
2. Update mock data OR story setup OR component (if needed)
3. Test fix in Storybook
4. Add regression test
5. Document fix in changelog

**Deliverable**: Fixed stories with passing tests

### 7.3 Create Maintenance Checklist
**Goal**: Ongoing validation process

**Checklist**:
```markdown
## Adding a New Story

- [ ] Extract mock data from running component
- [ ] Verify data structure matches prop types
- [ ] Include all required context providers
- [ ] Test rendering in Storybook
- [ ] Check console for errors
- [ ] Run `npm run test-storybook`
- [ ] Document any special setup needed

## Updating Existing Story

- [ ] Check if component props changed
- [ ] Update mock data to match
- [ ] Verify all story variants still work
- [ ] Run validation tests
```

**Deliverable**: `docs/STORYBOOK_MAINTENANCE.md`

---

## Tools & Scripts

### Validation Scripts to Create

```bash
scripts/
  validate-mock-data.ts          # Compare mocks to types
  compare-mock-to-real.ts        # Compare mocks to runtime data
  check-story-imports.ts         # Verify import paths
  scan-console-errors.ts         # Automated error detection
  generate-mock-template.ts      # Create mock from type definition
```

### Helpful Commands

```bash
# Start Storybook dev server
npm run storybook

# Build Storybook (catches build errors)
npm run build-storybook

# Run TypeScript checks (includes stories)
npm run typecheck

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- ChatSidebar.test

# Check test coverage
npm run test:coverage

# Future custom scripts (to be created):
# npm run validate:mocks
# npm run compare:data -- ChatSidebar
```

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Inventory | 4-6 hrs | Story/mock catalog |
| 2. Structure Validation | 6-8 hrs | Mismatch report |
| 3. Loading Verification | 4-6 hrs | Import/setup validation |
| 4. Rendering Validation | 6-8 hrs | Error catalog |
| 5. Component Deep Dives | 8-10 hrs | Component-specific reports |
| 6. Automated Testing | 6-8 hrs | Test suites |
| 7. Documentation & Fixes | 4-6 hrs | Fixed stories + docs |
| **Total** | **38-52 hrs** | **Fully validated Storybook** |

**Estimated**: 1-2 weeks for complete validation

---

## Success Criteria

✅ **All stories render without console errors**  
✅ **Mock data structures match component expectations**  
✅ **Git history comparison shows no regressions**  
✅ **Automated tests pass on all stories**  
✅ **Documentation exists for creating new stories**  
✅ **Visual regression tests capture baseline**  
✅ **CI/CD pipeline validates stories on each PR**

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Too many broken stories | High | Prioritize critical components first |
| Mock data out of date | Medium | Create automation to extract from runtime |
| Components changed, mocks didn't | Medium | Add tests to catch type mismatches |
| Stories work but look wrong | Low | Visual regression testing |
| Missing context providers | High | Checklist for required contexts per component |

---

## Next Steps

1. **Start with Phase 1**: Create inventory spreadsheet
2. **Focus on Critical Components**: ChatSidebar, Editor3, Grade components
3. **Set up Automation Early**: Scripts for validation and comparison
4. **Document as You Go**: Update findings in real-time
5. **Create GitHub Issues**: Track fixes needed per component

Ready to begin implementation? Start with:
```bash
# Create inventory
find src -name "*.stories.*" > /tmp/story-files.txt
npm run storybook  # Open and test each story
```
