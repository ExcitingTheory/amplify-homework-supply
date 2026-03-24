/**
 * Storybook Onboarding Tour E2E Test
 * 
 * Tests the interactive onboarding system in Storybook isolation.
 * This allows users without credentials to try the onboarding experience.
 * 
 * Tests:
 * 1. Persona selection (Instructor, Learner, Developer)
 * 2. Tutorial mode with interactive demos
 * 3. Quiz mode navigation
 * 4. Task completion tracking
 * 5. Mode switching (Tutorial ↔ Quiz)
 * 6. Spotlight tour navigation
 * 7. Progress persistence
 * 
 * Duration: ~2-3 minutes
 * 
 * Prerequisites:
 * - Storybook running on http://localhost:6006
 * 
 * Run with:
 *   npm run storybook
 *   npx cypress run --spec cypress/e2e/onboarding-storybook.cy.ts
 *   npx cypress open (for interactive mode)
 */

/// <reference types="cypress" />

describe('Storybook Onboarding Tour', () => {
  const STORYBOOK_URL = 'http://localhost:6006';

  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  before(() => {
    // Clear any previous onboarding progress
    cy.clearLocalStorage();
  });

  /**
   * Helper: Navigate to specific story
   */
  const visitStory = (storyPath: string) => {
    // Use id= parameter and viewMode=story for proper story rendering (not docs)
    cy.visit(`${STORYBOOK_URL}/iframe.html?id=${storyPath}&viewMode=story`);
    // Wait for story to render
    cy.wait(1500);
  };

  /**
   * Helper: Open onboarding panel (if not already open)
   */
  const openOnboardingPanel = () => {
    // Look for the onboarding panel floating button or trigger
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="onboarding-panel"]').length === 0) {
        // Panel not visible, click trigger button
        cy.get('[data-testid="onboarding-trigger"], button:has-text("Help"), button:has-text("Onboarding")')
          .first()
          .click();
      }
    });
  };

  // ============================================================================
  // TEST 1: Spotlight Overlay Component (Isolated)
  // ============================================================================
  describe('Spotlight Overlay Component', () => {
    it('renders tutorial mode correctly', () => {
      visitStory('onboarding-spotlight-overlay--tutorial-mode');

      cy.log('Verify spotlight overlay NOT visible initially');
      cy.get('[data-testid="spotlight-overlay"]').should('not.exist');

      cy.log('Click "Start Tutorial" button');
      cy.contains('button', /start.*tutorial/i).click();

      cy.log('Verify spotlight overlay appears');
      cy.get('[data-testid="spotlight-overlay"]', { timeout: 10000 })
        .should('be.visible');

      cy.log('Verify tutorial mode indicator');
      cy.contains(/tutorial.*mode|📖.*tutorial/i).should('be.visible');

      cy.log('Verify step counter');
      cy.contains(/step.*1.*of/i).should('be.visible');

      cy.log('Click Next button');
      cy.contains('button', /next/i).click();

      cy.log('Verify step advanced to 2');
      cy.contains(/step.*2.*of/i).should('be.visible');

      cy.log('Click Skip button');
      cy.contains('button', /skip/i).click();

      cy.log('Verify overlay closed');
      cy.get('[data-testid="spotlight-overlay"]').should('not.exist');
    });

    it('renders quiz mode correctly', () => {
      visitStory('onboarding-spotlight-overlay--quiz-mode');

      cy.log('Click "Start Quiz" button');
      cy.contains('button', /start.*quiz/i).click();

      cy.log('Verify spotlight overlay appears');
      cy.get('[data-testid="spotlight-overlay"]', { timeout: 10000 })
        .should('be.visible');

      cy.log('Verify quiz mode indicator');
      cy.contains(/quiz.*mode|🎯.*quiz/i).should('be.visible');

      cy.log('Verify minimal guidance (quiz mode has less description)');
      // Quiz mode should have shorter descriptions
      cy.get('[data-testid="spotlight-overlay"]')
        .find('p')
        .should('exist');

      cy.log('Navigate through quiz steps');
      cy.contains('button', /next/i).click();
      cy.contains(/step.*2/i).should('be.visible');
    });
  });

  // ============================================================================
  // TEST 2: Onboarding Panel with Persona Selection
  // ============================================================================
  describe('Onboarding Panel - Persona Selection', () => {
    it('allows selecting instructor persona', () => {
      visitStory('getting-started-onboarding--persona-selection');

      cy.log('Verify welcome message appears');
      cy.contains(/welcome.*to.*homework.*supply/i, { timeout: 10000 })
        .should('be.visible');

      cy.log('Verify persona cards are visible');
      // Scroll to ensure cards are in viewport and wait for render
      cy.contains(/instructor/i).scrollIntoView().should('be.visible');
      cy.contains(/learner/i).should('exist');
      cy.contains(/developer/i).should('exist');

      cy.log('Click Instructor persona');
      // Use force:true in case card is covered by container
      cy.contains('.MuiCard-root', /instructor/i).scrollIntoView().click({ force: true });

      cy.log('Verify instructor tasks appear');
      cy.contains(/getting.*started|create.*unit|create.*section/i, { timeout: 5000 })
        .should('be.visible');

      cy.log('Verify progress bar appears');
      cy.get('[role="progressbar"]').should('be.visible');

      cy.log('Verify task categories (tabs) appear');
      cy.contains(/getting.*started|content.*creation|class.*management/i)
        .should('be.visible');
    });

    it('allows changing personas', () => {
      visitStory('getting-started-onboarding--persona-selection');

      cy.log('Select Instructor persona');
      cy.contains('.MuiCard-root', /instructor/i).scrollIntoView().click({ force: true });

      cy.log('Wait for persona to load');
      cy.contains(/instructor.*onboarding/i, { timeout: 5000 })
        .should('be.visible');

      cy.log('Click Change Persona button');
      cy.contains('button', /change/i).click();

      cy.log('Verify returned to persona selection');
      cy.contains(/welcome.*to/i).should('be.visible');

      cy.log('Select Learner persona');
      cy.contains('.MuiCard-root', /learner/i).scrollIntoView().click({ force: true });

      cy.log('Verify learner tasks appear');
      cy.contains(/learner.*onboarding|join.*section|complete.*workbook/i, { timeout: 5000 })
        .should('be.visible');
    });

    it('persists persona selection across reloads', () => {
      visitStory('getting-started-onboarding--persona-selection');

      cy.log('Select Developer persona');
      cy.contains('.MuiCard-root', /developer/i).scrollIntoView().click({ force: true });

      cy.log('Wait for developer tasks');
      cy.contains(/developer.*onboarding/i, { timeout: 5000 })
        .should('be.visible');

      cy.log('Reload the page');
      cy.reload();

      cy.log('Verify Developer persona is still selected');
      cy.contains(/developer.*onboarding/i, { timeout: 10000 })
        .should('be.visible');

      cy.log('Verify welcome screen does NOT appear');
      cy.contains(/welcome.*to/i).should('not.exist');
    });
  });

  // ============================================================================
  // TEST 3: Tutorial Mode with Interactive Demos
  // ============================================================================
  describe('Tutorial Mode', () => {
    beforeEach(() => {
      // Clear progress before each tutorial mode test
      cy.clearLocalStorage();
    });

    it('shows interactive tutorial demos', () => {
      visitStory('onboarding-learning-modes--tutorial-mode-example');

      cy.log('Verify tutorial mode indicator');
      cy.contains(/📖.*tutorial.*mode/i).should('be.visible');

      cy.log('Verify interactive demo area exists');
      cy.contains(/try.*it.*here|👇.*try/i).should('be.visible');

      cy.log('Interact with demo component');
      cy.get('input[type="text"]').first().should('be.visible').type('Test Input');

      cy.log('Verify auto-completion detection');
      // Tutorial mode may auto-detect when user completes the task
      cy.contains(/✅|completed|great.*job/i, { timeout: 5000 })
        .should('be.visible');
    });

    it('allows manual task completion', () => {
      visitStory('onboarding-learning-modes--tutorial-mode-example');

      cy.log('Find and click "Mark as Complete" button');
      cy.contains('button', /complete|done|mark.*complete/i)
        .should('be.visible')
        .click();

      cy.log('Verify task marked as completed');
      cy.contains(/✅|completed/i).should('be.visible');
    });
  });

  // ============================================================================
  // TEST 4: Quiz Mode Navigation
  // ============================================================================
  describe('Quiz Mode', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it('navigates to application page for quiz tasks', () => {
      visitStory('onboarding-learning-modes--quiz-mode-example');

      cy.log('Verify quiz mode indicator');
      cy.contains(/🎯.*quiz.*mode/i).should('be.visible');

      cy.log('Verify task has "Start Task" button');
      cy.contains('button', /start.*task|begin|try.*now/i)
        .should('be.visible');

      cy.log('Click Start Task button');
      cy.contains('button', /start.*task|begin|try.*now/i).click();

      cy.log('Verify navigation or modal appears');
      // Quiz mode may open a modal or navigate to a story
      cy.url().should('include', 'onboarding');
    });

    it('does not allow re-starting completed tasks in quiz mode', () => {
      visitStory('onboarding-learning-modes--quiz-mode-example');

      cy.log('Complete a task');
      cy.contains('button', /start.*task/i).first().click();
      
      // Mark as complete (simulated)
      cy.contains('button', /complete/i).click();

      cy.log('Verify completed task shows checkmark');
      cy.contains(/✅/i).should('be.visible');

      cy.log('Verify Start Task button is disabled or hidden');
      cy.get('button').contains(/start.*task/i).should('not.exist');
    });
  });

  // ============================================================================
  // TEST 5: Mode Switching (Tutorial ↔ Quiz)
  // ============================================================================
  describe('Mode Switching', () => {
    it('switches between tutorial and quiz modes', () => {
      visitStory('getting-started-onboarding--persona-selection');

      cy.log('Select Instructor persona');
      cy.contains('.MuiCard-root', /instructor/i).scrollIntoView().click({ force: true });

      cy.log('Verify default mode is Tutorial');
      cy.contains(/tutorial/i).should('have.class', 'MuiChip-colorPrimary');

      cy.log('Click Quiz mode chip');
      cy.contains('.MuiChip-root', /quiz/i).click();

      cy.log('Verify switched to Quiz mode');
      cy.contains(/🎯.*quiz.*mode/i).should('be.visible');
      cy.contains('.MuiChip-root', /quiz/i).should('have.class', 'MuiChip-colorPrimary');

      cy.log('Switch back to Tutorial mode');
      cy.contains('.MuiChip-root', /tutorial/i).click();

      cy.log('Verify switched back to Tutorial mode');
      cy.contains(/📖.*tutorial.*mode/i).should('be.visible');
    });
  });

  // ============================================================================
  // TEST 6: Task Completion Tracking
  // ============================================================================
  describe('Task Completion Tracking', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it('tracks completed tasks and updates progress', () => {
      visitStory('getting-started-onboarding--persona-selection');

      cy.log('Select Instructor persona');
      cy.contains('.MuiCard-root', /instructor/i).scrollIntoView().click({ force: true });

      cy.log('Get initial progress value');
      cy.get('[role="progressbar"]')
        .invoke('attr', 'aria-valuenow')
        .then((initialProgress) => {
          const initial = parseInt(initialProgress || '0');

          cy.log(`Initial progress: ${initial}%`);

          cy.log('Click on first task');
          cy.get('[data-testid="task-item"]').first().click();

          cy.log('Complete the task (if possible in Storybook)');
          // This may trigger a spotlight tour
          cy.contains('button', /complete|done/i, { timeout: 10000 })
            .should('be.visible')
            .click();

          cy.log('Verify progress increased');
          cy.get('[role="progressbar"]')
            .invoke('attr', 'aria-valuenow')
            .then((newProgress) => {
              const updated = parseInt(newProgress || '0');
              expect(updated).to.be.greaterThan(initial);
            });
        });
    });

    it('persists completed tasks in localStorage', () => {
      visitStory('getting-started-onboarding--persona-selection');

      cy.log('Select Instructor persona');
      cy.contains('.MuiCard-root', /instructor/i).scrollIntoView().click({ force: true });

      cy.log('Complete first task');
      cy.get('[data-testid="task-item"]').first().click();
      cy.contains('button', /complete/i).click();

      cy.log('Reload page');
      cy.reload();

      cy.log('Verify task still marked as complete');
      cy.get('[data-testid="task-item"]').first().should('contain', '✅');
    });
  });

  // ============================================================================
  // TEST 7: Spotlight Tour Navigation
  // ============================================================================
  describe('Spotlight Tour Navigation', () => {
    it('navigates through spotlight tour steps', () => {
      visitStory('onboarding-spotlight-overlay--tutorial-mode');

      cy.log('Start tour');
      cy.contains('button', /start/i).click();

      cy.log('Verify first step');
      cy.contains(/step.*1/i).should('be.visible');

      cy.log('Navigate to next step');
      cy.contains('button', /next/i).click();

      cy.log('Verify second step');
      cy.contains(/step.*2/i).should('be.visible');

      cy.log('Navigate back (if possible)');
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Back")').length > 0) {
          cy.contains('button', /back/i).click();
          cy.contains(/step.*1/i).should('be.visible');
        }
      });

      cy.log('Complete tour');
      // Click through all steps
      for (let i = 0; i < 5; i++) {
        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Next")').length > 0) {
            cy.contains('button', /next/i).click();
            cy.wait(500);
          } else if ($body.find('button:contains("Complete")').length > 0) {
            cy.contains('button', /complete/i).click();
            return false; // Break loop
          }
        });
      }

      cy.log('Verify tour closed');
      cy.get('[data-testid="spotlight-overlay"]').should('not.exist');
    });
  });

  // ============================================================================
  // TEST 8: Reset Progress
  // ============================================================================
  describe('Reset Progress', () => {
    it('resets onboarding progress', () => {
      visitStory('getting-started-onboarding--persona-selection');

      cy.log('Select persona and complete a task');
      cy.contains('.MuiCard-root', /instructor/i).scrollIntoView().click({ force: true });
      cy.get('[data-testid="task-item"]').first().click();
      cy.contains('button', /complete/i).click();

      cy.log('Find and click Reset button');
      cy.contains('button', /reset.*progress|clear.*progress/i)
        .should('be.visible')
        .click();

      cy.log('Confirm reset (if confirmation dialog appears)');
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Confirm")').length > 0) {
          cy.contains('button', /confirm|yes/i).click();
        }
      });

      cy.log('Verify returned to persona selection');
      cy.contains(/welcome.*to/i, { timeout: 5000 }).should('be.visible');

      cy.log('Verify progress is reset');
      cy.contains('.MuiCard-root', /instructor/i).scrollIntoView().click({ force: true });
      cy.get('[role="progressbar"]')
        .invoke('attr', 'aria-valuenow')
        .should('eq', '0');
    });
  });

  // ============================================================================
  // CLEANUP
  // ============================================================================
  after(() => {
    cy.log('Onboarding Storybook tests completed');
  });
});
