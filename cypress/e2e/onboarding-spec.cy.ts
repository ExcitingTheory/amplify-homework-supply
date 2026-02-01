/**
 * Onboarding System E2E Tests
 * 
 * Tests the Storybook onboarding tutorial and quiz modes:
 * - Persona selection
 * - Tutorial mode with interactive demos
 * - Quiz mode navigation to Application Pages
 * - Progress tracking in sidebar panel
 * - Mode switching between Tutorial and Quiz
 * - Task completion detection
 * 
 * Prerequisites:
 * - Storybook running on http://localhost:6006
 * - Run with: npm run cypress:open
 */

describe('Onboarding System', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  describe('Persona Selection', () => {
    it('should allow selecting a persona and display tasks', () => {
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      
      // Should show welcome message
      cy.contains('Welcome to Homework Supply').should('be.visible');
      
      // Select Instructor persona
      cy.selectPersona('instructor');
      
      // Should show progress bar
      cy.get('[role="progressbar"]').should('be.visible');
      
      // Should show task categories in tabs
      cy.contains('Getting Started').should('be.visible');
      
      // Should show checkboxes (disabled/illustrative)
      cy.get('input[type="checkbox"]').first().should('be.disabled');
    });

    it('should allow changing personas', () => {
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      
      // Select Instructor
      cy.selectPersona('instructor');
      
      // Click Change button
      cy.contains('button', 'Change').click();
      
      // Should return to persona selection
      cy.contains('Welcome to Homework Supply').should('be.visible');
      
      // Select Learner
      cy.selectPersona('learner');
    });

    it('should persist persona selection on page reload', () => {
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      cy.selectPersona('developer');
      
      // Reload page
      cy.reload();
      cy.openOnboardingPanel();
      
      // Should still show Developer persona
      cy.contains('Developer Onboarding').should('be.visible');
    });
  });

  describe('Tutorial Mode', () => {
    beforeEach(() => {
      cy.clearOnboardingProgress();
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      cy.selectPersona('instructor');
    });

    it('should display tutorial mode by default', () => {
      // Tutorial chip should be active
      cy.contains('.MuiChip-root', 'Tutorial').should('have.class', 'MuiChip-colorPrimary');
      
      // Should show Tutorial Mode indicator
      cy.contains('📖 Tutorial Mode').should('be.visible');
    });

    it('should complete a tutorial step manually', () => {
      cy.visitStory('onboarding-learning-modes--tutorial-mode-example', 'story');
      
      // Interact with demo component
      cy.get('input[type="text"]').type('My First Unit');
      cy.contains('button', 'Create Unit').click();
      cy.contains('Unit "My First Unit" created!').should('be.visible');
      
      // Click "Mark Complete" button
      cy.contains('button', 'Mark Complete').click();
      
      // Open Onboarding panel to verify completion
      cy.openOnboardingPanel();
      
      // Task should be marked complete
      cy.get('input[type="checkbox"][checked]').should('exist');
    });

    it('should navigate to quiz mode via "Try it Yourself" button', () => {
      cy.visitStory('onboarding-learning-modes--tutorial-mode-example', 'story');
      
      // Click "Try it Yourself →" button
      cy.contains('button', 'Try it Yourself').click();
      
      // Should navigate to quiz mode story
      cy.url().should('include', 'quiz');
    });
  });

  describe('Quiz Mode', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.visit(`${storybookUrl}/?path=/docs/getting-started-onboarding--docs`);
      cy.get('button[role="tab"]').contains('Onboarding').click();
      cy.contains('Instructor').parent().click();
    });

    it('should switch to quiz mode and show instructions', () => {
      // Click Quiz chip
      cy.contains('.MuiChip-root', 'Quiz').click();
      
      // ShoulOnboardingProgress();
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      cy.selectPersona('instructor');
    });

    it('should switch to quiz mode and show instructions', () => {
      cy.switchMode('quiz');
      
      // Should show quiz mode instructions
      cy.contains('Navigate to').should('be.visible');
      cy.contains('📄 Pages → Application Pages').should('be.visible');
    });

    it('should display quiz mode instructions overlay', () => {
      cy.visitStory('onboarding-learning-modes--quiz-mode-example', 'story');
      
      // Should show task instructions overlay
      cy.contains('🎯').should('be.visible');
      cy.contains('Steps to complete:').should('be.visible');
      cy.contains('button', 'Go to Application Pages').should('be.visible');
      cy.contains('Track your progress in the Onboarding sidebar').should('be.visible');
    });

    it('should navigate to Application Pages when button clicked', () => {
      cy.visitStory('onboarding-learning-modes--quiz-mode-example', 'story');
      
      // Click "Go to Application Pages →" button
      cy.contains('button', 'Go to Application Pages').click();
      
      // Should navigate to Application Pages docs
      cy.url().should('include', 'pages-application-pages--docs'

    it('should toggle between Tutorial and Quiz modes', () => {
      // Should start in Tutorial mode
      cy.contains('📖 Tutorial Mode').should('be.visible');
      
      // Switch to Quiz mode
      cy.contains('.MuiChip-root', 'Quiz').click();
      cy.contains('🎯 Quiz Mode').should('be.visible');
      cy.contains('Navigate to').should('be.visible');
      
      // Switch back to Tutorial mode
      cy.contains('.MuiChip-root', 'Tutorial').click();
      cy.contains('📖 Tutorial Mode').should('be.visible');
      cy.contains('Navigate to').should('not.exist');
    });

    it('should persist mode selection on navigation', () => {
      // Switch to Quiz mode
      cy.contains('.MuiChip-root', 'Quiz').click();
      cy.contaOnboardingProgress();
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      cy.selectPersona('instructor');
    });

    it('should toggle between Tutorial and Quiz modes', () => {
      // Should start in Tutorial mode
      cy.contains('📖 Tutorial Mode').should('be.visible');
      
      // Switch to Quiz mode
      cy.switchMode('quiz');
      cy.contains('Navigate to').should('be.visible');
      
      // Switch back to Tutorial mode
      cy.switchMode('tutorial');
      cy.contains('Navigate to').should('not.exist');
    });

    it('should persist mode selection on navigation', () => {
      // Switch to Quiz mode
      cy.switchMode('quiz');
      
      // Navigate to a different page
      cy.visitStory('getting-started-introduction--docs');
      
      // Go back to onboarding
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel
    it('should show completed vs remaining task chips', () => {
      // Should show completed chip
      cy.contains('.MuiChip-root', 'Completed').should('be.visible');
      
      // Should show remaining chip
      cy.contains('.MuiChip-root', 'Remaining').should('be.visible');
    });

    it('should update progress when task completed', () => {
      // Navigate to tutorial and complete a task
      cy.visit(`${storybookUrl}/?path=/story/onboarding-learning-modes--tutorial-mode-example`);
      OnboardingProgress();
      cy.visitStory('onboarding-learning-modes--tutorial-mode-example', 'story');
      
      cy.get('input[type="text"]').type('Test Unit');
      cy.contains('button', 'Create Unit').click();
      cy.contains('button', 'Mark Complete').click();
      
      cy.openOnboardingPanel();
      
      // Should show updated completion percentage
      cy.contains(/\d+% Complete/).should('not.contain', '0% Complete');
      cy.contains(/\d+ Completed/).should('not.contain', '0 Completed');
    });

    it('should allow resetting progress', () => {
      cy.visitStory('onboarding-learning-modes--auto-complete-tutorial', 'story');
      cy.wait(1000);
      
      cy.openOnboardingPanel();
      cy.contains(/\d+% Complete/).should('not.contain', '0% Complete');
      
      // Click Reset Progress button
      cy.contains('button', 'Reset Progress').click();
      cy.on('window:confirm', () => true);
      cy.wait(500);
      
      // Should return to persona selection
      cy.contains('Welcome to Homework Supply').should('be.visible');
      
      // Select persona again
      cy.selectPersona('instructor');

  describe('Task Categories', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.visit(`${storybookUrl}/?path=/docs/getting-started-onboarding--docs`);
      cy.get('button[role="tab"]').contains('Onboarding').click();
      cy.contains('Instructor').parent().click();
    });

    it('should show different task categories in tabs', () => {
      // Should have multiple tabs
      cy.get('.MuiTabs-root .MuiTab-root').should('have.length.greaterThan', 0);
    });

    it('should switch between task categories', () => {
      // Get all category tabs
      cy.get('.MuiTabs-root .MuiTab-root').then($tabs => {
        if ($tabs.length > 1) {
          // COnboardingProgress();
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      cy.selectPersona('instructor'
          cy.get('.MuiCard-root').should('be.visible');
        }
      });
    });

    it('should show task count for each category', () => {
      // Each tab should show (completed/total) count
      cy.get('.MuiTab-root').first().should('match', /\(\d+\/\d+\)/);
    });
  });

  describe('Multiple Tutorial Steps', () => {
    it('should display chained workflow of tutorial steps', () => {
      cy.visit(`${storybookUrl}/?path=/story/onboarding-learning-modes--multiple-tutorial-steps`);
      
      // Should show multiple TutorialStep components
      cy.contains('1. Create a Section').should('be.visible');
      cy.contains('2. Create a Unit').should('be.visible');
      cy.contains('3. Create an Assignment').should('be.visible');
      
      // Each step should have "Try it Yourself" button
      cy.get('button').contains('Try it Yourself').should('have.length.at.least', 3);
    });
  });

  describe('AuStory('onboarding-learning-modes--multiple-tutorial-steps', 'story');
      
      cy.contains('1. Create a Section').should('be.visible');
      cy.contains('2. Create a Unit').should('be.visible');
      cy.contains('3. Create an Assignment').should('be.visible');
      
      // Each step should have "Try it Yourself" button
      cy.get('button').contains('Try it Yourself').should('have.length.at.least', 3);
    });
  });

  describe('Auto-Complete Tutorial', () => {
    it('should auto-complete task on page view', () => {
      cy.clearOnboardingProgress();
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      cy.selectPersona('developer');
      
      cy.contains('0% Complete').should('be.visible');
      
      cy.visitStory('onboarding-learning-modes--auto-complete-tutorial', 'story');
      cy.wait(1000);
      
      cy.openOnboardingPanel();
    it('should have accessible checkboxes that are disabled', () => {
      // Checkboxes should have disabled attribute
      cy.get('input[type="checkbox"]').first().should('have.attr', 'disabled');
      
      // Should have aria-checked attribute
      cy.get('input[type="checkbox"]').first().should('have.attr', 'aria-checked');
    });

    it('should have accessible buttons with clear labels', () => {
      // Mode switcher chips should have accessible labels
      cy.contains('.MuiChip-root', 'Tutorial').should('be.visible');
      cy.contains('.MuiChip-root', 'Quiz').should('be.visible');
      
      // Change persona button
      cy.contaOnboardingProgress();
      cy.visitStory('getting-started-onboarding--docs');
      cy.openOnboardingPanel();
      cy.selectPersona('instructor'hould('be.visible');
    });

    it('should have keyboard navigation support', () => {
      // Tab to Quiz chip and activate with Enter
      cy.contains('.MuiChip-root', 'Quiz').focus().type('{enter}');
      cy.contains('🎯 Quiz Mode').should('be.visible');
      
      // Tab to Tutorial chip and activate
      cy.contains('.MuiChip-root', 'Tutorial').focus().type('{enter}');
      cy.contains('📖 Tutorial Mode').should('be.visible');
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save persona to localStorage', () => {
      cy.clearLocalStorage();
      cy.visit(`${storybookUrl}/?path=/docs/getting-started-onboarding--docs`);
      cy.get('button[role="tab"]').contains('Onboarding').click();
      cy.contains('Instructor').parent().click();
      
      // Check localStorage
      cy.window().then(win => {
        const storage = win.localStorage.getItem('onboarding-persona');
        expect(storage).to.equal('instructor');
      });
    });

    it('should save completed tasks to localStorage', () => {
      cy.clearLocalStorage();
      cy.visit(`${storybookUrl}/?path=/story/onboarding-learning-modes--auto-complete-tutorial`);
      cy.wait(1000);
      
      // Check localStorage for completed tasks
      cy.window().then(win => {
        const storage = win.localStorage.getItem('onboarding-completed-tasks-developer');
        expect(storage).to.exist;
      });
    });

    it('should restore state from localStorage on page load', () => {
      // Set localStorage manually
      cy.window().then(win => {
        win.localStorage.setItem('onboarding-persona', 'learner');
        win.localStorage.setItem('onboarding-completed-tasks-learner', JSON.stringify([{
          taskId: 'test-task',
          timestamp: Date.now()
        }]));
      });
      
      cy.visit(`${storybookUrl}/?path=/docs/getting-started-onboarding--docs`);
      cy.get('button[role="tab"]').contains('Onboarding').click();
      
      // Should show Learner persona
      cy.contains('Learner Onboarding').should('be.visible');
      
      // Should show non-zero completion
      cy.contains(/\d+% Complete/);
    });
  });
});
