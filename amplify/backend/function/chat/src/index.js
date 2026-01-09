/* Amplify Params - DO NOT EDIT
	API_JAPANESE5_DOCUMENTTABLE_ARN
	API_JAPANESE5_DOCUMENTTABLE_NAME
	API_JAPANESE5_FILETABLE_ARN
	API_JAPANESE5_FILETABLE_NAME
	API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT
	API_JAPANESE5_GRAPHQLAPIIDOUTPUT
	API_JAPANESE5_PARSEDCONTENTTABLE_ARN
	API_JAPANESE5_PARSEDCONTENTTABLE_NAME
	API_JAPANESE5_UNITTABLE_ARN
	API_JAPANESE5_UNITTABLE_NAME
	ENV
	REGION
	STORAGE_FILES_BUCKETNAME
Amplify Params - DO NOT EDIT */

import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';
import OpenAI from 'openai';
import * as awslambda from 'aws-lambda';

// Initialize SSM client for API key retrieval
const ssmClient = new SSMClient();
let openaiInstance = null;
let apiKeyCache = null;

// Get OpenAI API key from SSM with caching
async function getOpenAIApiKey() {
  if (apiKeyCache) {
    return apiKeyCache;
  }

  const parameterName = process.env.OPENAI_API_KEY;
  if (!parameterName) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  const { Parameters } = await ssmClient.send(
    new GetParametersCommand({
      Names: [parameterName],
      WithDecryption: true,
    })
  );

  if (!Parameters || Parameters.length === 0) {
    throw new Error('Failed to retrieve OpenAI API key from SSM');
  }

  apiKeyCache = Parameters[0].Value;
  return apiKeyCache;
}

// Get or create OpenAI instance
async function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = await getOpenAIApiKey();
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

// Tool definitions (matching frontend)
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_content',
      description: 'Search through unit content, files, questions, and vocabulary using semantic search',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
          contentType: {
            type: 'string',
            enum: ['all', 'files', 'questions', 'vocabulary'],
            description: 'Type of content to search',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_section',
      description: 'Create a new class section with a name and optional description',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the section (e.g., "Japanese 101 - Fall 2024")',
          },
          description: {
            type: 'string',
            description: 'Optional description of the section',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_unit_content',
      description: 'Generate rich educational content for a unit based on a topic or description',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The topic or subject for the unit',
          },
          level: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
            description: 'The difficulty level',
          },
        },
        required: ['topic'],
      },
    },
  },
];

/**
 * Lambda handler with streaming response support
 * Uses awslambda.streamifyResponse to stream OpenAI chat completions
 * 
 * @type {import('aws-lambda').StreamifyHandler}
 */
export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  console.log('[Chat Lambda] Event:', JSON.stringify(event, null, 2));

  try {
    // Parse the incoming request
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { messages, context: chatContext, toolChoice } = body;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid request: messages array is required');
    }

    // Get OpenAI instance
    const openai = await getOpenAI();

    // Build system message with context
    const systemMessage = buildSystemMessage(chatContext);
    const allMessages = [systemMessage, ...messages];

    console.log('[Chat Lambda] Creating chat completion with', allMessages.length, 'messages');

    // Create streaming chat completion with tools
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: allMessages,
      stream: true,
      tools,
      tool_choice: toolChoice || 'auto',
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Set up response stream metadata
    const metadata = {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    };

    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

    // Stream the response in AI SDK format
    let toolCalls = [];
    let messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let contentBuffer = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const finishReason = chunk.choices[0]?.finish_reason;

      // Stream OpenAI chunk directly (AI SDK can parse this)
      const streamData = JSON.stringify(chunk);
      responseStream.write(`data: ${streamData}\n\n`);

      // Track content and tool calls for logging
      if (delta?.content) {
        contentBuffer += delta.content;
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (toolCall.index !== undefined) {
            // Start or update tool call
            if (!toolCalls[toolCall.index]) {
              toolCalls[toolCall.index] = {
                id: toolCall.id || '',
                type: 'function',
                function: {
                  name: toolCall.function?.name || '',
                  arguments: toolCall.function?.arguments || '',
                },
              };
            } else {
              // Append to existing tool call
              if (toolCall.function?.name) {
                toolCalls[toolCall.index].function.name += toolCall.function.name;
              }
              if (toolCall.function?.arguments) {
                toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
              }
              if (toolCall.id) {
                toolCalls[toolCall.index].id += toolCall.id;
              }
            }
          }
        }
      }
    }

    // Send done signal
    responseStream.write('data: [DONE]\n\n');
    
    console.log('[Chat Lambda] Streamed', contentBuffer.length, 'chars,', toolCalls.length, 'tool calls');

    responseStream.end();
    console.log('[Chat Lambda] Stream completed');
  } catch (error) {
    console.error('[Chat Lambda] Error:', error);
    
    // Set up error response
    const metadata = {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    responseStream.write(JSON.stringify({
      error: error.message || 'Internal server error',
    }));
    responseStream.end();
  }
});

/**
 * Build system message with context
 */
function buildSystemMessage(context) {
  let systemContent = `You are an AI assistant helping with curriculum development and educational content creation.

You have access to tools that can help you:
- Search through course content, files, questions, and vocabulary
- Create new class sections
- Generate educational unit content

Current context:`;

  if (context?.unit) {
    systemContent += `\n\nCurrent Unit: ${context.unit.name}`;
    if (context.unit.description) {
      systemContent += `\nDescription: ${context.unit.description}`;
    }
  }

  if (context?.files && context.files.length > 0) {
    systemContent += `\n\nAvailable Files (${context.files.length}):`;
    context.files.slice(0, 5).forEach((file) => {
      systemContent += `\n- ${file.name}${file.description ? `: ${file.description}` : ''}`;
    });
    if (context.files.length > 5) {
      systemContent += `\n... and ${context.files.length - 5} more`;
    }
  }

  if (context?.questionBank && context.questionBank.length > 0) {
    systemContent += `\n\nQuestion Bank (${context.questionBank.length} questions available)`;
  }

  if (context?.dictionary && context.dictionary.length > 0) {
    systemContent += `\n\nVocabulary Dictionary (${context.dictionary.length} words available)`;
  }

  if (context?.sections && context.sections.length > 0) {
    systemContent += `\n\nClass Sections (${context.sections.length}):`;
    context.sections.forEach((section) => {
      systemContent += `\n- ${section.name}${section.description ? `: ${section.description}` : ''}`;
    });
  }

  systemContent += `\n\nWhen users ask for help, provide clear, educational guidance. Use the available tools when appropriate to search content or perform actions.`;

  return {
    role: 'system',
    content: systemContent,
  };
}