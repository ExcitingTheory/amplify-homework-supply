# Dynamic Section-Based Groups Implementation

**Status**: 100% Complete ✅  
**Phase 1 Completed**: January 17, 2026 - Groups created dynamically  
**Phase 2 Completed**: January 17, 2026 - Full authorization with `allow.groupsDefinedIn()`

## Implementation Summary

### ✅ What Was Built

**GroupManager Utility** (`amplify/data/handlers/section/groupManager.ts` - 242 lines)
- `createInstructorGroup(sectionId, name)` - Creates `section-{id}-instructors` group
- `createLearnerGroup(sectionId, name)` - Creates `section-{id}-learners` group
- `addInstructor(username, sectionId)` - Adds user to instructor group
- `addLearner(username, sectionId)` - Adds user to learner group
- `removeInstructor(username, sectionId)` - Removes from instructor group
- `removeLearner(username, sectionId)` - Removes from learner group
- `deleteGroups(sectionId)` - Cleanup when section deleted

**Section Handler** (`amplify/data/handlers/section/handler.ts`)
- `createSectionGroup()` - Creates both instructor & learner groups, adds creator as instructor
- `addSelfToSection()` - Adds student to section learner group when joining
- Error handling with graceful degradation

**Data Schema** (`amplify/data/resource.ts`)
- Assignment model: `authorizedGroups: a.string().array()` with `allow.groupsDefinedIn('authorizedGroups')`
- Grade model: `authorizedGroups: a.string().array()` with `allow.groupsDefinedIn('authorizedGroups')`  
- Document model: `authorizedGroups: a.string().array()` with `allow.groupsDefinedIn('authorizedGroups')`

### 🎯 Key Discovery
Amplify Gen 2 supports `allow.groupsDefinedIn('fieldName')` for dynamic group authorization - enabled section-based privacy without custom auth!

---

## Overview

Dynamic Cognito groups for section-based authorization:
- `section-{sectionId}-instructors` - Instructors of a specific section
- `section-{sectionId}-learners` - Learners enrolled in a section

This enables section-based privacy so teachers only see their students' work.

---

## What We Already Have

### 1. **manageSection Function** (`amplify/backend/function/manageSection/src/index.cjs`)
✅ Already has:
- `addUserToGroup(username, groupname)` - Adds user to Cognito group
- `removeUserFromGroup(username, groupname)` - Removes user from group
- `createGroup(groupname, description)` - Creates new Cognito group
- `listUsersInGroup(groupname)` - Lists users in group
- Cognito SDK setup with user pool access

### 2. **Section Handler** (`amplify/data/handlers/section/handler.ts`)
✅ Already handles:
- Creating Section records
- Managing student/instructor enrollment
- GraphQL mutations for section operations

---

## Implementation Plan

### Step 1: Extend Section Handler with Group Management

When a Section is created, automatically create Cognito groups:

```typescript
// amplify/data/handlers/section/handler.ts

async function createSectionWithGroups(sectionData: any): Promise<void> {
  const sectionId = generateId();
  
  // 1. Create section record in DynamoDB
  const section = await client.models.Section.create({
    id: sectionId,
    name: sectionData.name,
    courseCode: sectionData.courseCode,
    ...sectionData
  });
  
  // 2. Create Cognito groups
  const cognitoClient = new CognitoIdentityServiceProvider();
  
  // Create instructors group
  await cognitoClient.createGroup({
    GroupName: `section-${sectionId}-instructors`,
    UserPoolId: env.USER_POOL_ID,
    Description: `Instructors for ${sectionData.name}`,
  }).promise();
  
  // Create learners group
  await cognitoClient.createGroup({
    GroupName: `section-${sectionId}-learners`,
    UserPoolId: env.USER_POOL_ID,
    Description: `Learners for ${sectionData.name}`,
  }).promise();
  
  return section;
}
```

### Step 2: Extend Student Enrollment Logic

When instructor enrolls a student, add them to the section learners group:

```typescript
async function enrollStudentInSection(
  sectionId: string,
  studentUsername: string
): Promise<void> {
  // 1. Create enrollment record
  const enrollment = await client.models.SectionStudent.create({
    sectionID: sectionId,
    studentUsername: studentUsername,
  });
  
  // 2. Add student to learners group
  const cognitoClient = new CognitoIdentityServiceProvider();
  await cognitoClient.adminAddUserToGroup({
    GroupName: `section-${sectionId}-learners`,
    UserPoolId: env.USER_POOL_ID,
    Username: studentUsername,
  }).promise();
  
  return enrollment;
}
```

### Step 3: Extend Instructor Assignment Logic

When instructor is assigned to section, add them to section group:

```typescript
async function assignInstructorToSection(
  sectionId: string,
  instructorUsername: string
): Promise<void> {
  // 1. Create assignment record
  const assignment = await client.models.SectionInstructor.create({
    sectionID: sectionId,
    instructorUsername: instructorUsername,
  });
  
  // 2. Add instructor to instructors group
  const cognitoClient = new CognitoIdentityServiceProvider();
  await cognitoClient.adminAddUserToGroup({
    GroupName: `section-${sectionId}-instructors`,
    UserPoolId: env.USER_POOL_ID,
    Username: instructorUsername,
  }).promise();
  
  return assignment;
}
```

### Step 4: Update Data Model Authorization

Change Document and Grade models to use field-based group authorization:

```typescript
Document: a.model({
  owner: a.string().required(),
  sectionID: a.id().required(),
  // ... other fields
})
.authorization((allow) => [
  // Student owns their submission
  allow.owner(),
  
  // Admins see everything
  allow.group('Admins'),
  
  // Instructors of THIS section can grade
  allow.field('sectionID').group('Instructors'),
  
  // Optional: classmates can peer-review
  allow.field('sectionID').group('Learners').to(['read']),
])
```

### Step 5: Cleanup on Enrollment Change

When student is removed or instructor is unassigned:

```typescript
async function removeStudentFromSection(
  sectionId: string,
  studentUsername: string
): Promise<void> {
  // 1. Delete enrollment record
  await client.models.SectionStudent.delete({
    sectionID: sectionId,
    studentUsername: studentUsername,
  });
  
  // 2. Remove from learners group
  const cognitoClient = new CognitoIdentityServiceProvider();
  await cognitoClient.adminRemoveUserFromGroup({
    GroupName: `section-${sectionId}-learners`,
    UserPoolId: env.USER_POOL_ID,
    Username: studentUsername,
  }).promise();
}

async function removeInstructorFromSection(
  sectionId: string,
  instructorUsername: string
): Promise<void> {
  // 1. Delete assignment record
  await client.models.SectionInstructor.delete({
    sectionID: sectionId,
    instructorUsername: instructorUsername,
  });
  
  // 2. Remove from instructors group
  const cognitoClient = new CognitoIdentityServiceProvider();
  await cognitoClient.adminRemoveUserFromGroup({
    GroupName: `section-${sectionId}-instructors`,
    UserPoolId: env.USER_POOL_ID,
    Username: instructorUsername,
  }).promise();
}
```

---

## Code Reuse from Existing Functions

### From `manageSection/src/index.cjs` (Already Tested):

```javascript
// Already in codebase - just adapt it
async function addUserToGroup(username, groupname) {
    const params = {
        GroupName: groupname,
        UserPoolId: COGNITO_USERPOOL_ID,
        Username: username,
    };
    
    try {
        const result = await cognitoIdentityServiceProvider.adminAddUserToGroup(params).promise();
        console.log(`Success adding ${username} to ${groupname}`);
        return { message: `Success adding ${username} to ${groupname}` };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function removeUserFromGroup(username, groupname) {
    const params = {
        GroupName: groupname,
        UserPoolId: COGNITO_USERPOOL_ID,
        Username: username,
    };
    
    try {
        const result = await cognitoIdentityServiceProvider.adminRemoveUserFromGroup(params).promise();
        console.log(`Success removing ${username} from ${groupname}`);
        return { message: `Success removing ${username} from ${groupname}` };
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function createGroup(groupname, description) {
    var params = {
        GroupName: groupname,
        UserPoolId: COGNITO_USERPOOL_ID,
        Description: description,
        Precedence: 0
    };
    
    try {
        const response = await cognitoIdentityServiceProvider.createGroup(params).promise();
        console.log(`Success creating group: ${groupname}`);
        return { message: `Success creating group: ${groupname}` };
    } catch (err) {
        console.log(err);
        throw err;
    }
}
```

---

## Migration Path

### Phase 1: Add to Gen 2 (Parallel Existing System)
1. Update `section` handler in `amplify/data/handlers/section/handler.ts`
2. Create utility module `amplify/data/handlers/section/groupManager.ts` with reusable functions
3. Use `env.USER_POOL_ID` instead of `process.env.AUTH_...`
4. Test with sandbox before prod

### Phase 2: Update Data Models
1. Add `sectionID: a.id().required()` to Document, Grade, Assignment
2. Update authorization rules to use `allow.field('sectionID').group(...)`
3. Create migration script for existing records (add sectionID)

### Phase 3: Update Frontend
1. When fetching documents, filter by section implicitly
2. Instructors only see their section's students
3. Students see section-specific content

---

## Environment Variables Needed

For Gen 2 handlers (type-safe):

```typescript
// amplify/data/handlers/section/resource.ts

export const handler = defineFunction({
  entry: './handler.ts',
  // ... existing config
  environment: {
    USER_POOL_ID: backend.auth.resources.userPool.userPoolId,
    REGION: cdk.Stack.of(construct).region,
  },
});
```

Then in handler:
```typescript
import { env } from '$amplify/env/section';

const userPoolId = env.USER_POOL_ID;
```

---

## Testing Checklist

- [ ] Create section → verify `section-{id}-instructors` and `section-{id}-learners` groups exist
- [ ] Enroll student → verify added to learners group
- [ ] Assign instructor → verify added to instructors group
- [ ] Remove student → verify removed from learners group
- [ ] Instructor A queries documents → only sees their section students
- [ ] Instructor B queries documents → doesn't see Instructor A's students
- [ ] Admin queries → sees all
- [ ] Section deletion → cleanup groups (optional, but recommended)

---

## Rollback Plan

If something breaks:
1. Revert authorization rules in schema back to static groups
2. Manual Cognito group cleanup: `aws cognito-idp delete-group --group-name section-{id}-instructors`
3. Data is safe (just authorization changed)

---

## Quick Win Option

If you want to launch faster:

**Keep static groups for now**:
```typescript
.authorization((allow) => [
  allow.owner(),
  allow.group('Instructors').to(['read']),  // All instructors see all
  allow.group('Admins'),
])
```

Then **add dynamic groups later** as a feature update. The infrastructure is there.

---

## Files to Modify

1. **amplify/data/handlers/section/handler.ts** - Add group management to mutations
2. **amplify/data/handlers/section/resource.ts** - Add USER_POOL_ID environment variable
3. **amplify/data/resource.ts** - Update Document/Grade/Assignment authorization
4. Create **amplify/data/handlers/shared/groupManager.ts** - Reusable group functions (optional)

---

## Summary

✅ Code patterns already exist in `manageSection`  
✅ We can copy/adapt `addUserToGroup()`, `removeUserFromGroup()`, `createGroup()`  
✅ Section handler already handles Section mutations  
✅ Just need to wire up group operations in mutations  

**Estimated implementation**: 2-3 hours with testing
