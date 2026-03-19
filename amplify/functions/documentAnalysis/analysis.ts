/**
 * OpenAI-powered document analysis
 */

/**
 * Analyze a batch of pages with GPT-4o
 * Extracts vocabulary, summaries, objectives, concepts, and questions
 */
export async function analyzePages(
  openai: any,
  pages: Array<{ pageNumber: number; text: string }>,
  fileID: string,
  documentID: string
): Promise<{
  vocabularyJSON: any[];
  summariesJSON: any[];
  objectivesJSON: any[];
  conceptsJSON: any[];
  questionsJSON: any[];
}> {
  const PAGES_PER_BATCH = 10; // Analyze 10 pages at a time
  const MAX_PARALLEL_BATCHES = 5; // Process up to 5 batches in parallel
  
  const allVocabulary: any[] = [];
  const allSummaries: any[] = [];
  const allObjectives: any[] = [];
  const allConcepts: any[] = [];
  const allQuestions: any[] = [];
  
  // Create all batch analysis tasks
  const batchTasks = [];
  for (let i = 0; i < pages.length; i += PAGES_PER_BATCH) {
    const batch = pages.slice(i, i + PAGES_PER_BATCH);
    const pageNumbers = batch.map(p => p.pageNumber).join(', ');
    const batchText = batch.map(p => `[Page ${p.pageNumber}]\n${p.text}`).join('\n\n');
    
    // Create a promise for each batch analysis
    batchTasks.push(
      (async () => {
        console.log(`[analyzePages] Analyzing pages ${pageNumbers} (${batchText.length} characters)...`);
        
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Extract vocabulary, summaries, objectives, concepts, and generate questions from educational text. Return JSON: {
  vocabularyJSON: [{word, definition, context, page}],
  summariesJSON: [{title, content, page_range}],
  objectivesJSON: [{objective, bloom_level}],
  conceptsJSON: [{concept, description, related_vocabulary}],
  questionsJSON: [{prompt, answer, hint, difficulty, questionType}]
}

For questionsJSON, generate 2-3 custom answer questions per batch that test comprehension. Questions should be open-ended, requiring thoughtful responses. Include:
- prompt: The question text
- answer: A sample correct answer (200-300 words)
- hint: A helpful hint for students (optional)
- difficulty: "easy", "medium", or "hard"
- questionType: "short_answer", "essay", or "comprehension"

Include the page number in all extracted items.`,
              },
              { role: 'user', content: `Extract from:\n\n${batchText}` }
            ],
            response_format: { type: 'json_object' },
            metadata: {
              fileId: fileID,
              documentId: documentID,
              pages: pageNumbers,
            },
          });
          
          const batchContent = JSON.parse(completion.choices[0]?.message?.content || '{}');
          
          console.log(`[analyzePages] Batch ${pageNumbers} complete:`, {
            vocabulary: batchContent.vocabularyJSON?.length || 0,
            summaries: batchContent.summariesJSON?.length || 0,
            objectives: batchContent.objectivesJSON?.length || 0,
            concepts: batchContent.conceptsJSON?.length || 0,
            questions: batchContent.questionsJSON?.length || 0,
            tokens: completion.usage?.total_tokens,
          });
          
          return { success: true, pageNumbers, batchContent };
        } catch (error) {
          console.error(`[analyzePages] Error analyzing pages ${pageNumbers}:`, error);
          return { success: false, pageNumbers, error: (error as Error).message };
        }
      })()
    );
  }
  
  // Process batches in parallel groups
  console.log(`[analyzePages] Processing ${batchTasks.length} batches in parallel (max ${MAX_PARALLEL_BATCHES} concurrent)...`);
  
  for (let i = 0; i < batchTasks.length; i += MAX_PARALLEL_BATCHES) {
    const parallelGroup = batchTasks.slice(i, i + MAX_PARALLEL_BATCHES);
    const results = await Promise.allSettled(parallelGroup);
    
    // Aggregate successful results
    results.forEach(result => {
      if (result.status === 'fulfilled' && (result.value as any).success) {
        const { batchContent } = result.value as any;
        if (batchContent.vocabularyJSON) allVocabulary.push(...batchContent.vocabularyJSON);
        if (batchContent.summariesJSON) allSummaries.push(...batchContent.summariesJSON);
        if (batchContent.objectivesJSON) allObjectives.push(...batchContent.objectivesJSON);
        if (batchContent.conceptsJSON) allConcepts.push(...batchContent.conceptsJSON);
        if (batchContent.questionsJSON) allQuestions.push(...batchContent.questionsJSON);
      }
    });
    
    console.log(`[analyzePages] Completed parallel group ${Math.floor(i / MAX_PARALLEL_BATCHES) + 1} of ${Math.ceil(batchTasks.length / MAX_PARALLEL_BATCHES)}`);
  }
  
  return {
    vocabularyJSON: allVocabulary,
    summariesJSON: allSummaries,
    objectivesJSON: allObjectives,
    conceptsJSON: allConcepts,
    questionsJSON: allQuestions,
  };
}
