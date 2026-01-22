# Local Testing Guide - Amplify Gen 2 Backend

**Date**: January 17, 2026  
**Purpose**: Verify backend resource access, secrets handling, and API functionality locally

## Quick Start

```bash
# 1. Set up the OPENAI_API_KEY secret
npx ampx sandbox secret set OPENAI_API_KEY
? Enter secret value: [paste your actual OpenAI API key]

# 2. Start the sandbox
npx ampx sandbox

# 3. When sandbox is ready, it will show:
# ✓ Amplify sandbox started
# ✓ GraphQL API endpoint available
# ✓ REST API endpoints available
```

---

## 1. Secrets Management Testing

### 1.1 Set Secrets for Local Development

All 9 streaming/AI handlers require `OPENAI_API_KEY`. Set it once:

```bash
# Set the main secret (only needed once)
npx ampx sandbox secret set OPENAI_API_KEY
? Enter secret value: sk-proj-your-actual-key-here
Done!

# List secrets to verify
npx ampx sandbox secret list
 - OPENAI_API_KEY
```

### 1.2 Verify Secrets in Parameter Store

Once sandbox is running, check AWS Systems Manager (SSM) Parameter Store:

```bash
# View secret metadata (safe - shows name and version only)
npx ampx sandbox secret get OPENAI_API_KEY
name: OPENAI_API_KEY
version: 1
value: [redacted - do not print in CI/CD]
lastUpdated: [timestamp]
```

**Security Note**: The secret value is encrypted and stored in AWS Parameter Store under `/amplify` prefix. It's automatically passed to Lambda handlers via the generated `env` symbol.

### 1.3 Verify Handler Access to Secrets

When sandbox deploys, Lambda handlers automatically receive secrets via generated env files:

```
.amplify/generated/env/chatStream.ts      ✓ Generated
.amplify/generated/env/openai.ts          ✓ Generated
.amplify/generated/env/embeddings.ts      ✓ Generated
(etc. for all 10 handlers)
```

---

## 2. REST API Testing

### 2.1 Test Streaming Endpoints

These endpoints use the generated `env` symbol to access `OPENAI_API_KEY`:

#### a) Chat Stream Endpoint

```bash
# When sandbox is running, it will display the HTTP API endpoint
# Example: https://xxxxx.lambda-url.region.on.aws/

curl -X POST https://[endpoint]/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [user-token]" \
  -d '{
    "message": "Hello, what is 2+2?",
    "context": {
      "unitId": "unit-123"
    }
  }'

# Expected response: Server-sent event stream (SSE)
# Look for: "data: {..."
```

#### b) Content Completion Endpoint

```bash
curl -X POST https://[endpoint]/content-completion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [user-token]" \
  -d '{
    "blockType": "explanation",
    "topic": "Photosynthesis",
    "recentContent": "Plants use sunlight to..."
  }'

# Expected response: Streaming completion text
```

#### c) Suggest Blocks Endpoint

```bash
curl -X POST https://[endpoint]/suggest-blocks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [user-token]" \
  -d '{
    "unitContent": "Introduction to cells...",
    "existingBlocks": ["explanation", "vocabulary"]
  }'

# Expected response: JSON-formatted block suggestions
```

### 2.2 Test GraphQL Endpoints

GraphQL API is automatically available at `/graphql`:

```bash
# Query example
curl -X POST https://[endpoint]/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [user-token]" \
  -d '{
    "query": "query GetUnit($id: ID!) { getUnit(id: $id) { id name } }",
    "variables": { "id": "unit-123" }
  }'

# Expected response: 
# { "data": { "getUnit": { "id": "unit-123", "name": "..." } } }
```

---

## 3. Data Access Testing (Amplify Data Client)

### 3.1 Frontend Data Operations

Test from your Next.js app (runs after `npx npm run dev`):

#### Create Data

```typescript
// pages/test/create-unit.ts
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

export default function CreateUnitTest() {
  const handleCreate = async () => {
    try {
      const { data, errors } = await client.models.Unit.create({
        name: "Test Unit",
        description: "Testing data creation",
      });
      
      if (errors) {
        console.error('Create errors:', errors);
        return;
      }
      
      console.log('Created unit:', data);
      // Unit should have auto-generated: id, createdAt, updatedAt
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  return <button onClick={handleCreate}>Create Unit</button>;
}
```

**Check browser console for**: ✓ Unit created with id, createdAt, updatedAt

#### Update Data

```typescript
// Update the unit created above
const { data: updated, errors } = await client.models.Unit.update({
  id: 'unit-123',
  name: 'Updated Unit Name',
});

// Verify: name changed, updatedAt updated (createdAt unchanged)
console.log('Updated at:', updated.updatedAt);
```

**Check**: ✓ updatedAt timestamp changed

#### Delete Data

```typescript
const { data: deleted, errors } = await client.models.Unit.delete({
  id: 'unit-123'
});

// Verify: returned deleted unit
console.log('Deleted unit ID:', deleted.id);
```

**Check**: ✓ Unit no longer queryable

### 3.2 Test Many-to-Many Relationships

Example: Unit ↔ Word relationship

```typescript
// Create and associate
const unit = await client.models.Unit.create({ name: 'Spanish 101' });
const word = await client.models.Word.create({ 
  spelling: 'gato',
  meaning: 'cat'
});

// Associate via join table (UnitWord)
const association = await client.models.UnitWord.create({
  unitId: unit.id,
  wordId: word.id,
});

// Query with relationship
const unitWithWords = await client.models.Unit.get({ id: unit.id });
const words = await unitWithWords.words.toArray(); // Lazy load join table
```

**Important**: Delete join records before deleting parent records

```typescript
// Delete association FIRST
await client.models.UnitWord.delete({ id: association.id });

// Then delete parent records
await client.models.Word.delete({ id: word.id });
await client.models.Unit.delete({ id: unit.id });
```

---

## 4. Handler-Specific Testing

### 4.1 Chat Stream Handler (Uses env.OPENAI_API_KEY)

**Test**: Verify handler receives `OPENAI_API_KEY` via generated env symbol

```bash
# 1. Start sandbox
npx ampx sandbox

# 2. In another terminal, trigger chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{ "message": "test" }'

# 3. Check CloudWatch logs (via AWS Console or terminal)
# Look for: ✓ Successfully initialized OpenAI
# NOT: ✗ OPENAI_API_KEY environment variable not set
```

### 4.2 Embeddings Handler (Uses env.OPENAI_API_KEY + env.API_ENDPOINT)

```bash
# Trigger embedding generation via GraphQL mutation
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { generateEmbedding(content: \"test\") { ... } }"
  }'

# Check logs: ✓ Embedding generated successfully
```

### 4.3 Section Handler (Uses env.API_ENDPOINT only)

```bash
# Trigger section creation
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createSectionGroup(name: \"Class A\") { id } }"
  }'

# Check logs: ✓ Section created
```

---

## 5. Environment Variable Access Patterns

### 5.1 How Secrets Flow (Architecture)

```
resource.ts Configuration
    ↓
secret('OPENAI_API_KEY')  ← Amplify security function
    ↓
AWS Secrets Manager
    ↓
Generated env file (.amplify/generated/env/chatStream.ts)
    ↓
import { env } from '$amplify/env/chatStream'
    ↓
const apiKey = env.OPENAI_API_KEY  ← Type-safe access
    ↓
Lambda Handler receives value at runtime
```

### 5.2 Verify Generated Env Files

After sandbox starts, check generated files:

```bash
# List generated env files
ls -la .amplify/generated/env/

# Should see:
# .amplify/generated/env/chatStream.ts
# .amplify/generated/env/openai.ts
# .amplify/generated/env/embeddings.ts
# (etc.)

# View one to verify structure
cat .amplify/generated/env/chatStream.ts

# Should contain:
# export const env = {
#   OPENAI_API_KEY: process.env.OPENAI_API_KEY,
#   API_ENDPOINT: process.env.API_ENDPOINT,
#   NODE_ENV: process.env.NODE_ENV,
#   IS_LOCAL: process.env.IS_LOCAL,
# }
```

---

## 6. Troubleshooting Common Issues

### Issue: "OPENAI_API_KEY environment variable not set"

**Cause**: Secret not set before sandbox started

**Solution**:
```bash
# 1. Stop sandbox (Ctrl+C)
# 2. Set the secret
npx ampx sandbox secret set OPENAI_API_KEY
# 3. Start sandbox again
npx ampx sandbox
```

### Issue: "Cannot find module $amplify/env/chatStream"

**Cause**: Generated env files not created yet

**Solution**:
```bash
# Generated files are created when sandbox completes deployment
# Wait for message: "✓ Amplify sandbox deployed successfully"
# Then check .amplify/generated/env/ directory
```

### Issue: "API_ENDPOINT not set"

**Cause**: Branch-specific environment variable not passed through

**Solution**:
```bash
# In resource.ts, API_ENDPOINT comes from amplify hosting
# For local testing, it may not be needed for all handlers
# Check which handlers use it:
grep -r "env.API_ENDPOINT" amplify/data/handlers/*/handler.ts
```

### Issue: "Unauthorized" errors on data operations

**Cause**: Missing or invalid auth token

**Solution**:
```bash
# Get auth token from your logged-in session
# Or test with a guest token if auth rules allow

# Check auth rules in schema:
grep -A 5 "@auth" amplify/data/resource.ts
```

---

## 7. Performance Verification

### 7.1 Test Handler Latency

```bash
# Time a handler request
time curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{ "message": "quick test" }'

# Expected:
# chatStream: 200-500ms (includes OpenAI latency)
# embeddings: 300-1000ms (API call + storage)
```

### 7.2 Check CloudWatch Logs

```bash
# View handler logs in real-time
# Via AWS Console: CloudWatch → Log Groups → /aws/lambda/chatStream

# Or via AWS CLI:
aws logs tail /aws/lambda/chatStream --follow

# Look for:
# - Successful initialization messages
# - No exposed secrets in logs
# - Proper error handling
```

---

## 8. Security Verification Checklist

- [ ] OPENAI_API_KEY set via `npx ampx sandbox secret set` (not in code)
- [ ] No plaintext secrets in `.env` files
- [ ] Handler logs never show exposed API keys
- [ ] Secrets stored in AWS Systems Manager Parameter Store (confirmed)
- [ ] Generated env files have correct structure
- [ ] Type-safe env access via `$amplify/env/` imports
- [ ] Handler code uses `env.OPENAI_API_KEY` not `process.env`

---

## 9. Cleanup

### 9.1 Remove Secrets After Testing

```bash
# Remove specific secret
npx ampx sandbox secret remove OPENAI_API_KEY

# Or remove all
npx ampx sandbox secret remove --all
```

### 9.2 Delete Sandbox

```bash
# Option 1: Interactive delete
Ctrl+C your sandbox
# When prompted: "Do you want to delete all your resources?" → yes

# Option 2: Command line
npx ampx sandbox delete

# Option 3: AWS Console
# Visit Amplify Console → Backends → Delete sandbox
```

---

## 10. Success Indicators

✅ **Secrets Management**:
- [ ] Secret set via `npx ampx sandbox secret set`
- [ ] Secret visible in AWS SSM Parameter Store
- [ ] No "OPENAI_API_KEY not set" errors

✅ **REST API**:
- [ ] Chat endpoint responds with SSE stream
- [ ] Content completion endpoint streams text
- [ ] Suggest blocks endpoint returns JSON

✅ **Data Operations**:
- [ ] Create generates id, createdAt, updatedAt
- [ ] Update changes updatedAt (not createdAt)
- [ ] Delete removes record
- [ ] Many-to-many relationships work with lazy loading

✅ **Handler Execution**:
- [ ] All 10 handlers can access their configured variables
- [ ] No exposed secrets in CloudWatch logs
- [ ] Proper error handling for missing variables

✅ **Type Safety**:
- [ ] Generated env files in `.amplify/generated/env/`
- [ ] IDE shows IntelliSense for env variables
- [ ] TypeScript compilation passes

---

## Commands Reference

```bash
# Secrets
npx ampx sandbox secret set KEY_NAME           # Set secret
npx ampx sandbox secret list                   # List all secrets
npx ampx sandbox secret get KEY_NAME           # View secret value (prints plaintext)
npx ampx sandbox secret remove KEY_NAME        # Delete secret
npx ampx sandbox secret remove --all           # Delete all secrets

# Sandbox
npx ampx sandbox                               # Start sandbox
npx ampx sandbox delete                        # Delete sandbox
npx ampx sandbox --identifier my-sandbox      # Named sandbox

# Config generation
npx ampx generate outputs --app-id [ID] --branch main  # Generate for deployed branch
npx ampx sandbox --outputs-out-dir ./config   # Custom output path

# Client codegen (if needed)
npx ampx generate graphql-client-code          # Generate client code

# Logs
aws logs tail /aws/lambda/chatStream --follow  # Watch handler logs
```

---

**Document Version**: 1.0  
**Last Updated**: January 17, 2026  
**Status**: Ready for Local Testing
