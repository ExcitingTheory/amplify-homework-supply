const fs = require('fs');

const file = 'cypress/e2e/global-chat.cy.ts';
let content = fs.readFileSync(file, 'utf8');

// Count before
const beforeCount = (content.match(/cy\.wait\([2-9][0-9][0-9][0-9]\)/g) || []).length;
console.log(`Found ${beforeCount} arbitrary waits before refactoring`);

// Replace cy.visit + cy.wait(2000) after navigation
content = content.replace(/cy\.visit\('\/'\);\s+cy\.wait\(2000\);/g, 
  "cy.visit('/');\n      cy.waitForPageLoad();");

// Replace trailing cy.wait(2000) after helper functions
content = content.replace(/(openChatViaButton\(\);)\s+cy\.wait\(2000\);/g, '$1');
content = content.replace(/(closeChatViaButton\(\);)\s+cy\.wait\(2000\);/g, '$1');
content = content.replace(/(toggleChatViaKeyboard\(\);)\s+cy\.wait\(2000\);/g, '$1');
content = content.replace(/(sendChatMessage\([^)]+\);)\s+cy\.wait\(2000\);/g, '$1');

// Replace cy.wait(2000) after visibility checks (redundant)
content = content.replace(/\.should\('be\.visible'\);\s+cy\.wait\(2000\);/g, ".should('be.visible');");
content = content.replace(/\.should\('not\.exist'\);\s+cy\.wait\(2000\);/g, ".should('not.exist');");

// Count after
const afterCount = (content.match(/cy\.wait\([2-9][0-9][0-9][0-9]\)/g) || []).length;
console.log(`Found ${afterCount} arbitrary waits after refactoring`);
console.log(`Removed ${beforeCount - afterCount} waits`);

// Write back
fs.writeFileSync(file, content, 'utf8');
console.log('✅ Refactoring complete');
