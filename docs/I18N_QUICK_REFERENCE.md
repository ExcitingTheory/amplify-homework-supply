# i18n Quick Reference Guide

## Quick Start

### 1. Run Detection
```bash
npm run lint:translate
```

This will show all hardcoded strings that need translation in your JSX.

### 2. Generate Report
```bash
npm run lint:translate:report
```

This creates `i18n-report.json` with detailed information about all untranslated strings.

## Understanding the Output

### ESLint Warning Format
```
/path/to/file.jsx
  45:12  warning  Literal string "Save Changes" in JSX  i18next/no-literal-string
```

- **Line 45, Column 12**: Location of the hardcoded string
- **"Save Changes"**: The literal string that needs translation
- **Rule**: `i18next/no-literal-string`

## What Gets Flagged

### ✅ These WILL be flagged (need translation):
```jsx
<Button>Save</Button>
<Typography>Welcome to the app</Typography>
<TextField label="Enter your name" />
<Alert>An error occurred</Alert>
{isLoading ? "Loading..." : "Complete"}
```

### ❌ These will NOT be flagged (automatically excluded):
```jsx
<Button className="primary" />        // Attribute values
<div style={{ color: 'red' }} />      // Style values
<Component type="button" />           // Technical attributes
<Link href="/home" />                 // URLs/paths
const CLASS_NAME = "container"        // Constants outside JSX
console.log("Debug message")          // Console logs
```

## Common Patterns to Look For

### Pattern 1: Button Labels
```jsx
// Before
<Button>Save Changes</Button>

// After  
import { useTranslation } from 'next-i18next';
const { t } = useTranslation('common');
<Button>{t('actions.save')}</Button>
```

### Pattern 2: Form Labels
```jsx
// Before
<TextField label="Username" placeholder="Enter username" />

// After
<TextField 
  label={t('auth.username')} 
  placeholder={t('auth.username_placeholder')} 
/>
```

### Pattern 3: Conditional Text
```jsx
// Before
{isComplete ? "Complete" : "Incomplete"}

// After
{isComplete ? t('status.complete') : t('status.incomplete')}
```

### Pattern 4: Interpolated Strings
```jsx
// Before
<Typography>Welcome, {username}!</Typography>

// After
<Typography>{t('common.welcome', { username })}</Typography>

// In translation file:
// { "welcome": "Welcome, {{username}}!" }
```

## Interpreting the Report

### Sample i18n-report.json Entry
```json
{
  "filePath": "/path/to/ChatSidebar.js",
  "messages": [
    {
      "ruleId": "i18next/no-literal-string",
      "severity": 1,
      "message": "Literal string \"Send\" in JSX",
      "line": 123,
      "column": 24
    }
  ]
}
```

### Report Statistics
After running the report, you can analyze it:

```bash
# Count total warnings
jq '[.[].messages | length] | add' i18n-report.json

# List files with most issues
jq -r 'sort_by(-.messages | length) | .[0:10] | .[] | "\(.messages | length)\t\(.filePath)"' i18n-report.json

# Find all unique string patterns
jq -r '.[].messages[].message' i18n-report.json | sort | uniq
```

## Workflow for Fixing Issues

### Step-by-Step Process

1. **Run the linter**:
   ```bash
   npm run lint:translate
   ```

2. **Pick a file** (start with files that have fewer warnings):
   ```bash
   npm run lint:translate | grep "src/components/MyComponent.js"
   ```

3. **Open the file** and locate the line numbers

4. **Identify the namespace** the strings belong to:
   - UI actions → `common`
   - Editor features → `editor`
   - Authentication → `auth`
   - Unit management → `units`
   - Grading → `grades`
   - Chat interface → `chat`
   - Error messages → `errors`

5. **Add translation keys** to appropriate JSON file:
   ```json
   // public/locales/en/common.json
   {
     "actions": {
       "save": "Save",
       "delete": "Delete"
     }
   }
   ```

6. **Update the component**:
   ```jsx
   import { useTranslation } from 'next-i18next';
   
   const MyComponent = () => {
     const { t } = useTranslation('common');
     return <Button>{t('actions.save')}</Button>;
   };
   ```

7. **Re-run linter** to verify:
   ```bash
   npm run lint:translate | grep "src/components/MyComponent.js"
   ```

## Priority Guidelines

### High Priority (Fix First)
- Navigation menus
- Button labels
- Error messages
- Form validation
- Dialog titles

### Medium Priority
- Tooltips
- Help text
- Status messages
- Table headers

### Low Priority (Can Skip)
- Console logs
- Developer comments
- Technical constants
- Debug output

## False Positives

Sometimes ESLint will flag things that shouldn't be translated:

### File Names/Paths
```jsx
// If flagged, add to ignore list or use variable
const fileName = "document.pdf";
<Typography>{fileName}</Typography>
```

### Technical Terms
```jsx
// CSS properties, HTML attributes, etc.
// These are usually automatically excluded
<div role="button" />
```

### Lexical/Editor Content
```jsx
// Block types, node types
const blockType = "paragraph"; // This is OK - not user-facing
```

## Next Steps After Detection

1. **Review the scope**: Check how many files need updates
2. **Estimate effort**: Count warnings per file
3. **Plan sprints**: Break work into manageable chunks
4. **Set up i18n**: Follow Phase 1 of the upgrade guide
5. **Start small**: Begin with 1-2 high-impact components
6. **Test frequently**: Ensure translations load correctly
7. **Iterate**: Fix one file/component at a time

## Troubleshooting

### Too many false positives?
Edit [.eslintrc.json](.eslintrc.json) and add patterns to the `ignore` array:
```json
{
  "ignore": [
    "^your-pattern-here$"
  ]
}
```

### Specific components showing errors incorrectly?
Add them to the `exclude` list in `.eslintrc.json`:
```json
{
  "jsx-components": {
    "exclude": ["YourComponent"]
  }
}
```

### Need to skip certain files?
They're probably already in `.eslintignore`, but you can add more:
```
src/components/LegacyComponent.js
```

## Resources

- Full guide: [docs/I18N_UPGRADE_GUIDE.md](I18N_UPGRADE_GUIDE.md)
- ESLint plugin: https://github.com/edvardchen/eslint-plugin-i18next
- react-i18next docs: https://react.i18next.com/

## Example: Before & After

### Before (ESLint warnings)
```jsx
const ChatSidebar = () => {
  return (
    <Box>
      <Typography variant="h6">Chat with AI</Typography>
      <Button>Send</Button>
      <Alert severity="error">Failed to send message</Alert>
    </Box>
  );
};
```

**ESLint Output:**
```
src/components/ChatSidebar.js
  3:32  warning  Literal string "Chat with AI" in JSX
  4:15  warning  Literal string "Send" in JSX
  5:30  warning  Literal string "Failed to send message" in JSX
```

### After (No warnings)
```jsx
import { useTranslation } from 'next-i18next';

const ChatSidebar = () => {
  const { t } = useTranslation(['chat', 'common', 'errors']);
  
  return (
    <Box>
      <Typography variant="h6">{t('chat:title')}</Typography>
      <Button>{t('common:actions.send')}</Button>
      <Alert severity="error">{t('errors:chat.send_failed')}</Alert>
    </Box>
  );
};
```

**ESLint Output:**
```
(no warnings)
```
