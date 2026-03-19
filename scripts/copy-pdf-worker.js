#!/usr/bin/env node
/**
 * Copy PDF.js worker from node_modules to public directory
 * Runs automatically after npm install via postinstall script
 */
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const dest = path.join(__dirname, '../public/pdf.worker.min.mjs');

try {
  // Ensure source exists
  if (!fs.existsSync(source)) {
    console.warn('⚠️  PDF.js worker not found in node_modules. Skipping copy.');
    process.exit(0);
  }

  // Copy file
  fs.copyFileSync(source, dest);
  console.log('✅ PDF.js worker copied to public directory');
} catch (error) {
  console.error('❌ Error copying PDF.js worker:', error.message);
  process.exit(1);
}
