# Vocabulary Import System - User Guide

## Overview

The Vocabulary Import System allows instructors to automatically extract vocabulary from uploaded PDF documents, review the extracted content, and import approved vocabulary into the unit dictionary.

## Workflow

### 1. Upload PDF

1. Open the **ChatSidebar** (AI Assistant)
2. Drag and drop a PDF file, or click the upload button
3. Confirm when asked if you want to analyze the PDF
4. Wait for the analysis to complete (status will show "analyzed")

### 2. Review Vocabulary

1. Click the **Review** button (book icon) on the analyzed PDF
2. A dialog will open showing:
   - **Summaries**: Overview of document content
   - **Learning Objectives**: Auto-generated learning goals
   - **Vocabulary List**: Extracted words with definitions and context

### 3. Edit Vocabulary (Optional)

- Click the **Edit** button (pencil icon) on any vocabulary item
- Modify:
  - Word/phrase
  - Definition
  - Context sentence
  - Page number
- Click **Save** to update, or **Cancel** to discard changes

### 4. Select Items to Import

- All vocabulary items are selected by default
- Uncheck items you don't want to import
- Use **Select All** / **Deselect All** buttons for bulk operations

### 5. Import to Dictionary

1. Click **Import to Dictionary**
2. Monitor the progress bar
3. Review the import results:
   - **New words**: Created and linked to the unit
   - **Existing words**: Already in dictionary, just linked to unit
   - **Errors**: Failed imports with error details

### 6. Verification

- Imported vocabulary is automatically linked to the current unit
- Check the **DictionaryEditor** to verify imported words
- Already imported documents show an "Imported" status with timestamp

## Features

### Duplicate Detection

- The system checks for existing words before creating new ones
- If a word already exists:
  - It will NOT create a duplicate
  - It WILL link the existing word to the current unit
  - Import result shows as "skipped" (existing)

### Vocabulary Data Structure

Each vocabulary item includes:

```json
{
  "word": "勉強",
  "definition": "study; studying",
  "context": "I study Japanese every day.",
  "page": 1
}
```

### Import Tracking

- **ParsedContent.approved**: Set to `true` when vocabulary is reviewed/imported
- **ParsedContent.importedAt**: Timestamp of import completion
- Once imported, the vocabulary list shows as read-only

### Unit Linking

- Words are linked to units via the **UnitWord** junction table
- One word can be linked to multiple units
- Students see vocabulary relevant to their current unit

## Technical Details

### Files

- **`src/utils/vocabularyImportUtils.js`**: Import logic
  - `importVocabularyToUnit()`: Main import function
  - `findExistingWord()`: Duplicate detection
  - `createWord()`: Word creation
  - `linkWordToUnit()`: Unit-word relationship
  - `updateVocabularyItem()`: Edit vocabulary
  - `getVocabularyImportStatus()`: Check import status

- **`src/components/VocabularyReview.js`**: UI component
  - Displays vocabulary with checkboxes
  - Inline editing
  - Import progress tracking
  - Summaries and objectives display

- **`src/components/ChatSidebar.js`**: Integration
  - Upload and analysis triggering
  - Review dialog launcher

### GraphQL Models

```graphql
type ParsedContent {
  id: ID!
  documentID: ID!
  vocabularyJSON: AWSJSON  # Array of vocabulary items
  summariesJSON: AWSJSON   # Array of summaries
  objectivesJSON: AWSJSON  # Array of learning objectives
  approved: Boolean        # Marked true on import
  importedAt: AWSDateTime  # Timestamp of import
}

type Word {
  id: ID!
  phrase: String
  definition: String
  units: [Unit] @manyToMany(relationName: "UnitWord")
}

type UnitWord {
  id: ID!
  unitId: ID!
  wordId: ID!
}
```

## Error Handling

### Common Errors

1. **"ParsedContent not found"**
   - PDF analysis may have failed
   - Check document status
   - Re-upload and analyze the PDF

2. **"No vocabulary items to import"**
   - PDF had no extractable vocabulary
   - Check if PDF is text-based (not scanned image)
   - Verify PDF content is appropriate for vocabulary extraction

3. **Import partially failed**
   - Some words imported successfully
   - Check `errorDetails` in import result
   - Common causes:
     - Malformed vocabulary data
     - Database connection issues
     - Missing required fields

### Troubleshooting

1. **PDF not analyzing**
   - Check CloudWatch logs for Lambda function `analyzePdf`
   - Verify OpenAI API key in SSM Parameter Store
   - Check S3 bucket permissions

2. **Import button disabled**
   - No items selected
   - Already imported (check timestamp)
   - Missing unit context

3. **Words not appearing in dictionary**
   - Verify import completed successfully
   - Check owner field matches current user
   - Query Word model directly in DataStore

## Best Practices

### For Instructors

1. **Review Before Importing**
   - AI extraction may have errors
   - Check definitions for accuracy
   - Verify context sentences are appropriate

2. **Edit Questionable Items**
   - Fix typos or incorrect definitions
   - Add cultural notes if needed
   - Correct page numbers if wrong

3. **Selective Importing**
   - Don't import everything blindly
   - Focus on unit-relevant vocabulary
   - Skip overly complex or irrelevant terms

4. **Verify After Import**
   - Check DictionaryEditor
   - Test vocabulary in exercises
   - Ensure unit-word linkage is correct

### For Developers

1. **Progress Callbacks**
   ```javascript
   importVocabularyToUnit(
     parsedContentId,
     unitId,
     selectedIndices,
     owner,
     identityId,
     (current, total, message) => {
       console.log(`${current}/${total}: ${message}`);
     }
   );
   ```

2. **Error Handling**
   ```javascript
   const result = await importVocabularyToUnit(...);
   if (!result.success) {
     console.error('Import failed:', result.errorDetails);
   }
   ```

3. **Testing**
   - Use Storybook: `VocabularyReview.stories.jsx`
   - Mock ParsedContent data
   - Test duplicate scenarios
   - Verify unit linking

## Future Enhancements

### Planned Features

1. **Bulk PDF Processing**
   - Upload multiple PDFs at once
   - Batch import vocabulary
   - Progress dashboard

2. **Vocabulary Categorization**
   - Auto-tag by topic (grammar, nouns, verbs, etc.)
   - JLPT level detection
   - Difficulty scoring

3. **Custom Extraction Rules**
   - Per-unit vocabulary extraction settings
   - Include/exclude patterns
   - Custom AI prompts

4. **Merge Duplicates**
   - UI to identify and merge similar words
   - Bulk deduplication
   - Conflict resolution

5. **Export Functionality**
   - Export to Anki
   - CSV download
   - PDF flashcards

### Known Limitations

1. **OCR Not Supported**
   - Scanned PDFs won't work
   - Only text-based PDFs supported
   - Use OCR preprocessing if needed

2. **Character Limit**
   - Large PDFs (>100k chars) are truncated
   - May miss vocabulary from later pages
   - Consider splitting large documents

3. **Single Language**
   - Currently optimized for Japanese
   - Other languages may have mixed results
   - Expand prompts for multi-language support

## Support

For issues or questions:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review CloudWatch logs
3. Test with Storybook examples
4. Contact development team

---

**Last Updated**: December 27, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
