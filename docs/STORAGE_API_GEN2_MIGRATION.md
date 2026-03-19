# Storage API Gen 2 Migration - Document Analysis Fix

## Problem Summary

Document analysis was failing with `NoSuchKey` errors because files were being uploaded using the **Amplify Gen 1 Storage API** (`key` + `accessLevel` options) but stored in the database with partial S3 paths that didn't include the protection level prefix.

### Error Example
```
NoSuchKey: The specified key does not exist.
Key: 'files/Sandbox Seed - AWS Amplify Gen 2 Documentation.pdf'
```

The actual S3 key should have been: `protected/{identityId}/files/Sandbox Seed - AWS Amplify Gen 2 Documentation.pdf`

## Root Cause

The codebase was mixing Gen 1 and Gen 2 Storage APIs:

### ❌ Old Gen 1 Pattern (WRONG)
```javascript
await uploadData({
  key: 'files/document.pdf',  // Partial path
  data: file,
  options: {
    accessLevel: 'protected',  // Gen 1 option
    identityId,               // Gen 1 option
    progressCallback: fn      // Gen 1 callback name
  }
});

// Stored in DB: 'files/document.pdf' ❌
// Actual S3 location: 'protected/{identityId}/files/document.pdf' ✓
// Result: NoSuchKey error when Lambda tries to access the file
```

### ✅ New Gen 2 Pattern (CORRECT)
```javascript
const s3Path = `protected/${identityId}/files/document.pdf`;

const uploadOperation = uploadData({
  path: s3Path,  // Full path with protection level
  data: file,
  options: {
    contentType: file.type,
    onProgress: (progress) => {  // Gen 2 callback name
      console.log(progress.transferredBytes, progress.totalBytes);
    }
  }
});

const uploadResult = await uploadOperation.result;
// uploadResult.path === 'protected/{identityId}/files/document.pdf' ✓

// Store in DB
fileModel.path = uploadResult.path;  // Full S3 path
documentModel.s3Key = uploadResult.path;  // Full S3 path
```

## Files Fixed

The following files were updated to use the Gen 2 Storage API:

1. **[src/utils/fileUploadUtils.jsx](../src/utils/fileUploadUtils.jsx)**
   - Main file upload utility
   - Now constructs full S3 path: `protected/${identityId}/${subfolder}/${filename}`
   - Stores `uploadResult.path` in both `File.path` and `Document.s3Key`

2. **[src/components/Editor3/components/DocumentUploader.jsx](../src/components/Editor3/components/DocumentUploader.jsx)**
   - Document upload for PDF analysis
   - Updated to Gen 2 API with full paths

3. **[src/components/Editor3/plugins/DragDropPastePlugin.js](../src/components/Editor3/plugins/DragDropPastePlugin.js)**
   - Drag-and-drop file uploads in editor
   - Updated progress callback from `progressCallback` to `onProgress`
   - Updated to use `progress.transferredBytes` and `progress.totalBytes`

4. **[src/components/Editor3/components/ConfigurationManager.jsx](../src/components/Editor3/components/ConfigurationManager.jsx)**
   - Configuration file uploads
   - Updated to Gen 2 API

5. **[src/components/DictionaryEditor2.jsx](../src/components/DictionaryEditor2.jsx)**
   - Audio file uploads for vocabulary words
   - Fixed two upload locations (regular upload and recording studio)
   - Updated to use `result.path` instead of `result.key`

6. **[src/utils/pdfThumbnailGenerator.ts](../src/utils/pdfThumbnailGenerator.ts)**
   - PDF thumbnail generation and upload
   - Updated both batch and single thumbnail functions
   - Changed return value from `result.key` to `result.path`

7. **[src/utils/userSubmissionStorage.jsx](../src/utils/userSubmissionStorage.jsx)**
   - Student submission uploads (private storage)
   - Updated to use `private/${userId}/user-submissions/...` pattern
   - Updated `deleteStudentSubmission` to use `path` instead of `key`
   - Updated documentation to reflect Gen 2 patterns

## Key Differences: Gen 1 vs Gen 2

| Aspect | Gen 1 API | Gen 2 API |
|--------|-----------|-----------|
| **Parameter** | `key` | `path` |
| **Protection Level** | `options.accessLevel` | In `path` prefix |
| **Identity ID** | `options.identityId` | In `path` prefix |
| **Progress Callback** | `progressCallback(progress)` | `onProgress(progress)` |
| **Progress Properties** | `progress.loaded`, `progress.total` | `progress.transferredBytes`, `progress.totalBytes` |
| **Result Property** | `result.key` | `result.path` |
| **Upload Response** | Promise | Object with `.result` property |

## Storage Path Patterns

### Public Files
```javascript
const s3Path = `public/files/${filename}`;
// Accessible by: All authenticated users
```

### Protected Files (User-specific, readable by others)
```javascript
const s3Path = `protected/${identityId}/files/${filename}`;
// Writable by: Owner (identityId)
// Readable by: All authenticated users
```

### Private Files (User-only)
```javascript
const s3Path = `private/${identityId}/submissions/${filename}`;
// Writable by: Owner (identityId)
// Readable by: Owner (identityId) only
```

## Lambda Access to Protected/Private Files

When Lambda functions need to access files:

```javascript
// File.path stored in DB: 'protected/{identityId}/files/doc.pdf'
const s3Key = file.path;  // Use the full path

const command = new GetObjectCommand({
  Bucket: process.env.STORAGE_BUCKET,
  Key: s3Key,  // Full path including protection prefix
});

const response = await s3Client.send(command);
```

**Note:** Lambda functions with proper IAM permissions can access any S3 object directly, bypassing the protection level restrictions (which only apply to client-side Amplify Storage API calls).

## Testing Checklist

- [ ] Upload a new PDF file via DocumentUploader
- [ ] Verify file upload completes successfully
- [ ] Trigger document analysis
- [ ] Verify Lambda can access the file (check logs for S3 GetObject success)
- [ ] Verify extracted text appears in Document record
- [ ] Test drag-and-drop file uploads in editor
- [ ] Test audio recording uploads in Dictionary Editor
- [ ] Test student submission uploads (private storage)

## Migration for Future Code

When writing new file upload code, always use:

```javascript
import { uploadData } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';

async function uploadFile(file) {
  const { userId } = await getCurrentUser(); 
  const subfolder = 'files'; // or 'images', 'audio', etc.
  
  // Construct FULL path with protection level
  const s3Path = `protected/${userId}/${subfolder}/${file.name}`;
  
  const uploadOperation = uploadData({
    path: s3Path,  // ✅ Use 'path' not 'key'
    data: file,
    options: {
      contentType: file.type,
      onProgress: (progress) => {  // ✅ Use 'onProgress' not 'progressCallback'
        const percent = Math.round(
          (progress.transferredBytes / progress.totalBytes) * 100
        );
        console.log(`Upload progress: ${percent}%`);
      }
    }
  });
  
  const uploadResult = await uploadOperation.result;
  
  // Store the FULL path in your database
  const fileRecord = await client.models.File.create({
    path: uploadResult.path,  // ✅ Full S3 path
    name: file.name,
    mimeType: file.type,
  });
  
  return fileRecord;
}
```

## References

- [FILE_HANDLING_QUICK_REFERENCE.md](FILE_HANDLING_QUICK_REFERENCE.md) - Quick reference patterns
- [STORAGE_AND_SCHEMA_REVIEW.md](STORAGE_AND_SCHEMA_REVIEW.md) - Authorization patterns
- [amplify/storage/resource.ts](../amplify/storage/resource.ts) - Storage configuration
- [Amplify Gen 2 Storage Docs](https://docs.amplify.aws/react/build-a-backend/storage/upload/)

## Deployment Notes

After deploying these changes:

1. **Existing files with partial paths will still fail** - They were created before this fix
2. **New uploads will work correctly** - They'll have full S3 paths
3. **Consider a data migration script** to fix existing File/Document records:
   ```javascript
   // Pseudo-code for migration
   const files = await client.models.File.list();
   for (const file of files) {
     if (!file.path.startsWith('public/') && 
         !file.path.startsWith('protected/') && 
         !file.path.startsWith('private/')) {
       // Add protection prefix
       const newPath = `protected/${file.identityId}/${file.path}`;
       await client.models.File.update({
         id: file.id,
         path: newPath
       });
     }
   }
   ```

## Date

**Fixed:** March 2, 2026  
**Amplify Version:** Gen 2  
**Issue:** Document analysis NoSuchKey errors  
**Resolution:** Migrated all file uploads from Gen 1 to Gen 2 Storage API
