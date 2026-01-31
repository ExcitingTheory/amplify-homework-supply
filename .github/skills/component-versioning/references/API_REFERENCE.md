# Component Versioning API Reference

Complete API documentation for the component-versioning skill.

## Input Schema

```typescript
interface ComponentVersioningInput {
  /**
   * Absolute path to source component file
   * @example "src/components/ChatSidebar.tsx"
   */
  componentPath: string;

  /**
   * Target version number (default: auto-increment)
   * @example 2 (creates Component2)
   */
  targetVersion?: number;

  /**
   * Include Storybook stories in versioning
   * @default true
   */
  includeStories?: boolean;

  /**
   * Include test files in versioning
   * @default true
   */
  includeTests?: boolean;

  /**
   * Include CSS/style files in versioning
   * @default true
   */
  includeStyles?: boolean;

  /**
   * Custom checklist items to add
   * @example ["Verify real-time updates", "Test offline mode"]
   */
  customChecklist?: string[];

  /**
   * Dry run mode - preview changes without writing
   * @default false
   */
  dryRun?: boolean;
}
```

---

## Output Schema

```typescript
interface ComponentVersioningOutput {
  /**
   * Status of the operation
   */
  status: 'success' | 'error' | 'warning';

  /**
   * Files created during versioning
   */
  filesCreated: {
    path: string;
    sizeBytes: number;
    linesOfCode: number;
  }[];

  /**
   * Import references updated
   */
  importsUpdated: {
    file: string;
    oldImport: string;
    newImport: string;
  }[];

  /**
   * Generated feature parity checklist
   */
  checklist: {
    category: string;
    items: {
      description: string;
      priority: 'high' | 'medium' | 'low';
      automated: boolean;
    }[];
  }[];

  /**
   * Warnings or issues found
   */
  warnings?: string[];

  /**
   * Error message if status === 'error'
   */
  error?: string;
}
```

---

## CLI Usage

```bash
# Basic usage
npx tsx scripts/component-versioning.ts src/components/ChatSidebar.tsx

# Specify version
npx tsx scripts/component-versioning.ts src/components/Editor3.tsx --version 4

# Dry run
npx tsx scripts/component-versioning.ts src/components/Form.tsx --dry-run

# Skip stories
npx tsx scripts/component-versioning.ts src/components/Button.tsx --no-stories

# Custom checklist
npx tsx scripts/component-versioning.ts src/components/Grid.tsx \
  --checklist "Verify responsive layout,Test touch gestures"
```

---

## Feature Detection

The skill automatically detects:

### React Patterns
- Hooks (`useState`, `useEffect`, `useContext`)
- Context providers
- Refs and forward refs
- Memo and lazy components

### Amplify DataStore
- `DataStore.observeQuery()` calls
- `DataStore.save()` with OCC
- Model relationships (lazy loading)

### Lexical Editor
- Custom nodes
- Plugins
- Commands
- Decorators

### Material UI
- Theme usage
- Custom components
- Style overrides
- Responsive breakpoints

### TypeScript
- Interface definitions
- Type assertions
- Generic constraints
- Utility types

---

## Checklist Categories

Generated checklists are organized into:

1. **Core Functionality** - Essential features
2. **State Management** - Hooks, context, props
3. **Data Integration** - DataStore, API calls
4. **UI/UX** - Styling, responsive, accessibility
5. **Testing** - Unit tests, integration tests, stories
6. **Performance** - Memoization, lazy loading

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | File not found |
| 2 | Invalid syntax |
| 3 | Version conflict |
| 4 | Import resolution failed |

---

## Environment Variables

```bash
# Enable verbose logging
export COMPONENT_VERSIONING_DEBUG=true

# Skip user prompts (CI mode)
export COMPONENT_VERSIONING_NO_PROMPT=true

# Custom checklist template path
export COMPONENT_VERSIONING_TEMPLATE=/path/to/template.md
```

---

## Integration with Other Skills

### With `mock-data-validator`
```bash
# After versioning, validate mock data
npx tsx ../mock-data-validator/scripts/validate-component-mocks.ts \
  src/components/ChatSidebar2.tsx
```

### With `storybook-validation`
```bash
# Validate generated stories
npx tsx ../storybook-validation/scripts/generate-story-inventory.ts
```

### With `extract-code-documentation`
```bash
# Extract docblocks from new component
npx tsx ../extract-code-documentation/scripts/extract-component-docblocks.ts \
  src/components/ChatSidebar2.tsx
```
