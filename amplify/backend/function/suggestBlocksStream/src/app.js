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

// POST /suggest-block - Block suggestion endpoint (returns JSON)
app.post('/suggest-block', async function(req, res) {
  try {
    const { unitStructure, currentContext, userHistory } = req.body;
    
    if (!unitStructure) {
      return res.status(400).json({ error: 'Invalid request: unitStructure is required' });
    }

    const openai = await getOpenAI();

    // Build system message for pedagogical analysis
    const systemMessage = `You are an expert educational content designer specializing in Japanese language instruction.

Analyze the provided lesson structure and suggest the next logical block types that would best serve the pedagogical progression.

For each suggestion:
1. Consider what content already exists
2. Identify gaps in the learning sequence
3. Recommend block types that build on previous content
4. Prioritize suggestions based on pedagogical importance

Provide your response as JSON with this exact structure:
{
  "suggestions": [
    {
      "type": "heading|paragraph|quiz|meaning-association|answer|custom-answer",
      "label": "Short descriptive label",
      "icon": "📝|📖|❓|🔗|✍️|💭",
      "reasoning": "Clear pedagogical explanation (2-3 sentences)",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "overallAssessment": "Brief analysis of the lesson's current state and learning flow"
}`;

    const userMessage = `Unit Structure:\n${JSON.stringify(unitStructure, null, 2)}\n\nCurrent Context:\n${JSON.stringify(currentContext || {}, null, 2)}`;

    console.log('[SuggestBlocks] Analyzing unit structure');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('[SuggestBlocks] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(3000, function() {
  console.log('App started');
});

module.exports = app;
