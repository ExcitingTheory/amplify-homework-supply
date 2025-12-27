/**
 * Lambda Function: analyzePdf
 * 
 * Extracts text from uploaded PDFs and sends to OpenAI for vocabulary analysis.
 */

/* Amplify Params - DO NOT EDIT
	API_JAPANESE5_AGENTJOBTABLE_ARN
	API_JAPANESE5_AGENTJOBTABLE_NAME
	API_JAPANESE5_DOCUMENTTABLE_ARN
	API_JAPANESE5_DOCUMENTTABLE_NAME
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
    
    const updateMutation = /* GraphQL */ `
      mutation UpdateDocument($input: UpdateDocumentInput!) {
        updateDocument(input: $input) { id }
      }
    `;
    
    await executeGraphQL(updateMutation, {
      input: { id: documentID, status: 'extracting' }
    });
    
    const { text, pageCount } = await extractPdfText(document.s3Key);
    
    await executeGraphQL(updateMutation, {
      input: { id: documentID, extractedText: text, pageCount, status: 'extracted' }
    });
    
    const openaiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey: openaiKey });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Extract vocabulary, summaries, objectives from text. Return JSON: {vocabularyJSON: [{word, definition, context, page}], summariesJSON: [{title, content}], objectivesJSON: [{objective}], conceptsJSON: [{concept, description}]}`
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
        type: 'pdf_analysis',
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
    throw error;
  }
};
