---
name: mock-data-validator
description: Validates that Storybook mock data structures match component TypeScript prop types. Compares JSON/JS mock data files against component interfaces to ensure correct types, required fields, and data structures. Use when creating new stories, updating component props, debugging rendering issues, or ensuring mock data accuracy.
---

# Mock Data Validator

Validates that Storybook mock data structures match component TypeScript prop types.

## What This Skill Does

Extracts TypeScript interfaces from components, loads mock data from JSON or JS files, and compares structures to identify mismatches. Reports errors for missing required fields, type mismatches, and provides actionable fix suggestions.

## When to Use

- **Before creating new Storybook stories** - Validate mock data matches component props
- **After refactoring component props** - Ensure existing mocks still work
- **When stories render with unexpected data** - Debug data structure issues
- **As pre-commit validation** - Prevent broken stories from being committed
- **Direct invocation** - "Validate mock data for ChatSidebar"

## How It Works

1. **Extract Component Props**: Parses TypeScript interfaces, type aliases, or JSDoc comments
2. **Load Mock Data**: Reads JSON files or JavaScript export objects
3. **Compare Structures**: Validates types, required fields, array structures, and nested objects
4. **Report Issues**: Lists mismatches with severity levels and specific fix suggestions

## Supported Component Patterns

### TypeScript Interface

```typescript
interface ChatSidebarProps {
  messages: Message[];
  onSend: (text: string) => void;
  isLoading?: boolean;
}
```

✅ **Extracts**: `messages: Message[]`, `onSend: (text: string) => void`, `isLoading?: boolean | undefined`

### Type Alias

```typescript
type ChatSidebarProps = {
  messages: Message[];
  onSend: (text: string) => void;
};
```

✅ **Extracts**: Same as interface

### JSDoc for JavaScript Components

```javascript
/**
 * @param {Message[]} messages - Chat messages array
 * @param {function(string): void} onSend - Send message handler
 */
export const ChatSidebar = ({ messages, onSend }) => { };
```

✅ **Extracts**: Types from JSDoc annotations

## Usage Examples

### Validate Single Component

```
User: "Validate mock data for ChatSidebar"
```

**Agent Response**:
```
✅ Mock data validation passed for ChatSidebar.tsx

Component Props:
  - messages: Message[]
  - onSend: (text: string) => void
  - isLoading?: boolean | undefined

Mock Data Structure:
  - messages: object[]
  - onSend: function
  - isLoading: boolean
```

### Common Issue: Message Format

**❌ Legacy format (will break ChatSidebar)**:
```json
{
  "id": "1",
  "role": "user",
  "content": "Hello"
}
```

**✅ Current format (required)**:
```json
{
  "id": "1",
  "role": "user",
  "parts": [
    { "type": "text", "text": "Hello" }
  ]
}
```

## Implementation

**TypeScript Module**: [mock-data-validator.ts](./mock-data-validator.ts)  
**Tests**: [mock-data-validator.test.ts](./mock-data-validator.test.ts)

```typescript
import { executeSkill } from '.github/skills/mock-data-validator/mock-data-validator';

const result = await executeSkill({
  componentPath: '/absolute/path/to/Component.tsx',
  mockDataPath: '/absolute/path/to/mock-data.json'
});
```

## Testing

```bash
npm run test -- .github/skills/mock-data-validator/mock-data-validator.test.ts
```

## Related Skills

- [storybook-validation](../storybook-validation/SKILL.md) - Full Storybook testing workflow
- [semantic-file-search](../semantic-file-search/SKILL.md) - Find component and mock files

## Related Documentation

- [Agent Skills Architecture](../../../docs/AGENT_SKILLS_ARCHITECTURE.md)
- [Storybook Mock Data Guide](../../../docs/STORYBOOK_MOCK_DATA_GUIDE.md)
