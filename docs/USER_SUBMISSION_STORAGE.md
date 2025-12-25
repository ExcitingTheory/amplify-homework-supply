# User Submission Storage Architecture

## Overview

Student-submitted content (audio recordings, drawings, written responses) is stored separately from other application files with strict privacy controls and cost tracking capabilities.

## Storage Structure

### S3 Bucket Organization

```
s3://bucket-name/
├── private/
│   └── {identityId}/           # Student's private folder
│       └── user-submissions/   # Student submissions only
│           └── {gradeId}/      # Organized by grade
│               └── {nodeKey}/  # Organized by question
│                   └── {gradeId}_{nodeKey}_{timestamp}.{ext}
├── protected/                  # Other protected files
└── public/                     # Public assets
```

### File Naming Convention

**Format:** `{gradeId}_{nodeKey}_{timestamp}.{ext}`

**Example:** `grade-abc123_audio-q1_1734989234567.mp3`

**Full Path:** `private/{identityId}/user-submissions/grade-abc123/audio-q1/grade-abc123_audio-q1_1734989234567.mp3`

## Access Control

### Access Levels

| Role | Access Method | Permissions |
|------|--------------|-------------|
| **Student (Owner)** | Direct S3 access | Can read/write their own files in `private/{identityId}/` |
| **Teacher** | GraphQL endpoint | Can read student files if assigned as instructor on grade |
| **Admin** | GraphQL endpoint | Can read all student files |
| **Other Students** | None | Cannot access other students' files |

### Access Patterns

#### Student Access (Owner)

Students can access their own files directly using the AWS Amplify Storage API with `accessLevel: 'private'`:

```javascript
import { getUrl } from 'aws-amplify/storage';

const url = await getUrl({
  key: 'user-submissions/grade-abc/audio-q1/grade-abc_audio-q1_12345.mp3',
  options: {
    accessLevel: 'private',
  },
});
```

#### Teacher Access

Teachers use a GraphQL endpoint that validates their authorization and returns presigned URLs:

```javascript
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const response = await client.graphql({
  query: `
    query GetStudentSubmissionUrl($gradeId: ID!, $submissionKey: String!) {
      getStudentSubmissionUrl(gradeId: $gradeId, submissionKey: $submissionKey) {
        url
        expiresAt
        metadata
      }
    }
  `,
  variables: {
    gradeId: 'grade-abc123',
    submissionKey: 'user-submissions/grade-abc123/audio-q1/grade-abc123_audio-q1_12345.mp3',
  },
});

const { url, expiresAt } = response.data.getStudentSubmissionUrl;
// URL expires in 15 minutes
```

#### React Hook (Recommended)

Use the provided React hook for automatic role detection:

```javascript
import { useStudentSubmission } from '../utils/useStudentSubmission';

function SubmissionPlayer({ submissionKey, grade }) {
  const { url, loading, error } = useStudentSubmission({
    submissionKey,
    grade,
    userGroups: ['Instructors'], // From Auth session
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <audio src={url} controls />;
}
```

## Authorization Flow

### Teacher Access Validation

When a teacher requests a student submission:

1. **GraphQL Request** → `getStudentSubmissionUrl(gradeId, submissionKey)`
2. **Auth Check** → Verify user is in `Instructors` or `Admins` group
3. **Grade Fetch** → Get Grade record from DynamoDB
4. **Instructor Validation** → Verify `grade.instructor === username` (or user is Admin)
5. **Identity Extraction** → Get `grade.identityId` for S3 path
6. **S3 Path Construction** → Build full path: `private/{identityId}/{submissionKey}`
7. **Presigned URL Generation** → Create 15-minute expiring URL
8. **Return** → Send URL + metadata to teacher

### Lambda Function

The backend Lambda function (`getStudentSubmission`) performs these security checks:

```javascript
// Check: User is in Instructors or Admins group
if (!groups.includes('Instructors') && !groups.includes('Admins')) {
  throw new Error('Unauthorized');
}

// Check: User is assigned as instructor for this grade
if (grade.instructor !== username && !groups.includes('Admins')) {
  throw new Error('Unauthorized');
}

// Access student's private file
const s3Key = `private/${grade.identityId}/${submissionKey}`;
const url = await generatePresignedUrl(s3Key);
```

## Cost Tracking

### S3 Cost Allocation

The dedicated `user-submissions/` prefix enables cost tracking via AWS Cost Explorer:

1. **Tag S3 Bucket** with cost allocation tags
2. **Create S3 Inventory Report** filtering prefix: `*/user-submissions/*`
3. **Set up Cost Explorer** with prefix-based filters
4. **Monitor Metrics:**
   - Storage size per grade
   - Request count per question type
   - Data transfer costs
   - Storage class transitions

### Cost Optimization Strategies

1. **Lifecycle Policies:**
   ```json
   {
     "Rules": [{
       "Id": "ArchiveOldSubmissions",
       "Prefix": "private/*/user-submissions/",
       "Status": "Enabled",
       "Transitions": [{
         "Days": 90,
         "StorageClass": "GLACIER"
       }]
     }]
   }
   ```

2. **Storage Tiers:**
   - Active submissions (0-30 days): S3 Standard
   - Recent submissions (30-90 days): S3 Standard-IA
   - Archived submissions (90+ days): S3 Glacier

3. **Intelligent Tiering:**
   - Enable S3 Intelligent-Tiering for automatic cost optimization
   - Moves files between access tiers based on usage patterns

## Data Model Integration

### Grade Model

The Grade model tracks submission files:

```graphql
type Grade @model {
  id: ID!
  owner: String
  instructor: String
  identityId: String       # Required for file access
  files: [String]          # Array of S3 keys
  data: AWSJSON            # Question responses
  feedback: AWSJSON        # AI verification results
  # ... other fields
}
```

### File Tracking

When a student submits content:

```javascript
// 1. Upload file
const uploadResult = await uploadStudentSubmission({
  file: audioBlob,
  gradeId: 'grade-abc123',
  nodeKey: 'audio-q1',
  fileType: 'mp3',
  metadata: { waveformData: [...] },
});

// 2. Update Grade.files[] array
await DataStore.save(
  Grade.copyOf(grade, updated => {
    updated.files = [...updated.files, uploadResult.path];
    updated.identityId = identityId; // Ensure identity is set
  })
);
```

## Migration Guide

### From Protected to Private Storage

If migrating existing files from `protected/` to `private/user-submissions/`:

```javascript
// Migration script (run server-side with elevated permissions)
async function migrateSubmission(oldKey, gradeId, nodeKey, identityId) {
  // 1. Copy file to new location
  const newKey = `private/${identityId}/user-submissions/${gradeId}/${nodeKey}/${filename}`;
  await s3.copyObject({
    CopySource: `bucket/${oldKey}`,
    Bucket: 'bucket',
    Key: newKey,
    ACL: 'private',
  });

  // 2. Update Grade.files[] array
  await updateGradeFiles(gradeId, oldKey, newKey);

  // 3. Delete old file (optional, after verification)
  // await s3.deleteObject({ Bucket: 'bucket', Key: oldKey });
}
```

## Security Best Practices

1. **Never expose identityId in client logs**
   - Only log identityId server-side
   - Redact from client error messages

2. **Validate file types on upload**
   ```javascript
   const ALLOWED_TYPES = ['audio/mp3', 'audio/wav', 'image/png', 'image/jpeg'];
   if (!ALLOWED_TYPES.includes(file.type)) {
     throw new Error('Invalid file type');
   }
   ```

3. **Set file size limits**
   ```javascript
   const MAX_SIZE = 10 * 1024 * 1024; // 10MB
   if (file.size > MAX_SIZE) {
     throw new Error('File too large');
   }
   ```

4. **Scan uploads for malware** (server-side)
   - Integrate with AWS Lambda + ClamAV
   - Quarantine suspicious files

5. **Presigned URL expiration**
   - Keep expiration short (15 minutes)
   - Regenerate URLs when needed
   - Never cache presigned URLs client-side

## Monitoring & Logging

### CloudWatch Metrics

Track submission activity:

```javascript
// Log submission events
console.log('[Submission]', {
  event: 'upload',
  gradeId,
  nodeKey,
  fileSize,
  fileType,
  timestamp: new Date().toISOString(),
});
```

### Key Metrics

- Upload success/failure rate
- Average file size by type
- Access pattern (student vs teacher)
- Presigned URL generation rate
- Lambda execution time

### Alerts

Set up CloudWatch alarms for:

- High error rate on Lambda function
- Unusually large file uploads
- Excessive presigned URL requests
- S3 bucket size growth rate

## Troubleshooting

### Common Issues

**Issue:** "Access Denied" when teacher tries to view submission

**Solution:**
1. Verify teacher is in `Instructors` Cognito group
2. Check `grade.instructor` matches teacher's username
3. Ensure `grade.identityId` is set correctly
4. Confirm Lambda has S3 read permissions

**Issue:** Student can't access their own file

**Solution:**
1. Verify file was uploaded with correct `identityId`
2. Check `accessLevel: 'private'` is specified
3. Ensure student is authenticated
4. Verify file path matches pattern

**Issue:** High S3 costs

**Solution:**
1. Enable S3 Intelligent-Tiering
2. Set up lifecycle policies
3. Review CloudWatch metrics for usage patterns
4. Consider compression for large files

## References

- [AWS Amplify Storage Documentation](https://docs.amplify.aws/lib/storage/getting-started/q/platform/js/)
- [S3 Access Control](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-overview.html)
- [Cost Allocation Tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)
