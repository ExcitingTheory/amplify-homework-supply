# VocabularyReview Component - Testing Guide

## Storybook Testing

### Stories Available

1. **NotYetImported** - Fresh vocabulary ready to import
   - Shows 5 vocabulary items
   - All items selected by default
   - Can edit items before import
   - Import button enabled

2. **WithExistingWords** - Shows duplicate detection
   - 2 words already exist in dictionary (勉強, 学校)
   - These words show "Already in Dictionary" badge
   - Import will skip existing words and just link them to unit

3. **AlreadyImported** - Read-only view
   - Shows imported timestamp
   - No checkboxes or edit buttons
   - Import button hidden

4. **NoVocabulary** - Empty state
   - Shows "No vocabulary found" message

### Running Storybook

```bash
npm run storybook
```

Navigate to: **Components > VocabularyReview**

### What to Test

#### Basic Functionality
- [ ] Component renders without errors
- [ ] Vocabulary list displays with all fields (word, definition, context, page)
- [ ] Summaries section can be toggled
- [ ] Objectives section displays

#### Selection
- [ ] Can select/deselect individual items
- [ ] "Select All" button works
- [ ] "Deselect All" button works
- [ ] Selected count updates correctly

#### Editing
- [ ] Click edit button opens inline form
- [ ] Can edit word, definition, context
- [ ] Save button updates the item
- [ ] Cancel button discards changes

#### Import
- [ ] Import button disabled when no items selected
- [ ] Click import shows progress bar
- [ ] Success message displays with results
- [ ] ParsedContent.approved set to true
- [ ] ParsedContent.importedAt has timestamp

#### Dictionary Integration
- [ ] DictionaryContext provides dictionary data
- [ ] Existing words show badge
- [ ] Import skips existing words (shown in result)
- [ ] New words are created in Word model
- [ ] UnitWord relationships created

## Manual Testing in App

### Setup
1. Start the app
2. Navigate to a unit with ChatSidebar
3. Upload a PDF file

### Test Flow
1. **Upload PDF**
   - Drag & drop or click upload
   - Confirm analysis when prompted
   - Wait for "analyzed" status

2. **Open Review**
   - Click review button (book icon)
   - Modal should open with VocabularyReview

3. **Review Content**
   - Check vocabulary items display
   - View summaries (toggle open)
   - View objectives (toggle open)

4. **Edit Items**
   - Click edit on an item
   - Modify word/definition
   - Save changes
   - Verify changes persist

5. **Import**
   - Select items to import
   - Click "Import to Dictionary"
   - Monitor progress bar
   - Check success message

6. **Verify in Dictionary**
   - Open DictionaryEditor
   - Search for imported words
   - Verify they exist
   - Check they're linked to unit

7. **Re-open Review**
   - Should show "Imported" status
   - Should be read-only
   - No import button

## Common Issues

### Storybook Not Displaying

**Issue**: Blank screen or "Loading..." forever

**Fixes**:
1. Check browser console for errors
2. Clear DataStore: `await DataStore.clear()`
3. Verify DictionaryProvider is wrapping component
4. Check mock data is being created

### Dictionary Context Empty

**Issue**: `dictionary` is `{}`

**Fixes**:
1. Ensure DictionaryProvider is in decorators
2. Check DataStore.observeQuery is working
3. Verify Word model imports correctly
4. Wait for async data loading

### Import Not Working

**Issue**: Import button clicks but nothing happens

**Fixes**:
1. Check console for errors
2. Verify unitId is provided
3. Check owner and identityId are set
4. Ensure ParsedContent exists
5. Check vocabularyJSON is valid JSON

### Duplicate Detection Fails

**Issue**: Creates duplicates instead of linking

**Fixes**:
1. Check phrase comparison (case-insensitive, trimmed)
2. Verify dictionary is populated
3. Check Word.phrase field exists
4. Look for whitespace differences

## Debug Commands

### Check DataStore Contents

```javascript
// In browser console
import { DataStore } from 'aws-amplify/datastore';
import { Word, ParsedContent, Document } from '../models';

// List all words
const words = await DataStore.query(Word);
console.log('Words:', words);

// List ParsedContent
const parsed = await DataStore.query(ParsedContent);
console.log('ParsedContent:', parsed);

// List Documents
const docs = await DataStore.query(Document);
console.log('Documents:', docs);

// Clear everything
await DataStore.clear();
```

### Check Context

```javascript
// In component (add console.log)
const { dictionary, wordMapId } = useContext(DictionaryContext);
console.log('Dictionary:', dictionary);
console.log('Word count:', Object.keys(dictionary || {}).length);
```

## Expected Behavior

### First Time Import
- Creates new Word records
- Creates UnitWord relationships
- Sets ParsedContent.approved = true
- Sets ParsedContent.importedAt = timestamp
- Returns result with `imported` count

### Importing Existing Words
- Finds existing Word by phrase
- Skips Word creation
- Still creates UnitWord relationship
- Returns result with `skipped` count

### Re-importing
- Shows "Already imported" status
- Displays timestamp
- Read-only view
- No import button

## Performance

- Import ~500ms per word
- Progress updates every word
- No UI blocking
- Smooth animations

## Accessibility

- Keyboard navigation works
- Screen reader compatible
- Focus management correct
- Color contrast meets WCAG AA

---

**Last Updated**: December 27, 2025  
**Component Version**: 1.0.0
