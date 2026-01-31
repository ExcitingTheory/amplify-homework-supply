# Examples

Detailed usage examples for common scenarios.

## Example 1: Backfill Single Component

**Scenario:** New component created without docblock.

**File:** `src/components/AssignmentCard.tsx`

```typescript
export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment }) => {
  return (
    <Card>
      <h3>{assignment.name}</h3>
      <p>Due: {assignment.dueDate}</p>
    </Card>
  );
};
```

**Command:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/backfill-docblocks.ts \
  src/components/AssignmentCard.tsx
```

**Result:**

```typescript
/**
 * AssignmentCard - Assignment display card component
 * 
 * @description
 * Displays assignment information in card format with name and due date.
 * Used in assignment listing and student dashboard views.
 * 
 * @component
 * 
 * @metadata
 * - location: src/components/AssignmentCard.tsx
 * - usage: Assignment listing, student dashboard
 * - impact: medium - core content display
 */
export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment }) => {
  return (
    <Card>
      <h3>{assignment.name}</h3>
      <p>Due: {assignment.dueDate}</p>
    </Card>
  );
};
```

---

## Example 2: Sync Metadata from Locale Files

**Scenario:** Translator added rich metadata to locale files, need to sync back to code.

**Locale File:** `public/locales/en/editor.json`

```json
{
  "toolbar": {
    "save": {
      "value": "Save",
      "context": "Editor save button, shown after content edits. Triggers DataStore save operation.",
      "component": {
        "location": "src/components/Editor3/EditorToolbar.tsx",
        "description": "Lexical editor toolbar with formatting controls and save functionality"
      },
      "usage": "Primary save action button in editor toolbar",
      "impact": "critical - prevents data loss if user navigates away"
    }
  }
}
```

**Current Code:** `src/components/Editor3/EditorToolbar.tsx`

```typescript
/**
 * EditorToolbar - Editor toolbar component
 */
export const EditorToolbar = () => { ... };
```

**Command:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/sync-metadata.ts \
  src/components/Editor3/EditorToolbar.tsx
```

**Result:**

```typescript
/**
 * EditorToolbar - Lexical editor toolbar with formatting controls
 * 
 * @metadata
 * - context: Editor save button, shown after content edits
 * - usage: Primary save action button in editor toolbar
 * - impact: critical - prevents data loss
 * - location: src/components/Editor3/EditorToolbar.tsx
 * 
 * @see {@link public/locales/en/editor.json}
 */
export const EditorToolbar = () => { ... };
```

---

## Example 3: Validate Entire Codebase

**Scenario:** Pre-deployment validation to ensure all components documented.

**Command:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/validate-docblocks.ts \
  --report \
  --report-path=./validation-report.json
```

**Console Output:**

```
🔍 Validating docblocks...

📁 Found 127 files to validate

  ✅ src/components/ChatSidebar.js
  ✅ src/components/Editor3/EditorToolbar.tsx
  ⚠️  src/components/UnitCard.tsx
      ⚠️  Component has locale metadata but no @metadata section
  ❌ src/components/GradeViewer.tsx
      ❌ Documented parameter 'userId' not found in signature
  ✅ src/components/FileUploader.tsx
  ...

📊 Validation Summary:
  - Total files: 127
  - With docblocks: 98 (77%)
  - Without docblocks: 29 (23%)
  - Valid docblocks: 91
  - Issues found: 36

📋 Issues by type:
  - missing: 29
  - mismatch: 5
  - incomplete: 2

📄 Report saved to: ./validation-report.json
```

**Report File:** `validation-report.json`

```json
{
  "totalFiles": 127,
  "filesWithDocblocks": 98,
  "filesWithoutDocblocks": 29,
  "issues": [
    {
      "file": "src/components/GradeViewer.tsx",
      "type": "mismatch",
      "severity": "error",
      "details": "Documented parameter 'userId' not found in function signature"
    },
    {
      "file": "src/components/UnitCard.tsx",
      "type": "incomplete",
      "severity": "warning",
      "details": "Component has locale metadata but no @metadata section"
    }
  ],
  "valid": [
    "src/components/ChatSidebar.js",
    "src/components/Editor3/EditorToolbar.tsx",
    ...
  ]
}
```

**Fix Issues:**

```bash
# Backfill missing docblocks
npx tsx .github/skills/docblock-backfill/scripts/backfill-docblocks.ts

# Sync metadata from locale files
npx tsx .github/skills/docblock-backfill/scripts/sync-metadata.ts

# Re-validate
npx tsx .github/skills/docblock-backfill/scripts/validate-docblocks.ts
```

---

## Example 4: Dry Run Preview

**Scenario:** Want to see what backfill would generate before applying changes.

**Command:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/backfill-docblocks.ts \
  src/components/NewComponent.tsx \
  --dry-run
```

**Output:**

```
🔍 Scanning for files needing docblocks...

📁 Found 1 file to analyze

📄 src/components/NewComponent.tsx
/**
 * NewComponent - New component description
 * 
 * @description
 * [Auto-generated] Requires manual review and enhancement.
 * 
 * @component
 * 
 * @metadata
 * - location: src/components/NewComponent.tsx
 * - usage: [Needs description]
 * - impact: medium
 * 
 * Generated by: docblock-backfill skill
 * Date: 2026-01-30
 */

📊 Summary:
  - Files analyzed: 1
  - Docblocks would be added: 1
  - Errors: 0

💡 Run without --dry-run to apply changes
```

**Review and Apply:**

```bash
# Looks good, apply it
npx tsx .github/skills/docblock-backfill/scripts/backfill-docblocks.ts \
  src/components/NewComponent.tsx
```

---

## Example 5: Fix Outdated Parameters

**Scenario:** Component signature changed but docblock wasn't updated.

**Current Code:**

```typescript
/**
 * UserProfile - Displays user profile information
 * 
 * @param {string} userId - The user's ID
 * @param {string} username - The user's name
 */
export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return <div>{user.name}</div>;
};
```

**Validation:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/validate-docblocks.ts \
  src/components/UserProfile.tsx
```

**Output:**

```
🔍 Validating docblocks...

  ❌ src/components/UserProfile.tsx
      ❌ Documented parameter 'userId' not found in function signature
      ❌ Documented parameter 'username' not found in function signature

❌ Validation failed
```

**Manual Fix:**

```typescript
/**
 * UserProfile - Displays user profile information
 * 
 * @param {UserProfileProps} props - Component properties
 * @param {User} props.user - User data object
 */
export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return <div>{user.name}</div>;
};
```

**Re-validate:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/validate-docblocks.ts \
  src/components/UserProfile.tsx

# ✅ Validation passed
```

---

## Example 6: Batch Backfill Directory

**Scenario:** New feature branch with multiple undocumented components.

**Directory Structure:**

```
src/features/grading/
├── GradingPanel.tsx          (no docblock)
├── RubricEditor.tsx          (no docblock)
├── FeedbackInput.tsx         (no docblock)
└── ScoreCalculator.ts        (has docblock)
```

**Command:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/backfill-docblocks.ts \
  src/features/grading/
```

**Output:**

```
🔍 Scanning for files needing docblocks...

📁 Found 4 files to analyze

  ✅ src/features/grading/GradingPanel.tsx
  ✅ src/features/grading/RubricEditor.tsx
  ✅ src/features/grading/FeedbackInput.tsx
  ✓  src/features/grading/ScoreCalculator.ts (already has docblock)

📊 Summary:
  - Files analyzed: 4
  - Docblocks added: 3
  - Errors: 0

✅ Docblock backfill complete!
```

---

## Example 7: Generate Coverage Report

**Scenario:** Monthly documentation audit for management.

**Command:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/generate-docblock-report.ts
```

**Output:**

```
📊 Generating docblock coverage report...

🔍 Validating docblocks...

📁 Found 127 files to validate

... (validation output) ...

📄 Report Details:
  - Total files: 127
  - Documented: 98 (77%)
  - Issues: 36

💡 Recommendations:
  - WARNING: Documentation coverage below 75%. Consider backfilling missing docblocks.
  - Found 5 critical documentation errors. Run validate-docblocks.ts --fix to resolve.

✅ Report saved to: docblock-report.json
```

**Report Contents:**

```json
{
  "timestamp": "2026-01-30T15:30:00.000Z",
  "validation": { ... },
  "coverage": {
    "total": 127,
    "documented": 98,
    "percentage": 77,
    "byType": {
      "component": { "total": 87, "documented": 72, "percentage": 83 },
      "page": { "total": 25, "documented": 18, "percentage": 72 },
      "utility": { "total": 15, "documented": 8, "percentage": 53 }
    }
  },
  "recommendations": [
    "WARNING: Documentation coverage below 75%. Consider backfilling missing docblocks.",
    "Found 5 critical documentation errors. Run validate-docblocks.ts --fix to resolve."
  ]
}
```

---

## Example 8: Integration with Translation Workflow

**Scenario:** Complete workflow from code → locale files → translation → back to code.

**Step 1: Extract to Locale Files**

```bash
# Extract component docblocks to locale files
npx tsx .github/skills/extract-code-documentation/scripts/extract-component-docblocks.ts
```

**Result:** Components metadata added to `public/locales/en/*.json`

**Step 2: Add Metadata Structure**

```bash
# Add metadata fields to all locale entries
npx tsx .github/skills/extract-code-documentation/scripts/add-metadata-all-namespaces.ts
```

**Result:** All locale entries have `context`, `usage`, `impact` fields

**Step 3: Translate** (manual or via multi-model-ai-translation skill)

Translators enrich metadata during translation:

```json
{
  "ChatSidebar": {
    "title": {
      "value": "AI Assistant",
      "context": "ENRICHED: Chat sidebar header, visible to all users. Primary entry point for AI help.",
      "usage": "ENRICHED: Displayed at top of collapsible sidebar panel on right side of screen",
      "impact": "ENRICHED: high - main AI feature discovery point for students"
    }
  }
}
```

**Step 4: Sync Back to Code**

```bash
# Update docblocks with enriched metadata
npx tsx .github/skills/docblock-backfill/scripts/sync-metadata.ts
```

**Result:** Code docblocks updated with translator-enriched metadata

**Step 5: Validate**

```bash
# Ensure everything synced correctly
npx tsx .github/skills/docblock-backfill/scripts/validate-docblocks.ts --report
```

---

## Example 9: CI/CD Integration

**Scenario:** Automated validation in GitHub Actions.

**.github/workflows/validate-docs.yml:**

```yaml
name: Validate Documentation

on:
  pull_request:
    paths:
      - 'src/**/*.tsx'
      - 'src/**/*.ts'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Validate docblocks
        run: |
          npm run docs:validate --strict
      
      - name: Generate report
        if: failure()
        run: npm run docs:report
      
      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: docblock-report
          path: docblock-report.json
```

**Trigger:** Open PR with undocumented component

**Result:** CI fails, report uploaded as artifact

**Fix:** Developer runs locally:

```bash
npm run docs:backfill:dry      # Preview
npm run docs:backfill          # Apply
git add .
git commit -m "docs: add missing docblocks"
git push
```

**Result:** CI passes ✅

---

## Example 10: Custom Configuration

**Scenario:** Component library with strict documentation requirements.

**.docblock-backfill.json:**

```json
{
  "include": [
    "src/components/**/*.tsx"
  ],
  "exclude": [
    "src/components/internal/**",
    "src/components/**/*.test.tsx"
  ],
  "validation": {
    "requireFileDocblock": true,
    "requireMetadata": true,
    "strict": true,
    "customRules": [
      {
        "pattern": "src/components/**/index.tsx",
        "require": ["@component", "@example", "@metadata"],
        "severity": "error"
      }
    ]
  },
  "templates": {
    "component": "tsdoc"
  },
  "output": {
    "reportFormat": "markdown",
    "reportPath": "./docs/component-status.md"
  }
}
```

**Command:**

```bash
npx tsx .github/skills/docblock-backfill/scripts/validate-docblocks.ts
```

**Enforcement:**
- All public components must have docblocks
- Must include `@component`, `@example`, `@metadata`
- Markdown report generated for docs site
- CI fails if any component doesn't comply
