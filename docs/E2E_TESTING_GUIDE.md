# E2E Testing Guide

**Last Updated**: March 9, 2026  
**Status**: Active

---

## Overview

Our E2E (End-to-End) tests use **real functionality**, not mocks. They exercise the actual application with a real Amplify sandbox backend, real database operations, real S3 uploads, and real AI interactions.

### Philosophy: Real Tests, Sandbox Environment

- ✅ **Real Application Code**: Actual Next.js app, real React components
- ✅ **Real Backend**: Amplify sandbox with DynamoDB, Lambda, S3
- ✅ **Real AI**: Actual OpenAI API calls (using sandbox API keys)
- ✅ **Real Auth**: Cognito authentication with test users
- ❌ **NO Mocks**: E2E tests should not mock any functionality

---

## Quick Start

### 1. Start Amplify Sandbox

```bash
# Terminal 1: Start sandbox (keeps running)
npx ampx sandbox --stream-function-logs

# Wait for:
# ✓ Amplify sandbox setup successfully
# ✓ Backend resources deployed
```

### 2. Seed Test Users

```bash
# Terminal 2: One-time setup (or after sandbox delete)
npx ampx sandbox seed

# This creates test users:
# - instructor1@example.com / TestPassword123!
# - instructor2@example.com / TestPassword123!
# - student1@example.com / TestPassword123!
# - student2@example.com / TestPassword123!
# - student3@example.com / TestPassword123!
# - student4@example.com / TestPassword123!
# - student5@example.com / TestPassword123!
```

### 3. Start Dev Server

```bash
# Terminal 3: Start Next.js (keeps running)
npm run dev

# Wait for:
# ✓ Ready on http://localhost:3000
```

### 4. Run E2E Tests

```bash
# Terminal 4: Run tests
npm run cypress:run

# Or interactive mode:
npm run cypress:open
```

---

## Test User Accounts

### Provided by Sandbox Seed

| Email | Password | Role | Groups |
|-------|----------|------|--------|
| instructor1@example.com | TestPassword123! | Instructor | Instructors, Admins |
| instructor2@example.com | TestPassword123! | Instructor | Instructors |
| student1@example.com | TestPassword123! | Learner | Learners |
| student2@example.com | TestPassword123! | Learner | Learners |
| student3@example.com | TestPassword123! | Learner | Learners |
| student4@example.com | TestPassword123! | Learner | Learners |
| student5@example.com | TestPassword123! | Learner | Learners |

### Used in Tests

- **Instructor Tests**: Use `instructor1@example.com`
- **Learner Tests**: Use `student1@example.com`
- **Admin Tests**: Use `instructor1@example.com` (has Admin group)

---

## E2E Test Suites

### 1. Instructor Workflow (`instructor-workflow.cy.ts`)

**What it tests**:
- ✅ Unit creation
- ✅ Chatbot-driven section creation
- ✅ Document upload and analysis
- ✅ Vocabulary and question import
- ✅ Search functionality
- ✅ All block types (Meaning Association, Custom Answer, Vocabulary, Quiz, Graded Answer)
- ✅ Unit publishing
- ✅ Grade review and feedback

**Run**:
```bash
npx cypress run --spec "cypress/e2e/instructor-workflow.cy.ts"
```

**Duration**: ~5-8 minutes

**Prerequisites**:
- Sandbox running
- Test users seeded
- Dev server running

### 2. Learner Workflow (`learner-workflow.cy.ts`)

**What it tests**:
- ✅ Section joining with code
- ✅ Workbook navigation
- ✅ Timer functionality
- ✅ Completing all exercise types
- ✅ AI-graded submissions
- ✅ Grade submission
- ✅ Grade viewing

**Run**:
```bash
# Run AFTER instructor-workflow to have test data
npx cypress run --spec "cypress/e2e/instructor-workflow.cy.ts,cypress/e2e/learner-workflow.cy.ts"
```

**Duration**: ~4-6 minutes

**Prerequisites**:
- Sandbox running with data from instructor workflow
- Test users seeded
- Dev server running

### 3. Onboarding System (`onboarding-spec.cy.ts`)

**What it tests**:
- ✅ Storybook onboarding tutorials
- ✅ Persona selection
- ✅ Progress tracking
- ✅ localStorage persistence

**Run**:
```bash
# Requires Storybook running instead of dev server
npm run storybook  # Terminal 3
npx cypress run --spec "cypress/e2e/onboarding-spec.cy.ts"
```

### 4. Workbook Flow (`workbook-spec.cy.ts`)

**What it tests**:
- ✅ Basic workbook completion
- ✅ Drag & drop exercises
- ✅ Multiple choice questions

**Run**:
```bash
npx cypress run --spec "cypress/e2e/workbook-spec.cy.ts"
```

---

## Sandbox Management

### View Sandbox Logs

```bash
# Sandbox already shows logs when started with --stream-function-logs
# To view specific logs:
npx ampx sandbox logs --function <function-name>
```

### Reset Sandbox Data

```bash
# Complete reset (deletes everything)
npx ampx sandbox delete

# Restart clean sandbox
npx ampx sandbox --stream-function-logs

# Re-seed test users
npx ampx sandbox seed
```

### Sandbox Secrets

Some tests may require API keys (OpenAI, etc.):

```bash
# Set secrets in sandbox
npx ampx sandbox secret set OPENAI_API_KEY
# Enter your API key when prompted
```

---

## Test Data Strategy

### Approach: Sandbox-First

1. **Sandbox Seed** creates base test users
2. **Tests create their own data** during execution
3. **Tests clean up after themselves** (optional)
4. **Sandbox reset** for complete cleanup

### Data Created by Tests

**instructor-workflow.cy.ts** creates:
- 1 Unit ("E2E Test Unit - Photosynthesis")
- 1 Section ("E2E Test Section", code: E2ETEST)
- 1 Assignment (Unit → Section)
- ~5 Vocabulary words (imported from document)
- ~3 Questions (imported from document)
- 1 PDF file upload
- 5 Custom blocks in unit

**learner-workflow.cy.ts** creates:
- 1 Grade record (student submission)
- Answer data for each block
- Timer records

### Cleanup Strategy

**Option 1**: Don't clean up - faster, accumulates data
```typescript
// No cleanup - data persists in sandbox
```

**Option 2**: Clean up in `after()` hook
```typescript
after(() => {
  // Delete test data
  cy.request('DELETE', '/api/test-cleanup');
});
```

**Option 3**: Reset sandbox between runs
```bash
# Manual reset
npx ampx sandbox delete && npx ampx sandbox
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, staging]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start Amplify Sandbox
        run: npx ampx sandbox &
        env:
          # Use CI-specific AWS credentials
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      
      - name: Wait for sandbox
        run: npx wait-on http://localhost:3000
        timeout-minutes: 5
      
      - name: Seed test users
        run: npx ampx sandbox seed
      
      - name: Start dev server
        run: npm run dev &
      
      - name: Wait for dev server
        run: npx wait-on http://localhost:3000
      
      - name: Run E2E tests
        uses: cypress-io/github-action@v5
        with:
          wait-on: 'http://localhost:3000'
          browser: chrome
          spec: |
            cypress/e2e/instructor-workflow.cy.ts
            cypress/e2e/learner-workflow.cy.ts
        env:
          TEACHER_USERNAME: instructor1@example.com
          TEACHER_PASSWORD: TestPassword123!
          LEARNER_USERNAME: student1@example.com
          LEARNER_PASSWORD: TestPassword123!
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
      
      - name: Cleanup sandbox
        if: always()
        run: npx ampx sandbox delete
```

---

## Debugging E2E Tests

### Interactive Mode

```bash
# Best for development
npm run cypress:open

# 1. Select E2E Testing
# 2. Choose browser (Chrome recommended)
# 3. Select spec file
# 4. Watch test execute in real browser
# 5. Use Chrome DevTools to debug
```

### View Sandbox Logs

```bash
# Sandbox terminal shows Lambda logs
# Look for:
# - GraphQL operations
# - Lambda function invocations
# - DynamoDB queries
# - S3 uploads
# - OpenAI API calls
```

### Common Issues

#### Issue: "User not found"
**Cause**: Sandbox not seeded  
**Solution**: Run `npx ampx sandbox seed`

#### Issue: "Network error"
**Cause**: Sandbox not running  
**Solution**: Start sandbox in Terminal 1

#### Issue: "Timeout waiting for element"
**Cause**: App not fully loaded or wrong selector  
**Solution**: 
- Check dev server is running
- Verify selector with `cy.get('[data-testid="..."]')`
- Increase timeout: `cy.get('...', { timeout: 10000 })`

#### Issue: "S3 upload failed"
**Cause**: Sandbox S3 bucket not configured  
**Solution**: Check `amplify_outputs.json` has storage config

---

## Best Practices

### ✅ DO:
- Use `data-testid` attributes for reliable selectors
- Use explicit waits: `cy.wait(2000)` or `{ timeout: 10000 }`
- Test real user workflows end-to-end
- Use sandbox for isolated test environment
- Clean up critical test data in `after()` hooks
- Run tests in sequence for dependent data

### ❌ DON'T:
- Mock API responses in E2E tests
- Use brittle CSS selectors (`.MuiButton-root`)
- Hardcode IDs from specific test runs
- Run tests in parallel if they share data
- Test in production environment
- Skip sandbox seed setup

---

## Performance Optimization

### Sandbox Startup Time

First run: ~2-3 minutes  
Subsequent runs: ~30 seconds (if sandbox already running)

**Tip**: Keep sandbox running during development

### Test Execution Time

| Test Suite | Duration | Parallelizable |
|------------|----------|----------------|
| instructor-workflow | 5-8 min | No (creates data) |
| learner-workflow | 4-6 min | No (uses instructor data) |
| onboarding-spec | 2-3 min | Yes |
| workbook-spec | 3-4 min | No |

**Total Sequential**: ~15-20 minutes

### Parallel Execution

For independent tests:
```bash
# Run in parallel (if tests don't share data)
npx cypress run --parallel --record --key <key>
```

---

## Resources

- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Amplify Sandbox Docs](https://docs.amplify.aws/gen2/deploy-and-host/sandbox-environments/)
- [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md) - Original Gen 2 migration plan
- [TEST_COVERAGE_PLAN.md](./TEST_COVERAGE_PLAN.md) - Overall testing strategy

---

## Summary

**E2E tests use real functionality in a sandbox environment:**

1. ✅ Start sandbox: `npx ampx sandbox --stream-function-logs`
2. ✅ Seed users: `npx ampx sandbox seed`
3. ✅ Start app: `npm run dev`
4. ✅ Run tests: `npm run cypress:run`

**No mocking. Real code. Real data. Sandbox isolation.**
