/**
 * Lambda Function: analyzeDocument
 * 
 * Extracts text from uploaded PDFs and sends to OpenAI for vocabulary analysis.
 */

/* Amplify Params - DO NOT EDIT
	API_JAPANESE5_AGENTJOBTABLE_ARN
	API_JAPANESE5_AGENTJOBTABLE_NAME
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

import crypto from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { default as fetch, Request } from 'node-fetch';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import OpenAI from 'openai';

const GRAPHQL_ENDPOINT = process.env.API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.REGION || 'us-east-1';
const STORAGE_BUCKET = process.env.STORAGE_FILES_BUCKETNAME;
const { Sha256 } = crypto;

const s3Client = new S3Client({ region: AWS_REGION });
const ssmClient = new SSMClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });

async function getOpenAIKey() {
  const paramName = process.env.OPENAI_API_KEY;
  const command = new GetParameterCommand({
    Name: paramName,
    WithDecryption: true,
  });
  const response = await ssmClient.send(command);
  return response.Parameter.Value;
}

async function executeGraphQL(query, variables, retries = 3, delay = 1000) {
  const endpoint = new URL(GRAPHQL_ENDPOINT);
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: AWS_REGION,
    service: 'appsync',
    sha256: Sha256
  });

  const requestToBeSigned = new HttpRequest({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: endpoint.host
    },
    hostname: endpoint.host,
    body: JSON.stringify({ query, variables }),
    path: endpoint.pathname
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(endpoint, signed);
  const response = await fetch(request);
  const result = await response.json();
  
  if (result.errors) {
    // Check for conflict errors and retry
    const isConflict = result.errors.some(err => 
      err.errorType === 'ConflictUnhandled' || 
      err.message?.includes('Conflict resolver rejects')
    );
    
    if (isConflict && retries > 0) {
      console.log(`Conflict detected, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return executeGraphQL(query, variables, retries - 1, delay * 2);
    }
    
    throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
  }
  
  return result.data;
}

async function getS3Object(s3Key, retries = 3, delay = 2000) {
  const command = new GetObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: s3Key,
  });
  
  try {
    const response = await s3Client.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    // Retry on "key does not exist" errors (S3 eventual consistency)
    if (error.name === 'NoSuchKey' && retries > 0) {
      console.log(`S3 file not found, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getS3Object(s3Key, retries - 1, delay);
    }
    throw error;
  }
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

/**
 * Extract text from PDF with resume capability using PDF.js
 * @param {string} s3Key - S3 key for the PDF
 * @param {Object} resumeState - Optional state to resume from
 * @param {Object} context - Lambda context for timeout detection
 * @returns {Object} { text, pageCount, isComplete, resumeState }
 */
async function extractPdfText(s3Key, resumeState = null, context = null) {
  const TIMEOUT_BUFFER_MS = 30000; // Reserve 30 seconds for cleanup and re-invocation
  const BATCH_SIZE = 10; // Process 10 pages at a time
  
  console.log('Loading PDF from S3...');
  const buffer = await getS3Object(s3Key);
  
  // Load PDF document from buffer
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    standardFontDataUrl: null,
    disableFontFace: true
  });
  
  const pdfDocument = await loadingTask.promise;
  const totalPages = pdfDocument.numPages;
  
  const startPage = resumeState?.lastProcessedPage || 0;
  let extractedText = resumeState?.accumulatedText || '';
  let currentPage = startPage;
  
  console.log(`Extracting PDF: Starting from page ${startPage + 1} of ${totalPages}`);
  
  // Process pages in batches
  while (currentPage < totalPages) {
    // Check if we're running out of time
    const remainingTime = getRemainingTime(context);
    if (remainingTime < TIMEOUT_BUFFER_MS) {
      console.log(`Approaching timeout with ${remainingTime}ms remaining. Saving progress...`);
      
      // Clean up PDF document
      await pdfDocument.cleanup();
      await pdfDocument.destroy();
      
      return {
        text: extractedText,
        pageCount: totalPages,
        isComplete: false,
        resumeState: {
          lastProcessedPage: currentPage,
          accumulatedText: extractedText,
          totalPages: totalPages
        }
      };
    }
    
    // Process next batch of pages
    const batchEnd = Math.min(currentPage + BATCH_SIZE, totalPages);
    console.log(`Processing pages ${currentPage + 1} to ${batchEnd} (${batchEnd - currentPage} pages in parallel)...`);
    
    // Extract text for this batch - Process pages in parallel for speed
    const pagePromises = [];
    for (let pageNum = currentPage + 1; pageNum <= batchEnd; pageNum++) {
      pagePromises.push(
        (async (num) => {
          try {
            const page = await pdfDocument.getPage(num);
            const textContent = await page.getTextContent();
            
            // Combine text items with proper spacing
            const pageText = textContent.items
              .map(item => item.str)
              .join(' ')
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            
            // Clean up page resources
            page.cleanup();
            
            console.log(`  Page ${num}: ${pageText.length} characters`);
            
            return { pageNum: num, text: pageText };
          } catch (error) {
            console.error(`Error extracting page ${num}:`, error);
            return { pageNum: num, text: '', error: error.message };
          }
        })(pageNum)
      );
    }
    
    // Wait for all pages in batch to complete
    const batchResults = await Promise.all(pagePromises);
    
    // Sort by page number and concatenate text
    batchResults
      .sort((a, b) => a.pageNum - b.pageNum)
      .forEach(result => {
        if (result.text) {
          extractedText += result.text + '\n\n';
        }
      });
    
    currentPage = batchEnd;
  }
  
  // Clean up PDF document
  await pdfDocument.cleanup();
  await pdfDocument.destroy();
  
  console.log(`PDF extraction complete: ${totalPages} pages processed, ${extractedText.length} total characters`);
  
  return {
    text: extractedText,
    pageCount: totalPages,
    isComplete: true,
    resumeState: null
  };
}

async function updateDocumentStatus(documentID, updates) {
  // Fetch latest version first
  const getQuery = /* GraphQL */ `
    query GetDocument($id: ID!) {
      getDocument(id: $id) {
        id
        _version
        resumeState
      }
    }
  `;
  
  const { getDocument } = await executeGraphQL(getQuery, { id: documentID });
  
  if (!getDocument) {
    throw new Error(`Document ${documentID} not found for update`);
  }
  
  const updateMutation = /* GraphQL */ `
    mutation UpdateDocument($input: UpdateDocumentInput!) {
      updateDocument(input: $input) { id _version resumeState }
    }
  `;
  
  return executeGraphQL(updateMutation, {
    input: { 
      id: documentID, 
      _version: getDocument._version,
      ...updates
    }
  });
}

export const handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Remaining time at start:', getRemainingTime(context), 'ms');
  
  // Check if this is an async background invocation
  const isAsyncInvocation = event.isAsyncInvocation === true;
  
  try {
    const { fileID } = event.arguments || event;
    
    // First, get the File record to retrieve Document ID and S3 path
    const getFileQuery = /* GraphQL */ `
      query GetFile($id: ID!) {
        getFile(id: $id) {
          id
          path
          documentID
          mimeType
          identityId
        }
      }
    `;
    
    const { getFile } = await executeGraphQL(getFileQuery, { id: fileID });
    
    if (!getFile) {
      return { success: false, fileID, message: 'File not found' };
    }
    
    if (!getFile.documentID) {
      return { success: false, fileID, message: 'File has no associated document' };
    }
    
    const documentID = getFile.documentID;
    // Construct full S3 key: protected/{identityId}/{path}
    const s3Key = `protected/${getFile.identityId}/${getFile.path}`;
    
    console.log('Constructed S3 key:', s3Key);
    
    // Handle cancel request
    if ((event.arguments && event.field === 'cancelDocumentAnalysis') || event.field === 'cancelDocumentAnalysis') {
      await updateDocumentStatus(documentID, { status: 'failed' });
      return { success: true, fileID, documentID, message: 'Analysis cancelled' };
    }
    
    const getDocumentQuery = /* GraphQL */ `
      query GetDocument($id: ID!) {
        getDocument(id: $id) {
          id
          filename
          s3Key
          owner
          status
          resumeState
          _version
        }
      }
    `;
    
    const { getDocument: document } = await executeGraphQL(getDocumentQuery, { id: documentID });
    
    if (!document) throw new Error(`Document not found: ${documentID}`);
    
    // Check if we're resuming from a previous timeout
    let resumeState = null;
    if (document.resumeState) {
      try {
        resumeState = JSON.parse(document.resumeState);
        console.log('Resuming from previous state:', resumeState);
      } catch (e) {
        console.error('Failed to parse resumeState:', e);
        resumeState = null;
      }
    }
    
    // Check if document is already being processed (but allow resume)
    if (!resumeState && (document.status === 'extracting' || document.status === 'analyzing')) {
      return {
        success: false,
        fileID,
        documentID,
        message: 'Document is currently being processed. Please wait and try again.'
      };
    }
    
    // Check if document has already been completed
    if (document.status === 'completed') {
      return {
        success: false,
        fileID,
        documentID,
        message: 'Document has already been analyzed. Check the ParsedContent for results.'
      };
    }
    
    // Update to extracting status
    await updateDocumentStatus(documentID, { status: 'extracting' });
    
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
        documentID, 
        message: 'Analysis started in background',
        pageCount: null
      };
    }
    
    // From here on, this is the async background processing
    console.log('Running background analysis for document:', documentID);
    
    let text = '';
    let pageCount = 0;
    let extractionComplete = false;
    let newResumeState = null;

    // Extract text from PDF, and get page count. For other file types, implement other extraction methods. doc, docx, txt, csv, etc.
    
    if (!s3Key) {
      throw new Error(`File ${fileID} is missing path field`);
    }
    // use either document extension or mime type to determine file type
    if (s3Key.toLowerCase().endsWith('.pdf')) {
      const result = await extractPdfText(s3Key, resumeState, context);
      text = result.text;
      pageCount = result.pageCount;
      extractionComplete = result.isComplete;
      newResumeState = result.resumeState;
      
      // If extraction is not complete, save state and re-invoke
      if (!extractionComplete) {
        console.log('PDF extraction incomplete. Saving progress and re-invoking...');
        
        await updateDocumentStatus(documentID, { 
          resumeState: JSON.stringify(newResumeState),
          status: 'extracting'
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
          documentID, 
          message: 'PDF extraction paused and resumed in new invocation',
          pageCount,
          progress: `${newResumeState.lastProcessedPage}/${newResumeState.totalPages} pages`
        };
      }
      
      // Extraction complete, clear resume state
      console.log('PDF extraction completed successfully');
      await updateDocumentStatus(documentID, { 
        resumeState: null
      });
      
    } else if (s3Key.toLowerCase().endsWith('.txt')) {
      // For .txt files, simple S3 getObject and read as text
      const buffer = await getS3Object(s3Key);
      text = buffer.toString('utf-8');
      pageCount = Math.ceil(text.length / 2000); // Rough estimate: 2000 chars per page
      
    } else if (s3Key.toLowerCase().endsWith('.docx')) {
      // For .docx files, use mammoth to extract text
      const buffer = await getS3Object(s3Key);
      
      // Extract raw text from DOCX
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      pageCount = Math.ceil(text.length / 2000); // Rough estimate: 2000 chars per page
      
      if (result.messages && result.messages.length > 0) {
        console.log('Mammoth warnings:', result.messages);
      }
    } else if (document.s3Key.toLowerCase().endsWith('.doc')) {
      // Legacy .doc format is not supported - recommend conversion
      throw new Error(
        `Legacy .doc format is not supported for "${document.filename}". ` +
        `Please convert to .docx, .txt, or .pdf format and upload again.`
      );
    } else if (document.s3Key.toLowerCase().endsWith('.csv')) {
      // For .csv files, simple S3 getObject and read as text
      const buffer = await getS3Object(document.s3Key);
      text = buffer.toString('utf-8');
      pageCount = Math.ceil(text.length / 2000); // Rough estimate: 2000 chars per page
    } else {
      throw new Error(`Unsupported file type for document ${documentID}`);
    }
    
    await updateDocumentStatus(documentID, { 
      extractedText: text, 
      pageCount, 
      status: 'extracted' 
    });
    
    const openaiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey: openaiKey });
    
    await updateDocumentStatus(documentID, { status: 'analyzing' });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract vocabulary, summaries, objectives, concepts, and generate questions from educational text. Return JSON: {
  vocabularyJSON: [{word, definition, context, page}],
  summariesJSON: [{title, content, page_range}],
  objectivesJSON: [{objective, bloom_level}],
  conceptsJSON: [{concept, description, related_vocabulary}],
  questionsJSON: [{prompt, answer, hint, difficulty, questionType}]
}

For questionsJSON, generate 5-10 custom answer questions that test comprehension of the material. Questions should be open-ended, requiring thoughtful responses. Include:
- prompt: The question text
- answer: A sample correct answer (200-300 words)
- hint: A helpful hint for students (optional)
- difficulty: "easy", "medium", or "hard"
- questionType: "short_answer", "essay", or "comprehension"`
        },
        { role: 'user', content: `Extract from:\n\n${text.substring(0, 100000)}` }
      ],
      response_format: { type: 'json_object' },
    });
    
    const parsedContent = JSON.parse(completion.choices[0].message.content);
    
    const createJobMutation = /* GraphQL */ `
      mutation CreateAgentJob($input: CreateAgentJobInput!) {
        createAgentJob(input: $input) { id }
      }
    `;
    
    await executeGraphQL(createJobMutation, {
      input: {
        type: 'document_analysis',
        status: 'completed',
        documentID,
        responseId: completion.id,
        modelUsed: 'gpt-4o',
        tokensUsed: completion.usage?.total_tokens,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }
    });
    
    const createContentMutation = /* GraphQL */ `
      mutation CreateParsedContent($input: CreateParsedContentInput!) {
        createParsedContent(input: $input) { id }
      }
    `;
    
    await executeGraphQL(createContentMutation, {
      input: {
        documentID,
        vocabularyJSON: JSON.stringify(parsedContent.vocabularyJSON || []),
        summariesJSON: JSON.stringify(parsedContent.summariesJSON || []),
        objectivesJSON: JSON.stringify(parsedContent.objectivesJSON || []),
        conceptsJSON: JSON.stringify(parsedContent.conceptsJSON || []),
        questionsJSON: JSON.stringify(parsedContent.questionsJSON || []),
        responseId: completion.id,
        modelUsed: 'gpt-4o',
        tokensUsed: completion.usage?.total_tokens,
      }
    });
    
    await updateDocumentStatus(documentID, { status: 'completed' });
    
    return { success: true, fileID, documentID, responseId: completion.id, pageCount };
    
  } catch (error) {
    console.error('Error:', error);
    
    // Try to update document status to failed
    try {
      const fileID = event.arguments?.fileID || event.fileID;
      const documentID = fileID ? 
        (await executeGraphQL(/* GraphQL */ `
          query GetFile($id: ID!) {
            getFile(id: $id) { documentID }
          }
        `, { id: fileID })).getFile?.documentID 
        : null;
      
      if (documentID) {
        await updateDocumentStatus(documentID, { status: 'failed' });
      }
    } catch (updateError) {
      console.error('Failed to update document status:', updateError);
    }
    
    // If this is an async invocation, don't throw (just log)
    // If it's a synchronous call, throw the error
    if (event.isAsyncInvocation) {
      console.error('Async processing failed:', error);
      return { success: false, error: error.message };
    }
    
    throw error;
  }
};