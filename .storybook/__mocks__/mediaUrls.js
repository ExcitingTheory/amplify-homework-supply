/**
 * Media URLs - Real file URLs from mocks directory
 * 
 * This file provides URLs to actual test media files served from the mocks directory
 * during development and testing. These are real files, not base64 encoded.
 * 
 * Files are served from: /mocks/ (see mocks/index.html for complete listing)
 */

// Base path for mock files during development
const MOCKS_BASE_PATH = '/mocks/';

/**
 * Complete list of available media files from mocks/index.html
 * Organized by type for easy access
 */
export const MEDIA_URLS = {
  // Images
  IMAGES: {
    TEST_SIGN: `${MOCKS_BASE_PATH}320px-Test_sign.jpg`,
    ABSTRACT: `${MOCKS_BASE_PATH}abstract-10055158_640.jpg`,
    CORMORANT: `${MOCKS_BASE_PATH}cormorant-8489010_640.jpg`,
    PAGE_IMAGE: `${MOCKS_BASE_PATH}img_Page_2_Image_0002.jpg`,
    PATTERN: `${MOCKS_BASE_PATH}pattern-9842070_640.png`,
  },

  // Audio Files
  AUDIO: {
    CINEMATIC_WHOOSH: `${MOCKS_BASE_PATH}cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3`,
    DESCENT_WHOOSH: `${MOCKS_BASE_PATH}descent-whoosh-long-cinematic-sound-effect-405921.mp3`,
    SOUND_DESIGN: `${MOCKS_BASE_PATH}sound-design-elements-sfx-ps-022-302865.mp3`,
  },

  // Video Files
  VIDEO: {
    MEDIUM_VIDEO: `${MOCKS_BASE_PATH}326739_medium.mp4`,
  },

  // Documents
  DOCUMENTS: {
    // PDF
    WATER_CYCLE_PDF: `${MOCKS_BASE_PATH}science-lesson-water-cycle.pdf`,
    
    // Word Documents
    BIOLOGY_DOCX: `${MOCKS_BASE_PATH}biology-cell-structure.docx`,
    WATER_CYCLE_DOCX: `${MOCKS_BASE_PATH}science-lesson-water-cycle.docx`,
    
    // Markdown
    BIOLOGY_MD: `${MOCKS_BASE_PATH}biology-cell-structure.md`,
    WATER_CYCLE_MD: `${MOCKS_BASE_PATH}science-lesson-water-cycle.md`,
    
    // CSV
    BIOLOGY_CSV: `${MOCKS_BASE_PATH}biology-vocabulary-list.csv`,
    PHILOSOPHY_CSV: `${MOCKS_BASE_PATH}philosophy-questions.csv`,
    SPANISH_VERBS_CSV: `${MOCKS_BASE_PATH}spanish-verbs-vocabulary.csv`,
    WATER_CYCLE_CSV: `${MOCKS_BASE_PATH}water-cycle-questions.csv`,
    
    // Plain Text
    FRENCH_SEASONS: `${MOCKS_BASE_PATH}french-seasons-vocabulary.txt`,
    JAPANESE_PHOTOSYNTHESIS: `${MOCKS_BASE_PATH}japanese-lesson-photosynthesis.txt`,
    PHILOSOPHY_PRESOCRATICS: `${MOCKS_BASE_PATH}philosophy-presocratics.txt`,
    SPANISH_VERBS: `${MOCKS_BASE_PATH}spanish-ar-verbs.txt`,
  },

  // Base64 encoded images
  BASE64: {
    PAGE_IMAGE: `${MOCKS_BASE_PATH}img_Page_2_Image_0002.jpg.base64`,
  },

  // Scripts and utilities
  SCRIPTS: {
    CONVERT_ALL: `${MOCKS_BASE_PATH}convert-all.sh`,
  },

  // Markdown documentation
  DOCS: {
    README: `${MOCKS_BASE_PATH}README.md`,
    BASE64_GUIDE: `${MOCKS_BASE_PATH}BASE64_MOCK_GUIDE.md`,
  },
};

/**
 * Get all file URLs as a flat array
 */
export const getAllMediaUrls = () => {
  const allUrls = [];
  
  const addUrls = (obj) => {
    Object.values(obj).forEach(value => {
      if (typeof value === 'string') {
        allUrls.push(value);
      } else if (typeof value === 'object') {
        addUrls(value);
      }
    });
  };
  
  addUrls(MEDIA_URLS);
  return allUrls;
};

/**
 * Get URLs filtered by file type
 * @param {string} type - File extension (e.g., 'jpg', 'mp3', 'pdf')
 */
export const getUrlsByType = (type) => {
  return getAllMediaUrls().filter(url => url.toLowerCase().endsWith(`.${type.toLowerCase()}`));
};

/**
 * Get a random media URL from a specific category
 * @param {string} category - Category key from MEDIA_URLS (e.g., 'IMAGES', 'AUDIO')
 */
export const getRandomUrlFromCategory = (category) => {
  const categoryObj = MEDIA_URLS[category];
  if (!categoryObj) return null;
  
  const urls = Object.values(categoryObj);
  return urls[Math.floor(Math.random() * urls.length)];
};

/**
 * Check if a URL exists in the media collection
 * @param {string} url - URL to check
 */
export const hasMediaUrl = (url) => {
  return getAllMediaUrls().includes(url);
};

/**
 * Complete file listing from mocks/index.html
 * Useful for reference and testing
 */
export const ALL_FILES = [
  '320px-Test_sign.jpg',
  '326739_medium.mp4',
  'BASE64_MOCK_GUIDE.md',
  'README.md',
  'abstract-10055158_640.jpg',
  'biology-cell-structure.docx',
  'biology-cell-structure.md',
  'biology-vocabulary-list.csv',
  'cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3',
  'convert-all.sh',
  'cormorant-8489010_640.jpg',
  'descent-whoosh-long-cinematic-sound-effect-405921.mp3',
  'french-seasons-vocabulary.txt',
  'img_Page_2_Image_0002.jpg',
  'img_Page_2_Image_0002.jpg.base64',
  'japanese-lesson-photosynthesis.txt',
  'pattern-9842070_640.png',
  'philosophy-presocratics.txt',
  'philosophy-questions.csv',
  'science-lesson-water-cycle.docx',
  'science-lesson-water-cycle.md',
  'science-lesson-water-cycle.pdf',
  'sound-design-elements-sfx-ps-022-302865.mp3',
  'spanish-ar-verbs.txt',
  'spanish-verbs-vocabulary.csv',
  'water-cycle-questions.csv',
];

/**
 * Get full URL for a filename
 * @param {string} filename - Filename from ALL_FILES
 */
export const getUrlForFile = (filename) => {
  return `${MOCKS_BASE_PATH}${filename}`;
};

export default MEDIA_URLS;
