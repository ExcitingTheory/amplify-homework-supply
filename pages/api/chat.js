import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { messages, context } = await req.json();

    // Build system message with context
    const systemMessage = buildSystemMessage(context);

    // Prepare messages with system context
    const allMessages = [
      {
        role: 'system',
        content: systemMessage,
      },
      ...messages,
    ];

    // Create streaming response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Convert to streaming response
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

function buildSystemMessage(context = {}) {
  const { unit, files, questionBank, dictionary, sections } = context;
  
  let systemMessage = `You are a helpful AI assistant for a Japanese language learning platform. You help teachers create educational content, manage curriculum, and organize learning materials.

Current Time: ${new Date().toLocaleString()}

`;

  if (unit) {
    systemMessage += `\n## Current Unit
Name: ${unit.name || 'Untitled'}
Description: ${unit.description || 'No description'}
ID: ${unit.id}
`;
  }

  if (sections && sections.length > 0) {
    systemMessage += `\n## Available Sections (${sections.length})
`;
    sections.forEach(section => {
      systemMessage += `- ${section.name || 'Untitled'} (${section.id}): ${section.description || 'No description'}
`;
    });
  }

  if (files && Object.keys(files).length > 0) {
    const fileArray = Object.values(files);
    systemMessage += `\n## Uploaded Files (${fileArray.length})
`;
    fileArray.forEach(file => {
      systemMessage += `- ${file.name} (${file.mimeType}): ${file.description || 'No description'}
`;
    });
  }

  if (questionBank && Object.keys(questionBank).length > 0) {
    const questions = Object.values(questionBank);
    systemMessage += `\n## Question Bank (${questions.length} questions)
`;
    questions.slice(0, 10).forEach(q => {
      systemMessage += `- Q: ${q.prompt} | A: ${q.answer}
`;
    });
    if (questions.length > 10) {
      systemMessage += `... and ${questions.length - 10} more questions
`;
    }
  }

  if (dictionary && Object.keys(dictionary).length > 0) {
    const entries = Object.values(dictionary);
    systemMessage += `\n## Vocabulary Dictionary (${entries.length} entries)
`;
    entries.slice(0, 10).forEach(entry => {
      systemMessage += `- ${entry.phrase}: ${entry.definition}
`;
    });
    if (entries.length > 10) {
      systemMessage += `... and ${entries.length - 10} more entries
`;
    }
  }

  systemMessage += `\n## Your Capabilities
- Answer questions about the curriculum and content
- Provide suggestions for improving units, sections, and materials
- Help with Japanese language teaching strategies
- Assist with content organization and structure
- Explain how to use the platform features

Be concise, helpful, and educational. When suggesting changes, explain the reasoning behind them.`;

  return systemMessage;
}
