/**
 * GIFT Format Parser — Moodle's plain-text question format
 * Reference: https://docs.moodle.org/en/GIFT_format
 */
import type { FormatExtractionResult } from './formatRegistry.js';
import { getS3Object } from './textExtraction.js';

interface GiftQuestion {
  prompt: string;
  answer: string;
  options?: string[];
  questionType: string;
  difficulty: string;
  hint?: string;
  metadata?: { title?: string };
}

/**
 * Extract and parse a GIFT format file
 */
export async function extractGift(s3Key: string): Promise<FormatExtractionResult> {
  console.log('[extractGift] Loading GIFT file from S3...');
  const buffer = await getS3Object(s3Key);
  const raw = buffer.toString('utf-8');
  
  const questions = parseGiftText(raw);
  
  // Build text representation for GPT analysis
  const text = questions
    .map((q: GiftQuestion) => {
      let entry = `Q: ${q.prompt}\nA: ${q.answer}\nType: ${q.questionType}`;
      if (q.options) entry += `\nOptions: ${q.options.join(', ')}`;
      return entry;
    })
    .join('\n\n');
  
  console.log(`[extractGift] Parsed ${questions.length} questions`);
  
  return {
    text: text || raw, // Fall back to raw text if no questions parsed
    pages: [{ pageNumber: 1, text: text || raw }],
    pageCount: 1,
    sourceFormat: 'gift',
    directContent: {
      questionsJSON: questions.length > 0 ? questions : undefined,
    },
  };
}

/**
 * Parse GIFT format text into structured questions
 */
export function parseGiftText(raw: string): GiftQuestion[] {
  const questions: GiftQuestion[] = [];
  
  // Normalize line endings
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into question blocks (separated by blank lines)
  // Lines starting with // are comments
  const blocks = text.split(/\n{2,}/);
  
  for (const block of blocks) {
    const lines = block
      .split('\n')
      .filter(l => !l.trimStart().startsWith('//')) // Remove comments
      .join('\n')
      .trim();
    
    if (!lines) continue;
    
    const question = parseGiftBlock(lines);
    if (question) {
      questions.push(question);
    }
  }
  
  return questions;
}

/**
 * Parse a single GIFT question block
 */
function parseGiftBlock(block: string): GiftQuestion | null {
  // Extract optional title ::title::
  let title: string | undefined;
  let body = block;
  
  const titleMatch = body.match(/^::([^:]+)::\s*/);
  if (titleMatch) {
    title = titleMatch[1].trim();
    body = body.substring(titleMatch[0].length);
  }
  
  // Find the answer block { ... }
  const braceStart = body.indexOf('{');
  const braceEnd = body.lastIndexOf('}');
  
  if (braceStart === -1 || braceEnd === -1 || braceEnd <= braceStart) {
    // No answer block — might be a description/comment, skip
    return null;
  }
  
  const questionText = body.substring(0, braceStart).trim();
  const answerBlock = body.substring(braceStart + 1, braceEnd).trim();
  const afterBrace = body.substring(braceEnd + 1).trim();
  
  if (!questionText && !title) return null;
  
  const prompt = afterBrace
    ? `${questionText} ___ ${afterBrace}` // Missing word format
    : questionText;
  
  // Determine question type from answer block content
  const question = parseAnswerBlock(answerBlock, prompt || title || '');
  
  if (question) {
    question.metadata = title ? { title } : undefined;
    // If it was a missing-word pattern, override type
    if (afterBrace) {
      question.questionType = 'fill-in-the-blank';
    }
  }
  
  return question;
}

/**
 * Parse the content inside { ... } to determine question type and extract answers
 */
function parseAnswerBlock(answerBlock: string, prompt: string): GiftQuestion | null {
  // Empty block = essay
  if (!answerBlock.trim()) {
    return {
      prompt,
      answer: '',
      questionType: 'essay',
      difficulty: 'medium',
    };
  }
  
  // True/False: { TRUE } or { FALSE } or { T } or { F }
  const tfMatch = answerBlock.trim().match(/^(TRUE|FALSE|T|F)$/i);
  if (tfMatch) {
    const isTrue = tfMatch[1].toUpperCase().startsWith('T');
    return {
      prompt,
      answer: isTrue ? 'True' : 'False',
      options: ['True', 'False'],
      questionType: 'true-false',
      difficulty: 'easy',
    };
  }
  
  // Numerical: { #number } or { #number:tolerance }
  const numMatch = answerBlock.trim().match(/^#(-?[\d.]+)(?::(-?[\d.]+))?$/);
  if (numMatch) {
    return {
      prompt,
      answer: numMatch[1],
      questionType: 'numerical',
      difficulty: 'medium',
    };
  }
  
  // Matching: { =item1 -> match1 =item2 -> match2 }
  const matchingPattern = /=([^=~]+?)\s*->\s*([^=~]+)/g;
  const matchingPairs: Array<{ left: string; right: string }> = [];
  let matchResult;
  const testContent = answerBlock;
  
  while ((matchResult = matchingPattern.exec(testContent)) !== null) {
    matchingPairs.push({
      left: matchResult[1].trim(),
      right: matchResult[2].trim(),
    });
  }
  
  if (matchingPairs.length >= 2) {
    return {
      prompt,
      answer: matchingPairs.map(p => `${p.left} → ${p.right}`).join('; '),
      options: matchingPairs.map(p => p.left),
      questionType: 'matching',
      difficulty: 'medium',
    };
  }
  
  // Multiple choice or short answer: parse =correct and ~wrong entries
  const entries = parseChoiceEntries(answerBlock);
  const correct = entries.filter(e => e.correct);
  const wrong = entries.filter(e => !e.correct);
  
  if (correct.length > 0 && wrong.length > 0) {
    // Multiple choice
    return {
      prompt,
      answer: correct.map(e => e.text).join('; '),
      options: entries.map(e => e.text),
      questionType: 'multiple-choice',
      difficulty: 'medium',
    };
  }
  
  if (correct.length > 0 && wrong.length === 0) {
    // Short answer (only correct answers, no distractors)
    return {
      prompt,
      answer: correct[0].text,
      questionType: 'short-answer',
      difficulty: 'medium',
    };
  }
  
  // Fallback: treat entire answer block as short answer
  return {
    prompt,
    answer: answerBlock.trim(),
    questionType: 'short-answer',
    difficulty: 'medium',
  };
}

/**
 * Parse = and ~ prefixed choice entries from an answer block
 */
function parseChoiceEntries(block: string): Array<{ text: string; correct: boolean; weight?: number }> {
  const entries: Array<{ text: string; correct: boolean; weight?: number }> = [];
  
  // Match entries starting with = (correct) or ~ (wrong), optionally with %weight%
  const pattern = /([=~])(?:%(-?\d+(?:\.\d+)?)%)?([^=~]*)/g;
  let match;
  
  while ((match = pattern.exec(block)) !== null) {
    const isCorrect = match[1] === '=';
    const weight = match[2] ? parseFloat(match[2]) : undefined;
    const text = match[3].trim();
    
    if (text) {
      entries.push({ text, correct: isCorrect, weight });
    }
  }
  
  return entries;
}
