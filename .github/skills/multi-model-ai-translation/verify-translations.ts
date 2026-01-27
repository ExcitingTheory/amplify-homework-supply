// scripts/verify-translations.ts
import * as fs from 'fs';
import * as crypto from 'crypto';

function verifyTranslation(cacheDir: string, namespace: string) {
  const models = ['claude', 'gpt', 'gemini'];
  const verification: any = {};

  for (const model of models) {
    const translationPath = `${cacheDir}/${namespace}-${model}.json`;
    const metadataPath = `${cacheDir}/${namespace}-${model}-metadata.json`;

    if (!fs.existsSync(translationPath) || !fs.existsSync(metadataPath)) {
      verification[model] = { valid: false, reason: 'Missing files' };
      continue;
    }

    const translation = JSON.parse(fs.readFileSync(translationPath, 'utf-8'));
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Verify fingerprint matches
    const computedFingerprint = crypto.createHash('sha256')
      .update(JSON.stringify(translation))
      .digest('hex');

    verification[model] = {
      valid: computedFingerprint === metadata.fingerprint,
      model: metadata.model,
      provider: metadata.provider,
      requestId: metadata.requestId,
      timestamp: metadata.timestamp,
      fingerprintMatch: computedFingerprint === metadata.fingerprint
    };
  }

  return verification;
}

// Verify all translations for all languages
const languages = ['ja', 'es', 'fr', 'zh', 'de'];
const namespaces = ['auth', 'chat', 'common', 'editor', 'errors', 'grades', 'units'];

// Use today's date folder
const today = new Date().toISOString().split('T')[0];
console.log(`\n=== Translation Verification Report ===`);
console.log(`Date: ${today}\n`);

let totalValid = 0;
let totalChecked = 0;

languages.forEach(lang => {
  console.log(`\n--- ${lang.toUpperCase()} ---`);
  const cacheDir = `.translation-cache/${today}/${lang}`;
  
  if (!fs.existsSync(cacheDir)) {
    console.log(`  ⚠️  Cache directory not found: ${cacheDir}`);
    return;
  }
  
  namespaces.forEach(namespace => {
    const result = verifyTranslation(cacheDir, namespace);
    const validCount = Object.values(result).filter((r: any) => r.valid).length;
    totalValid += validCount;
    totalChecked += 3; // 3 models per namespace
    
    const status = validCount === 3 ? '✅' : validCount > 0 ? '⚠️' : '❌';
    console.log(`  ${status} ${namespace}: ${validCount}/3 models verified`);
    
    // Show details if not all valid
    if (validCount < 3) {
      Object.entries(result).forEach(([model, data]: [string, any]) => {
        if (!data.valid) {
          console.log(`      ${model}: ${data.reason || 'Fingerprint mismatch'}`);
        }
      });
    }
  });
});

console.log(`\n=== Summary ===`);
console.log(`Total verified: ${totalValid}/${totalChecked} (${Math.round(totalValid/totalChecked*100)}%)`);
console.log(`Languages: ${languages.length}`);
console.log(`Namespaces per language: ${namespaces.length}`);
console.log(`Total translation files: ${languages.length * namespaces.length}\n`);