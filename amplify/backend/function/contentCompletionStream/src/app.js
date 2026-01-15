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
const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');
const OpenAI = require('openai');
const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

// SSM and OpenAI initialization
const ssmClient = new SSMClient();
let openaiInstance = null;
let apiKeyCache = null;

async function getOpenAIApiKey() {
  if (apiKeyCache) return apiKeyCache;
  
  const parameterName = process.env.OPENAI_API_KEY;
  if (!parameterName) throw new Error('OPENAI_API_KEY environment variable not set');
  
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

const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  next();
});

// POST /complete - Streaming content completion endpoint
app.post('/complete', async function(req, res) {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Invalid request: prompt is required' });
    }

    const openai = await getOpenAI();

    // Build system message
    let systemMessage = `You are an AI assistant helping to create educational content in Japanese. Complete the given text naturally and pedagogically.`;
    
    if (context) {
      if (context.unitName) {
        systemMessage += `\n\nCurrent Unit: ${context.unitName}`;
      }
      if (context.lastBlocks) {
        systemMessage += `\n\nRecent context: ${JSON.stringify(context.lastBlocks)}`;
      }
    }

    console.log('[ContentCompletion] Creating completion for prompt:', prompt.substring(0, 50));

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(content);
      }
    }

    res.end();
  } catch (error) {
    console.error('[ContentCompletion] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
});

app.listen(3000, function() {
  console.log('App started');
});

module.exports = app;
