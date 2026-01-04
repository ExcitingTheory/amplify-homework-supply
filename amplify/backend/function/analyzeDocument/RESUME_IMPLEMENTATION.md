# PDF Extraction Resume Implementation

## Overview
The `analyzeDocument` Lambda function now supports resuming PDF extraction mid-run to handle AWS Lambda timeout limits (max 15 minutes).

## How It Works

### 1. Timeout Detection
```javascript
function getRemainingTime(context) {
  return context.getRemainingTimeInMillis();
}
```
- Monitors remaining Lambda execution time
- Reserves 30-second buffer before timeout for cleanup

### 2. Page-by-Page Extraction with PDF.js
Uses Mozilla's `pdfjs-dist` for true page-by-page processing:
```javascript
const pdfDocument = await pdfjsLib.getDocument({ data: buffer }).promise;

for (let pageNum = startPage + 1; pageNum <= endPage; pageNum++) {
  const page = await pdfDocument.getPage(pageNum);
  const textContent = await page.getTextContent();
  const pageText = textContent.items.map(item => item.str).join(' ');
  extractedText += pageText + '\n\n';
  page.cleanup(); // Free memory per page
}
```

Benefits:
- **True streaming**: Processes one page at a time
- **Memory efficient**: Cleans up after each page
- **Resumable**: Can stop and resume at any page boundary
- **Accurate**: Preserves text layout and spacing

### 2. State Persistence
Resume state is stored in the `Document.resumeState` field (AWSJSON):
```json
{
  "lastProcessedPage": 45,
  "accumulatedText": "...extracted text so far...",
  "totalPages": 100
}
```

### 3. Resume Flow

**Initial Invocation:**
1. Client calls `analyzeDocument(fileID)`
2. Lambda checks for existing `resumeState`
3. Starts/resumes PDF extraction
4. Processes pages in batches of 10

**When Approaching Timeout:**
1. Detects remaining time < 30 seconds
2. Saves current progress to `Document.resumeState`
3. Re-invokes itself asynchronously with same parameters
4. Returns progress status to caller

**Resume Invocation:**
1. Reads `resumeState` from Document
2. Continues from `lastProcessedPage`
3. Accumulates text with previous progress
4. Repeats until complete

**Completion:**
1. All pages processed
2. Clears `resumeState` (sets to null)
3. Proceeds with OpenAI analysis
4. Updates status to 'completed'

## Configuration

### Lambda Timeout
- Default: 15 minutes (AWS max)
- Buffer: 30 seconds reserved for cleanup
- Effective processing time: 14.5 minutes

### Batch Size
```javascript
const BATCH_SIZE = 10; // Process 10 pages at a time
```
Adjust based on:
- PDF complexity
- Page size
- Available memory

## Schema Changes

### Document Model
```graphql
type Document @model {
  # ... existing fields ...
  resumeState: AWSJSON # NEW: State for resuming operations
}
```

### AnalyzeDocumentResult
```graphql
type AnalyzeDocumentResult {
  success: Boolean!
  fileID: ID!
  documentID: ID
  responseId: String
  pageCount: Int
  progress: String  # NEW: e.g., "45/100 pages"
  message: String
}
```

## Usage

### From Frontend
```javascript
// Start analysis
const result = await API.graphql({
  query: mutations.analyzeDocument,
  variables: { fileID: 'abc-123' }
});

// Response when paused:
{
  success: true,
  fileID: 'abc-123',
  documentID: 'doc-456',
  message: 'PDF extraction paused and resumed in new invocation',
  pageCount: 100,
  progress: '45/100 pages'
}

// Monitor status via Document.status subscription
// When complete: status = 'completed'
```

### Manual Resume (if needed)
If a Lambda fails mid-extraction, simply call `analyzeDocument` again:
```javascript
await API.graphql({
  query: mutations.analyzeDocument,
  variables: { fileID: 'abc-123' }
});
```
It will automatically resume from saved state.

## Error Handling

### Automatic Recovery
- **Transient S3 errors**: Retries with exponential backoff
- **GraphQL conflicts**: Retries with version checking
- **Timeout**: Auto-resumes in new invocation

### Manual Intervention
If document status is stuck on 'extracting':
1. Check CloudWatch logs for errors
2. Call `cancelDocumentAnalysis(fileID)` to reset
3. Re-invoke `analyzeDocument(fileID)`

## Monitoring

### CloudWatch Logs
```
Extracting PDF: Starting from page 1 of 100
Processing pages 1 to 10...
Processing pages 11 to 20...
Approaching timeout with 25000ms remaining. Saving progress...
PDF extraction incomplete. Saving progress and re-invoking...
```

### Document Status Values
- `uploaded` - File uploaded, not started
- `extracting` - PDF text extraction in progress
- `extracted` - Text extracted, not yet analyzed
- `analyzing` - Sending to OpenAI
- `completed` - All done
- `failed` - Error occurred

## Limitations

### PDF.js Benefits
✅ **True page-by-page extraction**: Processes one page at a time  
✅ **Memory efficient**: Cleans up resources after each page  
✅ **Production-ready**: Used by Firefox and many other applications  
✅ **Accurate text extraction**: Preserves layout and spacing  
✅ **Handles complex PDFs**: Supports various encodings and fonts  

### Current Implementation
- Processes 10 pages per batch
- Checks timeout after each batch
- Automatically resumes on next page boundary
- Works with PDFs of unlimited size

### Future Enhancements
1. **Parallel Page Processing**
   ```javascript
   // Process multiple pages concurrently
   const pagePromises = [];
   for (let i = 0; i < BATCH_SIZE; i++) {
     pagePromises.push(extractPageText(pdfDoc, startPage + i));
   }
   const pageTexts = await Promise.all(pagePromises);
   ```

2. **Parallel Document Processing**
   - Split PDF into chunks
   - Invoke multiple Lambdas in parallel
   - Aggregate results in DynamoDB

3. **AWS Textract Integration** (for scanned PDFs)
   ```javascript
   const textract = new TextractClient({});
   const command = new StartDocumentTextDetectionCommand({
     DocumentLocation: { S3Object: { Bucket, Name: s3Key } }
   });
   ```

4. **Caching Strategy**
   ```javascript
   // Cache PDF in /tmp for multiple invocations
   const tmpPath = `/tmp/${documentID}.pdf`;
   if (!fs.existsSync(tmpPath)) {
     fs.writeFileSync(tmpPath, buffer);
   }
   ```

## Testing

### Test Large PDFs
1. Upload 100+ page PDF
2. Monitor CloudWatch for timeout behavior
3. Verify resume mechanism triggers
4. Confirm final completion

### Test Resume
1. Set Lambda timeout to 1 minute (for testing)
2. Upload large PDF
3. Should see multiple invocations in logs
4. Verify `resumeState` updates in DynamoDB

### Test Failure Recovery
1. Start extraction
2. Call `cancelDocumentAnalysis`
3.Install PDF.js dependency
cd amplify/backend/function/analyzeDocument/src
npm install

# Push schema changes
amplify push

# Deploy function
amplify push function analyzeDocument
```

### First-Time Setup
```bash
cd amplify/backend/function/analyzeDocument/src
npm install pdfjs-dist@4.0.379 canvas@2.11.2
```

Note: `canvas` is required by PDF.js for rendering operations, even though we only extract text.
# Update Lambda function
cd amplify/backend/function/analyzeDocument/src
npm install  # if adding new dependencies

# Deploy
amplify push function analyzeDocument
```

## Cost Considerations

- **Lambda invocations**: Each resume = new invocation
- **DynamoDB**: Additional writes for `resumeState` updates
- **S3 reads**: Multiple reads of same PDF (consider caching in Lambda /tmp)

### Optimization
Cache PDF buffer in /tmp directory:
```javascript
const tmpPath = `/tmp/${documentID}.pdf`;
if (!fs.existsSync(tmpPath)) {
  const buffer = await getS3Object(s3Key);
  fs.writeFileSync(tmpPath, buffer);
}
const buffer = fs.readFileSync(tmpPath);
```

## Troubleshooting

### Issue: Resume state not clearing
**Solution**: Check GraphQL mutation includes `resumeState: null`

### Issue: Infinite resume loop
**Solution**: Verify `isComplete` flag is set correctly

### Issue: Lost progress
**Solution**: Check DynamoDB for `resumeState` field persistence

### Issue: Memory errors with large PDFs
**Solution**: 
- Increase Lambda memory (up to 10GB)
- Or use streaming/chunking approach
- Or use AWS Textract instead
