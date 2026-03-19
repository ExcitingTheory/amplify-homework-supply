# VS Code Agent Permissions Integration

This workspace has integrated agent permission controls with VS Code settings.

## Quick Access

**VS Code Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`):
- `Tasks: Run Task` → `Check Agent Permission`
- `Tasks: Run Task` → `Check Terminal Command Permission`  
- `Tasks: Run Task` → `View Agent Operation Logs`
- `Tasks: Run Task` → `Enable Dry-Run Safe Mode`
- `Tasks: Run Task` → `Enable Read-Only Safe Mode`

## Configuration Files

- **[.vscode/settings.json](.vscode/settings.json)** - Workspace settings with Copilot instructions
- **[.vscode/tasks.json](.vscode/tasks.json)** - VS Code tasks for permission checks
- **[.vscode/extensions.json](.vscode/extensions.json)** - Recommended extensions
- **[.github/agent-permissions.json](../.github/agent-permissions.json)** - Permission rules

## Settings Applied

### GitHub Copilot Chat Instructions
Copilot is now configured to:
- ✅ Check agent permissions before file operations
- ✅ Ask for confirmation for production code changes
- ✅ Never modify critical config files without permission
- ✅ Prefer non-destructive operations (tests, stories, docs)
- ✅ Validate terminal commands against allowed list

### File Protection
- Protected patterns for GraphQL schemas
- Confirmation prompts for dangerous operations
- Git sync confirmations enabled

### Terminal Safety
- Confirmation on terminal kill/exit
- Command validation against whitelist

## Using VS Code Tasks

### Check File Operation Permission
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type `Tasks: Run Task`
3. Select `Check Agent Permission`
4. Choose operation type (read/write/delete/rename)
5. Enter file path

### Check Terminal Command
1. Press `Cmd+Shift+P`
2. Type `Tasks: Run Task`
3. Select `Check Terminal Command Permission`
4. Enter the command to validate

### View Recent Logs
1. Press `Cmd+Shift+P`
2. Type `Tasks: Run Task`
3. Select `View Agent Operation Logs`

## Safe Modes

### Enable Dry-Run Mode
Simulates all operations without executing them.

**Via Task**:
1. `Cmd+Shift+P` → `Tasks: Run Task` → `Enable Dry-Run Safe Mode`

**Via Terminal**:
```bash
npm run agent:safe-mode -- --mode dryRun --enable true
```

### Enable Read-Only Mode
Blocks all write operations.

**Via Task**:
1. `Cmd+Shift+P` → `Tasks: Run Task` → `Enable Read-Only Safe Mode`

**Via Terminal**:
```bash
npm run agent:safe-mode -- --mode readOnly --enable true
```

## Keyboard Shortcuts

You can add keyboard shortcuts in `Preferences: Open Keyboard Shortcuts (JSON)`:

```json
[
  {
    "key": "cmd+shift+k cmd+p",
    "command": "workbench.action.tasks.runTask",
    "args": "Check Agent Permission"
  },
  {
    "key": "cmd+shift+k cmd+l",
    "command": "workbench.action.tasks.runTask",
    "args": "View Agent Operation Logs"
  }
]
```

## Copilot Chat Integration

When using GitHub Copilot Chat, it will:

1. **Pre-flight Checks**: Automatically check permissions before suggesting file operations
2. **Safety Warnings**: Warn about operations requiring confirmation
3. **Alternative Suggestions**: Suggest safer alternatives when blocked
4. **Permission Context**: Include permission status in responses

### Example Chat Prompts

**Safe Approach**:
```
Create a test file for MyComponent
```
→ ✅ Allowed without confirmation (test files are unrestricted)

**Requires Confirmation**:
```
Modify the Header component to add a new prop
```
→ ⚠️ Will ask for confirmation (production code)

**Blocked**:
```
Update package.json to add a new dependency
```
→ ❌ Blocked (critical config file)

## Files Automatically Protected

### Credentials (Cannot Read)
- `.env*`
- `aws-exports.js`
- `amplifyconfiguration.json`
- `amplify/team-provider-info.json`

### Critical Config (Cannot Modify)
- `package.json`
- `package-lock.json`
- `amplify.yml`
- `next.config.js`
- `tsconfig.json`

### Schema Files (Cannot Modify)
- `amplify/backend/api/**/schema.graphql`
- `src/models/**` (generated files)

## Troubleshooting

### Copilot Not Following Rules
1. Reload VS Code window: `Cmd+Shift+P` → `Developer: Reload Window`
2. Check settings are loaded: `Cmd+,` → Search "copilot"
3. Verify config path: Look for `.github/agent-permissions.json`

### Permission Check Fails
1. Ensure dependencies installed: `npm install`
2. Check config is valid: `npm run agent-cli config`
3. View error logs: `npm run agent:logs`

### Tasks Not Appearing
1. Ensure `.vscode/tasks.json` exists
2. Reload window: `Cmd+Shift+P` → `Developer: Reload Window`
3. Check task file syntax: Look for JSON errors

## Resources

- [Agent Permissions Documentation](../.github/AGENT_PERMISSIONS.md)
- [Quick Reference](../.github/AGENT_PERMISSIONS_QUICK_REFERENCE.md)
- [Configuration Summary](../.github/AGENT_PERMISSIONS_SUMMARY.md)
