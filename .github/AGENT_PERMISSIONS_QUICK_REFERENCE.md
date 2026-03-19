# Agent Permissions Quick Reference

## 🚀 Quick Start

```bash
# Check if an operation is allowed
npx tsx scripts/agent-cli.ts check --operation write --path src/components/NewComponent.tsx

# Execute with confirmation
npx tsx scripts/agent-cli.ts execute --operation write --path test.txt

# Dry-run mode (simulate only)
npx tsx scripts/agent-cli.ts execute --operation write --path test.txt --dry-run

# View recent logs
npx tsx scripts/agent-cli.ts logs --recent 20
```

## ✅ Safe Operations (No Confirmation)

### Files You Can Freely Modify
- `**/*.test.{ts,tsx,js,jsx}` - Test files
- `**/*.stories.{ts,tsx,js,jsx}` - Storybook stories
- `**/*.md` - Documentation
- `.storybook/__mocks__/**` - Mock data
- `public/locales/**` - Translations
- `.translation-cache/**` - Translation cache
- `docs/**` - Documentation
- `.github/skills/**` - Agent skills
- `test/**` - Test files

### Commands You Can Run
```bash
npm test
npm run test:watch
npm run storybook
npm run lint
git status
git diff
git log
amplify status
```

## ⚠️ Operations Requiring Confirmation

### Files Requiring Confirmation
- `src/components/**` - React components
- `src/context/**` - Context providers
- `src/utils/**` - Utility functions
- `pages/**` - Next.js pages
- `src/agent-skills/**` - Agent skill implementations

### Operations Requiring Confirmation
- Deleting test files or documentation
- Renaming any files
- DataStore save operations
- DataStore delete operations

## 🚫 Blocked Operations

### Never Allowed
- Modifying `package.json`, `package-lock.json`
- Modifying `amplify.yml`, `next.config.js`, `tsconfig.json`
- Modifying GraphQL schema files
- Modifying generated model files (`src/models/**`)
- Modifying environment files (`.env*`)
- Running `npm install`, `npm uninstall`
- Running `git push`, `git pull`, `git commit`
- Running `amplify push`, `amplify delete`
- Running `rm`, `sudo`, `chmod`
- DataStore clear operations

## 📊 Permission Categories

| Category | Read | Write | Delete | Rename |
|----------|------|-------|--------|--------|
| Test files | ✅ | ✅ | ⚠️ | ⚠️ |
| Stories | ✅ | ✅ | ⚠️ | ⚠️ |
| Documentation | ✅ | ✅ | ⚠️ | ⚠️ |
| Mock data | ✅ | ✅ | ⚠️ | ⚠️ |
| Translations | ✅ | ✅ | ✅ | ⚠️ |
| Components | ✅ | ⚠️ | 🚫 | ⚠️ |
| Context | ✅ | ⚠️ | 🚫 | ⚠️ |
| Utils | ✅ | ⚠️ | 🚫 | ⚠️ |
| Pages | ✅ | ⚠️ | 🚫 | ⚠️ |
| Config files | ✅ | 🚫 | 🚫 | 🚫 |
| Schema files | ✅ | 🚫 | 🚫 | 🚫 |
| Credentials | 🚫 | 🚫 | 🚫 | 🚫 |

**Legend**: ✅ Allowed | ⚠️ Confirmation Required | 🚫 Blocked

## 🛡️ Safe Modes

### Dry-Run Mode
Simulates operations without executing them.
```bash
npx tsx scripts/agent-cli.ts execute --operation write --path test.txt --dry-run
```

### Read-Only Mode
Blocks all write operations.
```bash
npx tsx scripts/agent-cli.ts safe-mode --mode readOnly --enable true
```

### Confirm-All Mode
Requires confirmation for every operation.
```bash
npx tsx scripts/agent-cli.ts safe-mode --mode confirmAll --enable true
```

## 🔍 Checking Permissions

### Check File Operation
```bash
# Check if you can write a file
npx tsx scripts/agent-cli.ts check --operation write --path src/components/NewComponent.tsx

# Check if you can read a file
npx tsx scripts/agent-cli.ts check --operation read --path .env.local

# Check if you can delete a file
npx tsx scripts/agent-cli.ts check --operation delete --path docs/OLD.md
```

### Check Terminal Command
```bash
# Check if command is allowed
npx tsx scripts/agent-cli.ts check --operation terminal --command "npm test"

# Check blocked command
npx tsx scripts/agent-cli.ts check --operation terminal --command "npm install lodash"

# Check git command
npx tsx scripts/agent-cli.ts check --operation terminal --command "git push"
```

### Check DataStore Operation
```bash
# Check DataStore query
npx tsx scripts/agent-cli.ts check --operation datastore.query

# Check DataStore save
npx tsx scripts/agent-cli.ts check --operation datastore.save

# Check DataStore clear
npx tsx scripts/agent-cli.ts check --operation datastore.clear
```

## 🎯 Agent Skill Permissions

### Check Skill Permissions
```bash
# Check if skill can create files
npx tsx scripts/agent-cli.ts skill --name mock-data-validator --operation create

# Check if skill can modify files
npx tsx scripts/agent-cli.ts skill --name component-versioning --operation modify

# Check if skill can delete files
npx tsx scripts/agent-cli.ts skill --name semantic-file-search --operation delete
```

### Skill Permission Matrix

| Skill | Create | Modify | Delete | Confirmation |
|-------|--------|--------|--------|--------------|
| component-versioning | ✅ | ✅ | 🚫 | ⚠️ Yes |
| mock-data-validator | ✅ | ✅ | 🚫 | ✅ No |
| storybook-validation | ✅ | ✅ | 🚫 | ✅ No |
| semantic-file-search | 🚫 | 🚫 | 🚫 | ✅ Read-only |
| extract-code-documentation | ✅ | ✅ | 🚫 | ✅ No |
| multi-model-ai-translation | ✅ | ✅ | 🚫 | ✅ No |

## 📝 Operation Logs

### View Recent Logs
```bash
# Show last 50 operations
npx tsx scripts/agent-cli.ts logs --recent 50

# Show last 20 operations
npx tsx scripts/agent-cli.ts logs --recent 20

# Filter by operation type
npx tsx scripts/agent-cli.ts logs --recent 50 --operation write
```

### Log Format
```json
{
  "timestamp": "2026-03-14T10:30:00Z",
  "operation": "write",
  "path": "src/components/NewComponent.tsx",
  "result": "allowed",
  "skill": "component-versioning"
}
```

## 🔧 Configuration

### View Configuration
```bash
# Show overview
npx tsx scripts/agent-cli.ts config

# Show specific section
npx tsx scripts/agent-cli.ts config --section permissions
npx tsx scripts/agent-cli.ts config --section safeModes
npx tsx scripts/agent-cli.ts config --section logging
```

### Modify Configuration
Edit `.github/agent-permissions.json` directly.

Location: [.github/agent-permissions.json](../.github/agent-permissions.json)  
Schema: [.github/schemas/agent-permissions-schema.json](../.github/schemas/agent-permissions-schema.json)

## 💡 Common Scenarios

### Scenario 1: Creating New Test Files
✅ **Allowed without confirmation**
```bash
npx tsx scripts/agent-cli.ts check --operation write --path src/components/NewComponent.test.tsx
# Result: ✅ Allowed
```

### Scenario 2: Modifying Production Components
⚠️ **Requires confirmation**
```bash
npx tsx scripts/agent-cli.ts execute --operation write --path src/components/Header.tsx
# Result: ⚠️ Confirmation Required
```

### Scenario 3: Installing NPM Packages
🚫 **Blocked**
```bash
npx tsx scripts/agent-cli.ts check --operation terminal --command "npm install lodash"
# Result: ❌ Permission Denied
```

### Scenario 4: Running Tests
✅ **Allowed**
```bash
npx tsx scripts/agent-cli.ts check --operation terminal --command "npm test"
# Result: ✅ Allowed
```

### Scenario 5: Deleting Documentation
⚠️ **Requires confirmation**
```bash
npx tsx scripts/agent-cli.ts execute --operation delete --path docs/OLD_DOC.md
# Result: ⚠️ Confirmation Required
```

## 🧪 Testing Safely

### Test New Agent Workflows

**Step 1**: Start with dry-run mode
```bash
npx tsx scripts/agent-cli.ts safe-mode --mode dryRun --enable true
```

**Step 2**: Run your agent workflow
```bash
# All operations will be simulated
npx tsx scripts/agent-cli.ts execute --operation write --path test.txt
# Output: [DRY RUN] Would execute: write on test.txt
```

**Step 3**: Review logs
```bash
npx tsx scripts/agent-cli.ts logs --recent 20
```

**Step 4**: Disable dry-run and do it for real
```bash
npx tsx scripts/agent-cli.ts safe-mode --mode dryRun --enable false
```

## 📚 Full Documentation

- **Main Documentation**: [.github/AGENT_PERMISSIONS.md](../.github/AGENT_PERMISSIONS.md)
- **Configuration File**: [.github/agent-permissions.json](../.github/agent-permissions.json)
- **JSON Schema**: [.github/schemas/agent-permissions-schema.json](../.github/schemas/agent-permissions-schema.json)
- **TypeScript Implementation**: [src/utils/agentPermissions.ts](../src/utils/agentPermissions.ts)
- **Tests**: [test/agent-permissions.test.ts](../test/agent-permissions.test.ts)

## 🆘 Troubleshooting

### Permission Denied
1. Check the reason: `npx tsx scripts/agent-cli.ts check --operation <type> --path <path>`
2. Review allowed paths in `.github/agent-permissions.json`
3. Add path to appropriate `allowedPaths` array if needed

### Command Not Allowed
1. Check command: `npx tsx scripts/agent-cli.ts check --operation terminal --command "your command"`
2. Review allowed commands in `.github/agent-permissions.json`
3. Add command to appropriate `allowed` section if safe

### Can't Read Credentials
✅ **This is intentional** - credentials are blocked for security

### Need to Override Temporarily
Use `--no-confirm` flag (use with caution):
```bash
npx tsx scripts/agent-cli.ts execute --operation write --path file.txt --no-confirm
```

## 🔗 Related Resources

- [Agent Skills Documentation](../../docs/AGENT_SKILLS.md)
- [Development Onboarding](../../docs/ONBOARDING.md)
- [Project README](../../README.md)
