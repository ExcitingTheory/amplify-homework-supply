/**
 * Document Analysis Lambda Handler for Gen 2
 * 
 * Handles:
 * - analyzeDocument: Start async PDF analysis
 * - cancelDocumentAnalysis: Cancel running analysis
 * 
 * Reference: amplify/backend/function/analyzeDocument/
 */

import type { Handler } from 'aws-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { type Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';

const s3Client = new S3Client();
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

async function getDataClient() {
  if (!dataClient) {
    // Lambda resolvers get API_ENDPOINT and AWS_REGION automatically
    Amplify.configure({
      API: {
        GraphQL: {
          endpoint: process.env.API_ENDPOINT || '',
          region: process.env.AWS_REGION || 'us-east-1',
          defaultAuthMode: 'iam', // Lambda uses IAM auth
        },
      },
    });
    dataClient = generateClient<Schema>();
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
    console.error('[DocumentAnalysis Handler] No user identity found in event:', JSON.stringify(event, null, 2));
    throw new Error('Unauthorized: User authentication required');
  }
  
  return { userId, username: username || userId };
}

export const handler: Handler = async (event: any, context: any) => {
  const operationName = event.info?.fieldName;
  const args = event.arguments || {};

  console.log(`[DocumentAnalysis Handler] ${operationName}`, args);
  
  // Require authentication
  const { userId, username } = requireAuth(event);

  try {
    switch (operationName) {
      case 'analyzeDocument':
        return await handleAnalyzeDocument(args);
      case 'cancelDocumentAnalysis':
        return await handleCancelDocumentAnalysis(args);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  } catch (error) {
    console.error(`[DocumentAnalysis Handler Error] ${operationName}:`, error);
    throw error;
  }
};

async function handleAnalyzeDocument(args: any): Promise<any> {
  const { fileID } = args;
  
  try {
    console.log('[Analyze Document] Starting analysis for fileID:', fileID);
    
    const client = await getDataClient();
    
    // Get the File record first
    const { data: file, errors: fileErrors } = await client.models.File.get({ id: fileID });
    
    if (fileErrors || !file) {
      throw new Error(`File not found for ID: ${fileID}`);
    }
    
    // Get associated Document via documentID
    if (!file.documentID) {
      throw new Error(`File ${fileID} is not associated with a Document`);
    }
    
    const { data: document, errors } = await client.models.Document.get({ id: file.documentID });
    
    if (errors || !document) {
      throw new Error(`Document not found for documentID: ${file.documentID}`);
    }
    
    // Update document status to "analyzing"
    await client.models.Document.update({
      id: document.id,
      status: 'analyzing',
    });
    
    // In production, would:
    // 1. Fetch File metadata from AppSync
    // 2. Download PDF from S3
    // 3. Extract text using pdfjs-dist
    // 4. Send to OpenAI for analysis with structured prompt
    // 5. Parse response for vocabulary, concepts, questions
    // 6. Create ParsedContent records
    // 7. Update Document status to "completed"
    
    // Return status for client to poll
    return {
      documentId: document.id,
      fileID,
      status: 'analyzing',
      startedAt: new Date().toISOString(),
      message: `Document analysis started. Client should poll status or await webhook.`,
    };
  } catch (error) {
    console.error('[Analyze Document Error]:', error);
    
    // Update status to failed if we have document
    try {
      const client = await getDataClient();
      const { data: file } = await client.models.File.get({ id: fileID });
      if (file?.documentID) {
        await client.models.Document.update({
          id: file.documentID,
          status: 'failed',
        });
      }
    } catch (e) {
      console.error('Failed to update document status:', e);
    }
    
    throw error;
  }
}

async function handleCancelDocumentAnalysis(args: any): Promise<any> {
  const { fileID } = args;
  
  try {
    console.log('[Cancel Document Analysis] Cancelling for fileID:', fileID);
    
    const client = await getDataClient();
    
    // Get the File record first
    const { data: file, errors: fileErrors } = await client.models.File.get({ id: fileID });
    
    if (fileErrors || !file) {
      throw new Error(`File not found for ID: ${fileID}`);
    }
    
    // Get associated Document
    if (!file.documentID) {
      throw new Error(`File ${fileID} is not associated with a Document`);
    }
    
    const { data: document, errors } = await client.models.Document.get({ id: file.documentID });
    
    if (errors || !document) {
      throw new Error(`Document not found for documentID: ${file.documentID}`);
    }
    
    // Update document status to "cancelled"
    await client.models.Document.update({
      id: document.id,
      status: 'cancelled',
    });
    
    // In production, would:
    // 1. Cancel any in-progress async tasks
    // 2. Delete partial ParsedContent records
    // 3. Clean up S3 temporary files
    
    return {
      documentId: document.id,
      fileID,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      message: `Document analysis cancelled`,
    };
  } catch (error) {
    console.error('[Cancel Document Analysis Error]:', error);
    throw error;
  }
}