/**
 * Embeddings Lambda Handler for Gen 2
 * 
 * Handles:
 * - generateEmbedding: Generate single embedding for content
 * - generateEmbeddings: Generate embeddings for document pages
 * 
 * Reference: amplify/backend/function/generateEmbedding/
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
function requireAuth(event: any, context: any) {
  const userId = event.requestContext?.authorizer?.claims?.sub;

  if (!userId) {
    throw new Error('Unauthorized: User authentication required');
  }

  return { userId };
}

export const handler: Handler = async (event: any, context: any) => {
  const operationName = context?.['x-operation-name'] || event.info?.fieldName;
  const args = event.arguments || {};

  // Require authentication for all operations
  const { userId } = requireAuth(event, context);

  console.log(`[Embeddings Handler] ${operationName}`, args);

  try {
    switch (operationName) {
      case 'generateEmbedding':
        return await handleGenerateEmbedding(args);
      case 'generateEmbeddings':
        return await handleGenerateEmbeddings(args);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  } catch (error) {
    console.error(`[Embeddings Handler Error] ${operationName}:`, error);
    throw error;
  }
};

async function handleGenerateEmbedding(args: any): Promise<any> {
  const { content, model = 'text-embedding-3-small', dimensions = 512 } = args;
  const openai = await getOpenAI();

  try {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    const estimatedTokens = Math.ceil(content.length / 4);
    if (estimatedTokens > 8000) {
      throw new Error(`Content too long: ~${estimatedTokens} tokens (max 8000)`);
    }

    const response = await openai.embeddings.create({
      model,
      input: content,
      dimensions,
    });

    const embedding = response.data[0]?.embedding || [];

    return {
      embedding,
      model: response.model,
      dimensions: embedding.length,
      tokenCount: response.usage?.prompt_tokens || 0,
      error: null,
    };
  } catch (error) {
    console.error('[Generate Embedding Error]:', error);
    throw error;
  }
}

async function handleGenerateEmbeddings(args: any): Promise<any> {
  const { fileID } = args;
  const openai = await getOpenAI();

  try {
    console.log('[Generate Embeddings] Starting for fileID:', fileID);
    const graphqlEndpoint = process.env.API_ENDPOINT;
    if (!graphqlEndpoint) {
      throw new Error('API_ENDPOINT environment variable not set');
    }

    const { GraphQLClient } = await import('graphql-request');
    const client = new GraphQLClient(graphqlEndpoint);

    // Query for ParsedContent records by fileID
    const query = `
      query ParsedContentsByFileID($fileID: ID!) {
        parsedContentsByFileID(fileID: $fileID) {
          items {
            id
            documentID
            fileID
            vocabularyJSON
            summariesJSON
            objectivesJSON
            questionsJSON
          }
        }
      }
    `;

    const result: any = await client.request(query, { fileID });
    const parsedContents = result.parsedContentsByFileID?.items || [];

    if (parsedContents.length === 0) {
      console.log('[Generate Embeddings] No parsed content found for fileID:', fileID);
      return {
        fileID,
        success: false,
        embeddingCount: 0,
        message: 'No parsed content found for file',
      };
    }

    const parsedContent = parsedContents[0];
    let embeddingCount = 0;

    // 2. Extract page-by-page text from vocabularyJSON
    let pageEmbeddings: any[] = [];

    // Extract from vocabulary
    if (parsedContent.vocabularyJSON) {
      const vocabulary = typeof parsedContent.vocabularyJSON === 'string'
        ? JSON.parse(parsedContent.vocabularyJSON)
        : parsedContent.vocabularyJSON;

      if (Array.isArray(vocabulary)) {
        for (const item of vocabulary) {
          const text = `${item.word} - ${item.definition || ''}${item.context ? ' (' + item.context + ')' : ''}`;
          pageEmbeddings.push({
            type: 'vocabulary',
            page: item.page || 0,
            text: text.substring(0, 8000),
            sourceId: item.word,
          });
        }
      }
    }

    // Extract from summaries
    if (parsedContent.summariesJSON) {
      const summaries = typeof parsedContent.summariesJSON === 'string'
        ? JSON.parse(parsedContent.summariesJSON)
        : parsedContent.summariesJSON;

      if (Array.isArray(summaries)) {
        for (const item of summaries) {
          pageEmbeddings.push({
            type: 'summary',
            page: item.page || 0,
            text: item.content?.substring(0, 8000) || '',
            sourceId: item.title,
          });
        }
      }
    }

    // 3. Generate embeddings for each page
    console.log(`[Generate Embeddings] Generating embeddings for ${pageEmbeddings.length} items...`);

    const embeddedPages = [];
    for (const page of pageEmbeddings) {
      if (!page.text || page.text.trim().length === 0) {
        console.log('[Generate Embeddings] Skipping empty text');
        continue;
      }

      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: page.text,
          dimensions: 512,
        });

        const embedding = response.data[0]?.embedding || [];
        embeddedPages.push({
          page: page.page,
          type: page.type,
          text: page.text,
          sourceId: page.sourceId,
          embedding: JSON.stringify(embedding),
          model: 'text-embedding-3-small',
          dimensions: embedding.length,
          tokenCount: response.usage?.prompt_tokens || 0,
        });

        embeddingCount++;
        console.log(`[Generate Embeddings] Embedded item ${embeddingCount}: ${page.sourceId}`);
      } catch (error) {
        console.error(`[Generate Embeddings] Error embedding "${page.sourceId}":`, error);
        // Continue with next item on error
      }
    }

    // 4. Batch save PageEmbedding records via GraphQL
    console.log(`[Generate Embeddings] Saving ${embeddedPages.length} embeddings to database...`);

    // Note: In a real scenario, you'd create bulk mutation or use batch API
    // For now, we'll create individual records
    const createPageEmbeddingMutation = `
      mutation CreatePageEmbedding($input: CreatePageEmbeddingInput!) {
        createPageEmbedding(input: $input) {
          id
          documentID
          page
          embedding
          model
        }
      }
    `;

    for (const embeddedPage of embeddedPages) {
      try {
        await client.request(createPageEmbeddingMutation, {
          input: {
            documentID: parsedContent.documentID,
            page: embeddedPage.page,
            text: embeddedPage.text,
            sourceId: embeddedPage.sourceId,
            embedding: embeddedPage.embedding,
            model: embeddedPage.model,
            dimensions: embeddedPage.dimensions,
            tokenCount: embeddedPage.tokenCount,
            type: embeddedPage.type,
          }
        });
      } catch (error) {
        console.error(`[Generate Embeddings] Error saving embedding for page ${embeddedPage.page}:`, error);
        // Continue with next record
      }
    }

    // 5. Update File status
    console.log('[Generate Embeddings] Updating file status to "embedded"...');

    const updateFileMutation = `
      mutation UpdateFile($input: UpdateFileInput!) {
        updateFile(input: $input) {
          id
          status
        }
      }
    `;

    try {
      await client.request(updateFileMutation, {
        input: {
          id: fileID,
          status: 'embedded',
        }
      });
    } catch (error) {
      console.error('[Generate Embeddings] Error updating file status:', error);
      // Don't fail the whole operation if status update fails
    }

    console.log(`[Generate Embeddings] Complete: Generated ${embeddingCount} embeddings for ${fileID}`);

    return {
      fileID,
      success: true,
      embeddingCount,
      processedItems: embeddedPages.length,
      message: `Successfully generated ${embeddingCount} embeddings`,
    };
  } catch (error) {
    console.error('[Generate Embeddings Error]:', error);
    throw error;
  }
}