#!/bin/bash

# Agent Skills Reorganization Script
# Moves agent skill implementations from src/agent-skills to .github/skills/
# Following GitHub Copilot Agent Skills standard

set -e  # Exit on error

echo "🔧 Reorganizing Agent Skills..."

# Create skill directories
echo "📁 Creating skill directories..."
mkdir -p .github/skills/mock-data-validator
mkdir -p .github/skills/semantic-file-search
# storybook-validation already exists

# Move TypeScript implementations
echo "📦 Moving TypeScript implementations..."
mv src/agent-skills/mock-data-validator.ts .github/skills/mock-data-validator/
mv src/agent-skills/semantic-file-search.ts .github/skills/semantic-file-search/
mv src/agent-skills/storybook-validation.ts .github/skills/storybook-validation/

# Move test files
echo "🧪 Moving test files..."
mv test/agent-skills/mock-data-validator.test.ts .github/skills/mock-data-validator/
mv test/agent-skills/semantic-file-search.test.ts .github/skills/semantic-file-search/
mv test/agent-skills/storybook-validation.test.ts .github/skills/storybook-validation/

# Move documentation
echo "📚 Moving documentation..."
mv src/agent-skills/SEMANTIC_FILE_SEARCH.md .github/skills/semantic-file-search/
mv src/agent-skills/README.md docs/AGENT_SKILLS_IMPLEMENTATION.md

# Create SKILL.md for mock-data-validator
echo "📝 Creating mock-data-validator SKILL.md..."
cat > .github/skills/mock-data-validator/SKILL.md << 'EOF'
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
EOF

# Create SKILL.md for semantic-file-search
echo "📝 Creating semantic-file-search SKILL.md..."
cat > .github/skills/semantic-file-search/SKILL.md << 'EOF'
---
name: semantic-file-search
description: Natural language file discovery with relevance ranking and snippet extraction. Combines semantic search, grep patterns, and filename matching to find code across the workspace. Returns ranked results with context snippets showing matches. Use when searching for components, patterns, or implementations without knowing exact paths.
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
Filename and path patterns - best for: "*.stories.tsx" or "auth" in filename

## Query Expansion

Automatically expands queries with domain-specific patterns:

| Query | Expanded To |
|-------|-------------|
| `datastore` | DataStore, observeQuery, DataStore.query, DataStore.save |
| `component` | .tsx, .jsx, Component, export const |
| `context` | Context.Provider, useContext, createContext |
| `hook` | use[A-Z], useEffect, useState |
| `ai` | openai, anthropic, useChat, generateText |

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
{ scope: "src/components/**/*.{ts,tsx,js,jsx}" }

// Find tests only
{ scope: "**/*.{test,spec}.*" }

// Specific directory
{ scope: "src/context/**" }
```

## Implementation

**TypeScript Module**: [semantic-file-search.ts](./semantic-file-search.ts)  
**Tests**: [semantic-file-search.test.ts](./semantic-file-search.test.ts)  
**Documentation**: [SEMANTIC_FILE_SEARCH.md](./SEMANTIC_FILE_SEARCH.md)

```typescript
import { executeSkill } from '.github/skills/semantic-file-search/semantic-file-search';

const result = await executeSkill({
  query: "Find DataStore subscriptions",
  scope: "src/**",
  limit: 10
});
```

## Testing

```bash
npm run test -- .github/skills/semantic-file-search/semantic-file-search.test.ts
```

## Related Skills

- [storybook-validation](../storybook-validation/SKILL.md) - Uses this skill to find story files
- [mock-data-validator](../mock-data-validator/SKILL.md) - Can be combined to find and validate mocks

## Related Documentation

- [Agent Skills Architecture](../../../docs/AGENT_SKILLS_ARCHITECTURE.md)
- [VS Code Search API](https://code.visualstudio.com/api/references/vscode-api#workspace)
EOF

# Create README in skills directory
echo "📝 Creating .github/skills/README.md..."
cat > .github/skills/README.md << 'EOF'
# Agent Skills

GitHub Copilot Agent Skills for the Homework Supply project.

## Available Skills

### [mock-data-validator](./mock-data-validator/)
Validates Storybook mock data structures match component TypeScript prop types.

**Use when**: Creating stories, updating component props, debugging rendering issues

### [semantic-file-search](./semantic-file-search/)
Natural language file discovery with relevance ranking and snippet extraction.

**Use when**: Searching for components, patterns, or implementations without knowing exact paths

### [storybook-validation](./storybook-validation/)
Autonomous validation of all Storybook stories, mock data, and rendering.

**Use when**: Testing Storybook, validating all stories, before releases

## Skill Structure

Each skill directory contains:
- `SKILL.md` - Instructions for GitHub Copilot (YAML frontmatter + markdown)
- `*.ts` - TypeScript implementation (optional, for programmatic execution)
- `*.test.ts` - Test files (optional)
- Additional resources (examples, templates, etc.)

## Using Skills

Skills are automatically loaded by GitHub Copilot when relevant to your task. You can also invoke them directly:

```
"Validate mock data for ChatSidebar"
"Find components using DataStore subscriptions"
"Run storybook validation"
```

Enable skills in VS Code: Set `chat.useAgentSkills: true` in settings.

## Documentation

- [Agent Skills Standard](https://agentskills.io)
- [Agent Skills Architecture](../../docs/AGENT_SKILLS_ARCHITECTURE.md)
- [Implementation Guide](../../docs/AGENT_SKILLS_IMPLEMENTATION.md)
EOF

# Clean up old directories
echo "🧹 Cleaning up old directories..."
rm -rf src/agent-skills
rm -rf test/agent-skills

# Update package.json test paths if needed
echo "🔍 Checking for test path updates needed..."
if grep -q "test/agent-skills" package.json 2>/dev/null; then
  echo "⚠️  Update package.json test paths manually from test/agent-skills to .github/skills"
fi

# Search for any import references that need updating
echo "🔍 Searching for import references to update..."
echo ""
if grep -r "from.*agent-skills" src/ pages/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -5; then
  echo ""
  echo "⚠️  Found import references that may need updating:"
  echo "   Update imports from: '@/agent-skills/...' or 'src/agent-skills/...'"
  echo "   To: '.github/skills/...'"
else
  echo "✅ No import references found to update"
fi

echo ""
echo "✅ Agent skills reorganization complete!"
echo ""
echo "📍 New structure:"
echo "   .github/skills/mock-data-validator/"
echo "   ├── SKILL.md"
echo "   ├── mock-data-validator.ts"
echo "   └── mock-data-validator.test.ts"
echo ""
echo "   .github/skills/semantic-file-search/"
echo "   ├── SKILL.md"
echo "   ├── semantic-file-search.ts"
echo "   ├── semantic-file-search.test.ts"
echo "   └── SEMANTIC_FILE_SEARCH.md"
echo ""
echo "   .github/skills/storybook-validation/"
echo "   ├── SKILL.md"
echo "   ├── storybook-validation.ts"
echo "   └── storybook-validation.test.ts"
echo ""
echo "📋 Next steps:"
echo "   1. Review the created SKILL.md files"
echo "   2. Update any imports in your code if needed"
echo "   3. Update package.json test scripts if necessary"
echo "   4. Enable chat.useAgentSkills in VS Code settings"
echo "   5. Test skills: 'Validate mock data for ChatSidebar'"
echo ""
