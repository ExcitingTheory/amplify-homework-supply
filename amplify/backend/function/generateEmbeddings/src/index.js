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
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import pdfParse from 'pdf-parse';

const REGION = process.env.REGION;
const GRAPHQL_ENDPOINT = process.env.API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT;
const BUCKET_NAME = process.env.STORAGE_FILES_BUCKETNAME;

const s3Client = new S3Client({ region: REGION });

// Initialize OpenAI with API key from SSM
let openai;

async function initializeOpenAI() {
  if (openai) return openai;
  
  const ssm = new AWS.SSM();
  const { Parameters } = await ssm
    .getParameters({
      Names: ['OPENAI_API_KEY'],
      WithDecryption: true,
    })
    .promise();
  
  const apiKey = Parameters[0].Value;
  openai = new OpenAI({ apiKey });
  return openai;
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

// Process PDF document (page-level embeddings)
async function processDocumentFile(fileBuffer, documentID, pageCount) {
  // Use pdf-parse to extract text
  const pdfData = await pdfParse(fileBuffer);
  const fullText = pdfData.text;
  
  // Split text into chunks by estimated page size
  // Assume ~2000 chars per page on average
  const charsPerPage = 2000;
  const estimatedPages = Math.max(1, Math.ceil(fullText.length / charsPerPage));
  const numPages = Math.min(estimatedPages, pageCount || estimatedPages);
  
  const pageTexts = [];
  const pageEmbeddings = [];
  
  // Split text into page-sized chunks
  for (let i = 0; i < numPages; i++) {
    const start = i * charsPerPage;
    const end = Math.min(start + charsPerPage, fullText.length);
    const pageText = fullText.substring(start, end).trim();
    
    if (pageText.length > 0) {
      pageTexts.push(pageText);
    }
  }
  
  // Generate embeddings in batch (up to 100 at a time)
  const batchSize = 50;
  for (let i = 0; i < pageTexts.length; i += batchSize) {
    const batch = pageTexts.slice(i, i + batchSize).filter(t => t.length > 0);
    
    if (batch.length > 0) {
      const batchEmbeddings = await generateEmbeddingsViaAPI(batch);
      
      // Map back to page numbers
      let embeddingIdx = 0;
      for (let j = i; j < Math.min(i + batchSize, pageTexts.length); j++) {
        if (pageTexts[j].length > 0) {
          pageEmbeddings.push({
            page: j + 1,
            embedding: batchEmbeddings[embeddingIdx],
            text: pageTexts[j],
          });
          embeddingIdx++;
        }
      }
    }
  }
  
  // Update Document with page embeddings
  const updateDocumentMutation = /* GraphQL */ `
    mutation UpdateDocument($input: UpdateDocumentInput!) {
      updateDocument(input: $input) {
        id
        pageEmbeddings {
          page
          embedding
          text
        }
      }
    }
  `;
  
  await executeGraphQLMutation(updateDocumentMutation, {
    input: {
      id: documentID,
      pageEmbeddings,
    },
  });
  
  return pageEmbeddings.length;
}

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const { fileID } = event.arguments;
    
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
      // Use identityId + path like we do for images/audio, not the document.s3Key directly
      const s3Key = `protected/${file.identityId}/${file.path}`;
      console.log('Constructed S3 key for PDF:', s3Key);
      const pageCount = file.document?.pageCount || 1; // Default to 1 if not set
      const fileBuffer = await downloadFileFromS3(s3Key);
      const embeddingCount = await processDocumentFile(fileBuffer, file.documentID, pageCount);
      
      return {
        success: true,
        fileID,
        documentID: file.documentID,
        embeddingCount,
        message: `Generated ${embeddingCount} page embeddings successfully`,
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
    return {
      success: false,
      fileID: event.arguments.fileID,
      message: `Error: ${error.message}`,
    };
  }
};
