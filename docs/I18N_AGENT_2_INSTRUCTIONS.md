# Agent 2 Instructions: Chat & AI Components

**Agent ID**: Agent 2  
**Assignment**: Components namespace - Chat and AI-related components  
**Branch**: `i18n/components-chat`  
**Estimated Time**: 2-3 hours  
**Priority**: HIGH (user-facing chat interface)

## Your Mission

Implement i18n translation tags in 10 chat and AI component files using the `components` namespace.

## Setup

```bash
# 1. Create your branch
cd /path/to/amplify-homework-supply
git checkout -b i18n/components-chat

# 2. Verify namespace file exists
cat public/locales/en/components.json
# Should show: copyright, proTip, aiFeedbackWidget, chatSidebar, etc.
```

## Files to Complete (in order)

### File 1: src/Copyright.js (2 strings)

**Strings**:
- Line 8: "Copyright ©"
- Line 9: "Your Website"

**Implementation**:
```javascript
import { useTranslation } from 'next-i18next';

export default function Copyright() {
    const { t } = useTranslation('components');
    
    return (
        <Typography variant="body2" color="text.secondary" align="center">
            {t('copyright.text')}{' '}
            <Link color="inherit" href="https://homeworksupply.com/">
                {t('copyright.website')}
            </Link>{' '}
            {new Date().getFullYear()}.
        </Typography>
    );
}
```

**Commit**:
```bash
git add src/Copyright.js
git commit -m "i18n: Add translations to src/Copyright.js (2 strings)"
```

### File 2: src/ProTip.js (3 strings)

**Strings**:
- Line 17: Pro tip message with link

**Implementation**:
```javascript
const { t } = useTranslation('components');
// Use t('proTip.message')
```

**Commit**:
```bash
git add src/ProTip.js
git commit -m "i18n: Add translations to src/ProTip.js (3 strings)"
```

### File 3: src/components/AIFeedbackWidget.tsx (7 strings)

**Strings**:
- Line 224: "Helpful"
- Line 249: "Needs improvement"
- Line 270: "What could be improved?"
- Line 275: "Select all that apply:"
- Line 315: "Cancel"
- Line 323: "Submit"

**Implementation**:
```typescript
import { useTranslation } from 'next-i18next';

export default function AIFeedbackWidget() {
    const { t } = useTranslation('components');
    
    // Replace strings:
    // "Helpful" → {t('aiFeedbackWidget.helpful')}
    // "Needs improvement" → {t('aiFeedbackWidget.needsImprovement')}
    // etc.
}
```

**Commit**:
```bash
git add src/components/AIFeedbackWidget.tsx
git commit -m "i18n: Add translations to AIFeedbackWidget.tsx (7 strings)"
```

### File 4: src/components/ChatSidebar.js (52 strings) ⚠️ COMPLEX

**⚠️ CRITICAL - Read Before Starting**:

This file has complex message rendering with `message.parts` arrays. **DO NOT modify the message parsing logic**.

**Before making changes**:
```bash
# Check current working implementation
git log --oneline -- src/components/ChatSidebar.js | head -5
git show HEAD:src/components/ChatSidebar.js | grep -A 10 "message.parts"
```

**Message format** (DO NOT CHANGE):
```javascript
message.parts.filter(p => p.type === 'text').map(p => p.text).join('')
```

**Translatable strings** (UI labels only):
- Error messages: "Error rendering message"
- Drop zones: "Drop files here..."
- Empty states: "No messages yet"
- Button labels: "Cancel", "Execute", "Confirm & Execute"
- Section headings: "Today", "Yesterday"
- Helper text

**Implementation**:
```javascript
const { t } = useTranslation('components');

// UI strings only
<Typography>{t('chatSidebar.errorRenderingMessage')}</Typography>
<div>{t('chatSidebar.dropFilesHere')}</div>

// DO NOT translate message content or tool outputs
// Those come from AI responses, not UI labels
```

**Test after changes**:
```bash
# Verify message rendering still works
git diff src/components/ChatSidebar.js | grep -A 3 "message.parts"
# Should show NO changes to message.parts logic
```

**Commit**:
```bash
git add src/components/ChatSidebar.js
git commit -m "i18n: Add translations to ChatSidebar.js (52 UI strings, preserved message.parts logic)"
```

### File 5: src/components/ChatSidebar/ContentPreview.tsx (5 strings)

**Strings**:
- Content type labels
- "Insert" button
- Success messages

**Implementation**:
```typescript
const { t } = useTranslation('components');
// t('chatSidebar.contentPreview.insertButton')
// t('chatSidebar.contentPreview.successMessage')
```

**Commit**:
```bash
git add src/components/ChatSidebar/ContentPreview.tsx
git commit -m "i18n: Add translations to ContentPreview.tsx (5 strings)"
```

### File 6: src/components/ChatSidebar/LexicalMessageRenderer.jsx (1 string)

**String**:
- Line 120: "Error rendering message"

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('chatSidebar.errorRenderingMessage')
```

**Commit**:
```bash
git add src/components/ChatSidebar/LexicalMessageRenderer.jsx
git commit -m "i18n: Add translations to LexicalMessageRenderer.jsx (1 string)"
```

### File 7: src/components/ChatSidebar/SearchResults.js (10 strings)

**Strings**:
- "show less" / "show more"
- "No results found"
- Search helper text
- Section toggles

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('chatSidebar.searchResults.noResults')
// t('chatSidebar.showLess')
// t('chatSidebar.showMore')
```

**Commit**:
```bash
git add src/components/ChatSidebar/SearchResults.js
git commit -m "i18n: Add translations to SearchResults.js (10 strings)"
```

### File 8: src/components/ChatSidebar/ToolCallPreview.tsx (5 strings)

**Strings**:
- "Cancel"
- "Execute"
- "Confirm & Execute"
- Form option text

**Implementation**:
```typescript
const { t } = useTranslation('components');
// t('chatSidebar.cancel')
// t('chatSidebar.execute')
// t('chatSidebar.confirmAndExecute')
```

**Commit**:
```bash
git add src/components/ChatSidebar/ToolCallPreview.tsx
git commit -m "i18n: Add translations to ToolCallPreview.tsx (5 strings)"
```

### File 9: src/components/ChatSidebar/VirtualizedMessageList.jsx (6 strings)

**Strings**:
- Empty state messages
- "Today" / "Yesterday" separators
- Message type labels

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('chatSidebar.emptyState')
// t('chatSidebar.today')
// t('chatSidebar.yesterday')
```

**Commit**:
```bash
git add src/components/ChatSidebar/VirtualizedMessageList.jsx
git commit -m "i18n: Add translations to VirtualizedMessageList.jsx (6 strings)"
```

### File 10: src/components/DictionaryEditor2.js (5 strings)

**Strings**:
- Ruby tag instructions
- Field labels
- Dialog titles
- "Cancel" / "Save" buttons

**Implementation**:
```javascript
const { t } = useTranslation('components');
// t('dictionaryEditor.rubyTagInstructions')
// t('dictionaryEditor.cancel')
// t('dictionaryEditor.save')
```

**Commit**:
```bash
git add src/components/DictionaryEditor2.js
git commit -m "i18n: Add translations to DictionaryEditor2.js (5 strings)"
```

## Quality Checklist (for each file)

- [ ] Imported `useTranslation` from 'next-i18next'
- [ ] Added `const { t } = useTranslation('components');`
- [ ] All literal strings replaced with `t('key')` calls
- [ ] Keys exist in `public/locales/en/components.json`
- [ ] Ran `git diff` to review changes
- [ ] **For ChatSidebar.js**: Verified `message.parts` logic unchanged
- [ ] Skipped CSS values and technical attributes
- [ ] Committed with descriptive message

## Critical Warnings

### ⚠️ ChatSidebar.js Message Rendering

**DO NOT CHANGE**:
```javascript
// This must remain unchanged:
message.parts.filter(p => p.type === 'text').map(p => p.text).join('')
message.parts.filter(p => p.type?.startsWith('tool-'))
```

**ONLY translate**:
- UI labels (buttons, headings)
- Error messages
- Empty states
- Helper text

**NOT translatable**:
- Message content (comes from AI)
- Tool call outputs
- Search results content

## Update Status Document

After each file, update `docs/I18N_TRANSLATION_STATUS.md`:

```markdown
| src/Copyright.js | 2 | ✅ Complete - Agent 2 |
```

## Final Steps

```bash
# Review all changes
git log --oneline

# Push your branch
git push origin i18n/components-chat

# Update status: Agent 2 finished (10 files, ~100 strings)
```

## Reference

- **Namespace file**: `public/locales/en/components.json`
- **Mock data format**: `.storybook/__mocks__/ui-data/` (for ChatSidebar structure)
- **False positives**: Skip CSS values, technical attributes
- **Original audit**: `I18N_TRANSLATION_TODOS.md` lines 160-209

## Success Criteria

✅ All 10 component files have translation tags  
✅ ChatSidebar message.parts logic preserved  
✅ All `t()` calls reference valid keys  
✅ Clean git history  
✅ Status document updated
