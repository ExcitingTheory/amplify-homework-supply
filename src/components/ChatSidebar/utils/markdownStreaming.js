/**
 * Markdown Streaming Utilities
 * 
 * Handles incomplete markdown during AI streaming to prevent
 * expensive re-parsing on every character. Batches updates and
 * detects when markdown is "complete enough" to render.
 */

/**
 * Check if markdown has unclosed code blocks
 * @param {string} text - Markdown text
 * @returns {boolean} True if has unclosed code blocks
 */
export const hasUnclosedCodeBlock = (text) => {
  const codeBlockMatches = text.match(/```/g);
  return codeBlockMatches && codeBlockMatches.length % 2 !== 0;
};

/**
 * Check if markdown has unclosed inline code
 * @param {string} text - Markdown text
 * @returns {boolean} True if has unclosed inline code
 */
export const hasUnclosedInlineCode = (text) => {
  // Count backticks outside of code blocks
  const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '');
  const backtickMatches = withoutCodeBlocks.match(/`/g);
  return backtickMatches && backtickMatches.length % 2 !== 0;
};

/**
 * Check if markdown has unclosed bold/italic
 * @param {string} text - Markdown text
 * @returns {boolean} True if has unclosed formatting
 */
export const hasUnclosedFormatting = (text) => {
  const withoutCodeBlocks = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  
  // Check for unclosed bold (**) or italic (*)
  const boldMatches = withoutCodeBlocks.match(/\*\*/g);
  const hasBoldUnclosed = boldMatches && boldMatches.length % 2 !== 0;
  
  // For single asterisks, exclude those used for bold
  const withoutBold = withoutCodeBlocks.replace(/\*\*/g, '');
  const italicMatches = withoutBold.match(/\*/g);
  const hasItalicUnclosed = italicMatches && italicMatches.length % 2 !== 0;
  
  return hasBoldUnclosed || hasItalicUnclosed;
};

/**
 * Check if markdown is "complete enough" to render
 * Allows rendering even with minor issues to show streaming progress
 * @param {string} text - Markdown text
 * @returns {boolean} True if should render
 */
export const isMarkdownRenderReady = (text) => {
  // Empty text is ready
  if (!text || text.trim().length === 0) return true;
  
  // Don't render if in middle of code block (causes visual glitches)
  if (hasUnclosedCodeBlock(text)) return false;
  
  // Allow rendering with other unclosed elements (they'll close at end)
  return true;
};

/**
 * Batch markdown updates to reduce parsing overhead
 * @param {number} intervalMs - Batch interval in milliseconds
 * @returns {Object} Batching utilities
 */
export const createMarkdownBatcher = (intervalMs = 100) => {
  let pendingText = null;
  let timeoutId = null;
  let currentCallback = null;
  
  /**
   * Queue a markdown update
   * @param {string} text - New markdown text
   * @param {Function} callback - Callback to invoke with batched text
   */
  const queueUpdate = (text, callback) => {
    pendingText = text;
    currentCallback = callback;
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout
    timeoutId = setTimeout(() => {
      if (currentCallback && pendingText !== null) {
        currentCallback(pendingText);
        pendingText = null;
        currentCallback = null;
        timeoutId = null;
      }
    }, intervalMs);
  };
  
  /**
   * Force immediate flush of pending updates
   */
  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    if (currentCallback && pendingText !== null) {
      currentCallback(pendingText);
      pendingText = null;
      currentCallback = null;
    }
  };
  
  /**
   * Clear pending updates without invoking callback
   */
  const clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingText = null;
    currentCallback = null;
  };
  
  return {
    queueUpdate,
    flush,
    clear,
  };
};

/**
 * Hook for managing streaming markdown state
 * @param {string} streamingText - Current streaming text
 * @param {boolean} isComplete - Whether streaming is complete
 * @param {number} batchInterval - Batching interval in ms
 * @returns {string} Rendered markdown text
 */
export const useStreamingMarkdown = (streamingText, isComplete, batchInterval = 100) => {
  const [renderedText, setRenderedText] = React.useState('');
  const batcherRef = React.useRef(null);
  
  // Initialize batcher
  React.useEffect(() => {
    batcherRef.current = createMarkdownBatcher(batchInterval);
    return () => {
      batcherRef.current?.clear();
    };
  }, [batchInterval]);
  
  // Handle streaming text updates
  React.useEffect(() => {
    if (!batcherRef.current) return;
    
    if (isComplete) {
      // Immediately render final text
      batcherRef.current.flush();
      setRenderedText(streamingText);
    } else {
      // Batch intermediate updates
      if (isMarkdownRenderReady(streamingText)) {
        batcherRef.current.queueUpdate(streamingText, setRenderedText);
      }
    }
  }, [streamingText, isComplete]);
  
  return renderedText;
};

/**
 * Add streaming cursor to text
 * @param {string} text - Markdown text
 * @param {boolean} isStreaming - Whether currently streaming
 * @returns {string} Text with cursor if streaming
 */
export const addStreamingCursor = (text, isStreaming) => {
  if (!isStreaming) return text;
  
  // Add cursor that will be styled via CSS
  return `${text}<span class="streaming-cursor">▌</span>`;
};

/**
 * Estimate if more content is likely coming based on text ending
 * @param {string} text - Current text
 * @returns {boolean} True if more content expected
 */
export const expectsMoreContent = (text) => {
  if (!text) return true;
  
  // Trim trailing whitespace for check
  const trimmed = text.trimEnd();
  
  // Incomplete sentence
  if (!/[.!?]$/.test(trimmed)) return true;
  
  // Unclosed structures
  if (hasUnclosedCodeBlock(trimmed)) return true;
  if (hasUnclosedFormatting(trimmed)) return true;
  
  // Looks complete
  return false;
};

export default {
  hasUnclosedCodeBlock,
  hasUnclosedInlineCode,
  hasUnclosedFormatting,
  isMarkdownRenderReady,
  createMarkdownBatcher,
  useStreamingMarkdown,
  addStreamingCursor,
  expectsMoreContent,
};
