/*
Use the following code to retrieve configured secrets from SSM:

const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

const client = new SSMClient();
const { Parameters } = await client.send(new GetParametersCommand({
  Names: ["OPENAPI_API_KEY"].map(secretName => process.env[secretName]),
  WithDecryption: true,
}));

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/* Amplify Params - DO NOT EDIT
	API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT
	API_JAPANESE5_GRAPHQLAPIIDOUTPUT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

import crypto from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { default as fetch, Request } from 'node-fetch';
const { OpenAI } = require('openai');

const GRAPHQL_ENDPOINT = process.env.API_AMPLIFYHOMEWORKSUPPLY_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const { Sha256 } = crypto;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */


exports.handler = async (event) => {
  const { text, model = 'text-embedding-3-small', dimensions = 1536 } = event.arguments;

  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Count approximate tokens (rough estimate: 1 token ≈ 4 chars)
    const estimatedTokens = Math.ceil(text.length / 4);
    
    if (estimatedTokens > 8000) {
      throw new Error(`Text too long: ~${estimatedTokens} tokens (max 8000)`);
    }

    // Generate embedding
    const response = await openai.embeddings.create({
      model,
      input: text,
      dimensions
    });

    const embedding = response.data[0].embedding;

    return {
      embedding,
      model,
      dimensions,
      tokenCount: response.usage.total_tokens
    };

  } catch (error) {
    console.error('Embedding generation error:', error);
    
    return {
      embedding: null,
      model,
      dimensions,
      tokenCount: 0,
      error: error.message
    };
  }
};