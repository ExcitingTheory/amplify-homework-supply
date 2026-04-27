#!/usr/bin/env node
/**
 * Copy PDF.js worker and CMap files from node_modules to public directory
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

  // Copy worker file
  fs.copyFileSync(source, dest);
  console.log('✅ PDF.js worker copied to public directory');

  // Copy CMap files for CJK font support (Japanese, Chinese, Korean)
  const cmapSource = path.join(__dirname, '../node_modules/pdfjs-dist/cmaps');
  const cmapDest = path.join(__dirname, '../public/cmaps');

  if (fs.existsSync(cmapSource)) {
    if (!fs.existsSync(cmapDest)) {
      fs.mkdirSync(cmapDest, { recursive: true });
    }
    const cmapFiles = fs.readdirSync(cmapSource);
    for (const file of cmapFiles) {
      fs.copyFileSync(path.join(cmapSource, file), path.join(cmapDest, file));
    }
    console.log(`✅ ${cmapFiles.length} CMap files copied to public/cmaps/`);
  } else {
    console.warn('⚠️  CMap files not found in node_modules. Skipping copy.');
  }

  // Copy standard fonts for PDF rendering
  const fontsSource = path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts');
  const fontsDest = path.join(__dirname, '../public/standard_fonts');

  if (fs.existsSync(fontsSource)) {
    if (!fs.existsSync(fontsDest)) {
      fs.mkdirSync(fontsDest, { recursive: true });
    }
    const fontFiles = fs.readdirSync(fontsSource);
    for (const file of fontFiles) {
      fs.copyFileSync(path.join(fontsSource, file), path.join(fontsDest, file));
    }
    console.log(`✅ ${fontFiles.length} standard font files copied to public/standard_fonts/`);
  } else {
    console.warn('⚠️  Standard font files not found in node_modules. Skipping copy.');
  }
} catch (error) {
  console.error('❌ Error copying PDF.js assets:', error.message);
  process.exit(1);
}
