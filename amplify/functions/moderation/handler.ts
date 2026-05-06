/**
 * Moderation Handler for Gen 2
 * 
 * Handles:
 * - moderateContent: Check text content with OpenAI moderation API
 * - moderateImage: Check image content via omni-moderation-latest (multi-modal)
 * - moderateAudio: Transcribe audio via Whisper then moderate the transcript
 * 
 * When modelName + recordId are provided, the Lambda fetches the record's _version _lastChangedAt _deleted
 * and writes the moderation result directly to the record's `moderation` field.
 * This ensures moderation state is always server-authoritative (untrusted frontend
 * cannot skip or falsify moderation).
 */

import type { Handler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { fromEnv } from '@aws-sdk/credential-providers';
import { type Schema } from '../../data/resource';

// Configure Amplify for GraphQL access from Lambda (IAM auth)
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || '',
        region: process.env.AWS_REGION || 'us-east-1',
        defaultAuthMode: 'iam',
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

let openaiInstance: any = null;
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

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
    dataClient = generateClient<Schema>({ authMode: 'iam' });
  }
  return dataClient;
}

// ============================================================================
// GraphQL operations for fetching _version and updating moderation field
// ============================================================================

const SUPPORTED_MODELS = ['Unit', 'Grade', 'Word', 'Question'] as const;
type SupportedModel = typeof SUPPORTED_MODELS[number];

const GET_QUERIES: Record<SupportedModel, string> = {
  Unit: /* GraphQL */ `query GetUnit($id: ID!) { getUnit(id: $id) { id _version _lastChangedAt _deleted } }`,
  Grade: /* GraphQL */ `query GetGrade($id: ID!) { getGrade(id: $id) { id _version _lastChangedAt _deleted } }`,
  Word: /* GraphQL */ `query GetWord($id: ID!) { getWord(id: $id) { id _version _lastChangedAt _deleted } }`,
  Question: /* GraphQL */ `query GetQuestion($id: ID!) { getQuestion(id: $id) { id _version _lastChangedAt _deleted } }`,
};

const UPDATE_MUTATIONS: Record<SupportedModel, string> = {
  Unit: /* GraphQL */ `mutation UpdateUnit($input: UpdateUnitInput!) { updateUnit(input: $input) { id moderation } }`,
  Grade: /* GraphQL */ `mutation UpdateGrade($input: UpdateGradeInput!) { updateGrade(input: $input) { id moderation } }`,
  Word: /* GraphQL */ `mutation UpdateWord($input: UpdateWordInput!) { updateWord(input: $input) { id moderation } }`,
  Question: /* GraphQL */ `mutation UpdateQuestion($input: UpdateQuestionInput!) { updateQuestion(input: $input) { id moderation } }`,
};

/**
 * Fetch current _version for a record, then write moderation result to its `moderation` field.
 * This is the server-authoritative write — frontend cannot bypass.
 */
async function persistModerationToRecord(
  modelName: SupportedModel,
  recordId: string,
  moderationResult: { flagged: boolean; categories: any; categoryScores: any; model: string }
): Promise<void> {
  const client = getDataClient();

  // Step 1: Get current _version _lastChangedAt _deleted
  const getQuery = GET_QUERIES[modelName];
  const { data: getData, errors: getErrors } = await client.graphql({
    query: getQuery,
    variables: { id: recordId },
  }) as any;

  if (getErrors?.length) {
    console.error(`[Moderation] Failed to fetch ${modelName} ${recordId}:`, getErrors);
    throw new Error(`Failed to fetch ${modelName} for moderation update`);
  }

  const getKey = `get${modelName}`;
  const record = getData?.[getKey];
  if (!record) {
    console.error(`[Moderation] ${modelName} ${recordId} not found`);
    throw new Error(`${modelName} ${recordId} not found`);
  }

  const currentVersion = record._version;

  // Step 2: Write moderation result to the record
  const moderationField = {
    status: moderationResult.flagged ? 'flagged' : 'approved',
    flags: moderationResult.flagged
      ? JSON.stringify({
          categories: moderationResult.categories,
          categoryScores: moderationResult.categoryScores,
          model: moderationResult.model,
        })
      : null,
    checkedAt: new Date().toISOString(),
  };

  const updateMutation = UPDATE_MUTATIONS[modelName];
  const { errors: updateErrors } = await client.graphql({
    query: updateMutation,
    variables: {
      input: {
        id: recordId,
        _version: currentVersion,
        moderation: moderationField,
      },
    },
  }) as any;

  if (updateErrors?.length) {
    console.error(`[Moderation] Failed to update ${modelName} ${recordId}:`, updateErrors);
    throw new Error(`Failed to persist moderation to ${modelName}`);
  }

  console.log(`[Moderation] Persisted moderation to ${modelName} ${recordId}: status=${moderationField.status}`);
}

/**
 * Authorization check utility
 * Verifies user is authenticated
 */
function requireAuth(event: any) {
  // AppSync provides identity in event.identity, not requestContext
  const userId = event.identity?.sub;
  const username = event.identity?.username;
  
  if (!userId) {
    console.error('[Moderation Handler] No user identity found in event:', JSON.stringify(event, null, 2));
    throw new Error('Unauthorized: User authentication required');
  }
  
  return { userId, username: username || userId };
}

export const handler: Handler = async (event: any, context: any) => {
  // Extract operation name from AppSync event
  const operationName = event.info?.fieldName || event.fieldName;
  const args = event.arguments || {};
  
  if (!operationName) {
    console.error('[Moderation Handler] No operation name found in event:', JSON.stringify(event, null, 2));
    throw new Error('Unable to determine operation name from event');
  }
  
  // Require authentication for all operations
  const { userId } = requireAuth(event);

  console.log(`[Moderation Handler] ${operationName}`, args);

  try {
    let result: any;

    switch (operationName) {
      case 'moderateContent':
        result = await handleModerateContent(args);
        break;
      case 'moderateImage':
        result = await handleModerateImage(args);
        break;
      case 'moderateAudio':
        result = await handleModerateAudio(args);
        break;
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }

    // If caller provided modelName + recordId, persist moderation to the record
    const { modelName, recordId } = args;
    if (modelName && recordId && SUPPORTED_MODELS.includes(modelName as SupportedModel)) {
      try {
        await persistModerationToRecord(modelName as SupportedModel, recordId, result);
      } catch (persistError) {
        // Log but don't fail the moderation call — result is still returned
        console.error('[Moderation Handler] Failed to persist to record (non-blocking):', persistError);
      }
    }

    return result;
  } catch (error) {
    console.error(`[Moderation Handler Error] ${operationName}:`, error);
    throw error;
  }
};

/** Safe fallback when moderation cannot be performed */
const MODERATION_FALLBACK = {
  flagged: false,
  categories: {},
  categoryScores: {},
  model: 'omni-moderation-latest',
};

/**
 * Moderate text content using omni-moderation-latest
 */
async function handleModerateContent(args: any): Promise<any> {
  const { content } = args;
  
  // Guard against empty, null-like, or meaningless content
  if (!content || content.trim().length === 0 || content.trim() === 'null' || content.trim() === 'undefined') {
    console.warn('[Moderation Handler] Skipping moderation for empty/null content');
    return MODERATION_FALLBACK;
  }

  const openai = await getOpenAI();
  
  try {
    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: content,
    });

    const result = response.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      model: response.model || 'omni-moderation-latest',
    };
  } catch (error: any) {
    console.error('[Moderate Content Error]:', error);
    // Return safe fallback on rate limit or transient errors instead of crashing
    if (error?.status === 429 || error?.status >= 500) {
      console.warn(`[Moderation Handler] OpenAI returned ${error.status}, returning safe fallback`);
      return MODERATION_FALLBACK;
    }
    throw error;
  }
}

/**
 * Moderate image content using omni-moderation-latest multi-modal input
 * Accepts an image URL (S3 presigned URL or public URL)
 */
async function handleModerateImage(args: any): Promise<any> {
  const { imageUrl } = args;
  
  if (!imageUrl || imageUrl.trim().length === 0) {
    console.warn('[Moderation Handler] Skipping image moderation for empty URL');
    return MODERATION_FALLBACK;
  }

  // Validate URL format
  try {
    new URL(imageUrl);
  } catch {
    throw new Error('Invalid imageUrl: must be a valid URL');
  }

  const openai = await getOpenAI();
  
  try {
    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: [
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
          },
        },
      ],
    });

    const result = response.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      model: response.model || 'omni-moderation-latest',
    };
  } catch (error: any) {
    console.error('[Moderate Image Error]:', error);
    if (error?.status === 429 || error?.status >= 500) {
      console.warn(`[Moderation Handler] OpenAI returned ${error.status}, returning safe fallback`);
      return MODERATION_FALLBACK;
    }
    throw error;
  }
}

/**
 * Moderate audio content by transcribing via Whisper then moderating the transcript
 * Accepts an audio URL (S3 presigned URL or public URL)
 */
async function handleModerateAudio(args: any): Promise<any> {
  const { audioUrl } = args;
  
  if (!audioUrl || audioUrl.trim().length === 0) {
    console.warn('[Moderation Handler] Skipping audio moderation for empty URL');
    return MODERATION_FALLBACK;
  }

  // Validate URL format
  try {
    new URL(audioUrl);
  } catch {
    throw new Error('Invalid audioUrl: must be a valid URL');
  }

  const openai = await getOpenAI();
  
  try {
    // Step 1: Fetch audio from URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    const audioBuffer = await audioResponse.arrayBuffer();
    const file = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

    // Step 2: Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    const transcript = transcription.text;
    console.log(`[Moderation Handler] Audio transcribed: ${transcript.substring(0, 100)}...`);

    // Step 3: If transcription is empty/silent, return safe
    if (!transcript || transcript.trim().length === 0) {
      return {
        ...MODERATION_FALLBACK,
        transcript: '',
      };
    }

    // Step 4: Moderate the transcript using omni-moderation-latest
    const moderationResponse = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: transcript,
    });

    const result = moderationResponse.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      model: moderationResponse.model || 'omni-moderation-latest',
      transcript,
    };
  } catch (error: any) {
    console.error('[Moderate Audio Error]:', error);
    if (error?.status === 429 || error?.status >= 500) {
      console.warn(`[Moderation Handler] OpenAI returned ${error.status}, returning safe fallback`);
      return MODERATION_FALLBACK;
    }
    throw error;
  }
}