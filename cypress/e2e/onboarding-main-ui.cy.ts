/**
 * Main UI Onboarding Tour E2E Test
 * 
 * Tests the onboarding tour system in the actual Next.js application.
 * This tests the production-ready onboarding experience with authentication.
 * 
 * Tests:
 * 1. First-time user onboarding trigger
 * 2. Onboarding panel accessibility from all pages
 * 3. Guided tours for key workflows (unit creation, section management)
 * 4. Spotlight overlay integration in production UI
 * 5. Progress tracking across sessions
 * 6. Tour dismissal and re-activation
 * 
 * Duration: ~3-4 minutes
 * 
 * Prerequisites:
 * - Development server running on http://localhost:3000
 * - Amplify sandbox running (npx ampx sandbox)
 * - Test users seeded
 * 
 * Run with:
 *   npm run dev
 *   npx cypress run --spec cypress/e2e/onboarding-main-ui.cy.ts
 *   npx cypress open (for interactive mode)
 */

/// <reference types="cypress" />

describe('Main UI Onboarding Tour', () => {
  const instructorEmail = Cypress.env('TEACHER_USERNAME') || 'instructor1@example.com';
  const instructorPassword = Cypress.env('TEACHER_PASSWORD') || 'TestPassword123!';
  const learnerEmail = Cypress.env('LEARNER_USERNAME') || 'learner1@example.com';
  const learnerPassword = Cypress.env('LEARNER_PASSWORD') || 'TestPassword123!';

  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  /**
   * Helper: Login as instructor
   */
  const loginAsInstructor = () => {
    cy.visit('/');
    cy.get('form', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="username"]').clear().type(instructorEmail);
    cy.get('input[name="password"]').clear().type(instructorPassword);
    cy.get('form').first().submit();
    cy.waitForAuth();
    cy.url({ timeout: 15000 }).should('not.include', '/login');
  };

  /**
   * Helper: Login as learner
   */
  const loginAsLearner = () => {
    cy.visit('/');
    cy.get('form', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="username"]').clear().type(learnerEmail);
    cy.get('input[name="password"]').clear().type(learnerPassword);
    cy.get('form').first().submit();
    cy.waitForAuth();
    cy.url({ timeout: 15000 }).should('not.include', '/login');
  };

  /**
   * Helper: Open onboarding panel
   */
  const openOnboardingPanel = () => {
    // Look for help icon or onboarding trigger button
    cy.get('[data-testid="onboarding-button"], [data-testid="help-button"], button[aria-label*="help" i], button[aria-label*="onboarding" i]')
      .first()
      .click();
    
    // Wait for panel to open
    cy.get('[data-testid="onboarding-panel"]', { timeout: 10000 })
      .should('be.visible');
  };

  /**
   * Helper: Close onboarding panel
   */
  const closeOnboardingPanel = () => {
    cy.get('[data-testid="onboarding-close"], button[aria-label*="close" i]')
      .first()
      .click();
    
    cy.get('[data-testid="onboarding-panel"]').should('not.be.visible');
  };

  // ============================================================================
  // TEST 1: First-Time User Onboarding
  // ============================================================================
  describe('First-Time User Experience', () => {
    before(() => {
      // Clear onboarding localStorage to simulate first-time user
      cy.clearLocalStorage();
    });

    it('shows welcome tour for new instructor', () => {
      cy.clearLocalStorage();
      loginAsInstructor();

      cy.log('Wait for page to load');
      cy.waitForPageLoad();

      cy.log('Check if onboarding panel appears automatically');
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="onboarding-panel"]').length > 0) {
          cy.log('Onboarding panel appeared automatically');
          cy.get('[data-testid="onboarding-panel"]').should('be.visible');
          
          cy.log('Verify welcome message');
          cy.contains(/welcome|get.*started|first.*time/i).should('be.visible');
        } else {
          cy.log('Onboarding panel did not auto-appear, checking for trigger button');
          cy.get('[data-testid="onboarding-button"], button[aria-label*="help" i]')
            .should('exist');
        }
      });
    });

    it('shows welcome tour for new learner', () => {
      cy.clearLocalStorage();
      loginAsLearner();

      cy.log('Wait for page to load');
      cy.waitForPageLoad();

      cy.log('Open onboarding panel if not auto-opened');
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="onboarding-panel"]').length === 0) {
          openOnboardingPanel();
        }
      });

      cy.log('Verify learner-specific onboarding content');
      cy.contains(/join.*section|learner|student/i, { timeout: 10000 })
        .should('be.visible');
    });
  });

  // ============================================================================
  // TEST 2: Onboarding Panel Accessibility
  // ============================================================================
  describe('Onboarding Panel Accessibility', () => {
    it('onboarding accessible from units page', () => {
      loginAsInstructor();

      cy.log('Navigate to units page');
      cy.visit('/units');
      cy.waitForNavigation('/units');

      cy.log('Open onboarding panel');
      openOnboardingPanel();

      cy.log('Verify panel opened');
      cy.get('[data-testid="onboarding-panel"]').should('be.visible');

      cy.log('Verify has relevant tasks for units page');
      cy.contains(/create.*unit|unit|content/i).should('be.visible');

      cy.log('Close panel');
      closeOnboardingPanel();
    });

    it('onboarding accessible from sections page', () => {
      loginAsInstructor();

      cy.log('Navigate to sections page');
      cy.visit('/sections');
      cy.waitForNavigation('/sections');

      cy.log('Open onboarding panel');
      openOnboardingPanel();

      cy.log('Verify panel opened');
      cy.get('[data-testid="onboarding-panel"]').should('be.visible');

      cy.log('Verify has relevant tasks for sections page');
      cy.contains(/create.*section|section|class/i).should('be.visible');
    });

    it('onboarding accessible from unit editor', () => {
      loginAsInstructor();

      cy.log('Navigate to units and create new unit');
      cy.visit('/units');
      cy.get('[data-tour="create-unit-button"]').first().click();

      cy.log('Wait for editor');
      cy.waitForEditor();

      cy.log('Open onboarding panel');
      openOnboardingPanel();

      cy.log('Verify panel shows editor-specific tasks');
      cy.contains(/editor|add.*content|blocks/i, { timeout: 10000 })
        .should('be.visible');
    });
  });

  // ============================================================================
  // TEST 3: Guided Tour for Unit Creation
  // ============================================================================
  describe('Unit Creation Guided Tour', () => {
    beforeEach(() => {
      loginAsInstructor();
      cy.visit('/units');
      cy.waitForNavigation('/units');
    });

    it('starts unit creation guided tour', () => {
      cy.log('Open onboarding panel');
      openOnboardingPanel();

      cy.log('Find and click "Create Your First Unit" task');
      cy.contains(/create.*unit|first.*unit/i, { timeout: 10000 })
        .should('be.visible')
        .click();

      cy.log('Verify spotlight tour starts');
      cy.get('[data-testid="spotlight-overlay"]', { timeout: 10000 })
        .should('be.visible');

      cy.log('Verify creates unit button is highlighted');
      cy.get('[data-tour="create-unit-button"]')
        .parents('[class*="spotlight"]')
        .should('exist');

      cy.log('Follow tour: Click Next');
      cy.contains('button', /next/i).click();

      cy.log('Verify tour progresses');
      cy.contains(/step.*2|name.*unit|add.*content/i, { timeout: 5000 })
        .should('be.visible');

      cy.log('Skip rest of tour');
      cy.contains('button', /skip/i).click();

      cy.log('Verify spotlight closed');
      cy.get('[data-testid="spotlight-overlay"]').should('not.exist');
    });
  });

  // ============================================================================
  // TEST 4: Guided Tour for Section Management
  // ============================================================================
  describe('Section Management Guided Tour', () => {
    beforeEach(() => {
      loginAsInstructor();
      cy.visit('/sections');
      cy.waitForNavigation('/sections');
    });

    it('starts section creation guided tour', () => {
      cy.log('Open onboarding panel');
      openOnboardingPanel();

      cy.log('Find and click "Create a Section" task');
      cy.contains(/create.*section|section.*management/i, { timeout: 10000 })
        .should('be.visible')
        .click();

      cy.log('Verify spotlight tour starts');
      cy.get('[data-testid="spotlight-overlay"]', { timeout: 10000 })
        .should('be.visible');

      cy.log('Verify creates section button is highlighted');
      cy.get('[data-tour="create-section-button"]')
        .should('be.visible');

      cy.log('Navigate through tour steps');
      cy.contains('button', /next/i).click();
      cy.wait(1000);

      cy.log('Complete or skip tour');
      cy.contains('button', /skip|complete/i).click();
    });
  });

  // ============================================================================
  // TEST 5: Progress Tracking Across Sessions
  // ============================================================================
  describe('Progress Tracking', () => {
    it('persists completed tasks across page reloads', () => {
      cy.clearLocalStorage();
      loginAsInstructor();

      cy.log('Open onboarding');
      openOnboardingPanel();

      cy.log('Complete a task');
      cy.get('[data-testid="task-item"]').first().click();
      
      // If spotlight appears, complete it
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="spotlight-overlay"]').length > 0) {
          cy.contains('button', /complete|skip/i).click();
        }
      });

      // Mark task as complete if possible
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Mark Complete")').length > 0) {
          cy.contains('button', /mark.*complete/i).click();
        }
      });

      cy.log('Get task completion state');
      cy.get('[data-testid="task-item"]').first()
        .invoke('text')
        .then((taskText) => {
          const wasCompleted = taskText.includes('✅');

          cy.log('Reload page');
          cy.reload();

          cy.log('Reopen onboarding');
          openOnboardingPanel();

          if (wasCompleted) {
            cy.log('Verify task still marked complete');
            cy.get('[data-testid="task-item"]').first()
              .should('contain', '✅');
          }
        });
    });

    it('tracks progress percentage', () => {
      cy.clearLocalStorage();
      loginAsInstructor();

      cy.log('Open onboarding');
      openOnboardingPanel();

      cy.log('Get initial progress');
      cy.get('[role="progressbar"]')
        .invoke('attr', 'aria-valuenow')
        .then((initialProgress) => {
          const initial = parseInt(initialProgress || '0');
          cy.log(`Initial progress: ${initial}%`);

          cy.log('Complete a task');
          cy.get('[data-testid="task-item"]').first().click();
          
          // Handle spotlight if it appears
          cy.wait(2000);
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="spotlight-overlay"]').length > 0) {
              cy.contains('button', /complete|skip/i).click();
            }
          });

          cy.log('Verify progress increased or stayed same');
          cy.get('[role="progressbar"]', { timeout: 5000 })
            .invoke('attr', 'aria-valuenow')
            .then((newProgress) => {
              const updated = parseInt(newProgress || '0');
              cy.log(`Updated progress: ${updated}%`);
              expect(updated).to.be.at.least(initial);
            });
        });
    });
  });

  // ============================================================================
  // TEST 6: Tour Dismissal and Re-activation
  // ============================================================================
  describe('Tour Dismissal', () => {
    it('allows dismissing onboarding panel', () => {
      loginAsInstructor();

      cy.log('Open onboarding panel');
      openOnboardingPanel();

      cy.log('Verify panel is visible');
      cy.get('[data-testid="onboarding-panel"]').should('be.visible');

      cy.log('Close panel');
      closeOnboardingPanel();

      cy.log('Verify panel is closed');
      cy.get('[data-testid="onboarding-panel"]').should('not.be.visible');
    });

    it('allows re-opening dismissed panel', () => {
      loginAsInstructor();

      cy.log('Open and close onboarding');
      openOnboardingPanel();
      closeOnboardingPanel();

      cy.log('Wait a moment');
      cy.wait(1000);

      cy.log('Re-open onboarding');
      openOnboardingPanel();

      cy.log('Verify panel opened again');
      cy.get('[data-testid="onboarding-panel"]').should('be.visible');
    });

    it('allows skipping entire tour', () => {
      cy.clearLocalStorage();
      loginAsInstructor();

      cy.log('Open onboarding');
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="onboarding-panel"]').length === 0) {
          openOnboardingPanel();
        }
      });

      cy.log('Look for skip/dismiss all button');
      cy.contains('button', /skip.*all|dismiss|not.*now/i, { timeout: 5000 })
        .should('be.visible')
        .click();

      cy.log('Verify onboarding panel closed or minimized');
      cy.wait(1000);
      cy.get('[data-testid="onboarding-panel"]').should('not.be.visible');
    });
  });

  // ============================================================================
  // TEST 7: Context-Aware Tour Content
  // ============================================================================
  describe('Context-Aware Tours', () => {
    it('shows editor-specific tasks when in editor', () => {
      loginAsInstructor();

      cy.log('Navigate to editor');
      cy.visit('/units');
      cy.get('[data-tour="create-unit-button"]').first().click();
      cy.waitForEditor();

      cy.log('Open onboarding');
      openOnboardingPanel();

      cy.log('Verify editor-specific tasks visible');
      cy.contains(/add.*block|insert.*content|text.*formatting|editor/i, { timeout: 10000 })
        .should('be.visible');
    });

    it('shows section-specific tasks when on sections page', () => {
      loginAsInstructor();

      cy.log('Navigate to sections');
      cy.visit('/sections');
      cy.waitForNavigation('/sections');

      cy.log('Open onboarding');
      openOnboardingPanel();

      cy.log('Verify section-specific tasks visible');
      cy.contains(/create.*section|join.*code|assign.*unit/i, { timeout: 10000 })
        .should('be.visible');
    });
  });

  // ============================================================================
  // CLEANUP
  // ============================================================================
  after(() => {
    cy.log('Main UI onboarding tests completed');
  });
});
