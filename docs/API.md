# API Documentation

This document provides comprehensive information about the Homework Supply application's API, data models, and backend services.

## 🏗️ Architecture Overview

The application uses **AWS Amplify Gen 1** with the following backend services:

- **GraphQL API**: Primary data interface (AWS AppSync)
- **Authentication**: AWS Cognito User Pools + Identity Pools
- **Database**: Amazon DynamoDB (via DataStore)
- **Storage**: Amazon S3 for file uploads
- **Functions**: AWS Lambda for custom logic
- **Real-time**: GraphQL subscriptions for live updates

## 📊 Data Models

### Core Models

#### Section
Represents a class or group of students.

```graphql
type Section @model @auth(rules: [
  { allow: private, operations: [read]},
  { allow: groups, groups: ["Admins", "Instructors"]},
  { allow: owner, ownerField: "owner", operations: [create, update, delete, read] },
  { allow: public, operations: [read]}
]) {
  id: ID!
  name: String
  owner: String
  description: String
  code: String!
  assignments: [Assignment] @hasMany(indexName: "bySection", fields: ["id"])
}
```

**Usage Example**:
```javascript
import { DataStore } from 'aws-amplify';
import { Section } from '../models';

// Create a new section
const newSection = await DataStore.save(new Section({
  name: "Japanese 101 - Spring 2024",
  code: "JPN101-SP24",
  description: "Beginner Japanese language course"
}));

// Query sections
const sections = await DataStore.query(Section);
```

#### Unit
Learning modules containing educational content and questions.

```graphql
type Unit @model @auth(rules: [
  { allow: private, operations: [read]},
  { allow: groups, groups: ["Admins", "Instructors"]},
  { allow: public, operations: [read]}
]) {
  id: ID!
  number: Float
  name: String
  description: String
  data: AWSJSON
  publish: Boolean
  assignments: [Assignment] @hasMany(indexName: "byUnit", fields: ["id"])
  words: [Word] @manyToMany(relationName: "UnitWord")
}
```

**Data Structure**:
The `data` field contains JSON with the unit content:
```json
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "prompt": "What is 'hello' in Japanese?",
      "answers": ["こんにちは", "さよなら", "ありがとう"],
      "correct": 0
    }
  ],
  "media": {
    "audio": ["unit1_intro.mp3"],
    "images": ["hiragana_chart.jpg"]
  }
}
```

#### Assignment
Units assigned to students with due dates and tracking.

```graphql
type Assignment @model @auth(rules: [
  { allow: private, operations: [read]},
  { allow: groups, groups: ["Instructors", "Admins"], operations: [create, update, delete, read] },
  { allow: public, operations: [read]}
]) {
  id: ID!
  due: AWSDateTime
  learner: String
  sectionID: ID @index(name: "bySection")
  grades: [Grade] @hasMany(indexName: "byAssignment", fields: ["id"])
  unitID: ID @index(name: "byUnit")
}
```

#### Grade
Student submissions and performance tracking.

```graphql
type Grade @model @auth(rules: [
  { allow: owner, ownerField: "owner", operations: [create, read]},
  { allow: groups, groups: ["Admins"], operations: [read]}
]) {
  id: ID!
  percentComplete: Float
  accuracy: Float
  complete: Boolean
  owner: String
  instructor: String
  unitVersion: Int
  data: AWSJSON
  assignmentID: ID @index(name: "byAssignment")
}
```

**Grade Data Structure**:
```json
{
  "responses": [
    {
      "questionId": "q1",
      "userAnswer": 0,
      "correct": true,
      "timeSpent": 15000,
      "attempts": 1
    }
  ],
  "media_submissions": [
    {
      "type": "audio",
      "filename": "student_recording.wav",
      "feedback": "Good pronunciation!"
    }
  ],
  "ai_feedback": {
    "overall_score": 85,
    "suggestions": ["Practice pitch accent"]
  }
}
```

#### Word
Japanese vocabulary entries with pronunciation and definitions.

```graphql
type Word @model @auth(rules: [
  { allow: private, operations: [read]},
  { allow: groups, groups: ["Instructors", "Admins"]},
  { allow: public, operations: [read]}
]) {
  id: ID!
  phrase: String
  phonetic: String
  definition: String
  audio: [String]
  units: [Unit] @manyToMany(relationName: "UnitWord")
}
```

## 🔐 Authentication & Authorization

### User Groups

1. **Admins**: Full system access
2. **Instructors**: Can create/manage content and view all student data
3. **Learners**: Can access assigned content and submit work

### Auth Rules Summary

| Model | Public Read | Private Read | Owner CRUD | Group Access |
|-------|-------------|--------------|------------|--------------|
| Section | ✅ | ✅ | ✅ (owner field) | Admins, Instructors |
| Unit | ✅ | ✅ | ❌ | Admins, Instructors |
| Assignment | ✅ | ✅ | ❌ | Admins, Instructors |
| Grade | ❌ | ❌ | ✅ (owner field) | Admins (read only) |
| Word | ✅ | ✅ | ❌ | Admins, Instructors |

### Authentication Examples

```javascript
import { Auth } from 'aws-amplify';

// Get current user
const getCurrentUser = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    return user;
  } catch (error) {
    console.log('No authenticated user');
    return null;
  }
};

// Check user groups
const checkUserRole = async () => {
  const user = await Auth.currentAuthenticatedUser();
  const groups = user.signInUserSession.accessToken.payload['cognito:groups'] || [];
  
  return {
    isAdmin: groups.includes('Admins'),
    isInstructor: groups.includes('Instructors'),
    isLearner: groups.includes('Learners')
  };
};

// Sign out
const signOut = async () => {
  await Auth.signOut();
};
```

## 📁 File Storage

### S3 Storage Structure

```
files/
├── public/           # Publicly accessible files
│   ├── audio/
│   ├── images/
│   └── videos/
├── protected/        # User-specific files
│   └── {userId}/
│       ├── submissions/
│       └── recordings/
└── private/          # Admin/instructor only
    ├── master_audio/
    └── answer_keys/
```

### File Upload Examples

```javascript
import { Storage } from 'aws-amplify';

// Upload public file
const uploadPublicFile = async (file, filename) => {
  try {
    const result = await Storage.put(filename, file, {
      level: 'public',
      contentType: file.type
    });
    return result.key;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Upload private file
const uploadPrivateFile = async (file, filename) => {
  const result = await Storage.put(filename, file, {
    level: 'private',
    contentType: file.type
  });
  return result.key;
};

// Get file URL
const getFileUrl = async (key, level = 'public') => {
  try {
    const url = await Storage.get(key, { level });
    return url;
  } catch (error) {
    console.error('Failed to get file URL:', error);
    return null;
  }
};

// List files
const listFiles = async (prefix = '', level = 'public') => {
  const files = await Storage.list(prefix, { level });
  return files;
};
```

## 🔄 Real-time Subscriptions

### GraphQL Subscriptions

```javascript
import { DataStore } from 'aws-amplify';
import { Grade } from '../models';

// Subscribe to grade updates
const subscribeToGrades = () => {
  return DataStore.observe(Grade).subscribe(msg => {
    console.log('Grade update:', msg.model, msg.opType, msg.element);
    
    switch(msg.opType) {
      case 'INSERT':
        console.log('New grade submitted:', msg.element);
        break;
      case 'UPDATE':
        console.log('Grade updated:', msg.element);
        break;
      case 'DELETE':
        console.log('Grade deleted:', msg.element);
        break;
    }
  });
};

// Unsubscribe
const subscription = subscribeToGrades();
// Later...
subscription.unsubscribe();
```

## ⚡ Lambda Functions

### Available Functions

#### 1. OpenAI Integration (`openai`)
Handles AI-powered content generation and grading.

**Endpoint**: `POST /openai`

**Request**:
```json
{
  "action": "grade_audio",
  "data": {
    "audioUrl": "s3://bucket/student_recording.wav",
    "expectedText": "こんにちは",
    "language": "japanese"
  }
}
```

**Response**:
```json
{
  "score": 85,
  "feedback": "Good pronunciation of greeting",
  "suggestions": ["Work on pitch accent"]
}
```

#### 2. Editor Chat (`editorChat`)
AI-powered content creation assistant for instructors.

**Endpoint**: `POST /editorChat`

**Request**:
```json
{
  "prompt": "Create a beginner Japanese lesson about greetings",
  "type": "lesson_plan",
  "level": "N5"
}
```

#### 3. Section Management (`manageSection`)
Handles section-related operations and user management.

### Lambda Function Usage

```javascript
import { API } from 'aws-amplify';

const callOpenAI = async (data) => {
  try {
    const result = await API.post('AdminQueries', '/openai', {
      body: data
    });
    return result;
  } catch (error) {
    console.error('Lambda function error:', error);
    throw error;
  }
};
```

## 🔍 Common Queries

### Frequently Used DataStore Queries

```javascript
import { DataStore, Predicates } from 'aws-amplify';
import { Unit, Assignment, Grade, Section } from '../models';

// Get units by publish status
const getPublishedUnits = async () => {
  return await DataStore.query(Unit, c => c.publish.eq(true));
};

// Get assignments for a specific section
const getAssignmentsBySection = async (sectionId) => {
  return await DataStore.query(Assignment, c => c.sectionID.eq(sectionId));
};

// Get grades for current user
const getUserGrades = async (userId) => {
  return await DataStore.query(Grade, c => c.owner.eq(userId));
};

// Get assignments due in the next week
const getUpcomingAssignments = async () => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return await DataStore.query(Assignment, c => 
    c.due.le(nextWeek.toISOString())
  );
};

// Complex query with sorting
const getRecentGrades = async (limit = 10) => {
  const grades = await DataStore.query(Grade, Predicates.ALL, {
    sort: s => s.createdAt(SortDirection.DESCENDING),
    limit
  });
  return grades;
};
```

## 🐛 Error Handling

### Common Error Patterns

```javascript
import { DataStore } from 'aws-amplify';

const safeDataStoreOperation = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    if (error.message.includes('Network Error')) {
      // Handle network issues
      console.warn('Network error, retrying...');
      // Implement retry logic
    } else if (error.message.includes('Unauthorized')) {
      // Handle auth issues
      console.error('Authentication required');
      // Redirect to login
    } else {
      // Handle other errors
      console.error('DataStore operation failed:', error);
      throw error;
    }
  }
};

// Usage
const saveGrade = async (gradeData) => {
  return safeDataStoreOperation(async () => {
    return await DataStore.save(new Grade(gradeData));
  });
};
```

## 📊 Performance Tips

### Optimization Strategies

1. **Use Pagination**:
```javascript
const getPaginatedUnits = async (limit = 20, nextToken = null) => {
  return await DataStore.query(Unit, Predicates.ALL, {
    limit,
    page: nextToken
  });
};
```

2. **Selective Queries**:
```javascript
// Only fetch needed fields
const getUnitTitles = async () => {
  const units = await DataStore.query(Unit);
  return units.map(unit => ({ id: unit.id, name: unit.name }));
};
```

3. **Cache Frequently Used Data**:
```javascript
let cachedWords = null;

const getWords = async (forceRefresh = false) => {
  if (!cachedWords || forceRefresh) {
    cachedWords = await DataStore.query(Word);
  }
  return cachedWords;
};
```

## 🔄 Data Synchronization

### DataStore Sync Best Practices

```javascript
import { DataStore, syncExpression } from 'aws-amplify';

// Configure selective sync
DataStore.configure({
  syncExpressions: [
    syncExpression(Grade, () => {
      // Only sync current user's grades
      return g => g.owner.eq(getCurrentUserId());
    })
  ]
});

// Handle sync conflicts
DataStore.observe().subscribe(msg => {
  if (msg.opType === 'UPDATE' && msg.element._version) {
    // Handle version conflicts
    console.log('Sync conflict detected:', msg.element);
  }
});

// Force sync
const forceSyncData = async () => {
  await DataStore.start();
};
```

---

**For More Information**:
- [AWS Amplify DataStore Docs](https://docs.amplify.aws/lib/datastore/getting-started/q/platform/js/)
- [GraphQL Schema Reference](../schema.graphql)
- [Authentication Setup](../amplify/backend/auth/)

*Last Updated: November 30, 2024*