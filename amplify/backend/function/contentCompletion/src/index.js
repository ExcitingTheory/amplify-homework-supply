/*
Use the following code to retrieve configured secrets from SSM:

const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const client = new SSMClient();
const { Parameters } = await client.send(new GetParametersCommand({
  Names: ["OPENAI_API_KEY"].map(secretName => process.env[secretName]),
  WithDecryption: true,
}));

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

import OpenAI from 'openai';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();

// Cache API key to avoid repeated SSM calls
let cachedApiKey = null;

async function getOpenAIKey() {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const { Parameters } = await ssmClient.send(
    new GetParametersCommand({
      Names: ["OPENAI_API_KEY"].map(secretName => process.env[secretName]),
      WithDecryption: true,
    })
  );

  cachedApiKey = Parameters[0].Value;
  return cachedApiKey;
}

/**
 * Lambda handler with response streaming for AI content completion
 * Uses awslambda.streamifyResponse for streaming OpenAI responses
 * 
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  console.log('contentCompletion event:', JSON.stringify(event, null, 2));

  const metadata = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
  };

  try {
    // Parse body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { prompt, context: contextData } = body;

    if (!prompt) {
      const errorMetadata = {
        ...metadata,
        statusCode: 400,
        headers: { ...metadata.headers, 'Content-Type': 'application/json' },
      };
      responseStream = awslambda.HttpResponseStream.from(responseStream, errorMetadata);
      responseStream.write(JSON.stringify({ error: 'Prompt is required' }));
      responseStream.end();
      return;
    }

    // Get OpenAI API key from SSM
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey });

    // Build system message with educational context
    const systemMessage = buildCompletionSystemMessage(
      contextData ? JSON.parse(contextData) : {}
    );

    const messages = [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: `Complete the following text. Provide ONLY the continuation, not the original text. Write 1-3 sentences that would naturally follow:\n\n${prompt}`,
      },
    ];

    // Create streaming completion
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 150,
      stream: true,
    });

    // Set up response stream
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

    // Stream OpenAI response chunks to client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        responseStream.write(content);
      }
    }

    responseStream.end();
  } catch (error) {
    console.error('contentCompletion error:', error);
    
    const errorMetadata = {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
    };
    
    responseStream = awslambda.HttpResponseStream.from(responseStream, errorMetadata);
    responseStream.write(JSON.stringify({
      error: 'Failed to generate completion',
      details: error.message,
    }));
    responseStream.end();
  }
});

function buildCompletionSystemMessage(context = {}) {
  const { unit, subject, level } = context;
  
  let message = `You are an AI writing assistant for educational content creation. Your role is to help educators write clear, pedagogically sound content for language learning materials.

Writing Guidelines:
- Write in a clear, concise educational style
- Match the tone and complexity of the existing content
- Provide factually accurate information
- Use examples and explanations appropriate for language learners
- Stay on topic with the current subject matter

`;

  if (unit) {
    message += `Current Unit: ${unit.name || 'Untitled'}
Description: ${unit.description || 'No description'}
`;
  }

  if (subject) {
    message += `Subject: ${subject}
`;
  }

  if (level) {
    message += `Level: ${level}
`;
  }

  message += `
Your task: Continue the text naturally, as if you were the educator writing this content. Focus on clarity and educational value.`;

  return message;
}
