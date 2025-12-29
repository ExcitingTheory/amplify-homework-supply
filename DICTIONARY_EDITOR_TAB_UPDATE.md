# Dictionary Editor Tabbed Interface Update

## Summary
Restructured the DictionaryEditor component to use a tabbed interface similar to FileManager, improving organization and adding document upload and vocabulary suggestion features.

## Changes Made

### 1. New Imports Added
- `Tabs`, `Tab`, `Tooltip` from '@mui/material'
- Tab icons: `MenuBookIcon`, `UploadFileIcon`, `AutoAwesomeIcon`
- Components: `DocumentUploader`, `SuggestedVocabulary`

### 2. New State Variables
```javascript
const [tabValue, setTabValue] = React.useState(0);
const [selectedDocumentId, setSelectedDocumentId] = React.useState(null);
```

### 3. New Helper Functions
- `handleTabChange(event, newValue)` - Manages tab switching
- `handleUploadComplete(documentId)` - Switches to Suggestions tab after document upload
- `handleImportComplete()` - Switches back to Words tab after importing vocabulary
- `TabPanel` component - Renders tab content with proper overflow handling

### 4. Tab Structure

#### Tab 0: Words (Icon: MenuBook)
- **Content**: Existing dictionary functionality
- **Features**:
  - Audio visualization canvas
  - Search field (moved from toolbar into tab content)
  - Import/Export/New buttons
  - Collapsible new word form
  - Dictionary list with all words

#### Tab 1: Upload Document (Icon: UploadFile)
- **Component**: `DocumentUploader`
- **Props**:
  - `extractionType="vocabulary"`
  - `unitId={unit?.id}`
  - `onUploadComplete={handleUploadComplete}`
- **Purpose**: Upload PDF, Word, Text, or Excel documents for vocabulary extraction

#### Tab 2: Suggested Vocabulary (Icon: AutoAwesome)
- **Component**: `SuggestedVocabulary`
- **Props**:
  - `documentId={selectedDocumentId}`
  - `unitId={unit?.id}`
  - `onImportComplete={handleImportComplete}`
- **Purpose**: Review and import extracted vocabulary from uploaded documents
- **Fallback**: Shows message to upload document if no document selected

## User Workflow

1. **Add New Words Manually**:
   - Stay on Words tab
   - Click "New" button to expand form
   - Fill in Phrase, Pronunciation, Definition
   - Click "Create Word"

2. **Upload Document for Vocabulary**:
   - Switch to Upload tab
   - Drag-drop or select document (PDF/Word/Text/Excel)
   - Document is automatically analyzed
   - Automatically switches to Suggestions tab when complete

3. **Review and Import Suggestions**:
   - Review extracted vocabulary on Suggestions tab
   - Edit any entries if needed
   - Select which words to import
   - Click "Import Selected"
   - Automatically switches back to Words tab
   - New words appear in dictionary list

4. **Search Existing Words**:
   - Return to Words tab
   - Use search field to filter dictionary
   - Search updates in real-time

## Technical Details

### Tab Navigation
- Icon-only tabs with tooltips for clean UI
- Consistent with FileManager pattern
- Tabs use MUI's `borderBottom` divider

### State Management
- `tabValue` controls which tab is visible
- `selectedDocumentId` tracks the most recently uploaded document
- Automatic tab switching on upload completion and import completion

### Component Integration
- Reuses existing `DocumentUploader` and `SuggestedVocabulary` components
- Maintains all existing dictionary functionality
- No breaking changes to existing features

### Layout
- Container height: `calc(100vh - 10rem)`
- Flexbox column layout for proper tab panel sizing
- Tab panels have `overflow: auto` for scrollable content
- Hidden panels use `display: none` for performance

## Files Modified
- `/src/components/DictionaryEditor.js`

## Dependencies
- `@mui/material` (Tabs, Tab, Tooltip)
- `@mui/icons-material` (MenuBookIcon, UploadFileIcon, AutoAwesomeIcon)
- `./Editor3/components/DocumentUploader`
- `./Editor3/components/SuggestedContent` (SuggestedVocabulary export)

## Future Enhancements
- Enable Import/Export buttons for CSV/JSON functionality
- Add batch editing in Words tab
- Add filtering options in Suggestions tab
- Add document history/management in Upload tab
