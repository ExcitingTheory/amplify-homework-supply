/**
 * Mock chat API for Storybook
 * Simulates streaming responses from the AI assistant
 */

/**
 * Extract text content from a message object.
 * Supports both AI SDK v6 format (message.parts) and legacy format (message.content).
 */
function getMessageText(message) {
  if (!message) return '';
  // AI SDK v6: parts-based messages
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('');
  }
  // Legacy: content string
  if (typeof message.content === 'string') {
    return message.content;
  }
  return '';
}

// Simulate streaming response
export const mockChatAPI = async (messages, context) => {
  console.log('[Mock Chat API] Received:', { messages, context });
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lastMessage = messages[messages.length - 1];
  const content = getMessageText(lastMessage).toLowerCase();
  
  // Generate contextual response based on the question
  let response = '';
  
  if (content.includes('hello') || content.includes('hi')) {
    response = "Hello! I'm your AI assistant. I can help you with:\n\n- Creating and organizing curriculum content\n- Managing your files and PDFs\n- Working with vocabulary and questions\n- Explaining Japanese language concepts\n\nWhat would you like to work on today?";
  } else if (content.includes('pdf') || content.includes('file')) {
    const fileCount = context?.files?.length || 0;
    response = `You currently have ${fileCount} file${fileCount !== 1 ? 's' : ''} uploaded. ${fileCount > 0 ? '\n\nFiles:\n' + context.files.map(f => `- ${f.name} (${f.mimeType})`).join('\n') : ''}`;
  } else if (content.includes('vocabulary') || content.includes('dictionary')) {
    const dictCount = context?.dictionary?.length || 0;
    response = `Your dictionary has ${dictCount} entr${dictCount !== 1 ? 'ies' : 'y'}. ${dictCount > 0 ? '\n\nSample entries:\n' + context.dictionary.slice(0, 3).map(d => `- ${d.phrase}: ${d.definition}`).join('\n') : ''}`;
  } else if (content.includes('question') || content.includes('quiz')) {
    const qCount = context?.questionBank?.length || 0;
    response = `You have ${qCount} question${qCount !== 1 ? 's' : ''} in your question bank. ${qCount > 0 ? '\n\nSample questions:\n' + context.questionBank.slice(0, 2).map(q => `Q: ${q.prompt}\nA: ${q.answer}`).join('\n\n') : ''}`;
  } else if (content.includes('unit')) {
    response = context?.unit ? `You're currently working on "${context.unit.name}". ${context.unit.description ? `Description: ${context.unit.description}` : ''}` : 'No unit is currently selected.';
  } else {
    response = `I understand you're asking about: "${getMessageText(lastMessage)}"\n\nBased on your current context:\n- Unit: ${context?.unit?.name || 'None'}\n- Files: ${context?.files?.length || 0}\n- Vocabulary: ${context?.dictionary?.length || 0} entries\n- Questions: ${context?.questionBank?.length || 0}\n\nHow can I help you with your curriculum?`;
  }
  
  return response;
};

// Simulate streaming text response
export const streamMockResponse = async (text, onChunk) => {
  const words = text.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    onChunk(words[i] + ' ');
  }
};
