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
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { pipeline, env } from "@huggingface/transformers";

import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  buildEmbeddingFile,
  buildEmbeddingInfo,
  buildEmbeddingItems,
  embedItems,
  embeddingObjectKey,
  type EmbeddingFile,
} from "./embeddingItems";
import {
  SUMMARIES_SELECTION,
  VOCABULARY_SELECTION,
} from "../shared/parsedContentLists";
import { mergeParsedContentChunks } from "../shared/parsedContentChunks";
import { listParsedContentChunksByRelation } from "../shared/parsedContentGraphql";

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
          credentials: await fromNodeProviderChain()(),
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
  // /var/task is read-only on Lambda; /tmp is the only writable location.
  env.cacheDir = "/tmp/transformers-cache";
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
 * Path: private/{identityId}/embeddings/file/{fileId}.json
 */
async function saveEmbeddingToS3(
  identityId: string,
  fileId: string,
  data: EmbeddingFile,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: embeddingObjectKey(identityId, fileId),
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
  if (event.workflowMode === "generateEmbeddingsForAnalysis") {
    if (typeof event.fileID !== "string" || !event.fileID) {
      throw new Error("Workflow embedding request is missing fileID");
    }
    return handleGenerateEmbeddings({
      fileID: event.fileID,
      updateDocumentStatus: false,
    });
  }

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
  const { fileID, updateDocumentStatus = true } = args;

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

    // A long document is stored as several ParsedContent chunks; merge them so
    // every vocabulary entry and summary is embedded, not just the first chunk's.
    const parsedContent = mergeParsedContentChunks(
      await listParsedContentChunksByRelation(
        async (request) => (await client.graphql(request as any)) as any,
        { type: "File", id: fileID },
        `${VOCABULARY_SELECTION} ${SUMMARIES_SELECTION}`,
      ),
    );

    if (!parsedContent) {
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

    let embeddingCount = 0;

    // 2. Build the items to embed from the vocabulary and summaries
    const pageEmbeddings = buildEmbeddingItems(parsedContent);

    // 3. Generate an embedding for each item
    console.log(
      `[Generate Embeddings] Generating embeddings for ${pageEmbeddings.length} items...`,
    );
    const embeddedPages = await embedItems(
      pageEmbeddings,
      generateEmbeddingVector,
    );
    embeddingCount = embeddedPages.length;

    // 4. Vectors go to S3; File.embedding keeps metadata only
    if (STORAGE_BUCKET && embeddedPages.length > 0) {
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
        await saveEmbeddingToS3(
          identityId,
          fileID,
          buildEmbeddingFile(embeddedPages),
        );
        console.log(
          `[Generate Embeddings] Saved ${embeddedPages.length} embeddings to S3`,
        );

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
                embedding: buildEmbeddingInfo(embeddedPages),
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

    if (updateDocumentStatus) {
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
