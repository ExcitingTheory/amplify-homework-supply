# Test Fixes Needed

## Summary
Multiple integration test failures after recent changes. Issues span authorization rules, HTTP API authentication, and missing environment variables.

## Issues Identified

### 1. Unit Authorization Too Permissive
**Problem**: Unit model allows `allow.group('Instructors')` which gives ALL instructors access to ALL units.

**Failing Tests**:
- ✗ Learner cannot create units (learners CAN create - shouldn't be able to)
- ✗ Instructor cannot edit other instructor's units (instructors CAN edit - should be owner-only)

**Fix Needed**: Remove `allow.group('Instructors')` from Unit model, rely on `allow.owner()` only.

```typescript
// Current (WRONG):
.authorization((allow) => [
  allow.owner(),
  allow.group('Instructors'),  // <- TOO PERMISSIVE
  allow.group('Admins'),
  allow.groupsDefinedIn('readableGroups').to(['read']),
  allow.groupsDefinedIn('writableGroups').to(['update']),
])

// Should be:
.authorization((allow) => [
  allow.owner(),  // Only creator can update
  allow.group('Admins'),
  allow.groupsDefinedIn('readableGroups').to(['read']),
  allow.groupsDefinedIn('writableGroups').to(['update']),
])
```

### 2. Published Units Not Readable by Learners
**Problem**: Learners cannot view published units

**Failing Test**:
- ✗ Learner can view published units

**Fix Needed**: Add public read access for published units OR ensure published units get added to readableGroups dynamically.

### 3. HTTP API Authentication Failing
**Problem**: All HTTP streaming endpoints return "Unauthorized"

**Failing Tests**:
- ✗ Send chat message with streaming response
- ✗ Chat with context awareness  
- ✗ Error handling for empty message
- ✗ Generate content completion for editor
- ✗ Content completion with context-aware suggestions
- ✗ Content completion respects user preferences
- ✗ Suggest quiz blocks for unit
- ✗ Suggest meaning-association blocks
- ✗ Suggest custom-answer blocks
- ✗ Validate block structure matches schema

**Root Cause**: The Amplify `post()` API may not be sending the Authorization header correctly, OR the HttpUserPoolAuthorizer isn't configured correctly.

**Fix Needed**: Verify HTTP API authorizer configuration and ensure tests pass Bearer token in Authorization header.

### 4. Missing Environment Variables (FIXED)
**Problem**: Section handler missing API_ENDPOINT

**Error**: `API_ENDPOINT environment variable not set. Lambda must be configured as AppSync resolver.`

**Status**: ✅ FIXED in backend.ts - added API_ENDPOINT to section, embeddings, documentAnalysis, and openai handlers

### 5. Auth Token Expiration in Tests
**Problem**: Later tests fail with `NoValidAuthTokens: No federated jwt`

**Failing Tests**:
- ✗ Update section metadata
- ✗ Delete section
- ✗ Update word with audio files
- ✗ Delete word
- ✗ Create question with images
- ✗ Update question answers
- ✗ Delete question
- ✗ Create File record linked to S3 object
- ✗ Associate file with unit (UnitFile join)
- ✗ Associate question with unit (QuestionUnit join)

**Fix Needed**: Tests need to refresh auth session or re-sign in periodically.

## Deployment Required

All schema and backend.ts changes require deployment:
```bash
npx ampx sandbox
```

Or for production:
```bash
npx ampx pipeline-deploy --branch main
```

## Test Environment Setup

Ensure test environment variables are set:
```bash
export TEST_USER_PASSWORD="your-test-password"
```

## Files Modified

1. `amplify/backend.ts` - Added API_ENDPOINT env vars and Lambda self-invoke permissions
2. `amplify/data/resource.ts` - NEEDS FIX for Unit authorization rules
3. Test files may need auth header configuration updates
