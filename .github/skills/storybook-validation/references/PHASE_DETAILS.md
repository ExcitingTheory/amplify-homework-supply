# Storybook Validation - Phase Details

Detailed documentation for each validation phase.

## Phase 1: Story Inventory Generation

### Purpose
Catalog all Storybook stories and collect metadata about components, args, and decorators.

### Process

1. **Discover story files**
   - Scan for `*.stories.tsx`, `*.stories.jsx`, `*.stories.ts`, `*.stories.js`
   - Exclude node_modules, build outputs

2. **Parse story metadata**
   - Extract default export (Meta)
   - Find all named exports (stories)
   - Collect args and argTypes
   - Identify decorators and parameters

3. **Generate inventory**
   - Create JSON catalog
   - Include component paths
   - Map stories to components

### Output Format
```json
{
  "stories": [
    {
      "id": "components-chatsidebar--default",
      "title": "Components/ChatSidebar",
      "componentPath": "src/components/ChatSidebar.tsx",
      "storyPath": "src/components/ChatSidebar.stories.tsx",
      "stories": ["Default", "WithMessages", "Streaming"],
      "args": {
        "messages": "Message[]",
        "onSend": "Function"
      }
    }
  ],
  "metadata": {
    "totalStories": 156,
    "totalComponents": 42,
    "generatedAt": "2026-01-30T12:00:00Z"
  }
}
```

---

## Phase 2: Mock Data Validation

### Purpose
Verify that mock data structures match component TypeScript interfaces.

### Validation Steps

1. **Extract component prop types**
   ```typescript
   interface ChatSidebarProps {
     messages: Message[];
     onSend: (text: string) => void;
   }
   ```

2. **Load mock data**
   ```typescript
   import { mockMessages } from '../../../.storybook/__mocks__/ui-data/chatMessages';
   ```

3. **Compare structures**
   - Check required props exist
   - Verify types match
   - Validate nested objects
   - Check array item types

4. **Report mismatches**
   ```json
   {
     "errors": [
       {
         "component": "ChatSidebar",
         "prop": "messages",
         "expected": "Message[]",
         "actual": "string",
         "location": "chatMessages.ts:45"
       }
     ]
   }
   ```

### Special Cases

**Message.parts format**:
- Verify `parts` array exists
- Check part types (`text`, `tool-*`)
- Validate required fields per type

**DataStore models**:
- Check `_version` field for OCC
- Verify model relationships
- Validate timestamps

**File objects**:
- Verify S3 key format
- Check protection level
- Validate MIME types

---

## Phase 3: Component Rendering Tests

### Purpose
Ensure all stories render without errors in actual Storybook runtime.

### Test Process

1. **Build Storybook**
   ```bash
   npm run build-storybook
   ```

2. **Start test server**
   ```bash
   npx http-server storybook-static -p 6006
   ```

3. **Run Playwright tests**
   ```typescript
   test('ChatSidebar stories render', async ({ page }) => {
     await page.goto('http://localhost:6006/?path=/story/components-chatsidebar--default');
     await expect(page.locator('[data-testid="chat-sidebar"]')).toBeVisible();
   });
   ```

4. **Capture failures**
   - Screenshot on error
   - Log console errors
   - Record stack traces

### Checks Performed

- [ ] Story renders without throwing
- [ ] No console errors
- [ ] Required DOM elements present
- [ ] Mock data loads correctly
- [ ] Context providers work
- [ ] Event handlers don't crash

---

## Phase 4: Accessibility Audits

### Purpose
Ensure stories meet WCAG 2.1 AA standards.

### Audit Process

1. **Load story**
2. **Run axe-core**
   ```typescript
   import { injectAxe, checkA11y } from 'axe-playwright';
   
   await injectAxe(page);
   await checkA11y(page);
   ```

3. **Check violations**
   - Color contrast
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Semantic HTML

### Common Issues

**Missing ARIA labels**:
```tsx
// ❌ Bad
<button onClick={handleClick}>X</button>

// ✅ Good
<button onClick={handleClick} aria-label="Close">X</button>
```

**Poor color contrast**:
```tsx
// ❌ Bad (contrast ratio 2.5:1)
<p style={{ color: '#999', background: '#fff' }}>Text</p>

// ✅ Good (contrast ratio 4.5:1)
<p style={{ color: '#666', background: '#fff' }}>Text</p>
```

**Missing landmark roles**:
```tsx
// ❌ Bad
<div>
  <div>Header</div>
  <div>Content</div>
</div>

// ✅ Good
<div>
  <header role="banner">Header</header>
  <main role="main">Content</main>
</div>
```

---

## Phase 5: Integration Validation

### Purpose
Verify stories work with real-world context providers and state.

### Integration Tests

1. **Context provider compatibility**
   ```typescript
   // Verify story works with UnitContext
   <UnitContext.Provider value={mockUnitContextValue}>
     <ChatSidebar {...args} />
   </UnitContext.Provider>
   ```

2. **DataStore integration**
   ```typescript
   // Test with mocked DataStore
   jest.mock('aws-amplify/datastore');
   DataStore.observeQuery.mockReturnValue({
     subscribe: jest.fn()
   });
   ```

3. **API calls**
   ```typescript
   // Verify AI SDK streaming
   mockUseChat.mockReturnValue({
     messages: mockMessages,
     append: jest.fn()
   });
   ```

---

## Phase 6: Performance Checks

### Purpose
Ensure stories meet performance budgets.

### Metrics Tracked

1. **Render time**
   - Initial render < 100ms
   - Re-render < 50ms

2. **Bundle size**
   - Component + deps < 50KB gzipped

3. **Memory usage**
   - No memory leaks
   - Cleanup on unmount

### Performance Tests

```typescript
test('ChatSidebar renders quickly', async () => {
  const start = performance.now();
  render(<ChatSidebar {...mockProps} />);
  const end = performance.now();
  
  expect(end - start).toBeLessThan(100);
});

test('ChatSidebar cleans up subscriptions', async () => {
  const { unmount } = render(<ChatSidebar {...mockProps} />);
  
  expect(mockSubscribe).toHaveBeenCalled();
  unmount();
  expect(mockUnsubscribe).toHaveBeenCalled();
});
```

---

## Phase 7: Visual Regression Testing

### Purpose
Detect unintended visual changes.

### Process

1. **Capture baseline screenshots**
   ```bash
   npm run test-storybook -- --update-snapshots
   ```

2. **Compare on changes**
   ```bash
   npm run test-storybook
   ```

3. **Review differences**
   - Pixel-by-pixel comparison
   - Threshold for acceptable changes
   - Manual approval for intentional changes

### Tool: Chromatic
```bash
npx chromatic --project-token=$CHROMATIC_TOKEN
```

---

## Validation Report Schema

```typescript
interface ValidationReport {
  timestamp: string;
  phases: {
    inventory: {
      status: 'pass' | 'fail';
      storiesFound: number;
      componentsFound: number;
    };
    mockData: {
      status: 'pass' | 'fail';
      errors: ValidationError[];
      warnings: ValidationWarning[];
    };
    rendering: {
      status: 'pass' | 'fail';
      passedStories: string[];
      failedStories: string[];
      errors: RenderError[];
    };
    accessibility: {
      status: 'pass' | 'fail';
      violations: A11yViolation[];
      criticalIssues: number;
    };
    integration: {
      status: 'pass' | 'fail';
      contextTests: TestResult[];
      datastoreTests: TestResult[];
    };
    performance: {
      status: 'pass' | 'fail';
      slowStories: {
        story: string;
        renderTime: number;
      }[];
    };
    visualRegression: {
      status: 'pass' | 'fail';
      changedStories: {
        story: string;
        diffPercentage: number;
        screenshot: string;
      }[];
    };
  };
  summary: {
    totalPass: number;
    totalFail: number;
    overallStatus: 'pass' | 'fail';
  };
}
```

---

## CI/CD Integration

```yaml
# .github/workflows/storybook-validation.yml
name: Storybook Validation

on:
  pull_request:
    paths:
      - 'src/**/*.tsx'
      - '.storybook/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Phase 1 - Inventory
        run: npx tsx .github/skills/storybook-validation/scripts/generate-story-inventory.ts
      
      - name: Phase 2 - Mock Data
        run: npm test -- storybook-validation.test.ts
      
      - name: Phase 3 - Rendering
        run: npm run test-storybook
      
      - name: Phase 4 - Accessibility
        run: npm run test-storybook -- --a11y
      
      - name: Phase 7 - Visual Regression
        run: npx chromatic --exit-zero-on-changes
```
