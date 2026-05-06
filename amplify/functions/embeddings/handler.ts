/**
 * Embeddings Lambda Handler for Gen 2
 *
 * Handles:
 * - generateEmbedding: Generate single embedding for content
 * - generateEmbeddings: Generate embeddings for document pages
 *
 * Reference: amplify/backend/function/generateEmbedding/
 */

import type { Handler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromEnv } from "@aws-sdk/credential-providers";

// Configure Amplify at module level (before creating client)
// Lambda resolvers get API_ENDPOINT and AWS_REGION automatically
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || "",
        region: process.env.AWS_REGION || "us-east-1",
        defaultAuthMode: "iam", // Lambda uses IAM auth
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
  },
);

let openaiInstance: any = null;
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

function getDataClient() {
  if (!dataClient) {
    dataClient = generateClient<Schema>({
      authMode: "iam",
    });
  }
  return dataClient;
}

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY environment variable not set");
    const OpenAI = (await import("openai")).default;
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
    console.error(
      "[Embeddings Handler] No user identity found in event:",
      JSON.stringify(event, null, 2),
    );
    throw new Error("Unauthorized: User authentication required");
  }

  return { userId, username: username || userId };
}

export const handler: Handler = async (event: any, context: any) => {
  // Extract operation name from AppSync event
  const operationName = event.info?.fieldName || event.fieldName;
  const args = event.arguments || {};

  if (!operationName) {
    console.error(
      "[Embeddings Handler] No operation name found in event:",
      JSON.stringify(event, null, 2),
    );
    throw new Error("Unable to determine operation name from event");
  }

  // Require authentication for all operations
  const { userId } = requireAuth(event);

  console.log(`[Embeddings Handler] ${operationName}`, args);

  try {
    switch (operationName) {
      case "generateEmbedding":
        return await handleGenerateEmbedding(args);
      case "generateEmbeddings":
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
  const { content, model = "text-embedding-3-small", dimensions = 512 } = args;
  const openai = await getOpenAI();

  try {
    if (!content || content.trim().length === 0) {
      throw new Error("Content cannot be empty");
    }

    const estimatedTokens = Math.ceil(content.length / 4);
    if (estimatedTokens > 8000) {
      throw new Error(
        `Content too long: ~${estimatedTokens} tokens (max 8000)`,
      );
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
    console.error("[Generate Embedding Error]:", error);
    throw error;
  }
}

async function handleGenerateEmbeddings(args: any): Promise<any> {
  const { fileID } = args;
  const openai = await getOpenAI();

  try {
    console.log("[Generate Embeddings] Starting for fileID:", fileID);
    const client = getDataClient();

    // Get File record
    const getFileQuery = /* GraphQL */ `
      query GetFile($id: ID!) {
        getFile(id: $id) {
          id
          _version
          _lastChangedAt
          _deleted
          documentID
        }
      }
    `;

    const { data: fileData, errors: fileErrors } = (await client.graphql({
      query: getFileQuery,
      variables: { id: fileID },
    })) as any;

    if (fileErrors || !fileData?.getFile) {
      console.error("[Generate Embeddings] File not found:", fileErrors);
      throw new Error(`File not found for ID: ${fileID}`);
    }

    // Query for ParsedContent records by fileID
    const query = /* GraphQL */ `
      query ListParsedContents($filter: ModelParsedContentFilterInput) {
        listParsedContents(filter: $filter) {
          items {
            id
            _version
            _lastChangedAt
            _deleted
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

    const { data: parsedData, errors: parsedErrors } = (await client.graphql({
      query,
      variables: {
        filter: {
          fileID: { eq: fileID },
        },
      },
    })) as any;

    if (parsedErrors) {
      console.error(
        "[Generate Embeddings] Error querying ParsedContent:",
        parsedErrors,
      );
    }

    const parsedContents = parsedData?.listParsedContents?.items || [];

    if (parsedContents.length === 0) {
      console.log(
        "[Generate Embeddings] No parsed content found for fileID:",
        fileID,
      );
      return {
        fileID,
        success: false,
        embeddingCount: 0,
        message: "No parsed content found for file",
      };
    }

    const parsedContent = parsedContents[0];
    let embeddingCount = 0;

    // 2. Extract page-by-page text from vocabularyJSON
    let pageEmbeddings: any[] = [];

    // Extract from vocabulary
    if (parsedContent.vocabularyJSON) {
      const vocabulary =
        typeof parsedContent.vocabularyJSON === "string"
          ? JSON.parse(parsedContent.vocabularyJSON)
          : parsedContent.vocabularyJSON;

      if (Array.isArray(vocabulary)) {
        for (const item of vocabulary) {
          const text = `${item.word} - ${item.definition || ""}${item.context ? " (" + item.context + ")" : ""}`;
          pageEmbeddings.push({
            type: "vocabulary",
            page: item.page || 0,
            text: text.substring(0, 8000),
            sourceId: item.word,
          });
        }
      }
    }

    // Extract from summaries
    if (parsedContent.summariesJSON) {
      const summaries =
        typeof parsedContent.summariesJSON === "string"
          ? JSON.parse(parsedContent.summariesJSON)
          : parsedContent.summariesJSON;

      if (Array.isArray(summaries)) {
        for (const item of summaries) {
          pageEmbeddings.push({
            type: "summary",
            page: item.page || 0,
            text: item.content?.substring(0, 8000) || "",
            sourceId: item.title,
          });
        }
      }
    }

    // 3. Generate embeddings for each page
    console.log(
      `[Generate Embeddings] Generating embeddings for ${pageEmbeddings.length} items...`,
    );

    const embeddedPages = [];
    for (const page of pageEmbeddings) {
      if (!page.text || page.text.trim().length === 0) {
        console.log("[Generate Embeddings] Skipping empty text");
        continue;
      }

      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
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
          model: "text-embedding-3-small",
          dimensions: embedding.length,
          tokenCount: response.usage?.prompt_tokens || 0,
        });

        embeddingCount++;
        console.log(
          `[Generate Embeddings] Embedded item ${embeddingCount}: ${page.sourceId}`,
        );
      } catch (error) {
        console.error(
          `[Generate Embeddings] Error embedding "${page.sourceId}":`,
          error,
        );
        // Continue with next item on error
      }
    }

    // 4. Batch save PageEmbedding records via GraphQL
    console.log(
      `[Generate Embeddings] Saving ${embeddedPages.length} embeddings to database...`,
    );

    // Note: PageEmbedding model doesn't exist in schema - storing as parsedContent metadata instead
    // The embeddings are now part of the ParsedContent record itself
    console.log(
      "[Generate Embeddings] Embeddings generated, storing in ParsedContent metadata...",
    );

    // Update ParsedContent with embedding metadata
    if (parsedContent && parsedContents.length > 0) {
      const updateParsedContentMutation = /* GraphQL */ `
        mutation UpdateParsedContent($input: UpdateParsedContentInput!) {
          updateParsedContent(input: $input) {
            id
            _version
            _lastChangedAt
            _deleted
            metadata
          }
        }
      `;

      try {
        await client.graphql({
          query: updateParsedContentMutation,
          variables: {
            input: {
              id: parsedContent.id,
              _version: parsedContent._version,
              metadata: JSON.stringify({
                embeddings: embeddedPages,
                embeddingCount,
                generatedAt: new Date().toISOString(),
              }),
            },
          },
        } as any);
      } catch (error) {
        console.error(
          "[Generate Embeddings] Error updating ParsedContent metadata:",
          error,
        );
      }
    }

    // 5. Update Document status
    console.log(
      '[Generate Embeddings] Updating document status to "embedded"...',
    );

    const updateDocumentMutation = /* GraphQL */ `
      mutation UpdateDocument($input: UpdateDocumentInput!) {
        updateDocument(input: $input) {
          id
          _version
          _lastChangedAt
          _deleted
          status
        }
      }
    `;

    try {
      // Fetch document _version for optimistic locking
      const getDocQuery = /* GraphQL */ `
        query GetDocument($id: ID!) {
          getDocument(id: $id) {
            id
            _version
            _lastChangedAt
            _deleted
          }
        }
      `;
      const { data: docData } = (await client.graphql({
        query: getDocQuery,
        variables: { id: parsedContent.documentID },
      } as any)) as any;

      await client.graphql({
        query: updateDocumentMutation,
        variables: {
          input: {
            id: parsedContent.documentID,
            status: "embedded",
            _version: docData?.getDocument?._version,
          },
        },
      } as any);
    } catch (error) {
      console.error(
        "[Generate Embeddings] Error updating document status:",
        error,
      );
      // Don't fail the whole operation if status update fails
    }

    console.log(
      `[Generate Embeddings] Complete: Generated ${embeddingCount} embeddings for ${fileID}`,
    );

    return {
      fileID,
      success: true,
      embeddingCount,
      processedItems: embeddedPages.length,
      message: `Successfully generated ${embeddingCount} embeddings`,
    };
  } catch (error) {
    console.error("[Generate Embeddings Error]:", error);
    throw error;
  }
}
