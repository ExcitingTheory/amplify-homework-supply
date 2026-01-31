# Query Expansion Rules

Detailed rules for how semantic-file-search expands natural language queries.

## Expansion Strategies

### 1. Synonym Expansion

**Input**: "DataStore subscriptions"  
**Expanded**:
- `observeQuery`
- `subscribe`
- `subscription`
- `observe`
- `.observeQuery(`
- `DataStore.observeQuery`

---

### 2. Pattern Variation

**Input**: "save function"  
**Expanded**:
- `save\(`
- `async.*save`
- `function save`
- `const save =`
- `= async save`
- `DataStore.save`

---

### 3. Framework-Specific Patterns

#### React Patterns
**Input**: "component state"  
**Expanded**:
- `useState`
- `useReducer`
- `this.state`
- `setState`
- `const \[.*,.*\] = useState`

**Input**: "context provider"  
**Expanded**:
- `createContext`
- `useContext`
- `Context.Provider`
- `<.*Provider>`
- `React.createContext`

---

#### Amplify Patterns
**Input**: "auth user"  
**Expanded**:
- `getCurrentUser`
- `fetchAuthSession`
- `signIn`
- `signOut`
- `Auth.currentAuthenticatedUser`
- `session.username`

**Input**: "storage upload"  
**Expanded**:
- `uploadData`
- `Storage.put`
- `aws-amplify/storage`
- `uploadData({`
- `.result`

---

#### Lexical Editor Patterns
**Input**: "custom node"  
**Expanded**:
- `DecoratorNode`
- `ElementNode`
- `LexicalNode`
- `createNode`
- `$createNode`
- `export class.*Node extends`

---

### 4. File Extension Mapping

**Input**: "component"  
**File patterns**:
- `*.tsx`
- `*.jsx`
- `*Component.ts`
- `*Component.js`

**Input**: "context"  
**File patterns**:
- `*Context.ts`
- `*Context.js`
- `*/context/*.ts`

**Input**: "test"  
**File patterns**:
- `*.test.ts`
- `*.spec.ts`
- `*.test.tsx`
- `__tests__/*`

---

### 5. Case Variation

**Input**: "DataStore"  
**Expanded**:
- `DataStore` (PascalCase)
- `dataStore` (camelCase)
- `data-store` (kebab-case)
- `data_store` (snake_case)
- `DATASTORE` (UPPERCASE)

---

### 6. Import Statement Detection

**Input**: "Material UI"  
**Expanded**:
- `from '@mui/material'`
- `import.*@mui`
- `import { .* } from '@mui/material'`

**Input**: "Amplify"  
**Expanded**:
- `from 'aws-amplify'`
- `import.*aws-amplify`
- `@aws-amplify`

---

### 7. GraphQL Query Detection

**Input**: "list units"  
**Expanded**:
- `listUnits`
- `query ListUnits`
- `API.graphql.*listUnits`
- `client.models.Unit.list()`

---

### 8. TypeScript Type Detection

**Input**: "Unit type"  
**Expanded**:
- `interface Unit`
- `type Unit =`
- `Unit extends`
- `: Unit`
- `<Unit>`

---

## Query Expansion Examples

### Example 1: DataStore Subscriptions
**Query**: "Find all DataStore subscriptions"

**Expansion**:
```typescript
{
  semantic: "DataStore subscriptions real-time updates observeQuery",
  grep: [
    "DataStore.observeQuery",
    "\\.observeQuery\\(",
    "subscription.*DataStore",
    "observe.*query"
  ],
  filename: [
    "*Context.ts",
    "*Context.js"
  ]
}
```

---

### Example 2: Component Props
**Query**: "Components that accept messages prop"

**Expansion**:
```typescript
{
  semantic: "messages prop parameter component interface",
  grep: [
    "messages:.*\\[\\]",
    "\\{ messages \\}",
    "props\\.messages",
    "interface.*Props.*messages"
  ],
  filename: [
    "*.tsx",
    "*.jsx",
    "*Component.tsx"
  ]
}
```

---

### Example 3: Error Handling
**Query**: "Error handling patterns"

**Expansion**:
```typescript
{
  semantic: "try catch error handling exception",
  grep: [
    "try \\{",
    "catch \\(.*error",
    "throw new Error",
    "console\\.error",
    "\.catch\\("
  ],
  filename: [
    "**/*.ts",
    "**/*.tsx"
  ]
}
```

---

### Example 4: Custom Hooks
**Query**: "Custom React hooks"

**Expansion**:
```typescript
{
  semantic: "custom hook useState useEffect React",
  grep: [
    "export (const|function) use[A-Z]",
    "= \\(\\) => \\{.*useState",
    "function use[A-Z][a-zA-Z]*\\("
  ],
  filename: [
    "use*.ts",
    "use*.tsx",
    "hooks/*.ts"
  ]
}
```

---

## Relevance Scoring

Search results are scored based on:

### 1. Exact Match (Score: 100)
- Query term appears exactly in file

### 2. Partial Match (Score: 70-90)
- Synonym or variation appears
- Case-insensitive match

### 3. Semantic Match (Score: 50-70)
- Semantically related terms
- Context-based relevance

### 4. Filename Match (Score: 60-80)
- Query term in filename
- Path segment match

### 5. Import/Export Match (Score: 80-95)
- Query term in import statement
- Named export match

---

## Filtering Rules

### Exclude Patterns (Default)
- `node_modules/`
- `.git/`
- `build/`
- `dist/`
- `*.min.js`
- `*.map`
- `.next/`
- `amplify_outputs.json`

### Include Patterns (Override)
When user specifies location:
- "in src/" → `includePattern: "src/**"`
- "context files" → `includePattern: "**/*Context.{ts,js}"`

---

## Query Pre-processing

### 1. Stop Word Removal
Remove: "the", "a", "an", "in", "on", "at", "for"

**Before**: "Find the DataStore subscriptions in the context"  
**After**: "DataStore subscriptions context"

---

### 2. Stemming
**Before**: "running", "runs", "runner"  
**After**: "run"

---

### 3. Phrase Detection
**Input**: "error handling"  
**Treated as**: Single phrase, not separate terms

---

### 4. Technology Detection
Detect and expand technology names:

- "MUI" → "Material UI", "@mui/material"
- "AWS" → "aws-amplify", "Amazon Web Services"
- "TS" → "TypeScript"

---

## Advanced Expansion

### Regex Pattern Generation

**Input**: "useState with number"  
**Generated Regex**:
```regex
const \[([a-zA-Z]+), set[A-zA-Z]+\] = useState<number>\(
```

**Input**: "async function that saves"  
**Generated Regex**:
```regex
async function [a-zA-Z]*[Ss]ave[a-zA-Z]*\(
```

---

### AST-Based Detection

For complex queries, use AST parsing:

**Input**: "Functions that call DataStore.save with Unit model"

1. Parse files with TypeScript compiler
2. Find function declarations
3. Check for `DataStore.save()` calls
4. Verify first argument is `Unit` type

---

## Configuration

### Custom Expansion Rules

```typescript
// In scripts/semantic-file-search.ts
const customExpansions = {
  'homework': ['assignment', 'grade', 'submission'],
  'learner': ['student', 'user', 'owner'],
  'instructor': ['teacher', 'admin', 'moderator']
};
```

### Weight Adjustments

```typescript
const scoringWeights = {
  exactMatch: 100,
  filenameMatch: 80,
  importMatch: 85,
  semanticMatch: 60,
  partialMatch: 75
};
```
