/**
 * Mock responses for suggest-blocks REST API endpoint
 * 
 * These mocks simulate AI-powered pedagogical block suggestions for the
 * BlockSuggestionPlugin. Each mock represents different lesson structures
 * and pedagogical scenarios.
 * 
 * Format: Plain JSON objects matching the Lambda function response structure
 */

/**
 * Suggestions after a heading (cold start)
 * Use case: User just created a new section heading
 */
export const afterHeading = {
  suggestions: [
    {
      type: 'paragraph',
      label: 'Add Explanation',
      icon: '📝',
      reasoning: 'Starting with an explanation establishes the foundational concepts before introducing practice. This follows the scaffolding principle of building from simple exposition to complex application.',
      priority: 'high'
    },
    {
      type: 'answer',
      label: 'Start with Vocabulary Practice',
      icon: '✍️',
      reasoning: 'Beginning with vocabulary practice can work for review sections, but ensure students have prior knowledge of these terms.',
      priority: 'low'
    }
  ],
  overallAssessment: 'New section detected. Start with clear explanation to establish foundation.'
};

/**
 * Suggestions after a single explanation
 * Use case: User has written one explanatory paragraph
 */
export const afterExplanation = {
  suggestions: [
    {
      type: 'answer',
      label: 'Add Vocabulary Practice',
      icon: '✍️',
      reasoning: 'After presenting concepts, learners benefit from immediate active practice. Vocabulary exercises provide low-stakes opportunities to apply new knowledge and reinforce retention through retrieval practice.',
      priority: 'high'
    },
    {
      type: 'custom-answer',
      label: 'Add Custom Practice',
      icon: '📋',
      reasoning: 'Custom exercises allow you to target specific aspects of the concept you just explained, providing tailored practice opportunities.',
      priority: 'medium'
    },
    {
      type: 'quiz',
      label: 'Add Comprehension Quiz',
      icon: '📊',
      reasoning: 'A quiz can check understanding, but consider adding examples or practice first to build confidence before formal assessment.',
      priority: 'medium'
    }
  ],
  overallAssessment: 'Good explanatory content. Now add active learning opportunities to reinforce concepts.'
};

/**
 * Suggestions after multiple explanations (cognitive overload warning)
 * Use case: User has 3+ explanations without practice
 */
export const afterMultipleExplanations = {
  suggestions: [
    {
      type: 'answer',
      label: 'Add Vocabulary Practice NOW',
      icon: '✍️',
      reasoning: 'After three explanations without practice, students risk cognitive overload and passive learning. Active practice is urgently needed to consolidate information and prevent the illusion of understanding.',
      priority: 'high'
    },
    {
      type: 'quiz',
      label: 'Add Knowledge Check',
      icon: '📊',
      reasoning: 'A quiz provides formative assessment to identify which explanations were effective and which concepts need reinforcement.',
      priority: 'high'
    },
    {
      type: 'custom-answer',
      label: 'Add Application Exercise',
      icon: '📋',
      reasoning: 'Custom exercises can combine multiple concepts from your explanations, helping students integrate their learning.',
      priority: 'medium'
    }
  ],
  overallAssessment: 'Warning: High ratio of explanation to practice. Students need opportunities to actively engage with material to avoid passive learning and cognitive overload.'
};

/**
 * Suggestions after a quiz
 * Use case: User completed an assessment block
 */
export const afterQuiz = {
  suggestions: [
    {
      type: 'paragraph',
      label: 'Add Summary',
      icon: '📝',
      reasoning: 'After assessment, a summary helps consolidate learning and provides closure. This reflection phase reinforces key takeaways and connects concepts.',
      priority: 'medium'
    },
    {
      type: 'heading',
      label: 'Start New Topic',
      icon: '📑',
      reasoning: 'If the current topic is complete, starting a new section maintains lesson momentum and clear organization.',
      priority: 'medium'
    },
    {
      type: 'custom-answer',
      label: 'Add Follow-up Practice',
      icon: '📋',
      reasoning: 'Additional practice can address any gaps identified in the quiz, providing targeted reinforcement.',
      priority: 'low'
    }
  ],
  overallAssessment: 'Assessment completed. Consider summarizing key points or moving to the next topic.'
};

/**
 * Suggestions after practice exercises
 * Use case: User has added vocabulary/custom practice
 */
export const afterPractice = {
  suggestions: [
    {
      type: 'quiz',
      label: 'Add Assessment Quiz',
      icon: '📊',
      reasoning: 'After practice, a quiz provides formative assessment to verify understanding and identify areas needing reinforcement. This follows the practice-assessment cycle for effective learning.',
      priority: 'medium'
    },
    {
      type: 'custom-answer',
      label: 'Add More Practice',
      icon: '📋',
      reasoning: 'Additional practice with varied examples deepens understanding through spaced repetition and different contexts.',
      priority: 'medium'
    },
    {
      type: 'paragraph',
      label: 'Add Advanced Explanation',
      icon: '📝',
      reasoning: 'Building on practice, you can introduce more nuanced concepts that extend learning.',
      priority: 'low'
    }
  ],
  overallAssessment: 'Good balance of explanation and practice. Consider adding assessment to check understanding.'
};

/**
 * Suggestions for empty lesson (cold start)
 * Use case: Brand new lesson with no content
 */
export const emptyLesson = {
  suggestions: [
    {
      type: 'heading',
      label: 'Add Section Heading',
      icon: '📑',
      reasoning: 'Starting with a clear heading provides structure and sets learning objectives. This helps students understand what they will learn and organizes content logically.',
      priority: 'high'
    },
    {
      type: 'paragraph',
      label: 'Add Introduction',
      icon: '📝',
      reasoning: 'An introductory explanation establishes context and activates prior knowledge, preparing students for new concepts.',
      priority: 'high'
    }
  ],
  overallAssessment: 'Empty lesson detected. Start with a heading or introduction to establish structure and context.'
};

/**
 * Suggestions for complex mixed lesson
 * Use case: Lesson with varied block types, nuanced suggestions
 */
export const complexLesson = {
  suggestions: [
    {
      type: 'paragraph',
      label: 'Add Connecting Explanation',
      icon: '📝',
      reasoning: 'Your lesson covers multiple subtopics. A connecting explanation can synthesize these concepts and show relationships, promoting deeper understanding and integration.',
      priority: 'high'
    },
    {
      type: 'quiz',
      label: 'Add Cumulative Assessment',
      icon: '📊',
      reasoning: 'A comprehensive quiz spanning all covered concepts checks integration of learning across topics and identifies gaps in understanding.',
      priority: 'medium'
    },
    {
      type: 'custom-answer',
      label: 'Add Multi-Concept Practice',
      icon: '📋',
      reasoning: 'Practice that combines elements from different sections reinforces connections and promotes transfer of learning.',
      priority: 'medium'
    }
  ],
  overallAssessment: 'Well-structured lesson with good variety. Consider adding synthesis activities to integrate the multiple concepts covered.'
};

/**
 * Single suggestion only
 * Use case: Test minimal UI with one option
 */
export const singleSuggestion = {
  suggestions: [
    {
      type: 'quiz',
      label: 'Add Quiz',
      icon: '📊',
      reasoning: 'Time to assess understanding.',
      priority: 'high'
    }
  ],
  overallAssessment: 'Ready for assessment.'
};

/**
 * Four suggestions (maximum)
 * Use case: Test full menu with all slots filled
 */
export const fourSuggestions = {
  suggestions: [
    {
      type: 'answer',
      label: 'Add Vocabulary Practice',
      icon: '✍️',
      reasoning: 'Vocabulary practice provides immediate application of new terms and reinforces retention through active recall.',
      priority: 'high'
    },
    {
      type: 'custom-answer',
      label: 'Add Custom Exercise',
      icon: '📋',
      reasoning: 'Custom exercises allow targeted practice on specific aspects you want to emphasize.',
      priority: 'medium'
    },
    {
      type: 'quiz',
      label: 'Add Quiz',
      icon: '📊',
      reasoning: 'A quiz provides formative assessment to gauge understanding.',
      priority: 'medium'
    },
    {
      type: 'paragraph',
      label: 'Add More Explanation',
      icon: '📝',
      reasoning: 'Additional explanation can introduce nuances or edge cases.',
      priority: 'low'
    }
  ],
  overallAssessment: 'Multiple good options available depending on your learning objectives.'
};

/**
 * No high priority suggestions
 * Use case: Test priority badge display with only MEDIUM/LOW
 */
export const noHighPriority = {
  suggestions: [
    {
      type: 'paragraph',
      label: 'Add Detail',
      icon: '📝',
      reasoning: 'Additional details can enrich understanding but are not essential at this point.',
      priority: 'medium'
    },
    {
      type: 'custom-answer',
      label: 'Add Optional Practice',
      icon: '📋',
      reasoning: 'Extra practice is always beneficial but not urgent given the current lesson structure.',
      priority: 'low'
    }
  ],
  overallAssessment: 'Lesson structure is solid. These suggestions are optional enhancements.'
};

/**
 * All high priority suggestions (urgent)
 * Use case: Test urgency UI when everything is HIGH priority
 */
export const allHighPriority = {
  suggestions: [
    {
      type: 'answer',
      label: 'Add Practice URGENTLY',
      icon: '✍️',
      reasoning: 'Critical gap: No active learning opportunities. Students are passively receiving information without engagement.',
      priority: 'high'
    },
    {
      type: 'quiz',
      label: 'Add Assessment',
      icon: '📊',
      reasoning: 'Essential: Need to verify understanding before proceeding further.',
      priority: 'high'
    }
  ],
  overallAssessment: 'Critical: Lesson lacks essential elements for effective learning. Address these gaps immediately.'
};

/**
 * Long reasoning text (100+ words)
 * Use case: Test text overflow and wrapping
 */
export const longReasoning = {
  suggestions: [
    {
      type: 'quiz',
      label: 'Add Comprehensive Assessment',
      icon: '📊',
      reasoning: 'At this point in the lesson, students have been exposed to multiple interconnected concepts including foundational vocabulary, grammatical structures, and cultural context. A comprehensive assessment serves multiple pedagogical purposes: first, it provides formative feedback to both students and instructor about learning progress; second, it identifies specific areas where additional instruction may be needed; third, it promotes active retrieval practice which strengthens memory consolidation; and fourth, it helps students develop metacognitive awareness of their own understanding. The assessment should be designed to check not just surface-level recall but also deeper understanding of how concepts relate to each other.',
      priority: 'high'
    }
  ],
  overallAssessment: 'Detailed analysis suggests comprehensive assessment is needed.'
};

/**
 * Short/terse reasoning (10 words or less)
 * Use case: Test minimal content UI
 */
export const shortReasoning = {
  suggestions: [
    {
      type: 'quiz',
      label: 'Add Quiz',
      icon: '📊',
      reasoning: 'Students need assessment now.',
      priority: 'high'
    },
    {
      type: 'answer',
      label: 'Add Practice',
      icon: '✍️',
      reasoning: 'Practice reinforces concepts.',
      priority: 'medium'
    }
  ],
  overallAssessment: 'Add active learning.'
};

/**
 * Error response - simulates API error
 * Use case: Test error handling
 */
export const error = {
  error: 'Failed to generate block suggestions: OpenAI API error'
};

/**
 * Malformed JSON response
 * Use case: Test parsing error handling
 */
export const malformedJSON = {
  suggestions: 'This is not valid JSON {suggestions: incomplete',
  overallAssessment: 'malformed'
};

// Export all mocks
export default {
  afterHeading,
  afterExplanation,
  afterMultipleExplanations,
  afterQuiz,
  afterPractice,
  emptyLesson,
  complexLesson,
  singleSuggestion,
  fourSuggestions,
  noHighPriority,
  allHighPriority,
  longReasoning,
  shortReasoning,
  error,
  malformedJSON,
};
