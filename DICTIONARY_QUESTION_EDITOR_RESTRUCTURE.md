# Dictionary and Question Editor Restructure

## Completed Work

### 1. Schema Updates ✅
- Added `Question` model to schema with:
  - `sourceDocumentID` for tracking which document questions came from
  - `approved` boolean for managing suggested vs approved questions
  - `importedAt` timestamp
  - `difficulty`, `questionType`, and `metadata` fields
  
- Updated `Word` model with:
  - `sourceDocumentID` for tracking source documents
  - `approved` boolean
  - `importedAt` timestamp

- Updated `ParsedContent` model with:
  - `questionsJSON` field for storing extracted questions

### 2. New Components Created ✅

#### SuggestedContent.js
- **SuggestedVocabulary**: Displays parsed vocabulary with checkboxes for bulk import
- **SuggestedQuestions**: Displays parsed questions with checkboxes for bulk import
- Both components support:
  - Select/deselect all
  - Individual selection
  - Expandable details
  - Bulk import to database
  - Filtering by difficulty/type

#### DocumentUploader.js
- Supports multiple document types:
  - PDF (.pdf)
  - Word (.doc, .docx)
  - Text (.txt)
  - Excel (.xls, .xlsx, .csv)
- Features:
  - Drag and drop upload
  - Progress tracking
  - Automatic analysis triggering
  - Document list with status
  - Error handling

## Remaining Work

### 3. Restructure DictionaryEditor

**Current State**: Single scrollable list with search at top

**Target State**: Tabbed interface like FileManager

#### Tabs to Add:
1. **Words Tab** (existing functionality)
   - Move search INTO this tab's content
   - Keep existing word list and editing
   
2. **Upload Tab** (new)
   - Use `<DocumentUploader extractionType="vocabulary" />`
   - Allow drag-drop of documents
   
3. **Suggestions Tab** (new)
   - Use `<SuggestedVocabulary />`
   - Show vocabulary extracted from uploaded documents
   - Allow bulk approval/import

#### Implementation Steps:
```javascript
// In DictionaryEditor.js

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DocumentUploader from './Editor3/components/DocumentUploader';
import { SuggestedVocabulary } from './Editor3/components/SuggestedContent';

// Add tab state
const [tabValue, setTabValue] = useState(0);
const [selectedDocumentId, setSelectedDocumentId] = useState(null);

// Create TabPanel component (copy from FileManager)

// Structure:
<Box>
  <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
    <Tab label={<MenuBookIcon />} />
    <Tab label={<UploadFileIcon />} />
    <Tab label={<AutoAwesomeIcon />} />
  </Tabs>
  
  <TabPanel value={tabValue} index={0}>
    {/* Move search here */}
    <TextField 
      placeholder="Search words..."
      startAdornment={<SearchIcon />}
    />
    {/* Existing word list */}
  </TabPanel>
  
  <TabPanel value={tabValue} index={1}>
    <DocumentUploader 
      extractionType="vocabulary"
      onUploadComplete={(doc) => {
        setSelectedDocumentId(doc.id);
        setTabValue(2); // Switch to suggestions tab
      }}
    />
  </TabPanel>
  
  <TabPanel value={tabValue} index={2}>
    <SuggestedVocabulary 
      documentId={selectedDocumentId}
      unitId={unit?.id}
      onImport={(count) => {
        // Show success message
        // Optionally switch to Words tab
        setTabValue(0);
      }}
    />
  </TabPanel>
</Box>
```

### 4. Restructure QuestionEditor

**Current State**: Single scrollable list with search at top

**Target State**: Same tabbed interface

#### Tabs to Add:
1. **Questions Tab** (existing functionality)
   - Move search INTO this tab's content
   - Keep existing question list and editing
   
2. **Upload Tab** (new)
   - Use `<DocumentUploader extractionType="questions" />`
   
3. **Suggestions Tab** (new)
   - Use `<SuggestedQuestions />`
   - Show questions extracted from uploaded documents

#### Implementation: (Similar to DictionaryEditor above)

### 5. Backend Lambda Function Updates

#### Current: analyzePDF Lambda
Located in: `amplify/backend/function/analyzePDF/`

**Needs Enhancement**:
- Add question generation logic
- Parse different document types (not just PDF)
- Store results in ParsedContent.questionsJSON

#### Example Question Generation Prompt:
```javascript
const questionPrompt = `
Analyze the following document and generate comprehension questions.
For each question provide:
- prompt: The question text
- answer: Expected answer
- hint: A helpful hint
- difficulty: easy/medium/hard
- questionType: comprehension/recall/application/analysis

Document text:
${extractedText}

Return as JSON array.
`;
```

### 6. Additional Enhancements

#### Document Type Handlers
Create parsers for each document type in Lambda:
- PDF: Already handled (pdf-parse)
- Word: Use `mammoth` npm package
- Text: Direct read
- Excel/CSV: Use `xlsx` npm package

#### Search Improvements
- Filter by source document
- Filter by approved/unapproved status
- Filter by import date

#### UI Improvements
- Show document source badge on words/questions
- Batch operations (approve all, delete all from document)
- Document preview in suggestions tab

## Migration Notes

### For Users:
1. Run `amplify push` to update schema
2. Existing Words and Questions will work as-is (new fields are optional)
3. New vocabulary/questions from documents will have sourceDocumentID set

### Testing Checklist:
- [ ] Upload PDF document → vocabulary extracted
- [ ] Upload Word document → vocabulary extracted
- [ ] Upload text file → questions generated
- [ ] Select and import vocabulary
- [ ] Select and import questions
- [ ] Search within tabs works
- [ ] Generated audio works for imported items
- [ ] Multiple documents can be uploaded

## File Locations

### New Files:
- `src/components/Editor3/components/SuggestedContent.js` ✅
- `src/components/Editor3/components/DocumentUploader.js` ✅

### Files to Modify:
- `src/components/DictionaryEditor.js` - Add tabs, move search, integrate uploader
- `src/components/QuestionEditor.js` - Add tabs, move search, integrate uploader
- `amplify/backend/function/analyzePDF/` - Add question generation, multi-format support
- `schema.graphql` ✅ - Updated

### Icons to Import:
```javascript
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Words
import HelpIcon from '@mui/icons-material/Help'; // Questions
import UploadFileIcon from '@mui/icons-material/UploadFile'; // Upload
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Suggestions
```

## Next Steps

1. Update `amplify push` to apply schema changes
2. Test document upload → should create Document record
3. Update Lambda function to support question extraction
4. Modify DictionaryEditor.js with tab structure
5. Modify QuestionEditor.js with tab structure
6. Test end-to-end workflow
