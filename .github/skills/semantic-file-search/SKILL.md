---
name: semantic-file-search
description: Natural language file discovery with relevance ranking and snippet extraction. Combines semantic search, grep patterns, and filename matching to find code across the workspace. Use when searching for components, patterns, or implementations without knowing exact paths.
---

# Semantic File Search

Natural language file discovery with intelligent relevance ranking and context-aware snippet extraction.

## What This Skill Does

Combines multiple search strategies (semantic understanding, grep pattern matching, and filename search) to find files matching natural language queries. Returns ranked results with code snippets showing match context and relevance scores. Automatically expands queries with common synonyms and patterns.

## When to Use

- **Code exploration** - "Find all components using DataStore subscriptions"
- **Pattern discovery** - "Show me files that use the useChat hook"
- **Architecture understanding** - "Where are authentication components located?"
- **Refactoring preparation** - "Find all uses of the old API pattern"
- **Learning codebase** - "Show me examples of file upload handling"

## Search Strategies

### 1. Semantic Search (Base relevance: 0.5)

AI-powered natural language understanding - best for: "components that handle user authentication"

### 2. Grep Pattern Search (Base relevance: 0.3)

Exact code pattern matching - best for: "DataStore.observeQuery" or "useChat("

### 3. File Search (Base relevance: 0.2)

Filename and path patterns - best for: "\*.stories.tsx" or "auth" in filename

## Query Expansion

Automatically expands queries with domain-specific patterns:

| Query       | Expanded To                                              |
| ----------- | -------------------------------------------------------- |
| `datastore` | DataStore, observeQuery, DataStore.query, DataStore.save |
| `component` | .tsx, .jsx, Component, export const                      |
| `context`   | Context.Provider, useContext, createContext              |
| `hook`      | use[A-Z], useEffect, useState                            |
| `ai`        | openai, anthropic, useChat, generateText                 |

## Usage Examples

### Find Components by Functionality

```
User: "Find components using chat functionality"
```

**Output**:

```
Found 8 files matching "chat functionality"

1. src/components/ChatSidebar.tsx (relevance: 0.95)
   ➤   12 | const { messages, isLoading } = useChat({
       13 |   api: '/api/chat',

2. src/components/ChatInterface.tsx (relevance: 0.87)
   ➤   45 | const chatMessages = messages.filter(m => m.role === 'assistant');
```

### Find DataStore Subscriptions

```
User: "Show me all files with DataStore subscriptions"
```

**Expanded**: `DataStore`, `observeQuery`, `.subscribe(`

**Results**: All context files and components using DataStore, ranked by relevance

## Relevance Scoring

```
Total = Base Score + Term Frequency + Path Bonus + File Type Bonus

Base Score:
  - Semantic: 0.5
  - Grep: 0.3
  - File: 0.2

Bonuses:
  + 0.05 per query term in snippet
  + 0.10 if term in file path
  + 0.05 for source files (not .test.*)

Max: 1.0
```

## Scope Filtering

Limit search using glob patterns:

```typescript
// Find components only
{
  scope: "src/components/**/*.{ts,tsx,js,jsx}";
}

// Find tests only
{
  scope: "**/*.{test,spec}.*";
}

// Specific directory
{
  scope: "src/context/**";
}
```

## Implementation

**TypeScript Module**: [semantic-file-search.ts](./semantic-file-search.ts)  
**Tests**: [semantic-file-search.test.ts](./semantic-file-search.test.ts)  
**Documentation**: [SEMANTIC_FILE_SEARCH.md](./SEMANTIC_FILE_SEARCH.md)

```typescript
import { executeSkill } from ".github/skills/semantic-file-search/semantic-file-search";

const result = await executeSkill({
  query: "Find DataStore subscriptions",
  scope: "src/**",
  limit: 10,
});
```

## Testing

```bash
npm run test -- .github/skills/semantic-file-search/semantic-file-search.test.ts
```

## Related Skills

- [storybook-audit](../storybook-audit/SKILL.md) - Uses this skill to find story files
- [mock-data-validator](../mock-data-validator/SKILL.md) - Can be combined to find and validate mocks

## Related Documentation

- [Agent Skills Architecture](../../../docs/AGENT_SKILLS_ARCHITECTURE.md)
- [VS Code Search API](https://code.visualstudio.com/api/references/vscode-api#workspace)
