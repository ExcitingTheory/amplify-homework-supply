// scripts/reverse-translate.ts
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

interface ReverseResult {
  original: Record<string, any>;
  reverseTranslations: {
    claude: Record<string, any>;
    gpt: Record<string, any>;
    gemini: Record<string, any>;
  };
  comparison: {
    key: string;
    original: string;
    claude: string;
    gpt: string;
    gemini: string;
    semanticMatch: boolean;
    notes?: string;
  }[];
}

// Initialize clients
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function reverseTranslateWithClaude(targetText: string, targetLang: string): Promise<Record<string, any>> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Translate this ${targetLang} JSON back to English. Preserve structure and placeholders:\n\n${targetText}`
    }]
  });

  const content = message.content[0];
  const translationText = content.type === 'text' ? content.text : '';
  return JSON.parse(extractJSON(translationText));
}

async function reverseTranslateWithGPT(targetText: string, targetLang: string): Promise<Record<string, any>> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Translate this ${targetLang} JSON back to English. Preserve structure and placeholders:\n\n${targetText}`
    }],
    response_format: { type: 'json_object' }
  });

  const translationText = completion.choices[0].message.content || '{}';
  return JSON.parse(translationText);
}

async function reverseTranslateWithGemini(targetText: string, targetLang: string): Promise<Record<string, any>> {
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const result = await model.generateContent(
    `Translate this ${targetLang} JSON back to English. Preserve structure and placeholders. Return only valid JSON:\n\n${targetText}`
  );

  const response = await result.response;
  const translationText = response.text();
  return JSON.parse(extractJSON(translationText));
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};
  
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], newKey));
    } else {
      flattened[newKey] = String(obj[key]);
    }
  }
  
  return flattened;
}

function semanticSimilarity(original: string, reversed: string): { match: boolean; notes?: string } {
  // Normalize for comparison
  const norm1 = original.toLowerCase().trim().replace(/[.!?]/g, '');
  const norm2 = reversed.toLowerCase().trim().replace(/[.!?]/g, '');
  
  // Exact match
  if (norm1 === norm2) {
    return { match: true };
  }
  
  // Common synonyms/variations
  const synonyms: Record<string, string[]> = {
    'sign in': ['log in', 'login', 'sign-in', 'signin'],
    'sign out': ['log out', 'logout', 'sign-out', 'signout'],
    'sign up': ['register', 'create account', 'signup', 'sign-up'],
    'username': ['user name', 'login name'],
    'email': ['email address', 'e-mail'],
    'password': ['pass word'],
    'forgot password': ['forgotten password', 'reset password', 'lost password'],
    'send message': ['send a message', 'send msg'],
    'type a message': ['enter a message', 'write a message'],
    'save': ['save changes', 'store'],
    'cancel': ['abort', 'dismiss'],
    'delete': ['remove', 'erase'],
    'edit': ['modify', 'change'],
    'loading': ['loading...', 'please wait'],
    'error': ['an error occurred', 'something went wrong']
  };
  
  // Check if it's a known synonym pair
  for (const [base, variations] of Object.entries(synonyms)) {
    if ((norm1 === base && variations.includes(norm2)) || 
        (norm2 === base && variations.includes(norm1)) ||
        (variations.includes(norm1) && variations.includes(norm2))) {
      return { match: true, notes: 'Synonym variation' };
    }
  }
  
  // Check word overlap (at least 70% of words match)
  const words1 = norm1.split(/\s+/);
  const words2 = norm2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  const overlapRatio = commonWords.length / Math.max(words1.length, words2.length);
  
  if (overlapRatio >= 0.7) {
    return { match: true, notes: `${Math.round(overlapRatio * 100)}% word overlap` };
  }
  
  // Likely semantic drift
  return { match: false, notes: 'Semantic drift detected' };
}

async function reverseTranslateNamespace(
  namespace: string,
  sourceLang: string,
  targetLang: string
): Promise<ReverseResult> {
  const sourcePath = `public/locales/${sourceLang}/${namespace}.json`;
  const cacheDir = `.translation-cache/${new Date().toISOString().split('T')[0]}/${targetLang}`;
  
  const original = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
  
  console.log(`\n🔄 Reverse translating ${namespace} (${targetLang} → ${sourceLang})...`);
  console.log(`   Strategy: Each forward translation verified by OTHER models\n`);
  
  // Read the 3 forward translations (each by a different model)
  const claudeForward = JSON.parse(fs.readFileSync(`${cacheDir}/${namespace}-claude.json`, 'utf-8'));
  const gptForward = JSON.parse(fs.readFileSync(`${cacheDir}/${namespace}-gpt.json`, 'utf-8'));
  const geminiForward = JSON.parse(fs.readFileSync(`${cacheDir}/${namespace}-gemini.json`, 'utf-8'));
  
  // Cross-validation: reverse each translation with the OTHER 2 models
  console.log(`   Reversing Claude's translation with GPT & Gemini...`);
  const [claudeByGPT, claudeByGemini] = await Promise.all([
    reverseTranslateWithGPT(JSON.stringify(claudeForward), targetLang),
    reverseTranslateWithGemini(JSON.stringify(claudeForward), targetLang)
  ]);
  
  console.log(`   Reversing GPT's translation with Claude & Gemini...`);
  const [gptByClaude, gptByGemini] = await Promise.all([
    reverseTranslateWithClaude(JSON.stringify(gptForward), targetLang),
    reverseTranslateWithGemini(JSON.stringify(gptForward), targetLang)
  ]);
  
  console.log(`   Reversing Gemini's translation with Claude & GPT...`);
  const [geminiByClaude, geminiByGPT] = await Promise.all([
    reverseTranslateWithClaude(JSON.stringify(geminiForward), targetLang),
    reverseTranslateWithGPT(JSON.stringify(geminiForward), targetLang)
  ]);
  
  // Save reverse translations with cross-validation metadata
  const reverseResults = {
    claude: {
      forward: claudeForward,
      reversedBy: {
        gpt: claudeByGPT,
        gemini: claudeByGemini
      }
    },
    gpt: {
      forward: gptForward,
      reversedBy: {
        claude: gptByClaude,
        gemini: gptByGemini
      }
    },
    gemini: {
      forward: geminiForward,
      reversedBy: {
        claude: geminiByClaude,
        gpt: geminiByGPT
      }
    }
  };
  
  fs.writeFileSync(
    `${cacheDir}/${namespace}-reverse-results.json`,
    JSON.stringify(reverseResults, null, 2)
  );
  
  // Flatten for comparison
  const originalFlat = flattenObject(original);
  
  // Flatten all cross-validation reverse translations
  const claudeByGPTFlat = flattenObject(claudeByGPT);
  const claudeByGeminiFlat = flattenObject(claudeByGemini);
  const gptByClaudeFlat = flattenObject(gptByClaude);
  const gptByGeminiFlat = flattenObject(gptByGemini);
  const geminiByClaudeFlat = flattenObject(geminiByClaude);
  const geminiByGPTFlat = flattenObject(geminiByGPT);
  
  // Cross-validation comparison: check each translation against both validators
  const comparison = Object.keys(originalFlat).map(key => {
    const orig = originalFlat[key];
    
    // Claude's translation checked by GPT and Gemini
    const claudeGPT = claudeByGPTFlat[key] || '[MISSING]';
    const claudeGemini = claudeByGeminiFlat[key] || '[MISSING]';
    const claudeGPTMatch = semanticSimilarity(orig, claudeGPT);
    const claudeGeminiMatch = semanticSimilarity(orig, claudeGemini);
    const claudePass = claudeGPTMatch.match && claudeGeminiMatch.match;
    
    // GPT's translation checked by Claude and Gemini
    const gptClaude = gptByClaudeFlat[key] || '[MISSING]';
    const gptGemini = gptByGeminiFlat[key] || '[MISSING]';
    const gptClaudeMatch = semanticSimilarity(orig, gptClaude);
    const gptGeminiMatch = semanticSimilarity(orig, gptGemini);
    const gptPass = gptClaudeMatch.match && gptGeminiMatch.match;
    
    // Gemini's translation checked by Claude and GPT
    const geminiClaude = geminiByClaudeFlat[key] || '[MISSING]';
    const geminiGPT = geminiByGPTFlat[key] || '[MISSING]';
    const geminiClaudeMatch = semanticSimilarity(orig, geminiClaude);
    const geminiGPTMatch = semanticSimilarity(orig, geminiGPT);
    const geminiPass = geminiClaudeMatch.match && geminiGPTMatch.match;
    
    const allPass = claudePass && gptPass && geminiPass;
    
    return {
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
      notes: !allPass ? [
        !claudePass ? `Claude: ${claudeGPTMatch.notes || ''} ${claudeGeminiMatch.notes || ''}` : null,
        !gptPass ? `GPT: ${gptClaudeMatch.notes || ''} ${gptGeminiMatch.notes || ''}` : null,
        !geminiPass ? `Gemini: ${geminiClaudeMatch.notes || ''} ${geminiGPTMatch.notes || ''}` : null
      ].filter(Boolean).join('; ') : undefined
    };
  });
  
  return {
    original,
    reverseResults,
    comparison
  };
}

async function main() {
  const [namespace, sourceLang, targetLang] = process.argv.slice(2);
  
  if (!namespace || !sourceLang || !targetLang) {
    console.error('Usage: npx tsx scripts/reverse-translate.ts <namespace> <sourceLang> <targetLang>');
    console.error('Example: npx tsx scripts/reverse-translate.ts auth en ja');
    process.exit(1);
  }
  
  const result = await reverseTranslateNamespace(namespace, sourceLang, targetLang);
  
  // Cross-validation summary
  const totalKeys = result.comparison.length;
  const passedKeys = result.comparison.filter(c => c.crossValidationPass).length;
  const accuracy = Math.round((passedKeys / totalKeys) * 100);
  
  console.log(`\n✅ Cross-validation complete`);
  console.log(`   Accuracy: ${passedKeys}/${totalKeys} keys (${accuracy}%)`);
  
  // Count how many translations passed for each model
  const claudePasses = result.comparison.filter(c => c.claude.pass).length;
  const gptPasses = result.comparison.filter(c => c.gpt.pass).length;
  const geminiPasses = result.comparison.filter(c => c.gemini.pass).length;
  
  console.log(`\n   Individual model validation:`);
  console.log(`     Claude:  ${claudePasses}/${totalKeys} (${Math.round(claudePasses/totalKeys*100)}%) verified by GPT & Gemini`);
  console.log(`     GPT:     ${gptPasses}/${totalKeys} (${Math.round(gptPasses/totalKeys*100)}%) verified by Claude & Gemini`);
  console.log(`     Gemini:  ${geminiPasses}/${totalKeys} (${Math.round(geminiPasses/totalKeys*100)}%) verified by Claude & GPT`);
  
  // Show failed cross-validations
  const failures = result.comparison.filter(c => !c.crossValidationPass);
  if (failures.length > 0) {
    console.log(`\n⚠️  ${failures.length} key(s) failed cross-validation:\n`);
    failures.forEach(f => {
      console.log(`   ${f.key}:`);
      console.log(`     Original: "${f.original}"`);
      
      if (!f.claude.pass) {
        console.log(`     ❌ Claude's translation:`);
        console.log(`        By GPT:    "${f.claude.byGPT}"`);
        console.log(`        By Gemini: "${f.claude.byGemini}"`);
      }
      
      if (!f.gpt.pass) {
        console.log(`     ❌ GPT's translation:`);
        console.log(`        By Claude: "${f.gpt.byClaude}"`);
        console.log(`        By Gemini: "${f.gpt.byGemini}"`);
      }
      
      if (!f.gemini.pass) {
        console.log(`     ❌ Gemini's translation:`);
        console.log(`        By Claude: "${f.gemini.byClaude}"`);
        console.log(`        By GPT:    "${f.gemini.byGPT}"`);
      }
      
      if (f.notes) console.log(`     Notes: ${f.notes}`);
      console.log();
    });
  } else {
    console.log(`\n✅ All keys passed cross-validation!`);
  }
}

main().catch(console.error);
