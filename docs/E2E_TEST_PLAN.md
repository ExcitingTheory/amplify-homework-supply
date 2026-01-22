# E2E Test Plan - Gen 2 Migration

**Last Updated**: January 18, 2026  
**Status**: Planning Phase  
**Target**: Phase F Testing & Deployment

## Overview

This document outlines the comprehensive end-to-end (E2E) testing strategy for validating the Amplify Gen 2 migration. Tests will be executed in sandbox, staging, and production environments to ensure all features work correctly with the new backend.

---

## Test Environments

### 1. Local Sandbox
**Purpose**: Rapid development and initial validation  
**Setup**: `npx ampx sandbox`  
**Data**: Mock/seed data  
**Duration**: Ongoing during development

### 2. Staging Environment
**Purpose**: Pre-production validation with production-like data  
**Setup**: Amplify branch deployment (staging branch)  
**Data**: Anonymized production data or realistic test data  
**Duration**: 1-2 weeks before production

### 3. Production Environment
**Purpose**: Post-deployment smoke tests and monitoring  
**Setup**: Live production deployment  
**Data**: Real user data (read-only tests only)  
**Duration**: Continuous monitoring

---

## Test Categories

### A. Authentication & Authorization Tests

#### A1. User Authentication
- [ ] Login with valid instructor credentials
- [ ] Login with valid learner credentials
- [ ] Login with admin credentials
- [ ] Login failure with invalid credentials
- [ ] Password reset flow
- [ ] Session persistence across page refreshes
- [ ] Auto-logout after session timeout

#### A2. Authorization & Group Access
- [ ] Instructor can create units
- [ ] Instructor can edit owned units
- [ ] Instructor cannot edit other instructor's units (unless shared)
- [ ] Learner can view published units
- [ ] Learner cannot create/edit units
- [ ] Admin has full access to all resources
- [ ] Dynamic group authorization works for sections
  - [ ] Section instructors can read/write section content
  - [ ] Section learners can read section content
  - [ ] Non-members cannot access section content

#### A3. S3 File Access
- [ ] Instructor can upload to `protected/{identityId}/`
- [ ] Learner can upload to `protected/{identityId}/`
- [ ] Public files accessible to all authenticated users
- [ ] Protected files only accessible to owner
- [ ] Private files only accessible to owner
- [ ] File access denied for wrong identity

---

### B. GraphQL API Tests (Gen 2)

#### B1. Unit CRUD Operations
- [ ] Create unit with Amplify Gen 2 client
- [ ] Read unit by ID
- [ ] List all units (with pagination)
- [ ] Update unit content (data field JSON)
- [ ] Delete unit
- [ ] ObserveQuery real-time subscription works
- [ ] Optimistic concurrency control (version conflict handling)

#### B2. Assignment CRUD Operations
- [ ] Create assignment for section
- [ ] Assign unit to multiple learners
- [ ] Update assignment due date
- [ ] Delete assignment
- [ ] Query assignments by section
- [ ] Query assignments by learner
- [ ] Real-time updates when instructor modifies assignment

#### B3. Grade CRUD Operations
- [ ] Submit grade (student creates)
- [ ] Update grade data (student progress)
- [ ] Complete grade (mark as complete)
- [ ] Calculate accuracy from rubric
- [ ] Query grades by assignment
- [ ] Query grades by learner
- [ ] Instructor can view all grades for assignment
- [ ] Real-time grade updates visible to instructor

#### B4. Section CRUD Operations
- [ ] Create section with join code
- [ ] Add learners to section
- [ ] Remove learners from section
- [ ] Update section metadata
- [ ] Delete section
- [ ] Query sections by instructor
- [ ] Query sections by learner

#### B5. Word/Question/File CRUD
- [ ] Create vocabulary word
- [ ] Update word with audio files
- [ ] Delete word
- [ ] Create question with images
- [ ] Update question answers
- [ ] Delete question
- [ ] Upload file to S3
- [ ] Create File record linked to S3 object
- [ ] Associate file with unit (UnitFile join)
- [ ] Associate word with unit (UnitWord join)

#### B6. Document Analysis Flow
- [ ] Upload PDF document
- [ ] Trigger document analysis
- [ ] Poll for analysis status (uploaded → extracting → analyzing → completed)
- [ ] Verify ParsedContent created
- [ ] Verify vocabulary extracted
- [ ] Verify questions generated
- [ ] Cancel in-progress analysis
- [ ] Error handling for failed analysis

#### B7. Relationship Queries
- [ ] Unit with nested assignments
- [ ] Unit with nested words (ManyToMany)
- [ ] Assignment with nested grades
- [ ] Section with nested assignments
- [ ] Grade with nested unit
- [ ] Lazy loading relationships: `await unit.words.toArray()`
- [ ] Pagination for large relationship collections

---

### C. Lambda Handler Integration Tests

#### C1. Chat Stream Handler
- [ ] Send chat message with streaming response
- [ ] Tool invocation: suggest blocks
- [ ] Tool invocation: search files
- [ ] Tool invocation: generate audio
- [ ] Streaming response with SSE (Server-Sent Events)
- [ ] CORS headers present for authenticated requests
- [ ] Error handling for OpenAI API failures
- [ ] Rate limiting works correctly

#### C2. Content Completion Handler
- [ ] Generate content completion for editor
- [ ] Streaming response for partial completions
- [ ] Context-aware suggestions based on unit content
- [ ] Respect user preferences (model, temperature)
- [ ] Error handling for incomplete prompts

#### C3. Suggest Blocks Handler
- [ ] Suggest quiz blocks for unit
- [ ] Suggest meaning-association blocks
- [ ] Suggest custom-answer blocks
- [ ] JSON response (not streaming)
- [ ] Validate block structure matches schema
- [ ] Context from current unit content

#### C4. Section Handler (Gen 1 Admin Queries)
- [ ] Add user to Cognito group
- [ ] Remove user from Cognito group
- [ ] Create dynamic group for section
- [ ] Update group permissions
- [ ] Error handling for invalid group names

#### C5. Embeddings Handler
- [ ] Generate embedding for single text
- [ ] Generate embeddings for batch
- [ ] Verify embedding dimensions (1536 for text-embedding-3-small)
- [ ] Store embeddings in model fields
- [ ] Semantic search using embeddings

#### C6. AI Handler (Multiple Operations)
- [ ] Generate audio from text (TTS)
- [ ] Transcribe audio file (Whisper)
- [ ] Analyze image (GPT-4 Vision)
- [ ] Generate image (DALL-E)
- [ ] Content moderation check
- [ ] Error handling for each operation

#### C7. Document Analysis Handler
- [ ] Extract text from PDF
- [ ] Generate vocabulary list
- [ ] Create comprehension questions
- [ ] Store results in ParsedContent
- [ ] Update Document status
- [ ] Resume interrupted analysis

#### C8. Moderation Handler
- [ ] Check text content for policy violations
- [ ] Flag inappropriate content
- [ ] Store moderation results
- [ ] Auto-reject flagged content
- [ ] Manual review workflow

---

### D. WebSocket API Tests (Yjs Integration)

#### D1. Connection Lifecycle
- [ ] Client connects to WebSocket API
- [ ] $connect handler loads Y.Doc from DynamoDB
- [ ] Initial state sent to client
- [ ] Client subscribes to room
- [ ] $disconnect handler cleans up subscriptions
- [ ] Connection persists during idle time

#### D2. Real-Time Sync
- [ ] Client A edits document, Client B receives update
- [ ] Multiple clients editing simultaneously
- [ ] Conflict resolution (last-write-wins vs merge)
- [ ] Y.Doc updates persisted to DynamoDB
- [ ] Room state synced across all clients
- [ ] Network reconnection after disconnect

#### D3. Yjs Operations
- [ ] Insert text operation
- [ ] Delete text operation
- [ ] Format text operation
- [ ] Undo/redo operations synced
- [ ] Awareness updates (cursor positions)
- [ ] Yjs snapshot/version history

#### D4. Performance
- [ ] Latency < 100ms for local updates
- [ ] Latency < 500ms for cross-region updates
- [ ] Handles 10+ concurrent editors
- [ ] Message throughput > 100 updates/sec
- [ ] DynamoDB capacity not exceeded

---

### E. Frontend Component Tests

#### E1. Workbook Flow (Existing Test)
- [ ] Student logs in
- [ ] Navigates to workbook assignment
- [ ] Timer starts correctly (00:02:00)
- [ ] Completes meaning-association exercise (drag/drop)
- [ ] Completes multiple-choice questions
- [ ] Submits grade
- [ ] Grade accuracy calculated
- [ ] Real-time progress visible to instructor

#### E2. Unit Editor (Lexical)
- [ ] Create new unit
- [ ] Add text content
- [ ] Add quiz block (QuizNode)
- [ ] Add meaning-association block (MeaningAssociationNode)
- [ ] Add answer block (AnswerNode)
- [ ] Add custom-answer block (CustomAnswerNode)
- [ ] Upload audio file to block
- [ ] Upload image to block
- [ ] Save unit content (JSON to `Unit.data`)
- [ ] Load existing unit content
- [ ] Undo/redo operations
- [ ] Markdown shortcuts work

#### E3. Dictionary Editor
- [ ] Create new vocabulary word
- [ ] Add phonetic pronunciation
- [ ] Add definition
- [ ] Upload audio pronunciation
- [ ] Generate TTS audio
- [ ] Associate word with unit
- [ ] Edit existing word
- [ ] Delete word
- [ ] Search/filter words

#### E4. Question Editor
- [ ] Create multiple-choice question
- [ ] Add images to question
- [ ] Add audio to question
- [ ] Set correct answer
- [ ] Set difficulty level
- [ ] Generate question with AI
- [ ] Edit existing question
- [ ] Delete question

#### E5. File Management
- [ ] Upload file to S3 (via uploadData)
- [ ] Get cached URL for file
- [ ] Associate file with unit
- [ ] Delete file from S3
- [ ] Update file metadata
- [ ] Download file
- [ ] Generate audio waveform

#### E6. Section Management
- [ ] Create new section
- [ ] Generate join code
- [ ] Add students via join code
- [ ] Remove students from section
- [ ] View section roster
- [ ] Create assignment for section
- [ ] View section grades dashboard

#### E7. AI Chat Sidebar
- [ ] Open chat sidebar
- [ ] Send message to AI
- [ ] Receive streaming response
- [ ] Tool invocation visible in UI
- [ ] Tool result rendered
- [ ] Chat history persisted
- [ ] Clear chat history
- [ ] Context awareness (current unit, files)

#### E8. Document Analysis UI
- [ ] Upload PDF document
- [ ] View analysis progress
- [ ] Display extracted vocabulary
- [ ] Display generated questions
- [ ] Cancel analysis
- [ ] Retry failed analysis
- [ ] Export vocabulary to dictionary

---

### F. Integration & Workflow Tests

#### F1. End-to-End Instructor Workflow
1. [ ] Instructor logs in
2. [ ] Creates new section with join code
3. [ ] Creates new unit with content
4. [ ] Adds vocabulary words to unit
5. [ ] Uploads audio files
6. [ ] Creates quiz blocks in editor
7. [ ] Publishes unit
8. [ ] Creates assignment for section
9. [ ] Shares join code with students
10. [ ] Monitors student progress in real-time
11. [ ] Views submitted grades
12. [ ] Provides feedback to students

#### F2. End-to-End Learner Workflow
1. [ ] Learner logs in
2. [ ] Joins section via join code
3. [ ] Views assigned workbooks
4. [ ] Starts workbook (timer begins)
5. [ ] Completes meaning-association exercise
6. [ ] Completes multiple-choice questions
7. [ ] Records audio answer
8. [ ] Submits grade
9. [ ] Views grade results
10. [ ] Receives instructor feedback
11. [ ] Accesses vocabulary dictionary

#### F3. PDF Document Analysis Workflow
1. [ ] Upload PDF document
2. [ ] Wait for text extraction
3. [ ] Wait for AI analysis
4. [ ] Review extracted vocabulary
5. [ ] Edit/approve vocabulary
6. [ ] Add vocabulary to unit
7. [ ] Review generated questions
8. [ ] Edit/approve questions
9. [ ] Add questions to unit
10. [ ] Publish unit with imported content

#### F4. Collaborative Editing Workflow (Yjs)
1. [ ] Instructor A opens unit editor
2. [ ] Instructor B opens same unit editor
3. [ ] Both see real-time cursor positions
4. [ ] Instructor A types text
5. [ ] Instructor B sees text appear
6. [ ] Instructor B adds quiz block
7. [ ] Instructor A sees quiz block
8. [ ] Both save simultaneously (no conflicts)
9. [ ] Unit data persisted correctly
10. [ ] Disconnected instructor reconnects, sees latest state

---

### G. Performance & Load Tests

#### G1. GraphQL Query Performance
- [ ] List 100 units < 1 second
- [ ] List 1000 assignments < 2 seconds
- [ ] Nested query (unit + words + files) < 500ms
- [ ] ObserveQuery subscription latency < 200ms
- [ ] Pagination works for 10,000+ records

#### G2. Lambda Handler Performance
- [ ] Chat stream first token < 500ms
- [ ] Content completion < 1 second
- [ ] Document analysis (10-page PDF) < 30 seconds
- [ ] Embedding generation (1000 words) < 5 seconds
- [ ] Cold start time < 3 seconds

#### G3. File Upload Performance
- [ ] Upload 1MB audio file < 5 seconds
- [ ] Upload 10MB video file < 30 seconds
- [ ] Upload 50MB PDF < 2 minutes
- [ ] Parallel uploads (5 files) complete successfully
- [ ] Progress callbacks fire correctly

#### G4. Real-Time Sync Performance
- [ ] 2 concurrent editors: < 100ms latency
- [ ] 10 concurrent editors: < 500ms latency
- [ ] 50 concurrent editors: < 2 seconds latency
- [ ] 100 updates/second sustained

#### G5. Load Testing
- [ ] 100 concurrent users browsing units
- [ ] 50 concurrent users submitting grades
- [ ] 25 concurrent document analysis jobs
- [ ] 10 concurrent AI chat sessions
- [ ] Database throughput sufficient
- [ ] No Lambda throttling errors

---

### H. Error Handling & Edge Cases

#### H1. Network Failures
- [ ] GraphQL query fails (show error message)
- [ ] GraphQL mutation fails (retry logic)
- [ ] ObserveQuery reconnects after disconnect
- [ ] File upload fails (retry/resume)
- [ ] WebSocket disconnect (auto-reconnect)

#### H2. Data Validation
- [ ] Empty unit name rejected
- [ ] Invalid JSON in unit.data rejected
- [ ] Duplicate section join code rejected
- [ ] Invalid email format rejected
- [ ] Missing required fields rejected

#### H3. Conflict Resolution
- [ ] Optimistic concurrency version mismatch
- [ ] Two users update same record (last-write-wins)
- [ ] Yjs merge conflict (CRDT resolution)
- [ ] File overwrite protection

#### H4. Edge Cases
- [ ] Unit with 0 questions
- [ ] Assignment with no learners
- [ ] Section with 1000+ students
- [ ] Grade with incomplete data
- [ ] File with missing S3 object
- [ ] Document analysis of corrupted PDF
- [ ] Unicode/emoji in text fields
- [ ] Very long unit content (10,000+ lines)

---

## Test Data Requirements

### Seed Data for Sandbox/Staging

```javascript
// Create test users
const instructorUser = {
  username: 'instructor@test.com',
  password: 'Test123!',
  groups: ['Instructors']
};

const learnerUser = {
  username: 'learner@test.com',
  password: 'Test123!',
  groups: []
};

const adminUser = {
  username: 'admin@test.com',
  password: 'Test123!',
  groups: ['Admins']
};

// Create test section
const testSection = {
  name: 'Test Section - Japanese 101',
  code: 'TEST123',
  description: 'E2E test section'
};

// Create test unit
const testUnit = {
  name: 'Test Unit - Basic Vocabulary',
  description: 'Unit for E2E testing',
  status: 'PUBLISHED',
  data: JSON.stringify({
    // Lexical editor content
  }),
  timeLimitSeconds: 120
};

// Create test words
const testWords = [
  { phrase: 'now', pronunciation: 'nau', definition: 'at the present time or moment.' },
  { phrase: 'thing', pronunciation: 'θɪŋ', definition: 'an object that one need not name specifically.' }
];

// Create test assignment
const testAssignment = {
  due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
  learner: 'learner@test.com',
  sectionID: testSection.id,
  unitID: testUnit.id
};
```

### Seed Script

Create `scripts/seed-e2e-data.js`:

```javascript
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient();

async function seedE2EData() {
  console.log('Seeding E2E test data...');
  
  // Create section
  const section = await client.models.Section.create({
    name: 'Test Section - Japanese 101',
    code: 'TEST123',
    description: 'E2E test section'
  });
  
  // Create unit
  const unit = await client.models.Unit.create({
    name: 'Test Unit - Basic Vocabulary',
    description: 'Unit for E2E testing',
    status: 'PUBLISHED'
  });
  
  // Create words
  for (const word of testWords) {
    const newWord = await client.models.Word.create(word);
    // Link word to unit
    await client.models.UnitWord.create({
      unitID: unit.data.id,
      wordID: newWord.data.id
    });
  }
  
  console.log('Seed data created successfully');
}

seedE2EData();
```

Run with: `npm run seed:e2e` (add to package.json)

---

## Test Execution Plan

### Week 1: Lambda Handler Tests
**Goal**: Verify all 25+ Lambda operations work  
**Environment**: Sandbox  
**Status**: ✅ Complete (23/23 tests passing)

### Week 2: GraphQL API Tests
**Goal**: Verify all CRUD operations with Gen 2 client  
**Environment**: Sandbox  
**Tasks**:
- [ ] Write Cypress tests for each model (Unit, Assignment, Grade, etc.)
- [ ] Test ObserveQuery subscriptions
- [ ] Test relationship queries
- [ ] Test pagination
- [ ] Test auth rules

**Deliverable**: `cypress/e2e/gen2-graphql.cy.ts`

### Week 3: WebSocket API Tests
**Goal**: Verify Yjs real-time sync works  
**Environment**: Sandbox  
**Tasks**:
- [ ] Create WebSocket API Gateway
- [ ] Implement $connect, $default, $disconnect handlers
- [ ] Write tests for connection lifecycle
- [ ] Test concurrent editing
- [ ] Test conflict resolution
- [ ] Performance benchmarks

**Deliverable**: `cypress/e2e/websocket-sync.cy.ts`

### Week 4: Frontend Component Tests
**Goal**: Verify all UI components work with Gen 2  
**Environment**: Sandbox  
**Tasks**:
- [ ] Update existing workbook test
- [ ] Test unit editor with Lexical
- [ ] Test dictionary editor
- [ ] Test section management
- [ ] Test AI chat sidebar
- [ ] Test document analysis UI

**Deliverable**: `cypress/e2e/components/*.cy.ts`

### Week 5: Integration & Workflow Tests
**Goal**: Verify complete user workflows  
**Environment**: Staging  
**Tasks**:
- [ ] Test instructor workflow end-to-end
- [ ] Test learner workflow end-to-end
- [ ] Test document analysis workflow
- [ ] Test collaborative editing workflow
- [ ] Performance benchmarks

**Deliverable**: `cypress/e2e/workflows/*.cy.ts`

### Week 6: Production Validation
**Goal**: Smoke tests and monitoring  
**Environment**: Production  
**Tasks**:
- [ ] Deploy to production
- [ ] Run smoke tests (read-only)
- [ ] Monitor CloudWatch logs
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Verify real user traffic works

**Deliverable**: Production deployment validated

---

## Test Metrics & Success Criteria

### Coverage Targets
- [ ] **Unit tests**: 80%+ code coverage (Lambda handlers)
- [ ] **Integration tests**: 90%+ of API operations tested
- [ ] **E2E tests**: 100% of critical user workflows tested

### Performance Targets
- [ ] GraphQL queries: < 500ms average
- [ ] Lambda cold start: < 3 seconds
- [ ] Lambda warm execution: < 1 second
- [ ] WebSocket latency: < 200ms for local, < 500ms cross-region
- [ ] File uploads: > 1 MB/sec throughput

### Reliability Targets
- [ ] **Uptime**: 99.9%+
- [ ] **Error rate**: < 0.1%
- [ ] **Failed mutations**: < 0.01%
- [ ] **WebSocket disconnects**: < 1% per hour

### Scalability Targets
- [ ] **Concurrent users**: 1,000+
- [ ] **Concurrent editors**: 100+ per document
- [ ] **GraphQL queries/sec**: 1,000+
- [ ] **Lambda invocations/sec**: 500+

---

## Testing Tools & Configuration

### Cypress E2E Configuration

Update `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    
    // Environment variables for test users
    env: {
      INSTRUCTOR_USERNAME: 'instructor@test.com',
      INSTRUCTOR_PASSWORD: 'Test123!',
      LEARNER_USERNAME: 'learner@test.com',
      LEARNER_PASSWORD: 'Test123!',
      ADMIN_USERNAME: 'admin@test.com',
      ADMIN_PASSWORD: 'Test123!'
    },
    
    setupNodeEvents(on, config) {
      // Add custom tasks for database seeding
      on('task', {
        async seedDatabase() {
          // Import and run seed script
          return null;
        },
        async clearDatabase() {
          // Clear test data
          return null;
        }
      });
    }
  }
});
```

### Test Scripts (package.json)

```json
{
  "scripts": {
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:e2e:sandbox": "AMPLIFY_ENV=sandbox cypress run",
    "test:e2e:staging": "AMPLIFY_ENV=staging cypress run",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit",
    "seed:e2e": "node scripts/seed-e2e-data.js",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main, staging]

jobs:
  e2e-sandbox:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to sandbox
        run: npx ampx sandbox
      
      - name: Seed test data
        run: npm run seed:e2e
      
      - name: Run E2E tests
        run: npm run test:e2e:sandbox
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: cypress-results
          path: cypress/results
      
      - name: Upload videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-videos
          path: cypress/videos
```

---

## Test Reporting

### Metrics Dashboard

Track test metrics in:
- **GitHub Actions**: Pass/fail rates per commit
- **CloudWatch**: Lambda errors, latency, invocations
- **Amplify Console**: Build failures, deployment status
- **Cypress Dashboard**: Test results, screenshots, videos

### Weekly Test Report Template

```markdown
## E2E Test Report - Week of [Date]

### Summary
- Total tests: X
- Passing: X (XX%)
- Failing: X (XX%)
- Skipped: X

### Failed Tests
1. **Test Name**: Description of failure
   - Environment: Sandbox/Staging/Production
   - Error: Error message
   - Steps to reproduce

### Performance Metrics
- GraphQL avg latency: XXms
- Lambda avg latency: XXms
- WebSocket avg latency: XXms
- File upload avg speed: X MB/s

### Blockers
- Issue 1: Description
- Issue 2: Description

### Next Week Goals
- Goal 1
- Goal 2
```

---

## Known Issues & Workarounds

### Issue 1: DataStore → Gen 2 Client Migration
**Status**: In Progress  
**Impact**: Some components still use DataStore  
**Workaround**: Prioritize high-traffic components first

### Issue 2: WebSocket API Not Yet Created
**Status**: Pending  
**Impact**: Real-time sync not available  
**Workaround**: Use polling for now, migrate to WebSocket in Week 3

### Issue 3: Cypress Selectors Brittle
**Status**: Known  
**Impact**: Tests fail when MUI class names change  
**Workaround**: Use data-testid attributes instead of CSS selectors

---

## Next Steps

1. **Week 2**: Write GraphQL API tests (B1-B7)
2. **Week 3**: Create WebSocket API and tests (D1-D4)
3. **Week 4**: Update frontend component tests (E2-E8)
4. **Week 5**: Run integration/workflow tests in staging (F1-F4)
5. **Week 6**: Deploy to production and monitor (G1-G5)

---

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Amplify Gen 2 Testing](https://docs.amplify.aws/gen2/build-a-backend/data/test/)
- [Jest Integration Tests](https://jestjs.io/docs/getting-started)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Approval**: Ready for implementation  
**Estimated Effort**: 120-160 hours over 6 weeks  
**Team Size**: 2-3 engineers
