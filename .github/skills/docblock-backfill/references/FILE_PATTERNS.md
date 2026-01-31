# File Discovery Patterns

Configuration for finding files that need docblocks.

## Default Include Patterns

```typescript
const include = [
  'src/components/**/*.{ts,tsx,js,jsx}',
  'pages/**/*.{ts,tsx,js,jsx}',
  'src/utils/**/*.{ts,tsx,js,jsx}',
  'src/context/**/*.{ts,tsx,js,jsx}'
];
```

### Pattern Explanations

- `src/components/**/*` - All React components (user-facing)
- `pages/**/*` - Next.js pages (all have user-facing strings)
- `src/utils/**/*` - Utilities that may have exported functions
- `src/context/**/*` - Context providers with public APIs

## Default Exclude Patterns

```typescript
const exclude = [
  '**/*.test.*',           // Test files
  '**/*.stories.*',        // Storybook stories
  '**/*.spec.*',           // Spec files
  '**/node_modules/**',    // Dependencies
  '**/.next/**',           // Next.js build output
  '**/dist/**',            // Build output
  '**/.storybook/**',      // Storybook config
  '**/__mocks__/**',       // Mock files
  '**/__tests__/**',       // Test directories
  '**/coverage/**'         // Coverage reports
];
```

## File Type Detection

Files are categorized by location:

| Path Pattern | Type | Docblock Template |
|--------------|------|-------------------|
| `src/components/**` | component | Component template with @component tag |
| `pages/**` | page | Page template with routing info |
| `src/utils/**` | utility | Utility template with @module tag |
| `src/context/**` | context | Context provider template |

## User-Facing String Detection

A file is considered to have user-facing strings if it contains:

- `t('...')` or `i18n.t('...')` - i18n translation calls
- `<Text>...</Text>` - React text components
- String literals in JSX: `<div>Text</div>`
- `console.log` excluded unless in error handlers
- `description`, `title`, `label` prop values

## Custom Pattern Configuration

Create `.docblock-backfill.json`:

```json
{
  "include": [
    "src/components/**/*.tsx",
    "custom-dir/**/*.{ts,js}"
  ],
  "exclude": [
    "**/*.private.ts"
  ],
  "fileTypeRules": {
    "custom-dir/**": {
      "type": "utility",
      "template": "jsdoc"
    }
  }
}
```

## Glob Pattern Syntax

- `**` - Matches any directory depth
- `*` - Matches any characters except `/`
- `{ts,tsx}` - Matches either extension
- `!pattern` - Negative pattern (exclude)

## Priority Order

When multiple patterns match:

1. Explicit file path (highest priority)
2. Most specific glob pattern
3. Directory-based rules
4. Default rules (lowest priority)

## Examples

### Include Only TypeScript Components

```json
{
  "include": ["src/components/**/*.tsx"],
  "exclude": ["**/*.js", "**/*.jsx"]
}
```

### Exclude Specific Directories

```json
{
  "exclude": [
    "**/*.test.*",
    "src/components/deprecated/**",
    "src/components/experimental/**"
  ]
}
```

### Custom Component Directories

```json
{
  "include": [
    "app/components/**/*.tsx",
    "lib/ui/**/*.tsx",
    "features/**/components/**/*.tsx"
  ]
}
```
