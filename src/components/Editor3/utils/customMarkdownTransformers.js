/**
 * Custom Markdown Transformers for Homework Supply Editor Blocks
 * 
 * Extends Lexical's markdown support to include custom block syntax:
 * 
 * Quiz Block:
 * :::quiz[q1,q2,q3]
 * 
 * Answer Block:
 * :::answer[word-1,word-2,word-3]
 * mode=translate
 * 
 * Meaning Association:
 * :::meaning[word-1,word-2,word-3,word-4]
 * modes=learn,easy,hard
 * 
 * Custom Answer:
 * :::custom-answer[q-1,q-2]
 * input=text,audio
 * prompt=audio
 * 
 * @see https://lexical.dev/docs/concepts/serialization#markdown
 */

import { $createQuizNode } from '../plugins/QuizPlugin';
import { $createAnswerNode } from '../plugins/AnswerPlugin';
import { $createMeaningAssociationNode } from '../plugins/MeaningAssociationPlugin';
import { $createCustomAnswerNode } from '../plugins/CustomAnswerPlugin';

/**
 * Regular expressions for matching custom block syntax
 */
const QUIZ_REGEX = /^:::quiz\[([^\]]+)\]$/;
const ANSWER_REGEX = /^:::answer\[([^\]]+)\]$/;
const MEANING_REGEX = /^:::meaning\[([^\]]+)\]$/;
const CUSTOM_ANSWER_REGEX = /^:::custom-answer\[([^\]]+)\]$/;

/**
 * Parse metadata from following lines
 * Example:
 *   mode=translate
 *   input=text,audio
 */
function parseMetadata(lines) {
  const metadata = {};
  for (const line of lines) {
    const match = line.match(/^(\w+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Split comma-separated values into arrays
      metadata[key] = value.includes(',') ? value.split(',').map(s => s.trim()) : value;
    } else if (line.trim() === '') {
      // Empty line marks end of metadata
      break;
    }
  }
  return metadata;
}

/**
 * Quiz Block Transformer
 * 
 * Markdown:
 *   :::quiz[q1,q2,q3]
 * 
 * Creates a QuizNode with question IDs
 */
export const QUIZ_TRANSFORMER = {
  dependencies: [],
  export: (node) => {
    if (!$isQuizNode(node)) {
      return null;
    }
    const data = node.getData();
    const ids = Array.isArray(data) ? data.map(item => item.id).join(',') : '';
    return `:::quiz[${ids}]`;
  },
  regExp: QUIZ_REGEX,
  replace: (textNode, match) => {
    const [, ids] = match;
    const idArray = ids.split(',').map(id => id.trim());
    const quizNode = $createQuizNode(idArray);
    textNode.replace(quizNode);
  },
  type: 'element',
};

/**
 * Answer Block Transformer
 * 
 * Markdown:
 *   :::answer[word-1,word-2,word-3]
 *   mode=translate
 * 
 * Creates an AnswerNode with word IDs and optional mode
 */
export const ANSWER_TRANSFORMER = {
  dependencies: [],
  export: (node) => {
    if (!$isAnswerNode(node)) {
      return null;
    }
    const ids = node.getIds();
    const mode = node.getMode();
    let markdown = `:::answer[${ids.join(',')}]`;
    if (mode) {
      markdown += `\nmode=${mode}`;
    }
    return markdown;
  },
  regExp: ANSWER_REGEX,
  replace: (textNode, match) => {
    const [, ids] = match;
    const idArray = ids.split(',').map(id => id.trim());
    
    // Look ahead for metadata on next lines
    // Note: This is simplified - full implementation would parse following lines
    const answerNode = $createAnswerNode(idArray);
    textNode.replace(answerNode);
  },
  type: 'element',
};

/**
 * Meaning Association Transformer
 * 
 * Markdown:
 *   :::meaning[word-1,word-2,word-3,word-4]
 *   modes=learn,easy,hard
 * 
 * Creates a MeaningAssociationNode with word IDs and enabled modes
 */
export const MEANING_ASSOCIATION_TRANSFORMER = {
  dependencies: [],
  export: (node) => {
    if (!$isMeaningAssociationNode(node)) {
      return null;
    }
    const ids = node.getIds();
    const enabledModes = node.getEnabledModes();
    let markdown = `:::meaning[${ids.join(',')}]`;
    if (enabledModes && enabledModes.length > 0) {
      markdown += `\nmodes=${enabledModes.join(',')}`;
    }
    return markdown;
  },
  regExp: MEANING_REGEX,
  replace: (textNode, match) => {
    const [, ids] = match;
    const idArray = ids.split(',').map(id => id.trim());
    const meaningNode = $createMeaningAssociationNode(idArray);
    textNode.replace(meaningNode);
  },
  type: 'element',
};

/**
 * Custom Answer Transformer
 * 
 * Markdown:
 *   :::custom-answer[q-1,q-2]
 *   input=text,audio
 *   prompt=audio
 * 
 * Creates a CustomAnswerNode with question IDs and input/prompt methods
 */
export const CUSTOM_ANSWER_TRANSFORMER = {
  dependencies: [],
  export: (node) => {
    if (!$isCustomAnswerNode(node)) {
      return null;
    }
    const ids = node.getIds();
    const allowedInput = node.getAllowedInput();
    const promptMethod = node.getPromptMethod();
    
    let markdown = `:::custom-answer[${ids.join(',')}]`;
    if (allowedInput && allowedInput.length > 0) {
      markdown += `\ninput=${allowedInput.join(',')}`;
    }
    if (promptMethod && promptMethod.length > 0) {
      markdown += `\nprompt=${promptMethod.join(',')}`;
    }
    return markdown;
  },
  regExp: CUSTOM_ANSWER_REGEX,
  replace: (textNode, match) => {
    const [, ids] = match;
    const idArray = ids.split(',').map(id => id.trim());
    const customAnswerNode = $createCustomAnswerNode(idArray);
    textNode.replace(customAnswerNode);
  },
  type: 'element',
};

/**
 * Alternative: Code Block with JSON Metadata
 * 
 * ```quiz
 * {
 *   "questions": [
 *     { "id": "q1", "answer": "Paris", "correct": true },
 *     { "id": "q2", "answer": "London", "correct": false }
 *   ]
 * }
 * ```
 */
export const CODE_BLOCK_QUIZ_TRANSFORMER = {
  dependencies: [],
  export: (node) => {
    if (!$isQuizNode(node)) {
      return null;
    }
    const data = node.getData();
    return '```quiz\n' + JSON.stringify({ questions: data }, null, 2) + '\n```';
  },
  regExp: /^```quiz\s*\n([\s\S]+?)\n```$/,
  replace: (textNode, match) => {
    const [, jsonContent] = match;
    try {
      const parsed = JSON.parse(jsonContent);
      const quizNode = $createQuizNode(parsed.questions || []);
      textNode.replace(quizNode);
    } catch (error) {
      console.error('[CODE_BLOCK_QUIZ_TRANSFORMER] Invalid JSON:', error);
    }
  },
  type: 'element',
};

/**
 * All custom transformers for Homework Supply blocks
 */
export const CUSTOM_BLOCK_TRANSFORMERS = [
  QUIZ_TRANSFORMER,
  ANSWER_TRANSFORMER,
  MEANING_ASSOCIATION_TRANSFORMER,
  CUSTOM_ANSWER_TRANSFORMER,
  CODE_BLOCK_QUIZ_TRANSFORMER,
];

// Import type guards (these would need to be exported from the plugin files)
function $isQuizNode(node) {
  return node && node.getType && node.getType() === 'quiz';
}

function $isAnswerNode(node) {
  return node && node.getType && node.getType() === 'answer';
}

function $isMeaningAssociationNode(node) {
  return node && node.getType && node.getType() === 'meaning-association';
}

function $isCustomAnswerNode(node) {
  return node && node.getType && node.getType() === 'custom-answer';
}
