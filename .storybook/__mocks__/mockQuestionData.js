/**
 * Mock Question Data for Storybook - Question Editor & Semantic Search
 * 
 * Comprehensive mock Question records with media file references
 * and realistic embeddings for semantic search testing.
 */

import { generateMockEmbedding } from './mockEmbeddingUtils';

/**
 * Helper to create a mock Question record with automatic embedding generation
 */
export const createMockQuestion = ({
  id,
  prompt,
  answer,
  audioFile = null,
  imageFile = null,
  questionType = 'short-answer',
  difficulty = 'medium',
  tags = [],
  hints = [],
  explanation = '',
  owner = 'mock-user-sub',
  embedding = null,
  embeddingModel = 'text-embedding-3-small',
  embeddingDimensions = 1536,
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
  _version = 1,
  _deleted = false,
  _lastChangedAt = Date.now(),
}) => {
  // Auto-generate embedding if not provided
  // Combines prompt, answer, and explanation for semantic richness
  const embeddingText = `${prompt} ${answer}. ${explanation}`.trim();
  const generatedEmbedding = embedding || generateMockEmbedding(embeddingText, embeddingDimensions);
  
  return {
    id,
    prompt,
    answer,
    audioFile,
    imageFile,
    questionType,
    difficulty,
    tags: JSON.stringify(tags),
    hints: JSON.stringify(hints),
    explanation,
    owner,
    embedding: generatedEmbedding,
    embeddingModel,
    embeddingDimensions,
    createdAt,
    updatedAt,
    _version,
    _deleted,
    _lastChangedAt,
  };
};

// ==================== JAPANESE QUESTIONS ====================

export const MOCK_QUESTION_JAPANESE_GREETING = createMockQuestion({
  id: 'question-jp-1',
  prompt: 'How do you say "Hello" in Japanese?',
  answer: 'こんにちは (Konnichiwa)',
  audioFile: 'file-audio-japanese-1',
  questionType: 'short-answer',
  difficulty: 'easy',
  tags: ['japanese', 'greeting', 'beginner'],
  hints: ['It is used during the day', 'Pronounced: kon-nee-chee-wah'],
  explanation: 'こんにちは (Konnichiwa) is the standard greeting used during the day in Japanese.',
});

export const MOCK_QUESTION_JAPANESE_PHOTOSYNTHESIS = createMockQuestion({
  id: 'question-jp-2',
  prompt: '光合成とは何ですか？ (What is photosynthesis?)',
  answer: '植物が光エネルギーを化学エネルギーに変換する過程です。 (The process by which plants convert light energy into chemical energy.)',
  imageFile: 'file-image-diagram-1',
  audioFile: 'file-audio-listening-1',
  questionType: 'short-answer',
  difficulty: 'hard',
  tags: ['japanese', 'biology', 'science', 'advanced'],
  explanation: 'Photosynthesis is essential for plant life and oxygen production.',
});

export const MOCK_QUESTION_JAPANESE_TEACHER = createMockQuestion({
  id: 'question-jp-3',
  prompt: 'Fill in the blank: 田中___は英語の先生です。',
  answer: '先生 (sensei)',
  questionType: 'fill-in-blank',
  difficulty: 'easy',
  tags: ['japanese', 'grammar', 'titles'],
  hints: ['This word means "teacher"'],
  explanation: '先生 (sensei) is an honorific title used for teachers and professionals.',
});

// ==================== SPANISH QUESTIONS ====================

export const MOCK_QUESTION_SPANISH_CONJUGATION = createMockQuestion({
  id: 'question-es-1',
  prompt: 'Conjugate the verb "hablar" in the first person singular (yo) present tense.',
  answer: 'hablo',
  audioFile: 'file-audio-spanish-1',
  questionType: 'conjugation',
  difficulty: 'easy',
  tags: ['spanish', 'grammar', 'ar-verbs', 'conjugation'],
  hints: ['Remove -ar and add -o'],
  explanation: 'Regular -AR verbs in present tense use -o ending for "yo" form.',
});

export const MOCK_QUESTION_SPANISH_SEASONS = createMockQuestion({
  id: 'question-es-2',
  prompt: '¿Cuál es tu estación favorita? (What is your favorite season?)',
  answer: 'Mi estación favorita es la primavera. (My favorite season is spring.)',
  questionType: 'open-ended',
  difficulty: 'medium',
  tags: ['spanish', 'conversation', 'seasons'],
  hints: ['Use "Mi estación favorita es..."'],
  explanation: 'This is a conversational question to practice expressing preferences.',
});

export const MOCK_QUESTION_SPANISH_WALKING = createMockQuestion({
  id: 'question-es-3',
  prompt: 'Translate: "I walk in the park"',
  answer: 'Camino en el parque',
  questionType: 'translation',
  difficulty: 'medium',
  tags: ['spanish', 'translation', 'verbs'],
  hints: ['Use the verb "caminar"', 'First person singular present tense'],
  explanation: 'The verb "caminar" (to walk) conjugates to "camino" in present tense for "yo".',
});

// ==================== FRENCH QUESTIONS ====================

export const MOCK_QUESTION_FRENCH_SEASONS = createMockQuestion({
  id: 'question-fr-1',
  prompt: 'Nommez les quatre saisons en français. (Name the four seasons in French.)',
  answer: 'printemps, été, automne, hiver',
  audioFile: 'file-audio-french-1',
  questionType: 'listing',
  difficulty: 'medium',
  tags: ['french', 'vocabulary', 'seasons'],
  hints: ['Start with spring', 'All are masculine nouns'],
  explanation: 'The four seasons in French are all masculine nouns.',
});

export const MOCK_QUESTION_FRENCH_WINTER = createMockQuestion({
  id: 'question-fr-2',
  prompt: 'Complete the sentence: Il neige en ___.',
  answer: 'hiver',
  questionType: 'fill-in-blank',
  difficulty: 'easy',
  tags: ['french', 'seasons', 'weather'],
  hints: ['Which season has snow?'],
  explanation: '"Il neige" means "It snows" and typically happens in winter (hiver).',
});

// ==================== BIOLOGY QUESTIONS ====================

export const MOCK_QUESTION_BIOLOGY_CELL_DEFINITION = createMockQuestion({
  id: 'question-bio-1',
  prompt: 'What is the basic unit of life?',
  answer: 'The cell',
  imageFile: 'file-image-diagram-1',
  questionType: 'short-answer',
  difficulty: 'easy',
  tags: ['biology', 'cell', 'fundamental'],
  hints: ['All living organisms are made of these'],
  explanation: 'Cells are the smallest units that can carry out all life processes.',
});

export const MOCK_QUESTION_BIOLOGY_MITOCHONDRIA = createMockQuestion({
  id: 'question-bio-2',
  prompt: 'What organelle is known as the "powerhouse of the cell"?',
  answer: 'Mitochondria',
  imageFile: 'file-image-diagram-1',
  questionType: 'short-answer',
  difficulty: 'medium',
  tags: ['biology', 'cell', 'organelle'],
  hints: ['It produces ATP', 'Plural form ends in -a'],
  explanation: 'Mitochondria generate most of the cell\'s supply of ATP through cellular respiration.',
});

export const MOCK_QUESTION_BIOLOGY_PHOTOSYNTHESIS_EQUATION = createMockQuestion({
  id: 'question-bio-3',
  prompt: 'Write the simplified equation for photosynthesis.',
  answer: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂',
  imageFile: 'file-image-diagram-1',
  audioFile: 'file-audio-listening-1',
  questionType: 'equation',
  difficulty: 'hard',
  tags: ['biology', 'photosynthesis', 'chemistry'],
  hints: ['Inputs: carbon dioxide, water, light', 'Outputs: glucose, oxygen'],
  explanation: 'Plants use carbon dioxide and water with light energy to produce glucose and oxygen.',
});

export const MOCK_QUESTION_BIOLOGY_CHLOROPLAST = createMockQuestion({
  id: 'question-bio-4',
  prompt: 'Where does photosynthesis occur in plant cells?',
  answer: 'Chloroplasts',
  imageFile: 'file-image-diagram-1',
  questionType: 'short-answer',
  difficulty: 'medium',
  tags: ['biology', 'plant', 'organelle'],
  hints: ['Green organelles', 'Contains chlorophyll'],
  explanation: 'Chloroplasts contain chlorophyll and are the site of photosynthesis.',
});

export const MOCK_QUESTION_BIOLOGY_OSMOSIS = createMockQuestion({
  id: 'question-bio-5',
  prompt: 'Define osmosis.',
  answer: 'The movement of water molecules through a semipermeable membrane from an area of higher concentration to lower concentration.',
  questionType: 'definition',
  difficulty: 'hard',
  tags: ['biology', 'cell', 'transport'],
  hints: ['Type of diffusion', 'Involves water molecules', 'Semipermeable membrane'],
  explanation: 'Osmosis is a passive transport process that doesn\'t require energy.',
});

// ==================== PHILOSOPHY QUESTIONS ====================

export const MOCK_QUESTION_PHILOSOPHY_ARCHE = createMockQuestion({
  id: 'question-phil-1',
  prompt: 'According to Thales, what is the arche (fundamental principle) of all things?',
  answer: 'Water',
  imageFile: 'file-image-philosophy-1',
  questionType: 'short-answer',
  difficulty: 'hard',
  tags: ['philosophy', 'presocratic', 'thales'],
  hints: ['Thales was from Miletus', 'Essential liquid for life'],
  explanation: 'Thales proposed that water was the originating principle of all things.',
});

export const MOCK_QUESTION_PHILOSOPHY_LOGOS = createMockQuestion({
  id: 'question-phil-2',
  prompt: 'Which philosopher introduced the concept of "logos" as the rational principle of the cosmos?',
  answer: 'Heraclitus',
  questionType: 'short-answer',
  difficulty: 'hard',
  tags: ['philosophy', 'presocratic', 'heraclitus', 'concepts'],
  hints: ['Known for "you can\'t step in the same river twice"', 'From Ephesus'],
  explanation: 'Heraclitus believed the logos was the rational structure underlying all change.',
});

export const MOCK_QUESTION_PHILOSOPHY_NOUS = createMockQuestion({
  id: 'question-phil-3',
  prompt: 'What did Anaxagoras mean by "nous"?',
  answer: 'Mind or cosmic intelligence that organizes matter',
  questionType: 'short-answer',
  difficulty: 'hard',
  tags: ['philosophy', 'presocratic', 'anaxagoras'],
  hints: ['Greek word for mind/intellect', 'Organizing principle'],
  explanation: 'Anaxagoras introduced nous as the force that set the cosmos in motion and organized matter.',
});

// ==================== EARTH SCIENCE QUESTIONS ====================

export const MOCK_QUESTION_SCIENCE_WATER_CYCLE = createMockQuestion({
  id: 'question-sci-1',
  prompt: 'Name the three main stages of the water cycle.',
  answer: 'Evaporation, condensation, and precipitation',
  imageFile: 'file-image-water-cycle-1',
  questionType: 'listing',
  difficulty: 'medium',
  tags: ['science', 'water-cycle', 'earth-science'],
  hints: ['Starts with liquid to gas', 'Ends with water falling from sky'],
  explanation: 'The water cycle continuously moves water between Earth\'s surface and atmosphere.',
});

export const MOCK_QUESTION_SCIENCE_EVAPORATION = createMockQuestion({
  id: 'question-sci-2',
  prompt: 'What process turns liquid water into water vapor?',
  answer: 'Evaporation',
  imageFile: 'file-image-water-cycle-1',
  questionType: 'short-answer',
  difficulty: 'easy',
  tags: ['science', 'water-cycle'],
  hints: ['Requires heat energy', 'Liquid to gas'],
  explanation: 'Evaporation occurs when water molecules gain enough energy to change from liquid to gas.',
});

export const MOCK_QUESTION_SCIENCE_PRECIPITATION = createMockQuestion({
  id: 'question-sci-3',
  prompt: 'List four types of precipitation.',
  answer: 'Rain, snow, sleet, hail',
  questionType: 'listing',
  difficulty: 'medium',
  tags: ['science', 'weather', 'water-cycle'],
  hints: ['Different forms of water falling', 'Some are frozen'],
  explanation: 'Precipitation is any form of water that falls from the atmosphere to Earth\'s surface.',
});

// ==================== MULTIPLE CHOICE QUESTIONS ====================

export const MOCK_QUESTION_MC_PHOTOSYNTHESIS = createMockQuestion({
  id: 'question-mc-1',
  prompt: 'Which gas do plants absorb during photosynthesis?\nA) Oxygen\nB) Nitrogen\nC) Carbon dioxide\nD) Hydrogen',
  answer: 'C) Carbon dioxide',
  questionType: 'multiple-choice',
  difficulty: 'easy',
  tags: ['biology', 'photosynthesis', 'multiple-choice'],
  explanation: 'Plants absorb CO₂ from the atmosphere and release oxygen as a byproduct.',
});

export const MOCK_QUESTION_MC_CELL_STRUCTURE = createMockQuestion({
  id: 'question-mc-2',
  prompt: 'Which organelle controls cell activities?\nA) Mitochondria\nB) Nucleus\nC) Ribosome\nD) Chloroplast',
  answer: 'B) Nucleus',
  imageFile: 'file-image-diagram-1',
  questionType: 'multiple-choice',
  difficulty: 'easy',
  tags: ['biology', 'cell', 'multiple-choice'],
  explanation: 'The nucleus contains DNA and controls all cell activities.',
});

// ==================== DRAWING QUESTIONS ====================

export const MOCK_QUESTION_DRAWING_CELL = createMockQuestion({
  id: 'question-draw-1',
  prompt: 'Draw and label a plant cell showing: nucleus, cell wall, chloroplasts, and vacuole.',
  answer: '[Drawing expected]',
  imageFile: 'file-image-diagram-1',
  questionType: 'drawing',
  difficulty: 'hard',
  tags: ['biology', 'cell', 'plant', 'drawing'],
  hints: ['Plant cells have a rigid cell wall', 'Large central vacuole is distinctive'],
  explanation: 'Plant cells have unique structures including cell walls and chloroplasts.',
});

export const MOCK_QUESTION_DRAWING_WATER_CYCLE = createMockQuestion({
  id: 'question-draw-2',
  prompt: 'Draw a diagram of the water cycle, labeling all major processes.',
  answer: '[Drawing expected]',
  imageFile: 'file-image-water-cycle-1',
  questionType: 'drawing',
  difficulty: 'hard',
  tags: ['science', 'water-cycle', 'drawing'],
  hints: ['Show ocean, clouds, and land', 'Include arrows for movement'],
  explanation: 'A water cycle diagram should show evaporation, condensation, precipitation, and collection.',
});

// ==================== COLLECTIONS ====================

export const MOCK_QUESTIONS_JAPANESE = [
  MOCK_QUESTION_JAPANESE_GREETING,
  MOCK_QUESTION_JAPANESE_PHOTOSYNTHESIS,
  MOCK_QUESTION_JAPANESE_TEACHER,
];

export const MOCK_QUESTIONS_SPANISH = [
  MOCK_QUESTION_SPANISH_CONJUGATION,
  MOCK_QUESTION_SPANISH_SEASONS,
  MOCK_QUESTION_SPANISH_WALKING,
];

export const MOCK_QUESTIONS_FRENCH = [
  MOCK_QUESTION_FRENCH_SEASONS,
  MOCK_QUESTION_FRENCH_WINTER,
];

export const MOCK_QUESTIONS_BIOLOGY = [
  MOCK_QUESTION_BIOLOGY_CELL_DEFINITION,
  MOCK_QUESTION_BIOLOGY_MITOCHONDRIA,
  MOCK_QUESTION_BIOLOGY_PHOTOSYNTHESIS_EQUATION,
  MOCK_QUESTION_BIOLOGY_CHLOROPLAST,
  MOCK_QUESTION_BIOLOGY_OSMOSIS,
  MOCK_QUESTION_MC_PHOTOSYNTHESIS,
  MOCK_QUESTION_MC_CELL_STRUCTURE,
  MOCK_QUESTION_DRAWING_CELL,
];

export const MOCK_QUESTIONS_PHILOSOPHY = [
  MOCK_QUESTION_PHILOSOPHY_ARCHE,
  MOCK_QUESTION_PHILOSOPHY_LOGOS,
  MOCK_QUESTION_PHILOSOPHY_NOUS,
];

export const MOCK_QUESTIONS_SCIENCE = [
  MOCK_QUESTION_SCIENCE_WATER_CYCLE,
  MOCK_QUESTION_SCIENCE_EVAPORATION,
  MOCK_QUESTION_SCIENCE_PRECIPITATION,
  MOCK_QUESTION_DRAWING_WATER_CYCLE,
];

export const MOCK_QUESTIONS_ALL = [
  ...MOCK_QUESTIONS_JAPANESE,
  ...MOCK_QUESTIONS_SPANISH,
  ...MOCK_QUESTIONS_FRENCH,
  ...MOCK_QUESTIONS_BIOLOGY,
  ...MOCK_QUESTIONS_PHILOSOPHY,
  ...MOCK_QUESTIONS_SCIENCE,
];

// Helper function to seed questions into DataStore mock
export const seedMockQuestions = (additionalQuestions = []) => {
  return [...MOCK_QUESTIONS_ALL, ...additionalQuestions];
};

export default {
  // By language/subject
  JAPANESE: {
    GREETING: MOCK_QUESTION_JAPANESE_GREETING,
    PHOTOSYNTHESIS: MOCK_QUESTION_JAPANESE_PHOTOSYNTHESIS,
    TEACHER: MOCK_QUESTION_JAPANESE_TEACHER,
  },
  SPANISH: {
    CONJUGATION: MOCK_QUESTION_SPANISH_CONJUGATION,
    SEASONS: MOCK_QUESTION_SPANISH_SEASONS,
    WALKING: MOCK_QUESTION_SPANISH_WALKING,
  },
  FRENCH: {
    SEASONS: MOCK_QUESTION_FRENCH_SEASONS,
    WINTER: MOCK_QUESTION_FRENCH_WINTER,
  },
  BIOLOGY: {
    CELL: MOCK_QUESTION_BIOLOGY_CELL_DEFINITION,
    MITOCHONDRIA: MOCK_QUESTION_BIOLOGY_MITOCHONDRIA,
    PHOTOSYNTHESIS: MOCK_QUESTION_BIOLOGY_PHOTOSYNTHESIS_EQUATION,
    CHLOROPLAST: MOCK_QUESTION_BIOLOGY_CHLOROPLAST,
    OSMOSIS: MOCK_QUESTION_BIOLOGY_OSMOSIS,
  },
  PHILOSOPHY: {
    ARCHE: MOCK_QUESTION_PHILOSOPHY_ARCHE,
    LOGOS: MOCK_QUESTION_PHILOSOPHY_LOGOS,
    NOUS: MOCK_QUESTION_PHILOSOPHY_NOUS,
  },
  SCIENCE: {
    WATER_CYCLE: MOCK_QUESTION_SCIENCE_WATER_CYCLE,
    EVAPORATION: MOCK_QUESTION_SCIENCE_EVAPORATION,
    PRECIPITATION: MOCK_QUESTION_SCIENCE_PRECIPITATION,
  },
  // By type
  BY_TYPE: {
    MULTIPLE_CHOICE: [MOCK_QUESTION_MC_PHOTOSYNTHESIS, MOCK_QUESTION_MC_CELL_STRUCTURE],
    DRAWING: [MOCK_QUESTION_DRAWING_CELL, MOCK_QUESTION_DRAWING_WATER_CYCLE],
  },
  // Collections
  ALL: MOCK_QUESTIONS_ALL,
  BY_LANGUAGE: {
    JAPANESE: MOCK_QUESTIONS_JAPANESE,
    SPANISH: MOCK_QUESTIONS_SPANISH,
    FRENCH: MOCK_QUESTIONS_FRENCH,
  },
  BY_SUBJECT: {
    BIOLOGY: MOCK_QUESTIONS_BIOLOGY,
    PHILOSOPHY: MOCK_QUESTIONS_PHILOSOPHY,
    SCIENCE: MOCK_QUESTIONS_SCIENCE,
  },
  // Helpers
  seedMockQuestions,
  createMockQuestion,
};
