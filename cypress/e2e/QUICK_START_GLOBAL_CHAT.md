# Quick Start: Global Chat E2E Tests

## Prerequisites (One-Time Setup)

1. **Start Amplify Sandbox**
   ```bash
   npx ampx sandbox --stream-function-logs
   ```
   Keep this running in a dedicated terminal.

2. **Seed Test Users** (if not already done)
   ```bash
   npx ampx sandbox seed
   ```
   This creates:
   - `instructor1@example.com / TestPassword123!`
   - `student1@example.com / TestPassword123!`

3. **Start Dev Server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 to verify it's running.

4. **Configure Environment Variables**
   
   Create or edit `cypress.env.json` in project root:
   ```json
   {
     "TEACHER_USERNAME": "instructor1@example.com",
     "TEACHER_PASSWORD": "TestPassword123!",
     "LEARNER_USERNAME": "student1@example.com",
     "LEARNER_PASSWORD": "TestPassword123!"
   }
   ```

## Running Tests

### Option 1: Interactive Mode (Recommended for Development)

```bash
npx cypress open
```

Then:
1. Click "E2E Testing"
2. Select your browser (Chrome recommended)
3. Find and click "global-chat.cy.ts"
4. Watch tests run in real-time

**Pros**: Visual feedback, can pause/debug, easy to iterate  
**Cons**: Slower than headless

### Option 2: Headless Mode (Recommended for CI)

```bash
npx cypress run --spec "cypress/e2e/global-chat.cy.ts"
```

**Pros**: Fast, automated, good for CI/CD  
**Cons**: No visual feedback (but includes videos/screenshots on failure)

### Option 3: Run Specific Test Suite

```bash
# Run only "Chat Opening and Closing" tests
npx cypress run --spec "cypress/e2e/global-chat.cy.ts" --grep "Chat Opening and Closing"

# Run only accessibility tests
npx cypress run --spec "cypress/e2e/global-chat.cy.ts" --grep "Accessibility"
```

## Expected Results

✅ **All tests should pass** (if prerequisites met)

**Total Tests**: ~60 test cases  
**Duration**: 10-15 minutes  
**Success Rate**: 100% (when environment is properly configured)

### Sample Output (Headless)
```
  Global Chat Functionality

    Global Chat Button Visibility
      ✓ should display chat button on home page (2145ms)
      ✓ should display chat button on sections page (1823ms)
      ✓ should display chat button on units page (1756ms)
      ✓ should display chat button on profile page (1689ms)
      ✓ should display chat button as learner (2034ms)

    Chat Opening and Closing
      ✓ should open chat drawer when button is clicked (1234ms)
      ✓ should close chat drawer when close button is clicked (987ms)
      ✓ should hide global chat button when chat is open (1102ms)
      ✓ should show global chat button when chat is closed (1045ms)

    ... (more tests)

  60 passing (12m 34s)
```

## Troubleshooting

### Tests Fail Immediately with "Cannot find cy"
**Cause**: Cypress not installed or test file not found  
**Fix**: Run `npm install` and verify file exists

### Tests Fail at Login
**Cause**: Test users don't exist or credentials wrong  
**Fix**: 
1. Run `npx ampx sandbox seed` again
2. Check `cypress.env.json` has correct credentials
3. Verify sandbox is running

### Chat Messages Don't Send
**Cause**: OpenAI API key not configured  
**Fix**:
1. Check Amplify sandbox has OpenAI key in SSM
2. Restart sandbox after adding key
3. Check browser console for errors

### Chat Button Not Visible
**Cause**: Application not fully loaded or CSS issue  
**Fix**:
1. Increase wait times in test (cy.wait values)
2. Check browser console for errors
3. Verify ChatContext is mounted in _app.jsx

### Tests Pass Locally But Fail in CI
**Cause**: Environment differences or race conditions  
**Fix**:
1. Check CI has same Node.js version
2. Verify all environment variables set in CI
3. Increase timeout values for slower CI machines

## Test File Locations

- **Main Test**: `cypress/e2e/global-chat.cy.ts`
- **Documentation**: `cypress/e2e/GLOBAL_CHAT_E2E_README.md`
- **Custom Commands**: `cypress/support/commands.ts`
- **Test Plan**: `docs/E2E_TEST_PLAN.md` (Section I)

## What's Being Tested?

1. **UI Functionality**
   - Chat button appears everywhere
   - Drawer opens/closes correctly
   - Keyboard shortcuts work

2. **State Management**
   - Chat persists across navigation
   - Context changes per page
   - Messages saved to database

3. **AI Integration**
   - Messages send successfully
   - Responses stream correctly
   - Tools execute properly

4. **Accessibility**
   - ARIA labels present
   - Keyboard navigation works
   - Focus management correct

5. **Error Handling**
   - Empty messages ignored
   - Long messages handled
   - Network failures graceful

## Next Steps After Tests Pass

1. **Review Test Coverage**: Check `GLOBAL_CHAT_E2E_README.md` for detailed coverage
2. **Add Custom Tests**: Use existing helpers to add project-specific scenarios
3. **Integrate into CI**: Add to GitHub Actions workflow
4. **Monitor in Production**: Set up Cypress Dashboard for production monitoring

## Getting Help

- **Test Documentation**: `cypress/e2e/GLOBAL_CHAT_E2E_README.md`
- **Implementation Plan**: `docs/GLOBAL_CHAT_INTEGRATION_PLAN.md`
- **Cypress Docs**: https://docs.cypress.io
- **Project Issues**: Check repository issues for known problems

## Quick Commands Cheat Sheet

```bash
# Full test suite (headless)
npx cypress run --spec "cypress/e2e/global-chat.cy.ts"

# Interactive mode
npx cypress open

# Specific test suite
npx cypress run --spec "cypress/e2e/global-chat.cy.ts" --grep "Accessibility"

# With video recording
npx cypress run --spec "cypress/e2e/global-chat.cy.ts" --record --key YOUR_KEY

# Headed mode (see browser)
npx cypress run --spec "cypress/e2e/global-chat.cy.ts" --headed

# Debug mode (slow with extra logging)
npx cypress run --spec "cypress/e2e/global-chat.cy.ts" --headed --no-exit
```

## Success Criteria

✅ All 60 tests passing  
✅ No console errors  
✅ Chat messages render correctly  
✅ AI responses received  
✅ Context changes per page  
✅ Navigation prompts work  
✅ Accessibility checks pass  

Ready to run? Start with:
```bash
npx cypress open
```
