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
import OpenAI from 'openai';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

const GRAPHQL_ENDPOINT = process.env.API_AMPLIFYHOMEWORKSUPPLY_GRAPHQLAPIENDPOINTOUTPUT;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const { Sha256 } = crypto;

const ssmClient = new SSMClient();
let openaiInstance = null;
let apiKeyCache = null;

async function getOpenAIApiKey() {
  if (apiKeyCache) return apiKeyCache;

  const parameterName = process.env.OPENAI_API_KEY;
  if (!parameterName) throw new Error('OPENAI_API_KEY environment variable not set');

  // In test/local environment, treat as direct API key instead of SSM parameter name
  if (process.env.NODE_ENV === 'test' || process.env.IS_LOCAL === 'true') {
    console.log('[Test Mode] Using OPENAI_API_KEY directly from environment');
    apiKeyCache = parameterName;
    return apiKeyCache;
  }

  // Production: fetch from SSM
  const { Parameters } = await ssmClient.send(
    new GetParametersCommand({
      Names: [parameterName],
      WithDecryption: true,
    })
  );

  if (!Parameters || Parameters.length === 0) {
    throw new Error('Failed to retrieve OpenAI API key from SSM');
  }

  apiKeyCache = Parameters[0].Value;
  return apiKeyCache;
}

async function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = await getOpenAIApiKey();
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */


export const handler = async (event) => {
  const { content, model = 'text-embedding-3-small', dimensions = 512 } = event.arguments;

  const openai = await getOpenAI();

  try {
    // Validate input
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    // Count approximate tokens (rough estimate: 1 token ≈ 4 chars)
    const estimatedTokens = Math.ceil(content.length / 4);

    if (estimatedTokens > 8000) {
      throw new Error(`Content too long: ~${estimatedTokens} tokens (max 8000)`);
    }

    // Generate embedding
    const response = await openai.embeddings.create({
      model,
      input: content,
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