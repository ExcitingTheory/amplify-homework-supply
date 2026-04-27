/**
 * Moderation Handler for Gen 2
 * 
 * Handles:
 * - moderateContent: Check content with OpenAI moderation API
 * 
 * Reference: amplify/backend/function/moderation-${env}/
 */

import type { Handler } from 'aws-lambda';

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
    switch (operationName) {
      case 'moderateContent':
        return await handleModerateContent(args);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
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
  model: 'text-moderation-latest',
};

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
      input: content,
    });

    const result = response.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      model: response.model || 'text-moderation-latest',
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