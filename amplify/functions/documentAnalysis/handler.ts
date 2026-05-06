/**
 * Document Analysis Lambda Handler for Gen 2
 *
 * Handles:
 * - analyzeDocument: Start async PDF analysis
 * - cancelDocumentAnalysis: Cancel running analysis
 *
 * Reference: amplify/backend/function/analyzeDocument/
 */

import type { Handler } from "aws-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import {
  initializePhoenixTracing,
  addTraceAttributes,
} from "../shared/phoenix-tracer";
import { fromEnv } from "@aws-sdk/credential-providers";

// Initialize Phoenix tracing
initializePhoenixTracing();

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

const s3Client = new S3Client();
let openaiInstance: any = null;
let dataClient: ReturnType<typeof generateClient<Schema>> | null = null;

// Raw GraphQL operations - .models API doesn't work in Lambda resolvers
const GET_FILE = /* GraphQL */ `
  query GetFile($id: ID!) {
    getFile(id: $id) {
      id
      _version
      _lastChangedAt
      _deleted
      documentID
      name
      mimeType
      path
    }
  }
`;

const GET_DOCUMENT = /* GraphQL */ `
  query GetDocument($id: ID!) {
    getDocument(id: $id) {
      id
      _version
      _lastChangedAt
      _deleted
      filename
      status
      s3Key
    }
  }
`;

const CREATE_DOCUMENT = /* GraphQL */ `
  mutation CreateDocument($input: CreateDocumentInput!) {
    createDocument(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      filename
      status
      s3Key
      mimeType
    }
  }
`;

const UPDATE_DOCUMENT = /* GraphQL */ `
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      status
      extractedText
      sourceFormat
    }
  }
`;

const UPDATE_FILE = /* GraphQL */ `
  mutation UpdateFile($input: UpdateFileInput!) {
    updateFile(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      documentID
    }
  }
`;

const CREATE_PARSED_CONTENT = /* GraphQL */ `
  mutation CreateParsedContent($input: CreateParsedContentInput!) {
    createParsedContent(input: $input) {
      id
      _version
      _lastChangedAt
      _deleted
      documentID
      fileID
      vocabularyJSON
      summariesJSON
      objectivesJSON
      conceptsJSON
      questionsJSON
      modelUsed
      createdAt
    }
  }
`;

async function getS3Object(s3Key: string): Promise<Buffer> {
  const bucketName = process.env.STORAGE_BUCKET || "";
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as any;

  // Convert stream to buffer
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
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

function getDataClient() {
  if (!dataClient) {
    dataClient = generateClient<Schema>({
      authMode: "iam",
    });
  }
  return dataClient;
}

/**
 * Authorization check utility
 * Verifies user is authenticated
 */
function requireAuth(event: any) {
  const userId = event.identity?.sub;
  const username = event.identity?.username;

  if (!userId) {
    console.error(
      "[DocumentAnalysis Handler] No user identity found in event:",
      JSON.stringify(event, null, 2),
    );
    throw new Error("Unauthorized: User authentication required");
  }

  return { userId, username: username || userId };
}

export const handler: Handler = async (event: any, context: any) => {
  const operationName = event.info?.fieldName || event.fieldName;
  const args = event.arguments || {};

  console.log(`[DocumentAnalysis Handler] ${operationName}`, args);

  // Debug: Log full event structure if operation name is missing
  if (!operationName) {
    console.error(
      "[DocumentAnalysis Handler] Missing operation name. Full event:",
      JSON.stringify(event, null, 2),
    );
    throw new Error(
      "Operation name is required but was not provided in the event",
    );
  }

  // Require authentication
  const { userId, username } = requireAuth(event);

  // Add trace attributes
  addTraceAttributes({
    "operation.name": operationName,
    "lambda.requestId": context.requestId,
    "user.id": userId,
    "document.fileId": args.fileID || "unknown",
  });

  try {
    switch (operationName) {
      case "analyzeDocument":
        return await handleAnalyzeDocument(args);
      case "cancelDocumentAnalysis":
        return await handleCancelDocumentAnalysis(args);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  } catch (error) {
    console.error(`[DocumentAnalysis Handler Error] ${operationName}:`, error);

    // Return proper error result instead of throwing
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (operationName === "analyzeDocument") {
      return {
        success: false,
        fileID: args.fileID || "",
        message: errorMessage,
      };
    } else if (operationName === "cancelDocumentAnalysis") {
      return {
        success: false,
        fileID: args.fileID || "",
        message: errorMessage,
      };
    }

    // For unknown operations, we have to throw
    throw error;
  }
};

async function handleAnalyzeDocument(args: any): Promise<any> {
  const { fileID } = args;

  try {
    console.log("[Analyze Document] Starting analysis for fileID:", fileID);

    const client = getDataClient();

    // Get the File record first
    const { data: fileData, errors: fileErrors } = (await client.graphql({
      query: GET_FILE,
      variables: { id: fileID },
    })) as any;

    if (fileErrors || !fileData?.getFile) {
      console.error("[Analyze Document] File not found:", fileErrors);
      throw new Error(`File not found for ID: ${fileID}`);
    }

    const file = fileData.getFile;

    let documentID = file.documentID;

    // If file doesn't have a Document record (old file uploaded before fix), create one
    if (!documentID) {
      console.log(
        "[Analyze Document] File has no Document record, creating one...",
      );

      const { data: createDocData, errors: createDocErrors } =
        (await client.graphql({
          query: CREATE_DOCUMENT,
          variables: {
            input: {
              filename: file.name || "Untitled Document",
              s3Key: file.path,
              status: "uploaded",
              mimeType: file.mimeType,
              uploadedAt: new Date().toISOString(),
            },
          },
        })) as any;

      if (createDocErrors || !createDocData?.createDocument) {
        console.error(
          "[Analyze Document] Failed to create Document:",
          createDocErrors,
        );
        throw new Error("Failed to create Document record");
      }

      documentID = createDocData.createDocument.id;
      console.log("[Analyze Document] Created Document:", documentID);

      // Update File to link to new Document
      const { errors: updateFileErrors } = (await client.graphql({
        query: UPDATE_FILE,
        variables: {
          input: {
            id: fileID,
            documentID: documentID,
            _version: file._version,
          },
        },
      })) as any;

      if (updateFileErrors) {
        console.error(
          "[Analyze Document] Failed to link File to Document:",
          updateFileErrors,
        );
        // Continue anyway - Document is created
      }
    }

    // Get the Document record
    const { data: docData, errors } = (await client.graphql({
      query: GET_DOCUMENT,
      variables: { id: documentID },
    })) as any;

    if (errors || !docData?.getDocument) {
      console.error("[Analyze Document] Document not found:", errors);
      throw new Error(`Document not found for documentID: ${documentID}`);
    }

    const document = docData.getDocument;

    console.log(
      "[Analyze Document] Document object keys:",
      Object.keys(document),
    );
    console.log(
      "[Analyze Document] Full document:",
      JSON.stringify(document, null, 2),
    );

    // Update document status to "extracting"
    const extractingUpdate = (await client.graphql({
      query: UPDATE_DOCUMENT,
      variables: {
        input: {
          id: document.id,
          status: "extracting",
          _version: document._version,
        },
      },
    })) as any;

    // Extract text from document based on file type
    // Use file.path as source of truth - it contains the actual S3 path with protection level prefix
    // (e.g., "public/files/...", "protected/{identityId}/files/...", etc.)
    const s3Key = file.path;
    if (!s3Key) {
      throw new Error(`File ${fileID} is missing path field`);
    }

    console.log("[Analyze Document] Using S3 key from File.path:", s3Key);
    console.log(
      "[Analyze Document] Document.s3Key for reference:",
      document.s3Key,
    );

    console.log("[Analyze Document] Extracting text from:", s3Key);

    const { extractByFormat } = await import("./formatRegistry.js");
    const extraction = await extractByFormat(s3Key);

    const text = extraction.text;
    const pages = extraction.pages;
    const pageCount = extraction.pageCount;
    const sourceFormat = extraction.sourceFormat;
    const directContent = extraction.directContent;

    console.log(
      `[Analyze Document] Extracted ${text.length} characters from ${pageCount} pages (format: ${sourceFormat})`,
    );

    // Update document with extracted text and source format
    const analyzingUpdate = (await client.graphql({
      query: UPDATE_DOCUMENT,
      variables: {
        input: {
          id: document.id,
          extractedText: text,
          pageCount,
          sourceFormat,
          status: "analyzing",
          _version:
            extractingUpdate?.data?.updateDocument?._version ||
            document._version,
        },
      },
    })) as any;

    // Analyze with OpenAI
    console.log("[Analyze Document] Analyzing with GPT-4o...");
    const openai = await getOpenAI();
    const { analyzePages } = await import("./analysis.js");

    let parsedContent;
    if (s3Key.toLowerCase().endsWith(".pdf") && pages.length > 0) {
      // Page-by-page analysis for PDFs
      parsedContent = await analyzePages(openai, pages, fileID, documentID);
    } else {
      // Build format-aware system prompt
      const systemPrompt = buildAnalysisPrompt(sourceFormat, directContent);

      // Single-pass analysis for other file types
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Extract from:\n\n${text.substring(0, 100000)}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      parsedContent = JSON.parse(
        completion.choices[0]?.message?.content || "{}",
      );
    }

    // Merge direct content from format extractors (QTI, GIFT, IMS CC, SCORM, EPUB)
    // Direct content takes priority over GPT-generated content for the same field
    if (directContent) {
      if (
        directContent.questionsJSON &&
        directContent.questionsJSON.length > 0
      ) {
        parsedContent.questionsJSON = directContent.questionsJSON;
      }
      if (
        directContent.vocabularyJSON &&
        directContent.vocabularyJSON.length > 0
      ) {
        parsedContent.vocabularyJSON = directContent.vocabularyJSON;
      }
      if (
        directContent.objectivesJSON &&
        directContent.objectivesJSON.length > 0
      ) {
        parsedContent.objectivesJSON = directContent.objectivesJSON;
      }
      if (
        directContent.summariesJSON &&
        directContent.summariesJSON.length > 0
      ) {
        parsedContent.summariesJSON = directContent.summariesJSON;
      }
    }

    console.log("[Analyze Document] Creating ParsedContent record...");
    await client.graphql({
      query: CREATE_PARSED_CONTENT,
      variables: {
        input: {
          documentID,
          fileID,
          vocabularyJSON: JSON.stringify(parsedContent.vocabularyJSON || []),
          summariesJSON: JSON.stringify(parsedContent.summariesJSON || []),
          objectivesJSON: JSON.stringify(parsedContent.objectivesJSON || []),
          conceptsJSON: JSON.stringify(parsedContent.conceptsJSON || []),
          questionsJSON: JSON.stringify(parsedContent.questionsJSON || []),
          modelUsed: "gpt-4o",
          createdAt: new Date().toISOString(),
        },
      },
    } as any);

    // Update document status to "completed"
    await client.graphql({
      query: UPDATE_DOCUMENT,
      variables: {
        input: {
          id: document.id,
          status: "completed",
          _version:
            analyzingUpdate?.data?.updateDocument?._version ||
            document._version,
        },
      },
    });

    console.log("[Analyze Document] Analysis complete!");

    return {
      success: true,
      documentID: document.id,
      fileID,
      pageCount,
      message: "Document analysis completed successfully",
    };
  } catch (error) {
    console.error("[Analyze Document Error]:", error);

    // Update status to failed if we have document
    try {
      const client = getDataClient();
      const { data: fileData } = (await client.graphql({
        query: GET_FILE,
        variables: { id: fileID },
      })) as any;
      const file = fileData?.getFile;
      if (file?.documentID) {
        const { data: docData } = (await client.graphql({
          query: GET_DOCUMENT,
          variables: { id: file.documentID },
        })) as any;
        await client.graphql({
          query: UPDATE_DOCUMENT,
          variables: {
            input: {
              id: file.documentID,
              status: "failed",
              _version: docData?.getDocument?._version,
            },
          },
        });
      }
    } catch (e) {
      console.error("Failed to update document status:", e);
    }

    // Return error result instead of throwing
    const errorMessage =
      error instanceof Error ? error.message : "Document analysis failed";
    return {
      success: false,
      fileID,
      message: errorMessage,
    };
  }
}

/**
 * Build a format-aware system prompt for GPT-4o analysis.
 * Adjusts instructions based on the source format and whether direct content was extracted.
 */
function buildAnalysisPrompt(
  sourceFormat: string,
  directContent?: {
    questionsJSON?: unknown[];
    vocabularyJSON?: unknown[];
    objectivesJSON?: unknown[];
    summariesJSON?: unknown[];
  },
): string {
  const baseInstruction = `Extract vocabulary, summaries, objectives, concepts, and generate questions from educational text. Return JSON: {
  vocabularyJSON: [{word, definition, context, page}],
  summariesJSON: [{title, content, page_range}],
  objectivesJSON: [{objective, bloom_level}],
  conceptsJSON: [{concept, description, related_vocabulary}],
  questionsJSON: [{prompt, answer, hint, difficulty, questionType}]
}`;

  const formatHints: Record<string, string> = {
    gift: "This is a Moodle GIFT format file containing quiz questions. Questions have already been structurally extracted. Focus on extracting vocabulary, concepts, and learning objectives from the question text. For bloom_level, infer from question complexity (recall=remember, application=apply, analysis=analyze).",
    "qti-2.1":
      "This is a QTI 2.1 assessment file. Questions have already been structurally extracted. Focus on identifying vocabulary terms, key concepts, and learning objectives from the question prompts and answer options.",
    "qti-3.0":
      "This is a QTI 3.0 assessment file. Questions have already been structurally extracted. Focus on identifying vocabulary terms, key concepts, and learning objectives from the question prompts and answer options.",
    "scorm-1.2":
      "This is content extracted from a SCORM 1.2 learning package. It may contain lesson content mixed with navigation text. Focus on the educational substance. Course objectives may already be extracted from the manifest.",
    "scorm-2004":
      "This is content extracted from a SCORM 2004 learning package. It may contain lesson content mixed with navigation text. Focus on the educational substance. Course objectives may already be extracted from the manifest.",
    "imscc-1.1":
      "This is content from an IMS Common Cartridge package (v1.1). Assessment questions may already be extracted. Focus on vocabulary, concepts, and summaries from the web content.",
    "imscc-1.2":
      "This is content from an IMS Common Cartridge package (v1.2). Assessment questions may already be extracted. Focus on vocabulary, concepts, and summaries from the web content.",
    "imscc-1.3":
      "This is content from an IMS Common Cartridge package (v1.3). Assessment questions may already be extracted. Focus on vocabulary, concepts, and summaries from the web content.",
    "epub-2":
      "This is text from an EPUB ebook with chapters in reading order. Treat each section as a coherent lesson. Extract vocabulary with chapter context and generate questions that test comprehension of each chapter.",
    "epub-3":
      "This is text from an EPUB 3 ebook with chapters in reading order. Treat each section as a coherent lesson. Extract vocabulary with chapter context and generate questions that test comprehension of each chapter.",
    csv: "This is tabular data from a CSV file. If the data appears to be a vocabulary list, prioritize extracting vocabulary definitions. If it contains questions and answers, prioritize those. Look for patterns in column structure.",
    xls: "This is tabular data from a spreadsheet. Each sheet may contain different types of educational content (vocabulary lists, question banks, data tables). Analyze each sheet contextually.",
    xlsx: "This is tabular data from a spreadsheet. Each sheet may contain different types of educational content (vocabulary lists, question banks, data tables). Analyze each sheet contextually.",
  };

  const parts = [baseInstruction];

  const hint = formatHints[sourceFormat];
  if (hint) {
    parts.push(`\nFormat context: ${hint}`);
  }

  // Tell GPT which fields are already covered by direct extraction
  if (directContent) {
    const coveredFields: string[] = [];
    if (directContent.questionsJSON?.length)
      coveredFields.push("questionsJSON");
    if (directContent.vocabularyJSON?.length)
      coveredFields.push("vocabularyJSON");
    if (directContent.objectivesJSON?.length)
      coveredFields.push("objectivesJSON");
    if (directContent.summariesJSON?.length)
      coveredFields.push("summariesJSON");

    if (coveredFields.length > 0) {
      parts.push(
        `\nNote: The following fields have already been extracted structurally and will be used directly: ${coveredFields.join(", ")}. You can still generate these fields, but focus your effort on the remaining fields. For already-extracted question fields, you may add bloom_level and hint enrichments.`,
      );
    }
  }

  return parts.join("");
}

async function handleCancelDocumentAnalysis(args: any): Promise<any> {
  const { fileID } = args;

  try {
    console.log("[Cancel Document Analysis] Cancelling for fileID:", fileID);

    const client = getDataClient();

    // Get the File record first
    const { data: fileData, errors: fileErrors } = (await client.graphql({
      query: GET_FILE,
      variables: { id: fileID },
    })) as any;

    if (fileErrors || !fileData?.getFile) {
      throw new Error(`File not found for ID: ${fileID}`);
    }

    const file = fileData.getFile;

    // Get associated Document
    if (!file.documentID) {
      throw new Error(`File ${fileID} is not associated with a Document`);
    }

    const { data: docData, errors } = (await client.graphql({
      query: GET_DOCUMENT,
      variables: { id: file.documentID },
    })) as any;

    if (errors || !docData?.getDocument) {
      throw new Error(`Document not found for documentID: ${file.documentID}`);
    }

    const document = docData.getDocument;

    // Update document status to "cancelled"
    await client.graphql({
      query: UPDATE_DOCUMENT,
      variables: {
        input: {
          id: document.id,
          status: "cancelled",
          _version: document._version,
        },
      },
    });

    // In production, would:
    // 1. Cancel any in-progress async tasks
    // 2. Delete partial ParsedContent records
    // 3. Clean up S3 temporary files

    return {
      success: true,
      documentID: document.id,
      fileID,
      message: `Document analysis cancelled`,
    };
  } catch (error) {
    console.error("[Cancel Document Analysis Error]:", error);

    // Return error result instead of throwing
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to cancel document analysis";
    return {
      success: false,
      fileID,
      message: errorMessage,
    };
  }
}
