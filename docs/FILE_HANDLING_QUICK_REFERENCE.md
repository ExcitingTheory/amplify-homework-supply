# File Handling Quick Reference

## One-Minute Overview

**Upload a file:**
```typescript
import { uploadData } from 'aws-amplify/storage';

const result = await uploadData({
  path: `protected/${identityId}/audio/${file.name}`,
  data: file,
  options: { contentType: file.type },
}).result;

// Save the path in your database record
```

**Get a signed URL:**
```typescript
import { getUrl } from 'aws-amplify/storage';

const { url } = await getUrl({ path: file.path });
// Use url.toString() in img src or audio src
```

**Delete a file:**
```typescript
import { remove } from 'aws-amplify/storage';

await remove({ path: file.path });
```

## Path Patterns

| Use Case | Path Pattern | Access |
|----------|-------------|--------|
| Public content | `public/audio/myfile.mp3` | Anyone can read |
| User uploads | `protected/{identityId}/submissions/file.pdf` | Only user can read/write |
| Instructor only | `private/{identityId}/answers.pdf` | Only owner can access |

## Common Tasks

### Create Record with File

```typescript
import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';

// 1. Create record (gets ID)
const unit = await client.models.Unit.create({ name: 'Lesson 1' });

// 2. Upload file using record ID
const result = await uploadData({
  path: `public/thumbnails/${unit.id}-image.jpg`,
  data: file,
}).result;

// 3. Update record with file path
await client.models.Unit.update({
  id: unit.id,
  thumbnail: result.path,
});
```

### Display File

```typescript
import { getUrl } from 'aws-amplify/storage';

// Get signed URL before rendering
const { url } = await getUrl({ path: record.filePath });

// Use in img/audio/video
<img src={url.toString()} alt="thumbnail" />
```

### Update File

```typescript
// Upload new file
const result = await uploadData({
  path: `protected/${identityId}/uploads/newfile.pdf`,
  data: file,
}).result;

// Update record
await client.models.Document.update({
  id: docId,
  filePath: result.path,
});

// Optionally delete old file
if (oldPath) {
  await remove({ path: oldPath });
}
```

### Delete File

```typescript
// Remove from database
await client.models.Unit.update({
  id: unitId,
  thumbnail: null,
});

// Delete from S3
if (oldPath) {
  await remove({ path: oldPath });
}
```

### Multiple Files

```typescript
// Store array of paths
const album = await client.models.Album.create({
  name: 'Photos',
  filePaths: [], // Initially empty
});

// Upload multiple files
const paths = await Promise.all(
  files.map(file =>
    uploadData({
      path: `public/albums/${album.id}/${file.name}`,
      data: file,
    }).result
  )
);

// Update with all paths
await client.models.Album.update({
  id: album.id,
  filePaths: paths.map(p => p.path),
});
```

## Error Handling

```typescript
// Upload with error handling
try {
  const result = await uploadData({
    path: `protected/${identityId}/audio/${file.name}`,
    data: file,
  }).result;
  
  console.log('Uploaded to:', result.path);
} catch (error) {
  if (error.message.includes('QuotaExceeded')) {
    // Storage limit exceeded
    alert('Storage limit reached. Delete unused files.');
  } else if (error.message.includes('Forbidden')) {
    // Access denied
    alert('Permission denied. Contact administrator.');
  } else {
    // Network or other error
    alert('Upload failed. Please try again.');
  }
}
```

## Best Practices

✅ **Do:**
- Include `{identityId}` in path for secure file isolation
- Use timestamps to prevent filename collisions
- Set `contentType` on upload
- Store S3 path in database record
- Use `getUrl()` to get signed URLs for display
- Delete files when associated records are deleted

❌ **Don't:**
- Store direct S3 URLs in components (they expire)
- Skip setting `contentType`
- Upload without validating `identityId`
- Leave orphaned files in S3
- Trust client-side file extensions
- Upload unvalidated user input to public paths

## TypeScript Types

```typescript
// File record type
interface FileRecord {
  id: string;
  name: string;
  path: string; // S3 path
  mimeType: string;
  owner: string;
  identityId: string;
  size?: number;
  createdAt: string;
}

// Upload options
interface UploadOptions {
  path: string;
  data: File | Blob | string;
  options?: {
    contentType?: string;
    onProgress?: (progress: Progress) => void;
  };
}

// Result
interface UploadResult {
  path: string; // Uploaded S3 path
}
```

## Testing

```typescript
// Mock upload in tests
vi.mock('aws-amplify/storage', () => ({
  uploadData: vi.fn(() => ({
    result: Promise.resolve({ path: 'public/audio/test.mp3' }),
  })),
  getUrl: vi.fn(() => 
    Promise.resolve({ url: new URL('https://s3.example.com/file') })
  ),
  remove: vi.fn(() => Promise.resolve()),
}));

// Test upload
test('uploads file and saves path', async () => {
  const file = new File(['content'], 'audio.mp3');
  const result = await uploadData({ path: 'public/audio/test.mp3', data: file });
  
  expect(result.result).resolves.toHaveProperty('path');
});
```

## Configuration

In `amplify/storage/resource.ts`:

```typescript
export const storage = defineStorage({
  name: 'homeworkSupplyStorage',
  access: (allow) => ({
    'public/*': [allow.authenticated.to(['read', 'write', 'delete'])],
    'protected/{identityId}/*': [allow.authenticated.to(['read', 'write', 'delete'])],
    'private/{identityId}/*': [allow.owner().to(['read', 'write', 'delete'])],
  }),
});
```

And in `amplify/backend.ts`:

```typescript
import { storage } from './storage/resource';

export const backend = defineBackend({
  auth,
  data,
  storage, // ✅ Add storage
});
```

## Debugging

```typescript
// Enable logging
enableDebugMode(); // Amplify debugging

// Check S3 path
console.log('File path:', file.path);
console.log('Identity:', identityId);

// Test access
const { url } = await getUrl({ path: file.path });
console.log('Signed URL:', url.toString());

// List files
const { items } = await list({ path: `protected/${identityId}/` });
console.log('User files:', items);
```

## More Information

- [Full Guide](./FILE_HANDLING_GUIDE.md)
- [Audit Results](./FILE_HANDLING_AUDIT.md)
- [Amplify Docs](https://docs.amplify.aws/gen2/build-a-backend/storage/manage-files/)
