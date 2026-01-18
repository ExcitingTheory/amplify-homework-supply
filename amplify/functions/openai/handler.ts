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
import { CognitoIdentityClient, GetIdCommand } from '@aws-sdk/client-cognito-identity';
import { GraphQLClient } from 'graphql-request';

const lambdaClient = new LambdaClient();
const cognitoIdentityClient = new CognitoIdentityClient();
let openaiInstance: any = null;

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable not set');
    const OpenAI = (await import('openai')).default;
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

function getGraphQLClient(authToken: string): GraphQLClient {
  const apiEndpoint = process.env.API_ENDPOINT;
  if (!apiEndpoint) throw new Error('API_ENDPOINT environment variable not set');
  
  return new GraphQLClient(apiEndpoint, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

async function getIdentityId(userPoolId: string, authToken: string): Promise<string> {
  const identityPoolId = process.env.IDENTITY_POOL_ID;
  if (!identityPoolId) throw new Error('IDENTITY_POOL_ID environment variable not set');
  
  const command = new GetIdCommand({
    IdentityPoolId: identityPoolId,
    Logins: {
      [`cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${userPoolId}`]: authToken,
    },
  });
  
  const response = await cognitoIdentityClient.send(command);
  if (!response.IdentityId) throw new Error('Failed to retrieve identity ID from Cognito');
  
  return response.IdentityId;
}

/**
 * Authorization check utility
 * Verifies user is authenticated and extracts claims
 */
function requireAuth(event: any, context: any) {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  const authToken = event.request?.authToken || context.authorizer?.token;
  
  if (!userId || !authToken) {
    throw new Error('Unauthorized: User authentication required');
  }
  
  return { userId, authToken };
}

const createFileMutation = `
  mutation CreateFile(
    $input: CreateFileInput!
  ) {
    createFile(input: $input) {
      id
      name
      type
      s3Key
      createdAt
      status
    }
  }
`;

const updateFileMutation = `
  mutation UpdateFile(
    $input: UpdateFileInput!
  ) {
    updateFile(input: $input) {
      id
      status
    }
  }
`;

export const handler: Handler = async (event: any, context: any) => {
  // Extract which operation is being called from the AppSync context
  const operationName = context?.['x-operation-name'] || event.info?.fieldName;
  
  console.log(`[OpenAI Handler] ${operationName}`, event.arguments);

  try {
    // Require authentication for all operations
    const { userId, authToken } = requireAuth(event, context);
    const userPoolId = process.env.USER_POOL_ID;
    const args = event.arguments || {};
    const graphqlClient = getGraphQLClient(authToken);

    switch (operationName) {
      case 'chat':
        return await handleChat(args);
      case 'generateAudio':
        return await handleGenerateAudio(args);
      case 'generateAudioFile':
        return await handleGenerateAudioFile(args, graphqlClient, userId, userPoolId, authToken);
      case 'generateAudioFileAsync':
        return await handleGenerateAudioFileAsync(args);
      case 'generateImage':
        return await handleGenerateImage(args);
      case 'generateImageFile':
        return await handleGenerateImageFile(args, graphqlClient, userId, userPoolId, authToken);
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

async function handleGenerateAudioFile(args: any, client: GraphQLClient | null, userId: string, userPoolId: string | undefined, authToken: string): Promise<any> {
  const { phrase, voice = 'alloy', model = 'tts-1' } = args;
  
  try {
    // Create File model with pending status first
    if (!client) throw new Error('GraphQL client not available for file creation');
    if (!userId) throw new Error('User ID not available');
    if (!userPoolId) throw new Error('User pool ID not available');
    if (!authToken) throw new Error('Auth token not available');
    
    // Get identity ID from Cognito Identity Pool
    const identityId = await getIdentityId(userPoolId, authToken);
    
    const timestamp = Date.now();
    const fileName = `generated-audio-${timestamp}.mp3`;
    const s3Key = `public/audio/${timestamp}/${fileName}`;
    
    const fileResponse: any = await client.request(createFileMutation, {
      input: {
        name: fileName,
        type: 'audio/mpeg',
        s3Key,
        status: 'pending',
        identityId,
      }
    });
    
    const fileId = fileResponse.createFile.id;
    
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
        authToken,
      }),
    }));
    
    return {
      id: fileId,
      filename: fileName,
      fileType: 'audio/mpeg',
      s3Key,
      status: 'pending',
      contentType: 'audio/mpeg',
    };
  } catch (error) {
    console.error('[Generate Audio File Error]:', error);
    throw error;
  }
}

async function handleGenerateAudioFileAsync(args: any): Promise<void> {
  const { fileId, phrase, voice = 'alloy', model = 'tts-1', authToken } = args;
  const openai = await getOpenAI();
  const client = getGraphQLClient(authToken);
  
  try {
    // Generate audio
    const response = await openai.audio.speech.create({
      model,
      voice,
      input: phrase,
    });
    
    const buffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');
    
    // Update File with completed status and data
    await client.request(updateFileMutation, {
      input: {
        id: fileId,
        status: 'completed',
        data: base64Audio,
      }
    });
    
    console.log(`[Audio Generation Complete] ${fileId}`);
  } catch (error) {
    console.error('[Generate Audio File Async Error]:', error);
    // Update File with error status
    try {
      const client = getGraphQLClient(args.authToken);
      await client.request(updateFileMutation, {
        input: {
          id: fileId,
          status: 'error',
          error: String(error),
        }
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

async function handleGenerateImageFile(args: any, client: GraphQLClient | null, userId: string, userPoolId: string | undefined, authToken: string): Promise<any> {
  const { phrase, model = 'dall-e-3' } = args;
  
  try {
    // Create File model with pending status first
    if (!client) throw new Error('GraphQL client not available for file creation');
    if (!userId) throw new Error('User ID not available');
    if (!userPoolId) throw new Error('User pool ID not available');
    if (!authToken) throw new Error('Auth token not available');
    
    // Get identity ID from Cognito Identity Pool
    const identityId = await getIdentityId(userPoolId, authToken);
    
    const timestamp = Date.now();
    const fileName = `generated-image-${timestamp}.png`;
    const s3Key = `public/images/${timestamp}/${fileName}`;
    
    const fileResponse: any = await client.request(createFileMutation, {
      input: {
        name: fileName,
        type: 'image/png',
        s3Key,
        status: 'pending',
        identityId,
      }
    });
    
    const fileId = fileResponse.createFile.id;
    
    // Invoke Lambda asynchronously to generate the actual image
    await lambdaClient.send(new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify({
        operation: 'generateImageFileAsync',
        fileId,
        phrase,
        model,
        authToken,
      }),
    }));
    
    return {
      id: fileId,
      filename: fileName,
      fileType: 'image/png',
      s3Key,
      status: 'pending',
    };
  } catch (error) {
    console.error('[Generate Image File Error]:', error);
    throw error;
  }
}

async function handleGenerateImageFileAsync(args: any): Promise<void> {
  const { fileId, phrase, model = 'dall-e-3', authToken } = args;
  const openai = await getOpenAI();
  const client = getGraphQLClient(authToken);
  
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
    
    // Update File with completed status and data
    await client.request(updateFileMutation, {
      input: {
        id: fileId,
        status: 'completed',
        data: base64,
      }
    });
    
    console.log(`[Image Generation Complete] ${fileId}`);
  } catch (error) {
    console.error('[Generate Image File Async Error]:', error);
    // Update File with error status
    try {
      const client = getGraphQLClient(args.authToken);
      await client.request(updateFileMutation, {
        input: {
          id: fileId,
          status: 'error',
          error: String(error),
        }
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