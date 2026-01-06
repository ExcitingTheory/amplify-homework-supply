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
	ENV
	REGION
Amplify Params - DO NOT EDIT */

import OpenAI from 'openai';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient();

// Cache API key to avoid repeated SSM calls
let cachedApiKey = null;

async function getOpenAIKey() {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const { Parameters } = await ssmClient.send(
    new GetParametersCommand({
      Names: ["OPENAI_API_KEY"].map(secretName => process.env[secretName]),
      WithDecryption: true,
    })
  );

  cachedApiKey = Parameters[0].Value;
  return cachedApiKey;
}

/**
 * Lambda handler for AI-powered pedagogical block suggestions
 * Analyzes lesson structure and suggests next blocks with reasoning
 * 
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event) => {
  console.log('suggestBlocks event:', JSON.stringify(event, null, 2));

  try {
    // Parse body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { unitStructure, currentContext, userHistory } = body;

    if (!unitStructure) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'Unit structure is required' }),
      };
    }

    // Get OpenAI API key from SSM
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey });

    // Parse JSON strings if needed
    const structure = typeof unitStructure === 'string' 
      ? JSON.parse(unitStructure) 
      : unitStructure;
    const context = currentContext && typeof currentContext === 'string'
      ? JSON.parse(currentContext)
      : currentContext;
    const history = userHistory && typeof userHistory === 'string'
      ? JSON.parse(userHistory)
      : userHistory;

    // Build educational analysis prompt
    const systemMessage = buildPedagogicalSystemMessage();
    const analysisPrompt = buildAnalysisPrompt(structure, context, history);

    const messages = [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: analysisPrompt,
      },
    ];

    // Create completion with structured output
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        ...result,
        usage: response.usage,
      }),
    };
  } catch (error) {
    console.error('suggestBlocks error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        error: 'Failed to generate block suggestions',
        details: error.message,
      }),
    };
  }
};

function buildPedagogicalSystemMessage() {
  return `You are an expert educational content strategist specializing in curriculum design and pedagogical best practices.

Your role is to analyze lesson structures and suggest what type of content block should come next, along with clear educational reasoning.

Block Types Available:
- heading: New section or topic
- paragraph: Explanation or description
- answer: Vocabulary practice exercise (students provide translations)
- custom-answer: Custom practice exercise (instructor-defined prompts)
- quiz: Multiple choice assessment
- summary: Recap or conclusion

Pedagogical Principles:
1. **Scaffolding**: Build from simple to complex
2. **Active Learning**: Include regular practice opportunities
3. **Spaced Repetition**: Reinforce concepts through varied exercises
4. **Assessment**: Check understanding before moving on
5. **Reflection**: Help learners consolidate knowledge

When suggesting blocks:
- Consider cognitive load (don't overwhelm)
- Balance input (explanations) with output (practice)
- Ensure assessments match what was taught
- Provide variety in exercise types
- Think about learning psychology and retention

Return your suggestions as JSON in this exact format:
{
  "suggestions": [
    {
      "type": "quiz",
      "label": "Add Comprehension Quiz",
      "icon": "📊",
      "reasoning": "After presenting three examples, learners need to demonstrate understanding. A quiz here provides formative assessment and identifies gaps before moving forward.",
      "priority": "high"
    }
  ],
  "overallAssessment": "The lesson has strong explanatory content but lacks opportunities for active practice. Consider adding exercises before the final summary."
}

Prioritize suggestions:
- "high": Strongly recommended (addresses gap or follows best practice)
- "medium": Good option (improves flow or variety)
- "low": Optional enhancement (nice-to-have)

Provide 2-4 suggestions, ordered by priority.`;
}

function buildAnalysisPrompt(unitStructure, currentContext, userHistory) {
  let prompt = `Analyze this lesson structure and suggest what content block should come next.

## Lesson Structure (in order):
${formatUnitStructure(unitStructure)}

## Current Context:
Position: ${currentContext?.position || 'End of lesson'}
Last Block Type: ${currentContext?.lastBlockType || 'unknown'}
Last Block Summary: ${currentContext?.lastBlockContent || 'No content'}

`;

  if (userHistory && userHistory.length > 0) {
    prompt += `\n## Instructor's Recent Patterns:
`;
    userHistory.forEach(pattern => {
      prompt += `- After ${pattern.after}, usually adds: ${pattern.preferred}\n`;
    });
  }

  prompt += `\n## Your Task:
Suggest 2-4 pedagogically sound block types that could come next, with clear educational reasoning for each. Consider:
1. What learning needs are unmet?
2. What would maximize retention and understanding?
3. How can we maintain engagement while ensuring mastery?
4. What patterns work well for language learning?

Return suggestions as JSON matching the specified format.`;

  return prompt;
}

function formatUnitStructure(structure) {
  if (!structure || structure.length === 0) {
    return '(Empty lesson - no blocks yet)';
  }

  return structure.map((block, index) => {
    const position = index + 1;
    const summary = block.content 
      ? block.content.substring(0, 100) + (block.content.length > 100 ? '...' : '')
      : 'No content';
    
    return `${position}. [${block.type.toUpperCase()}] ${summary}`;
  }).join('\n');
}
