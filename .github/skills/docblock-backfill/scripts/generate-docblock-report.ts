#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';
import { validateDocblocks } from './validate-docblocks';

/**
 * Generates a comprehensive docblock coverage report
 */

interface ReportData {
  timestamp: string;
  validation: any;
  coverage: {
    total: number;
    documented: number;
    percentage: number;
    byType: Record<string, { total: number; documented: number; percentage: number }>;
  };
  recommendations: string[];
}

async function generateReport(): Promise<void> {
  console.log('📊 Generating docblock coverage report...\n');
  
  const validation = await validateDocblocks({ report: false });
  
  const report: ReportData = {
    timestamp: new Date().toISOString(),
    validation,
    coverage: {
      total: validation.totalFiles,
      documented: validation.filesWithDocblocks,
      percentage: Math.round((validation.filesWithDocblocks / validation.totalFiles) * 100),
      byType: {}
    },
    recommendations: []
  };
  
  // Generate recommendations based on results
  if (report.coverage.percentage < 50) {
    report.recommendations.push('CRITICAL: Less than 50% of files have docblocks. Run backfill-docblocks.ts to improve coverage.');
  } else if (report.coverage.percentage < 75) {
    report.recommendations.push('WARNING: Documentation coverage below 75%. Consider backfilling missing docblocks.');
  }
  
  if (validation.issues.length > 0) {
    const errorCount = validation.issues.filter(i => i.severity === 'error').length;
    if (errorCount > 0) {
      report.recommendations.push(`Found ${errorCount} critical documentation errors. Run validate-docblocks.ts --fix to resolve.`);
    }
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'docblock-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📄 Report Details:');
  console.log(`  - Total files: ${report.coverage.total}`);
  console.log(`  - Documented: ${report.coverage.documented} (${report.coverage.percentage}%)`);
  console.log(`  - Issues: ${validation.issues.length}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
}

// CLI execution
if (require.main === module) {
  generateReport()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

export { generateReport };
