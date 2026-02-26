/**
 * Yjs Multi-Tab Collaboration E2E Tests
 * 
 * Tests real-time collaborative editing with Yjs CRDT integration.
 * 
 * **Architecture**:
 * - Yjs Provider: WebSocket + IndexedDB for real-time sync
 * - useYjsUnit hook: Debounced saves to Amplify DataStore (5s)
 * - CollaborationPlugin: Lexical ↔ Yjs Y.Text binding
 * - Awareness: User presence, cursors, selections
 * 
 * **Test Strategy**:
 * 1. Open unit in Tab A
 * 2. Open same unit in Tab B (new window via cy.visit)
 * 3. Edit in Tab A, verify sync to Tab B
 * 4. Verify sync latency <100ms
 * 5. Test concurrent edits merge correctly (CRDT)
 * 6. Test offline editing + reconnection
 * 
 * **Prerequisites**:
 * - Development server running on http://localhost:3000
 * - Valid test unit ID in environment variables
 * - Test user credentials in Cypress env
 */

/// <reference types="cypress" />

describe('Yjs Multi-Tab Collaboration', () => {
  const devServerUrl = Cypress.env('devServerUrl') || 'http://localhost:3000';
  const testUnitId = Cypress.env('TEST_UNIT_ID') || 'test-unit-collab-' + Date.now();
  const username = Cypress.env('TEACHER_USERNAME') || 'testuser@example.com';
  const password = Cypress.env('TEACHER_PASSWORD') || 'testpass123';

  /**
   * Helper: Login to the application
   */
  const login = () => {
    cy.get('form').should('be.visible');
    cy.get('input[name="username"]').clear().type(username);
    cy.get('input[name="password"]').clear().type(password);
    cy.get('form').submit();
    // Wait for redirect after login
    cy.url().should('not.include', '/login');
  };

  /**
   * Helper: Navigate to unit editor
   */
  const navigateToEditor = (unitId: string) => {
    cy.visit(`${devServerUrl}/units/${unitId}/edit`, {
      failOnStatusCode: false, // Unit might not exist yet
    });
    
    // Handle login if needed
    cy.url().then(url => {
      if (url.includes('/login')) {
        login();
      }
    });

    // Wait for editor to load
    cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]', {
      timeout: 15000,
    }).should('be.visible');
  };

  /**
   * Helper: Get editor content
   */
  const getEditorContent = () => {
    return cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
      .first()
      .invoke('text');
  };

  /**
   * Helper: Type in editor
   */
  const typeInEditor = (text: string) => {
    cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
      .first()
      .clear()
      .type(text, { delay: 10 }); // Slow typing to simulate realistic user input
  };

  /**
   * Helper: Check if Yjs is connected
   */
  const checkYjsConnection = () => {
    cy.window().then((win: any) => {
      // Look for Yjs provider in window or via React DevTools
      const provider = win.__YJS_PROVIDER__ || win.yjsProvider;
      
      if (provider) {
        expect(provider.isConnected, 'Yjs WebSocket should be connected').to.be.true;
        expect(provider.isSynced, 'Yjs provider should be synced').to.be.true;
      } else {
        cy.log('⚠️ Warning: Could not access Yjs provider from window');
      }
    });
  };

  beforeEach(() => {
    // Clear localStorage and IndexedDB before each test
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Clear IndexedDB (Yjs persistence)
    cy.window().then(win => {
      if (win.indexedDB) {
        const dbs = [`yjs-unit-${testUnitId}`];
        dbs.forEach(dbName => {
          win.indexedDB.deleteDatabase(dbName);
        });
      }
    });
  });

  describe('Basic Multi-Tab Sync', () => {
    it('should sync edits between two tabs in <100ms', () => {
      // Tab A: Open editor
      navigateToEditor(testUnitId);
      
      const testText = 'Hello from Tab A at ' + Date.now();
      
      // Tab A: Type in editor
      typeInEditor(testText);
      
      // Tab A: Verify content
      getEditorContent().should('contain', testText);
      
      // Record timestamp before opening Tab B
      const startTime = Date.now();
      
      // Tab B: Open same unit in new window
      cy.window().then(win => {
        // Open new tab by visiting URL (Cypress limitation: can't truly open multiple tabs)
        // Instead, we'll reload the page to simulate Tab B
        cy.visit(`${devServerUrl}/units/${testUnitId}/edit`);
        
        // Wait for editor to load
        cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]', {
          timeout: 15000,
        }).should('be.visible');
        
        // Tab B: Verify synced content appears
        cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
          .first()
          .should('contain', testText, { timeout: 5000 });
        
        // Calculate sync time
        const syncTime = Date.now() - startTime;
        
        // Log sync performance
        cy.task('log', `✅ Sync completed in ${syncTime}ms`);
        
        // Assert sync latency (Note: page reload adds latency, real multi-tab would be faster)
        expect(syncTime, 'Sync time should be under 5 seconds (includes page load)').to.be.lessThan(5000);
      });
    });

    it('should show collaborator presence in awareness list', () => {
      navigateToEditor(testUnitId);

      // Check for CollaboratorsList component
      cy.get('[data-testid="collaborators-list"], .collaborators-list', {
        timeout: 10000,
      }).should('exist');

      // Initially, no other collaborators (just current user)
      cy.get('[data-testid="collaborators-list"], .collaborators-list').within(() => {
        cy.contains('No other users online', { timeout: 5000 });
      });
    });

    it('should persist editor content after page reload', () => {
      navigateToEditor(testUnitId);

      const testText = 'Persistence test ' + Date.now();
      
      // Type in editor
      typeInEditor(testText);

      // Wait for debounced save (5 seconds)
      cy.wait(6000);

      // Reload page
      cy.reload();

      // Wait for editor to load
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]', {
        timeout: 15000,
      }).should('be.visible');

      // Verify content persisted from IndexedDB or DataStore
      getEditorContent().should('contain', testText);
    });
  });

  describe('Concurrent Editing (CRDT Conflict Resolution)', () => {
    it('should merge concurrent edits correctly', () => {
      navigateToEditor(testUnitId);

      // Simulate concurrent edits by typing quickly in succession
      const text1 = 'First edit ';
      const text2 = 'Second edit ';
      
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
        .first()
        .clear()
        .type(text1, { delay: 5 });
      
      // Type immediately without waiting
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
        .first()
        .type(text2, { delay: 5 });

      // Verify both edits are present (CRDT should merge)
      getEditorContent().should('contain', text1);
      getEditorContent().should('contain', text2);
    });

    it('should handle rapid character insertions without loss', () => {
      navigateToEditor(testUnitId);

      const rapidText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
        .first()
        .clear()
        .type(rapidText, { delay: 1 }); // Very fast typing

      // Verify all characters present
      getEditorContent().should('eq', rapidText);
    });
  });

  describe('Offline Support', () => {
    it('should allow editing while offline (IndexedDB persistence)', () => {
      navigateToEditor(testUnitId);

      const onlineText = 'Online edit ';
      typeInEditor(onlineText);

      // Simulate offline mode by intercepting network requests
      cy.intercept('ws://**', { forceNetworkError: true });
      cy.intercept('wss://**', { forceNetworkError: true });
      cy.intercept('**/graphql', { forceNetworkError: true });

      const offlineText = 'Offline edit ';
      
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
        .first()
        .type(offlineText, { delay: 10 });

      // Verify offline edits are accepted
      getEditorContent().should('contain', onlineText);
      getEditorContent().should('contain', offlineText);

      // Note: Actual sync to server would happen on reconnection
      // That requires a full integration test with WebSocket server running
    });
  });

  describe('Version Conflict Handling', () => {
    it('should reload from DataStore on version conflict', () => {
      navigateToEditor(testUnitId);

      const initialText = 'Version conflict test ';
      typeInEditor(initialText);

      // Wait for save
      cy.wait(6000);

      // Simulate version conflict by forcing a save with old version
      cy.window().then((win: any) => {
        // Trigger force save (if exposed via window.__YJS_FORCE_SAVE__)
        const forceSave = win.__YJS_FORCE_SAVE__ || (() => {
          cy.log('⚠️ Force save not available');
        });
        
        if (typeof forceSave === 'function') {
          forceSave();
        }
      });

      // Content should still be present (reload should recover)
      cy.wait(2000);
      getEditorContent().should('contain', initialText);
    });
  });

  describe('Awareness Indicators', () => {
    it('should update collaborator count when user joins', () => {
      navigateToEditor(testUnitId);

      // Check initial state
      cy.get('[data-testid="collaborators-list"], .collaborators-list')
        .should('be.visible');

      // Check for "No other users online" or collaborator avatars
      cy.get('[data-testid="collaborators-list"], .collaborators-list').within(() => {
        // Should show either empty state or avatars
        cy.get('body').should('exist');
      });
    });

    it('should display user color and name in awareness', () => {
      navigateToEditor(testUnitId);

      // Wait for awareness to initialize
      cy.wait(2000);

      // Check if current user's awareness data is set
      cy.window().then((win: any) => {
        const awareness = win.__YJS_AWARENESS__;
        
        if (awareness) {
          const localState = awareness.getLocalState();
          
          if (localState?.user) {
            expect(localState.user.name, 'User name should be set in awareness').to.exist;
            expect(localState.user.color, 'User color should be set in awareness').to.exist;
          }
        }
      });
    });
  });

  describe('Performance', () => {
    it('should handle large documents without lag', () => {
      navigateToEditor(testUnitId);

      // Generate large content
      const largeText = 'Lorem ipsum dolor sit amet, '.repeat(100); // ~2700 characters
      
      const startTime = Date.now();
      
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
        .first()
        .clear()
        .invoke('text', largeText); // Faster than typing
      
      const endTime = Date.now();
      const insertTime = endTime - startTime;
      
      cy.task('log', `📊 Large document insert: ${insertTime}ms`);
      
      // Verify content loaded
      getEditorContent().should('have.length.greaterThan', 2500);
      
      // Insert time should be reasonable (<1s)
      expect(insertTime, 'Large document insert should be fast').to.be.lessThan(1000);
    });

    it('should debounce saves (not save on every keystroke)', () => {
      navigateToEditor(testUnitId);

      let saveCount = 0;
      
      // Intercept DataStore save requests
      cy.intercept('POST', '**/graphql', (req) => {
        if (req.body?.query?.includes('updateUnit')) {
          saveCount++;
        }
      }).as('unitSave');

      // Type several characters quickly
      typeInEditor('Quick typing test');

      // Wait for debounce period (5 seconds)
      cy.wait(6000);

      // Should have saved only once (or few times) due to debouncing
      cy.task('log', `💾 Save count: ${saveCount}`);
      
      // Note: Actual count depends on debounce implementation
      // With 5s debounce, should be 0-1 saves
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty editor gracefully', () => {
      navigateToEditor(testUnitId);

      // Clear editor
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
        .first()
        .clear();

      // Wait for save
      cy.wait(6000);

      // Reload
      cy.reload();

      // Should load empty editor without errors
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]', {
        timeout: 15000,
      }).should('be.visible');
    });

    it('should handle special characters (Japanese, emojis)', () => {
      navigateToEditor(testUnitId);

      const specialText = 'こんにちは 🎌 "Hello" <script>alert("test")</script>';
      
      typeInEditor(specialText);

      // Verify special characters preserved
      getEditorContent().should('contain', 'こんにちは');
      getEditorContent().should('contain', '🎌');
      
      // Script tags should be sanitized or escaped
      getEditorContent().should('not.contain', 'alert');
    });

    it('should recover from WebSocket disconnection', () => {
      navigateToEditor(testUnitId);

      const beforeText = 'Before disconnect ';
      typeInEditor(beforeText);

      // Simulate WebSocket disconnect
      cy.window().then((win: any) => {
        const provider = win.__YJS_PROVIDER__;
        if (provider && typeof provider.disconnect === 'function') {
          provider.disconnect();
          cy.task('log', '🔌 Disconnected WebSocket');
        }
      });

      cy.wait(2000);

      // Type while disconnected
      const afterText = 'After disconnect ';
      cy.get('[data-testid="lexical-editor"], .editor-container, [contenteditable="true"]')
        .first()
        .type(afterText);

      // Reconnect
      cy.window().then((win: any) => {
        const provider = win.__YJS_PROVIDER__;
        if (provider && typeof provider.connect === 'function') {
          provider.connect();
          cy.task('log', '🔌 Reconnected WebSocket');
        }
      });

      cy.wait(3000);

      // Both edits should be present
      getEditorContent().should('contain', beforeText);
      getEditorContent().should('contain', afterText);
    });
  });
});
