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

// Configure PDF.js for Lambda environment (no canvas/DOM)
// In Node.js with disableWorker: true, we don't need to set workerSrc
// Workers are completely disabled via getDocument options
pdfjsLib.GlobalWorkerOptions.verbosity = pdfjsLib.VerbosityLevel.ERRORS; // Suppress warnings

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

  try {
    const signed = await signer.sign(requestToBeSigned);
    const request = new Request(endpoint, signed);
    const response = await fetch(request);
    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', JSON.stringify(result.errors, null, 2));
      
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
  } catch (error) {
    console.error('executeGraphQL failed:', error);
    console.error('Query:', query.substring(0, 200));
    console.error('Variables:', JSON.stringify(variables));
    throw error;
  }
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
 * @returns {Object} { pages, pageCount, isComplete, resumeState }
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
    disableFontFace: true,
    disableWorker: true, // Disable worker threads in Lambda environment
    isEvalSupported: false, // Disable eval-based features
    useWorkerFetch: false // Disable worker fetch API
  });
  
  const pdfDocument = await loadingTask.promise;
  const totalPages = pdfDocument.numPages;
  
  const startPage = resumeState?.lastProcessedPage || 0;
  let extractedPages = resumeState?.accumulatedPages || [];
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
        pages: extractedPages,
        pageCount: totalPages,
        isComplete: false,
        resumeState: {
          lastProcessedPage: currentPage,
          accumulatedPages: extractedPages,
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
    
    // Sort by page number and store as page objects
    batchResults
      .sort((a, b) => a.pageNum - b.pageNum)
      .forEach(result => {
        if (result.text) {
          extractedPages.push({
            pageNumber: result.pageNum,
            text: result.text
          });
        }
      });
    
    currentPage = batchEnd;
  }
  
  // Clean up PDF document
  await pdfDocument.cleanup();
  await pdfDocument.destroy();
  
  const totalChars = extractedPages.reduce((sum, p) => sum + p.text.length, 0);
  console.log(`PDF extraction complete: ${totalPages} pages processed, ${totalChars} total characters`);
  
  return {
    pages: extractedPages,
    pageCount: totalPages,
    isComplete: true,
    resumeState: null
  };
}

/**
 * Analyze a batch of pages with GPT-4o
 * @param {Object} openai - OpenAI client
 * @param {Array} pages - Array of page objects with pageNumber and text
 * @param {string} fileID - File ID for metadata
 * @param {string} documentID - Document ID for metadata
 * @returns {Object} Aggregated parsed content
 */
async function analyzePages(openai, pages, fileID, documentID) {
  const PAGES_PER_BATCH = 10; // Analyze 10 pages at a time to balance throughput and token limits
  const MAX_PARALLEL_BATCHES = 5; // Process up to 5 batches in parallel
  
  const allVocabulary = [];
  const allSummaries = [];
  const allObjectives = [];
  const allConcepts = [];
  const allQuestions = [];
  
  // Create all batch analysis tasks
  const batchTasks = [];
  for (let i = 0; i < pages.length; i += PAGES_PER_BATCH) {
    const batch = pages.slice(i, i + PAGES_PER_BATCH);
    const pageNumbers = batch.map(p => p.pageNumber).join(', ');
    const batchText = batch.map(p => `[Page ${p.pageNumber}]\n${p.text}`).join('\n\n');
    
    // Create a promise for each batch analysis
    batchTasks.push(
      (async () => {
        console.log(`[analyzePages] Analyzing pages ${pageNumbers} (${batchText.length} characters)...`);
        
        try {
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

For questionsJSON, generate 2-3 custom answer questions per batch that test comprehension. Questions should be open-ended, requiring thoughtful responses. Include:
- prompt: The question text
- answer: A sample correct answer (200-300 words)
- hint: A helpful hint for students (optional)
- difficulty: "easy", "medium", or "hard"
- questionType: "short_answer", "essay", or "comprehension"

Include the page number in all extracted items.`
              },
              { role: 'user', content: `Extract from:\n\n${batchText}` }
            ],
            response_format: { type: 'json_object' },
            metadata: {
              fileId: fileID,
              documentId: documentID,
              pages: pageNumbers
            }
          });
          
          const batchContent = JSON.parse(completion.choices[0].message.content);
          
          console.log(`[analyzePages] Batch ${pageNumbers} complete:`, {
            vocabulary: batchContent.vocabularyJSON?.length || 0,
            summaries: batchContent.summariesJSON?.length || 0,
            objectives: batchContent.objectivesJSON?.length || 0,
            concepts: batchContent.conceptsJSON?.length || 0,
            questions: batchContent.questionsJSON?.length || 0,
            tokens: completion.usage?.total_tokens
          });
          
          return { success: true, pageNumbers, batchContent };
        } catch (error) {
          console.error(`[analyzePages] Error analyzing pages ${pageNumbers}:`, error);
          return { success: false, pageNumbers, error: error.message };
        }
      })()
    );
  }
  
  // Process batches in parallel groups
  console.log(`[analyzePages] Processing ${batchTasks.length} batches in parallel (max ${MAX_PARALLEL_BATCHES} concurrent)...`);
  
  for (let i = 0; i < batchTasks.length; i += MAX_PARALLEL_BATCHES) {
    const parallelGroup = batchTasks.slice(i, i + MAX_PARALLEL_BATCHES);
    const results = await Promise.allSettled(parallelGroup);
    
    // Aggregate successful results
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        const { batchContent } = result.value;
        if (batchContent.vocabularyJSON) allVocabulary.push(...batchContent.vocabularyJSON);
        if (batchContent.summariesJSON) allSummaries.push(...batchContent.summariesJSON);
        if (batchContent.objectivesJSON) allObjectives.push(...batchContent.objectivesJSON);
        if (batchContent.conceptsJSON) allConcepts.push(...batchContent.conceptsJSON);
        if (batchContent.questionsJSON) allQuestions.push(...batchContent.questionsJSON);
      }
    });
    
    console.log(`[analyzePages] Completed parallel group ${Math.floor(i / MAX_PARALLEL_BATCHES) + 1} of ${Math.ceil(batchTasks.length / MAX_PARALLEL_BATCHES)}`);
  }
  
  return {
    vocabularyJSON: allVocabulary,
    summariesJSON: allSummaries,
    objectivesJSON: allObjectives,
    conceptsJSON: allConcepts,
    questionsJSON: allQuestions
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
    console.log('Document ID:', documentID);
    console.log('Is async invocation:', isAsyncInvocation);
    
    // Handle cancel request
    if ((event.arguments && event.field === 'cancelDocumentAnalysis') || event.field === 'cancelDocumentAnalysis') {
      console.log('Cancel request detected');
      await updateDocumentStatus(documentID, { status: 'failed' });
      return { success: true, fileID, documentID, message: 'Analysis cancelled' };
    }
    
    console.log('Fetching document record...');
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
    console.log('Document fetched:', { id: document?.id, status: document?.status });
    
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
    
    // Check if document has already been completed
    if (document.status === 'completed') {
      console.log('Document already completed, exiting');
      return {
        success: false,
        fileID,
        documentID,
        message: 'Document has already been analyzed. Check the ParsedContent for results.'
      };
    }
    
    // If this is NOT an async invocation, update status and spawn background task
    if (!isAsyncInvocation) {
      console.log('Initial invocation - checking if already processing...');
      
      // Check if document is already being processed (but allow resume)
      if (!resumeState && (document.status === 'extracting' || document.status === 'analyzing')) {
        console.log('Document already being processed by another invocation');
        return {
          success: false,
          fileID,
          documentID,
          message: 'Document is currently being processed. Please wait and try again.'
        };
      }
      
      // Update to extracting status
      console.log('Updating status to extracting and spawning async task');
      await updateDocumentStatus(documentID, { status: 'extracting' });
      console.log('Invoking Lambda asynchronously for background processing');
      console.log('Lambda function name:', process.env.AWS_LAMBDA_FUNCTION_NAME);
      
      try {
        const invokeCommand = new InvokeCommand({
          FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          InvocationType: 'Event', // Async invocation
          Payload: JSON.stringify({
            ...event,
            isAsyncInvocation: true,
            arguments: event.arguments || { fileID }
          })
        });
        
        const invokeResult = await lambdaClient.send(invokeCommand);
        console.log('Async invocation successful:', invokeResult);
        
        return { 
          success: true, 
          fileID, 
          documentID, 
          message: 'Analysis started in background',
          pageCount: null
        };
      } catch (invokeError) {
        console.error('Failed to invoke Lambda asynchronously:', invokeError);
        throw invokeError;
      }
    }
    
    // From here on, this is the async background processing
    console.log('Running background analysis for document:', documentID);
    
    let text = '';
    let pages = []; // Store individual pages for page-by-page analysis
    let pageCount = 0;
    let extractionComplete = false;
    let newResumeState = null;
    
    const extractionStartTime = Date.now();

    // Extract text from PDF, and get page count. For other file types, implement other extraction methods. doc, docx, txt, csv, etc.
    
    if (!s3Key) {
      throw new Error(`File ${fileID} is missing path field`);
    }
    // use either document extension or mime type to determine file type
    if (s3Key.toLowerCase().endsWith('.pdf')) {
      const result = await extractPdfText(s3Key, resumeState, context);
      pages = result.pages; // Assign to outer variable, not a new const
      pageCount = result.pageCount;
      extractionComplete = result.isComplete;
      newResumeState = result.resumeState;
      
      // For PDFs, concatenate all pages for the extracted text field
      text = pages.map(p => p.text).join('\n\n');
      
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
    
    const extractionTime = Date.now() - extractionStartTime;
    console.log(`[analyzeDocument] Text extraction complete in ${extractionTime}ms`);
    console.log(`[analyzeDocument] Extracted ${text.length} characters from ${pageCount} pages`);
    
    console.log('[analyzeDocument] Updating document status to extracted...');
    await updateDocumentStatus(documentID, { 
      extractedText: text, 
      pageCount, 
      status: 'extracted' 
    });
    console.log('[analyzeDocument] Status updated to extracted');
    
    console.log('[analyzeDocument] Fetching OpenAI API key from SSM...');
    const openaiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey: openaiKey });
    console.log('[analyzeDocument] OpenAI client initialized');
    
    console.log('[analyzeDocument] Updating document status to analyzing...');
    await updateDocumentStatus(documentID, { status: 'analyzing' });
    console.log('[analyzeDocument] Status updated to analyzing');
    
    const analysisStartTime = Date.now();
    
    let parsedContent;
    let responseId = 'page_by_page_analysis'; // Default for PDFs
    let totalTokensUsed = 0; // Will accumulate for PDFs
    
    // For PDFs, use page-by-page analysis
    if (s3Key.toLowerCase().endsWith('.pdf') && pages) {
      console.log(`[analyzeDocument] Analyzing ${pages.length} pages individually with GPT-4o...`);
      parsedContent = await analyzePages(openai, pages, fileID, documentID);
      // For page-by-page, responseId is already set to default
    } else {
      // For other file types, use original single-pass analysis
      console.log(`[analyzeDocument] Sending ${text.substring(0, 100000).length} characters to GPT-4o for analysis...`);
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
        metadata: {
          fileId: fileID,
          documentId: documentID
        }
      });
      
      parsedContent = JSON.parse(completion.choices[0].message.content);
      responseId = completion.id;
      totalTokensUsed = completion.usage?.total_tokens || 0;
    }
    
    const analysisTime = Date.now() - analysisStartTime;
    console.log(`[analyzeDocument] OpenAI analysis complete in ${analysisTime}ms`);
    console.log('[analyzeDocument] Parsed content:', {
      vocabularyCount: parsedContent.vocabularyJSON?.length || 0,
      summariesCount: parsedContent.summariesJSON?.length || 0,
      objectivesCount: parsedContent.objectivesJSON?.length || 0,
      conceptsCount: parsedContent.conceptsJSON?.length || 0,
      questionsCount: parsedContent.questionsJSON?.length || 0,
      // actual values
      vocabularyJSON: JSON.stringify(parsedContent.vocabularyJSON || []),
      summariesJSON: JSON.stringify(parsedContent.summariesJSON || []),
      objectivesJSON: JSON.stringify(parsedContent.objectivesJSON || []),
      conceptsJSON: JSON.stringify(parsedContent.conceptsJSON || []),
      questionsJSON: JSON.stringify(parsedContent.questionsJSON || []),
    });
    
    const createJobMutation = /* GraphQL */ `
      mutation CreateAgentJob($input: CreateAgentJobInput!) {
        createAgentJob(input: $input) {
          id
          owner
          type
          status
          documentID
          responseId
          modelUsed
          tokensUsed
          startedAt
          completedAt
          createdAt
          updatedAt
          _version
          _lastChangedAt
          _deleted
        }
      }
    `;
    
    await executeGraphQL(createJobMutation, {
      input: {
        owner: document.owner,
        type: 'document_analysis',
        status: 'completed',
        documentID,
        responseId: responseId,
        modelUsed: 'gpt-4o',
        tokensUsed: totalTokensUsed,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }
    });
    
    const createContentMutation = /* GraphQL */ `
      mutation CreateParsedContent($input: CreateParsedContentInput!) {
        createParsedContent(input: $input) {
          id
          owner
          documentID
          fileID
          vocabularyJSON
          summariesJSON
          objectivesJSON
          conceptsJSON
          questionsJSON
          responseId
          modelUsed
          tokensUsed
          createdAt
          updatedAt
          _version
          _lastChangedAt
          _deleted
        }
      }
    `;
    
    console.log('[analyzeDocument] Saving parsed content to database...');
    await executeGraphQL(createContentMutation, {
      input: {
        documentID,
        fileID,
        owner: document.owner,
        vocabularyJSON: JSON.stringify(parsedContent.vocabularyJSON || []),
        summariesJSON: JSON.stringify(parsedContent.summariesJSON || []),
        objectivesJSON: JSON.stringify(parsedContent.objectivesJSON || []),
        conceptsJSON: JSON.stringify(parsedContent.conceptsJSON || []),
        questionsJSON: JSON.stringify(parsedContent.questionsJSON || []),
        responseId: responseId,
        modelUsed: 'gpt-4o',
        tokensUsed: totalTokensUsed
      }
    });

    // Join to Document record is automatic via documentID foreign key
    // Join to File record via fileID foreign key

    console.log('[analyzeDocument] ParsedContent saved successfully');
    
    console.log('[analyzeDocument] Updating document status to completed...');
    await updateDocumentStatus(documentID, { status: 'completed' });
    console.log('[analyzeDocument] Document analysis complete!');
    
    const totalTime = Date.now() - extractionStartTime;
    console.log(`[analyzeDocument] Total processing time: ${totalTime}ms`);
    
    return { success: true, fileID, documentID, responseId, pageCount, totalTimeMs: totalTime, message: 'Document analysis completed successfully', 
      vocabularyCount: parsedContent.vocabularyJSON?.length || 0,
      summariesCount: parsedContent.summariesJSON?.length || 0,
      objectivesCount: parsedContent.objectivesJSON?.length || 0,
      conceptsCount: parsedContent.conceptsJSON?.length || 0,
      questionsCount: parsedContent.questionsJSON?.length || 0,
      // actual values
      conceptsJSON: parsedContent.conceptsJSON || [],
      vocabularyJSON: parsedContent.vocabularyJSON || [],
      summariesJSON: parsedContent.summariesJSON || [],
      objectivesJSON: parsedContent.objectivesJSON || [],
      questionsJSON: parsedContent.questionsJSON || [],
      metadata: {
        tokensUsed: totalTokensUsed,
        model: 'gpt-4o',
      } 
    };  
    
  } catch (error) {
    console.error('Error in analyzeDocument:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
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