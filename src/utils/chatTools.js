/**
 * Chat Tool Definitions and Execution
 * Defines available tools for the AI chatbot to call
 */

import { getAmplifyClient } from './amplifyClient';
import { Unit, Section, Assignment, Word, Question, File as FileModel } from '../models';
import { generateEmbedding } from '../graphql/mutations';
import { generateClient } from 'aws-amplify/api';
import * as EmbeddingWorker from './embeddingWorkerManager';

const client = generateClient();

// Vector store instance - will be set from context
let vectorStoreSearchFunction = null;

/**
 * Set the vector store search function from context
 * Should be called when ChatSidebar mounts with access to VectorStoreContext
 */
export function setVectorStoreSearch(searchFn) {
  vectorStoreSearchFunction = searchFn;
  console.log('[chatTools] Vector store search function registered:', !!searchFn);
}

/**
 * Tool Definitions
 * These match the OpenAI function calling schema
 */
export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'search_content',
      description: 'Search through files, vocabulary words, and questions using semantic similarity. Returns the most relevant results based on the query.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query text'
          },
          type: {
            type: 'string',
            enum: ['all', 'files', 'words', 'questions'],
            description: 'Type of content to search. "all" searches everything.'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 10
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_section',
      description: 'Create a new class section (group of students)',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the section'
          },
          description: {
            type: 'string',
            description: 'Description of the section'
          },
          learner: {
            type: 'string',
            description: 'Learner group name or identifier'
          }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_unit',
      description: 'Create a new learning unit',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the unit'
          },
          description: {
            type: 'string',
            description: 'Description of the unit'
          },
          timeLimitSeconds: {
            type: 'number',
            description: 'Optional time limit in seconds for completing the unit'
          }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_assignment',
      description: 'Assign a unit to a section with a due date',
      parameters: {
        type: 'object',
        properties: {
          unitId: {
            type: 'string',
            description: 'ID of the unit to assign'
          },
          sectionId: {
            type: 'string',
            description: 'ID of the section to assign to'
          },
          dueDate: {
            type: 'string',
            description: 'Due date in ISO 8601 format (e.g., "2024-12-31T23:59:59Z")'
          },
          learner: {
            type: 'string',
            description: 'Learner identifier for the section'
          }
        },
        required: ['unitId', 'sectionId', 'dueDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_timer_to_unit',
      description: 'Add or update a timer (time limit) for a unit',
      parameters: {
        type: 'object',
        properties: {
          unitId: {
            type: 'string',
            description: 'ID of the unit'
          },
          seconds: {
            type: 'number',
            description: 'Time limit in seconds'
          }
        },
        required: ['unitId', 'seconds']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_vocabulary_word',
      description: 'Create a new vocabulary word in the dictionary',
      parameters: {
        type: 'object',
        properties: {
          phrase: {
            type: 'string',
            description: 'The word or phrase'
          },
          phonetic: {
            type: 'string',
            description: 'Phonetic spelling or pronunciation'
          },
          definition: {
            type: 'string',
            description: 'Definition of the word'
          },
          unitId: {
            type: 'string',
            description: 'Optional unit ID to associate with'
          }
        },
        required: ['phrase', 'definition']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_question',
      description: 'Create a new practice question',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The question prompt'
          },
          answer: {
            type: 'string',
            description: 'The correct answer'
          },
          unitId: {
            type: 'string',
            description: 'Optional unit ID to associate with'
          }
        },
        required: ['prompt', 'answer']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_sections',
      description: 'List all class sections',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_units',
      description: 'List all learning units',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of units to return'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_unit_details',
      description: 'Get detailed information about a specific unit',
      parameters: {
        type: 'object',
        properties: {
          unitId: {
            type: 'string',
            description: 'ID of the unit'
          }
        },
        required: ['unitId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_unit',
      description: 'Update properties of an existing unit',
      parameters: {
        type: 'object',
        properties: {
          unitId: {
            type: 'string',
            description: 'ID of the unit to update'
          },
          name: {
            type: 'string',
            description: 'New name for the unit'
          },
          description: {
            type: 'string',
            description: 'New description for the unit'
          },
          timeLimitSeconds: {
            type: 'number',
            description: 'New time limit in seconds'
          }
        },
        required: ['unitId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_assignment',
      description: 'Delete an assignment (unassign a unit from a section)',
      parameters: {
        type: 'object',
        properties: {
          assignmentId: {
            type: 'string',
            description: 'ID of the assignment to delete'
          }
        },
        required: ['assignmentId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_unit_content',
      description: 'Generate markdown content suggestions that can be inserted into the current unit. Creates educational content like explanations, examples, practice sections, etc.',
      parameters: {
        type: 'object',
        properties: {
          contentType: {
            type: 'string',
            enum: ['explanation', 'example', 'practice', 'quiz', 'summary', 'vocabulary_section', 'custom'],
            description: 'Type of content to generate'
          },
          topic: {
            type: 'string',
            description: 'Topic or subject for the content'
          },
          instructions: {
            type: 'string',
            description: 'Specific instructions or requirements for the content'
          },
          includeMarkdown: {
            type: 'boolean',
            description: 'Whether to include markdown formatting in the response',
            default: true
          }
        },
        required: ['contentType', 'topic']
      }
    }
  }
];

/**
 * Tool Execution Functions
 */

export async function executeSearchContent({ query, type = 'all', limit = 10 }) {
  try {
    console.log(`[executeSearchContent] Starting search: query="${query}", type="${type}", limit=${limit}`);
    
    // If vector store search is available, use it for files/documents
    if (vectorStoreSearchFunction && (type === 'all' || type === 'files')) {
      console.log('[executeSearchContent] Using vector store for semantic search');
      
      const vectorResults = await vectorStoreSearchFunction(query, {
        topK: limit,
        includeText: true
      });
      
      if (vectorResults.success && vectorResults.results.length > 0) {
        console.log(`[executeSearchContent] Vector store returned ${vectorResults.results.length} results`);
        
        // Map vector store results to search format
        const mappedResults = vectorResults.results.map(r => ({
          type: 'file',
          id: r.fileId || r.documentId,
          name: r.fileName || `Page ${r.page}`,
          description: r.text ? r.text.substring(0, 200) + '...' : '',
          similarity: r.similarity,
          page: r.page,
          documentId: r.documentId,
          metadata: r.metadata
        }));
        
        // If only searching files, return vector results
        if (type === 'files') {
          return {
            success: true,
            query,
            method: 'vector_store',
            results: mappedResults
          };
        }
        
        // For 'all', combine with word/question search
        const results = [...mappedResults];
        
        // Add word search
        const client = getAmplifyClient();
        const { data: words } = await client.models.Word.list();
        console.log(`[executeSearchContent] Found ${words.length} total words`);
        
        let keywordMatches = 0;
        words.forEach(word => {
          const text = `${word.phrase} ${word.pronunciation || ''} ${word.definition}`.toLowerCase();
          if (text.includes(query.toLowerCase())) {
            keywordMatches++;
            results.push({
              type: 'word',
              id: word.id,
              phrase: word.phrase,
              pronunciation: word.pronunciation,
              definition: word.definition,
              similarity: 0.7, // Keyword match score
            });
          }
        });
        console.log(`[executeSearchContent] Words keyword matches: ${keywordMatches}`);
        
        // Add question search
        const { data: questions } = await client.models.Question.list();
        console.log(`[executeSearchContent] Found ${questions.length} total questions`);
        
        keywordMatches = 0;
        questions.forEach(question => {
          const text = `${question.prompt} ${question.answer || ''}`.toLowerCase();
          if (text.includes(query.toLowerCase())) {
            keywordMatches++;
            results.push({
              type: 'question',
              id: question.id,
              prompt: question.prompt,
              answer: question.answer,
              similarity: 0.7,
            });
          }
        });
        console.log(`[executeSearchContent] Questions keyword matches: ${keywordMatches}`);
        
        // Sort by similarity and limit
        const topResults = results
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
        
        console.log(`[executeSearchContent] Returning ${topResults.length} combined results`);
        
        return {
          success: true,
          query,
          method: 'vector_store_hybrid',
          results: topResults
        };
      }
    }
    
    // Fallback to original DataStore embedding search
    console.log('[executeSearchContent] Using DataStore embedding search (fallback)');
    
    // Generate embedding for the query
    console.log('[executeSearchContent] Calling generateEmbedding mutation...');
    const response = await client.graphql({
      query: generateEmbedding,  // Use the imported mutation
      variables: {
        content: query,  // Changed from 'text' to 'content'
        model: 'text-embedding-3-small',
        dimensions: 512
      }
    });

    const queryEmbedding = response.data.generateEmbedding.embedding;
    console.log(`[executeSearchContent] Query embedding generated: ${queryEmbedding.length} dimensions`);
    
    const results = [];

    // Search Files
    if (type === 'all' || type === 'files') {
      console.log('[executeSearchContent] Searching files...');
      const client = getAmplifyClient();
      const { data: files } = await client.models.File.list();
      console.log(`[executeSearchContent] Found ${files.length} total files`);
      
      const filesWithEmbeddings = files.filter(f => f.embedding);
      console.log(`[executeSearchContent] Files with embeddings: ${filesWithEmbeddings.length}/${files.length}`);
      
      if (filesWithEmbeddings.length > 0) {
        const fileResults = await EmbeddingWorker.calculateSimilarities(
          queryEmbedding,
          filesWithEmbeddings,
          'file'
        );
        results.push(...fileResults);
        console.log(`[executeSearchContent] Calculated ${fileResults.length} file similarities`);
      }
    }
    
    // Search Words
    if (type === 'all' || type === 'words') {
      console.log('[executeSearchContent] Searching words...');
      const { data: words } = await client.models.Word.list();
      console.log(`[executeSearchContent] Found ${words.length} total words`);
      
      const wordsWithEmbeddings = words.filter(w => w.embedding);
      const wordsWithoutEmbeddings = words.filter(w => !w.embedding);
      
      // Calculate similarities for words with embeddings
      if (wordsWithEmbeddings.length > 0) {
        const wordResults = await EmbeddingWorker.calculateSimilarities(
          queryEmbedding,
          wordsWithEmbeddings,
          'word'
        );
        results.push(...wordResults);
      }
      
      // Keyword search for words without embeddings
      if (wordsWithoutEmbeddings.length > 0) {
        const keywordResults = await EmbeddingWorker.keywordSearch(
          query,
          wordsWithoutEmbeddings,
          'word'
        );
        results.push(...keywordResults);
      }
      
      console.log(`[executeSearchContent] Words with embeddings: ${wordsWithEmbeddings.length}/${words.length}, keyword matches: ${results.filter(r => r.type === 'word' && r.similarity === 0.7).length}`);
    }
    
    // Search Questions
    if (type === 'all' || type === 'questions') {
      console.log('[executeSearchContent] Searching questions...');
      const { data: questions } = await client.models.Question.list();
      console.log(`[executeSearchContent] Found ${questions.length} total questions`);
      
      const questionsWithEmbeddings = questions.filter(q => q.embedding);
      const questionsWithoutEmbeddings = questions.filter(q => !q.embedding);
      
      // Calculate similarities for questions with embeddings
      if (questionsWithEmbeddings.length > 0) {
        const questionResults = await EmbeddingWorker.calculateSimilarities(
          queryEmbedding,
          questionsWithEmbeddings,
          'question'
        );
        results.push(...questionResults);
      }
      
      // Keyword search for questions without embeddings
      if (questionsWithoutEmbeddings.length > 0) {
        const keywordResults = await EmbeddingWorker.keywordSearch(
          query,
          questionsWithoutEmbeddings,
          'question'
        );
        results.push(...keywordResults);
      }
      
      console.log(`[executeSearchContent] Questions with embeddings: ${questionsWithEmbeddings.length}/${questions.length}, keyword matches: ${results.filter(r => r.type === 'question' && r.similarity === 0.7).length}`);
    }

    // Sort by similarity and limit (using worker for large result sets)
    const topResults = results.length > 100
      ? await EmbeddingWorker.sortAndLimit(results, limit)
      : results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);

    console.log(`[executeSearchContent] Returning ${topResults.length} results (from ${results.length} total matches)`);
    topResults.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i+1}. ${r.type} - similarity: ${r.similarity.toFixed(4)}`);
    });

    return {
      success: true,
      query,
      results: topResults.map(r => ({
        type: r.type,
        id: r.id,
        similarity: r.similarity,
        ...(r.type === 'file' && { name: r.name, description: r.description, mimeType: r.mimeType }),
        ...(r.type === 'word' && { phrase: r.phrase, phonetic: r.phonetic, definition: r.definition }),
        ...(r.type === 'question' && { prompt: r.prompt, answer: r.answer })
      }))
    };
  } catch (error) {
    console.error('[executeSearchContent] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeCreateSection({ name, description, learner }) {
  try {
    const client = getAmplifyClient();
    const { data: newSection } = await client.models.Section.create({
      name,
      description: description || '',
      learner: learner || ''
    });

    return {
      success: true,
      section: {
        id: newSection.id,
        name: newSection.name,
        description: newSection.description,
        learner: newSection.learner
      }
    };
  } catch (error) {
    console.error('Create section error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeCreateUnit({ name, description, timeLimitSeconds }) {
  try {
    const client = getAmplifyClient();
    const { data: newUnit } = await client.models.Unit.create({
      name,
      description: description || '',
      timeLimitSeconds: timeLimitSeconds || null,
      data: JSON.stringify({ root: { children: [], direction: null, format: '', indent: 0, type: 'root', version: 1 } })
    });

    return {
      success: true,
      unit: {
        id: newUnit.id,
        name: newUnit.name,
        description: newUnit.description,
        timeLimitSeconds: newUnit.timeLimitSeconds
      }
    };
  } catch (error) {
    console.error('Create unit error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeCreateAssignment({ unitId, sectionId, dueDate, learner }) {
  try {
    const client = getAmplifyClient();
    // Validate unit and section exist
    const { data: unit } = await client.models.Unit.get({ id: unitId });
    const { data: section } = await client.models.Section.get({ id: sectionId });

    if (!unit) {
      return { success: false, error: 'Unit not found' };
    }
    if (!section) {
      return { success: false, error: 'Section not found' };
    }

    const { data: newAssignment } = await client.models.Assignment.create({
      unitID: unitId,
      sectionID: sectionId,
      dueDate,
      learner: learner || section.learner,
      status: 'PUBLISHED'
    });

    // Add learner to unit's dynamic group if not already present
    const learners = unit.learners || [];
    if (!learners.includes(section.learner)) {
      learners.push(section.learner);
      await client.models.Unit.update({
        id: unit.id,
        learners: learners
      });
    }

    return {
      success: true,
      assignment: {
        id: newAssignment.id,
        unitID: newAssignment.unitID,
        sectionID: newAssignment.sectionID,
        dueDate: newAssignment.dueDate,
        learner: newAssignment.learner
      }
    };
  } catch (error) {
    console.error('Create assignment error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeAddTimerToUnit({ unitId, seconds }) {
  try {
    const client = getAmplifyClient();
    const { data: unit } = await client.models.Unit.get({ id: unitId });
    if (!unit) {
      return { success: false, error: 'Unit not found' };
    }

    await client.models.Unit.update({
      id: unit.id,
      timeLimitSeconds: seconds
    });

    return {
      success: true,
      unitId,
      timeLimitSeconds: seconds
    };
  } catch (error) {
    console.error('Add timer error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeCreateVocabularyWord({ phrase, phonetic, definition, unitId }) {
  try {
    const client = getAmplifyClient();
    const { data: newWord } = await client.models.Word.create({
      phrase,
      phonetic: phonetic || '',
      definition,
      unitID: unitId || null
    });

    return {
      success: true,
      word: {
        id: newWord.id,
        phrase: newWord.phrase,
        phonetic: newWord.phonetic,
        definition: newWord.definition
      }
    };
  } catch (error) {
    console.error('Create word error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeCreateQuestion({ prompt, answer, unitId }) {
  try {
    const client = getAmplifyClient();
    const { data: newQuestion } = await client.models.Question.create({
      prompt,
      answer,
      unitID: unitId || null
    });

    return {
      success: true,
      question: {
        id: newQuestion.id,
        prompt: newQuestion.prompt,
        answer: newQuestion.answer
      }
    };
  } catch (error) {
    console.error('Create question error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeListSections() {
  try {
    const client = getAmplifyClient();
    const { data: sections } = await client.models.Section.list();
    
    return {
      success: true,
      count: sections.length,
      sections: sections.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        learner: s.learner,
        joinCode: s.joinCode
      }))
    };
  } catch (error) {
    console.error('List sections error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeListUnits({ limit }) {
  try {
    const client = getAmplifyClient();
    const { data: units } = await client.models.Unit.list();
    const result = limit ? units.slice(0, limit) : units;
    
    return {
      success: true,
      count: result.length,
      total: units.length,
      units: result.map(u => ({
        id: u.id,
        name: u.name,
        description: u.description,
        timeLimitSeconds: u.timeLimitSeconds,
        status: u.status
      }))
    };
  } catch (error) {
    console.error('List units error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeGetUnitDetails({ unitId }) {
  try {
    const client = getAmplifyClient();
    const { data: unit } = await client.models.Unit.get({ id: unitId });
    if (!unit) {
      return { success: false, error: 'Unit not found' };
    }

    // Get assignments for this unit
    const { data: assignments } = await client.models.Assignment.list({
      filter: { unitID: { eq: unitId } }
    });
    
    // Get associated words via UnitWord join table
    const { data: unitWords } = await client.models.UnitWord.list({
      filter: { unitID: { eq: unitId } }
    });
    
    // Get associated questions via QuestionUnit join table
    const { data: unitQuestions } = await client.models.QuestionUnit.list({
      filter: { unitID: { eq: unitId } }
    });

    return {
      success: true,
      unit: {
        id: unit.id,
        name: unit.name,
        description: unit.description,
        timeLimitSeconds: unit.timeLimitSeconds,
        status: unit.status,
        assignments: assignments.length,
        vocabularyCount: unitWords.length,
        questionCount: unitQuestions.length,
        learners: unit.learners || []
      }
    };
  } catch (error) {
    console.error('Get unit details error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeUpdateUnit({ unitId, name, description, timeLimitSeconds }) {
  try {
    const client = getAmplifyClient();
    const { data: unit } = await client.models.Unit.get({ id: unitId });
    if (!unit) {
      return { success: false, error: 'Unit not found' };
    }

    const updates = { id: unitId };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (timeLimitSeconds !== undefined) updates.timeLimitSeconds = timeLimitSeconds;
    
    await client.models.Unit.update(updates);

    return {
      success: true,
      unitId,
      updated: { name, description, timeLimitSeconds }
    };
  } catch (error) {
    console.error('Update unit error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeDeleteAssignment({ assignmentId }) {
  try {
    const client = getAmplifyClient();
    const { data: assignment } = await client.models.Assignment.get({ id: assignmentId });
    if (!assignment) {
      return { success: false, error: 'Assignment not found' };
    }

    await client.models.Assignment.delete({ id: assignmentId });

    return {
      success: true,
      assignmentId,
      deleted: true
    };
  } catch (error) {
    console.error('Delete assignment error:', error);
    return { success: false, error: error.message };
  }
}

export async function executeGenerateUnitContent({ contentType, topic, instructions, includeMarkdown = true }) {
  try {
    // This tool returns a structured response that guides GPT-4 to generate content
    // The actual content generation happens via GPT-4's response, not here
    
    let template = '';
    let guidance = '';
    
    switch (contentType) {
      case 'explanation':
        guidance = `Generate a clear, educational explanation about "${topic}". ${instructions || 'Include relevant details and context.'}`;
        template = includeMarkdown ? `
## ${topic}

[Your explanation here]

### Key Points
- Point 1
- Point 2
- Point 3
` : `${topic}\n\n[Your explanation here]\n\nKey Points:\n- Point 1\n- Point 2`;
        break;
        
      case 'example':
        guidance = `Generate practical examples demonstrating "${topic}". ${instructions || 'Include 2-3 clear examples with explanations.'}`;
        template = includeMarkdown ? `
### Examples: ${topic}

**Example 1:**
[Example text]
- Explanation: [Details]

**Example 2:**
[Example text]
- Explanation: [Details]
` : `Examples: ${topic}\n\nExample 1: [text]\nExplanation: [details]`;
        break;
        
      case 'practice':
        guidance = `Generate practice exercises for "${topic}". ${instructions || 'Include 3-5 practice problems or activities.'}`;
        template = includeMarkdown ? `
### Practice: ${topic}

1. [Exercise 1]
   - Answer: [Answer]

2. [Exercise 2]
   - Answer: [Answer]

3. [Exercise 3]
   - Answer: [Answer]
` : `Practice: ${topic}\n\n1. [Exercise 1]\n2. [Exercise 2]`;
        break;
        
      case 'quiz':
        guidance = `Generate quiz questions about "${topic}". ${instructions || 'Create 4-5 multiple choice or short answer questions.'}`;
        template = includeMarkdown ? `
### Quiz: ${topic}

**Question 1:** [Question text]
- A) [Option]
- B) [Option]
- C) [Option]
- D) [Option]
- **Answer:** [Correct answer]

**Question 2:** [Question text]
- **Answer:** [Answer]
` : `Quiz: ${topic}\n\nQ1: [Question]\nAnswer: [Answer]`;
        break;
        
      case 'summary':
        guidance = `Generate a concise summary of "${topic}". ${instructions || 'Highlight the main points in a clear, organized way.'}`;
        template = includeMarkdown ? `
## Summary: ${topic}

[Summary paragraph]

### Main Takeaways
1. [Point 1]
2. [Point 2]
3. [Point 3]
` : `Summary: ${topic}\n\n[Summary]\n\nMain points:\n1. [Point 1]`;
        break;
        
      case 'vocabulary_section':
        guidance = `Generate a vocabulary section for "${topic}". ${instructions || 'Include 5-10 relevant terms with definitions.'}`;
        template = includeMarkdown ? `
### Vocabulary: ${topic}

| Term | Reading | Meaning |
|------|---------|---------|
| [Term] | [Reading] | [Definition] |
| [Term] | [Reading] | [Definition] |
` : `Vocabulary: ${topic}\n\n[Term] - [Reading] - [Definition]`;
        break;
        
      case 'custom':
        guidance = `Generate custom content about "${topic}". ${instructions || 'Create appropriate educational content.'}`;
        template = includeMarkdown ? `## ${topic}\n\n[Your content here]` : `${topic}\n\n[Content]`;
        break;
        
      default:
        guidance = `Generate content about "${topic}". ${instructions || ''}`;
        template = includeMarkdown ? `## ${topic}\n\n[Content]` : topic;
    }
    
    return {
      success: true,
      contentType,
      topic,
      guidance,
      template,
      includeMarkdown,
      message: `Ready to generate ${contentType} content about "${topic}". Use the template as a guide.`
    };
  } catch (error) {
    console.error('Generate unit content error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a tool call
 * @param {string} toolName - Name of the tool to execute
 * @param {object} args - Arguments for the tool
 * @returns {Promise<object>} Result of the tool execution
 */
export async function executeTool(toolName, args) {
  const toolMap = {
    search_content: executeSearchContent,
    create_section: executeCreateSection,
    create_unit: executeCreateUnit,
    create_assignment: executeCreateAssignment,
    add_timer_to_unit: executeAddTimerToUnit,
    create_vocabulary_word: executeCreateVocabularyWord,
    create_question: executeCreateQuestion,
    list_sections: executeListSections,
    list_units: executeListUnits,
    get_unit_details: executeGetUnitDetails,
    update_unit: executeUpdateUnit,
    delete_assignment: executeDeleteAssignment,
    generate_unit_content: executeGenerateUnitContent
  };

  const executor = toolMap[toolName];
  if (!executor) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  try {
    return await executor(args);
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return { success: false, error: error.message };
  }
}
