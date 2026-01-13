import React from 'react';
import FileManager2 from './FileManager2';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { Box, Paper, Typography } from '@mui/material';
import FilesContext, { FilesProvider } from '../../../context/fileContext';
import UnitContext from '../../../context/unitContext';
import SettingsContext from '../../../context/settingsContext';
export default {
  title: 'Editor/FileManager2',
  component: FileManager2,
  parameters: {
    layout: 'padded',
    // Ensure AudioPlayerProvider is available (needed for audio file waveforms)
    disableUnitContext: false,
    disableSectionContext: false,
    disableDictionaryContext: false,
    docs: {
      description: {
        component: `
Advanced file manager with virtualized list, semantic search, and document analysis.

## Features
- Virtualized file list with dynamic height measurement
- Hybrid search (keyword + semantic vector search)
- File organization by protection level (public, protected, private)
- Inline file renaming with Lexical editor
- Expandable file details with metadata editor and parsed content
- File generation (text-to-image, text-to-speech)
- Drag-and-drop upload
- Bulk selection and operations

## File Types
- **Images**: Preview, insert into editor, metadata editing
- **Audio**: Waveform preview, playlist insertion
- **PDFs**: Expandable content shows extracted vocabulary, questions, summaries, objectives, and concepts
- **Videos**: Preview and insertion

## Expanding Files
Click the expand icon (▼) next to any file to view:
- File metadata (name, description, prompt, model, variant)
- For PDFs: Parsed content in tabs (Vocabulary, Questions, Summaries, Objectives, Concepts)
        `,
      },
    },
  },
};

// Mock data matching schema signatures
const MOCK_DOCUMENT_ID_1 = 'mock-doc-japanese-photosynthesis';
const MOCK_DOCUMENT_ID_2 = 'mock-doc-french-seasons';
const MOCK_FILE_ID_PDF_1 = 'mock-file-pdf-1';
const MOCK_FILE_ID_PDF_2 = 'mock-file-pdf-2';
const MOCK_FILE_ID_IMAGE_1 = 'mock-file-image-1';
const MOCK_FILE_ID_IMAGE_2 = 'mock-file-image-2';
const MOCK_FILE_ID_AUDIO_1 = 'mock-file-audio-1';
const MOCK_FILE_ID_AUDIO_2 = 'mock-file-audio-2';

// Parsed content matching schema structure
const mockParsedContentJapanese = {
  vocabularyJSON: [
    {
      word: '光合成',
      definition: 'photosynthesis - the process by which plants convert light into chemical energy',
      context: '植物は光合成によって二酸化炭素と水から糖を作ります',
      page: 1
    },
    {
      word: '葉緑体',
      definition: 'chloroplast - organelle where photosynthesis occurs',
      context: '葉緑体には光合成に必要なクロロフィルが含まれています',
      page: 1
    },
    {
      word: 'クロロフィル',
      definition: 'chlorophyll - green pigment that absorbs light energy',
      context: 'クロロフィルは主に青色と赤色の光を吸収します',
      page: 2
    },
    {
      word: '二酸化炭素',
      definition: 'carbon dioxide - gas absorbed by plants during photosynthesis',
      context: '植物は気孔から二酸化炭素を取り込みます',
      page: 2
    },
    {
      word: '酸素',
      definition: 'oxygen - gas released as a byproduct of photosynthesis',
      context: '光合成の過程で酸素が大気中に放出されます',
      page: 3
    }
  ],
  summariesJSON: [
    {
      title: 'Photosynthesis Overview',
      content: 'Plants convert light energy into chemical energy through photosynthesis, using chlorophyll in chloroplasts to transform carbon dioxide and water into glucose and oxygen.',
      page_range: '1-3'
    },
    {
      title: 'Key Components',
      content: 'The process involves chloroplasts, chlorophyll, carbon dioxide, water, and light energy, producing glucose and releasing oxygen as a byproduct.',
      page_range: '2-4'
    }
  ],
  objectivesJSON: [
    {
      objective: 'Understand the process of photosynthesis',
      bloom_level: 'comprehension'
    },
    {
      objective: 'Identify the role of chlorophyll in energy conversion',
      bloom_level: 'knowledge'
    },
    {
      objective: 'Analyze the inputs and outputs of photosynthesis',
      bloom_level: 'analysis'
    }
  ],
  conceptsJSON: [
    {
      concept: 'Chloroplast Structure',
      description: 'Organelle containing chlorophyll where photosynthesis occurs',
      related_vocabulary: ['葉緑体', 'クロロフィル']
    },
    {
      concept: 'Gas Exchange',
      description: 'Process of CO₂ intake and O₂ release through stomata',
      related_vocabulary: ['二酸化炭素', '酸素', '気孔']
    }
  ],
  questionsJSON: [
    {
      question: 'What is the primary function of chlorophyll in photosynthesis?',
      expectedAnswer: 'Chlorophyll absorbs light energy, primarily blue and red wavelengths, which is then used to convert carbon dioxide and water into glucose.',
      hint: 'Think about what happens when light hits the chloroplast.',
      type: 'comprehension'
    },
    {
      question: 'Describe the inputs and outputs of the photosynthesis process.',
      expectedAnswer: 'Inputs: carbon dioxide (CO₂), water (H₂O), and light energy. Outputs: glucose (C₆H₁₂O₆) and oxygen (O₂).',
      hint: 'What goes in and what comes out?',
      type: 'comprehension'
    },
    {
      question: 'Why is photosynthesis important for life on Earth?',
      expectedAnswer: 'Photosynthesis produces oxygen that most organisms need to breathe and creates glucose, the foundation of food chains.',
      hint: 'Think about what all living things need.',
      type: 'synthesis'
    }
  ]
};

const mockParsedContentFrench = {
  vocabularyJSON: [
    {
      word: 'le printemps',
      definition: 'spring - season between winter and summer',
      context: 'Au printemps, les fleurs commencent à pousser.',
      page: 1
    },
    {
      word: "l'été",
      definition: 'summer - warmest season of the year',
      context: "En été, il fait très chaud et le soleil brille.",
      page: 1
    },
    {
      word: "l'automne",
      definition: 'autumn/fall - season when leaves change color',
      context: "En automne, les feuilles tombent des arbres.",
      page: 2
    },
    {
      word: "l'hiver",
      definition: 'winter - coldest season of the year',
      context: "En hiver, il neige souvent dans les montagnes.",
      page: 2
    }
  ],
  summariesJSON: [
    {
      title: 'The Four Seasons',
      content: 'An introduction to the four seasons in French: spring, summer, autumn, and winter, with descriptions of typical weather and activities.',
      page_range: '1-2'
    }
  ],
  objectivesJSON: [
    {
      objective: 'Learn the names of the four seasons in French',
      bloom_level: 'knowledge'
    },
    {
      objective: 'Describe seasonal characteristics',
      bloom_level: 'comprehension'
    }
  ],
  conceptsJSON: [
    {
      concept: 'Seasonal Vocabulary',
      description: 'French words for describing the four seasons',
      related_vocabulary: ['le printemps', "l'été", "l'automne", "l'hiver"]
    }
  ],
  questionsJSON: [
    {
      question: 'Quelle saison vient après le printemps?',
      expectedAnswer: "L'été vient après le printemps.",
      hint: 'Think about the order of seasons.',
      type: 'comprehension'
    },
    {
      question: 'Que se passe-t-il en automne?',
      expectedAnswer: "En automne, les feuilles changent de couleur et tombent des arbres.",
      hint: 'What happens to trees in fall?',
      type: 'comprehension'
    }
  ]
};

const seedMockData = async () => {
  console.log('[FileManager2.stories] Starting to seed mock data...');
  
  // Clear localStorage to reset generator filter to 'all'
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fileManager2_activeTab');
  }
  
  const { seedMockFiles, seedMockDocuments, seedMockParsedContent } = await import('../../../../.storybook/__mocks__/aws-amplify-datastore');
  const { MOCK_IMAGE_URL_1, MOCK_IMAGE_URL_2, mockWaveformData } = await import('../../../../.storybook/__mocks__/media');
  
  const timestamp = new Date().toISOString();
  const identityId = 'us-east-1:mock-identity-123';
  const owner = 'mock-user-sub';
  
  console.log('[FileManager2.stories] Mock imports complete');
  
  // Seed Files
  console.log('[FileManager2.stories] Seeding files...');
  seedMockFiles([
    // PDF Files
    {
      id: MOCK_FILE_ID_PDF_1,
      name: 'japanese-lesson-photosynthesis.pdf',
      path: 'protected/documents/japanese-lesson-photosynthesis.pdf',
      mimeType: 'application/pdf',
      level: 'PROTECTED',
      size: 1234567,
      documentID: MOCK_DOCUMENT_ID_1,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: MOCK_FILE_ID_PDF_2,
      name: 'french-seasons-vocabulary.pdf',
      path: 'protected/documents/french-seasons.pdf',
      mimeType: 'application/pdf',
      level: 'PROTECTED',
      size: 456789,
      documentID: MOCK_DOCUMENT_ID_2,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    // Image Files
    {
      id: MOCK_FILE_ID_IMAGE_1,
      name: 'cell-diagram.jpg',
      path: 'public/images/cell-diagram.jpg',
      mimeType: 'image/jpeg',
      level: 'PUBLIC',
      size: 234567,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      updatedAt: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: MOCK_FILE_ID_IMAGE_2,
      name: 'seasons-illustration.png',
      path: 'public/images/seasons.png',
      mimeType: 'image/png',
      level: 'PUBLIC',
      size: 345678,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    // Audio Files
    {
      id: MOCK_FILE_ID_AUDIO_1,
      name: 'photosynthesis-pronunciation.mp3',
      path: 'protected/audio/photosynthesis.mp3',
      mimeType: 'audio/mpeg',
      level: 'PROTECTED',
      size: 123456,
      duration: 12,
      waveformData: JSON.stringify(mockWaveformData),
      owner,
      identityId,
      createdAt: new Date(Date.now() - 9000000).toISOString(),
      updatedAt: new Date(Date.now() - 9000000).toISOString(),
    },
    {
      id: MOCK_FILE_ID_AUDIO_2,
      name: 'seasons-audio.mp3',
      path: 'protected/audio/seasons.mp3',
      mimeType: 'audio/mpeg',
      level: 'PROTECTED',
      size: 98765,
      duration: 8,
      waveformData: JSON.stringify(mockWaveformData),
      owner,
      identityId,
      createdAt: new Date(Date.now() - 2700000).toISOString(),
      updatedAt: new Date(Date.now() - 2700000).toISOString(),
    },
  ]);
  console.log('[FileManager2.stories] Files seeded');
  
  // Seed Documents
  console.log('[FileManager2.stories] Seeding documents...');
  seedMockDocuments([
    {
      id: MOCK_DOCUMENT_ID_1,
      filename: 'japanese-lesson-photosynthesis.pdf',
      s3Key: 'protected/documents/japanese-lesson-photosynthesis.pdf',
      status: 'completed',
      pageCount: 8,
      fileSize: 1234567,
      mimeType: 'application/pdf',
      owner,
      identityId,
      uploadedAt: new Date(Date.now() - 7200000).toISOString(),
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: MOCK_DOCUMENT_ID_2,
      filename: 'french-seasons-vocabulary.pdf',
      s3Key: 'protected/documents/french-seasons.pdf',
      status: 'completed',
      pageCount: 4,
      fileSize: 456789,
      mimeType: 'application/pdf',
      owner,
      identityId,
      uploadedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);
  console.log('[FileManager2.stories] Documents seeded');
  
  // Seed ParsedContent
  console.log('[FileManager2.stories] Seeding parsed content...');
  seedMockParsedContent([
    {
      id: 'mock-parsed-content-1',
      documentID: MOCK_DOCUMENT_ID_1,
      vocabularyJSON: mockParsedContentJapanese.vocabularyJSON,
      summariesJSON: mockParsedContentJapanese.summariesJSON,
      objectivesJSON: mockParsedContentJapanese.objectivesJSON,
      conceptsJSON: mockParsedContentJapanese.conceptsJSON,
      questionsJSON: mockParsedContentJapanese.questionsJSON,
      responseId: 'chatcmpl-mock-response-1',
      modelUsed: 'gpt-4',
      tokensUsed: 2500,
      processingTime: 45,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'mock-parsed-content-2',
      documentID: MOCK_DOCUMENT_ID_2,
      vocabularyJSON: mockParsedContentFrench.vocabularyJSON,
      summariesJSON: mockParsedContentFrench.summariesJSON,
      objectivesJSON: mockParsedContentFrench.objectivesJSON,
      conceptsJSON: mockParsedContentFrench.conceptsJSON,
      questionsJSON: mockParsedContentFrench.questionsJSON,
      responseId: 'chatcmpl-mock-response-2',
      modelUsed: 'gpt-4',
      tokensUsed: 1800,
      processingTime: 32,
      owner,
      identityId,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);
  console.log('[FileManager2.stories] ParsedContent seeded');
  console.log('[FileManager2.stories] All mock data seeded successfully!');
};

// Debug component to show files count
const FilesDebug = () => {
  const filesContext = React.useContext(FilesContext) || {};
  const { files = [] } = filesContext;
  const unitContext = React.useContext(UnitContext) || {};
  
  React.useEffect(() => {
    console.log('[FilesDebug] Files in context:', files.length, files);
    console.log('[FilesDebug] FilesContext:', filesContext);
    console.log('[FilesDebug] UnitContext:', unitContext);
  }, [files, filesContext, unitContext]);
  
  return (
    <Box sx={{ p: 1, bgcolor: 'info.light', color: 'info.contrastText', fontSize: '0.75rem' }}>
      📁 Files loaded: {files.length} | Session: {filesContext.session?.identityId ? '✓' : '✗'} | Unit: {unitContext.unit?.id ? '✓' : '✗'}
    </Box>
  );
};

// Wrapper to provide Lexical context and UnitContext
const FileManagerWrapper = ({ children, showDebug = false }) => {
  const initialConfig = {
    namespace: 'FileManager2Story',
    onError: (error) => console.error('Lexical error:', error),
    editorState: null,
  };
  
  // Mock UnitContext value
  const mockUnitContext = {
    unit: {
      id: 'mock-unit-id',
      name: 'Mock Unit',
      data: null,
    },
    session: {
      identityId: 'us-east-1:mock-identity-123',
      username: 'mock-user-sub',
    },
  };

  // Mock SettingsContext value
  const mockSettingsContext = {
    settings: null,
  };
  
  return (
    <SettingsContext.Provider value={mockSettingsContext}>
      <UnitContext.Provider value={mockUnitContext}>
        <LexicalComposer initialConfig={initialConfig}>
          <Box sx={{ 
            height: '100vh',
            width: '100%',
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden' 
          }}>
            {showDebug && <FilesDebug />}
            {children}
          </Box>
        </LexicalComposer>
      </UnitContext.Provider>
    </SettingsContext.Provider>
  );
};

export const Default = {
  loaders: [seedMockData],
  parameters: {
    layout: 'fullscreen', // Remove Storybook's default padding
  },
  render: () => (
    <FileManagerWrapper showDebug={true}>
      <Paper sx={{ 
        height: 600,
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
      }}>
        <FileManager2 />
      </Paper>
    </FileManagerWrapper>
  ),
};

export const WithExpandedContent = {
  loaders: [seedMockData],
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <FileManagerWrapper>
      <Paper sx={{ height: 700, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          File Manager - Expanded Content Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
          Click the expand icon (▼) next to any file to view detailed metadata and parsed content.
          PDF files show vocabulary, questions, summaries, objectives, and concepts.
        </Typography>
        <FileManager2 />
      </Paper>
    </FileManagerWrapper>
  ),
};

export const EmptyState = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <FileManagerWrapper>
      <Paper sx={{ height: 500, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          File Manager - Empty State
        </Typography>
        <FileManager2 />
      </Paper>
    </FileManagerWrapper>
  ),
};

export const ExpandedPDFContent = {
  loaders: [seedMockData],
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <FileManagerWrapper>
      <Paper sx={{ height: 800, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          File Manager - Expanded PDF Content
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
          Click the expand icon (▼) next to a PDF file to view extracted vocabulary, questions,
          summaries, objectives, and concepts in organized tabs.
        </Typography>
        <FileManager2 />
      </Paper>
    </FileManagerWrapper>
  ),
};
