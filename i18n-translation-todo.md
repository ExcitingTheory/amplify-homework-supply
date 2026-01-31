# i18n Translation TODO List

Generated from i18n-report.txt on January 31, 2026

## Summary

- **Total Files**: 35 files with literal string warnings
- **Parse Errors to Fix First**: 5 files
- **User-Facing Strings**: ~30 strings need translation
- **Technical Strings** (can ignore): ~110 strings (CSS, ARIA, test IDs)

---

## 🔴 HIGH PRIORITY - Parse Errors (Fix First)

These files have syntax errors that prevent proper linting:

### 1. [pages/section/[id].js](pages/section/[id].js#L950)
- **Error**: Expected corresponding JSX closing tag for `<Typography>`
- **Action**: Fix JSX syntax error

### 2. [pages/sections.js](pages/sections.js#L237)
- **Error**: Expected corresponding JSX closing tag for `<form>`
- **Action**: Fix JSX syntax error

### 3. [src/components/Editor3/components/FileManager2.js](src/components/Editor3/components/FileManager2.js#L1331)
- **Error**: Expected corresponding JSX closing tag for `<Button>`
- **Action**: Fix JSX syntax error

### 4. [src/components/Editor3/components/MetadataCard.jsx](src/components/Editor3/components/MetadataCard.jsx#L28)
- **Error**: Identifier 'ExpandMoreIcon' has already been declared
- **Action**: Remove duplicate declaration

### 5. [src/components/Editor3/components/TableOfContents.js](src/components/Editor3/components/TableOfContents.js#L69)
- **Error**: Unexpected token, expected "..."
- **Action**: Fix syntax error

### 6. [src/components/Editor3/components/TabsVerticalLeft.js](src/components/Editor3/components/TabsVerticalLeft.js#L187)
- **Error**: Unexpected token
- **Action**: Fix syntax error

---

## 🟡 MEDIUM PRIORITY - User-Facing Strings

### [pages/index.js](pages/index.js)

#### Lines 494-497: Status color mappings
```javascript
// Currently:
return 'success.main';
return 'info.main';
return 'warning.main';
return 'error.main';
```
**Action**: These are MUI theme color paths - **CAN IGNORE** (technical, not user-facing)

---

### [src/components/ChatSidebar.js](src/components/ChatSidebar.js)

#### Lines 1463, 1509, 1555, 1600: Error indicators
```jsx
// Currently:
<Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
  ✗ {part.errorText}
</Typography>
```
**Strings to translate**:
- `"✗"` → `t('chatSidebar.errorSymbol')` or keep as-is (universal symbol)

#### Lines 1503, 1549: Success indicators
```jsx
// Currently:
<Typography variant="caption" sx={{ display: 'block', color: 'success.dark' }}>
  ✓ {part.output?.message || t('chatSidebar.created')}
</Typography>
```
**Strings to translate**:
- `"✓"` → `t('chatSidebar.successSymbol')` or keep as-is (universal symbol)

**Note**: Part of these already use `t('chatSidebar.created')` and `t('chatSidebar.ready')`, so they're partially internationalized.

---

### [src/components/Editor3/components/PdfViewerComponent.js](src/components/Editor3/components/PdfViewerComponent.js)

#### Line 456: No PDF message
```jsx
// Currently:
<Typography variant="body2" color="text.secondary">
  No PDF to display
</Typography>
```
**Action**: 
```jsx
<Trans i18nKey="pdfViewer.noPdfToDisplay">
  No PDF to display
</Trans>
```

---

### [src/components/RecordingStudio3.jsx](src/components/RecordingStudio3.jsx)

#### Line 700: Timeline line label
```jsx
// Currently:
<Typography variant="subtitle2" gutterBottom>
  Line #{scriptData.dialogue.findIndex(d => d.id === selectedDialogue.id) + 1} - {selectedSpeaker?.name}
</Typography>
```
**Action**:
```jsx
<Typography variant="subtitle2" gutterBottom>
  {t('recordingStudio.lineNumber', { 
    number: scriptData.dialogue.findIndex(d => d.id === selectedDialogue.id) + 1,
    speaker: selectedSpeaker?.name 
  })}
</Typography>
```

#### Line 763: Takes label
```jsx
// Currently:
<Typography variant="caption" color="text.secondary">
  Takes:
</Typography>
```
**Action**:
```jsx
<Typography variant="caption" color="text.secondary">
  {t('recordingStudio.takes')}
</Typography>
```

#### Line 807: Timeline header
```jsx
// Currently:
<Typography variant="subtitle2" gutterBottom>
  Timeline
</Typography>
```
**Action**:
```jsx
<Typography variant="subtitle2" gutterBottom>
  {t('recordingStudio.timeline')}
</Typography>
```

#### Line 887: Voice label
```jsx
// Currently:
<InputLabel>Voice</InputLabel>
```
**Action**:
```jsx
<InputLabel>{t('recordingStudio.voice')}</InputLabel>
```

#### Line 933: Processing queue message
```jsx
// Currently:
<Typography variant="caption" color="text.secondary">
  Processing {ttsQueue.length} lines...
</Typography>
```
**Action**:
```jsx
<Typography variant="caption" color="text.secondary">
  {t('recordingStudio.processingLines', { count: ttsQueue.length })}
</Typography>
```

---

### [src/components/RecordingStudioEnhanced.js](src/components/RecordingStudioEnhanced.js)

#### Line 301: Pop/Click filter button
```jsx
// Currently:
<Button
  size="small"
  variant={filters.popClickRemoval ? 'contained' : 'outlined'}
  onClick={() => setFilters({ ...filters, popClickRemoval: !filters.popClickRemoval })}
>
  Pop/Click
</Button>
```
**Action**:
```jsx
<Button
  size="small"
  variant={filters.popClickRemoval ? 'contained' : 'outlined'}
  onClick={() => setFilters({ ...filters, popClickRemoval: !filters.popClickRemoval })}
>
  {t('recordingStudio.filters.popClick')}
</Button>
```

#### Line 331: Normalize filter button
```jsx
// Currently:
<Button
  size="small"
  variant={filters.normalize ? 'contained' : 'outlined'}
  onClick={() => setFilters({ ...filters, normalize: !filters.normalize })}
>
  Normalize
</Button>
```
**Action**:
```jsx
<Button
  size="small"
  variant={filters.normalize ? 'contained' : 'outlined'}
  onClick={() => setFilters({ ...filters, normalize: !filters.normalize })}
>
  {t('recordingStudio.filters.normalize')}
</Button>
```

---

### [src/components/embeddings/UnitEmbeddingComponents.js](src/components/embeddings/UnitEmbeddingComponents.js)

#### Line 53: Error alert
```jsx
// Currently:
<Alert severity="error" sx={{ mt: 1 }}>
  Error: {error.message}
</Alert>
```
**Action**:
```jsx
<Alert severity="error" sx={{ mt: 1 }}>
  {t('embeddings.error', { message: error.message })}
</Alert>
```

---

## 🟢 LOW PRIORITY - Technical Strings (Can Ignore)

These are technical values that don't need translation:

### CSS/Style Properties (110 instances)
- `display="flex"` / `display="block"`
- `flexDirection="column"` / `flexDirection="row"`
- `justifyContent="center"` / `justifyContent="space-between"`
- `overflowY='auto'` / `overflowY='hidden'`
- `borderStyle = '1px solid #ccc'` (and variants)
- Theme color paths: `'success.main'`, `'error.main'`, etc.
- CSS values: `{'grayscale(1)'}`

### ARIA Attributes (20+ instances)
- `aria-haspopup="true"`
- `aria-controls="text-alignment-menu"` (and similar)
- `open ? 'true' : undefined`

### Test IDs (9 instances)
- `data-test-id="image-modal-url-input"`
- `data-test-id="table-modal-rows"`
- etc.

### Technical Identifiers (12 instances)
- `droppableId="list"`
- `buttonClassName="toolbar-item dialog-dropdown"`
- `contentType: 'audio/ogg'`
- `type: 'audio/mp3'`
- `usernameAttributes="email"`
- `part.type?.startsWith('tool-')`
- `part.type?.replace('tool-', '')`
- Function parameter strings: `filterAndHighlight(parsedContent.vocabulary, 'term')`
- Mock data: `owner="current-user"`, `identityId="current-identity"`

### HTML Attributes
- `lang="en"` in `_document.js` (line 10) - **Consider making dynamic based on i18n.language**

---

## 🔧 IGNORE - Configuration Issues

### Storybook Files (4 files)
Files with Storybook package import warnings - not translation issues:
- `src/components/ChatSidebar/ContentPreview.stories.tsx`
- `src/components/ChatSidebar/ToolCallPreview.stories.tsx`
- `src/components/Editor3/components/MetadataEditor.stories.tsx`
- `src/components/PdfThumbnail.stories.tsx`
- `src/components/QuestionsReview2.stories.tsx`
- `src/components/VocabularyReview2.stories.tsx`

### Unused ESLint Directives (4 instances)
- `src/API.ts` (line 2)
- `src/aws-exports.js` (line 1)
- `src/components/Editor3/utils/url.js` (line 12)
- `src/components/Editor3/components/TableComponent.js` (lines 1225, 1267)

---

## 📊 Summary by Category

| Category | Count | Action |
|----------|-------|--------|
| Parse Errors | 6 | Fix syntax first |
| User-Facing Strings | ~15 | Translate with t() |
| CSS/Style Properties | ~70 | Ignore |
| ARIA Attributes | ~25 | Ignore |
| Test IDs | 9 | Ignore |
| Technical Identifiers | ~15 | Ignore |
| Configuration Issues | 10 | Ignore |
| **TOTAL** | **150** | **~15 need work** |

---

## 🎯 Recommended Action Plan

### Phase 1: Fix Syntax Errors
1. Fix 6 parse errors listed above
2. Re-run lint to get accurate report

### Phase 2: Translate User-Facing Strings
1. **RecordingStudio3.jsx** (5 strings)
2. **RecordingStudioEnhanced.js** (2 strings)
3. **PdfViewerComponent.js** (1 string)
4. **UnitEmbeddingComponents.js** (1 string)
5. **ChatSidebar.js** (verify existing translations complete)

### Phase 3: Add ESLint Exceptions
Add `/* eslint-disable-next-line i18next/no-literal-string */` to:
- CSS property literals
- ARIA attributes
- Test IDs
- Technical identifiers

Or configure ESLint to ignore these patterns globally.

---

## 📝 Translation Keys Needed

Add these to appropriate locale files:

### `recordingStudio.json`
```json
{
  "lineNumber": "Line #{{number}} - {{speaker}}",
  "takes": "Takes:",
  "timeline": "Timeline",
  "voice": "Voice",
  "processingLines": "Processing {{count}} lines...",
  "filters": {
    "popClick": "Pop/Click",
    "normalize": "Normalize"
  }
}
```

### `pdfViewer.json`
```json
{
  "noPdfToDisplay": "No PDF to display"
}
```

### `embeddings.json`
```json
{
  "error": "Error: {{message}}"
}
```

### `chatSidebar.json` (verify these exist)
```json
{
  "errorSymbol": "✗",
  "successSymbol": "✓",
  "created": "Created",
  "ready": "Ready"
}
```

---

**End of Report**
