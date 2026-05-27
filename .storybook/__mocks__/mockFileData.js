/**
 * Mock File Data for Storybook - FileManager, Dictionary Editor, Question Editor
 * 
 * Comprehensive mock File records with static file URLs from /story-mocks/
 * to work in isolated Storybook environments without S3 dependencies.
 * Files can optionally include embeddings for semantic search.
 */

import { MOCK_MEDIA } from './mockMediaData';
import { generateMockEmbedding } from './mockEmbeddingUtils';
import {
  MOCK_DOC_DOCX_1, MOCK_DOC_DOCX_2,
  MOCK_RTF_FILE_1, MOCK_EPUB_FILE_1,
  MOCK_GIFT_FILE_1, MOCK_QTI_FILE_1, MOCK_IMSCC_FILE_1,
  MOCK_SCORM_ZIP_FILE_1, MOCK_DOC_THUMBNAILS, MOCK_SRCSET,
} from './media';

/**
 * Helper to create a mock File record with optional embedding
 */
export const createMockFile = ({
  id,
  name,
  path, // Base64 data URI
  mimeType,
  size,
  description = '',
  owner = 'mock-user-sub',
  identityId = 'us-east-1:mock-identity-123',
  duration = null,
  width = null,
  height = null,
  pages = null,
  thumbnail = null,
  embedding = null,
  embeddingModel = 'text-embedding-3-small',
  embeddingDimensions = 1536,
  metadata = null,
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
  _version = 1,
  _deleted = false,
  _lastChangedAt = Date.now(),
}) => {
  // Auto-generate embedding from description if provided and embedding not set
  const generatedEmbedding = description && !embedding 
    ? generateMockEmbedding(description, embeddingDimensions)
    : embedding;
  
  return {
    id,
    name,
    path,
    mimeType,
    size,
    description,
    owner,
    identityId,
    duration,
    width,
    height,
    pages,
    thumbnail,
    embedding: generatedEmbedding,
    embeddingModel: generatedEmbedding ? embeddingModel : null,
    embeddingDimensions: generatedEmbedding ? embeddingDimensions : null,
    metadata,
    createdAt,
    updatedAt,
    _version,
    _deleted,
    _lastChangedAt,
  };
};

// ==================== AUDIO FILES ====================

export const MOCK_FILE_AUDIO_JAPANESE = createMockFile({
  id: 'file-audio-japanese-1',
  name: 'japanese-word-pronunciation.mp3',
  path: MOCK_MEDIA.AUDIO_MP3,
  mimeType: 'audio/mpeg',
  size: 48256,
  description: 'Japanese word pronunciation: こんにちは (Konnichiwa)',
  duration: 2.5,
});

export const MOCK_FILE_AUDIO_SPANISH = createMockFile({
  id: 'file-audio-spanish-1',
  name: 'spanish-verb-conjugation.mp3',
  path: MOCK_MEDIA.AUDIO_MP3,
  mimeType: 'audio/mpeg',
  size: 52480,
  description: 'Spanish AR-verb pronunciation: hablar',
  duration: 2.8,
});

export const MOCK_FILE_AUDIO_FRENCH = createMockFile({
  id: 'file-audio-french-1',
  name: 'french-season-vocabulary.wav',
  path: MOCK_MEDIA.AUDIO_WAV,
  mimeType: 'audio/wav',
  size: 88200,
  description: 'French season pronunciation: printemps, été, automne, hiver',
  duration: 3.2,
});

export const MOCK_FILE_AUDIO_LISTENING_EXERCISE = createMockFile({
  id: 'file-audio-listening-1',
  name: 'biology-photosynthesis-lecture.mp3',
  path: MOCK_MEDIA.AUDIO_MP3,
  mimeType: 'audio/mpeg',
  size: 524288,
  description: 'Biology lecture on photosynthesis process',
  duration: 30.0,
});

// ==================== IMAGE FILES ====================

export const MOCK_FILE_IMAGE_DIAGRAM = createMockFile({
  id: 'file-image-diagram-1',
  name: 'cell-structure-diagram.png',
  path: MOCK_MEDIA.IMAGE_PNG,
  mimeType: 'image/png',
  size: 245760,
  description: 'Detailed cell structure diagram showing organelles',
  thumbnail: '/story-mocks/pattern-9842070_640.png',
  width: 1920,
  height: 1080,
});

export const MOCK_FILE_IMAGE_KANJI_CHART = createMockFile({
  id: 'file-image-kanji-1',
  name: 'japanese-kanji-chart.jpg',
  path: MOCK_MEDIA.IMAGE_JPEG,
  mimeType: 'image/jpeg',
  size: 786432,
  description: 'Japanese Kanji chart - N5 level characters',
  thumbnail: '/story-mocks/320px-Test_sign.jpg',
  width: 2048,
  height: 1536,
});

export const MOCK_FILE_IMAGE_WATER_CYCLE = createMockFile({
  id: 'file-image-water-cycle-1',
  name: 'water-cycle-diagram.svg',
  path: MOCK_MEDIA.IMAGE_SVG,
  mimeType: 'image/svg+xml',
  size: 18432,
  description: 'Interactive water cycle diagram with labels',
  thumbnail: '/story-mocks/sample-diagram.svg',
  width: 1200,
  height: 800,
});

export const MOCK_FILE_IMAGE_PHILOSOPHY = createMockFile({
  id: 'file-image-philosophy-1',
  name: 'presocratic-philosophers-timeline.png',
  path: MOCK_MEDIA.IMAGE_PNG,
  mimeType: 'image/png',
  size: 512000,
  description: 'Timeline of Pre-Socratic philosophers',
  thumbnail: '/story-mocks/pattern-9842070_640.png',
  width: 1600,
  height: 900,
});

// ==================== VIDEO FILES ====================

export const MOCK_FILE_VIDEO_DEMO = createMockFile({
  id: 'file-video-demo-1',
  name: 'spanish-conversation-demo.mp4',
  path: MOCK_MEDIA.VIDEO_MP4,
  mimeType: 'video/mp4',
  size: 2097152,
  description: 'Spanish conversation demonstration video',
  duration: 45.0,
  width: 1280,
  height: 720,
});

export const MOCK_FILE_VIDEO_EXPERIMENT = createMockFile({
  id: 'file-video-experiment-1',
  name: 'biology-osmosis-experiment.mp4',
  path: MOCK_MEDIA.VIDEO_MP4,
  mimeType: 'video/mp4',
  size: 3145728,
  description: 'Time-lapse video of osmosis experiment',
  duration: 60.0,
  width: 1920,
  height: 1080,
});

// ==================== PDF DOCUMENTS ====================

export const MOCK_FILE_PDF_TEXTBOOK = createMockFile({
  id: 'file-pdf-textbook-1',
  name: 'japanese-lesson-photosynthesis.pdf',
  path: MOCK_MEDIA.PDF,
  mimeType: 'application/pdf',
  size: 1458000,
  description: 'Japanese biology textbook chapter on photosynthesis',
  thumbnail: '/story-mocks/abstract-10055158_640.jpg',
  pages: 15,
});

export const MOCK_FILE_PDF_WORKSHEET = createMockFile({
  id: 'file-pdf-worksheet-1',
  name: 'spanish-verb-conjugation-worksheet.pdf',
  path: MOCK_MEDIA.PDF,
  mimeType: 'application/pdf',
  size: 245000,
  description: 'Spanish AR-verb conjugation practice worksheet',
  thumbnail: '/story-mocks/cormorant-8489010_640.jpg',
  pages: 3,
});

export const MOCK_FILE_PDF_PHILOSOPHY = createMockFile({
  id: 'file-pdf-philosophy-1',
  name: 'philosophy-presocratics.pdf',
  path: MOCK_MEDIA.PDF,
  mimeType: 'application/pdf',
  size: 892000,
  description: 'Study guide on Pre-Socratic philosophers',
  thumbnail: '/story-mocks/sand-4753305_1280.jpg',
  pages: 8,
});

export const MOCK_FILE_PDF_SCIENCE = createMockFile({
  id: 'file-pdf-science-1',
  name: 'science-lesson-water-cycle.pdf',
  path: MOCK_MEDIA.PDF,
  mimeType: 'application/pdf',
  size: 512000,
  description: 'Earth science lesson on the water cycle',
  thumbnail: '/story-mocks/beef-9706049_1280.jpg',
  pages: 5,
});

export const MOCK_FILE_PDF_BIOLOGY = createMockFile({
  id: 'file-pdf-biology-1',
  name: 'biology-cell-structure.pdf',
  path: MOCK_MEDIA.PDF,
  mimeType: 'application/pdf',
  size: 1024000,
  description: 'Cell structure and function chapter',
  thumbnail: '/story-mocks/meerkat-10071273_1280.png',
  pages: 12,
});

// ==================== DOCUMENT FILES (Office, Edu LMS) ====================

export const MOCK_FILE_DOCX_BIOLOGY = createMockFile({
  id: 'file-docx-biology-1',
  name: 'biology-cell-structure.docx',
  path: MOCK_DOC_DOCX_1,
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size: 384000,
  description: 'Biology cell structure chapter - Word document',
  thumbnail: MOCK_DOC_THUMBNAILS.DOCX_BIOLOGY,
});

export const MOCK_FILE_DOCX_WATER_CYCLE = createMockFile({
  id: 'file-docx-water-cycle-1',
  name: 'science-lesson-water-cycle.docx',
  path: MOCK_DOC_DOCX_2,
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size: 256000,
  description: 'Science lesson on the water cycle - Word document',
  thumbnail: MOCK_DOC_THUMBNAILS.DOCX_WATER_CYCLE,
});

export const MOCK_FILE_RTF_PHILOSOPHY = createMockFile({
  id: 'file-rtf-philosophy-1',
  name: 'philosophy-presocratics.rtf',
  path: MOCK_RTF_FILE_1,
  mimeType: 'application/rtf',
  size: 128000,
  description: 'Pre-Socratic philosophers overview - RTF',
  thumbnail: MOCK_DOC_THUMBNAILS.RTF_PHILOSOPHY,
});

export const MOCK_FILE_EPUB_WATER_CYCLE = createMockFile({
  id: 'file-epub-water-cycle-1',
  name: 'water-cycle-guide.epub',
  path: MOCK_EPUB_FILE_1,
  mimeType: 'application/epub+zip',
  size: 512000,
  description: 'Interactive water cycle guide - EPUB e-book',
  thumbnail: MOCK_DOC_THUMBNAILS.EPUB_WATER_CYCLE,
});

export const MOCK_FILE_GIFT_SPANISH = createMockFile({
  id: 'file-gift-spanish-1',
  name: 'spanish-quiz.gift',
  path: MOCK_GIFT_FILE_1,
  mimeType: 'text/x-gift',
  size: 4200,
  description: 'Spanish vocabulary quiz in GIFT format',
  thumbnail: MOCK_DOC_THUMBNAILS.GIFT_SPANISH,
});

export const MOCK_FILE_QTI_BIOLOGY = createMockFile({
  id: 'file-qti-biology-1',
  name: 'biology-cell-quiz.qti',
  path: MOCK_QTI_FILE_1,
  mimeType: 'application/x-qti+xml',
  size: 8400,
  description: 'Biology cell structure quiz in QTI format',
  thumbnail: MOCK_DOC_THUMBNAILS.QTI_BIOLOGY,
});

export const MOCK_FILE_IMSCC_JAPANESE = createMockFile({
  id: 'file-imscc-japanese-1',
  name: 'japanese-grammar-course.imscc',
  path: MOCK_IMSCC_FILE_1,
  mimeType: 'application/x-imscc+zip',
  size: 2048000,
  description: 'Japanese grammar course package - IMS Common Cartridge',
  thumbnail: MOCK_DOC_THUMBNAILS.IMSCC_JAPANESE,
});

export const MOCK_FILE_SCORM_BIOLOGY = createMockFile({
  id: 'file-scorm-biology-1',
  name: 'biology-photosynthesis-scorm.zip',
  path: MOCK_SCORM_ZIP_FILE_1,
  mimeType: 'application/zip',
  size: 4096000,
  description: 'Photosynthesis lesson - SCORM package',
  thumbnail: MOCK_DOC_THUMBNAILS.PDF_BIOLOGY,
});

// ==================== COLLECTIONS ====================

export const MOCK_FILES_AUDIO = [
  MOCK_FILE_AUDIO_JAPANESE,
  MOCK_FILE_AUDIO_SPANISH,
  MOCK_FILE_AUDIO_FRENCH,
  MOCK_FILE_AUDIO_LISTENING_EXERCISE,
];

export const MOCK_FILES_IMAGE = [
  MOCK_FILE_IMAGE_DIAGRAM,
  MOCK_FILE_IMAGE_KANJI_CHART,
  MOCK_FILE_IMAGE_WATER_CYCLE,
  MOCK_FILE_IMAGE_PHILOSOPHY,
];

export const MOCK_FILES_VIDEO = [
  MOCK_FILE_VIDEO_DEMO,
  MOCK_FILE_VIDEO_EXPERIMENT,
];

export const MOCK_FILES_PDF = [
  MOCK_FILE_PDF_TEXTBOOK,
  MOCK_FILE_PDF_WORKSHEET,
  MOCK_FILE_PDF_PHILOSOPHY,
  MOCK_FILE_PDF_SCIENCE,
  MOCK_FILE_PDF_BIOLOGY,
];

export const MOCK_FILES_DOCUMENTS = [
  MOCK_FILE_DOCX_BIOLOGY,
  MOCK_FILE_DOCX_WATER_CYCLE,
  MOCK_FILE_RTF_PHILOSOPHY,
  MOCK_FILE_EPUB_WATER_CYCLE,
  MOCK_FILE_GIFT_SPANISH,
  MOCK_FILE_QTI_BIOLOGY,
  MOCK_FILE_IMSCC_JAPANESE,
  MOCK_FILE_SCORM_BIOLOGY,
];

export const MOCK_FILES_ALL = [
  ...MOCK_FILES_AUDIO,
  ...MOCK_FILES_IMAGE,
  ...MOCK_FILES_VIDEO,
  ...MOCK_FILES_PDF,
  ...MOCK_FILES_DOCUMENTS,
];

// Helper function to seed files into DataStore mock
export const seedMockFiles = (additionalFiles = []) => {
  return [...MOCK_FILES_ALL, ...additionalFiles];
};

export default {
  // Individual files
  AUDIO: {
    JAPANESE: MOCK_FILE_AUDIO_JAPANESE,
    SPANISH: MOCK_FILE_AUDIO_SPANISH,
    FRENCH: MOCK_FILE_AUDIO_FRENCH,
    LISTENING: MOCK_FILE_AUDIO_LISTENING_EXERCISE,
  },
  IMAGE: {
    DIAGRAM: MOCK_FILE_IMAGE_DIAGRAM,
    KANJI: MOCK_FILE_IMAGE_KANJI_CHART,
    WATER_CYCLE: MOCK_FILE_IMAGE_WATER_CYCLE,
    PHILOSOPHY: MOCK_FILE_IMAGE_PHILOSOPHY,
  },
  VIDEO: {
    DEMO: MOCK_FILE_VIDEO_DEMO,
    EXPERIMENT: MOCK_FILE_VIDEO_EXPERIMENT,
  },
  PDF: {
    TEXTBOOK: MOCK_FILE_PDF_TEXTBOOK,
    WORKSHEET: MOCK_FILE_PDF_WORKSHEET,
    PHILOSOPHY: MOCK_FILE_PDF_PHILOSOPHY,
    SCIENCE: MOCK_FILE_PDF_SCIENCE,
    BIOLOGY: MOCK_FILE_PDF_BIOLOGY,
  },
  DOCUMENT: {
    DOCX_BIOLOGY: MOCK_FILE_DOCX_BIOLOGY,
    DOCX_WATER_CYCLE: MOCK_FILE_DOCX_WATER_CYCLE,
    RTF_PHILOSOPHY: MOCK_FILE_RTF_PHILOSOPHY,
    EPUB_WATER_CYCLE: MOCK_FILE_EPUB_WATER_CYCLE,
    GIFT_SPANISH: MOCK_FILE_GIFT_SPANISH,
    QTI_BIOLOGY: MOCK_FILE_QTI_BIOLOGY,
    IMSCC_JAPANESE: MOCK_FILE_IMSCC_JAPANESE,
    SCORM_BIOLOGY: MOCK_FILE_SCORM_BIOLOGY,
  },
  // Collections
  ALL: MOCK_FILES_ALL,
  BY_TYPE: {
    AUDIO: MOCK_FILES_AUDIO,
    IMAGE: MOCK_FILES_IMAGE,
    VIDEO: MOCK_FILES_VIDEO,
    PDF: MOCK_FILES_PDF,
    DOCUMENT: MOCK_FILES_DOCUMENTS,
  },
  // Responsive image srcSets (for stories that render images with srcSet)
  SRCSET: MOCK_SRCSET,
  // Helper
  seedMockFiles,
  createMockFile,
};
