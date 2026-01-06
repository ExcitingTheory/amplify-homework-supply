/*
Use the following code to retrieve configured secrets from SSM:

const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const client = new SSMClient();
const { Parameters } = await client.send(new GetParametersCommand({
  Names: ["OPENAI_API_KEY"].map(secretName => process.env[secretName]),
  WithDecryption: true,
}));

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/* Amplify Params - DO NOT EDIT
  API_JAPANESE5_DOCUMENTTABLE_ARN
  API_JAPANESE5_DOCUMENTTABLE_NAME
  API_JAPANESE5_FILETABLE_ARN
  API_JAPANESE5_FILETABLE_NAME
  API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT
  API_JAPANESE5_GRAPHQLAPIIDOUTPUT
  ENV
  REGION
  STORAGE_FILES_BUCKETNAME
Amplify Params - DO NOT EDIT */

import OpenAI from 'openai';
import AWS from 'aws-sdk';
import crypto from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { default as fetch, Request } from 'node-fetch';
import { GetObjectCommand, S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { Readable } from 'stream';
import pdfParse from 'pdf-parse';
import { promisify } from 'util';
import { brotliCompress } from 'zlib';

const brotliCompressAsync = promisify(brotliCompress);

const REGION = process.env.REGION;
const GRAPHQL_ENDPOINT = process.env.API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT;
const BUCKET_NAME = process.env.STORAGE_FILES_BUCKETNAME;

const s3Client = new S3Client({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });

// Initialize OpenAI with API key from SSM
let openai;

async function initializeOpenAI() {
  if (openai) return openai;
  
  const ssm = new AWS.SSM();
  const paramName = process.env.OPENAI_API_KEY || 'OPENAI_API_KEY';
  const { Parameters } = await ssm
    .getParameters({
      Names: [paramName],
      WithDecryption: true,
    })
    .promise();
  
  if (!Parameters || Parameters.length === 0) {
    throw new Error(`Failed to retrieve OpenAI API key from SSM parameter: ${paramName}`);
  }
  
  const apiKey = Parameters[0].Value;
  openai = new OpenAI({ apiKey });
  return openai;
}

/**
 * Check how much time is left in Lambda execution
 * @returns {number} Milliseconds remaining
 */
function getRemainingTime(context) {
  if (!context || !context.getRemainingTimeInMillis) {
    return Infinity; // No context, assume unlimited time
  }
  return context.getRemainingTimeInMillis();
}

// GraphQL mutation helpers
async function executeGraphQLMutation(mutation, variables) {
  const endpoint = new URL(GRAPHQL_ENDPOINT);
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: REGION,
    service: 'appsync',
    sha256: crypto.Sha256,
  });

  const requestToBeSigned = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: endpoint.host,
    },
    hostname: endpoint.host,
    body: JSON.stringify({ query: mutation, variables }),
    path: endpoint.pathname,
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(GRAPHQL_ENDPOINT, signed);
  const response = await fetch(request);
  const body = await response.json();

  if (body.errors) {
    console.error('GraphQL Errors:', JSON.stringify(body.errors, null, 2));
    throw new Error(`GraphQL Error: ${body.errors[0].message}`);
  }

  return body.data;
}

// Download file from S3
async function downloadFileFromS3(s3Key) {
  try {
    console.log('Downloading file from S3 with key:', s3Key);
    console.log('Using bucket:', BUCKET_NAME);
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error downloading file from S3:', error);
    console.error('S3 Key that failed:', s3Key);
    console.error('Bucket:', BUCKET_NAME);
    throw error;
  }
}

// Generate embeddings via API endpoint (for consistency with frontend)
async function generateEmbeddingsViaAPI(texts) {
  // In Lambda, we need to call the embeddings API endpoint
  // Since we're in the backend, we'll use OpenAI directly for now
  // TODO: Consider calling the API endpoint if needed for consistency
  const ai = await initializeOpenAI();
  
  const response = await ai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions: 512,
  });
  
  return response.data.map(item => item.embedding);
}

// Process image file
async function processImageFile(fileBuffer, fileName) {
  const ai = await initializeOpenAI();
  
  // Convert buffer to base64
  const base64Image = fileBuffer.toString('base64');
  const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  // Use GPT-4 Vision to analyze image
  const visionResponse = await ai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image in detail, focusing on educational content, text, diagrams, and key concepts.' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });
  
  const description = visionResponse.choices[0].message.content;
  
  // Generate embedding from description via API
  const embeddings = await generateEmbeddingsViaAPI([description]);
  
  return {
    embedding: embeddings[0],
    metadata: {
      analysis: {
        description,
        analyzed: true,
      },
    },
  };
}

// Process audio file
async function processAudioFile(fileBuffer, fileName) {
  const ai = await initializeOpenAI();
  
  // Save buffer to temp file for transcription
  const tempFilePath = `/tmp/${fileName}`;
  const fs = await import('fs');
  fs.writeFileSync(tempFilePath, fileBuffer);
  
  // Transcribe audio
  const transcription = await ai.audio.transcriptions.create({
    file: fs.createReadStream(tempFilePath),
    model: 'whisper-1',
  });
  
  const transcribedText = transcription.text;
  
  // Generate embedding from transcription via API
  const embeddings = await generateEmbeddingsViaAPI([transcribedText]);
  
  // Clean up temp file
  fs.unlinkSync(tempFilePath);
  
  return {
    embedding: embeddings[0],
    metadata: {
      analysis: {
        transcription: transcribedText,
        analyzed: true,
      },
    },
  };
}

// Upload embeddings to S3
async function uploadEmbeddingsToS3(originalS3Key, embeddings) {
  // Generate S3 key for embeddings (same path as file but with .embeddings.json extension)
  const embeddingsKey = originalS3Key.replace(/\.[^.]+$/, '.embeddings.json');
  
  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: embeddingsKey,
    Body: JSON.stringify(embeddings, null, 2),
    ContentType: 'application/json',
  });
  
  await s3Client.send(putCommand);
  
  console.log(`Uploaded full embeddings to S3: ${embeddingsKey}`);
  
  return {
    key: embeddingsKey,
    count: embeddings.length
  };
}

// Process PDF document (page-level embeddings) with resume capability
async function processDocumentFile(fileBuffer, documentID, resumeState = null, context = null) {
  const TIMEOUT_BUFFER_MS = 30000; // Reserve 30 seconds for cleanup and re-invocation
  const BATCH_SIZE = 50; // Process embeddings in batches
  
  // Use pdf-parse to extract text and get actual page count
  const pdfData = await pdfParse(fileBuffer);
  const fullText = pdfData.text;
  const actualPageCount = pdfData.numpages || 1; // Get real page count from PDF
  
  // Split text into chunks by page
  const charsPerPage = Math.ceil(fullText.length / actualPageCount);
  
  const pageTexts = [];
  const accumulatedEmbeddings = resumeState?.pageEmbeddings || [];
  const startPage = resumeState?.lastProcessedPage || 0;
  
  // Split text into page-sized chunks based on actual page count
  for (let i = 0; i < actualPageCount; i++) {
    const start = i * charsPerPage;
    const end = Math.min(start + charsPerPage, fullText.length);
    const pageText = fullText.substring(start, end).trim();
    
    if (pageText.length > 0) {
      pageTexts.push({ page: i + 1, text: pageText });
    }
  }
  
  console.log(`Processing PDF embeddings: Starting from page ${startPage + 1} of ${pageTexts.length}`);
  
  // Generate embeddings in batch (up to 50 at a time)
  for (let i = startPage; i < pageTexts.length; i += BATCH_SIZE) {
    // Check if we're running out of time
    const remainingTime = getRemainingTime(context);
    if (remainingTime < TIMEOUT_BUFFER_MS) {
      console.log(`Approaching timeout with ${remainingTime}ms remaining. Saving progress...`);
      
      return {
        isComplete: false,
        pageEmbeddings: accumulatedEmbeddings,
        resumeState: {
          lastProcessedPage: i,
          pageEmbeddings: accumulatedEmbeddings,
          totalPages: pageTexts.length
        }
      };
    }
    
    const batch = pageTexts.slice(i, i + BATCH_SIZE).filter(p => p.text.length > 0);
    
    if (batch.length > 0) {
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: pages ${i + 1} to ${Math.min(i + BATCH_SIZE, pageTexts.length)}`);
      
      const batchTexts = batch.map(p => p.text);
      const batchEmbeddings = await generateEmbeddingsViaAPI(batchTexts);
      
      // Map back to page numbers (don't store text to save memory)
      for (let j = 0; j < batch.length; j++) {
        accumulatedEmbeddings.push({
          page: batch[j].page,
          embedding: batchEmbeddings[j]
          // text intentionally omitted to reduce memory usage
        });
      }
    }
  }
  
  console.log(`PDF embedding generation complete: ${accumulatedEmbeddings.length} pages processed`);
  
  return {
    isComplete: true,
    pageEmbeddings: accumulatedEmbeddings,
    pageTexts, // Return pageTexts for S3 upload with full text
    resumeState: null
  };
}

export const handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Remaining time at start:', getRemainingTime(context), 'ms');
  
  // Check if this is an async background invocation
  const isAsyncInvocation = event.isAsyncInvocation === true;
  
  try {
    const { fileID } = event.arguments || event;
    
    // Fetch File record
    const getFileMutation = /* GraphQL */ `
      query GetFile($id: ID!) {
        getFile(id: $id) {
          id
          name
          path
          mimeType
          identityId
          documentID
          document {
            id
            s3Key
            pageCount
          }
        }
      }
    `;
    
    const fileData = await executeGraphQLMutation(getFileMutation, { id: fileID });
    const file = fileData.getFile;
    
    if (!file) {
      return {
        success: false,
        fileID,
        message: 'File not found',
      };
    }
    
    console.log('Processing file:', {
      id: file.id,
      name: file.name,
      path: file.path,
      mimeType: file.mimeType,
      identityId: file.identityId,
      documentID: file.documentID
    });
    
    // For PDF documents, check if we're resuming from a previous timeout
    let resumeState = null;
    if (file.mimeType === 'application/pdf' && file.documentID) {
      const getDocumentMutation = /* GraphQL */ `
        query GetDocument($id: ID!) {
          getDocument(id: $id) {
            id
            resumeState
            _version
          }
        }
      `;
      
      const docData = await executeGraphQLMutation(getDocumentMutation, { id: file.documentID });
      
      if (docData.getDocument?.resumeState) {
        try {
          resumeState = JSON.parse(docData.getDocument.resumeState);
          console.log('Resuming from previous state:', resumeState);
        } catch (e) {
          console.error('Failed to parse resumeState:', e);
          resumeState = null;
        }
      }
    }
    
    // If this is NOT an async invocation, invoke ourselves asynchronously and return immediately
    if (!isAsyncInvocation) {
      console.log('Invoking Lambda asynchronously for background processing');
      
      const invokeCommand = new InvokeCommand({
        FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        InvocationType: 'Event', // Async invocation
        Payload: JSON.stringify({
          ...event,
          isAsyncInvocation: true,
          arguments: event.arguments || { fileID }
        })
      });
      
      await lambdaClient.send(invokeCommand);
      
      return { 
        success: true, 
        fileID, 
        message: 'Embedding generation started in background'
      };
    }
    
    // From here on, this is the async background processing
    console.log('Running background embedding generation for file:', fileID);
    
    let result;
    
    // Determine file type and process accordingly
    if (file.mimeType.startsWith('image/')) {
      // Process image
      const s3Key = `protected/${file.identityId}/${file.path}`;
      console.log('Constructed S3 key for image:', s3Key);
      const fileBuffer = await downloadFileFromS3(s3Key);
      result = await processImageFile(fileBuffer, file.name);
      
      // Update File with embedding
      const updateFileMutation = /* GraphQL */ `
        mutation UpdateFile($input: UpdateFileInput!) {
          updateFile(input: $input) {
            id
            embedding
            metadata
          }
        }
      `;
      
      await executeGraphQLMutation(updateFileMutation, {
        input: {
          id: fileID,
          embedding: result.embedding,
          metadata: JSON.stringify(result.metadata),
        },
      });
      
      return {
        success: true,
        fileID,
        embeddingCount: 1,
        message: 'Image embedding generated successfully',
      };
      
    } else if (file.mimeType.startsWith('audio/')) {
      // Process audio
      const s3Key = `protected/${file.identityId}/${file.path}`;
      console.log('Constructed S3 key for audio:', s3Key);
      const fileBuffer = await downloadFileFromS3(s3Key);
      result = await processAudioFile(fileBuffer, file.name);
      
      // Update File with embedding
      const updateFileMutation = /* GraphQL */ `
        mutation UpdateFile($input: UpdateFileInput!) {
          updateFile(input: $input) {
            id
            embedding
            metadata
          }
        }
      `;
      
      await executeGraphQLMutation(updateFileMutation, {
        input: {
          id: fileID,
          embedding: result.embedding,
          metadata: JSON.stringify(result.metadata),
        },
      });
      
      return {
        success: true,
        fileID,
        embeddingCount: 1,
        message: 'Audio embedding generated successfully',
      };
      
    } else if (file.mimeType === 'application/pdf' && file.documentID) {
      // Process PDF document
      const s3Key = `protected/${file.identityId}/${file.path}`;
      console.log('Constructed S3 key for PDF:', s3Key);
      
      const fileBuffer = await downloadFileFromS3(s3Key);
      const pdfResult = await processDocumentFile(fileBuffer, file.documentID, resumeState, context);
      
      // If processing is not complete, save state and re-invoke
      if (!pdfResult.isComplete) {
        console.log('PDF embedding generation incomplete. Saving progress and re-invoking...');
        
        // Update Document with resume state
        const updateDocumentMutation = /* GraphQL */ `
          mutation UpdateDocument($input: UpdateDocumentInput!) {
            updateDocument(input: $input) {
              id
              filename
              s3Key
              status
              createdAt
              updatedAt
              _version
              _lastChangedAt
              _deleted
              resumeState
            }
          }
        `;
        
        // Fetch latest version first
        const getDocMutation = /* GraphQL */ `
          query GetDocument($id: ID!) {
            getDocument(id: $id) {
              id
              _version
            }
          }
        `;
        
        const docData = await executeGraphQLMutation(getDocMutation, { id: file.documentID });
        
        await executeGraphQLMutation(updateDocumentMutation, {
          input: {
            id: file.documentID,
            _version: docData.getDocument._version,
            resumeState: JSON.stringify(pdfResult.resumeState)
          }
        });
        
        // Re-invoke this Lambda to continue processing
        const invokeCommand = new InvokeCommand({
          FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          InvocationType: 'Event', // Async invocation
          Payload: JSON.stringify({
            ...event,
            isAsyncInvocation: true,
            arguments: event.arguments || { fileID }
          })
        });
        
        await lambdaClient.send(invokeCommand);
        
        return { 
          success: true, 
          fileID,
          documentID: file.documentID,
          message: 'PDF embedding generation paused and resumed in new invocation',
          embeddingCount: pdfResult.pageEmbeddings.length,
          progress: `${pdfResult.resumeState.lastProcessedPage}/${pdfResult.resumeState.totalPages} pages`
        };
      }
      
      // Processing complete, analyze size and upload to S3
      console.log('PDF embedding generation completed successfully');
      
      // Reconstruct full embeddings with text for S3 backup (using returned pageTexts)
      const fullEmbeddings = pdfResult.pageEmbeddings.map(emb => {
        const pageData = pdfResult.pageTexts.find(p => p.page === emb.page);
        return {
          page: emb.page,
          embedding: emb.embedding,
          text: pageData?.text || ''
        };
      });
      
      const vectorsOnly = pdfResult.pageEmbeddings; // Already {page, embedding} without text
      
      const fullSize = Buffer.byteLength(JSON.stringify(fullEmbeddings), 'utf8');
      const vectorsOnlySize = Buffer.byteLength(JSON.stringify(vectorsOnly), 'utf8');
      const vectorsJSON = JSON.stringify(vectorsOnly);
      
      // Compress with brotli
      const brotliCompressed = await brotliCompressAsync(vectorsJSON);
      
      console.log(`Full embeddings (with text): ${(fullSize / 1024).toFixed(1)}KB`);
      console.log(`Vectors only (no text): ${(vectorsOnlySize / 1024).toFixed(1)}KB`);
      console.log(`Vectors brotli compressed: ${(brotliCompressed.length / 1024).toFixed(1)}KB`);
      console.log(`DynamoDB limit: 400KB (409600 bytes)`);
      
      // Determine what to store in DynamoDB
      let pageEmbeddingsData = null;
      let compressionMethod = 'none';
      let storedSize = 0;
      
      if (vectorsOnlySize < 409600) {
        // Store uncompressed
        pageEmbeddingsData = vectorsOnly;
        storedSize = vectorsOnlySize;
        console.log('Storing uncompressed vectors in DynamoDB');
      } else if (brotliCompressed.length < 409600) {
        // Store brotli compressed as base64
        pageEmbeddingsData = brotliCompressed.toString('base64');
        compressionMethod = 'brotli';
        storedSize = brotliCompressed.length;
        console.log('Storing brotli compressed vectors in DynamoDB');
      } else {
        // Too large even compressed, only store in S3
        console.log('Embeddings too large for DynamoDB even with brotli, storing only in S3');
      }
      
      // Upload full embeddings to S3 for backup/analysis
      const embeddingsInfo = await uploadEmbeddingsToS3(s3Key, fullEmbeddings);
      
      // Clear large objects to help garbage collection
      fullEmbeddings.length = 0;
      pdfResult.pageTexts.length = 0;
      
      const updateDocumentMutation = /* GraphQL */ `
        mutation UpdateDocument($input: UpdateDocumentInput!) {
          updateDocument(input: $input) {
            id
            filename
            s3Key
            status
            createdAt
            updatedAt
            _version
            _lastChangedAt
            _deleted
            resumeState
            metadata
            embeddingsS3Key
          }
        }
      `;
      
      // Fetch latest version first
      const getDocMutation = /* GraphQL */ `
        query GetDocument($id: ID!) {
          getDocument(id: $id) {
            id
            _version
            metadata
          }
        }
      `;
      
      const docData = await executeGraphQLMutation(getDocMutation, { id: file.documentID });
      
      // Parse existing metadata and add embeddings info
      const existingMetadata = docData.getDocument?.metadata 
        ? JSON.parse(docData.getDocument.metadata) 
        : {};
      
      const updatedMetadata = {
        ...existingMetadata,
        embeddingsKey: embeddingsInfo.key,
        embeddingsCount: pdfResult.pageEmbeddings.length,
        embeddingsGeneratedAt: new Date().toISOString(),
        embeddingsCompression: compressionMethod,
        embeddingsSizes: {
          fullSize,
          vectorsOnlySize,
          brotliSize: brotliCompressed.length,
          storedSize,
        }
      };
      
      console.log('[generateEmbeddings] Saving embeddings metadata and S3 path to Document...');
      await executeGraphQLMutation(updateDocumentMutation, {
        input: {
          id: file.documentID,
          _version: docData.getDocument._version,
          metadata: JSON.stringify(updatedMetadata),
          resumeState: null, // Clear resume state
          pageEmbeddings: pageEmbeddingsData ? JSON.stringify(pageEmbeddingsData) : null,
          embeddingsS3Key: embeddingsInfo.key // Save S3 path as dedicated field
        }
      });
      console.log('[generateEmbeddings] Document updated with embeddings S3 path:', embeddingsInfo.key);
      
      return {
        success: true,
        fileID,
        documentID: file.documentID,
        embeddingCount: pdfResult.pageEmbeddings.length,
        storedInDynamoDB: pageEmbeddingsData !== null,
        compressionMethod,
        s3Key: embeddingsInfo.key,
        sizes: {
          fullSize: `${(fullSize / 1024).toFixed(1)}KB`,
          vectorsOnlySize: `${(vectorsOnlySize / 1024).toFixed(1)}KB`,
          brotliSize: `${(brotliCompressed.length / 1024).toFixed(1)}KB`,
          storedSize: `${(storedSize / 1024).toFixed(1)}KB`,
        },
        message: `Generated ${pdfResult.pageEmbeddings.length} page embeddings successfully`,
      };
      
    } else {
      return {
        success: false,
        fileID,
        message: `Unsupported file type: ${file.mimeType}`,
      };
    }
    
  } catch (error) {
    console.error('Error generating embeddings:', error);
    
    // Try to clear resume state on error for PDF documents
    try {
      const fileID = event.arguments?.fileID || event.fileID;
      if (fileID) {
        const getFileMutation = /* GraphQL */ `
          query GetFile($id: ID!) {
            getFile(id: $id) {
              documentID
            }
          }
        `;
        const fileData = await executeGraphQLMutation(getFileMutation, { id: fileID });
        
        if (fileData.getFile?.documentID) {
          const updateDocumentMutation = /* GraphQL */ `
            mutation UpdateDocument($input: UpdateDocumentInput!) {
              updateDocument(input: $input) {
                id
                filename
                s3Key
                status
                createdAt
                updatedAt
                _version
                _lastChangedAt
                _deleted
              }
            }
          `;
          
          const getDocMutation = /* GraphQL */ `
            query GetDocument($id: ID!) {
              getDocument(id: $id) {
                id
                _version
              }
            }
          `;
          
          const docData = await executeGraphQLMutation(getDocMutation, { id: fileData.getFile.documentID });
          
          await executeGraphQLMutation(updateDocumentMutation, {
            input: {
              id: fileData.getFile.documentID,
              _version: docData.getDocument._version,
              resumeState: null
            }
          });
        }
      }
    } catch (updateError) {
      console.error('Failed to clear resume state:', updateError);
    }
    
    // If this is an async invocation, don't throw (just log)
    // If it's a synchronous call, throw the error
    if (event.isAsyncInvocation) {
      console.error('Async processing failed:', error);
      return { success: false, error: error.message };
    }
    
    return {
      success: false,
      fileID: event.arguments?.fileID || event.fileID,
      message: `Error: ${error.message}`,
    };
  }
};
