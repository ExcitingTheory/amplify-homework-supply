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
import { gql } from 'graphql-request';
import { post } from 'aws-amplify/api';

const s3Client = new S3Client();
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

async function executeGraphQLMutation(mutation: string, variables: Record<string, any>): Promise<any> {
    // Gen 2: Use REST API to call GraphQL
    const response = await post({
        apiName: 'Japanese5',
        path: '/graphql',
        options: {
            body: JSON.stringify({
                query: mutation,
                variables,
            }),
        },
    });
    return response;
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

const updateDocumentStatusMutation = gql`
  mutation UpdateDocumentStatus($fileID: ID!, $status: String!) {
    updateDocument(input: { fileID: $fileID, status: $status }) {
      id
      status
    }
  }
`;

export const handler: Handler = async (event: any, context: any) => {
  const operationName = context?.['x-operation-name'] || event.info?.fieldName;
  const args = event.arguments || {};

  console.log(`[DocumentAnalysis Handler] ${operationName}`, args);

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
    
    // Update document status to "analyzing"
    await executeGraphQLMutation(updateDocumentStatusMutation, {
      fileID,
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
      documentId: `doc-${fileID}`,
      status: 'analyzing',
      startedAt: new Date().toISOString(),
      fileID,
      message: `Document analysis started for file ${fileID}. Client should poll status or await webhook.`,
    };
  } catch (error) {
    console.error('[Analyze Document Error]:', error);
    
    // Update status to failed
    try {
      await executeGraphQLMutation(updateDocumentStatusMutation, {
        fileID,
        status: 'failed',
      });
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
    
    // Update document status to "cancelled"
    await executeGraphQLMutation(updateDocumentStatusMutation, {
      fileID,
      status: 'cancelled',
    });
    
    // In production, would:
    // 1. Cancel any in-progress async tasks
    // 2. Delete partial ParsedContent records
    // 3. Clean up S3 temporary files
    
    return {
      fileID,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      message: `Document analysis cancelled for file ${fileID}`,
    };
  } catch (error) {
    console.error('[Cancel Document Analysis Error]:', error);
    throw error;
  }
}