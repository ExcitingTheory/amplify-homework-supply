/**
 * AI Content Handler for Gen 2
 * 
 * Handles content generation and unit prediction:
 * - contentCompletion: AI-assisted content writing
 * - suggestBlocks: Suggest Lexical block types for unit
 * - predictUnitData: Predict unit structure from unitID
 * - predictUnitByData: Predict structure from existing data
 * 
 * Reference: amplify/backend/function/contentCompletion-${env}/
 */

import type { Handler } from 'aws-lambda';

let openaiInstance: any = null;

async function getOpenAI(): Promise<any> {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
    const OpenAI = (await import('openai')).default;
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}


export const handler: Handler = async (event: any, context: any) => {
  const operationName = context?.['x-operation-name'] || event.info?.fieldName;
  const args = event.arguments || {};
  

  console.log(`[AI Content Handler] ${operationName}`, args);

  try {
    switch (operationName) {
      case 'contentCompletion':
        return await handleContentCompletion(args);
      case 'suggestBlocks':
        return await handleSuggestBlocks(args);
      case 'predictUnitData':
        return await handlePredictUnitData(args);
      case 'predictUnitByData':
        return await handlePredictUnitByData(args);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  } catch (error) {
    console.error(`[AI Content Handler Error] ${operationName}:`, error);
    throw error;
  }
};

async function handleContentCompletion(args: any): Promise<string> {
  const { prompt, context } = args;
  const openai = await getOpenAI();
  
  try {
    // Build system message based on context
    let systemPrompt = 'You are an expert educational content writer specializing in creating clear, engaging, and pedagogically sound learning materials.';
    
    if (context) {
      const ctx = typeof context === 'string' ? JSON.parse(context) : context;
      if (ctx.unitName) {
        systemPrompt += `\n\nYou are creating content for the unit: "${ctx.unitName}"`;
      }
      if (ctx.targetAudience) {
        systemPrompt += `\nTarget audience: ${ctx.targetAudience}`;
      }
      if (ctx.languageLevel) {
        systemPrompt += `\nLanguage level: ${ctx.languageLevel}`;
      }
      if (ctx.previousContent) {
        systemPrompt += `\n\nPrevious content in this unit:\n${ctx.previousContent}`;
      }
    }
    
    systemPrompt += '\n\nCreate clear, well-structured educational content that builds on previous material and prepares students for assessment.';
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Content Completion Error]:', error);
    throw error;
  }
}

async function handleSuggestBlocks(args: any): Promise<string> {
  const { unitStructure, currentContext, userHistory } = args;
  const openai = await getOpenAI();
  
  try {
    const unitStruct = typeof unitStructure === 'string' ? JSON.parse(unitStructure) : unitStructure;
    const context = currentContext ? (typeof currentContext === 'string' ? JSON.parse(currentContext) : currentContext) : {};
    const history = userHistory ? (typeof userHistory === 'string' ? JSON.parse(userHistory) : userHistory) : {};
    
    // Count existing block types
    const blockCounts: Record<string, number> = {};
    if (unitStruct.blocks && Array.isArray(unitStruct.blocks)) {
      for (const block of unitStruct.blocks) {
        blockCounts[block.type] = (blockCounts[block.type] || 0) + 1;
      }
    }
    
    const prompt = `You are an expert instructional designer for an interactive learning platform using Lexical editor blocks.

Current unit structure has these blocks:
${JSON.stringify(blockCounts)}

Unit context:
- Name: ${unitStruct.name || 'N/A'}
- Target level: ${context.targetLevel || 'Intermediate'}
- Student history: ${history.completedUnits || 0} completed units

Available block types:
- paragraph: Text content with formatting
- heading: Section headers  
- quiz: Multiple choice or short answer questions
- meaning-association: Visual vocabulary associations (kanji/kana/English)
- answer: Long-form answer blocks for essays/reflections
- custom-answer: Graded practice with AI feedback

Based on this structure, suggest the NEXT block that should be added. Return ONLY valid JSON (no markdown, no code blocks):
{
  "suggestedBlocks": [
    {
      "type": "paragraph|heading|quiz|meaning-association|answer|custom-answer",
      "title": "Descriptive title",
      "description": "Why this block type is appropriate",
      "position": "after_block_id or 'end'",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "reasoning": "Overall pedagogical strategy for this unit",
  "nextSteps": "Recommended content for instructor to add"
}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Suggest Blocks Error]:', error);
    throw error;
  }
}

async function handlePredictUnitData(args: any): Promise<string> {
  const { unitID, context } = args;
  const openai = await getOpenAI();
  
  try {
    const ctx = context ? (typeof context === 'string' ? JSON.parse(context) : context) : {};
    
    // Build prompt with unit context
    const prompt = `You are an expert curriculum designer for Japanese language learning.

Unit ID: ${unitID}
Unit name: ${ctx.unitName || 'Language Unit'}
Current unit count: ${ctx.unitCount || 'N/A'}
Target proficiency: ${ctx.targetProficiency || 'JLPT N4'}

Based on this unit's context in a language learning progression, predict and suggest:
1. Learning outcomes (3-5 specific, measurable objectives)
2. Key vocabulary (10-15 essential terms with context)
3. Grammar points to cover (3-5 main patterns)
4. Assessment strategy (how to measure learning)
5. Recommended content blocks in sequence

Return ONLY valid JSON (no markdown):
{
  "outcomes": ["outcome1", "outcome2", ...],
  "vocabulary": [{"word": "...", "reading": "...", "definition": "...", "example": "..."}],
  "grammarPoints": ["point1", "point2", ...],
  "assessmentStrategy": "Description of how to assess learning",
  "recommendedBlocks": [{"type": "...", "title": "...", "description": "..."}],
  "estimatedDuration": "X minutes"
}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Predict Unit Data Error]:', error);
    throw error;
  }
}

async function handlePredictUnitByData(args: any): Promise<string> {
  const { data } = args;
  const openai = await getOpenAI();
  
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    const prompt = `You are an expert instructional designer analyzing an existing unit structure.

Current unit data:
${JSON.stringify(parsedData, null, 2)}

Based on this unit's current content, structure, and pedagogy, provide:
1. Suggestions for complementary content (what's missing)
2. Recommended assessment items (based on learning objectives)
3. Suggested student practice blocks
4. Estimated time to complete this unit
5. Prerequisite knowledge students should have
6. Natural progression to next unit

Return ONLY valid JSON (no markdown):
{
  "complementaryContent": ["suggestion1", "suggestion2", ...],
  "assessmentItems": [{"type": "...", "prompt": "...", "expectedOutcome": "..."}],
  "practiceBlocks": ["practice1", "practice2", ...],
  "estimatedCompletionTime": "X minutes",
  "prerequisites": ["prerequisite1", ...],
  "progressionSuggestion": "What unit should follow this",
  "overallQualityScore": 1-10,
  "improvementAreas": ["area1", "area2", ...]
}`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[Predict Unit By Data Error]:', error);
    throw error;
  }
}
