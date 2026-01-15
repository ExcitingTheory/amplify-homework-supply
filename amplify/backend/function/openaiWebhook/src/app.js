/*
Use the following code to retrieve configured secrets from SSM:

const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const client = new SSMClient();
const { Parameters } = await client.send(new GetParametersCommand({
  Names: ["OPENAI_WEBHOOK_SECRET"].map(secretName => process.env[secretName]),
  WithDecryption: true,
}));

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

/* Amplify Params - DO NOT EDIT
	API_JAPANESE5_DOCUMENTTABLE_ARN
	API_JAPANESE5_DOCUMENTTABLE_NAME
	API_JAPANESE5_FILETABLE_ARN
	API_JAPANESE5_FILETABLE_NAME
	API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT
	API_JAPANESE5_GRAPHQLAPIIDOUTPUT
	API_JAPANESE5_PARSEDCONTENTTABLE_ARN
	API_JAPANESE5_PARSEDCONTENTTABLE_NAME
	ENV
	REGION
	STORAGE_FILES_BUCKETNAME
Amplify Params - DO NOT EDIT */

const express = require('express');
const aws = require('aws-sdk');
const OpenAI = require('openai').default;
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { HttpRequest } = require('@aws-sdk/protocol-http');
const { Sha256 } = require('@aws-crypto/sha256-js');

const GRAPHQL_ENDPOINT = process.env.API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.REGION || 'us-east-1';

// Cache for webhook secret
let webhookSecret = null;
let openaiClient = null;

// Retrieve webhook secret from SSM
async function getWebhookSecret() {
  if (webhookSecret) return webhookSecret;
  
  const ssm = new aws.SSM();
  const { Parameters } = await ssm.getParameters({
    Names: [process.env.OPENAI_WEBHOOK_SECRET],
    WithDecryption: true,
  }).promise();
  
  if (Parameters && Parameters.length > 0) {
    webhookSecret = Parameters[0].Value;
  }
  
  return webhookSecret;
}

// Initialize OpenAI client with webhook secret
async function getOpenAIClient() {
  if (openaiClient) return openaiClient;
  
  const secret = await getWebhookSecret();
  openaiClient = new OpenAI({ webhookSecret: secret });
  
  return openaiClient;
}

// Execute GraphQL mutation/query with IAM auth
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
// declare a new express app
const app = express()

// Use express.text() for webhook signature verification (needs raw body)
app.use(express.text({ type: 'application/json' }));
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

/**********************
 * OpenAI Webhook Endpoint *
 **********************/

app.post('/webhook', async function(req, res) {
  try {
    const client = await getOpenAIClient();
    
    // Verify webhook signature and unwrap event
    const event = await client.webhooks.unwrap(req.body, req.headers);
    
    console.log('Webhook event received:', event.type);
    
    // Handle different event types
    if (event.type === 'response.completed') {
      const response_id = event.data.id;
      console.log('Response completed:', response_id);
      
      // Retrieve the full response
      const response = await client.responses.retrieve(response_id);
      
      // Extract metadata to link back to your database
      const metadata = response.metadata || {};
      const { fileId, documentId } = metadata;
      
      console.log('Metadata:', metadata);
      
      // Extract text output from OpenAI response
      const output_text = response.output
        .filter((item) => item.type === 'message')
        .flatMap((item) => item.content)
        .filter((contentItem) => contentItem.type === 'output_text')
        .map((contentItem) => contentItem.text)
        .join('');
      
      console.log('Response output length:', output_text.length, 'characters');
      console.log('Response preview:', output_text.substring(0, 200) + '...');
      
      // Save to AppSync/DynamoDB using the metadata IDs
      if (fileId && documentId) {
        console.log(`Processing response for fileId: ${fileId}, documentId: ${documentId}`);
        
        try {
          // Parse the large JSON response from OpenAI containing all extracted data:
          // vocabularyJSON, summariesJSON, objectivesJSON, conceptsJSON, questionsJSON
          const parsedContent = JSON.parse(output_text);
          
          // Validate the structure
          if (!parsedContent || typeof parsedContent !== 'object') {
            throw new Error('Invalid response format: expected JSON object');
          }
          
          const counts = {
            vocabularyCount: parsedContent.vocabularyJSON?.length || 0,
            summariesCount: parsedContent.summariesJSON?.length || 0,
            objectivesCount: parsedContent.objectivesJSON?.length || 0,
            conceptsCount: parsedContent.conceptsJSON?.length || 0,
            questionsCount: parsedContent.questionsJSON?.length || 0
          };
          
          console.log('Parsed content structure:', counts);
          console.log('Total items to save:', 
            counts.vocabularyCount + counts.summariesCount + 
            counts.objectivesCount + counts.conceptsCount + counts.questionsCount
          );
          
          // Create ParsedContent record
          const createContentMutation = /* GraphQL */ `
            mutation CreateParsedContent($input: CreateParsedContentInput!) {
              createParsedContent(input: $input) { 
                id 
                documentID
                vocabularyJSON
                summariesJSON
                objectivesJSON
                conceptsJSON
                questionsJSON
                responseId
                modelUsed
                tokensUsed
              }
            }
          `;
          
          await executeGraphQL(createContentMutation, {
            input: {
              documentID: documentId,
              vocabularyJSON: JSON.stringify(parsedContent.vocabularyJSON || []),
              summariesJSON: JSON.stringify(parsedContent.summariesJSON || []),
              objectivesJSON: JSON.stringify(parsedContent.objectivesJSON || []),
              conceptsJSON: JSON.stringify(parsedContent.conceptsJSON || []),
              questionsJSON: JSON.stringify(parsedContent.questionsJSON || []),
              responseId: response_id,
              modelUsed: response.model || 'gpt-4o',
              tokensUsed: response.usage?.total_tokens,
            }
          });
          
          console.log('ParsedContent saved successfully');
          
          // Update Document status to completed
          const getDocumentQuery = /* GraphQL */ `
            query GetDocument($id: ID!) {
              getDocument(id: $id) {
                id
                _version
              }
            }
          `;
          
          const { getDocument } = await executeGraphQL(getDocumentQuery, { id: documentId });
          
          if (getDocument) {
            const updateDocumentMutation = /* GraphQL */ `
              mutation UpdateDocument($input: UpdateDocumentInput!) {
                updateDocument(input: $input) { 
                  id 
                  status
                }
              }
            `;
            
            await executeGraphQL(updateDocumentMutation, {
              input: { 
                id: documentId, 
                _version: getDocument._version,
                status: 'completed'
              }
            });
            
            console.log('Document status updated to completed');
          }
          
        } catch (parseError) {
          console.error('Failed to process webhook response:', parseError);
          
          // Try to update Document status to failed
          try {
            const getDocumentQuery = /* GraphQL */ `
              query GetDocument($id: ID!) {
                getDocument(id: $id) {
                  id
                  _version
                }
              }
            `;
            
            const { getDocument } = await executeGraphQL(getDocumentQuery, { id: documentId });
            
            if (getDocument) {
              const updateDocumentMutation = /* GraphQL */ `
                mutation UpdateDocument($input: UpdateDocumentInput!) {
                  updateDocument(input: $input) { 
                    id 
                    status
                  }
                }
              `;
              
              await executeGraphQL(updateDocumentMutation, {
                input: { 
                  id: documentId, 
                  _version: getDocument._version,
                  status: 'failed'
                }
              });
            }
          } catch (updateError) {
            console.error('Failed to update document status:', updateError);
          }
        }
      }
      
      // Store the response ID for future reference
      console.log(`OpenAI Response ID: ${response_id}`);
    }
    
    res.status(200).send();
  } catch (error) {
    if (error.constructor.name === 'InvalidWebhookSignatureError') {
      console.error('Invalid webhook signature:', error.message);
      res.status(400).send('Invalid signature');
    } else {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

// Health check endpoint
app.get('/webhook', function(req, res) {
  res.json({ status: 'ok', message: 'OpenAI Webhook endpoint is ready' });
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
