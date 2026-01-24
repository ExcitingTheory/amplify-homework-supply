#!/usr/bin/env tsx
import { extractAllDocblocks, findDocblock } from './extract-component-docblocks.js';

async function test() {
  const docblocks = await extractAllDocblocks();
  console.log('Total docblocks:', docblocks.size);

  // Search for files with 'auth' in path
  const authBlocks = Array.from(docblocks.entries()).filter(([key]) => 
    key.toLowerCase().includes('auth')
  );

  console.log('\nFiles/components with "auth":', authBlocks.length);
  authBlocks.forEach(([key, val]) => {
    console.log(`  ${key} -> ${val.filePath}`);
  });

  // Test finding some components
  console.log('\n--- Component Lookup Tests ---');
  const tests = ['authenticator', 'ChatSidebar', 'PdfThumbnail', 'AIFeedbackWidget', 'DocumentSourceBadge'];
  
  for (const comp of tests) {
    const found = findDocblock(comp, docblocks);
    if (found) {
      console.log(`\n${comp}:`);
      console.log(`  Location: ${found.filePath}`);
      console.log(`  Description: ${found.description.substring(0, 150)}...`);
    } else {
      console.log(`\n${comp}: NOT FOUND`);
    }
  }
}

test();
