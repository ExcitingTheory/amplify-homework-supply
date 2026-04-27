/**
 * Mock Word Data for Storybook - Dictionary Editor & Semantic Search
 * 
 * Comprehensive mock Word (vocabulary) records with audio file references
 * and realistic embeddings for semantic search testing.
 */

import { generateMockEmbedding } from './mockEmbeddingUtils';

/**
 * Helper to create a mock Word record with automatic embedding generation
 */
export const createMockWord = ({
  id,
  word,
  phonetic = '',
  definition,
  audioFile = null,
  imageFile = null,
  example = '',
  notes = '',
  tags = [],
  difficulty = 'medium',
  partOfSpeech = '',
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
  // Combines word, phonetic, definition, and example for semantic richness
  const embeddingText = `${word} ${phonetic} - ${definition}. ${example}`.trim();
  const generatedEmbedding = embedding || generateMockEmbedding(embeddingText, embeddingDimensions);
  
  return {
    id,
    word,
    phonetic,
    definition,
    audioFile,
    imageFile,
    example,
    notes,
    tags: JSON.stringify(tags),
    difficulty,
    partOfSpeech,
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

// ==================== JAPANESE VOCABULARY ====================

export const MOCK_WORD_JAPANESE_KONNICHIWA = createMockWord({
  id: 'word-jp-1',
  word: 'こんにちは',
  phonetic: 'konnichiwa',
  definition: 'Hello; Good afternoon (greeting)',
  audioFile: 'file-audio-japanese-1', // References mock file
  example: 'こんにちは、元気ですか？ (Hello, how are you?)',
  tags: ['greeting', 'common', 'beginner'],
  difficulty: 'easy',
  partOfSpeech: 'interjection',
});

export const MOCK_WORD_JAPANESE_SENSEI = createMockWord({
  id: 'word-jp-2',
  word: '先生',
  phonetic: 'sensei',
  definition: 'Teacher; master; doctor',
  example: '田中先生は英語の先生です。 (Tanaka-sensei is an English teacher.)',
  tags: ['people', 'profession', 'common'],
  difficulty: 'easy',
  partOfSpeech: 'noun',
});

export const MOCK_WORD_JAPANESE_YOUKOSO = createMockWord({
  id: 'word-jp-3',
  word: 'ようこそ',
  phonetic: 'youkoso',
  definition: 'Welcome',
  audioFile: 'file-audio-japanese-1',
  example: '日本へようこそ！ (Welcome to Japan!)',
  tags: ['greeting', 'polite'],
  difficulty: 'easy',
  partOfSpeech: 'interjection',
});

export const MOCK_WORD_JAPANESE_KOURYOKU = createMockWord({
  id: 'word-jp-4',
  word: '光合成',
  phonetic: 'kōgōsei',
  definition: 'Photosynthesis',
  imageFile: 'file-image-diagram-1',
  example: '植物は光合成によってエネルギーを作ります。 (Plants create energy through photosynthesis.)',
  tags: ['biology', 'science', 'technical'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
  notes: 'Scientific term used in biology',
});

export const MOCK_WORD_JAPANESE_YOROKOBIBU = createMockWord({
  id: 'word-jp-5',
  word: '葉緑体',
  phonetic: 'yōryokutai',
  definition: 'Chloroplast',
  example: '葉緑体は光合成を行う。 (Chloroplasts perform photosynthesis.)',
  tags: ['biology', 'science', 'cell'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
});

// ==================== SPANISH VOCABULARY ====================

export const MOCK_WORD_SPANISH_HABLAR = createMockWord({
  id: 'word-es-1',
  word: 'hablar',
  phonetic: 'a·ˈblar',
  definition: 'To speak; to talk',
  audioFile: 'file-audio-spanish-1',
  example: 'Yo hablo español. (I speak Spanish.)',
  tags: ['verb', 'ar-verb', 'common', 'beginner'],
  difficulty: 'easy',
  partOfSpeech: 'verb',
  notes: 'Regular -AR verb',
});

export const MOCK_WORD_SPANISH_CAMINAR = createMockWord({
  id: 'word-es-2',
  word: 'caminar',
  phonetic: 'ka·mi·ˈnar',
  definition: 'To walk',
  example: 'Me gusta caminar en el parque. (I like to walk in the park.)',
  tags: ['verb', 'ar-verb', 'movement'],
  difficulty: 'easy',
  partOfSpeech: 'verb',
  notes: 'Regular -AR verb',
});

export const MOCK_WORD_SPANISH_ESTUDIAR = createMockWord({
  id: 'word-es-3',
  word: 'estudiar',
  phonetic: 'es·tu·ˈdjar',
  definition: 'To study',
  audioFile: 'file-audio-spanish-1',
  example: 'Necesito estudiar para el examen. (I need to study for the exam.)',
  tags: ['verb', 'ar-verb', 'education'],
  difficulty: 'easy',
  partOfSpeech: 'verb',
});

export const MOCK_WORD_SPANISH_PRIMAVERA = createMockWord({
  id: 'word-es-4',
  word: 'primavera',
  phonetic: 'pri·ma·ˈve·ra',
  definition: 'Spring (season)',
  example: 'La primavera es mi estación favorita. (Spring is my favorite season.)',
  tags: ['season', 'nature', 'noun'],
  difficulty: 'medium',
  partOfSpeech: 'noun',
});

export const MOCK_WORD_SPANISH_VERANO = createMockWord({
  id: 'word-es-5',
  word: 'verano',
  phonetic: 've·ˈra·no',
  definition: 'Summer',
  example: 'En verano hace mucho calor. (In summer it is very hot.)',
  tags: ['season', 'nature', 'noun'],
  difficulty: 'medium',
  partOfSpeech: 'noun',
});

// ==================== FRENCH VOCABULARY ====================

export const MOCK_WORD_FRENCH_PRINTEMPS = createMockWord({
  id: 'word-fr-1',
  word: 'printemps',
  phonetic: 'pʁɛ̃tɑ̃',
  definition: 'Spring (season)',
  audioFile: 'file-audio-french-1',
  example: 'Le printemps arrive en mars. (Spring arrives in March.)',
  tags: ['season', 'nature', 'beginner'],
  difficulty: 'medium',
  partOfSpeech: 'noun (masculine)',
});

export const MOCK_WORD_FRENCH_ETE = createMockWord({
  id: 'word-fr-2',
  word: 'été',
  phonetic: 'e.te',
  definition: 'Summer',
  example: 'J\'aime l\'été. (I love summer.)',
  tags: ['season', 'nature'],
  difficulty: 'easy',
  partOfSpeech: 'noun (masculine)',
});

export const MOCK_WORD_FRENCH_AUTOMNE = createMockWord({
  id: 'word-fr-3',
  word: 'automne',
  phonetic: 'o.tɔn',
  definition: 'Autumn; Fall',
  audioFile: 'file-audio-french-1',
  example: 'Les feuilles tombent en automne. (The leaves fall in autumn.)',
  tags: ['season', 'nature'],
  difficulty: 'medium',
  partOfSpeech: 'noun (masculine)',
});

export const MOCK_WORD_FRENCH_HIVER = createMockWord({
  id: 'word-fr-4',
  word: 'hiver',
  phonetic: 'i.vɛʁ',
  definition: 'Winter',
  example: 'Il neige en hiver. (It snows in winter.)',
  tags: ['season', 'nature'],
  difficulty: 'easy',
  partOfSpeech: 'noun (masculine)',
});

// ==================== BIOLOGY VOCABULARY ====================

export const MOCK_WORD_BIOLOGY_CELL = createMockWord({
  id: 'word-bio-1',
  word: 'cell',
  phonetic: 'sel',
  definition: 'The basic structural and functional unit of all living organisms',
  imageFile: 'file-image-diagram-1',
  example: 'The human body contains trillions of cells.',
  tags: ['biology', 'structure', 'fundamental'],
  difficulty: 'easy',
  partOfSpeech: 'noun',
});

export const MOCK_WORD_BIOLOGY_MITOCHONDRIA = createMockWord({
  id: 'word-bio-2',
  word: 'mitochondria',
  phonetic: 'ˌmaɪtəˈkɒndrɪə',
  definition: 'Organelles that generate most of the cell\'s energy (ATP)',
  imageFile: 'file-image-diagram-1',
  example: 'Mitochondria are known as the powerhouse of the cell.',
  tags: ['biology', 'organelle', 'energy'],
  difficulty: 'medium',
  partOfSpeech: 'noun (plural)',
  notes: 'Singular: mitochondrion',
});

export const MOCK_WORD_BIOLOGY_PHOTOSYNTHESIS = createMockWord({
  id: 'word-bio-3',
  word: 'photosynthesis',
  phonetic: 'ˌfoʊtoʊˈsɪnθəsɪs',
  definition: 'Process by which plants convert light energy into chemical energy',
  imageFile: 'file-image-diagram-1',
  audioFile: 'file-audio-listening-1',
  example: 'During photosynthesis, plants absorb carbon dioxide and release oxygen.',
  tags: ['biology', 'plant', 'process'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
});

export const MOCK_WORD_BIOLOGY_CHLOROPLAST = createMockWord({
  id: 'word-bio-4',
  word: 'chloroplast',
  phonetic: 'ˈklɔːrəˌplæst',
  definition: 'Organelle in plant cells where photosynthesis occurs',
  imageFile: 'file-image-diagram-1',
  example: 'Chloroplasts contain chlorophyll, which gives plants their green color.',
  tags: ['biology', 'plant', 'organelle'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
});

export const MOCK_WORD_BIOLOGY_OSMOSIS = createMockWord({
  id: 'word-bio-5',
  word: 'osmosis',
  phonetic: 'ɒzˈmoʊsɪs',
  definition: 'Movement of water molecules through a semipermeable membrane',
  example: 'Osmosis is crucial for nutrient absorption in cells.',
  tags: ['biology', 'process', 'cell'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
});

// ==================== PHILOSOPHY VOCABULARY ====================

export const MOCK_WORD_PHILOSOPHY_ARCHE = createMockWord({
  id: 'word-phil-1',
  word: 'arche',
  phonetic: 'ˈɑːrkeɪ',
  definition: 'The fundamental principle or source of all things (Greek philosophy)',
  imageFile: 'file-image-philosophy-1',
  example: 'Thales believed water was the arche of all things.',
  tags: ['philosophy', 'greek', 'presocratic', 'concept'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
  notes: 'From Ancient Greek ἀρχή (arkhḗ)',
});

export const MOCK_WORD_PHILOSOPHY_LOGOS = createMockWord({
  id: 'word-phil-2',
  word: 'logos',
  phonetic: 'ˈloʊɡɒs',
  definition: 'Reason, principle, or universal truth (Heraclitus)',
  example: 'Heraclitus described the logos as the rational principle governing the cosmos.',
  tags: ['philosophy', 'greek', 'reason'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
});

export const MOCK_WORD_PHILOSOPHY_NOUS = createMockWord({
  id: 'word-phil-3',
  word: 'nous',
  phonetic: 'naʊs',
  definition: 'Mind or intellect; cosmic intelligence (Anaxagoras)',
  example: 'According to Anaxagoras, nous is the force that organizes matter.',
  tags: ['philosophy', 'greek', 'mind'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
});

// ==================== EARTH SCIENCE VOCABULARY ====================

export const MOCK_WORD_SCIENCE_EVAPORATION = createMockWord({
  id: 'word-sci-1',
  word: 'evaporation',
  phonetic: 'ɪˌvæpəˈreɪʃən',
  definition: 'Process of liquid water changing into water vapor',
  imageFile: 'file-image-water-cycle-1',
  example: 'Evaporation is the first stage of the water cycle.',
  tags: ['science', 'water-cycle', 'process'],
  difficulty: 'medium',
  partOfSpeech: 'noun',
});

export const MOCK_WORD_SCIENCE_CONDENSATION = createMockWord({
  id: 'word-sci-2',
  word: 'condensation',
  phonetic: 'ˌkɒndɛnˈseɪʃən',
  definition: 'Process of water vapor changing into liquid water',
  imageFile: 'file-image-water-cycle-1',
  example: 'Condensation forms clouds in the atmosphere.',
  tags: ['science', 'water-cycle', 'process'],
  difficulty: 'medium',
  partOfSpeech: 'noun',
});

export const MOCK_WORD_SCIENCE_PRECIPITATION = createMockWord({
  id: 'word-sci-3',
  word: 'precipitation',
  phonetic: 'prɪˌsɪpɪˈteɪʃən',
  definition: 'Water falling from clouds as rain, snow, sleet, or hail',
  example: 'Precipitation returns water from the atmosphere to the Earth\'s surface.',
  tags: ['science', 'water-cycle', 'weather'],
  difficulty: 'hard',
  partOfSpeech: 'noun',
});

// ==================== COLLECTIONS ====================

export const MOCK_WORDS_JAPANESE = [
  MOCK_WORD_JAPANESE_KONNICHIWA,
  MOCK_WORD_JAPANESE_SENSEI,
  MOCK_WORD_JAPANESE_YOUKOSO,
  MOCK_WORD_JAPANESE_KOURYOKU,
  MOCK_WORD_JAPANESE_YOROKOBIBU,
];

export const MOCK_WORDS_SPANISH = [
  MOCK_WORD_SPANISH_HABLAR,
  MOCK_WORD_SPANISH_CAMINAR,
  MOCK_WORD_SPANISH_ESTUDIAR,
  MOCK_WORD_SPANISH_PRIMAVERA,
  MOCK_WORD_SPANISH_VERANO,
];

export const MOCK_WORDS_FRENCH = [
  MOCK_WORD_FRENCH_PRINTEMPS,
  MOCK_WORD_FRENCH_ETE,
  MOCK_WORD_FRENCH_AUTOMNE,
  MOCK_WORD_FRENCH_HIVER,
];

export const MOCK_WORDS_BIOLOGY = [
  MOCK_WORD_BIOLOGY_CELL,
  MOCK_WORD_BIOLOGY_MITOCHONDRIA,
  MOCK_WORD_BIOLOGY_PHOTOSYNTHESIS,
  MOCK_WORD_BIOLOGY_CHLOROPLAST,
  MOCK_WORD_BIOLOGY_OSMOSIS,
];

export const MOCK_WORDS_PHILOSOPHY = [
  MOCK_WORD_PHILOSOPHY_ARCHE,
  MOCK_WORD_PHILOSOPHY_LOGOS,
  MOCK_WORD_PHILOSOPHY_NOUS,
];

export const MOCK_WORDS_SCIENCE = [
  MOCK_WORD_SCIENCE_EVAPORATION,
  MOCK_WORD_SCIENCE_CONDENSATION,
  MOCK_WORD_SCIENCE_PRECIPITATION,
];

export const MOCK_WORDS_ALL = [
  ...MOCK_WORDS_JAPANESE,
  ...MOCK_WORDS_SPANISH,
  ...MOCK_WORDS_FRENCH,
  ...MOCK_WORDS_BIOLOGY,
  ...MOCK_WORDS_PHILOSOPHY,
  ...MOCK_WORDS_SCIENCE,
];

// Helper function to seed words into DataStore mock
export const seedMockWords = (additionalWords = []) => {
  return [...MOCK_WORDS_ALL, ...additionalWords];
};

export default {
  // Individual words by language/subject
  JAPANESE: {
    KONNICHIWA: MOCK_WORD_JAPANESE_KONNICHIWA,
    SENSEI: MOCK_WORD_JAPANESE_SENSEI,
    YOUKOSO: MOCK_WORD_JAPANESE_YOUKOSO,
    KOURYOKU: MOCK_WORD_JAPANESE_KOURYOKU,
    YOROKOBIBU: MOCK_WORD_JAPANESE_YOROKOBIBU,
  },
  SPANISH: {
    HABLAR: MOCK_WORD_SPANISH_HABLAR,
    CAMINAR: MOCK_WORD_SPANISH_CAMINAR,
    ESTUDIAR: MOCK_WORD_SPANISH_ESTUDIAR,
    PRIMAVERA: MOCK_WORD_SPANISH_PRIMAVERA,
    VERANO: MOCK_WORD_SPANISH_VERANO,
  },
  FRENCH: {
    PRINTEMPS: MOCK_WORD_FRENCH_PRINTEMPS,
    ETE: MOCK_WORD_FRENCH_ETE,
    AUTOMNE: MOCK_WORD_FRENCH_AUTOMNE,
    HIVER: MOCK_WORD_FRENCH_HIVER,
  },
  BIOLOGY: {
    CELL: MOCK_WORD_BIOLOGY_CELL,
    MITOCHONDRIA: MOCK_WORD_BIOLOGY_MITOCHONDRIA,
    PHOTOSYNTHESIS: MOCK_WORD_BIOLOGY_PHOTOSYNTHESIS,
    CHLOROPLAST: MOCK_WORD_BIOLOGY_CHLOROPLAST,
    OSMOSIS: MOCK_WORD_BIOLOGY_OSMOSIS,
  },
  PHILOSOPHY: {
    ARCHE: MOCK_WORD_PHILOSOPHY_ARCHE,
    LOGOS: MOCK_WORD_PHILOSOPHY_LOGOS,
    NOUS: MOCK_WORD_PHILOSOPHY_NOUS,
  },
  SCIENCE: {
    EVAPORATION: MOCK_WORD_SCIENCE_EVAPORATION,
    CONDENSATION: MOCK_WORD_SCIENCE_CONDENSATION,
    PRECIPITATION: MOCK_WORD_SCIENCE_PRECIPITATION,
  },
  // Collections
  ALL: MOCK_WORDS_ALL,
  BY_LANGUAGE: {
    JAPANESE: MOCK_WORDS_JAPANESE,
    SPANISH: MOCK_WORDS_SPANISH,
    FRENCH: MOCK_WORDS_FRENCH,
  },
  BY_SUBJECT: {
    BIOLOGY: MOCK_WORDS_BIOLOGY,
    PHILOSOPHY: MOCK_WORDS_PHILOSOPHY,
    SCIENCE: MOCK_WORDS_SCIENCE,
  },
  // Helpers
  seedMockWords,
  createMockWord,
};
