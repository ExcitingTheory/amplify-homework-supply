/**
 * OpenAI Lambda Handler for Gen 2
 * 
 * Routes to appropriate function based on GraphQL operation.
 * This handler is registered for multiple mutations/queries:
 * - chat, generateAudio, generateImage (mutations)
 * - verifyDefinition, verifyWord, verifyShortAnswer (queries)
 * - transcribe, verifyAudio, verifyAudioUrl, transcribeUrl (queries)
 * - processImage, processImageUrl, verifyImage, verifyImageUrl (queries)
 * 
 * Reference Gen 1: amplify/backend/function/openai/
 */

import type { Handler } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { type Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { initializePhoenixTracing, addTraceAttributes } from '../shared/phoenix-tracer';
import { fromEnv } from '@aws-sdk/credential-providers';

// Initialize Phoenix tracing at module load
initializePhoenixTracing();

// Configure Amplify at module level (before creating client)
// Lambda resolvers get API_ENDPOINT and AWS_REGION automatically
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || '',
        region: process.env.AWS_REGION || 'us-east-1',
        defaultAuthMode: 'iam', // Lambda uses IAM auth
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: await fromEnv()(),
        }),
        clearCredentialsAndIdentityId: () => {},
      },
    },
  }
);

const lambdaClient = new LambdaClient();
let openaiInstance: any = null;
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

// Raw GraphQL operations - .models API doesn't work in Lambda resolvers
const GET_FILE = /* GraphQL */ `
  query GetFile($id: ID!) {
    getFile(id: $id) {
      id
    }
  }
`;

const CREATE_FILE = /* GraphQL */ `
  mutation CreateFile($input: CreateFileInput!) {
    createFile(input: $input) {
      id
      name
      path
      mimeType
    }
  }
`;

const UPDATE_FILE = /* GraphQL */ `
  mutation UpdateFile($input: UpdateFileInput!) {
    updateFile(input: $input) {
      id
      path
      description
    }
  }
`;

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable not set');
    const OpenAI = (await import('openai')).default;
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

function getDataClient() {
  if (!dataClient) {
    dataClient = generateClient<Schema>({
      authMode: 'iam',
    });
  }
  return dataClient;
}

/**
 * Authorization check utility
 * Verifies user is authenticated and extracts claims
 */
function requireAuth(event: any) {
  const userId = event.identity?.sub;
  const username = event.identity?.username;
  // For S3 protected/private access, we need the Cognito Identity Pool ID
  // This is different from the user pool sub - it's in the cognito:username claim or identity sourceIp context
  const identityId = event.identity?.cognitoIdentityId || event.identity?.claims?.['cognito:username'] || userId;
  
  if (!userId) {
    console.error('[OpenAI Handler] No user identity found in event:', JSON.stringify(event, null, 2));
    throw new Error('Unauthorized: User authentication required');
  }
  
  console.log('[OpenAI Handler] Auth:', { userId, username, identityId });
  
  return { userId, username: username || userId, identityId };
}

export const handler: Handler = async (event: any, context: any) => {
  // Extract which operation is being called from the AppSync context
  // In Gen 2, AppSync passes fieldName via event.info.fieldName
  const operationName = event.info?.fieldName || event.fieldName;
  
  if (!operationName) {
    console.error('[OpenAI Handler] No operation name found in event:', JSON.stringify(event, null, 2));
    throw new Error('Unable to determine operation name from event');
  }
  
  console.log(`[OpenAI Handler] ${operationName}`, event.arguments);

  try {
    // Require authentication for all operations
    const { userId, username, identityId } = requireAuth(event);
    const userPoolId = process.env.USER_POOL_ID;
    const args = event.arguments || {};

    // Add trace attributes for this request
    addTraceAttributes({
      'operation.name': operationName,
      'lambda.requestId': context.requestId,
      'user.id': userId,
      'user.username': username,
    });

    switch (operationName) {
      case 'chat':
        return await handleChat(args);
      case 'generateAudio':
        return await handleGenerateAudio(args);
      case 'generateAudioFile':
        return await handleGenerateAudioFile(args, userId, identityId);
      case 'generateAudioFileAsync':
        return await handleGenerateAudioFileAsync(args);
      case 'generateImage':
        return await handleGenerateImage(args);
      case 'generateImageFile':
        return await handleGenerateImageFile(args, userId, identityId);
      case 'generateImageFileAsync':
        return await handleGenerateImageFileAsync(args);
      case 'verifyDefinition':
        return await handleVerifyDefinition(args);
      case 'verifyWord':
        return await handleVerifyWord(args);
      case 'verifyShortAnswer':
        return await handleVerifyShortAnswer(args);
      case 'transcribe':
        return await handleTranscribe(args);
      case 'verifyAudio':
        return await handleVerifyAudio(args);
      case 'verifyAudioUrl':
        return await handleVerifyAudioUrl(args);
      case 'transcribeUrl':
        return await handleTranscribeUrl(args);
      case 'processImage':
        return await handleProcessImage(args);
      case 'processImageUrl':
        return await handleProcessImageUrl(args);
      case 'verifyImage':
        return await handleVerifyImage(args);
      case 'verifyImageUrl':
        return await handleVerifyImageUrl(args);

      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  } catch (error) {
    console.error(`[OpenAI Handler Error] ${operationName}:`, error);
    throw error;
  }
};

// ============================================================================
// MUTATION HANDLERS
// ============================================================================

async function handleChat(args: any): Promise<string> {
  const { messages, model = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    const parsedMessages = typeof messages === 'string' ? JSON.parse(messages) : messages;
    const response = await openai.chat.completions.create({
      model,
      messages: parsedMessages,
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Chat Error]:', error);
    throw error;
  }
}

async function handleGenerateAudio(args: any): Promise<string> {
  const { phrase, voice = 'alloy', model = 'tts-1' } = args;
  const openai = await getOpenAI();
  
  try {
    const response = await openai.audio.speech.create({
      model,
      voice,
      input: phrase,
    });
    
    // Convert response to base64 string
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    console.error('[Generate Audio Error]:', error);
    throw error;
  }
}

async function handleGenerateAudioFile(args: any, userId: string, identityId: string): Promise<any> {
  const { phrase, voice = 'alloy', model = 'tts-1' } = args;
  
  try {
    const client = getDataClient();
    
    const timestamp = Date.now();
    const fileName = `generated-audio-${timestamp}.mp3`;
    const s3Path = `public/audio/${timestamp}/${fileName}`;
    
    // Create File record with pending status
    const { data, errors } = await client.graphql({
      query: CREATE_FILE,
      variables: {
        input: {
          name: fileName,
          mimeType: 'audio/mpeg',
          path: s3Path,
          owner: userId,
          identityId: identityId,
        },
      },
    }) as any;
    const file = data?.createFile;
    
    if (errors || !file) {
      throw new Error(`Failed to create File record: ${JSON.stringify(errors)}`);
    }
    
    const fileId = file.id;
    
    // Invoke Lambda asynchronously to generate the actual audio
    await lambdaClient.send(new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify({
        operation: 'generateAudioFileAsync',
        fileId,
        phrase,
        voice,
        model,
      }),
    }));
    
    return {
      id: fileId,
      filename: fileName,
      fileType: 'audio/mpeg',
      path: s3Path,
      status: 'pending',
      contentType: 'audio/mpeg',
    };
  } catch (error) {
    console.error('[Generate Audio File Error]:', error);
    throw error;
  }
}

async function handleGenerateAudioFileAsync(args: any): Promise<void> {
  const { fileId, phrase, voice = 'alloy', model = 'tts-1' } = args;
  const openai = await getOpenAI();
  const client = getDataClient();
  
  try {
    // Generate audio
    const response = await openai.audio.speech.create({
      model,
      voice,
      input: phrase,
    });
    
    const buffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');
    
    // Update File with completed data
    await client.graphql({
      query: UPDATE_FILE,
      variables: {
        input: {
          id: fileId,
          description: 'Generated audio - completed',
        },
      },
    });
    
    console.log(`[Audio Generation Complete] ${fileId}`);
  } catch (error) {
    console.error('[Generate Audio File Async Error]:', error);
    // Update File with error description
    try {
      const client = getDataClient();
      await client.graphql({
        query: UPDATE_FILE,
        variables: {
          input: {
            id: fileId,
            description: `Error: ${String(error).substring(0, 200)}`,
          },
        },
      });
    } catch (updateError) {
      console.error('[Update File Status Error]:', updateError);
    }
    throw error;
  }
}

async function handleGenerateImage(args: any): Promise<string> {
  const { phrase, model = 'dall-e-3' } = args;
  const openai = await getOpenAI();
  
  try {
    const response = await openai.images.generate({
      model,
      prompt: phrase,
      n: 1,
      size: '1024x1024',
    });
    
    return response.data[0]?.url || '';
  } catch (error) {
    console.error('[Generate Image Error]:', error);
    throw error;
  }
}

async function handleGenerateImageFile(args: any, userId: string, identityId: string): Promise<any> {
  const { phrase, model = 'dall-e-3' } = args;
  
  try {
    const client = getDataClient();
    
    const timestamp = Date.now();
    const fileName = `generated-image-${timestamp}.png`;
    const s3Path = `public/images/${timestamp}/${fileName}`;
    
    // Create File record with pending status
    const { data, errors } = await client.graphql({
      query: CREATE_FILE,
      variables: {
        input: {
          name: fileName,
          mimeType: 'image/png',
          path: s3Path,
          owner: userId,
          identityId: identityId,
        },
      },
    }) as any;
    const file = data?.createFile;
    
    if (errors || !file) {
      throw new Error(`Failed to create File record: ${JSON.stringify(errors)}`);
    }
    
    const fileId = file.id;
    
    // Invoke Lambda asynchronously to generate the actual image
    await lambdaClient.send(new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify({
        operation: 'generateImageFileAsync',
        fileId,
        phrase,
        model,
      }),
    }));
    
    return {
      id: fileId,
      filename: fileName,
      fileType: 'image/png',
      path: s3Path,
      status: 'pending',
    };
  } catch (error) {
    console.error('[Generate Image File Error]:', error);
    throw error;
  }
}

async function handleGenerateImageFileAsync(args: any): Promise<void> {
  const { fileId, phrase, model = 'dall-e-3' } = args;
  const openai = await getOpenAI();
  const client = getDataClient();
  
  try {
    // Generate image
    const response = await openai.images.generate({
      model,
      prompt: phrase,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });
    
    const base64 = response.data[0]?.b64_json || '';
    
    // Update File with completed data
    await client.graphql({
      query: UPDATE_FILE,
      variables: {
        input: {
          id: fileId,
          description: 'Generated image - completed',
        },
      },
    });
    
    console.log(`[Image Generation Complete] ${fileId}`);
  } catch (error) {
    console.error('[Generate Image File Async Error]:', error);
    // Update File with error description
    try {
      const client = getDataClient();
      await client.graphql({
        query: UPDATE_FILE,
        variables: {
          input: {
            id: fileId,
            description: `Error: ${String(error).substring(0, 200)}`,
          },
        },
      });
    } catch (updateError) {
      console.error('[Update File Status Error]:', updateError);
    }
    throw error;
  }
}

// ============================================================================
// QUERY HANDLERS
// ============================================================================

async function handleVerifyDefinition(args: any): Promise<string> {
  const { phrase, expected, definition, model = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    const prompt = `Given a phrase: "${phrase}"\nExpected definition: "${expected}"\nUser provided definition: "${definition}"\n\nIs the user's definition accurate and helpful? Respond with JSON: { "accurate": boolean, "feedback": string, "score": 0-100 }`;
    
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Verify Definition Error]:', error);
    throw error;
  }
}

async function handleVerifyWord(args: any): Promise<string> {
  const { word, expected, definition, model = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    const prompt = `Word: "${word}"\nExpected definition: "${expected}"\nUser provided definition: "${definition}"\n\nDoes the user understand this word? Respond with JSON: { "understands": boolean, "feedback": string, "score": 0-100 }`;
    
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Verify Word Error]:', error);
    throw error;
  }
}

async function handleVerifyShortAnswer(args: any): Promise<string> {
  const { expected, answer, prompt, model = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    const gradePrompt = `Question: "${prompt}"\nExpected answer: "${expected}"\nUser answer: "${answer}"\n\nGrade this answer. Respond with JSON: { "correct": boolean, "score": 0-100, "feedback": string }`;
    
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: gradePrompt }],
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Verify Short Answer Error]:', error);
    throw error;
  }
}

async function handleTranscribe(args: any): Promise<string> {
  const { audio, model = 'whisper-1' } = args;
  const openai = await getOpenAI();
  
  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Create file-like object for OpenAI API
    const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
    
    const response = await openai.audio.transcriptions.create({
      file,
      model,
    });
    
    return response.text;
  } catch (error) {
    console.error('[Transcribe Error]:', error);
    throw error;
  }
}

async function handleVerifyAudio(args: any): Promise<string> {
  const { expected, audio, model = 'whisper-1', chatModel = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    // Transcribe first
    const audioBuffer = Buffer.from(audio, 'base64');
    const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
    
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file,
      model,
    });
    
    // Then verify
    const verifyPrompt = `Expected answer: "${expected}"\nTranscribed answer: "${transcriptionResponse.text}"\n\nAre these equivalent? Respond with JSON: { "correct": boolean, "score": 0-100, "feedback": string }`;
    
    const response = await openai.chat.completions.create({
      model: chatModel,
      messages: [{ role: 'user', content: verifyPrompt }],
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Verify Audio Error]:', error);
    throw error;
  }
}

async function handleVerifyAudioUrl(args: any): Promise<string> {
  const { expected, audioUrl, model = 'whisper-1', chatModel = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    // Fetch audio from S3 URL
    const response = await fetch(audioUrl);
    const audioBuffer = await response.arrayBuffer();
    const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
    
    // Transcribe
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file,
      model,
    });
    
    // Verify
    const verifyPrompt = `Expected answer: "${expected}"\nTranscribed answer: "${transcriptionResponse.text}"\n\nAre these equivalent? Respond with JSON: { "correct": boolean, "score": 0-100, "feedback": string }`;
    
    const verifyResponse = await openai.chat.completions.create({
      model: chatModel,
      messages: [{ role: 'user', content: verifyPrompt }],
      temperature: 0.3,
    });
    
    return verifyResponse.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Verify Audio URL Error]:', error);
    throw error;
  }
}

async function handleTranscribeUrl(args: any): Promise<string> {
  const { audioUrl, model = 'whisper-1' } = args;
  const openai = await getOpenAI();
  
  try {
    // Fetch audio from S3 URL
    const response = await fetch(audioUrl);
    const audioBuffer = await response.arrayBuffer();
    const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
    
    // Transcribe
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file,
      model,
    });
    
    return transcriptionResponse.text;
  } catch (error) {
    console.error('[Transcribe URL Error]:', error);
    throw error;
  }
}

async function handleProcessImage(args: any): Promise<string> {
  const { image, model = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Process Image Error]:', error);
    throw error;
  }
}

async function handleProcessImageUrl(args: any): Promise<string> {
  const { imageUrl, model = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Process Image URL Error]:', error);
    throw error;
  }
}

async function handleVerifyImage(args: any): Promise<string> {
  const { expected, image, model = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Expected: "${expected}"\n\nAnalyze this image. Does it match the expected description? Respond with JSON: { "matches": boolean, "score": 0-100, "feedback": string }`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}` },
            },
          ],
        },
      ],
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Verify Image Error]:', error);
    throw error;
  }
}

async function handleVerifyImageUrl(args: any): Promise<string> {
  const { expected, imageUrl, model = 'gpt-4o' } = args;
  const openai = await getOpenAI();
  
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Expected: "${expected}"\n\nAnalyze this image. Does it match the expected description? Respond with JSON: { "matches": boolean, "score": 0-100, "feedback": string }`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Verify Image URL Error]:', error);
    throw error;
  }
}