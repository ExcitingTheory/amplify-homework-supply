# Mock Data Validator - Common Issues

Troubleshooting guide for mock data validation.

## Issue 1: Message Rendering Fails

### Symptom
```
TypeError: Cannot read property 'content' of undefined
```

### Cause
Component expects `message.content` but mock data uses `message.parts` format.

### Solution
Update component to extract text from parts:

**Before** (incorrect):
```typescript
function ChatMessage({ message }) {
  return <div>{message.content}</div>;
}
```

**After** (correct):
```typescript
function ChatMessage({ message }) {
  const text = message.parts
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join('');
  return <div>{text}</div>;
}
```

---

## Issue 2: Tool Calls Not Displaying

### Symptom
Tool calls exist in mock data but don't render in component.

### Cause
Component only renders text parts, ignores tool parts.

### Solution
```typescript
function ChatMessage({ message }) {
  const textParts = message.parts.filter(p => p.type === 'text');
  const toolParts = message.parts.filter(p => p.type?.startsWith('tool-'));

  return (
    <div>
      {textParts.map((part, i) => (
        <div key={i}>{part.text}</div>
      ))}
      {toolParts.map((part, i) => (
        <ToolCall key={i} part={part} />
      ))}
    </div>
  );
}
```

---

## Issue 3: Mock Data Type Mismatch

### Symptom
```
Validation failed: Expected Message[], got string
```

### Cause
Mock data file exports wrong type.

### Solution
Check mock data structure:

**Before** (incorrect):
```typescript
// .storybook/__mocks__/ui-data/chatMessages.ts
export const mockMessages = "[]"; // String!
```

**After** (correct):
```typescript
// .storybook/__mocks__/ui-data/chatMessages.ts
export const mockMessages: Message[] = [];
```

---

## Issue 4: Missing Required Properties

### Symptom
```
Validation error: Message part 0 missing 'type' field
```

### Cause
Mock data parts array malformed.

### Solution
Ensure all parts have `type`:

**Before** (incorrect):
```typescript
{
  id: '1',
  role: 'user',
  parts: [
    { text: 'Hello' }  // Missing 'type'
  ]
}
```

**After** (correct):
```typescript
{
  id: '1',
  role: 'user',
  parts: [
    { type: 'text', text: 'Hello' }
  ]
}
```

---

## Issue 5: Tool State Invalid

### Symptom
```
Validation error: Invalid state "pending"
```

### Cause
Tool part has incorrect state value.

### Solution
Use only valid states: `'call'` or `'output-available'`

**Before** (incorrect):
```typescript
{
  type: 'tool-search_content',
  toolCallId: 'call_1',
  state: 'pending',  // Invalid!
  input: {}
}
```

**After** (correct):
```typescript
{
  type: 'tool-search_content',
  toolCallId: 'call_1',
  state: 'call',  // Valid
  input: {}
}
```

---

## Issue 6: Empty Parts Array

### Symptom
```
Validation error: Message parts array cannot be empty
```

### Cause
Message has `parts: []`

### Solution
Always include at least one part:

**Before** (incorrect):
```typescript
{
  id: '1',
  role: 'user',
  parts: []  // Empty!
}
```

**After** (correct):
```typescript
{
  id: '1',
  role: 'user',
  parts: [
    { type: 'text', text: '' }  // At least empty text
  ]
}
```

---

## Issue 7: Storybook Stories Not Loading

### Symptom
Story renders blank or shows "No data"

### Cause
Mock data import path incorrect.

### Solution
Verify import path:

**Before** (incorrect):
```typescript
import { mockMessages } from '__mocks__/chatMessages';
```

**After** (correct):
```typescript
import { mockMessages } from '../../../.storybook/__mocks__/ui-data/chatMessages';
```

Or use absolute import:
```typescript
import { mockMessages } from '@mocks/ui-data/chatMessages';
```

---

## Issue 8: TypeScript Type Errors

### Symptom
```
Type 'Message[]' is not assignable to type 'readonly Message[]'
```

### Cause
Component expects readonly array.

### Solution
Cast or use const assertion:

**Option 1: Cast**
```typescript
const messages = mockMessages as readonly Message[];
```

**Option 2: Const assertion**
```typescript
export const mockMessages = [
  { id: '1', role: 'user', parts: [...] }
] as const;
```

---

## Issue 9: Tool Output Missing

### Symptom
Tool result part has no output field.

### Cause
Forgot to add `output` when `state === 'output-available'`

### Solution
**Before** (incorrect):
```typescript
{
  type: 'tool-search_content',
  toolCallId: 'call_1',
  state: 'output-available',
  input: { query: 'test' }
  // Missing output!
}
```

**After** (correct):
```typescript
{
  type: 'tool-search_content',
  toolCallId: 'call_1',
  state: 'output-available',
  input: { query: 'test' },
  output: {
    results: []
  }
}
```

---

## Issue 10: Git History Shows Working Code

### Symptom
Code stopped working after refactor but git shows it worked before.

### Solution
**Before changing message parsing**:

1. Check git history:
```bash
git log --oneline -- src/components/ChatSidebar.tsx
```

2. View working version:
```bash
git show HEAD~5:src/components/ChatSidebar.tsx
```

3. Compare mock data format:
```bash
diff <(git show HEAD~5:.storybook/__mocks__/ui-data/chatMessages.ts) \
     <(cat .storybook/__mocks__/ui-data/chatMessages.ts)
```

4. Restore working logic if needed:
```bash
git checkout HEAD~5 -- src/components/ChatSidebar.tsx
```

---

## Validation Checklist

Before committing changes:

- [ ] All messages have `parts` array
- [ ] All parts have `type` field
- [ ] Text parts have `text` field
- [ ] Tool parts have `toolCallId` and `state`
- [ ] Tool states are `'call'` or `'output-available'`
- [ ] Tool result parts have `output` field
- [ ] No empty `parts` arrays
- [ ] TypeScript types match component props
- [ ] Stories render without errors
- [ ] Mock data imports resolve correctly

---

## Debug Commands

### Validate all mock data
```bash
npx tsx .github/skills/mock-data-validator/scripts/validate-component-mocks.ts
```

### Validate specific component
```bash
npx tsx .github/skills/mock-data-validator/scripts/mock-data-validator.ts \
  src/components/ChatSidebar.tsx \
  .storybook/__mocks__/ui-data/chatMessages.ts
```

### Check mock data structure
```bash
npx tsx -e "
import { mockMessages } from './.storybook/__mocks__/ui-data/chatMessages';
console.log(JSON.stringify(mockMessages[0], null, 2));
"
```

---

## Prevention Tips

1. **Always use TypeScript interfaces** for mock data
2. **Validate before committing** with pre-commit hook
3. **Check git history** before breaking changes
4. **Use type guards** for runtime validation
5. **Test stories** in Storybook before deployment
6. **Document data structure** in MESSAGE_FORMAT_SPEC.md
7. **Use const assertions** for readonly data
8. **Enable strict mode** in tsconfig.json
