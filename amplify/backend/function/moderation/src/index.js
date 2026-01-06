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
	API_JAPANESE5_GRADETABLE_ARN
	API_JAPANESE5_GRADETABLE_NAME
	API_JAPANESE5_GRAPHQLAPIENDPOINTOUTPUT
	API_JAPANESE5_GRAPHQLAPIIDOUTPUT
	API_JAPANESE5_PARSEDCONTENTTABLE_ARN
	API_JAPANESE5_PARSEDCONTENTTABLE_NAME
	API_JAPANESE5_QUESTIONTABLE_ARN
	API_JAPANESE5_QUESTIONTABLE_NAME
	API_JAPANESE5_UNITTABLE_ARN
	API_JAPANESE5_UNITTABLE_NAME
	API_JAPANESE5_WORDTABLE_ARN
	API_JAPANESE5_WORDTABLE_NAME
	ENV
	REGION
	STORAGE_FILES_BUCKETNAME
Amplify Params - DO NOT EDIT */

import OpenAI from 'openai';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize SSM client
const ssmClient = new SSMClient({ region: AWS_REGION });

// Get OpenAI API key from SSM Parameter Store
async function getOpenAIKey() {
  const { Parameters } = await ssmClient.send(new GetParametersCommand({
    Names: [process.env.OPENAI_API_KEY],
    WithDecryption: true,
  }));
  
  const foundItem = Parameters.find(item => item.Name === process.env.OPENAI_API_KEY);
  return foundItem?.Value;
}

// Initialize OpenAI client (will be set on first invocation)
let openai = null;

/**
 * Content Moderation Lambda Handler
 * 
 * Uses OpenAI's Moderation API to check user-generated content for policy violations.
 * The content is flagged but still saved - instructors handle flagged content per their policies.
 * 
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  try {
    // Initialize OpenAI client if needed
    if (!openai) {
      const apiKey = await getOpenAIKey();
      openai = new OpenAI({ apiKey });
    }

    const { content } = event.arguments;

    if (!content || typeof content !== 'string') {
      return {
        flagged: false,
        categories: {},
        categoryScores: {},
        model: 'text-moderation-latest',
        error: 'No content provided'
      };
    }

    // Call OpenAI Moderation API
    // https://platform.openai.com/docs/guides/moderation
    const moderation = await openai.moderations.create({
      input: content,
      model: 'text-moderation-latest'
    });

    const result = moderation.results[0];

    console.log('Moderation result:', JSON.stringify(result));

    // Return structured moderation result
    // Content is NOT blocked - just flagged for instructor review
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores,
      model: moderation.model,
      error: null
    };

  } catch (error) {
    console.error('Moderation error:', error);
    
    // Return error but don't block content
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      model: 'text-moderation-latest',
      error: error.message
    };
  }
};
