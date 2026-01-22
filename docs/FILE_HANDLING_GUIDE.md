# Amplify Gen 2 File Handling Guide

## Overview

This guide covers proper file handling patterns for the Homework Supply application using Amplify Gen 2. The implementation follows AWS best practices for secure, scalable file management.

## Architecture

### Storage Structure (S3)

Files are organized by access level using identity-based prefixes:

```
s3://homework-supply-bucket/
├── public/                          # Publicly readable
│   ├── audio/                       # Audio files (student recordings, AI-generated)
│   ├── images/                      # Images (lesson graphics, generated)
│   └── documents/                   # Uploaded PDFs/docs for analysis
├── protected/{identityId}/          # User-specific
│   ├── submissions/                 # Student work submissions
│   ├── recordings/                  # Student audio/video recordings
│   └── uploads/                     # Uploaded learning materials
└── private/{identityId}/            # Instructor-only
    ├── answer_keys/                 # Instructor answer keys
    └── templates/                   # Lesson templates
```

### Access Control

| Path | Read | Write | Delete | Use Case |
|------|------|-------|--------|----------|
| `public/*` | All authenticated | Authenticated | Authenticated | Published content, media files |
| `protected/{id}/*` | User + Authenticated | User | User | Personal submissions |
| `private/{id}/*` | User only | User | User | Instructor materials |

## Client-Side File Operations

### 1. Upload a File

```typescript
import { uploadData } from 'aws-amplify/storage';

async function uploadAudio(file: File, identityId: string) {
  try {
    const result = await uploadData({
      path: `public/audio/${identityId}/${Date.now()}-${file.name}`,
      data: file,
      options: {
        contentType: file.type,
        onProgress: ({ transferredBytes, totalBytes }) => {
          const percent = Math.round((transferredBytes / totalBytes) * 100);
          console.log(`Upload ${percent}%`);
        },
      },
    }).result;

    // result.path contains the uploaded S3 path
    return result.path;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

**Key Points:**
- **Path prefix** must match authenticated user's `identityId` or be `public/`
- **Timestamp** prevents filename collisions
- **Content-Type** is required for proper file handling
- **Progress tracking** via `onProgress` callback

### 2. Create Record with File Reference

After uploading, associate the file with a database record:

```typescript
import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

async function createUnitWithThumbnail(unitData: any, thumbnailFile?: File) {
  // Step 1: Create the unit record
  const unitResponse = await client.models.Unit.create({
    name: unitData.name,
    description: unitData.description,
  });

  const unit = unitResponse.data;
  if (!unit) throw new Error('Failed to create unit');

  // Step 2: Upload thumbnail if provided
  if (thumbnailFile) {
    try {
      const uploadResult = await uploadData({
        path: `public/thumbnails/${unit.id}-${thumbnailFile.name}`,
        data: thumbnailFile,
        options: {
          contentType: thumbnailFile.type,
        },
      }).result;

      // Step 3: Associate thumbnail with unit
      await client.models.Unit.update({
        id: unit.id,
        thumbnail: uploadResult.path, // Store S3 path
      });
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      // Continue without thumbnail
    }
  }

  return unit;
}
```

**Pattern:**
1. Create database record (gets ID)
2. Use record ID in upload path for uniqueness
3. Update record with file path
4. Handle upload failures gracefully

### 3. Retrieve File URL

```typescript
import { getUrl } from 'aws-amplify/storage';

async function getFileUrl(s3Path: string): Promise<string> {
  const result = await getUrl({
    path: s3Path,
    options: {
      validateObjectExistence: true, // Optional: check file exists
      expiresIn: 3600, // 1 hour expiration (default)
    },
  });

  return result.url.toString();
}

// Usage: Get thumbnail for display
async function displayUnitThumbnail(unit: Unit) {
  if (!unit.thumbnail) return;
  
  const url = await getUrl({ path: unit.thumbnail });
  // Use url.url.toString() in img src
}
```

**Key Points:**
- Returns **signed URL** (temporary access)
- Expires after `expiresIn` seconds (default 3600)
- `validateObjectExistence` checks file hasn't been deleted
- Always call `getUrl()` before displaying (don't cache URLs)

### 4. Update File Association

```typescript
async function updateUnitImage(unitId: string, newImageFile: File) {
  const client = generateClient<Schema>();

  // Get current unit to check existing image
  const unitResponse = await client.models.Unit.get({ id: unitId });
  const unit = unitResponse.data;

  if (!unit) throw new Error('Unit not found');

  // Upload new image
  const uploadResult = await uploadData({
    path: `public/images/${unitId}-${newImageFile.name}`,
    data: newImageFile,
    options: { contentType: newImageFile.type },
  }).result;

  // Update unit with new image path
  await client.models.Unit.update({
    id: unitId,
    thumbnail: uploadResult.path,
  });

  // Optional: Delete old image
  if (unit.thumbnail) {
    // Avoid breaking references - only delete if no other records use it
    await remove({ path: unit.thumbnail });
  }
}
```

### 5. Delete File Association

**Option 1: Remove Association, Keep File**
```typescript
await client.models.Unit.update({
  id: unitId,
  thumbnail: null, // Dissociate without deleting
});
```

**Option 2: Remove Association and Delete File**
```typescript
import { remove } from 'aws-amplify/storage';

const unit = await client.models.Unit.get({ id: unitId });
if (unit.data?.thumbnail) {
  // Remove from database
  await client.models.Unit.update({
    id: unitId,
    thumbnail: null,
  });

  // Delete from S3
  await remove({ path: unit.data.thumbnail });
}
```

**Option 3: Delete Record and All Associated Files**
```typescript
// For records with multiple files (array)
async function deleteUnitAndFiles(unitId: string) {
  const unitResponse = await client.models.Unit.get({ id: unitId });
  const unit = unitResponse.data;

  if (!unit) return;

  // Delete all associated files in parallel
  if (unit.thumbnail) {
    await remove({ path: unit.thumbnail });
  }

  // If multiple files in array:
  if (unit.filePaths && Array.isArray(unit.filePaths)) {
    await Promise.all(
      unit.filePaths.map(path => 
        remove({ path }).catch(err => 
          console.warn(`Failed to delete ${path}:`, err)
        )
      )
    );
  }

  // Delete database record
  await client.models.Unit.delete({ id: unitId });
}
```

### 6. Work with Multiple Files

```typescript
// Store array of file paths
const schema = a.schema({
  Album: a.model({
    id: a.id().required(),
    name: a.string().required(),
    imagePaths: a.string().array(), // Array of S3 paths
  })
});

// Upload multiple files
async function uploadAlbumImages(albumId: string, files: File[]) {
  const paths = await Promise.all(
    files.map(file =>
      uploadData({
        path: `public/albums/${albumId}/${Date.now()}-${file.name}`,
        data: file,
        options: { contentType: file.type },
      }).result
    )
  );

  // Get current record
  const album = await client.models.Album.get({ id: albumId });
  const existingPaths = album.data?.imagePaths || [];

  // Merge new paths with existing
  const allPaths = [...existingPaths, ...paths.map(p => p.path)];

  // Update record
  await client.models.Album.update({
    id: albumId,
    imagePaths: allPaths,
  });
}

// Retrieve all file URLs
async function getAlbumUrls(album: Album) {
  if (!album.imagePaths) return [];

  const urls = await Promise.all(
    album.imagePaths.map(path => 
      getUrl({ path }).then(result => result.url.toString())
    )
  );

  return urls;
}
```

## Lambda Handler File Operations

### Upload Files from Lambda

Lambda functions can use AWS SDK to interact with S3:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client();

async function saveAudioToS3(buffer: Buffer, fileName: string) {
  const s3Key = `public/audio/${Date.now()}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_HOMEWORK_SUPPLY_BUCKET_NAME || '',
      Key: s3Key,
      Body: buffer,
      ContentType: 'audio/mpeg',
    })
  );

  return s3Key;
}
```

### Retrieve Files in Lambda

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';

const s3Client = new S3Client();

async function getFileFromS3(s3Key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.STORAGE_HOMEWORK_SUPPLY_BUCKET_NAME || '',
      Key: s3Key,
    })
  );

  const stream = await sdkStreamMixin(response.Body);
  const chunks = [];
  
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
```

## Context File Handling (fileContext.js)

### Current Implementation

```javascript
// Upload audio files for words
const result = await uploadData({
  key: `audio/${identityId}/${name}`, // ✅ Correct pattern
  data: file,
  options: {
    contentType: 'audio/ogg',
    onProgress: ({ transferredBytes, totalBytes }) => { ... },
  },
}).result;

_audio.push(result.key); // Store path for later reference
```

### Recommended Improvements

```typescript
/**
 * Audited fileContext.js improvements needed:
 * 
 * 1. Use standardized path prefix structure
 * 2. Add identityId validation
 * 3. Handle upload failures with retry logic
 * 4. Clean up orphaned files
 * 5. Use TypeScript for type safety
 */

// ✅ Good: Validates identityId before upload
async function uploadAudioWithValidation(
  file: File,
  identityId: string
): Promise<string> {
  if (!identityId) {
    throw new Error('IdentityId required for secure file upload');
  }

  const result = await uploadData({
    path: `protected/${identityId}/audio/${Date.now()}-${file.name}`,
    data: file,
    options: { contentType: 'audio/ogg' },
  }).result;

  return result.path;
}

// ✅ Good: Batch upload with error recovery
async function uploadMultipleFiles(
  files: File[],
  identityId: string
) {
  const results = await Promise.allSettled(
    files.map(file =>
      uploadData({
        path: `protected/${identityId}/uploads/${Date.now()}-${file.name}`,
        data: file,
        options: { contentType: file.type },
      }).result
    )
  );

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value.path);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason);

  return { successful, failed };
}
```

## Data Consistency Patterns

### Problem: Orphaned Files

When a record is deleted before files are cleaned up, orphaned files remain in S3:

```
✅ Client A creates Grade
✅ Client A uploads submission file to S3
❌ Client B deletes Grade before file cleanup completes
❌ File orphaned in S3 (no database reference)
```

### Solution: Cleanup on Delete

```typescript
// ✅ Delete record and files atomically
async function deleteGradeAndSubmission(gradeId: string) {
  const grade = await client.models.Grade.get({ id: gradeId });
  
  if (!grade.data?.files || grade.data.files.length === 0) {
    // No files, just delete record
    await client.models.Grade.delete({ id: gradeId });
    return;
  }

  // Delete all files first
  const deleteResults = await Promise.allSettled(
    grade.data.files.map(path => remove({ path }))
  );

  // Log failures but continue
  deleteResults.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.warn(`Failed to delete ${grade.data.files[idx]}:`, result.reason);
    }
  });

  // Then delete record
  await client.models.Grade.delete({ id: gradeId });
}
```

### Solution: Deferred Cleanup

```typescript
// Store files with expiration metadata
const file = await client.models.File.create({
  path: uploadResult.path,
  orphanedAt: null, // Set to now() if record deleted
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});

// Periodically cleanup orphaned files > 30 days
async function cleanupOrphanedFiles() {
  const now = new Date();
  
  const orphanedFiles = await client.models.File.list({
    filter: {
      and: [
        { orphanedAt: { ne: null } },
        { expiresAt: { lt: now.toISOString() } }
      ]
    }
  });

  for (const file of orphanedFiles.data) {
    await remove({ path: file.path });
    await client.models.File.delete({ id: file.id });
  }
}
```

## Error Handling

### Network Failures

```typescript
// ✅ Retry on transient failures
async function uploadWithRetry(
  file: File,
  identityId: string,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadData({
        path: `protected/${identityId}/uploads/${file.name}`,
        data: file,
      }).result;
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Quota Exceeded

```typescript
// ✅ Handle storage quota gracefully
try {
  await uploadData({ path, data }).result;
} catch (error) {
  if (error.message.includes('QuotaExceeded')) {
    // User exceeded storage limit
    // Suggest cleanup or upgrade
    throw new Error('Storage limit exceeded. Please delete unused files.');
  }
  throw error;
}
```

## Migration Guide: Gen 1 → Gen 2

### Old Pattern (Gen 1)
```javascript
import { Storage } from 'aws-amplify';
Storage.put(`audio/${name}`, file); // No identity control
```

### New Pattern (Gen 2)
```typescript
import { uploadData } from 'aws-amplify/storage';
uploadData({
  path: `protected/${identityId}/audio/${name}`,
  data: file,
}); // ✅ Identity-based access control
```

### Key Differences

| Aspect | Gen 1 | Gen 2 |
|--------|-------|-------|
| Import | `aws-amplify` | `aws-amplify/storage` |
| Method | `Storage.put()` | `uploadData()` |
| Path | String key | Full S3 path |
| Identity | Via IAM policy | Via path prefix |
| Return | Promise | Promise with `.result` |

## Checklist for File Operations

- [ ] Validate `identityId` before file operations
- [ ] Use identity-based path prefixes (`protected/{id}/`)
- [ ] Include timestamps/UUIDs in filenames to prevent collisions
- [ ] Always set `contentType` on upload
- [ ] Store S3 path in database record for later retrieval
- [ ] Call `getUrl()` before rendering/downloading (don't cache URLs)
- [ ] Delete files when associated records are deleted
- [ ] Handle upload progress for large files
- [ ] Implement retry logic for transient failures
- [ ] Add error handling for quota/permission errors
- [ ] Test with multiple concurrent uploads
- [ ] Log file operations for debugging

## Environment Variables

```bash
# .env.local (not in Git)
VITE_AWS_REGION=us-east-1
VITE_STORAGE_BUCKET_NAME=homework-supply-${AMPLIFY_ENV}
```

## References

- [Amplify Gen 2 Storage Documentation](https://docs.amplify.aws/gen2/build-a-backend/storage/manage-files/)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [Cognito Identity Pool (identityId)](https://docs.aws.amazon.com/cognitoidentity/latest/APIReference/)
- [S3 Access Control Patterns](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-overview.html)
