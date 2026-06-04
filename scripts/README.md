# Scripts Directory

Utility scripts for development, testing, and automation.

## Testing Scripts

### LLM-as-a-Judge: Chat Tools Testing

**File**: `test-chat-tools-llm-judge.ts`  
**Purpose**: Automated testing of all chat tool implementations using Claude 4.5 as a judge

```bash
# Run all tests
npx tsx scripts/test-chat-tools-llm-judge.ts

# Verbose mode
npx tsx scripts/test-chat-tools-llm-judge.ts --verbose

# Test specific tool
npx tsx scripts/test-chat-tools-llm-judge.ts --tool=create_section
```

**Features**:
- Tests all 12 CRUD chat tools
- Claude 4.5 evaluates response quality (0-100 score)
- Generates JSON test reports
- Automatically manages test resources

**Prerequisites**:
- `ANTHROPIC_API_KEY` environment variable
- Development server or Storybook running
- AWS credentials configured

## Storybook Scripts

### Generate Story Inventory

**File**: `generate-story-inventory.ts`  
**Purpose**: Catalogs all Storybook stories for validation

```bash
npx tsx scripts/generate-story-inventory.ts
```

### Validate Component Mocks

**File**: `validate-component-mocks.ts`  
**Purpose**: Validates that mock data matches component prop types

```bash
npx tsx scripts/validate-component-mocks.ts
```

## Translation Scripts

### Multi-Model AI Translation

**Directory**: `.github/skills/multi-model-ai-translation/scripts/`

**Translate with Proof**:
```bash
npx tsx .github/skills/multi-model-ai-translation/scripts/translate-with-proof.ts <namespace> <source> <target>
```

**Translate Missing with Consensus**:
```bash
npx tsx .github/skills/multi-model-ai-translation/scripts/translate-missing-with-consensus.ts <namespace> <source> <target> [provable]
```

**Documentation**: [Multi-Model AI Translation SKILL.md](../.github/skills/multi-model-ai-translation/SKILL.md)

## Admin Scripts

### Manage Admins

**File**: `manage-admins.js`  
**Purpose**: Add or remove admin users from Cognito groups

```bash
node scripts/manage-admins.js
```

## MUI Scripts

### Extract MUI Props

**File**: `extract-mui-props.mjs`  
**Purpose**: Extract Material-UI component prop documentation

```bash
node scripts/extract-mui-props.mjs
```

## Package.json Scripts

All scripts can also be run via npm/yarn:

```json
{
  "scripts": {
    // Testing
    "test:chat-tools": "tsx scripts/test-chat-tools-llm-judge.ts",
    "test:chat-tools:verbose": "tsx scripts/test-chat-tools-llm-judge.ts --verbose",
    "test": "vitest",
    "test:unit": "vitest run --exclude 'test/integration/**'",
    "test:integration": "vitest run test/integration",
    
    // Storybook
    "storybook:inventory": "tsx scripts/generate-story-inventory.ts",
    "storybook:validate-mocks": "vitest run test/storybook/validate-mocks.test.ts",
    "storybook:validate-components": "tsx scripts/validate-component-mocks.ts",
    "storybook:test": "npm run storybook:inventory && npm run storybook:validate-mocks && npm run storybook:validate-components && npm run typecheck",
    
    // Admin
    "manage-admins": "node scripts/manage-admins.js",
    
    // MUI
    "extract:mui-props": "node scripts/extract-mui-props.mjs"
  }
}
```

## Development Workflow

### Before Committing

```bash
# Run type checking
npm run typecheck

# Run unit tests
npm run test:unit

# Validate Storybook
npm run storybook:test
```

### After Tool Changes

```bash
# Test chat tools automatically
npm run test:chat-tools

# Or run manually in Storybook
npm run storybook
# Then test via ChatSidebar component
```

### After Translation Changes

```bash
# Validate translation keys
npm run lint:translate

# Generate translation report
npm run lint:translate:report
```

## Environment Variables

Many scripts require environment variables:

```bash
# For LLM judge testing
export ANTHROPIC_API_KEY="sk-ant-..."

# For AWS operations
export AWS_PROFILE="your-profile"

# For OpenAI features
export OPENAI_API_KEY="sk-..."

# For Gemini features
export GEMINI_API_KEY="..."
```

## Creating New Scripts

### TypeScript Script Template

```typescript
#!/usr/bin/env tsx
/**
 * Script Name
 * 
 * Description of what this script does
 * 
 * Usage:
 *   npx tsx scripts/my-script.ts [options]
 */

import fs from 'fs';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  
  // Script logic here
  console.log('Running script...');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
```

### JavaScript Script Template

```javascript
#!/usr/bin/env node
/**
 * Script Name
 * 
 * Description
 * 
 * Usage:
 *   node scripts/my-script.js [options]
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  // Script logic here
  console.log('Running script...');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
```

## Best Practices

1. **Add documentation**: Include usage comments at the top
2. **Make executable**: `chmod +x scripts/my-script.ts`
3. **Handle errors**: Always wrap main logic in try/catch
4. **Log progress**: Use console.log for user feedback
5. **Accept arguments**: Use process.argv for flexibility
6. **Exit cleanly**: Use process.exit(0) for success, (1) for errors

## Troubleshooting

### tsx not found

```bash
npm install tsx --save-dev
```

### Permission denied

```bash
chmod +x scripts/my-script.ts
```

### Module not found

```bash
npm install <missing-module> --save-dev
```

### AWS credentials error

```bash
aws configure
# OR
aws sso login
```

## Related Documentation

- [ONBOARDING.md](../docs/ONBOARDING.md) - Developer setup
- [API.md](../docs/API.md) - Data models and GraphQL API
