# Storybook Validation Skill

Self-contained skill for validating Storybook stories, mock data structures, and component rendering.

## ✅ Self-Contained Design

This skill folder is **fully self-contained** with all necessary dependencies included:

- ✅ **Scripts** - All validation scripts in `scripts/` folder
- ✅ **Tests** - Test files in `test/` folder  
- ✅ **Schemas** - Zod validation schemas in `schemas/` folder
- ✅ **Dependencies** - `package.json` with all required packages
- ✅ **Documentation** - SKILL.md and README.md

**No external file dependencies** - everything needed to run the skill is in this folder.

## Installation

### Option 1: Use Workspace Dependencies (Recommended)

When running from the main project workspace, dependencies are already installed:

```bash
# From workspace root
npx tsx .github/skills/storybook-validation/scripts/generate-story-inventory.ts
```

### Option 2: Standalone Installation

To use this skill folder independently in another project:

```bash
# Copy the entire skill folder to your project
cp -r .github/skills/storybook-validation /path/to/your/project/

# Install dependencies
cd /path/to/your/project/storybook-validation
npm install

# Run scripts
npm run inventory
npm run validate:mocks
npm run validate:components
```

## Folder Structure

```
storybook-validation/
├── package.json                # Dependencies and npm scripts
├── SKILL.md                    # Skill documentation
├── README.md                   # This file
├── storybook-validation.ts     # Main skill implementation
├── storybook-validation.test.ts # Skill tests
├── scripts/                    # Executable validation scripts
│   ├── generate-story-inventory.ts
│   └── validate-component-mocks.ts
├── test/                       # Test files
│   └── validate-mocks.test.ts
└── schemas/                    # Zod validation schemas
    ├── index.ts
    ├── chat.schema.ts
    ├── file.schema.ts
    ├── grade.schema.ts
    ├── lexical.schema.ts
    └── word.schema.ts
```

## Dependencies

All dependencies are specified in `package.json`:

**Runtime Dependencies:**
- `typescript` (^5.9.3) - For AST parsing of story files
- `glob` (^13.0.0) - For file pattern matching
- `zod` (^3.24.1) - For schema validation

**Dev Dependencies:**
- `tsx` (^4.21.0) - For executing TypeScript files
- `vitest` (^4.0.17) - For running tests
- `@types/node` (^20.19.30) - TypeScript definitions for Node.js
The `package.json` includes convenient npm scripts:

```bash
npm run inventory           # Generate story inventory
npm run validate:mocks      # Run Zod schema validation tests
npm run validate:components # Validate mock data vs component props
npm run validate:all        # Run all validations
npm run test                # Run skill implementation tests
```

### Generate Story Inventory

Creates a comprehensive markdown document listing all Storybook stories, variants, and metadata.

```bash
# Using npm script (from skill folder after npm install)
npm run inventory

# Or directly from workspace root
npx tsx .github/skills/storybook-validation/scripts/generate-story-inventory.ts

# Output: docs/STORYBOOK_INVENTORY.md
```

### Validate Component Mock Data

Validates that mock data used in stories matches component prop types.

```bash
# Using npm script
npm run validate:components

# Or directly
npx tsx .github/skills/storybook-validation/scripts/validate-component-mocks.ts [componentName]

# Example: Validate specific component
npx tsx .github/skills/storybook-validation/scripts/validate-component-mocks.ts ChatSidebar
```

### Run Mock Validation Tests

Runs Vitest tests to validate mock data against Zod schemas.

```bash
# Using npm script
npm run validate:mocks

# Or directlyo validate mock data against Zod schemas.

```bash
# From project root
npx vitest run .github/skills/storybook-validation/test/validate-mocks.test.ts
```

## GitHub Actions Integration

To use these scripts in GitHub Actions workflows, reference them from this folder:

```yaml
- name: Generate story inventory
  run: npx tsx .github/skills/storybook-validation/scripts/generate-story-inventory.ts

- name: Validate mock data schemas
  run: npx vitest run .github/skills/storybook-validation/test/validate-mocks.test.ts

- name: Validate component prop types
  run: npx tsx .github/skills/storybook-validation/scripts/validate-component-mocks.ts
```

## Updating Schemas

Zod schemas are located in the `schemas/` folder. These define the expected structure of mock data:

- `chat.schema.ts` - Chat message format (message.parts array)
- `file.schema.ts` - File/S3 object metadata
- `grade.schema.ts` - Grade data and nested grade data structure
- `lexical.schema.ts` - Lexical editor state (root.children, custom nodes)
- `word.schema.ts` - Vocabulary and question data

To add or modify schemas:

1. Edit the appropriate schema file
2. Update `schemas/index.ts` if adding a new schema file
3. Add corresponding test cases in `test/validate-mocks.test.ts`

## Local Development

When developing the skill itself:

```bash
# Run skill tests
npx vitest run .github/skills/storybook-validation/storybook-validation.test.ts

# Run script directly
npx tsx .github/skills/storybook-validation/scripts/generate-story-inventory.ts
```

## Common Issues

### TypeScript Compilation Errors

If scripts fail to parse TypeScript files, ensure your project's `tsconfig.json` is compatible:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
```

### Schema Validation Failures

Check that mock data files match the expected format:

```bash
# Run tests with detailed output
npx vitest run .github/skills/storybook-validation/test/validate-mocks.test.ts --reporter=verbose
```

###Portability

This skill folder is designed to be portable and can be copied to other projects:

**Included in this folder:**
- ✅ All scripts and implementation code
- ✅ All Zod validation schemas
- ✅ All test files
- ✅ `package.json` with all dependencies

**Required in target project:**
- A Storybook setup with story files in `src/` (configurable)
- Mock data in `.storybook/__mocks__/` (for validation tests)
- A `docs/` folder for output (configurable in scripts)

To use in another project:
1. Copy the entire `storybook-validation/` folder
2. Run `npm install` inside the folder
3. Adjust paths in scripts if your project structure differs
4. Run `npm run validate:all`
│   ├── files.json
│   └── ...
├── chatMockData.js
├── mockFileData.js
├── mockWordData.js
└── ...
```

## Self-Contained Design

This skill folder contains all necessary scripts and schemas, making it portable and independent from the main workspace structure. The only dependencies are:

1. **Node packages** (typescript, glob, vitest, zod, tsx) - installed via workspace `package.json`
2. **Workspace structure** - scripts expect workspace to have `src/`, `.storybook/`, and `docs/` folders

The skill can be copied to other projects as long as these dependencies are met.
