/**
 * Headless Editor Text Extraction Utility
 * Extracts plain text and markdown from Lexical editor state without rendering to DOM
 */

import { createHeadlessEditor } from '@lexical/headless';
import { $getRoot, $getSelection } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { EditorNodes } from '../components/Editor3';

/**
 * Extract plain text from Lexical editor state
 * @param {string|object} editorStateJSON - Serialized editor state
 * @returns {string} Plain text content
 */
export function extractPlainText(editorStateJSON) {
  if (!editorStateJSON) return '';
  
  try {
    const editor = createHeadlessEditor({
      nodes: EditorNodes,
      onError: (error) => {
        console.error('Headless editor error:', error);
      }
    });
    
    let text = '';
    
    // Parse the editor state
    const stateToLoad = typeof editorStateJSON === 'string' 
      ? editorStateJSON 
      : JSON.stringify(editorStateJSON);
    
    const editorState = editor.parseEditorState(stateToLoad);
    editor.setEditorState(editorState);
    
    // Extract text
    editor.getEditorState().read(() => {
      text = $getRoot().getTextContent();
    });
    
    return text.trim();
  } catch (error) {
    console.error('Error extracting plain text:', error);
    return '';
  }
}

/**
 * Extract HTML from Lexical editor state
 * @param {string|object} editorStateJSON - Serialized editor state
 * @returns {string} HTML content
 */
export function extractHTML(editorStateJSON) {
  if (!editorStateJSON) return '';
  
  try {
    const editor = createHeadlessEditor({
      nodes: EditorNodes,
      onError: (error) => {
        console.error('Headless editor error:', error);
      }
    });
    
    let html = '';
    
    const stateToLoad = typeof editorStateJSON === 'string' 
      ? editorStateJSON 
      : JSON.stringify(editorStateJSON);
    
    const editorState = editor.parseEditorState(stateToLoad);
    editor.setEditorState(editorState);
    
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor);
    });
    
    return html;
  } catch (error) {
    console.error('Error extracting HTML:', error);
    return '';
  }
}

/**
 * Extract structured content for embedding generation
 * Optimizes text for semantic search by cleaning and structuring
 * @param {string|object} editorStateJSON - Serialized editor state
 * @returns {object} Structured content with text and metadata
 */
export function extractForEmbedding(editorStateJSON) {
  if (!editorStateJSON) {
    return { text: '', wordCount: 0, characterCount: 0 };
  }
  
  try {
    const plainText = extractPlainText(editorStateJSON);
    
    // Clean text for embedding
    const cleanedText = plainText
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
      .trim();
    
    const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
    
    return {
      text: cleanedText,
      wordCount: words.length,
      characterCount: cleanedText.length,
      isEmpty: cleanedText.length === 0
    };
  } catch (error) {
    console.error('Error extracting for embedding:', error);
    return { text: '', wordCount: 0, characterCount: 0, isEmpty: true };
  }
}

/**
 * Extract text from multiple editor states and combine
 * Useful for unit-level embeddings from multiple sections
 * @param {Array<string|object>} editorStates - Array of serialized editor states
 * @param {string} separator - Text to use between sections (default: double newline)
 * @returns {object} Combined structured content
 */
export function extractMultiple(editorStates, separator = '\n\n') {
  if (!editorStates || editorStates.length === 0) {
    return { text: '', wordCount: 0, characterCount: 0, isEmpty: true };
  }
  
  const extracted = editorStates
    .map(state => extractForEmbedding(state))
    .filter(result => !result.isEmpty);
  
  const combinedText = extracted
    .map(result => result.text)
    .join(separator);
  
  const totalWords = extracted.reduce((sum, result) => sum + result.wordCount, 0);
  const totalChars = extracted.reduce((sum, result) => sum + result.characterCount, 0);
  
  return {
    text: combinedText,
    wordCount: totalWords,
    characterCount: totalChars,
    isEmpty: combinedText.length === 0,
    sectionCount: extracted.length
  };
}

/**
 * Extract text with section metadata
 * @param {Array<{content: string, title: string, id: string}>} sections
 * @returns {object} Text with section markers for context
 */
export function extractWithSectionMarkers(sections) {
  if (!sections || sections.length === 0) {
    return { text: '', sections: [] };
  }
  
  const processedSections = sections.map(section => {
    const extracted = extractForEmbedding(section.content);
    return {
      id: section.id,
      title: section.title || 'Untitled Section',
      text: extracted.text,
      wordCount: extracted.wordCount,
      isEmpty: extracted.isEmpty
    };
  }).filter(s => !s.isEmpty);
  
  // Combine with section markers for context
  const markedText = processedSections
    .map(section => `[Section: ${section.title}]\n${section.text}`)
    .join('\n\n---\n\n');
  
  return {
    text: markedText,
    sections: processedSections,
    totalWordCount: processedSections.reduce((sum, s) => sum + s.wordCount, 0)
  };
}
