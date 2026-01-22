# Gen 2 Lambda Handlers - Cognito Auth & Groups Implementation Plan

**Last Updated:** January 17, 2026  
**Status:** Authorization Architecture Design

## Overview

Gen 1 lambdas use Cognito-based authorization:
- **Owner-based access**: Users can only modify their own resources
- **Group-based access**: Admins have full CRUD, Learners have read-only
- **Custom ownership**: Grade model uses `instructor` as owner field for grading

Gen 2 must implement the same patterns using Amplify Gen 2 Auth resource access grants.

---

## User Groups Defined in Schema

```typescript
groups: ["ADMINS", "LEARNERS", "INSTRUCTORS"]
```

Each group needs IAM role configuration to access Lambda functions.

---

## Authorization Rules in Schema

### Pattern 1: Owner-Based (Default)
```graphql
@auth(rules: [
  { allow: owner },  # User can only access/modify own resources
  { allow: groups, groups: ["Admins"] }  # Admins can access all
])
```
**Models using this pattern**:
- File
- Question  
- Unit
- Word
- Document
- ParsedContent
- AssistantChat
- (implicit for all user-generated content)

### Pattern 2: Owner + Group Read
```graphql
@auth(rules: [
  { allow: owner },  # Owner has full access
  { allow: groups, groups: ["Learners"], operations: [read] },  # Learners read-only
  { allow: groups, groups: ["Admins"] }  # Admins full access
])
```
**Models using this pattern**:
- File
- Question
- Unit
- Word
- Document
- ParsedContent

### Pattern 3: Custom Owner Field
```graphql
@auth(rules: [
  { allow: owner, ownerField: "instructor", operations: [read] },  # Instructor reads grades
  { allow: owner },  # Student accesses own grade
  { allow: groups, groups: ["Admins"] }  # Admins full access
])
```
**Models using this pattern**:
- Grade (ownerField: "instructor")
- Assignment (ownerField: "owner")

### Pattern 4: Identity Pool + Groups
```graphql
@auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Learners"], operations: [read] },
  { allow: groups, groups: ["Admins"] },
  { allow: private, provider: identityPool }  # S3 file access
])
```
**Models using this pattern**:
- Grade
- AgentJob
- Settings
- AIFeedback
- File (for S3 access via identityId)

### Pattern 5: Admins + Identity Pool Only
```graphql
@auth(rules: [
  { allow: groups, groups: ["Admins"] },
  { allow: private, provider: identityPool }
])
```
**Models using this pattern**:
- Settings (admin-only configuration)

---

## Lambda Handler - Authorization Mapping

### 1. OpenAI Handler (`openai/handler.ts`)

**Functions in schema**:
```graphql
mutation {
  chat(messages: String!, model: String): String
  generateAudio(phrase: String!, voice: String, model: String): String
  generateAudioFile(phrase: String!, voice: String!, model: String!): File
  generateImage(phrase: String!, model: String): String
  generateImageFile(phrase: String!, model: String): File
  initAssistantEditor(model: String!, additionalInstructions: String!): String
  updateAssistantEditor(assistantId: String!, additionalInstructions: String!, model: String): String
  deleteAssistantEditor(assistantId: String!, threadId: String!): String
  useAssistantEditor(threadInstructions: String!, assistantId: String!, threadId: String!): String
  chatAssistantThread(assistantId: String!, messages: String!): String
}

query {
  verifyDefinition(phrase: String!, expected: String!, definition: String!, model: String): String
  verifyWord(word: String!, expected: String!, definition: String!, model: String): String
  verifyShortAnswer(expected: String!, answer: String!, prompt: String!, model: String): String
  transcribe(audio: String!, model: String): String
  verifyAudio(expected: String!, audio: String!, model: String, chatModel:String!): String
  verifyAudioUrl(expected: String!, audioUrl: String!, model: String!, chatModel:String!): String
  transcribeUrl(audioUrl: String!, model: String): String
  processImage(image: String!, model: String): String
  processImageUrl(imageUrl: String!, model: String): String
  verifyImage(expected: String!, image: String!, model: String): String
  verifyImageUrl(expected: String!, imageUrl: String!, model: String): String
}
```

**Authorization Requirements**:

| Operation | Resource Type | Required Auth | Groups | Scope |
|-----------|---------------|---------------|--------|-------|
| chat | AssistantChat | Owner | Admins | Create own |
| generateAudio | N/A (returns URL) | Authenticated | Admins | Public |
| generateAudioFile | File | Owner | Admins | Creates File (owner) |
| generateImage | N/A (returns URL) | Authenticated | Admins | Public |
| generateImageFile | File | Owner | Admins | Creates File (owner) |
| initAssistantEditor | AssistantChat | Owner | Admins | Create own |
| updateAssistantEditor | AssistantChat | Owner | Admins | Update own |
| deleteAssistantEditor | AssistantChat | Owner | Admins | Delete own |
| useAssistantEditor | AssistantChat | Owner | Admins | Read own |
| chatAssistantThread | AssistantChat | Owner | Admins | Update own |
| verifyDefinition | N/A | Authenticated | Learners, Admins | Public verification |
| verifyWord | N/A | Authenticated | Learners, Admins | Public verification |
| verifyShortAnswer | N/A | Authenticated | Learners, Admins | Public verification |
| transcribe | N/A | Authenticated | Learners, Admins | Public |
| verifyAudio | N/A | Authenticated | Learners, Admins | Public |
| verifyAudioUrl | N/A | Authenticated | Learners, Admins | Public |
| transcribeUrl | N/A | Authenticated | Learners, Admins | Public |
| processImage | N/A | Authenticated | Learners, Admins | Public |
| processImageUrl | N/A | Authenticated | Learners, Admins | Public |
| verifyImage | N/A | Authenticated | Learners, Admins | Public |
| verifyImageUrl | N/A | Authenticated | Learners, Admins | Public |

**Implementation Plan**:

```typescript
// amplify/backend/auth/resource.ts
import { defineAuth } from "@aws-amplify/backend"
import { openaiHandler } from "../functions/openai/resource"

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["ADMINS", "LEARNERS", "INSTRUCTORS"],
  access: (allow) => [
    // Grant Lambda functions access to Cognito for user/group operations
    allow.resource(openaiHandler).to([
      "manageUsers",
      "manageGroupMembership", 
      "listUsersInGroup",
      "listGroupsForUser",
      "getUser"
    ])
  ],
})

// amplify/backend/functions/openai/resource.ts
import { defineFunction } from "@aws-amplify/backend"

export const openaiHandler = defineFunction({
  name: "openai-handler",
  entry: "./handler.ts",
  timeoutSeconds: 900,  // Long timeout for file generation
  memoryMB: 3008,
  environment: {
    // Auth env vars auto-injected
    USER_POOL_ID: "from-env",
    IDENTITY_POOL_ID: "from-env",
  }
})
```

**Handler Implementation Requirements**:

```typescript
// In handler.ts
import { env } from '@aws-amplify/backend'

export const handler: Handler = async (event: any, context: any) => {
  // Extract auth context
  const userId = event.requestContext?.authorizer?.claims?.sub  // Cognito user ID
  const userGroups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || []
  const authToken = event.request?.authToken
  
  // Authorization checks needed:
  
  // For AssistantChat (owner-based)
  const assistantChat = await checkOwnership(assistantId, userId)
  if (!assistantChat && !userGroups.includes('ADMINS')) {
    throw new Error('Not authorized: must be owner or admin')
  }
  
  // For File creation (owner = userId)
  const file = await createFile({
    owner: userId,  // Set as owner
    identityId: identityId,  // From Cognito Identity Pool
  })
  
  // For public operations (no ownership check)
  // verifyDefinition, verifyWord, etc. just check authenticated
  if (!userId) {
    throw new Error('Authentication required')
  }
}
```

---

### 2. Moderation Handler (`moderation/handler.ts`)

**Functions in schema**:
```graphql
mutation {
  moderateContent(content: String!): ModerationResult
}
```

**Authorization Requirements**:

| Operation | Resource Type | Required Auth | Groups | Scope |
|-----------|---------------|---------------|--------|-------|
| moderateContent | N/A | Authenticated | Learners, Admins | Public |

**Implementation Plan**:

```typescript
// No Cognito user management needed for moderation
// Just verify authenticated user

// Handler checks:
export const handler: Handler = async (event: any) => {
  const userId = event.requestContext?.authorizer?.claims?.sub
  if (!userId) {
    throw new Error('Authentication required')
  }
  
  // Content moderation is public to authenticated users
  const result = await openai.moderations.create({...})
  return result
}
```

---

### 3. Section Handler (`section/handler.ts`)

**Functions in schema**:
```graphql
type Section @model @auth(rules: [
  { allow: owner },
  { allow: groups, groupsField: "learner", operations: [read] },
  { allow: groups, groups: ["Admins"] }
])

mutation {
  createSectionGroup(name: String!, description: String!): String
  addSelfToSection(code: String!): String
}

query {
  listSectionStudents(sectionCode: String!): [StudentInfo]
}
```

**Authorization Requirements**:

| Operation | Resource Type | Required Auth | Groups | Scope | Notes |
|-----------|---------------|---------------|--------|-------|-------|
| createSectionGroup | Section | Owner | Admins | Instructor only | Creates own section |
| addSelfToSection | Section | Self-assign | Learners, Admins | Join with code | Add user to section |
| listSectionStudents | Section | Owner | Admins | Instructor only | List enrolled |

**Cognito Operations Needed**:
- `AdminAddUserToGroup` - Add learner to section group
- `AdminListGroupsForUser` - List user's sections
- `ListUsersInGroup` - List students in section

**Implementation Plan**:

```typescript
// amplify/backend/auth/resource.ts
import { defineAuth } from "@aws-amplify/backend"
import { openaiHandler } from "../functions/openai/resource"
import { sectionHandler } from "../functions/section/resource"

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["ADMINS", "LEARNERS", "INSTRUCTORS"],
  access: (allow) => [
    // OpenAI handler needs user management
    allow.resource(openaiHandler).to([...]),
    
    // Section handler needs group management
    allow.resource(sectionHandler).to([
      "manageGroupMembership",  // addUserToGroup, removeUserFromGroup
      "listUsersInGroup",        // listSectionStudents
      "listGroupsForUser",       // Get user's sections
      "getGroup",                // Get section details
      "listGroups"               // List all sections
    ])
  ],
})

// Handler implementation
export const handler: Handler = async (event: any, context: any) => {
  const userId = event.requestContext?.authorizer?.claims?.sub
  const userGroups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || []
  
  switch (operationName) {
    case 'createSectionGroup':
      // Check if Instructor or Admin
      if (!userGroups.includes('INSTRUCTORS') && !userGroups.includes('ADMINS')) {
        throw new Error('Only instructors can create sections')
      }
      // Create section with owner = userId
      return await createSection({ name, description, owner: userId })
      
    case 'addSelfToSection':
      // Any authenticated learner can join
      const section = await getSectionByCode(code)
      if (!section) throw new Error('Section not found')
      
      // Add user to Cognito group
      await cognitoIdp.adminAddUserToGroup({
        GroupName: section.id,  // Section ID is the group name
        Username: userId
      })
      
      // Update Section.learner field
      return await addLearnerToSection(section.id, userId)
      
    case 'listSectionStudents':
      // Check if user owns section or is admin
      const section = await getSectionByCode(sectionCode)
      if (section.owner !== userId && !userGroups.includes('ADMINS')) {
        throw new Error('Not authorized: must be section owner or admin')
      }
      
      // List users in Cognito group
      const users = await cognitoIdp.listUsersInGroup({
        GroupName: section.id
      })
      
      return users.Users.map(u => ({
        id: u.Username,
        name: u.Attributes.find(a => a.Name === 'name')?.Value,
        email: u.Attributes.find(a => a.Name === 'email')?.Value
      }))
  }
}
```

---

### 4. Assistant Handler (`assistant/handler.ts`)

**Functions in schema**:
```graphql
type AssistantChat @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admins"] }
])

mutation {
  initAssistantEditor(model: String!, additionalInstructions: String!): String
  updateAssistantEditor(assistantId: String!, additionalInstructions: String!, model: String): String
  deleteAssistantEditor(assistantId: String!, threadId: String!): String
  useAssistantEditor(threadInstructions: String!, assistantId: String!, threadId: String!): String
  chatAssistantThread(assistantId: String!, messages: String!): String
}
```

**Authorization Requirements**:

| Operation | Resource Type | Required Auth | Groups | Scope |
|-----------|---------------|---------------|--------|-------|
| initAssistantEditor | AssistantChat | Owner | Admins | Create own |
| updateAssistantEditor | AssistantChat | Owner | Admins | Update own |
| deleteAssistantEditor | AssistantChat | Owner | Admins | Delete own |
| useAssistantEditor | AssistantChat | Owner | Admins | Read own |
| chatAssistantThread | AssistantChat | Owner | Admins | Update own |

**Implementation Plan**:

```typescript
// No special Cognito operations needed
// Just owner-based access control

export const handler: Handler = async (event: any) => {
  const userId = event.requestContext?.authorizer?.claims?.sub
  const userGroups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || []
  
  switch (operationName) {
    case 'initAssistantEditor':
      // Create AssistantChat with owner = userId
      const chat = await createAssistantChat({
        owner: userId,
        model,
        additionalInstructions
      })
      return JSON.stringify(chat)
      
    case 'updateAssistantEditor':
      // Verify ownership
      const chat = await getAssistantChat(assistantId)
      if (chat.owner !== userId && !userGroups.includes('ADMINS')) {
        throw new Error('Not authorized: must be owner or admin')
      }
      
      return await updateAssistantChat(assistantId, { model, additionalInstructions })
      
    case 'deleteAssistantEditor':
      // Verify ownership
      const chat = await getAssistantChat(assistantId)
      if (chat.owner !== userId && !userGroups.includes('ADMINS')) {
        throw new Error('Not authorized: must be owner or admin')
      }
      
      // Delete from OpenAI + DB
      await openai.beta.assistants.del(assistantId)
      await openai.beta.threads.del(threadId)
      return { success: true }
      
    case 'useAssistantEditor':
    case 'chatAssistantThread':
      // Verify ownership (same checks)
      const chat = await getAssistantChat(assistantId)
      if (chat.owner !== userId && !userGroups.includes('ADMINS')) {
        throw new Error('Not authorized: must be owner or admin')
      }
      
      // Process operation
      return await handleThreadChat(assistantId, threadId, messages)
  }
}
```

---

### 5. Document Analysis Handler (`documentAnalysis/handler.ts`)

**Functions in schema**:
```graphql
type Document @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Learners"], operations: [read] },
  { allow: groups, groups: ["Admins"] }
])

type ParsedContent @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Learners"], operations: [read] },
  { allow: groups, groups: ["Admins"] }
])

mutation {
  analyzeDocument(fileID: ID!): AnalyzeDocumentResult
  cancelDocumentAnalysis(fileID: ID!): CancelDocumentAnalysisResult
}
```

**Authorization Requirements**:

| Operation | Resource Type | Required Auth | Groups | Scope | Notes |
|-----------|---------------|---------------|--------|-------|-------|
| analyzeDocument | Document, File | Owner | Admins | Analyze own | Learners read results |
| cancelDocumentAnalysis | Document | Owner | Admins | Cancel own | User must own document |

**Implementation Plan**:

```typescript
// No special Cognito operations needed
// Just owner-based access control for Document/File

export const handler: Handler = async (event: any) => {
  const userId = event.requestContext?.authorizer?.claims?.sub
  const userGroups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || []
  
  switch (operationName) {
    case 'analyzeDocument':
      // Get document and verify ownership
      const document = await getDocument(fileID)
      
      if (document.owner !== userId && !userGroups.includes('ADMINS')) {
        throw new Error('Not authorized: must be owner or admin')
      }
      
      // Async analysis
      const result = await startDocumentAnalysis(fileID, document)
      
      // Return pending status
      return {
        success: true,
        fileID,
        documentID: document.id,
        progress: 'extracting',
        message: 'Document analysis started'
      }
      
    case 'cancelDocumentAnalysis':
      // Get document and verify ownership
      const document = await getDocument(fileID)
      
      if (document.owner !== userId && !userGroups.includes('ADMINS')) {
        throw new Error('Not authorized: must be owner or admin')
      }
      
      // Cancel ongoing job
      const job = await getAgentJob(document.id, 'pdf_analysis')
      if (job) {
        await updateAgentJob(job.id, { status: 'cancelled' })
      }
      
      return {
        success: true,
        fileID,
        documentID: document.id,
        message: 'Analysis cancelled'
      }
  }
}
```

---

### 6. Embeddings Handler (`embeddings/handler.ts`)

**Functions in schema**:
```graphql
type Document @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Learners"], operations: [read] },
  { allow: groups, groups: ["Admins"] }
])

mutation {
  generateEmbeddings(fileID: ID!): GenerateEmbeddingsResult
  generateEmbedding(content: String!, model: String, dimensions: Int): EmbeddingResult
}
```

**Authorization Requirements**:

| Operation | Resource Type | Required Auth | Groups | Scope |
|-----------|---------------|---------------|--------|-------|
| generateEmbedding | N/A | Authenticated | Learners, Admins | Single text embedding |
| generateEmbeddings | Document, File | Owner | Admins | Batch embeddings for document |

**Implementation Plan**:

```typescript
export const handler: Handler = async (event: any) => {
  const userId = event.requestContext?.authorizer?.claims?.sub
  const userGroups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || []
  
  switch (operationName) {
    case 'generateEmbedding':
      // Public to authenticated users
      if (!userId) {
        throw new Error('Authentication required')
      }
      
      const embedding = await openai.embeddings.create({
        model: model || 'text-embedding-3-small',
        input: content,
        dimensions: dimensions || 512
      })
      
      return {
        embedding: embedding.data[0].embedding,
        model: embedding.model,
        dimensions: dimensions || 512,
        tokenCount: embedding.usage.total_tokens
      }
      
    case 'generateEmbeddings':
      // Must be document owner or admin
      const document = await getDocument(fileID)
      
      if (document.owner !== userId && !userGroups.includes('ADMINS')) {
        throw new Error('Not authorized: must be owner or admin')
      }
      
      // Start async batch embedding
      const result = await startEmbeddingGeneration(fileID, document)
      
      return {
        success: true,
        fileID,
        documentID: document.id,
        embeddingCount: 0,  // Will be populated async
        message: 'Embedding generation started'
      }
  }
}
```

---

### 7. AI Handler (`ai/handler.ts`)

**Functions in schema**:
```graphql
mutation {
  contentCompletion(prompt: String!, context: AWSJSON): String
  suggestBlocks(unitStructure: AWSJSON!, currentContext: AWSJSON, userHistory: AWSJSON): String
  predictUnitData(unitID: ID!): String
  predictUnitByData(data: String!): String
}
```

**Authorization Requirements**:

| Operation | Resource Type | Required Auth | Groups | Scope |
|-----------|---------------|---------------|--------|-------|
| contentCompletion | N/A | Authenticated | Learners, Admins | Public |
| suggestBlocks | Unit | Owner | Admins | For unit owner |
| predictUnitData | Unit | Owner | Admins | Predict from unit |
| predictUnitByData | N/A | Authenticated | Learners, Admins | Public |

**Implementation Plan**:

```typescript
export const handler: Handler = async (event: any) => {
  const userId = event.requestContext?.authorizer?.claims?.sub
  const userGroups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || []
  
  if (!userId) {
    throw new Error('Authentication required')
  }
  
  switch (operationName) {
    case 'contentCompletion':
      // Public to authenticated users
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
      
    case 'suggestBlocks':
      // Verify unit ownership
      const unit = await getUnit(unitStructure.unitID)
      if (!unit || (unit.owner !== userId && !userGroups.includes('ADMINS'))) {
        throw new Error('Not authorized: must be unit owner or admin')
      }
      
      return await suggestBlocksWithAI(unitStructure, currentContext)
      
    case 'predictUnitData':
      // Verify unit ownership
      const unit = await getUnit(unitID)
      if (!unit || (unit.owner !== userId && !userGroups.includes('ADMINS'))) {
        throw new Error('Not authorized: must be unit owner or admin')
      }
      
      return await predictUnitMetadata(unit)
      
    case 'predictUnitByData':
      // Public to authenticated users
      return await predictUnitFromData(JSON.parse(data))
  }
}
```

---

## Implementation Checklist

### Phase 1: Auth Infrastructure Setup
- [ ] Define user groups in `amplify/auth/resource.ts`
  ```
  groups: ["ADMINS", "LEARNERS", "INSTRUCTORS"]
  ```
- [ ] Configure each Lambda function resource in `amplify/backend/functions/*/resource.ts`
- [ ] Grant functions access to Cognito operations via `allow.resource().to([...])`
- [ ] Set up environment variables for USER_POOL_ID, IDENTITY_POOL_ID

### Phase 2: Ownership Verification
- [ ] Extract `userId` from `event.requestContext?.authorizer?.claims?.sub`
- [ ] Extract `userGroups` from `event.requestContext?.authorizer?.claims?.['cognito:groups']`
- [ ] Implement ownership check: `resource.owner !== userId && !userGroups.includes('ADMINS')`
- [ ] Verify all create operations set `owner: userId`

### Phase 3: Group-Based Access
- [ ] For read-only operations: Allow Learners
- [ ] For write operations: Require owner or Admins
- [ ] Implement checks at handler entry point

### Phase 4: Identity Pool Integration
- [ ] Use `identityId` from Cognito Identity Pool for S3 paths
- [ ] Set up `File.identityId` when creating files
- [ ] Implement S3 access patterns: `protected/{identityId}/`, `public/`

### Phase 5: Custom Owner Fields
- [ ] Grade model: Check both owner and instructor field
- [ ] Assignment: Check section owner authorization

### Phase 6: Testing
- [ ] Unit test: Owner accessing own resource ✅
- [ ] Unit test: Owner accessing other's resource ❌
- [ ] Unit test: Admin accessing any resource ✅
- [ ] Unit test: Learner accessing with read-only ✅
- [ ] Integration test: Cognito group assignment ✅
- [ ] Integration test: File S3 access via identityId ✅

---

## Environment Variable Setup

Each function needs these injected by Amplify Auth:

```typescript
// Auto-injected by: allow.resource(handler).to([...])
process.env.COGNITO_USER_POOL_ID          // User pool ID
process.env.COGNITO_IDENTITY_POOL_ID      // Identity pool ID
process.env.AWS_REGION                    // Region
```

**Amplify SDK available in functions**:
```typescript
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider'
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity'

const cognitoIdp = new CognitoIdentityProviderClient({
  credentials: fromEnv()  // Auto-configured by Amplify
})

const cognitoId = new CognitoIdentityClient({
  credentials: fromEnv()  // Auto-configured by Amplify
})
```

---

## Summary: Authorization Changes from Gen 1 to Gen 2

| Aspect | Gen 1 | Gen 2 |
|--------|-------|-------|
| **Group Definition** | Implicit in permissions | Explicit in auth resource |
| **Ownership Check** | Manual JWT claim parsing | Amplify handles via @auth rules |
| **Cognito Access** | Direct SDK calls | Grant via `allow.resource().to([...])` |
| **Identity Resolution** | Manual IAM lookup | Auto-injected by Amplify |
| **S3 Access Control** | Path-based prefixes | Identity-based prefixes |
| **Authorization Mode** | Custom logic per handler | Declarative @auth rules |

**Critical Gen 2 Pattern**:
```typescript
// ALWAYS extract auth context first
const userId = event.requestContext?.authorizer?.claims?.sub
const userGroups = event.requestContext?.authorizer?.claims?.['cognito:groups'] || []

// THEN check authorization before processing
if (resource.owner !== userId && !userGroups.includes('ADMINS')) {
  throw new Error('Not authorized')
}

// FINALLY process operation
return await processOperation(resource)
```

---

## Risk Assessment

### HIGH RISK
- ❌ Missing authorization check = Data leak
- ❌ Wrong owner assignment = Unauthorized access
- ❌ Not extracting userId correctly = Failed auth

### MEDIUM RISK
- ⚠️ Missing group check = Instructors can't teach
- ⚠️ IdentityId not set = S3 access fails
- ⚠️ Not checking custom owner fields = Wrong access levels

### IMPLEMENTATION PRIORITY
1. **CRITICAL**: Implement userId extraction and ownership verification in ALL handlers
2. **HIGH**: Configure Cognito group operations for section/user management
3. **HIGH**: Set up S3 identityId for file access control
4. **MEDIUM**: Test group-based read access
5. **MEDIUM**: Implement custom owner field checks (Grade.instructor)

---

## Next Steps

1. Review and confirm authorization requirements with product team
2. Implement Phase 1: Auth resource setup
3. Update each handler with Phase 2-3 checks
4. Deploy to dev and run authorization tests
5. Audit all handlers for ownership verification
6. Document final auth implementation for team
