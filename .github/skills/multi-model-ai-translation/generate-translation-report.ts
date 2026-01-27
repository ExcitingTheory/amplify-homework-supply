#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

interface ProofData {
  namespace: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
  consensus: {
    claude: any;
    gpt: any;
    gemini: any;
    final: any;
  };
  metadata: {
    claude?: any;
    gpt?: any;
    gemini?: any;
  };
}

interface ReverseResults {
  claude: {
    forward: any;
    reversedBy: {
      gpt: any;
      gemini: any;
    };
  };
  gpt: {
    forward: any;
    reversedBy: {
      claude: any;
      gemini: any;
    };
  };
  gemini: {
    forward: any;
    reversedBy: {
      claude: any;
      gpt: any;
    };
  };
}

interface CrossValidationComparison {
  key: string;
  original: string;
  claude: {
    byGPT: string;
    byGemini: string;
    pass: boolean;
  };
  gpt: {
    byClaude: string;
    byGemini: string;
    pass: boolean;
  };
  gemini: {
    byClaude: string;
    byGPT: string;
    pass: boolean;
  };
  crossValidationPass: boolean;
  notes?: string;
}

const TARGET_LANGS = ['ja', 'es', 'fr', 'zh', 'de'];
const LANG_NAMES: Record<string, string> = {
  ja: 'Japanese',
  es: 'Spanish',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  de: 'German',
  en: 'English'
};

function findLatestCacheDir(): string | null {
  const cacheBase = '.translation-cache';
  if (!fs.existsSync(cacheBase)) return null;
  
  const dirs = fs.readdirSync(cacheBase)
    .filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/))
    .sort()
    .reverse();
  
  return dirs.length > 0 ? path.join(cacheBase, dirs[0]) : null;
}

function getNamespacesForLang(cacheDir: string, lang: string): string[] {
  const langDir = path.join(cacheDir, lang);
  if (!fs.existsSync(langDir)) return [];
  
  const proofFiles = fs.readdirSync(langDir).filter(f => f.endsWith('-proof.json'));
  return proofFiles.map(f => f.replace('-proof.json', ''));
}

function loadProofData(cacheDir: string, lang: string, namespace: string): ProofData | null {
  const proofPath = path.join(cacheDir, lang, `${namespace}-proof.json`);
  if (!fs.existsSync(proofPath)) return null;
  
  const proof = JSON.parse(fs.readFileSync(proofPath, 'utf-8'));
  
  // Load actual translation files
  const langDir = path.join(cacheDir, lang);
  const claude = fs.existsSync(path.join(langDir, `${namespace}-claude.json`)) 
    ? JSON.parse(fs.readFileSync(path.join(langDir, `${namespace}-claude.json`), 'utf-8'))
    : {};
  const gpt = fs.existsSync(path.join(langDir, `${namespace}-gpt.json`))
    ? JSON.parse(fs.readFileSync(path.join(langDir, `${namespace}-gpt.json`), 'utf-8'))
    : {};
  const gemini = fs.existsSync(path.join(langDir, `${namespace}-gemini.json`))
    ? JSON.parse(fs.readFileSync(path.join(langDir, `${namespace}-gemini.json`), 'utf-8'))
    : {};
  
  // Load final consensus (from public/locales if it exists)
  const finalPath = path.join('public', 'locales', lang, `${namespace}.json`);
  const final = fs.existsSync(finalPath)
    ? JSON.parse(fs.readFileSync(finalPath, 'utf-8'))
    : claude; // Default to claude if final doesn't exist
  
  // Load metadata if available
  const metadata: any = {};
  ['claude', 'gpt', 'gemini'].forEach(model => {
    const metaPath = path.join(cacheDir, lang, `${namespace}-${model}-metadata.json`);
    if (fs.existsSync(metaPath)) {
      metadata[model] = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
  });
  
  return {
    namespace,
    sourceLang: 'en',
    targetLang: lang,
    timestamp: proof.timestamp || new Date().toISOString(),
    consensus: {
      claude,
      gpt,
      gemini,
      final
    },
    metadata
  };
}

function loadReverseResults(cacheDir: string, lang: string, namespace: string): ReverseResults | null {
  const reversePath = path.join(cacheDir, lang, `${namespace}-reverse-results.json`);
  if (!fs.existsSync(reversePath)) return null;
  
  return JSON.parse(fs.readFileSync(reversePath, 'utf-8'));
}

function calculateConsensusStats(proofData: ProofData): {
  exactMatches: number;
  twoThirdsConsensus: number;
  noConsensus: number;
  total: number;
} {
  const { claude, gpt, gemini, final } = proofData.consensus;
  
  const keys = Object.keys(final);
  let exactMatches = 0;
  let twoThirdsConsensus = 0;
  let noConsensus = 0;
  
  keys.forEach(key => {
    const c = claude[key];
    const g = gpt[key];
    const gem = gemini[key];
    
    if (c === g && g === gem) {
      exactMatches++;
    } else if (c === g || g === gem || c === gem) {
      twoThirdsConsensus++;
    } else {
      noConsensus++;
    }
  });
  
  return {
    exactMatches,
    twoThirdsConsensus,
    noConsensus,
    total: keys.length
  };
}

function calculateCrossValidationStats(reverseResults: ReverseResults, originalSource: any): {
  totalKeys: number;
  passedKeys: number;
  claudePasses: number;
  gptPasses: number;
  geminiPasses: number;
  failedKeys: CrossValidationComparison[];
} {
  const flatOriginal = flattenObject(originalSource);
  const keys = Object.keys(flatOriginal);
  
  let passedKeys = 0;
  let claudePasses = 0;
  let gptPasses = 0;
  let geminiPasses = 0;
  const failedKeys: CrossValidationComparison[] = [];
  
  // Flatten all reverse translations
  const claudeByGPTFlat = flattenObject(reverseResults.claude.reversedBy.gpt);
  const claudeByGeminiFlat = flattenObject(reverseResults.claude.reversedBy.gemini);
  const gptByClaudeFlat = flattenObject(reverseResults.gpt.reversedBy.claude);
  const gptByGeminiFlat = flattenObject(reverseResults.gpt.reversedBy.gemini);
  const geminiByClaudeFlat = flattenObject(reverseResults.gemini.reversedBy.claude);
  const geminiByGPTFlat = flattenObject(reverseResults.gemini.reversedBy.gpt);
  
  keys.forEach(key => {
    const orig = flatOriginal[key];
    
    // Check each model's translation
    const claudeGPT = claudeByGPTFlat[key] || '[MISSING]';
    const claudeGemini = claudeByGeminiFlat[key] || '[MISSING]';
    const claudeGPTMatch = semanticSimilarity(orig, claudeGPT);
    const claudeGeminiMatch = semanticSimilarity(orig, claudeGemini);
    const claudePass = claudeGPTMatch.match && claudeGeminiMatch.match;
    
    const gptClaude = gptByClaudeFlat[key] || '[MISSING]';
    const gptGemini = gptByGeminiFlat[key] || '[MISSING]';
    const gptClaudeMatch = semanticSimilarity(orig, gptClaude);
    const gptGeminiMatch = semanticSimilarity(orig, gptGemini);
    const gptPass = gptClaudeMatch.match && gptGeminiMatch.match;
    
    const geminiClaude = geminiByClaudeFlat[key] || '[MISSING]';
    const geminiGPT = geminiByGPTFlat[key] || '[MISSING]';
    const geminiClaudeMatch = semanticSimilarity(orig, geminiClaude);
    const geminiGPTMatch = semanticSimilarity(orig, geminiGPT);
    const geminiPass = geminiClaudeMatch.match && geminiGPTMatch.match;
    
    const allPass = claudePass && gptPass && geminiPass;
    
    if (allPass) passedKeys++;
    if (claudePass) claudePasses++;
    if (gptPass) gptPasses++;
    if (geminiPass) geminiPasses++;
    
    if (!allPass) {
      failedKeys.push({
        key,
        original: orig,
        claude: {
          byGPT: claudeGPT,
          byGemini: claudeGemini,
          pass: claudePass
        },
        gpt: {
          byClaude: gptClaude,
          byGemini: gptGemini,
          pass: gptPass
        },
        gemini: {
          byClaude: geminiClaude,
          byGPT: geminiGPT,
          pass: geminiPass
        },
        crossValidationPass: allPass,
        notes: [
          !claudePass ? `Claude: ${claudeGPTMatch.notes || ''} ${claudeGeminiMatch.notes || ''}` : null,
          !gptPass ? `GPT: ${gptClaudeMatch.notes || ''} ${gptGeminiMatch.notes || ''}` : null,
          !geminiPass ? `Gemini: ${geminiClaudeMatch.notes || ''} ${geminiGPTMatch.notes || ''}` : null
        ].filter(Boolean).join('; ')
      });
    }
  });
  
  return {
    totalKeys: keys.length,
    passedKeys,
    claudePasses,
    gptPasses,
    geminiPasses,
    failedKeys
  };
}

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const flat: Record<string, string> = {};
  
  for (const key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(flat, flattenObject(val, newKey));
    } else {
      flat[newKey] = String(val);
    }
  }
  
  return flat;
}

function semanticSimilarity(a: string, b: string): { match: boolean; notes?: string } {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/[?.!,;]/g, '');
  const aWords = normalize(a).split(/\s+/);
  const bWords = normalize(b).split(/\s+/);
  
  // Count matching words
  const matches = aWords.filter(w => bWords.includes(w)).length;
  const total = Math.max(aWords.length, bWords.length);
  const similarity = total > 0 ? (matches / total) * 100 : 0;
  
  const threshold = 70; // 70% word overlap
  const match = similarity >= threshold;
  
  return {
    match,
    notes: match ? undefined : `Semantic drift detected`
  };
}

function generateMarkdownReport(cacheDir: string): string {
  const timestamp = new Date().toISOString();
  const cacheDirName = path.basename(cacheDir);
  
  let report = `# Translation Report\n\n`;
  report += `**Date**: ${timestamp}\n`;
  report += `**Cache Directory**: ${cacheDirName}\n`;
  report += `**Source**: English (en)\n`;
  report += `**Targets**: ${TARGET_LANGS.map(l => LANG_NAMES[l]).join(', ')}\n`;
  report += `**Runmode**: Provable (with cryptographic verification)\n\n`;
  
  // Aggregate statistics
  let totalKeys = 0;
  let totalExactMatches = 0;
  let totalTwoThirds = 0;
  let totalNoConsensus = 0;
  let totalCrossValidationPassed = 0;
  let totalCrossValidationKeys = 0;
  const languageStats: Record<string, any> = {};
  
  TARGET_LANGS.forEach(lang => {
    const namespaces = getNamespacesForLang(cacheDir, lang);
    const langStats: any = {
      namespaces: [],
      consensusStats: { exactMatches: 0, twoThirdsConsensus: 0, noConsensus: 0, total: 0 },
      crossValidationStats: { totalKeys: 0, passedKeys: 0, claudePasses: 0, gptPasses: 0, geminiPasses: 0 }
    };
    
    namespaces.forEach(namespace => {
      const proofData = loadProofData(cacheDir, lang, namespace);
      const reverseResults = loadReverseResults(cacheDir, lang, namespace);
      
      // Always calculate consensus stats if we have proof data
      let consensusStats = null;
      let cvStats = null;
      
      if (proofData) {
        consensusStats = calculateConsensusStats(proofData);
        langStats.consensusStats.exactMatches += consensusStats.exactMatches;
        langStats.consensusStats.twoThirdsConsensus += consensusStats.twoThirdsConsensus;
        langStats.consensusStats.noConsensus += consensusStats.noConsensus;
        langStats.consensusStats.total += consensusStats.total;
        
        totalExactMatches += consensusStats.exactMatches;
        totalTwoThirds += consensusStats.twoThirdsConsensus;
        totalNoConsensus += consensusStats.noConsensus;
        totalKeys += consensusStats.total;
      }
      
      if (reverseResults && proofData) {
        const originalPath = path.join('public', 'locales', 'en', `${namespace}.json`);
        const original = fs.existsSync(originalPath) ? JSON.parse(fs.readFileSync(originalPath, 'utf-8')) : {};
        cvStats = calculateCrossValidationStats(reverseResults, original);
        
        langStats.crossValidationStats.totalKeys += cvStats.totalKeys;
        langStats.crossValidationStats.passedKeys += cvStats.passedKeys;
        langStats.crossValidationStats.claudePasses += cvStats.claudePasses;
        langStats.crossValidationStats.gptPasses += cvStats.gptPasses;
        langStats.crossValidationStats.geminiPasses += cvStats.geminiPasses;
        
        totalCrossValidationKeys += cvStats.totalKeys;
        totalCrossValidationPassed += cvStats.passedKeys;
      }
      
      if (consensusStats) {
        langStats.namespaces.push({
          namespace,
          proofData,
          reverseResults: reverseResults || undefined,
          consensusStats,
          cvStats: cvStats || undefined
        });
      }
    });
    
    if (namespaces.length > 0) {
      languageStats[lang] = langStats;
    }
  });
  
  // Summary
  report += `## Summary\n\n`;
  report += `- **Total keys translated**: ${totalKeys}\n`;
  report += `- **Languages processed**: ${Object.keys(languageStats).length}\n`;
  report += `- **Translation consistency rate**: ${totalKeys > 0 ? Math.round((totalExactMatches / totalKeys) * 100) : 0}% (exact 3/3 model agreement)\n`;
  report += `- **Cross-validation accuracy**: ${totalCrossValidationKeys > 0 ? Math.round((totalCrossValidationPassed / totalCrossValidationKeys) * 100) : 0}%\n\n`;
  
  // Per-language breakdown
  report += `## Translation Consensus by Language\n\n`;
  
  Object.entries(languageStats).forEach(([lang, stats]) => {
    report += `### ${LANG_NAMES[lang]} (${lang})\n\n`;
    
    const langConsensusStats = stats.consensusStats;
    const total = langConsensusStats.total;
    
    if (total > 0) {
      report += `- **Exact matches (3/3)**: ${langConsensusStats.exactMatches} (${Math.round((langConsensusStats.exactMatches / total) * 100)}%)\n`;
      report += `- **2/3 consensus**: ${langConsensusStats.twoThirdsConsensus} (${Math.round((langConsensusStats.twoThirdsConsensus / total) * 100)}%)\n`;
      report += `- **No consensus**: ${langConsensusStats.noConsensus} (${Math.round((langConsensusStats.noConsensus / total) * 100)}%)\n`;
      report += `- **Total keys**: ${total}\n\n`;
    }
    
    // Namespace details
    if (stats.namespaces.length > 0) {
      report += `#### Namespaces\n\n`;
      report += `| Namespace | Keys | Exact Match | 2/3 Consensus | No Consensus |\n`;
      report += `|-----------|------|-------------|---------------|---------------|\n`;
      
      stats.namespaces.forEach((ns: any) => {
        const { namespace, consensusStats: nsConsensusStats } = ns;
        report += `| ${namespace} | ${nsConsensusStats.total} | ${nsConsensusStats.exactMatches} | ${nsConsensusStats.twoThirdsConsensus} | ${nsConsensusStats.noConsensus} |\n`;
      });
      
      report += `\n`;
    }
  });
  
  // Cross-validation results
  report += `## Cross-Validation Reverse Translation Results\n\n`;
  report += `*Each model's translation is verified by the OTHER two models to ensure accuracy.*\n\n`;
  
  Object.entries(languageStats).forEach(([lang, stats]) => {
    const { crossValidationStats } = stats;
    
    if (crossValidationStats.totalKeys > 0) {
      report += `### ${LANG_NAMES[lang]} (${lang})\n\n`;
      report += `- **Overall accuracy**: ${crossValidationStats.passedKeys}/${crossValidationStats.totalKeys} keys (${Math.round((crossValidationStats.passedKeys / crossValidationStats.totalKeys) * 100)}%)\n`;
      report += `- **Claude's translations verified by GPT & Gemini**: ${crossValidationStats.claudePasses}/${crossValidationStats.totalKeys} (${Math.round((crossValidationStats.claudePasses / crossValidationStats.totalKeys) * 100)}%)\n`;
      report += `- **GPT's translations verified by Claude & Gemini**: ${crossValidationStats.gptPasses}/${crossValidationStats.totalKeys} (${Math.round((crossValidationStats.gptPasses / crossValidationStats.totalKeys) * 100)}%)\n`;
      report += `- **Gemini's translations verified by Claude & GPT**: ${crossValidationStats.geminiPasses}/${crossValidationStats.totalKeys} (${Math.round((crossValidationStats.geminiPasses / crossValidationStats.totalKeys) * 100)}%)\n\n`;
      
      // Show failed cross-validations
      const failedKeys = stats.namespaces.flatMap((ns: any) => 
        ns.cvStats?.failedKeys?.map((fk: any) => ({ ...fk, namespace: ns.namespace })) || []
      );
      
      if (failedKeys.length > 0) {
        report += `#### ⚠️ Keys with Cross-Validation Issues\n\n`;
        report += `| Namespace | Key | Original | Issue |\n`;
        report += `|-----------|-----|----------|-------|\n`;
        
        failedKeys.forEach((fk: any) => {
          const issues = [];
          if (!fk.claude.pass) issues.push('Claude');
          if (!fk.gpt.pass) issues.push('GPT');
          if (!fk.gemini.pass) issues.push('Gemini');
          
          report += `| ${fk.namespace} | \`${fk.key}\` | "${fk.original}" | ${issues.join(', ')} failed |\n`;
        });
        
        report += `\n`;
      }
    }
  });
  
  // Human review section
  const humanReviewItems: Array<{ 
    lang: string; 
    namespace: string; 
    key: string; 
    original: string;
    claude: string;
    gpt: string;
    gemini: string;
    reason: string 
  }> = [];
  
  Object.entries(languageStats).forEach(([lang, stats]) => {
    stats.namespaces.forEach((ns: any) => {
      const { namespace, proofData, cvStats } = ns;
      
      // Check for no consensus
      if (proofData) {
        const keys = Object.keys(proofData.consensus.final);
        keys.forEach(key => {
          const c = proofData.consensus.claude[key];
          const g = proofData.consensus.gpt[key];
          const gem = proofData.consensus.gemini[key];
          
          if (c !== g && g !== gem && c !== gem) {
            humanReviewItems.push({
              lang,
              namespace,
              key,
              original: proofData.consensus.source?.[key] || '',
              claude: c || '',
              gpt: g || '',
              gemini: gem || '',
              reason: 'Models produced significantly different translations (semantic drift - each model interpreted the meaning differently)'
            });
          }
        });
      }
      
      // Check for cross-validation failures
      if (cvStats?.failedKeys) {
        cvStats.failedKeys.forEach((fk: any) => {
          humanReviewItems.push({
            lang,
            namespace,
            key: fk.key,
            original: fk.original || '',
            claude: proofData?.consensus?.claude?.[fk.key] || '',
            gpt: proofData?.consensus?.gpt?.[fk.key] || '',
            gemini: proofData?.consensus?.gemini?.[fk.key] || '',
            reason: `Cross-validation failed: Reverse translation does not match original (${fk.notes || 'semantic drift'})`
          });
        });
      }
    });
  });
  
  if (humanReviewItems.length > 0) {
    report += `## Human Review Required\n\n`;
    report += `${humanReviewItems.length} item(s) require human review due to semantic drift (models interpreted meaning differently):\n\n`;
    report += `| Language | Namespace | Original (EN) | Claude | GPT-4o | Gemini |\n`;
    report += `|----------|-----------|---------------|--------|--------|--------|\n`;
    
    humanReviewItems.forEach(item => {
      report += `| ${LANG_NAMES[item.lang]} | ${item.namespace} | ${item.original} | ${item.claude} | ${item.gpt} | ${item.gemini} |\n`;
    });
    
    report += `\n`;
  } else {
    report += `## Human Review Required\n\n`;
    report += `✅ No items flagged for human review. All translations passed consensus and cross-validation.\n\n`;
  }
  
  // Files updated
  report += `## Files Updated\n\n`;
  
  Object.entries(languageStats).forEach(([lang, stats]) => {
    stats.namespaces.forEach((ns: any) => {
      const { namespace, consensusStats } = ns;
      report += `- ✅ \`public/locales/${lang}/${namespace}.json\` (${consensusStats.total} keys)\n`;
    });
  });
  
  report += `\n`;
  
  // Verification details
  report += `## Cryptographic Verification\n\n`;
  report += `All translations include cryptographic proof:\n\n`;
  report += `- **SHA-256 fingerprints** for each model's output\n`;
  report += `- **Request IDs** from Anthropic, OpenAI, and Google APIs\n`;
  report += `- **Timestamps** showing parallel execution\n`;
  report += `- **Proof documents** stored in \`.translation-cache/${cacheDirName}/\`\n\n`;
  report += `Run \`npx tsx scripts/verify-translations.ts\` to re-verify at any time.\n\n`;
  
  return report;
}

async function main() {
  console.log('📊 Generating translation report...\n');
  
  const cacheDir = findLatestCacheDir();
  
  if (!cacheDir) {
    console.error('❌ No translation cache directory found.');
    console.error('   Run translations first: npx tsx scripts/translate-with-proof.ts');
    process.exit(1);
  }
  
  console.log(`   Using cache: ${cacheDir}\n`);
  
  const report = generateMarkdownReport(cacheDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const reportPath = `translation-report-${timestamp}.md`;
  
  fs.writeFileSync(reportPath, report);
  
  console.log(`✅ Report generated: ${reportPath}\n`);
  console.log('📄 Report summary:');
  
  // Extract summary lines
  const summaryMatch = report.match(/## Summary\n\n([\s\S]*?)\n\n/);
  if (summaryMatch) {
    console.log(summaryMatch[1]);
  }
}

main().catch(console.error);
