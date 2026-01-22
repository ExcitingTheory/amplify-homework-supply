// Audio files
export const MOCK_AUDIO_URL_1 = '/story-mocks/cinematic-designed-sci-fi-whoosh-transition-nexawave-228295.mp3';
export const MOCK_AUDIO_URL_2 = '/story-mocks/descent-whoosh-long-cinematic-sound-effect-405921.mp3';
export const MOCK_AUDIO_URL_3 = '/story-mocks/sound-design-elements-sfx-ps-022-302865.mp3';

// For backwards compatibility with existing code
export const MOCK_AUDIO_BASE64 = MOCK_AUDIO_URL_1;

// Mock waveform data (simulates an audio waveform)
export const mockWaveformData = Array.from({ length: 600 }, (_, i) => {
  // Create a realistic-looking waveform with varying amplitudes
  const position = i / 600;
  const envelope = Math.sin(position * Math.PI); // Fade in/out at edges
  const detail = Math.sin(i * 0.1) * 0.3 + Math.sin(i * 0.05) * 0.2;
  return Math.max(0, Math.min(1, envelope * (0.5 + detail)));
});

// Image files
export const MOCK_IMAGE_URL_1 = '/story-mocks/piano-10046998_1280.jpg';
export const MOCK_IMAGE_URL_2 = '/story-mocks/animals-10008941_1280.jpg';
export const MOCK_IMAGE_URL_3 = '/story-mocks/namibia-9992336_1280.jpg';
export const MOCK_IMAGE_URL_4 = '/story-mocks/sand-4753305_1280.jpg';
export const MOCK_IMAGE_URL_5 = '/story-mocks/rhinoceros-10074916_1280.jpg';
export const MOCK_IMAGE_URL_6 = '/story-mocks/beef-9706049_1280.jpg';
export const MOCK_IMAGE_URL_7 = '/story-mocks/meerkat-10071273_1280.png';
export const MOCK_IMAGE_URL_8 = '/story-mocks/320px-Test_sign.jpg';
export const MOCK_IMAGE_URL_9 = '/story-mocks/abstract-10055158_640.jpg';
export const MOCK_IMAGE_URL_10 = '/story-mocks/cormorant-8489010_640.jpg';
export const MOCK_IMAGE_URL_11 = '/story-mocks/img_Page_2_Image_0002.jpg';
export const MOCK_IMAGE_URL_12 = '/story-mocks/pattern-9842070_640.png';

// Video files
export const MOCK_VIDEO_URL_1 = '/story-mocks/326739_medium.mp4';

// Document files
export const MOCK_DOC_PDF_1 = '/story-mocks/science-lesson-water-cycle.pdf';
export const MOCK_DOC_DOCX_1 = '/story-mocks/biology-cell-structure.docx';
export const MOCK_DOC_DOCX_2 = '/story-mocks/science-lesson-water-cycle.docx';
export const MOCK_DOC_MD_1 = '/story-mocks/biology-cell-structure.md';
export const MOCK_DOC_MD_2 = '/story-mocks/science-lesson-water-cycle.md';

// Text files
export const MOCK_TEXT_FILE_1 = '/story-mocks/french-seasons-vocabulary.txt';
export const MOCK_TEXT_FILE_2 = '/story-mocks/japanese-lesson-photosynthesis.txt';
export const MOCK_TEXT_FILE_3 = '/story-mocks/philosophy-presocratics.txt';
export const MOCK_TEXT_FILE_4 = '/story-mocks/spanish-ar-verbs.txt';

// CSV files
export const MOCK_CSV_FILE_1 = '/story-mocks/biology-vocabulary-list.csv';
export const MOCK_CSV_FILE_2 = '/story-mocks/philosophy-questions.csv';
export const MOCK_CSV_FILE_3 = '/story-mocks/spanish-verbs-vocabulary.csv';
export const MOCK_CSV_FILE_4 = '/story-mocks/water-cycle-questions.csv'; 