/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Custom Cypress Commands for Storybook Onboarding Tests
 */

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Open the Onboarding panel in Storybook
       * @example cy.openOnboardingPanel()
       */
      openOnboardingPanel(): Chainable<void>
      
      /**
       * Select a persona in the onboarding panel
       * @param persona - 'instructor' | 'learner' | 'developer'
       * @example cy.selectPersona('instructor')
       */
      selectPersona(persona: 'instructor' | 'learner' | 'developer'): Chainable<void>
      
      /**
       * Switch onboarding mode
       * @param mode - 'tutorial' | 'quiz'
       * @example cy.switchMode('quiz')
       */
      switchMode(mode: 'tutorial' | 'quiz'): Chainable<void>
      
      /**
       * Clear onboarding progress from localStorage
       * @example cy.clearOnboardingProgress()
       */
      clearOnboardingProgress(): Chainable<void>
      
      /**
       * Visit a Storybook story by path
       * @param path - Story path (e.g., 'getting-started-onboarding--docs')
       * @param viewMode - 'docs' | 'story'
       * @example cy.visitStory('getting-started-onboarding--docs')
       */
      visitStory(path: string, viewMode?: 'docs' | 'story'): Chainable<void>
    }
  }
}

/**
 * Open the Onboarding panel in Storybook
 */
Cypress.Commands.add('openOnboardingPanel', () => {
  cy.get('button[role="tab"]').contains('Onboarding').click();
});

/**
 * Select a persona in the onboarding panel
 */
Cypress.Commands.add('selectPersona', (persona: 'instructor' | 'learner' | 'developer') => {
  const personaMap = {
    instructor: 'Instructor',
    learner: 'Learner',
    developer: 'Developer',
  };
  
  cy.contains(personaMap[persona]).parent().click();
  cy.contains(`${personaMap[persona]} Onboarding`).should('be.visible');
});

/**
 * Switch onboarding mode
 */
Cypress.Commands.add('switchMode', (mode: 'tutorial' | 'quiz') => {
  const modeMap = {
    tutorial: 'Tutorial',
    quiz: 'Quiz',
  };
  
  cy.contains('.MuiChip-root', modeMap[mode]).click();
  
  const indicator = mode === 'tutorial' ? '📖 Tutorial Mode' : '🎯 Quiz Mode';
  cy.contains(indicator).should('be.visible');
});

/**
 * Clear onboarding progress from localStorage
 */
Cypress.Commands.add('clearOnboardingProgress', () => {
  cy.window().then(win => {
    // Clear all onboarding-related localStorage keys
    Object.keys(win.localStorage).forEach(key => {
      if (key.startsWith('onboarding-')) {
        win.localStorage.removeItem(key);
      }
    });
  });
});

/**
 * Visit a Storybook story by path
 */
Cypress.Commands.add('visitStory', (path: string, viewMode: 'docs' | 'story' = 'docs') => {
  cy.visit(`/?path=/${viewMode}/${path}`);
  cy.get('body').should('be.visible');
});

export {};
