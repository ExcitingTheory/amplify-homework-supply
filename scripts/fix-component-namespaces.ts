#!/usr/bin/env tsx

/**
 * Fix component useTranslation() calls to use correct namespace
 * Based on namespace mismatches from verification report
 */

import fs from 'fs';
import path from 'path';

const REPORT_PATH = path.join(process.cwd(), 'translation-verification-report.md');

interface NamespaceFix {
  file: string;
  from: string;
  to: string;
}

/**
 * Parse report to find files that need namespace fixes
 */
function parseReportForFixes(): Map<string, NamespaceFix> {
  const reportContent = fs.readFileSync(REPORT_PATH, 'utf-8');
  const fixes = new Map<string, NamespaceFix>();
  
  // Regex to match: ### key, Expected namespace, Found in namespace, Used in files
  const mismatchRegex = /### ([a-zA-Z0-9._-]+)\n\n- \*\*Expected namespace\*\*: `([^`]+)`\n- \*\*Found in namespace\*\*: `([^`]+)`\n- \*\*Used in\*\*:\n  - `([^`]+)`/g;
  
  let match;
  while ((match = mismatchRegex.exec(reportContent)) !== null) {
    const [, , expectedNamespace, foundInNamespace, file] = match;
    
    if (!fixes.has(file)) {
      fixes.set(file, {
        file,
        from: expectedNamespace,
        to: foundInNamespace
      });
    }
  }
  
  return fixes;
}

/**
 * Fix useTranslation() call in a file
 */
function fixNamespaceInFile(filePath: string, from: string, to: string): boolean {
  const absolutePath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`  ❌ File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(absolutePath, 'utf-8');
  
  // Pattern to match: useTranslation('from')
  const regex = new RegExp(`useTranslation\\s*\\(\\s*['"]${from}['"]\\s*\\)`, 'g');
  
  if (!regex.test(content)) {
    console.log(`  ⚠️  No useTranslation('${from}') found in ${path.basename(filePath)}`);
    return false;
  }
  
  // Replace the namespace
  content = content.replace(regex, `useTranslation('${to}')`);
  
  fs.writeFileSync(absolutePath, content, 'utf-8');
  return true;
}

async function main() {
  console.log('📄 Reading translation-verification-report.md...\n');
  
  if (!fs.existsSync(REPORT_PATH)) {
    console.error('❌ Report file not found. Run verify-and-add-translations.ts first.');
    process.exit(1);
  }
  
  const fixes = parseReportForFixes();
  
  if (fixes.size === 0) {
    console.log('✅ No namespace fixes needed!');
    return;
  }
  
  console.log(`🔄 Found ${fixes.size} files to fix\n`);
  
  // Group by namespace change
  const byChange = new Map<string, string[]>();
  for (const [file, { from, to }] of fixes.entries()) {
    const changeKey = `${from} → ${to}`;
    if (!byChange.has(changeKey)) {
      byChange.set(changeKey, []);
    }
    byChange.get(changeKey)!.push(file);
  }
  
  let fixedCount = 0;
  let skippedCount = 0;
  
  for (const [changeKey, files] of byChange.entries( )) {
    const [from, to] = changeKey.split(' → ');
    console.log(`\n📦 ${changeKey} (${files.length} files):`);
    
    for (const file of files) {
      const basename = path.basename(file);
      const fixed = fixNamespaceInFile(file, from, to);
      if (fixed) {
        fixedCount++;
        console.log(`  ✓ ${basename}`);
      } else {
        skippedCount++;
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} files (namespace not found)`);
  }
  console.log('\n💡 Next step: Run verify-and-add-translations.ts again to confirm');
}

main();
