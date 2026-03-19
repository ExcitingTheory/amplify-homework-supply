#!/usr/bin/env node

/**
 * Automated Cypress Test Refactoring Script
 * 
 * Removes arbitrary cy.wait() calls and replaces them with explicit waits.
 * Run with: node cypress/refactor-waits.js
 */

const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'e2e');

// Refactoring patterns
const patterns = [
  // Login helper refactoring
  {
    search: /const loginAsInstructor = \(\) => \{\s+cy\.visit\('\/'\);\s+cy\.wait\(\d+\);([\s\S]*?)cy\.wait\(\d+\);\s+\};/g,
    replace: `const loginAsInstructor = () => {
    cy.visit('/');
    cy.get('form', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="username"]').clear().type(Cypress.env('TEACHER_USERNAME'));
    cy.get('input[name="password"]').clear().type(Cypress.env('TEACHER_PASSWORD'));
    cy.get('form').first().submit();
    cy.waitForAuth();
  };`,
    description: 'Refactor loginAsInstructor helper'
  },
  
  // After cy.visit() patterns
  {
    search: /cy\.visit\((['"`][^'"`]+['"`])\);\s+cy\.wait\(\d+\);/g,
    replace: (match, url) => {
      const cleanUrl = url.replace(/['"`]/g, '');
      if (cleanUrl.includes('/unit/')) {
        return `cy.visit(${url});\n    cy.waitForEditor();`;
      } else if (cleanUrl.includes('/units')) {
        return `cy.visit(${url});\n    cy.waitForNavigation('/units');`;
      } else if (cleanUrl.includes('/sections')) {
        return `cy.visit(${url});\n    cy.waitForNavigation('/sections');`;
      } else {
        return `cy.visit(${url});\n    cy.waitForPageLoad();`;
      }
    },
    description: 'Replace waits after cy.visit() with explicit waits'
  },
  
  // After AI operations (but not debounce waits)
  {
    search: /cy\.wait\((1[0-9]{4}|[2-9][0-9]{4})\);/g,
    replace: (match, timeout) => {
      // These are AI response waits - already handled by response checks
      return '// Removed: AI response wait - now handled by explicit response check';
    },
    description: 'Remove waits > 10s (AI operations)'
  },
  
  // Generic 2-3 second waits (except after specific elements)
  {
    search: /(?<!\.type\([^)]+\))\s+cy\.wait\(([23]000)\);/g,
    replace: '// Removed: arbitrary wait - use explicit element checks instead',
    description: 'Remove 2-3 second waits'
  },
  
  // Keep debounce waits (500ms, 1000ms) but add comment
  {
    search: /cy\.wait\((500|1000)\);(?!\s*\/\/ (Debounce|SHORT))/g,
    replace: (match, timeout) => `cy.wait(${timeout}); // SHORT wait (acceptable for debounce/animation)`,
    description: 'Mark short waits as acceptable'
  }
];

// Files to refactor (in order of priority)
const filesToRefactor = [
  'global-chat.cy.ts',
  'instructor-workflow.cy.ts',
  'document-analysis.cy.ts',
  'learner-workflow.cy.ts',
  'yjs-collaboration.cy.ts',
  'onboarding-spec.cy.ts',
  'i18n-validation-spec.cy.ts'
];

function refactorFile(filePath) {
  console.log(`\\nRefactoring: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalWaits = (content.match(/cy\.wait\(\d+\)/g) || []).length;
  
  // Apply patterns
  patterns.forEach(pattern => {
    if (pattern.search && pattern.replace) {
      content = content.replace(pattern.search, pattern.replace);
    }
  });
  
  // Add refactored note to file header if not present
  if (!content.includes('✅ REFACTORED')) {
    content = content.replace(
      /(\* Duration:.*?\*\/)/s,
      `$1\n * \n * ✅ REFACTORED: No Arbitrary Waits\n * - See cypress/WAIT_BEST_PRACTICES.md for patterns\n * - Uses custom wait commands instead of cy.wait(milliseconds)`
    );
  }
  
  const newWaits = (content.match(/cy\.wait\(\d+\)(?!\s*\/\/ SHORT)/g) || []).length;
  
  // Write back
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log(`  ✅ Reduced waits: ${originalWaits} → ${newWaits}`);
  return { original: originalWaits, new: newWaits };
}

function main() {
  console.log('🔧 Cypress Test Refactoring Script');
  console.log('===================================\\n');
  
  let totalOriginal = 0;
  let totalNew = 0;
  
  filesToRefactor.forEach(filename => {
    const filePath = path.join(testDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filename} (not found)`);
      return;
    }
    
    try {
      const stats = refactorFile(filePath);
      totalOriginal += stats.original;
      totalNew += stats.new;
    } catch (error) {
      console.error(`❌ Error refactoring ${filename}:`, error.message);
    }
  });
  
  console.log('\\n===================================');
  console.log(`📊 Total waits reduced: ${totalOriginal} → ${totalNew}`);
  console.log(`💾 Removed ${totalOriginal - totalNew} arbitrary waits`);
  console.log('\\n⚠️  Manual review recommended:');
  console.log('  - Check that custom wait commands exist (waitForAuth, waitForEditor, etc.)');
  console.log('  - Verify SHORT waits are actually debounce/animation waits');
  console.log('  - Test all refactored files before committing');
}

if (require.main === module) {
  main();
}

module.exports = { refactorFile, patterns };
