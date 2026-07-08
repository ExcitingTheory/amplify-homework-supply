/**
 * Embeddings Lambda Handler for Gen 2
 *
 * Handles:
 * - generateEmbedding: Generate single embedding for content
 * - generateEmbeddings: Generate embeddings for document pages
 *
 * Uses Xenova/all-MiniLM-L6-v2 (384D) for offline-compatible embeddings.
 */

import type { Handler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromEnv } from "@aws-sdk/credential-providers";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { pipeline, env } from "@huggingface/transformers";

const EMBEDDING_DIMENSIONS = 384;
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

// Configure Amplify at module level (before creating client)
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: process.env.API_ENDPOINT || "",
        region: process.env.AWS_REGION || "us-east-1",
        defaultAuthMode: "iam",
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

// Singleton embedding pipeline
let embeddingPipeline: any = null;
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

function getDataClient() {
  if (!dataClient) {
    dataClient = generateClient<Schema>({
      authMode: "iam",
    });
  }
  return dataClient;
}

async function getEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline;
  env.allowLocalModels = false;
  embeddingPipeline = await pipeline("feature-extraction", EMBEDDING_MODEL, {
    dtype: "q8",
  });
  return embeddingPipeline;
}

async function generateEmbeddingVector(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array).slice(0, EMBEDDING_DIMENSIONS);
}

const s3 = new S3Client({});
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "";

/**
 * Save embedding vectors to S3.
 * Path: private/{identityId}/embeddings/{modelName}/{modelId}.json
 */
async function saveEmbeddingToS3(
  identityId: string,
  modelName: string,
  modelId: string,
  data: {
    model: string;
    dimensions: number;
    generatedAt: number;
    wordCount: number;
    pages: Array<{ page: number; embedding: number[]; text?: string }>;
  },
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: `private/${identityId}/embeddings/${modelName}/${modelId}.json`,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    }),
  );
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
  const { content } = args;

  try {
    if (!content || content.trim().length === 0) {
      throw new Error("Content cannot be empty");
    }

    const embedding = await generateEmbeddingVector(content);

    return {
      embedding,
      model: EMBEDDING_MODEL,
      dimensions: embedding.length,
      tokenCount: Math.ceil(content.length / 4),
      error: null,
    };
  } catch (error) {
    console.error("[Generate Embedding Error]:", error);
    throw error;
  }
}

async function handleGenerateEmbeddings(args: any): Promise<any> {
  const { fileID } = args;

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
        const embedding = await generateEmbeddingVector(page.text);

        embeddedPages.push({
          page: page.page,
          type: page.type,
          text: page.text,
          sourceId: page.sourceId,
          embedding: JSON.stringify(embedding),
          model: EMBEDDING_MODEL,
          dimensions: embedding.length,
          tokenCount: Math.ceil(page.text.length / 4),
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

    // Note: PageEmbedding model doesn't exist in schema - storing in S3 and ParsedContent metadata
    console.log(
      "[Generate Embeddings] Saving embeddings to S3 and ParsedContent metadata...",
    );

    // Save all page embeddings to S3 as a single file
    if (STORAGE_BUCKET && embeddedPages.length > 0) {
      // Get file owner's identityId from File record
      const getFileOwnerQuery = /* GraphQL */ `
        query GetFile($id: ID!) {
          getFile(id: $id) {
            id
            owner
            identityId
          }
        }
      `;
      const { data: fileOwnerData } = (await client.graphql({
        query: getFileOwnerQuery,
        variables: { id: fileID },
      })) as any;

      const identityId =
        fileOwnerData?.getFile?.identityId || fileOwnerData?.getFile?.owner;

      if (identityId) {
        await saveEmbeddingToS3(identityId, "file", fileID, {
          model: EMBEDDING_MODEL,
          dimensions: EMBEDDING_DIMENSIONS,
          generatedAt: Date.now(),
          wordCount: embeddedPages.reduce(
            (sum: number, p: any) => sum + (p.text?.split(/\s+/).length || 0),
            0,
          ),
          pages: embeddedPages.map((p: any) => ({
            page: p.page,
            embedding: JSON.parse(p.embedding),
            text: p.text?.substring(0, 200),
          })),
        });
        console.log(
          `[Generate Embeddings] Saved ${embeddedPages.length} embeddings to S3`,
        );

        // Update File model with embedding metadata only (no vector)
        const updateFileMutation = /* GraphQL */ `
          mutation UpdateFile($input: UpdateFileInput!) {
            updateFile(input: $input) {
              id
              _version
            }
          }
        `;
        try {
          await client.graphql({
            query: updateFileMutation,
            variables: {
              input: {
                id: fileID,
                embedding: JSON.stringify({
                  model: EMBEDDING_MODEL,
                  dimensions: EMBEDDING_DIMENSIONS,
                  version: Date.now(),
                  wordCount: embeddedPages.reduce(
                    (sum: number, p: any) =>
                      sum + (p.text?.split(/\s+/).length || 0),
                    0,
                  ),
                  pageCount: embeddedPages.length,
                }),
                _version: fileData.getFile._version,
              },
            },
          } as any);
        } catch (error) {
          console.error(
            "[Generate Embeddings] Error updating File embedding metadata:",
            error,
          );
        }
      }
    }

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
              _version: parsedContent._version ?? 1,
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
            _version: docData?.getDocument?._version ?? 1,
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
