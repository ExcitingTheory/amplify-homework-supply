# Agent Permissions System

**Status**: 📋 Specification  
**Version**: 1.0.0  
**Last Updated**: March 14, 2026

Non-destructive permission controls for autonomous AI agents and CLI operations.

## Overview

This system defines what operations AI agents can perform autonomously vs. what requires human confirmation. The goal is to enable productive agent work while preventing accidental data loss or infrastructure damage.

## Configuration

**Location**: [.github/agent-permissions.json](.github/agent-permissions.json)  
**Schema**: [.github/schemas/agent-permissions-schema.json](.github/schemas/agent-permissions-schema.json)

## Permission Categories

### 1. File Operations

#### Read Operations
**Status**: ✅ Freely Allowed

Agents can read all files except:
- Environment variables (`.env*`)
- AWS credentials (`aws-exports.js`, `amplifyconfiguration.json`)
- Team provider info (`team-provider-info.json`)
- Node modules

#### Write Operations
**Status**: ⚠️ Path-Based Rules

**Freely Allowed** (no confirmation):
- Test files (`*.test.{ts,tsx,js,jsx}`)
- Story files (`*.stories.{ts,tsx,js,jsx}`)
- Documentation (`*.md`, `docs/**`)
- Agent skills (`.github/skills/**`)
- Mock data (`.storybook/__mocks__/**`)
- Translations (`public/locales/**`, `.translation-cache/**`)

**Confirmation Required**:
- Source code (`src/components/**`, `src/context/**`, `src/utils/**`)
- Pages (`pages/**`)
- Agent skill implementations (`src/agent-skills/**`)

**File Size Limits**:
- Max single file: 1 MB
- Max batch operation: 10 MB

#### Delete Operations
**Status**: 🚫 Mostly Blocked

**Allowed with confirmation**:
- Test files
- Documentation
- Translation cache

**Blocked**:
- All production code
- Configuration files
- Data files

#### Rename Operations
**Status**: ⚠️ Requires Confirmation

All file renames require explicit confirmation.

---

### 2. Terminal Commands

#### Allowed Commands

**NPM** (read-only):
```bash
npm test
npm run test:watch
npm run storybook
npm run lint
npm run type-check
```

**Git** (read-only):
```bash
git status
git diff
git log
git show
git branch
git blame
git grep
```

**Amplify** (status only):
```bash
amplify status
amplify console
```

**Shell** (read-only):
```bash
cat, ls, find, grep, head, tail, wc, which, pwd, echo
```

**Analysis** (check mode):
```bash
eslint
tsc
prettier --check
```

#### Blocked Commands

**Dangerous**:
```bash
rm, rmdir, del, sudo, chmod, chown, kill, pkill
```

**Network**:
```bash
curl, wget, ssh, scp, rsync
```

**Package Managers**:
```bash
npm install, yarn add, pnpm add, brew install
```

**Git Write Operations**:
```bash
git push, pull, fetch, reset, rebase, commit, add, checkout, merge
```

**Amplify Infrastructure**:
```bash
amplify push, pull, delete, remove, init
```

---

### 3. DataStore Operations

**Status**: 🚫 Blocked by Default

| Operation | Permission | Notes |
|-----------|-----------|-------|
| Query | ✅ Allowed | Read-only queries freely allowed |
| Save | 🚫 Blocked | Requires explicit confirmation |
| Delete | 🚫 Blocked | Requires explicit confirmation |
| Clear | 🚫 Never | Never allowed - prevents data loss |

---

### 4. Schema Changes

**Status**: 🚫 Strictly Controlled

| Type | Permission | Paths |
|------|-----------|-------|
| GraphQL Schema | 🚫 Blocked | `amplify/backend/api/**/schema.graphql` |
| Data Models | 🚫 Never | `src/models/**` (generated code) |
| TypeScript Types | ✅ Allowed | `**/*.d.ts` (except generated models) |

**Rationale**:
- Schema changes require `amplify push` and affect all clients
- Model files are auto-generated and should never be manually edited
- Type definitions can be safely updated

---

### 5. Configuration Files

#### Read-Only
- `amplify.yml`
- `amplify/backend.ts`
- GraphQL schemas
- `next.config.js`
- `tsconfig.json`
- `package.json` / `package-lock.json`
- Environment files
- AWS config files

#### Modifiable (with confirmation)
- `cypress.config.ts`
- `vitest.config.ts`
- `eslint.config.mjs`
- `.storybook/**`
- `chromatic.config.json`

---

### 6. Agent Skills

Each agent skill has granular permissions:

| Skill | Create | Modify | Delete | Confirmation |
|-------|--------|--------|--------|--------------|
| component-versioning | ✅ | ✅ | 🚫 | ⚠️ Required |
| mock-data-validator | ✅ | ✅ | 🚫 | ✅ Not required |
| storybook-validation | ✅ | ✅ | 🚫 | ✅ Not required |
| semantic-file-search | 🚫 | 🚫 | 🚫 | ✅ Read-only |
| extract-code-documentation | ✅ | ✅ | 🚫 | ✅ Not required |
| multi-model-ai-translation | ✅ | ✅ | 🚫 | ✅ Not required |

---

## Safe Modes

### Dry Run Mode
**Command**: `--dry-run`  
**Effect**: Simulates all operations without executing

```bash
agent-cli --dry-run execute-skill storybook-validation
```

### Read-Only Mode
**Command**: `--read-only`  
**Effect**: Blocks all write operations

```bash
agent-cli --read-only analyze-codebase
```

### Confirm All Mode
**Command**: `--confirm-all`  
**Effect**: Requires confirmation for every file operation

```bash
agent-cli --confirm-all update-translations
```

---

## Logging & Auditing

**Log Location**: `.github/logs/agent-operations.log`  
**Log Level**: `info` (debug, info, warn, error)

**Logged Operations**:
- All write operations (create, modify, delete)
- Terminal command executions
- Permission denials
- Confirmation prompts

**Log Format**:
```json
{
  "timestamp": "2026-03-14T10:30:00Z",
  "operation": "write",
  "path": "src/components/NewComponent.tsx",
  "agent": "component-versioning",
  "confirmed": true,
  "result": "success"
}
```

---

## Validation Rules

### Pre-Commit Checks
**Enabled**: true  
**Checks**: TypeScript, ESLint, Tests

Before any git operation, agents must ensure:
1. TypeScript compiles without errors
2. ESLint passes
3. All tests pass

### File Size Limits
- **Single File**: 1 MB maximum
- **Batch Operation**: 10 MB total maximum
- **Batch File Count**: 50 files maximum

### Batch Operations
- Limit to 50 files per operation
- Require confirmation for batch writes
- Prevent mass deletions

---

## Exemptions

**Users**: None (human users have full permissions)  
**Skills**: `semantic-file-search` (read-only, no restrictions needed)  
**Paths**: None

To add exemptions, modify `.github/agent-permissions.json`:

```json
{
  "exemptions": {
    "users": ["admin@example.com"],
    "skills": ["trusted-skill"],
    "paths": ["scripts/automated/**"]
  }
}
```

---

## Integration Examples

### CLI Usage

```bash
# Check permissions for an operation
agent-cli check-permission --operation write --path src/components/NewComponent.tsx

# Execute with permissions enforced
agent-cli execute-skill mock-data-validator --enforce-permissions

# Override with confirmation
agent-cli execute-skill component-versioning --confirm-destructive
```

### Programmatic Usage

```typescript
import { checkPermission, executeWithPermissions } from './agent-permissions';

// Check if operation is allowed
const canWrite = await checkPermission({
  operation: 'write',
  path: 'src/components/NewComponent.tsx',
  skill: 'component-versioning'
});

if (!canWrite.allowed) {
  if (canWrite.requiresConfirmation) {
    const confirmed = await promptUser(canWrite.reason);
    if (!confirmed) return;
  } else {
    throw new Error(`Permission denied: ${canWrite.reason}`);
  }
}

// Execute with automatic permission checks
await executeWithPermissions(async () => {
  await createFile('src/components/NewComponent.tsx', content);
});
```

### GitHub Actions Integration

```yaml
name: Agent Task Automation

on:
  workflow_dispatch:
    inputs:
      skillName:
        description: 'Agent skill to execute'
        required: true
      safeMode:
        description: 'Safe mode (none, dry-run, read-only, confirm-all)'
        default: 'dry-run'

jobs:
  execute-skill:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Execute agent skill with permissions
        run: |
          node scripts/agent-cli.js \
            --skill ${{ inputs.skillName }} \
            --enforce-permissions \
            --${{ inputs.safeMode }} \
            --log-level info
        
      - name: Upload operation log
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: agent-operation-log
          path: .github/logs/agent-operations.log
```

---

## Notifications

### On Blocked Operation
**Enabled**: true  
**Method**: console

Displays clear message when operation is blocked:
```
❌ Permission Denied: Cannot delete src/components/MyComponent.tsx
   Reason: Deletion of production code is not allowed
   Allowed: Test files, documentation, translation cache
```

### On Confirmation Required
**Enabled**: true  
**Method**: prompt

Interactive prompt when confirmation needed:
```
⚠️  Confirmation Required

Operation: Write
Path: src/components/NewComponent.tsx
Agent: component-versioning
Reason: Production code modification requires confirmation

File size: 24 KB
Preview:
  import React from 'react';
  ...

Allow this operation? [y/N]
```

---

## Best Practices

### For Agent Developers

1. **Check permissions early** - Validate before performing operations
2. **Batch permission checks** - Check all operations upfront
3. **Provide context** - Explain why operation is needed
4. **Respect denials** - Don't retry blocked operations
5. **Log everything** - Aid debugging and auditing

### For Users

1. **Start with dry-run** - Test new agents in dry-run mode first
2. **Review logs** - Check operation logs periodically
3. **Customize paths** - Adjust allowed paths as needed
4. **Use read-only mode** - For untested or experimental agents
5. **Update permissions** - Keep config in sync with project structure

---

## Testing

### Validate Configuration

```bash
# Check JSON schema validity
npx ajv validate \
  -s .github/schemas/agent-permissions-schema.json \
  -d .github/agent-permissions.json

# Test permission checks
npm test -- test/agent-permissions.test.ts
```

### Test Cases

```typescript
describe('Agent Permissions', () => {
  test('allows reading all non-sensitive files', () => {
    expect(checkPermission({
      operation: 'read',
      path: 'src/components/MyComponent.tsx'
    })).toEqual({ allowed: true });
  });
  
  test('blocks reading environment variables', () => {
    expect(checkPermission({
      operation: 'read',
      path: '.env.local'
    })).toEqual({
      allowed: false,
      reason: 'Sensitive credentials'
    });
  });
  
  test('requires confirmation for production code writes', () => {
    expect(checkPermission({
      operation: 'write',
      path: 'src/components/NewComponent.tsx'
    })).toEqual({
      allowed: true,
      requiresConfirmation: true,
      reason: 'Production code modification'
    });
  });
  
  test('blocks DataStore clear operations', () => {
    expect(checkPermission({
      operation: 'datastore.clear'
    })).toEqual({
      allowed: false,
      reason: 'DataStore clear is never allowed'
    });
  });
});
```

---

## Roadmap

### Phase 1: Core Implementation (Current)
- ✅ JSON configuration schema
- ✅ Permission definitions
- ✅ Documentation

### Phase 2: Enforcement (Next)
- [ ] TypeScript permission checker
- [ ] CLI integration
- [ ] Test coverage
- [ ] VS Code extension integration

### Phase 3: Advanced Features
- [ ] Role-based permissions (admin, developer, agent)
- [ ] Time-based restrictions (working hours only)
- [ ] Rate limiting (max operations per hour)
- [ ] Undo/rollback capabilities
- [ ] Webhook notifications
- [ ] Dashboard for monitoring agent activity

### Phase 4: Security Enhancements
- [ ] Signature verification for agent operations
- [ ] Encrypted permission overrides
- [ ] Audit trail with blockchain proof
- [ ] Integration with secret management systems

---

## FAQ

**Q: Can I temporarily override permissions?**  
A: Yes, use `--confirm-all` flag to manually approve each operation.

**Q: How do I add a new safe directory?**  
A: Edit `.github/agent-permissions.json` and add the path to `permissions.fileOperations.write.allowedPaths`.

**Q: What happens if an agent tries a blocked operation?**  
A: The operation is denied, logged, and the agent receives an error explaining why it was blocked.

**Q: Can agents read my AWS credentials?**  
A: No, all credential files are explicitly blocked in the read permissions.

**Q: Do permissions apply to human users?**  
A: No, permissions only restrict autonomous agents. Human users via VS Code or CLI have normal file system permissions.

**Q: How do I test a new agent safely?**  
A: Run with `--dry-run` flag first to see what it would do without executing.

---

## Support

For issues or questions:
- Check [docs/AGENT_SKILLS.md](../docs/AGENT_SKILLS.md) for agent skill documentation
- Review logs in `.github/logs/agent-operations.log`
- Test permission checks with `npm test -- test/agent-permissions.test.ts`
- Submit issues for permission config improvements

---

## Contributing

To improve the permissions system:

1. Propose changes to `.github/agent-permissions.json`
2. Update JSON schema if needed
3. Add test cases in `test/agent-permissions.test.ts`
4. Update this documentation
5. Submit PR with rationale

All permission changes should prioritize:
- **Safety** - Prevent accidental data loss
- **Productivity** - Enable useful agent work
- **Transparency** - Clear logging and explanations
- **Flexibility** - Easy to customize per project
