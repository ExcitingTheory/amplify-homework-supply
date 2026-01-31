# Validation Rules

Complete validation criteria for docblock quality and accuracy.

## File-Level Docblock Requirements

A valid file-level docblock must:

1. **Exist** - Present at top of file (after imports allowed)
2. **Format** - Valid JSDoc/TSDoc syntax (`/** ... */`)
3. **Title** - Start with component/module name
4. **Description** - Include meaningful description

## Component Docblocks

### Required Elements

```typescript
/**
 * ComponentName - Brief description
 * 
 * @description
 * Detailed explanation of component functionality
 * 
 * @component
 */
```

- ✅ Component name matches export
- ✅ `@component` tag present
- ✅ Description explains purpose

### Optional But Recommended

- `@param` - For each prop
- `@metadata` - If locale metadata exists
- `@example` - Usage example
- `@see` - Links to related docs

## Validation Checks

### 1. Component Name Match

**Rule**: Docblock component name must match export name.

```typescript
// ❌ INVALID
/**
 * UserCard - ...
 */
export const ProfileCard = () => { ... };

// ✅ VALID
/**
 * ProfileCard - ...
 */
export const ProfileCard = () => { ... };
```

**Severity**: Error

### 2. Parameter Documentation

**Rule**: All function parameters must be documented if any are documented.

```typescript
// ❌ INVALID - documents some params but not all
/**
 * @param {string} name
 */
export function greet(name: string, age: number) { ... }

// ✅ VALID - all params documented
/**
 * @param {string} name - User's name
 * @param {number} age - User's age
 */
export function greet(name: string, age: number) { ... }

// ✅ VALID - no params documented (acceptable)
/**
 * Greets a user
 */
export function greet(name: string, age: number) { ... }
```

**Severity**: Warning

### 3. Outdated Parameters

**Rule**: Documented parameters must exist in current function signature.

```typescript
// ❌ INVALID - userId param no longer exists
/**
 * @param {string} userId
 */
export const Component = ({ session }: Props) => { ... };

// ✅ VALID
/**
 * @param {Session} session
 */
export const Component = ({ session }: Props) => { ... };
```

**Severity**: Error

### 4. Component Metadata

**Rule**: Components with locale metadata should have `@metadata` section.

```typescript
// If public/locales/en/chat.json has:
{
  "ChatSidebar": {
    "title": {
      "component": {
        "location": "src/components/ChatSidebar.js"
      }
    }
  }
}

// Then ChatSidebar.js should have:
/**
 * ChatSidebar - ...
 * 
 * @metadata
 * - context: Chat interface for AI assistance
 * - usage: Sidebar component
 * - impact: high
 */
```

**Severity**: Warning

### 5. Broken References

**Rule**: `@see` links must point to existing files.

```typescript
// ❌ INVALID - file doesn't exist
/**
 * @see {@link docs/MISSING.md}
 */

// ✅ VALID
/**
 * @see {@link docs/CHATBOT_TOOLS.md}
 */
```

**Severity**: Warning

### 6. TypeScript Type Accuracy

**Rule**: JSDoc types should match TypeScript types (if using TS).

```typescript
// ❌ INVALID - type mismatch
/**
 * @param {string} count
 */
export function increment(count: number) { ... }

// ✅ VALID
/**
 * @param {number} count
 */
export function increment(count: number) { ... }

// ✅ BETTER - use TypeScript, skip JSDoc types
export function increment(count: number) { ... }
```

**Severity**: Error

## Metadata Field Validation

### Required Metadata Fields (if @metadata present)

- `context` - Where/when users see this
- `usage` - Specific UI element or action
- `impact` - Importance level (critical, high, medium, low)
- `location` - File path

```typescript
/**
 * @metadata
 * - context: Login form submit button
 * - usage: Primary authentication action
 * - impact: critical - authentication required
 * - location: src/components/LoginForm.tsx
 */
```

### Impact Levels

| Level | Meaning | Examples |
|-------|---------|----------|
| critical | Data loss, security, auth | Save button, login, delete |
| high | Core functionality | Navigation, search, filters |
| medium | Important but not critical | Help text, secondary actions |
| low | Nice to have | Tooltips, placeholders |

## Validation Levels

### Strict Mode

All rules enforced as errors:

```bash
npx tsx scripts/validate-docblocks.ts --strict
```

- Missing docblocks → Error
- Outdated params → Error
- Missing metadata → Error

### Default Mode

Balanced approach:

- Missing docblocks → Warning
- Outdated params → Error
- Missing metadata → Warning

### Permissive Mode

Only critical issues:

```bash
npx tsx scripts/validate-docblocks.ts --permissive
```

- Missing docblocks → Info
- Outdated params → Warning
- Missing metadata → Info

## Auto-Fix Capabilities

Some issues can be auto-fixed with `--fix` flag:

| Issue | Auto-Fixable | How |
|-------|--------------|-----|
| Missing docblock | ✅ Yes | Generate from code analysis |
| Outdated params | ✅ Yes | Re-extract from signature |
| Component name mismatch | ✅ Yes | Update to match export |
| Missing metadata | ✅ Yes | Import from locale files |
| Broken @see links | ❌ No | Manual review needed |
| Invalid JSDoc syntax | ❌ No | Manual correction needed |

## Severity Levels

### Error

Blocks CI pipeline, must be fixed:

- Component name mismatch
- Documented params don't exist in signature
- Invalid JSDoc syntax
- Type mismatches (TypeScript)

### Warning

Should be fixed but doesn't block:

- Missing docblocks
- Incomplete param documentation
- Missing metadata section
- Broken @see links

### Info

Nice to have:

- Missing @example sections
- Missing complex type definitions
- Spelling/grammar suggestions

## Example Validation Report

```json
{
  "file": "src/components/UnitCard.tsx",
  "issues": [
    {
      "type": "mismatch",
      "severity": "error",
      "line": 5,
      "message": "Documented parameter 'unitId' not found in signature",
      "fix": "Update @param to use 'unit: Unit' instead"
    },
    {
      "type": "incomplete",
      "severity": "warning",
      "message": "Component has locale metadata but no @metadata section",
      "fix": "Run: npx tsx scripts/sync-metadata.ts src/components/UnitCard.tsx"
    }
  ]
}
```

## Custom Validation Rules

Add to `.docblock-backfill.json`:

```json
{
  "validation": {
    "requireFileDocblock": true,
    "requireMetadata": true,
    "requireExamples": false,
    "strictParamMatch": true,
    "allowMissingDescriptions": false,
    "customRules": [
      {
        "pattern": "src/components/**",
        "require": ["@component", "@metadata"]
      }
    ]
  }
}
```
