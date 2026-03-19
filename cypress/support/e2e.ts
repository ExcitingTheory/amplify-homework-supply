// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import and register custom commands
import { registerCommands } from './commands'

// Register all custom Cypress commands
registerCommands();

// Removed console interception to avoid performance issues and promise conflicts
// Console output will appear naturally in the browser console during test execution

// Alternatively you can use CommonJS syntax:
// require('./commands')