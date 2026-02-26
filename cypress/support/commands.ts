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
      
      /**
       * Visit a page and monitor console for i18n missing keys
       * @param url - Page URL to visit
       * @param options - Visit options
       * @returns Object with missing keys array
       * @example cy.visitAndMonitorI18n('/').then(({ missingKeys }) => { ... })
       */
      visitAndMonitorI18n(
        url: string,
        options?: Partial<Cypress.VisitOptions>
      ): Chainable<{
        missingKeys: string[];
        consoleErrors: string[];
        consoleWarnings: string[];
      }>
      
      /**
       * Check for i18n missing keys in current page
       * @example cy.checkI18nKeys().should('have.length', 0)
       */
      checkI18nKeys(): Chainable<string[]>
      
      /**
       * Verify page has no missing translation keys
       * @example cy.verifyNoMissingKeys()
       */
      verifyNoMissingKeys(): Chainable<void>
      
      /**
       * Check Yjs provider connection status
       * @example cy.checkYjsConnection().should('be.true')
       */
      checkYjsConnection(): Chainable<boolean>
      
      /**
       * Get Yjs provider instance from window
       * @example cy.getYjsProvider().then(provider => { ... })
       */
      getYjsProvider(): Chainable<any>
      
      /**
       * Wait for Yjs to sync
       * @param timeout - Max wait time in ms (default: 5000)
       * @example cy.waitForYjsSync()
       */
      waitForYjsSync(timeout?: number): Chainable<void>
      
      /**
       * Type in Lexical editor
       * @param text - Text to type
       * @param options - Type options
       * @example cy.typeInEditor('Hello world')
       */
      typeInEditor(text: string, options?: Partial<Cypress.TypeOptions>): Chainable<void>
      
      /**
       * Get Lexical editor content
       * @example cy.getEditorContent().should('contain', 'test')
       */
      getEditorContent(): Chainable<string>
      
      /**
       * Clear Yjs IndexedDB for a unit
       * @param unitId - Unit ID
       * @example cy.clearYjsIndexedDB('unit-123')
       */
      clearYjsIndexedDB(unitId: string): Chainable<void>
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

/**
 * Visit a page and monitor console for i18n missing keys
 */
Cypress.Commands.add('visitAndMonitorI18n', (url: string, options = {}) => {
  const missingKeys: string[] = [];
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  return cy.visit(url, {
    ...options,
    onBeforeLoad(win) {
      // Store original console methods
      const originalWarn = win.console.warn;
      const originalError = win.console.error;
      const originalLog = win.console.log;

      // Override console.warn to catch i18next warnings
      win.console.warn = function (...args: any[]) {
        const message = args.join(' ');
        
        // Detect i18next missing key warnings
        // Common patterns:
        // - "i18next::translator: missingKey en common keyName"
        // - "i18next: key not found: keyName"
        // - "Missing translation for key: keyName"
        if (
          message.includes('missingKey') ||
          (message.includes('i18next') && message.includes('key')) ||
          message.includes('Missing translation') ||
          message.includes('translation key')
        ) {
          missingKeys.push(message);
          consoleWarnings.push(message);
        } else {
          consoleWarnings.push(message);
        }
        
        originalWarn.apply(win.console, args);
      };

      // Override console.error to catch errors
      win.console.error = function (...args: any[]) {
        const message = args.join(' ');
        consoleErrors.push(message);
        
        // Also check errors for i18n issues
        if (
          message.includes('i18next') ||
          message.includes('translation')
        ) {
          missingKeys.push(message);
        }
        
        originalError.apply(win.console, args);
      };

      // Override console.log for completeness
      win.console.log = function (...args: any[]) {
        const message = args.join(' ');
        
        // Some configurations might log missing keys via console.log
        if (message.includes('saveMissing') || message.includes('missingKey')) {
          missingKeys.push(message);
        }
        
        originalLog.apply(win.console, args);
      };

      // Call original onBeforeLoad if provided
      if (options.onBeforeLoad) {
        options.onBeforeLoad(win);
      }
    },
  }).then(() => {
    return {
      missingKeys,
      consoleErrors,
      consoleWarnings,
    };
  });
});

/**
 * Check for i18n missing keys in current page
 */
Cypress.Commands.add('checkI18nKeys', () => {
  const missingKeys: string[] = [];

  return cy.window().then((win: any) => {
    // Try to access i18next instance
    const i18n = win.i18n || win.next?.i18n;
    
    if (i18n && typeof i18n.services?.backendConnector?.state !== 'undefined') {
      // Check for missing keys in i18next state
      const state = i18n.services.backendConnector.state;
      
      // Iterate through languages and namespaces
      Object.keys(state).forEach((lang) => {
        Object.keys(state[lang]).forEach((ns) => {
          if (state[lang][ns] === -1) {
            missingKeys.push(`${lang}:${ns}`);
          }
        });
      });
    }
    
    return missingKeys;
  });
});

/**
 * Verify page has no missing translation keys
 */
Cypress.Commands.add('verifyNoMissingKeys', () => {
  cy.checkI18nKeys().should('have.length', 0);
});

/**
 * Check Yjs provider connection status
 */
Cypress.Commands.add('checkYjsConnection', () => {
  return cy.window().then((win: any) => {
    const provider = win.__YJS_PROVIDER__ || win.yjsProvider;
    
    if (!provider) {
      cy.log('⚠️ Yjs provider not found in window');
      return false;
    }
    
    const isConnected = provider.isConnected === true || provider.wsconnected === true;
    const isSynced = provider.isSynced === true || provider.synced === true;
    
    cy.log(`Yjs Status: Connected=${isConnected}, Synced=${isSynced}`);
    
    return isConnected && isSynced;
  });
});

/**
 * Get Yjs provider instance from window
 */
Cypress.Commands.add('getYjsProvider', () => {
  return cy.window().then((win: any) => {
    return win.__YJS_PROVIDER__ || win.yjsProvider || null;
  });
});

/**
 * Wait for Yjs to sync
 */
Cypress.Commands.add('waitForYjsSync', (timeout = 5000) => {
  const startTime = Date.now();
  
  const checkSync = () => {
    return cy.window().then((win: any) => {
      const provider = win.__YJS_PROVIDER__ || win.yjsProvider;
      
      if (!provider) {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeout) {
          throw new Error('Yjs provider not found within timeout');
        }
        cy.wait(100);
        return checkSync();
      }
      
      const isSynced = provider.isSynced === true || provider.synced === true;
      
      if (!isSynced) {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeout) {
          throw new Error('Yjs sync timeout');
        }
        cy.wait(100);
        return checkSync();
      }
      
      cy.log('✅ Yjs synced');
    });
  };
  
  return checkSync();
});

/**
 * Type in Lexical editor
 */
Cypress.Commands.add('typeInEditor', (text: string, options = {}) => {
  cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
    .first()
    .clear()
    .type(text, { delay: 10, ...options });
});

/**
 * Get Lexical editor content
 */
Cypress.Commands.add('getEditorContent', () => {
  return cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
    .first()
    .invoke('text');
});

/**
 * Clear Yjs IndexedDB for a unit
 */
Cypress.Commands.add('clearYjsIndexedDB', (unitId: string) => {
  cy.window().then(win => {
    if (win.indexedDB) {
      const dbName = `yjs-unit-${unitId}`;
      
      const deleteRequest = win.indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onsuccess = () => {
        cy.log(`🗑️ Cleared IndexedDB: ${dbName}`);
      };
      
      deleteRequest.onerror = () => {
        cy.log(`⚠️ Failed to delete IndexedDB: ${dbName}`);
      };
    }
  });
});

export {};
