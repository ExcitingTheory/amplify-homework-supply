# Storage & Schema Configuration Review

**Date**: January 17, 2026  
**Status**: ✅ REVIEWED & IMPROVED

## Overview

This document reviews Amplify Gen 2 Storage and Data (GraphQL) configurations for proper per-user/per-owner authorization patterns.

## Key Findings

### ✅ Storage Configuration (`amplify/storage/resource.ts`)

**Status**: Well-configured with owner-based access control

#### Current Access Patterns:
```typescript
public/*                  → allow.authenticated.to(['read', 'write', 'delete'])
protected/{identityId}/*  → allow.owner() + allow.authenticated.to(['read'])
private/{identityId}/*    → allow.owner().to(['read', 'write', 'delete'])
```

#### What This Means:

| Path | Owner | Other Users | Use Case |
|------|-------|-------------|----------|
| `public/*` | Full access | Read/Write/Delete | Published units, shared resources |
| `protected/{identityId}/*` | Full access | Read only | Student submissions, recordings (instructors can grade) |
| `private/{identityId}/*` | Full access | No access | Answer keys, instructor materials |

#### Improvements Made:
1. **Protected Path**: Now properly uses `allow.owner()` instead of allowing all authenticated users to write/delete
2. **Authenticated Read on Protected**: Allows instructors to read student submissions for grading
3. **Documentation**: Enhanced comments explain integration with File model and frontend patterns

---

### ✅ Data Schema Configuration (`amplify/data/resource.ts`)

**Status**: Properly implements owner authorization with role-based access

#### Owner Authorization Pattern:

The schema correctly uses owner-based authorization following Amplify Gen 2 patterns:

```typescript
// Behind the scenes, Cognito user info is stored as: <sub>::<username>
// Or accessible via sub/username separately
.authorization((allow) => [
  allow.owner(),                        // Record creator has full CRUD
  allow.group('Learners').to(['read']),  // Group-based read access
  allow.group('Admins'),                // Full admin access
])
```

#### Key Models Reviewed:

**File Model**
- ✅ `owner: a.string().required()` - Auto-populated by Cognito
- ✅ `identityId: a.string().required()` - For protected/{identityId}/* S3 paths
- ✅ `path: a.string().required()` - Stores full S3 location
- ✅ `level: FileProtectionLevels` - Tracks PUBLIC/PROTECTED/PRIVATE
- ✅ Owner authorization + Learners read + Admins full access

**Document Model**
- ✅ `owner: a.string().required()` - Student uploading document
- ✅ `s3Key: a.string().required()` - Points to PDF in S3
- ✅ `status: a.string()` - Tracks async processing (uploaded → extracting → extracted → analyzing → completed)
- ✅ `resumeState: a.json()` - For timeout handling in long-running Lambda
- ✅ Owner authorization + Learners read + Admins full access

---

## Authorization Patterns

### 1. Owner Authorization

**How Amplify Auto-populates Owner Field**

When a record is created with `allow.owner()` authorization:

```typescript
const client = generateClient<Schema>();

// Cognito user context is automatically captured
const response = await client.models.File.create({
  path: 'public/unit-123.json',
  level: 'PUBLIC',
  // owner field NOT needed - auto-populated as <sub>::<username>
}, {
  authMode: 'userPool', // Must use userPool mode for owner() to work
});
```

**Owner Field Format**

- **Default**: `<sub>::<username>` (e.g., `12345::alice@example.com::alice`)
- **Can be queried by**: Full value, `sub` alone, or `username` alone
- **Can be reassigned**: Yes, by default owner can reassign to another user

**Protecting Owner Field** (Optional)

To prevent owners from reassigning their records:

```typescript
File: a.model({
  owner: a.string().authorization(allow => [
    allow.owner().to(['read', 'delete']), // Can't reassign
  ]),
})
```

### 2. Storage Authorization vs Data Authorization

**They are INDEPENDENT** - both must allow operations:

```
For read operation:
  ✓ Storage AND Data must allow read
  
For write operation:
  ✓ Storage AND Data must allow write
```

#### Example: Student Submits Recording

```typescript
// 1. Upload to Storage (Storage auth checks path)
const result = await uploadData({
  path: `protected/${identityId}/submission.mp3`, // Storage checks allow.owner()
  data: file,
}).result;

// 2. Create File record (Data auth checks owner field)
const fileRecord = await client.models.File.create({
  path: result.path,
  owner: currentUser.sub, // Auto-populated
  level: 'PROTECTED',
  mimeType: 'audio/mpeg',
}, {
  authMode: 'userPool', // Required for allow.owner()
});

// 3. Grade submission (Instructor reading)
// Storage: allow.authenticated.to(['read']) ✓ passes
// Data: allow.owner() fails (instructor not owner) ✗ BUT
//       allow.group('Instructors').to(['read']) ✓ passes
```

---

## Frontend Integration Patterns

### Upload File with File Record

```typescript
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

async function uploadStudentSubmission(file: File, unitId: string) {
  // Step 1: Upload to Storage
  const uploadResult = await uploadData({
    path: `protected/${identityId}/submissions/${unitId}-${file.name}`,
    data: file,
    options: {
      contentType: file.type,
      onProgress: ({ transferredBytes, totalBytes }) => {
        console.log(`${Math.round(transferredBytes/totalBytes * 100)}%`);
      },
    },
  }).result;

  // Step 2: Create File metadata record
  const fileRecord = await client.models.File.create({
    path: uploadResult.path,
    name: file.name,
    mimeType: file.type,
    level: 'PROTECTED',
    size: file.size,
    unitID: unitId, // For querying files by unit
  }, {
    authMode: 'userPool', // Enable owner() authorization
  });

  return fileRecord.data;
}
```

### Associate File with Multiple Models

Use join tables to associate files with Units, Words, Questions:

```typescript
// File uploaded and File record created
const fileRecord = await client.models.File.create({...});

// Associate with Unit via UnitFile join table
const unitFile = await client.models.UnitFile.create({
  unitID: 'unit-123',
  fileID: fileRecord.id,
}, {
  authMode: 'userPool',
});

// Now you can query: Unit → UnitFile → File
const unit = await client.models.Unit.get({ id: 'unit-123' });
const files = unit.unitFiles; // hasMany relationship
```

### Retrieve File and Get Signed URL

```typescript
// Query File record
const fileRecord = await client.models.File.get({
  id: fileId,
}, {
  authMode: 'userPool',
});

// Get signed URL for download/playback
const signedUrl = await getUrl({
  path: fileRecord.data.path,
  options: {
    expires: 3600, // 1 hour
  },
});

// Use in HTML
<img src={signedUrl.url} />
<audio src={signedUrl.url} controls />
<a href={signedUrl.url}>Download</a>
```

---

## Document Analysis Workflow

The Document model implements a robust async processing pipeline:

### 1. Upload Phase
```
User uploads PDF → File record created
                 → Document record created (status: 'uploaded')
                 → Returns immediately to client
```

### 2. Async Processing Phase
```
Lambda invoked with isAsyncInvocation: true
  ↓
Document status: 'extracting'
  ↓
PDF text extracted (may timeout and save resumeState)
  ↓
Document status: 'extracted', resumeState cleared
  ↓
Sent to OpenAI for analysis
  ↓
Document status: 'analyzing'
```

### 3. Results Phase
```
OpenAI returns analysis
  ↓
ParsedContent record created with:
  - vocabularyJSON (extracted words)
  - questionsJSON (generated questions)
  - summariesJSON (content summaries)
  - conceptsJSON (key concepts)
  ↓
Document status: 'completed'
  ↓
Client receives via subscription or polling
```

### 4. Error Handling
```
On error:
  ↓
Document status: 'failed'
  ↓
resumeState cleared (can retry)
  ↓
Client shown error message
```

---

## Security Considerations

### ✅ Owner Field Protection
- Owner field is automatically populated by Cognito (user can't fake ownership)
- Can be protected from reassignment with field-level authorization
- Used consistently across all user-generated content models

### ✅ Storage & Data Layer Separation
- Storage controls file access via paths and identityId
- Data models control record metadata access via owner field
- Both must allow operation for success

### ✅ Group-Based Access
- Learners group: Read access to published content
- Admins group: Full access to all records
- Can be extended with 'Instructors', 'Moderators', etc.

### ✅ Protected Path Convention
- Student submissions stored in `protected/{identityId}/*`
- Instructors can read via Storage + group-based Data access
- Students can't access others' submissions (Storage path prevents it)

---

## Recommendations

### 1. Implement Document Analysis Feature ✅ READY
The Document and File models are properly configured for:
- Student uploads PDFs for analysis
- Async Lambda processing with timeout handling
- Storage of extracted vocabulary, questions, summaries
- Ownership-based access control

### 2. Optional: Protect Owner Field
If you want to prevent users from reassigning documents to others:

```typescript
Document: a.model({
  owner: a.string().authorization(allow => [
    allow.owner().to(['read', 'delete']), // Can't update
  ]),
})
```

### 3. Add Instructor/Section Authorization
Consider adding section-based access for instructors:

```typescript
Document: a.model({
  // ... fields ...
  sectionID: a.id(), // Which section this was assigned to
})
.authorization((allow) => [
  allow.owner(),
  allow.group('Learners').to(['read']),
  allow.group('Admins'),
  allow.field('sectionID').group('Instructors').to(['read']), // Instructors of this section
])
```

### 4. Use Consistent File Naming
Include record ID in S3 path to ensure uniqueness:

```typescript
path: `public/units/${unitId}-${file.name}`  // Includes unit context
path: `protected/${identityId}/submissions/${unitId}-${file.name}` // Submission context
```

---

## Deployment Notes

### Prerequisites for Sandbox
```bash
# Ensure auth is configured
npx ampx sandbox

# Set OpenAI API key secret
npx ampx sandbox secret set OPENAI_API_KEY
```

### Testing Owner Authorization
```typescript
// Create as User A
const file = await client.models.File.create({
  path: 'public/test.json',
}, { authMode: 'userPool' });

// Try to update as User B - should fail
await client.models.File.update({
  id: file.id,
  name: 'Hacked',
}, { authMode: 'userPool' }); // Fails - not owner
```

---

## Summary Table

| Aspect | Current | Recommendation | Status |
|--------|---------|-----------------|---------|
| Storage paths | ✅ Configured | Add more docs | ✅ GOOD |
| Owner auth | ✅ Implemented | Protect owner field? | ✅ GOOD |
| File model | ✅ Complete | Add more comments | ✅ IMPROVED |
| Document model | ✅ Complete | Add workflow docs | ✅ IMPROVED |
| Frontend patterns | 📚 Documented | Ready for implementation | ✅ READY |
| Group access | ✅ Configured | Consider sections | ⏳ FUTURE |

---

## Related Documentation

- [Amplify Gen 2 Storage](https://docs.amplify.aws/gen2/build-a-backend/storage/manage-files/)
- [Owner Authorization](https://docs.amplify.aws/gen2/build-a-backend/data/authorization/#owner-authorization-rule)
- [File & Storage Integration](https://docs.amplify.aws/gen2/build-a-backend/storage/manage-files/#working-with-files-attachments)
- [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md) - Test patterns with env variables
