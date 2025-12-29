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
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import OpenAI from 'openai';

const GRAPHQL_ENDPOINT = process.env.API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.REGION || 'us-east-1';
const STORAGE_BUCKET = process.env.STORAGE_FILES_BUCKETNAME;
const { Sha256 } = crypto;

const s3Client = new S3Client({ region: AWS_REGION });
const ssmClient = new SSMClient({ region: AWS_REGION });

async function getOpenAIKey() {
  const paramName = process.env.OPENAI_API_KEY;
  const command = new GetParameterCommand({
    Name: paramName,
    WithDecryption: true,
  });
  const response = await ssmClient.send(command);
  return response.Parameter.Value;
}

async function executeGraphQL(query, variables) {
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
    throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
  }
  
  return result.data;
}

async function extractPdfText(s3Key) {
  const command = new GetObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: s3Key,
  });
  
  const response = await s3Client.send(command);
  const chunks = [];
  
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  
  const buffer = Buffer.concat(chunks);
  const pdfData = await pdfParse(buffer);
  
  return {
    text: pdfData.text,
    pageCount: pdfData.numpages,
  };
}

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const { documentID } = event.arguments;
    
    // Handle cancel request
    if (event.field === 'cancelDocumentAnalysis') {
      const updateMutation = /* GraphQL */ `
        mutation UpdateDocument($input: UpdateDocumentInput!) {
          updateDocument(input: $input) { id }
        }
      `;
      
      await executeGraphQL(updateMutation, {
        input: { id: documentID, status: 'failed' }
      });
      
      return { success: true, documentID, message: 'Analysis cancelled' };
    }
    
    const getDocumentQuery = /* GraphQL */ `
      query GetDocument($id: ID!) {
        getDocument(id: $id) {
          id
          filename
          s3Key
          owner
          unitID
        }
      }
    `;
    
    const { getDocument: document } = await executeGraphQL(getDocumentQuery, { id: documentID });
    
    if (!document) throw new Error(`Document not found: ${documentID}`);
    let text = '';
    let pageCount = 0;
    
    const updateMutation = /* GraphQL */ `
      mutation UpdateDocument($input: UpdateDocumentInput!) {
        updateDocument(input: $input) { id }
      }
    `;
    
    await executeGraphQL(updateMutation, {
      input: { id: documentID, status: 'extracting' }
    });

    // Extract text from PDF, and get page count. For other file types, implement other extraction methods. doc, docx, txt, csv, etc.
    
    if (!document.s3Key) {
      throw new Error(`Document ${documentID} is missing s3Key field`);
    }
    // use either document extension or mime type to determine file type
    if (document.s3Key.toLowerCase().endsWith('.pdf')) {
      const { text: extractedText, pageCount: extractedPageCount } = await extractPdfText(document.s3Key);
      text = extractedText;
      pageCount = extractedPageCount;
    } else if (document.s3Key.toLowerCase().endsWith('.txt')) {
      // For .txt files, simple S3 getObject and read as text
      const command = new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: document.s3Key,
      });
      
      const response = await s3Client.send(command);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      text = buffer.toString('utf-8');
      pageCount = Math.ceil(text.length / 2000); // Rough estimate: 2000 chars per page
      
    } else if (document.s3Key.toLowerCase().endsWith('.docx')) {
      // For .docx files, use mammoth to extract text
      const command = new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: document.s3Key,
      });
      
      const response = await s3Client.send(command);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      
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
      const command = new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: document.s3Key,
      });
      
      const response = await s3Client.send(command);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      text = buffer.toString('utf-8');
      pageCount = Math.ceil(text.length / 2000); // Rough estimate: 2000 chars per page
    } else {
      throw new Error(`Unsupported file type for document ${documentID}`);
    }
    
    await executeGraphQL(updateMutation, {
      input: { id: documentID, extractedText: text, pageCount, status: 'extracted' }
    });
    
    const openaiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey: openaiKey });
    
    await executeGraphQL(updateMutation, {
      input: { id: documentID, status: 'analyzing' }
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Extract vocabulary, summaries, objectives, concepts, and generate questions from educational text. Return JSON: {
  vocabularyJSON: [{word, definition, context, page}],
  summariesJSON: [{title, content, page_range}],
  objectivesJSON: [{objective, bloom_level}],
  conceptsJSON: [{concept, description, related_vocabulary}],
  questionsJSON: [{question, expectedAnswer, hint, type}]
}

For questionsJSON, generate 5-10 custom answer questions that test comprehension of the material. Questions should be open-ended, requiring thoughtful responses. Include:
- question: The question text
- expectedAnswer: A sample correct answer (200-300 words)
- hint: A helpful hint for students (optional)
- type: "short_answer" or "essay"`
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
        unitID: document.unitID,
        responseId: completion.id,
        modelUsed: 'gpt-4',
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
        modelUsed: 'gpt-4',
        tokensUsed: completion.usage?.total_tokens,
      }
    });
    
    await executeGraphQL(updateMutation, {
      input: { id: documentID, status: 'completed' }
    });
    
    return { success: true, documentID, responseId: completion.id, pageCount };
    
  } catch (error) {
    console.error('Error:', error);
    
    // Try to update document status to failed
    try {
      const updateMutation = /* GraphQL */ `
        mutation UpdateDocument($input: UpdateDocumentInput!) {
          updateDocument(input: $input) { id }
        }
      `;
      
      await executeGraphQL(updateMutation, {
        input: { id: event.arguments.documentID, status: 'failed' }
      });
    } catch (updateError) {
      console.error('Failed to update document status:', updateError);
    }
    
    throw error;
  }
};