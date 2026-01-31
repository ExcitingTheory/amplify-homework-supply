# Component Versioning Examples

Detailed examples of using the component-versioning skill.

## Example 1: Basic Component Versioning

**Source**: `ChatSidebar.tsx`  
**Target**: `ChatSidebar2.tsx`

### Initial State
```typescript
// src/components/ChatSidebar.tsx
export function ChatSidebar({ messages }: ChatSidebarProps) {
  return <div>{messages.map(m => <Message key={m.id} {...m} />)}</div>;
}
```

### After Versioning
```typescript
// src/components/ChatSidebar2.tsx (auto-generated)
export function ChatSidebar2({ messages }: ChatSidebar2Props) {
  return <div>{messages.map(m => <Message key={m.id} {...m} />)}</div>;
}
```

**Generated Checklist**:
- [ ] Verify message rendering
- [ ] Test with message.parts format
- [ ] Validate scroll behavior
- [ ] Check accessibility

---

## Example 2: Versioning with Storybook

**Input**:
```typescript
{
  componentPath: "src/components/Editor3/Editor3.tsx",
  targetVersion: 2,
  includeStories: true
}
```

**Generates**:
- `src/components/Editor4/Editor4.tsx`
- `src/components/Editor4/Editor4.stories.tsx`
- Feature parity checklist with:
  - All existing story scenarios
  - Custom nodes (AnswerNode, QuizNode, etc.)
  - Plugin functionality
  - Save/load operations

---

## Example 3: Complex Component with Context

**Source**: Component using `UnitContext`

```typescript
// Original
export function UnitEditor() {
  const { unit, saveEditorContent } = useContext(UnitContext);
  // ...
}
```

**Generated Checklist Includes**:
- [ ] Verify UnitContext integration
- [ ] Test saveEditorContent calls
- [ ] Validate observeQuery subscriptions
- [ ] Check optimistic concurrency control

---

## Example 4: Component with Multiple Exports

**Source**:
```typescript
// DictionaryEditor.tsx
export function DictionaryEditor() { }
export function DictionaryEditorToolbar() { }
export const useDictionaryEditor = () => { }
```

**Result**:
All exports renamed:
- `DictionaryEditor2`
- `DictionaryEditorToolbar2`
- `useDictionaryEditor2`

---

## Example 5: File Organization

**Before**:
```
src/components/
├── ChatSidebar.tsx
├── ChatSidebar.stories.tsx
└── ChatSidebar.module.css
```

**After**:
```
src/components/
├── ChatSidebar2/
│   ├── ChatSidebar2.tsx
│   ├── ChatSidebar2.stories.tsx
│   └── ChatSidebar2.module.css
└── ChatSidebar/
    ├── ChatSidebar.tsx
    ├── ChatSidebar.stories.tsx
    └── ChatSidebar.module.css
```

---

## Common Patterns

### Pattern 1: DataStore Integration
When versioning components with DataStore:
- Check for `DataStore.observeQuery()` calls
- Verify `_version` tracking for OCC
- Validate subscription cleanup

### Pattern 2: Lexical Editor Nodes
When versioning Editor components:
- List all custom nodes
- Check plugin integrations
- Verify state management

### Pattern 3: Material UI Components
When versioning MUI components:
- Check theme usage
- Verify responsive breakpoints
- Validate accessibility props

---

## Troubleshooting

**Issue**: Import paths not updated  
**Solution**: Run second pass to catch dynamic imports

**Issue**: Story mock data incompatible  
**Solution**: Use `mock-data-validator` skill to verify structure

**Issue**: Context provider missing  
**Solution**: Add to feature parity checklist manually
