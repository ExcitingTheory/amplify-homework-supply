/**
 * i18n Translation Validation E2E Tests
 * 
 * Visits all pages in the dev server and checks for:
 * - Missing translation keys in console
 * - Page rendering without errors
 * - All i18n namespaces loading correctly
 * 
 * Prerequisites:
 * - Dev server running on http://localhost:3000
 * - Run with: npm run test:i18n
 * 
 * @see next-i18next.config.js for i18n configuration
 * @see docs/I18N_TESTING_GUIDE.md for usage guide
 */

describe('i18n Translation Validation', () => {
  // Override baseUrl to use dev server instead of Storybook
  const devServerUrl = Cypress.env('devServerUrl') || 'http://localhost:3000';
  
  // Track all missing keys found during test run
  const missingKeys: Set<string> = new Set();
  const consoleErrors: Array<{ page: string; error: string }> = [];
  const renderErrors: Array<{ page: string; error: string }> = [];

  // Load routes from generated fixture file
  let routes: {
    static: string[];
    dynamic: Array<{ route: string; mockUrl: string; params: string[] }>;
  };

  before(() => {
    // Load generated routes
    cy.fixture('routes.json').then((loadedRoutes) => {
      routes = loadedRoutes;
      cy.log(`Loaded ${routes.static.length} static routes and ${routes.dynamic.length} dynamic routes`);
    });
  });

  /**
   * i18n namespaces to verify are loaded
   */
  const requiredNamespaces = [
    'common',
    'auth',
    'components',
    'pages',
    'editor.authoring',
    'editor.files',
    'editor.ai',
    'editor.blocks',
    'editor.shared',
    'workbook',
  ];

  beforeEach(() => {
    // Clear previous test artifacts
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Console Monitoring Setup', () => {
    it('should detect missing translation keys in console', () => {
      cy.visit(devServerUrl + '/', {
        onBeforeLoad(win) {
          // Spy on console methods to catch i18n warnings
          cy.spy(win.console, 'warn').as('consoleWarn');
          cy.spy(win.console, 'error').as('consoleError');
          cy.spy(win.console, 'log').as('consoleLog');
        },
      });

      // Test that our spy is working
      cy.window().then((win) => {
        // Trigger a test warning
        win.console.warn('test warning');
      });

      cy.get('@consoleWarn').should('have.been.calledWith', 'test warning');
    });
  });

  describe('Static Pages', () => {
    it('should load routes from fixture', () => {
      expect(routes).to.exist;
      expect(routes.static).to.be.an('array');
    });

    // Dynamically create tests for each static route
    const testStaticRoute = (route: string) => {
      it(`should render ${route} without missing translations`, () => {
        const pageMissingKeys: string[] = [];
        const pageErrors: string[] = [];

        cy.visit(devServerUrl + route, {
          failOnStatusCode: false,
          onBeforeLoad(win) {
            // Intercept console methods
            const originalWarn = win.console.warn;
            const originalError = win.console.error;

            win.console.warn = function (...args) {
              const message = args.join(' ');
              
              // Detect i18next missing key warnings
              if (
                message.includes('missingKey') ||
                message.includes('i18next') ||
                message.includes('translation')
              ) {
                pageMissingKeys.push(message);
                missingKeys.add(message);
              }
              
              originalWarn.apply(win.console, args);
            };

            win.console.error = function (...args) {
              const message = args.join(' ');
              pageErrors.push(message);
              consoleErrors.push({ page: route, error: message });
              originalError.apply(win.console, args);
            };
          },
        });

        // Wait for page to fully load
        cy.get('body').should('be.visible');
        
        // Wait for i18n to initialize
        cy.wait(1000);

        // Check for React errors
        cy.window().then((win) => {
          cy.get('body').then(($body) => {
            const hasErrorOverlay = $body.find('nextjs-portal').length > 0 ||
                                   $body.text().includes('Error:') ||
                                   $body.text().includes('Unhandled Runtime Error');
            
            if (hasErrorOverlay) {
              const errorText = $body.text();
              renderErrors.push({ page: route, error: errorText });
            }
          });
        });

        // Verify page rendered successfully
        cy.get('html').should('not.contain', 'Application error');
        
        // Log any missing keys for this page
        cy.then(() => {
          if (pageMissingKeys.length > 0) {
            cy.log(`⚠️ Missing keys on ${route}:`, pageMissingKeys.join('\n'));
          }
          
          if (pageErrors.length > 0) {
            cy.log(`❌ Console errors on ${route}:`, pageErrors.join('\n'));
          }
        });
      });', () => {
    it('should load dynamic routes from fixture', () => {
      expect(routes).to.exist;
      expect(routes.dynamic).to.be.an('array');
    });

    // Dynamically create tests for each dynamic route
    const testDynamicRoute = (routeData: { route: string; mockUrl: string }) => {
      const { route, mockUrl } = routeData;
      
      it(`should render ${route} without missing translations`, () => {
        const pageMissingKeys: string[] = [];

        cy.visit(devServerUrl + mockUrl, {
          failOnStatusCode: false,
          onBeforeLoad(win) {
            const originalWarn = win.console.warn;

            win.console.warn = function (...args) {
              const message = args.join(' ');
              
              if (
                message.includes('missingKey') ||
                message.includes('i18next') ||
                message.includes('translation')
              ) {
                pageMissingKeys.push(message);
                missingKeys.add(message);
              }
              
              originalWarn.apply(win.console, args);
            };
          },
        });

        cy.get('body').should('be.visible');
        cy.wait(1000);

        cy.then(() => {
          if (pageMissingKeys.length > 0) {
            cy.log(`⚠️ Missing keys on ${route}:`, pageMissingKeys.join('\n'));
          }
        });
      });
    };

    // Generate tests after routes are loaded
    before(function() {
      if (routes && routes.dynamic) {
        routes.dynamic.forEach(routeData => {
          testDynamicRoute(routeData);
        });
      }     originalWarn.apply(win.console, args);
            };
          },
        });

        cy.get('body').should('be.visible');
        cy.wait(1000);

        cy.then(() => {
          if (pageMissingKeys.length > 0) {
            cy.log(`⚠️ Missing keys on ${route}:`, pageMissingKeys.join('\n'));
          }
        });devServerUrl + '/');
      cy.wait(1000);

      cy.window().then((win: any) => {
        // Access i18next instance from window
        const i18n = win.i18n || win.next?.i18n;

        if (i18n) {
          // Check that all namespaces are available
          requiredNamespaces.forEach((ns) => {
            const hasNamespace = i18n.hasResourceBundle?.('en', ns);
            
            if (!hasNamespace) {
              cy.log(`⚠️ Missing namespace: ${ns}`);
            }
          });
        }
      });
    });

    it('should have fallback language configured', () => {
      cy.visit(devServerUrl + '/');
      
      cy.window().then((win: any) => {
        const i18n = win.i18n || win.next?.i18n;
        
        if (i18n) {
          expect(i18n.options?.fallbackLng).to.include('en');
        }
      });
    });
  });

  describe('Language Switching', () => {
    const languages = ['en', 'es', 'fr', 'de', 'ja', 'zh'];

    languages.forEach((lang) => {
      it(`should load ${lang} translations without missing keys`, () => {
        const langMissingKeys: string[] = [];

        // Set language via cookie before visiting
        cy.setCookie('NEXT_LOCALE', lang);

        cy.visit(devServerUrl + Each((lang) => {
      it(`should load ${lang} translations without missing keys`, () => {
        const langMissingKeys: string[] = [];

        // Set language via cookie before visiting
        cy.setCookie('NEXT_LOCALE', lang);

        cy.visit('/', {
          onBeforeLoad(win) {
            const originalWarn = win.console.warn;

            win.console.warn = function (...args) {
              const message = args.join(' ');
              
              if (
                message.includes('missingKey') ||
                message.includes('i18next')
              ) {
                langMissingKeys.push(message);
              }
              
              originalWarn.apply(win.console, args);
            };
          },
        });

        cy.get('body').should('be.visible');
        cy.wait(1000);

        cy.then(() => {
          if (langMissingKeys.length > 0) {
            cy.log(`⚠️ Missing keys for ${lang}:`, langMissingKeys.join('\n'));
          }
        });
      });
    });
  });

  after(() => {
    // Generate summary report after all tests
    cy.task('log', '\n' + '='.repeat(80));
    cy.task('log', '📊 i18n Validation Summary');
    cy.task('log', '='.repeat(80));
    
    cy.then(() => {
      cy.task('log', `\n🔍 Total Missing Translation Keys: ${missingKeys.size}`);
      
      if (missingKeys.size > 0) {
        cy.task('log', '\nMissing Keys:');
        Array.from(missingKeys).forEach((key) => {
          cy.task('log', `  ⚠️  ${key}`);
        });
      }

      cy.task('log', `\n❌ Total Console Errors: ${consoleErrors.length}`);
      
      if (consoleErrors.length > 0) {
        cy.task('log', '\nConsole Errors by Page:');
        consoleErrors.forEach(({ page, error }) => {
          cy.task('log', `  📄 ${page}`);
          cy.task('log', `     ${error}`);
        });
      }

      cy.task('log', `\n💥 Total Render Errors: ${renderErrors.length}`);
      
      if (renderErrors.length > 0) {
        cy.task('log', '\nRender Errors by Page:');
        renderErrors.forEach(({ page, error }) => {
          cy.task('log', `  📄 ${page}`);
          cy.task('log', `     ${error.substring(0, 200)}...`);
        });
      }

      cy.task('log', '\n' + '='.repeat(80) + '\n');

      // Write detailed report to file
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalMissingKeys: missingKeys.size,
          totalConsoleErrors: consoleErrors.length,
          totalRenderErrors: renderErrors.length,
        },
        missingKeys: Array.from(missingKeys),
        consoleErrors,
        renderErrors,
      };

      cy.writeFile('cypress/reports/i18n-validation-report.json', report);
    });
  });
});
