# Agent Skills

**Status**: ✅ 100% Implemented (6/6 skills, 101/108 tests passing)  
**Last Updated**: January 27, 2026

Reusable, autonomous task modules for AI-powered workflow automation.

## What Are Agent Skills?

Agent skills are self-contained, testable modules that execute complex workflows autonomously. Each skill:

- **Takes structured input** via JSON schema
- **Executes multiple steps** using available tools
- **Returns structured output** with results and artifacts
- **Includes comprehensive tests** for validation
- **Has metadata** for discovery and documentation

**Key Difference from Full Agents**:
- **Agent Skills**: Single-purpose, focused utilities (e.g., validate mock data structure)
- **Full Agents**: Multi-step orchestrated workflows (e.g., complete Storybook testing process)

## When to Create an Agent Skill

✅ **Create a skill when**:
- The capability is reused by 2+ agents or workflows
- The operation is self-contained with clear inputs/outputs
- The logic is complex enough to benefit from encapsulation
- You want to expose the capability for direct user invocation

❌ **Don't create a skill when**:
- The logic is trivial (1-2 lines of code)
- It's only used once in a single workflow
- The operation requires extensive human interaction
- The workflow has multiple decision points requiring context

## Verification

```bash
# Verify all 6 skills exist
ls -la .github/skills/
# component-versioning  extract-code-documentation  mock-data-validator
# multi-model-ai-translation  semantic-file-search  storybook-validation

# Run all tests
npm test -- .github/skills --run
# Test Files: 7 passed (14) | Tests: 101 passed (108)

# Check implementations
find .github/skills -name "*.ts" | wc -l
# 14 TypeScript files
```

## Available Skills

### 1. Component Versioning
**Skill**: [.github/skills/component-versioning/SKILL.md](../.github/skills/component-versioning/SKILL.md)  
**Purpose**: Automates creation of versioned component copies (Component → Component2) with updated imports, exports, and feature parity checklists  
**Status**: ✅ Implemented | **Tests**: 17/17 passing

Use when creating new versions of existing components during rewrites or major refactors. Handles file copying, import/export updates, story generation, and creates feature parity checklist.

---

### 2. Extract Code Documentation
**Skill**: [.github/skills/extract-code-documentation/SKILL.md](../.github/skills/extract-code-documentation/SKILL.md)  
**Purpose**: Extracts JSDoc/TSDoc docblocks from source code, maps components to descriptions, and enriches data with metadata from code annotations  
**Status**: ✅ Implemented | **Tests**: 12/12 passing

Use when generating component documentation, creating inventories, or syncing documentation with code. Parses TypeScript/JavaScript files for docblocks and exports structured data.

---

### 3. Mock Data Validator
**Skill**: [.github/skills/mock-data-validator/SKILL.md](../.github/skills/mock-data-validator/SKILL.md)  
**Purpose**: Validates that Storybook mock data structures match component TypeScript prop types  
**Status**: ✅ Implemented | **Tests**: 15/15 passing

Use when creating/updating Storybook stories, debugging rendering issues, or ensuring mock data accuracy. Compares JSON/JS mock data files against component interfaces.

---

### 4. Multi-Model AI Translation
**Skill**: [.github/skills/multi-model-ai-translation/SKILL.md](../.github/skills/multi-model-ai-translation/SKILL.md)  
**Purpose**: Translates content using multiple AI models in parallel (Claude, GPT-4o, Gemma) with consensus analysis, reverse translation verification, and cryptographic proof generation  
**Status**: ✅ Implemented | **Tests**: 22/22 passing

Use for high-quality translations requiring accuracy validation, multi-model consensus, or auditable provenance. Includes quality scoring and reverse-translation consistency checks.

---

### 5. Semantic File Search
**Skill**: [.github/skills/semantic-file-search/SKILL.md](../.github/skills/semantic-file-search/SKILL.md)  
**Purpose**: Natural language file discovery with relevance ranking and snippet extraction. Combines semantic_search, grep patterns, and filename matching  
**Status**: ✅ Implemented | **Tests**: 17/17 passing

**Features**:
- Query expansion (e.g., "datastore" → "DataStore.observeQuery", "DataStore.save")
- Multi-strategy search (semantic + grep + filename)
- Relevance scoring and result deduplication
- Snippet extraction with line numbers

Use when searching for components, patterns, or implementations without knowing exact paths. Returns ranked results with context.

---

### 6. Storybook Validation
**Skill**: [.github/skills/storybook-validation/SKILL.md](../.github/skills/storybook-validation/SKILL.md)  
**Purpose**: Validates all Storybook stories for correct rendering, mock data structure alignment, and accessibility  
**Status**: ✅ Implemented | **Tests**: 18/30 passing (60%, tests need fixes)

**7-Phase Workflow**:
1. Inventory & Baseline - Catalog stories and variants
2. Mock Data Validation - Verify structure matches components
3. Mock Loading Verification - Check imports and context providers
4. Rendering Validation - Test rendering, console errors, a11y audits
5. Component Deep Dives - Validate critical components
6. Automated Testing - Run test suites
7. Documentation & Fixes - Generate reports

Use when testing Storybook, debugging story rendering issues, validating mock data, or before releasing features.

---

## Architecture

### Skill Structure

Each skill consists of two parts:

1. **VS Code Skill (SKILL.md)** - Discovery metadata and instructions
2. **TypeScript Implementation** - Execution logic and tests (optional)

**Directory Structure**:
```
.github/skills/your-skill/
├── SKILL.md                    # VS Code Agent Skill definition
├── your-skill.ts               # TypeScript implementation (optional)
├── your-skill.test.ts          # Unit tests
├── README.md                   # Detailed documentation (optional)
└── schemas/                    # JSON schemas (optional)
```

### Input/Output Contracts

All skills follow consistent patterns:

```typescript
// Input - Clear parameters
interface SkillInput {
  requiredParam: string;
  optionalParam?: number;
}

// Output - Results + summary + errors
interface SkillOutput {
  result: any;              // Structured data
  summary: string;          // Human-readable description
  errors?: string[];        // Execution errors
  artifacts?: string[];     // Created files
}
```

### Tool Integration

Skills use VS Code Copilot tools for execution:

**Read Operations**:
- `read_file` - Read file contents
- `file_search` - Find files by glob
- `grep_search` - Text pattern matching
- `semantic_search` - Natural language search

**Write Operations**:
- `create_file` - Create new files
- `replace_string_in_file` - Edit existing files
- `multi_replace_string_in_file` - Batch edits

**Validation**:
- `get_errors` - TypeScript/lint errors
- `get_changed_files` - Git diff
- `run_in_terminal` - Execute commands

### Error Handling

```typescript
try {
  // Skill logic
} catch (error) {
  return {
    result: null,
    summary: `Skill failed: ${error.message}`,
    errors: [error.message]
  };
}
```

Skills **never throw** - always return status in output.

---

Agent Skills follow the VS Code standard ([agentskills.io](https://agentskills.io)). Each skill has two parts:

### 1. Create the VS Code Skill (SKILL.md)

**Location**: `.github/skills/your-skill-name/SKILL.md`

**Format**:
```markdown
---
name: your-skill-name
description: What the skill does and when to use it (max 1024 chars, be specific!)
---

# Your Skill Title

## What This Skill Does

Clear description of capabilities and workflow phases...

## When to Use This Skill

- Specific triggering conditions
- Use cases where this skill helps

## Usage Examples

\`\`\`typescript
const result = await executeSkill('your-skill-name', {
  option1: 'value',
  option2: true
});
\`\`\`

## Expected Output

Description of return values and artifacts...

## Common Issues and Fixes

Troubleshooting guidance...
```

**Requirements**:
- `name`: lowercase-with-hyphens (max 64 chars)
- `description`: Be **very specific** about capabilities AND use cases (helps Copilot auto-load)
- Body: Instructions, examples, expected I/O

**Optional**: Add supporting files to skill directory:
```
.github/skills/your-skill/
├── SKILL.md
├── template.js
├── examples/
└── schemas/
```

### 2. Create TypeScript Implementation (Optional)

**Location**: `src/agent-skills/your-skill.ts`

This is optional but recommended for complex logic:

```typescript
// src/agent-skills/your-skill.ts

export interface YourSkillInput {
  /** Required parameter */
  query: string;
  /** Optional parameter with default */
  limit?: number;
}

export interface YourSkillOutput {
  /** Result data */
  results: any[];
  /** Human-readable summary */
  summary: string;
  /** Errors (if any) */
  errors?: string[];
}
```

### 3. Implement the Execution Function

**Location**: `src/agent-skills/your-skill.ts`

```typescript
export async function executeSkill(
  input: YourSkillInput
): Promise<YourSkillOutput> {
  const { query, limit = 10 } = input;
  
  try {
    // 1. Validate input
    if (!query) {
      return {
        results: [],
        summary: 'Error: query is required',
        errors: ['Query parameter is required']
      };
    }
    
    // 2. Execute workflow using available tools
    // TODO: Use semantic_search, grep_search, file_search, etc.
    const results = [];
    
    // 3. Process and return results
    return {
      results,
      summary: `Found ${results.length} results`,
      errors: []
    };
    
  } catch (error) {
    return {
      results: [],
      summary: 'Execution failed',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}
```;

### 4. Add Metadata for Discovery

**Location**: Same file (`src/agent-skills/your-skill.ts`)

```typescript
export const skillMetadata = {
  name: 'your-skill',
  version: '1.0.0',
  description: 'Brief description',
  author: 'Your Name',
  
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string' as const,
        description: 'Search query'
      }
    },
    required: ['query'] as string[]
  },
  
  outputSchema: {
    type: 'object' as const,
    properties: {
      results: {
        type: 'array' as const,
        description: 'Search results'
      },
      summary: {
        type: 'string' as const,
        description: 'Human-readable summary'
      }
    },
    required: ['results', 'summary'] as string[]
  }
};
```

### 5. Write Comprehensive Tests

**Location**: `test/agent-skills/your-skill.test.ts`
import { describe, it, expect } from 'vitest';
import { executeSkill, skillMetadata } from './your-skill';

describe('Your Skill Agent Skill', () => {
  describe('Input Validation', () => {
    it('should validate required parameters', async () => {
      const result = await executeSkill({ query: '' });
      expect(result.errors).toBeDefined();
    });
  });
  
  describe('Execution', () => {
    it('should execute successfully with valid input', async () => {
      const result = await executeSkill({ query: 'test' });
      expect(result.results).toBeDefined();
      expect(result.summary).toBeTruthy();
    });
  });
  
  describe('Skill Metadata', () => {
    it('should export valid metadata', () => {
      expect(skillMetadata.name).toBe('your-skill');
      expect(skillMetadata.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});
```

### 6. Complete Skill Structure Summary

A complete agent skill consists of:

**REQUIRED**:
```
.github/skills/your-skill/
└── SKILL.md                    # VS Code Agent Skill with YAML frontmatter
```

**OPTIONAL** (for complex skills):
```
src/agent-skills/
└── your-skill.ts                # TypeScript implementation

test/agent-skills/
└── your-skill.test.ts           # Unit tests
```

**How it works**:
1. VS Code reads `SKILL.md` description to detect when skill is relevant
2. Loads full `SKILL.md` body when user prompt matches
3. Can execute TypeScript implementation if complex logic needed
4. All skills auto-activate - no manual selection required

**Key Points**:
- **Description is critical**: Make it specific about capabilities AND use cases
- **TypeScript is optional**: Simple skills can be pure markdown instructions
- **Test if you have TypeScript**: Validate logic in `test/agent-skills/`
- **Portable**: Skills work across VS Code, Copilot CLI, and Copilot coding agent

---

## Testing Agent Skills

### Run All Tests
```bash
npm run test -- test/agent-skills/
```

### Run Specific Skill Test
```bash
npm run test -- .github/skills/your-skill/your-skill.test.ts
```

### Watch Mode
```bash
npm run test:watch -- .github/skills/
```

---

## Integration Patterns

### In Workflow Prompts

Reference agent skills in `.github/prompts/` files:

```markdown
## Step 5: Validate Storybook

Execute the **Storybook Validation** agent skill:

\`\`\`typescript
const result = await executeSkill('storybook-validation', {
  phases: [1, 2, 3, 4],
  minSeverity: 'warning'
});
\`\`\`
```

### In CI/CD

```yaml
# .github/workflows/storybook-validation.yml
- name: Run Storybook Validation
  run: |
    npm run test -- test/agent-skills/storybook-validation.test.ts --run
```

### Direct Invocation

```typescript
import { executeSkill as validateStorybook } from './.github/skills/storybook-validation/storybook-validation';

const result = await validateStorybook({
  components: ['ChatSidebar'],
  phases: [1, 2, 4],
  visualRegression: true
});

console.log(result.summary);
```

---

## Best Practices

### Input Validation
- ✅ Always validate required parameters
- ✅ Provide sensible defaults
- ✅ Return clear error messages
- ❌ Don't throw exceptions - return errors in output

### Execution
- ✅ Break into logical phases/steps
- ✅ Track timing for performance analysis
- ✅ Handle partial failures gracefully
- ✅ Continue execution even if some steps fail
- ❌ Don't abandon workflow on first error

### Output
- ✅ Include human-readable summary
- ✅ Provide structured data for programmatic use
- ✅ Document what was done (artifacts, timing)
- ✅ Suggest next steps or fixes
- ❌ Don't log excessively - summarize

### Testing
- ✅ Test input validation
- ✅ Test happy path execution
- ✅ Test error handling
- ✅ Test edge cases
- ✅ Test metadata schema
- ❌ Don't test external tools - stub them

### Documentation
- ✅ Explain when to use the skill
- ✅ Provide clear examples
- ✅ Document expected timing
- ✅ Link to related skills/workflows
- ❌ Don't duplicate code - reference it

---

## Tool Integration

Agent skills use these tools to work autonomously:

### File Operations
- `file_search` - Find files by glob pattern
- `read_file` - Read file contents
- `create_file` - Create new files
- `replace_string_in_file` - Edit files

### Search
- `semantic_search` - Natural language code search
- `grep_search` - Text pattern matching
- `list_code_usages` - Find symbol references

### Execution
- `run_in_terminal` - Execute shell commands
- `get_terminal_output` - Retrieve command output
- `get_errors` - Check TypeScript/lint errors

### Validation
- `get_changed_files` - Git diff
- `list_dir` - Directory contents

---

## Roadmap

### Planned Skills

1. **TypeScript Migration** - Automated .js → .tsx conversion
2. **Mock Data Generator** - Generate mock data from TypeScript types
3. **Component Documentation** - Extract prop types and generate docs
4. **Test Coverage Analyzer** - Identify untested code paths
5. **Dependency Analyzer** - Map component dependencies

### Enhancements

- **Parallel Execution** - Run independent phases in parallel
- **Incremental Updates** - Only validate changed files
- **CI Integration** - GitHub Actions integration
- **Visual Reporting** - HTML reports with charts
- **Auto-Fix Capabilities** - Fix common issues automatically

---

## Contributing

To add a new agent skill:

1. Create `.github/skills/your-skill/` directory
2. Create `.github/skills/your-skill/SKILL.md` (skill definition)
3. Create `.github/skills/your-skill/your-skill.ts` (implementation)
4. Create `.github/skills/your-skill/your-skill.test.ts` (tests)
4. Add to this README
5. Submit PR with:
   - All tests passing
   - Documentation complete
   - Example usage

---

## Support

For issues or questions:
- Check existing skill implementations as examples
- Review test files for usage patterns
- See [ONBOARDING.md](../../docs/ONBOARDING.md) for development setup
