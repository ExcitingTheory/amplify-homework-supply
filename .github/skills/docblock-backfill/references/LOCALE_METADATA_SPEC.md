# Locale Metadata Specification

Format and structure of metadata in locale files that gets synced to docblocks.

## Metadata Structure

### Complete Example

```json
{
  "ChatSidebar": {
    "title": {
      "value": "AI Assistant",
      "context": "Chat panel heading shown to all logged-in users when they open the sidebar",
      "component": {
        "location": "src/components/ChatSidebar.js",
        "description": "Streaming chat interface with tool calling and context-aware responses"
      },
      "usage": "Displayed in sidebar header, always visible when chat is open",
      "impact": "high - primary navigation element for AI features",
      "userType": "all",
      "tone": "friendly-professional",
      "alternativeTerms": ["Chat Assistant", "AI Helper", "Virtual Assistant"]
    },
    "placeholder": {
      "value": "Ask me anything about this unit...",
      "context": "Chat input placeholder text, shown when input is empty",
      "component": {
        "location": "src/components/ChatSidebar.js",
        "description": "Streaming chat interface with tool calling and context-aware responses"
      },
      "usage": "Input field placeholder, updates based on current context (unit, assignment, etc.)",
      "impact": "medium - guides user interaction but not critical",
      "userType": "all",
      "tone": "friendly-casual"
    }
  }
}
```

## Field Definitions

### Required Fields

#### `value` (string)

The actual UI string shown to users.

```json
"value": "Save Changes"
```

#### `context` (string)

Where and when users see this text. Should answer:
- What screen/component is it in?
- What user action triggers it?
- What state must the app be in?

```json
"context": "Editor toolbar save button, shown after user makes edits to unit content"
```

#### `component.location` (string)

Relative path from project root to the component file.

```json
"component": {
  "location": "src/components/Editor3/EditorToolbar.tsx"
}
```

#### `component.description` (string)

Brief description of what the component does.

```json
"component": {
  "description": "Lexical editor toolbar with formatting controls and save functionality"
}
```

#### `usage` (string)

Specific UI element type and user interaction.

```json
"usage": "Primary action button, triggers DataStore save of editor content"
```

#### `impact` (string)

Importance level with explanation.

Format: `<level> - <reason>`

Levels: `critical`, `high`, `medium`, `low`

```json
"impact": "critical - prevents data loss if user navigates away"
```

### Optional Fields

#### `userType` (string)

Who sees this text.

Values: `all`, `learners`, `instructors`, `admins`, `moderators`

```json
"userType": "instructors"
```

#### `tone` (string)

Desired voice/style for this text.

Values:
- `polite-formal` - Professional, respectful (default for auth, errors)
- `friendly-professional` - Approachable but competent (UI labels)
- `friendly-casual` - Warm, conversational (chat, help text)
- `technical` - Precise, detailed (developer features)
- `urgent` - Direct, actionable (warnings, critical errors)

```json
"tone": "friendly-professional"
```

#### `alternativeTerms` (string[])

Synonyms or alternative phrasings recognized during translation.

```json
"alternativeTerms": ["Store", "Persist", "Keep Changes"]
```

## Metadata Usage in Docblock Sync

The sync script extracts metadata and adds it to docblocks:

### Before Sync

```typescript
// src/components/Editor3/EditorToolbar.tsx
export const EditorToolbar = () => { ... };
```

### After Sync

```typescript
/**
 * EditorToolbar - Lexical editor toolbar with formatting controls
 * 
 * @metadata
 * - context: Editor toolbar save button, shown after user makes edits
 * - usage: Primary action button, triggers DataStore save
 * - impact: critical - prevents data loss
 * - location: src/components/Editor3/EditorToolbar.tsx
 * 
 * @see {@link public/locales/en/editor.json}
 */
export const EditorToolbar = () => { ... };
```

## Multiple Metadata Entries

If a component has multiple locale entries (common), they get aggregated:

```json
{
  "EditorToolbar": {
    "save": {
      "context": "Save button in editor",
      "usage": "Primary save action",
      "impact": "critical"
    },
    "format": {
      "context": "Formatting dropdown menu",
      "usage": "Text formatting options",
      "impact": "high"
    }
  }
}
```

Becomes:

```typescript
/**
 * @metadata
 * - context: Save button in editor; Formatting dropdown menu
 * - usage: Primary save action; Text formatting options
 * - impact: critical; high
 */
```

## Metadata Quality Guidelines

### Good Context Examples

✅ **Specific and actionable:**
```json
"context": "Sidebar header displayed to all users when opening AI chat. Appears above message history and input field."
```

❌ **Too vague:**
```json
"context": "Shows in the UI"
```

### Good Usage Examples

✅ **Describes element and action:**
```json
"usage": "Primary submit button, triggers authentication flow and redirects to dashboard on success"
```

❌ **Too brief:**
```json
"usage": "Button"
```

### Good Impact Examples

✅ **Level + justification:**
```json
"impact": "critical - data loss prevention, no auto-save available"
```

❌ **Just severity:**
```json
"impact": "high"
```

## Nested Metadata

For grouped UI strings:

```json
{
  "toolbar": {
    "save": {
      "value": "Save",
      "component": { "location": "src/components/Editor3/EditorToolbar.tsx" }
    },
    "cancel": {
      "value": "Cancel",
      "component": { "location": "src/components/Editor3/EditorToolbar.tsx" }
    }
  }
}
```

Both get synced to the same component file.

## Metadata Validation

The metadata extraction script validates:

1. All required fields present
2. `component.location` points to existing file
3. `impact` level is valid (critical/high/medium/low)
4. `tone` value is from allowed list
5. `userType` value is valid
6. `context` is at least 20 characters (not placeholder)

## Backfill Detection

The docblock backfill script detects metadata that needs updating:

```typescript
// Checks if locale metadata has changed since last sync
const localeMetadata = loadLocaleMetadata(file);
const docblockMetadata = extractDocblockMetadata(file);

if (!deepEqual(localeMetadata, docblockMetadata)) {
  console.log(`⚠️  Metadata out of sync: ${file}`);
  // Offer to update
}
```

## Example Workflow

1. Developer creates component with temporary docblock
2. Translator adds comprehensive metadata to locale files
3. Run `sync-metadata.ts` to update docblock with enriched metadata
4. Validation ensures metadata stays in sync

## Metadata Templates

### Minimal Metadata

```json
{
  "value": "Click here",
  "context": "Button in toolbar",
  "component": {
    "location": "src/components/Toolbar.tsx",
    "description": "Main toolbar component"
  },
  "usage": "Action button",
  "impact": "medium - convenience feature"
}
```

### Complete Metadata

```json
{
  "value": "Delete Account",
  "context": "Account settings page, danger zone section. Only shown to users who are not on active subscription.",
  "component": {
    "location": "src/components/settings/AccountSettings.tsx",
    "description": "Account management interface with profile editing and deletion"
  },
  "usage": "Destructive action button, requires confirmation dialog before proceeding",
  "impact": "critical - irreversible data deletion, account cannot be recovered",
  "userType": "all",
  "tone": "urgent",
  "alternativeTerms": ["Remove Account", "Close Account"]
}
```
