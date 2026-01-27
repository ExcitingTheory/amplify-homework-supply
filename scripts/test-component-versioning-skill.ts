/**
 * Component Versioning Skill - Manual Test with Real Component
 * 
 * This script demonstrates using the component versioning skill with a real component.
 * 
 * IMPORTANT: This is a demonstration script. Do NOT run this in production without:
 * 1. Backing up your codebase
 * 2. Being on a feature branch
 * 3. Understanding it will CREATE new files (ChatSidebar2.tsx, etc.)
 * 
 * To test manually (SAFELY):
 * 1. Create a test branch: git checkout -b test-component-versioning
 * 2. Run: npx tsx scripts/test-component-versioning-skill.ts
 * 3. Review the created files
 * 4. Delete the branch when done: git checkout main && git branch -D test-component-versioning
 */

import * as path from 'path';
import { executeSkill } from '../src/agent-skills/component-versioning';

async function main() {
  console.log('Component Versioning Skill - Real Component Test\n');
  console.log('Testing with ChatSidebar component...\n');
  
  const componentPath = path.join(__dirname, '../src/components/ChatSidebar.js');
  
  console.log(`Input: ${componentPath}\n`);
  
  try {
    const result = await executeSkill({
      componentPath,
      // Auto-detect version (should create ChatSidebar2)
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error('❌ Skill execution failed:');
      result.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }
    
    console.log('✅ Success!\n');
    console.log(`Version: ${result.version}`);
    console.log(`New Component: ${result.newComponentPath}`);
    console.log(`Checklist: ${result.checklistPath}`);
    console.log(`\nSummary: ${result.summary}\n`);
    
    if (result.updatedImports.length > 0) {
      console.log('Import Updates:');
      result.updatedImports.forEach(imp => console.log(`  - ${imp}`));
      console.log('');
    }
    
    if (result.updatedExports.length > 0) {
      console.log('Export Updates:');
      result.updatedExports.forEach(exp => console.log(`  - ${exp}`));
      console.log('');
    }
    
    console.log('Files created:');
    console.log(`  ✓ ${result.newComponentPath}`);
    if (result.newStoryPath) {
      console.log(`  ✓ ${result.newStoryPath}`);
    }
    console.log(`  ✓ ${result.checklistPath}`);
    
    console.log('\n⚠️  REMINDER: Review these files and delete them if this was just a test!');
    console.log('To clean up: git checkout main && git clean -fd && git reset --hard');
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

main();
