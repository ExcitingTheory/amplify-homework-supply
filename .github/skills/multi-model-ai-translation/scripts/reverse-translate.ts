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
    translategemma: Record<string, any>;
  };
  comparison: {
    key: string;
    original: string;
    claude: {
      byGPT: string;
      byGemma: string;
      pass: boolean;
    };
    gpt: {
      byClaude: string;
      byGemma: string;
      pass: boolean;
    };
    translategemma: {
      byClaude: string;
      byGPT: string;
      pass: boolean;
    };
    crossValidationPass: boolean;
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

async function reverseTranslateWithGemma(targetText: string, targetLang: string): Promise<Record<string, any>> {
  const model = gemini.getGenerativeModel({ model: 'gemma-3-12b-it' });
  
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
  const gemmaForward = JSON.parse(fs.readFileSync(`${cacheDir}/${namespace}-translategemma.json`, 'utf-8'));
  
  // Cross-validation: reverse each translation with the OTHER 2 models
  console.log(`   Reversing Claude's translation with GPT & Gemma...`);
  const claudeReverseResults = await Promise.allSettled([
    reverseTranslateWithGPT(JSON.stringify(claudeForward), targetLang),
    reverseTranslateWithGemma(JSON.stringify(claudeForward), targetLang)
  ]);
  const claudeByGPT = claudeReverseResults[0].status === 'fulfilled' ? claudeReverseResults[0].value : {};
  const claudeByGemma = claudeReverseResults[1].status === 'fulfilled' ? claudeReverseResults[1].value : {};
  if (claudeReverseResults[0].status === 'rejected') console.warn(`   ⚠️  GPT reverse failed: ${claudeReverseResults[0].reason}`);\n  if (claudeReverseResults[1].status === 'rejected') console.warn(`   ⚠️  Gemma reverse failed: ${claudeReverseResults[1].reason}`);\n  \n  console.log(`   Reversing GPT's translation with Claude & Gemma...`);
  const gptReverseResults = await Promise.allSettled([
    reverseTranslateWithClaude(JSON.stringify(gptForward), targetLang),
    reverseTranslateWithGemma(JSON.stringify(gptForward), targetLang)
  ]);
  const gptByClaude = gptReverseResults[0].status === 'fulfilled' ? gptReverseResults[0].value : {};
  const gptByGemma = gptReverseResults[1].status === 'fulfilled' ? gptReverseResults[1].value : {};
  if (gptReverseResults[0].status === 'rejected') console.warn(`   ⚠️  Claude reverse failed: ${gptReverseResults[0].reason}`);\n  if (gptReverseResults[1].status === 'rejected') console.warn(`   ⚠️  Gemma reverse failed: ${gptReverseResults[1].reason}`);\n  \n  console.log(`   Reversing Gemma's translation with Claude & GPT...`);
  const gemmaReverseResults = await Promise.allSettled([
    reverseTranslateWithClaude(JSON.stringify(gemmaForward), targetLang),
    reverseTranslateWithGPT(JSON.stringify(gemmaForward), targetLang)
  ]);
  const gemmaByClaude = gemmaReverseResults[0].status === 'fulfilled' ? gemmaReverseResults[0].value : {};
  const gemmaByGPT = gemmaReverseResults[1].status === 'fulfilled' ? gemmaReverseResults[1].value : {};
  if (gemmaReverseResults[0].status === 'rejected') console.warn(`   ⚠️  Claude reverse failed: ${gemmaReverseResults[0].reason}`);\n  if (gemmaReverseResults[1].status === 'rejected') console.warn(`   ⚠️  GPT reverse failed: ${gemmaReverseResults[1].reason}`);
  
  // Save reverse translations with cross-validation metadata
  const reverseResults = {
    claude: {
      forward: claudeForward,
      reversedBy: {
        gpt: claudeByGPT,
        translategemma: claudeByGemma
      }
    },
    gpt: {
      forward: gptForward,
      reversedBy: {
        claude: gptByClaude,
        translategemma: gptByGemma
      }
    },
    translategemma: {
      forward: gemmaForward,
      reversedBy: {
        claude: gemmaByClaude,
        gpt: gemmaByGPT
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
  const claudeByGemmaFlat = flattenObject(claudeByGemma);
  const gptByClaudeFlat = flattenObject(gptByClaude);
  const gptByGemmaFlat = flattenObject(gptByGemma);
  const gemmaByClaudeFlat = flattenObject(gemmaByClaude);
  const gemmaByGPTFlat = flattenObject(gemmaByGPT);
  
  // Cross-validation comparison: check each translation against both validators
  const comparison = Object.keys(originalFlat).map(key => {
    const orig = originalFlat[key];
    
    // Claude's translation checked by GPT and Gemma
    const claudeGPT = claudeByGPTFlat[key] || '[MISSING]';
    const claudeGemma = claudeByGemmaFlat[key] || '[MISSING]';
    const claudeGPTMatch = semanticSimilarity(orig, claudeGPT);
    const claudeGemmaMatch = semanticSimilarity(orig, claudeGemma);
    const claudePass = claudeGPTMatch.match && claudeGemmaMatch.match;
    
    // GPT's translation checked by Claude and Gemma
    const gptClaude = gptByClaudeFlat[key] || '[MISSING]';
    const gptGemma = gptByGemmaFlat[key] || '[MISSING]';
    const gptClaudeMatch = semanticSimilarity(orig, gptClaude);
    const gptGemmaMatch = semanticSimilarity(orig, gptGemma);
    const gptPass = gptClaudeMatch.match && gptGemmaMatch.match;
    
    // Gemma's translation checked by Claude and GPT
    const gemmaClaude = gemmaByClaudeFlat[key] || '[MISSING]';
    const gemmaGPT = gemmaByGPTFlat[key] || '[MISSING]';
    const gemmaClaudeMatch = semanticSimilarity(orig, gemmaClaude);
    const gemmaGPTMatch = semanticSimilarity(orig, gemmaGPT);
    const gemmaPass = gemmaClaudeMatch.match && gemmaGPTMatch.match;
    
    const allPass = claudePass && gptPass && gemmaPass;
    
    return {
      key,
      original: orig,
      claude: {
        byGPT: claudeGPT,
        byGemma: claudeGemma,
        pass: claudePass
      },
      gpt: {
        byClaude: gptClaude,
        byGemma: gptGemma,
        pass: gptPass
      },
      translategemma: {
        byClaude: gemmaClaude,
        byGPT: gemmaGPT,
        pass: gemmaPass
      },
      crossValidationPass: allPass,
      notes: !allPass ? [
        !claudePass ? `Claude: ${claudeGPTMatch.notes || ''} ${claudeGemmaMatch.notes || ''}` : null,
        !gptPass ? `GPT: ${gptClaudeMatch.notes || ''} ${gptGemmaMatch.notes || ''}` : null,
        !gemmaPass ? `Gemma: ${gemmaClaudeMatch.notes || ''} ${gemmaGPTMatch.notes || ''}` : null
      ].filter(Boolean).join('; ') : undefined
    };
  });
  
  return {
    original,
    reverseTranslations: {
      claude: claudeByGPT,
      gpt: gptByClaude,
      translategemma: gemmaByGPT
    },
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
  const gemmaPasses = result.comparison.filter(c => c.translategemma.pass).length;
  
  console.log(`\n   Individual model validation:`);
  console.log(`     Claude:  ${claudePasses}/${totalKeys} (${Math.round(claudePasses/totalKeys*100)}%) verified by GPT & Gemma`);
  console.log(`     GPT:     ${gptPasses}/${totalKeys} (${Math.round(gptPasses/totalKeys*100)}%) verified by Claude & Gemma`);
  console.log(`     Gemma:  ${gemmaPasses}/${totalKeys} (${Math.round(gemmaPasses/totalKeys*100)}%) verified by Claude & GPT`);
  
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
        console.log(`        By Gemma: "${f.claude.byGemma}"`);
      }
      
      if (!f.gpt.pass) {
        console.log(`     ❌ GPT's translation:`);
        console.log(`        By Claude: "${f.gpt.byClaude}"`);
        console.log(`        By Gemma: "${f.gpt.byGemma}"`);
      }
      
      if (!f.translategemma.pass) {
        console.log(`     ❌ Gemma's translation:`);
        console.log(`        By Claude: "${f.translategemma.byClaude}"`);
        console.log(`        By GPT:    "${f.translategemma.byGPT}"`);
      }
      
      if (f.notes) console.log(`     Notes: ${f.notes}`);
      console.log();
    });
  } else {
    console.log(`\n✅ All keys passed cross-validation!`);
  }
}

main().catch(console.error);
