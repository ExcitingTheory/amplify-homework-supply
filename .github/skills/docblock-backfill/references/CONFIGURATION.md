# Configuration

Configuration options for docblock backfill behavior.

## Configuration File

Create `.docblock-backfill.json` in project root:

``` json
{
  "include": ["src/**/*.{ts,tsx,js,jsx}"],
  "exclude": ["**/*.test.*", "**/*.stories.*"],
  "localeDir": "public/locales/en",
  "templates": {
    "component": "jsdoc",
    "page": "tsdoc",
    "utility": "jsdoc"
  },
  "validation": {
    "requireFileDocblock": true,
    "requireMetadata": true,
    "validateParams": true,
    "strict": false
  },
  "output": {
    "reportFormat": "json",
    "reportPath": "./docblock-report.json",
    "verbose": true
  }
}
```

## Configuration Options

### File Discovery

#### `include` (string[])

Glob patterns for files to process.

**Default:**
```json
[
  "src/components/**/*.{ts,tsx,js,jsx}",
  "pages/**/*.{ts,tsx,js,jsx}",
  "src/utils/**/*.{ts,tsx,js,jsx}"
]
```

#### `exclude` (string[])

Glob patterns for files to skip.

**Default:**
```json
[
  "**/*.test.*",
  "**/*.stories.*",
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**"
]
```

#### `localeDir` (string)

Path to English locale files directory.

**Default:** `"public/locales/en"`

### Template Selection

#### `templates` (object)

Template format for each file type.

**Options:**
- `"jsdoc"` - Standard JSDoc format
- `"tsdoc"` - TypeScript-enhanced TSDoc
- `"minimal"` - Minimal auto-generated format

**Default:**
```json
{
  "component": "jsdoc",
  "page": "jsdoc",
  "utility": "jsdoc",
  "context": "jsdoc",
  "hook": "jsdoc"
}
```

### Validation

#### `validation.requireFileDocblock` (boolean)

Enforce file-level docblock presence.

**Default:** `true`

**Effect:** Files without docblocks generate warnings/errors.

#### `validation.requireMetadata` (boolean)

Require `@metadata` section if locale metadata exists.

**Default:** `true`

**Effect:** Components with locale entries must have metadata in docblock.

#### `validation.validateParams` (boolean)

Check parameter documentation matches function signature.

**Default:** `true`

**Effect:** Documented params must exist in code.

#### `validation.strict` (boolean)

Treat all issues as errors (blocks CI).

**Default:** `false`

**Effect:** When `true`, warnings become errors.

#### `validation.allowMissingDescriptions` (boolean)

Allow docblocks without `@description` section.

**Default:** `false`

**Effect:** Minimal docblocks are acceptable.

#### `validation.customRules` (array)

Custom validation rules by file pattern.

**Example:**
```json
{
  "validation": {
    "customRules": [
      {
        "pattern": "src/components/**",
        "require": ["@component", "@metadata"],
        "severity": "error"
      },
      {
        "pattern": "pages/**",
        "require": ["@page", "@route"],
        "severity": "warning"
      }
    ]
  }
}
```

### Output

#### `output.reportFormat` (string)

Report output format.

**Options:** `"json"`, `"markdown"`, `"html"`, `"console"`

**Default:** `"json"`

#### `output.reportPath` (string)

Where to save reports.

**Default:** `"./docblock-report.json"`

#### `output.verbose` (boolean)

Detailed console output.

**Default:** `true`

**Effect:** Shows progress for each file.

#### `output.dryRun` (boolean)

Preview changes without writing files.

**Default:** `false`

**Effect:** Only logs what would change.

## Environment Variables

### `DOCBLOCK_LOCALE_DIR`

Override locale directory from environment.

```bash
export DOCBLOCK_LOCALE_DIR=public/locales/en-US
npx tsx scripts/backfill-docblocks.ts
```

### `DOCBLOCK_DRY_RUN`

Enable dry-run mode from environment.

```bash
export DOCBLOCK_DRY_RUN=true
npx tsx scripts/backfill-docblocks.ts
```

### `DOCBLOCK_STRICT`

Enable strict validation from environment.

```bash
export DOCBLOCK_STRICT=true
npx tsx scripts/validate-docblocks.ts
```

## CLI Overrides

CLI arguments override config file and environment variables.

```bash
# Override locale directory
npx tsx scripts/sync-metadata.ts --locale-dir=custom/path

# Force dry-run
npx tsx scripts/backfill-docblocks.ts --dry-run

# Strict validation
npx tsx scripts/validate-docblocks.ts --strict

# Custom report path
npx tsx scripts/validate-docblocks.ts --report --report-path=./custom-report.json
```

## Example Configurations

### Minimal (Relaxed)

```json
{
  "include": ["src/**/*.tsx"],
  "validation": {
    "requireFileDocblock": false,
    "requireMetadata": false,
    "strict": false,
    "allowMissingDescriptions": true
  }
}
```

Best for: Legacy codebases, gradual adoption

### Standard (Balanced)

```json
{
  "include": [
    "src/components/**/*.{ts,tsx}",
    "pages/**/*.{ts,tsx}"
  ],
  "exclude": ["**/*.test.*", "**/*.stories.*"],
  "validation": {
    "requireFileDocblock": true,
    "requireMetadata": true,
    "validateParams": true,
    "strict": false
  }
}
```

Best for: Most projects, recommended default

### Strict (Enforce Quality)

```json
{
  "include": ["src/**/*.{ts,tsx}"],
  "exclude": ["**/*.test.*"],
  "validation": {
    "requireFileDocblock": true,
    "requireMetadata": true,
    "validateParams": true,
    "strict": true,
    "allowMissingDescriptions": false,
    "customRules": [
      {
        "pattern": "src/components/**",
        "require": ["@component", "@metadata", "@example"]
      }
    ]
  }
}
```

Best for: New projects, high-quality documentation requirements

### TypeScript Only

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ],
  "exclude": ["**/*.js", "**/*.jsx"],
  "templates": {
    "component": "tsdoc",
    "page": "tsdoc",
    "utility": "tsdoc"
  },
  "validation": {
    "requireFileDocblock": true,
    "validateParams": true
  }
}
```

Best for: TypeScript-only projects

### Component Library

```json
{
  "include": ["src/components/**/*.tsx"],
  "exclude": [
    "**/internal/**",
    "**/*.test.*"
  ],
  "validation": {
    "requireFileDocblock": true,
    "requireMetadata": true,
    "customRules": [
      {
        "pattern": "src/components/**/index.tsx",
        "require": ["@component", "@example", "@metadata"]
      }
    ]
  },
  "output": {
    "reportFormat": "markdown",
    "reportPath": "./docs/component-documentation-status.md"
  }
}
```

Best for: Published component libraries

## Priority Order

Configuration is loaded in this order (later overrides earlier):

1. Default values (hardcoded)
2. `.docblock-backfill.json` in project root
3. Environment variables (`DOCBLOCK_*`)
4. CLI arguments (`--locale-dir`, `--dry-run`, etc.)

## Validation

Config file schema validation on load:

```typescript
interface Config {
  include?: string[];
  exclude?: string[];
  localeDir?: string;
  templates?: {
    component?: 'jsdoc' | 'tsdoc' | 'minimal';
    page?: 'jsdoc' | 'tsdoc' | 'minimal';
    utility?: 'jsdoc' | 'tsdoc' | 'minimal';
  };
  validation?: {
    requireFileDocblock?: boolean;
    requireMetadata?: boolean;
    validateParams?: boolean;
    strict?: boolean;
    allowMissingDescriptions?: boolean;
    customRules?: Array<{
      pattern: string;
      require: string[];
      severity?: 'error' | 'warning';
    }>;
  };
  output?: {
    reportFormat?: 'json' | 'markdown' | 'html' | 'console';
    reportPath?: string;
    verbose?: boolean;
    dryRun?: boolean;
  };
}
```

Invalid config throws error on startup.
