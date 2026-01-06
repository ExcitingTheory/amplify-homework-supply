import React from 'react';
import { SuggestedVocabulary, SuggestedQuestions } from './SuggestedContent';
import { Box, Paper, Typography } from '@mui/material';

export default {
  title: 'Editor/SuggestedContent',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Components for reviewing and importing AI-extracted vocabulary and questions from uploaded documents.

## Features
- Display parsed vocabulary with definitions and context
- Display generated comprehension questions
- Edit vocabulary items before importing
- Bulk select and import to dictionary/question bank
- Track which items are already imported
- Link imported items to both documents and units
        `,
      },
    },
  },
};

// Mock data
const MOCK_DOCUMENT_ID = 'mock-document-1';
const MOCK_UNIT_ID = 'mock-unit-1';

const mockVocabularyJSON = [
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
  },
  {
    word: '気孔',
    definition: 'stomata - pores in plant leaves for gas exchange',
    context: '気孔は葉の裏側に多く存在します',
    page: 3
  },
  {
    word: 'グルコース',
    definition: 'glucose - sugar produced through photosynthesis',
    context: 'グルコースは植物のエネルギー源として利用されます',
    page: 4
  },
  {
    word: '太陽光',
    definition: 'sunlight - energy source for photosynthesis',
    context: '太陽光のエネルギーが化学エネルギーに変換されます',
    page: 1
  }
];

const mockQuestionsJSON = [
  {
    prompt: 'What is the primary function of chlorophyll in photosynthesis?',
    answer: 'Chlorophyll absorbs light energy, primarily blue and red wavelengths, which is then used to convert carbon dioxide and water into glucose.',
    hint: 'Think about what happens when light hits the chloroplast.',
    difficulty: 'medium',
    questionType: 'comprehension',
    metadata: { topic: 'photosynthesis', subtopic: 'chlorophyll-function' }
  },
  {
    prompt: 'Describe the inputs and outputs of the photosynthesis process.',
    answer: 'Inputs: carbon dioxide (CO₂), water (H₂O), and light energy. Outputs: glucose (C₆H₁₂O₆) and oxygen (O₂).',
    hint: 'What goes in and what comes out?',
    difficulty: 'easy',
    questionType: 'comprehension',
    metadata: { topic: 'photosynthesis', subtopic: 'inputs-outputs' }
  },
  {
    prompt: 'Where in the plant cell does photosynthesis occur, and why is this location significant?',
    answer: 'Photosynthesis occurs in the chloroplasts, which contain chlorophyll and all the necessary enzymes for the light and dark reactions.',
    hint: 'Think about specialized organelles.',
    difficulty: 'medium',
    questionType: 'analysis',
    metadata: { topic: 'photosynthesis', subtopic: 'chloroplast-structure' }
  },
  {
    prompt: 'What role do stomata play in photosynthesis?',
    answer: 'Stomata are pores on the leaf surface that allow carbon dioxide to enter the plant and oxygen to exit, facilitating gas exchange necessary for photosynthesis.',
    hint: 'How do gases enter and exit leaves?',
    difficulty: 'easy',
    questionType: 'comprehension',
    metadata: { topic: 'photosynthesis', subtopic: 'gas-exchange' }
  },
  {
    prompt: 'Why is photosynthesis important for life on Earth?',
    answer: 'Photosynthesis produces oxygen that most organisms need to breathe and creates glucose, the foundation of food chains. It also removes carbon dioxide from the atmosphere.',
    hint: 'Think about what all living things need.',
    difficulty: 'medium',
    questionType: 'synthesis',
    metadata: { topic: 'photosynthesis', subtopic: 'ecological-importance' }
  },
  {
    prompt: 'Compare and contrast the light-dependent and light-independent reactions of photosynthesis.',
    answer: 'Light-dependent reactions occur in the thylakoid membranes, require light, and produce ATP and NADPH. Light-independent reactions (Calvin cycle) occur in the stroma, use ATP and NADPH to fix CO₂ into glucose.',
    hint: 'What happens in the presence and absence of light?',
    difficulty: 'hard',
    questionType: 'analysis',
    metadata: { topic: 'photosynthesis', subtopic: 'reaction-stages' }
  }
];

const seedMockData = async () => {
  const { seedMockDocuments, seedMockParsedContent, seedMockUnit } = await import('../../../../.storybook/__mocks__/aws-amplify-datastore');
  
  // Seed a mock document
  seedMockDocuments([
    {
      id: MOCK_DOCUMENT_ID,
      filename: 'japanese-lesson-photosynthesis.pdf',
      path: 'protected/documents/japanese-lesson-photosynthesis.pdf',
      mimeType: 'application/pdf',
      size: 1234567,
      pageCount: 8,
      status: 'completed',
      uploadedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      owner: 'mock-user-sub',
      identityId: 'us-east-1:abc-123',
    }
  ]);
  
  // Seed parsed content with vocabulary and questions
  seedMockParsedContent([
    {
      id: 'mock-parsed-content-1',
      documentID: MOCK_DOCUMENT_ID,
      vocabularyJSON: mockVocabularyJSON,
      questionsJSON: mockQuestionsJSON,
      summariesJSON: [
        {
          type: 'overview',
          content: 'This lesson covers the fundamentals of photosynthesis in plants, including the role of chlorophyll, the inputs and outputs of the process, and its importance to life on Earth.'
        }
      ],
      objectivesJSON: [
        'Understand the process of photosynthesis',
        'Identify the key components involved in photosynthesis',
        'Explain the importance of photosynthesis to ecosystems'
      ],
      conceptsJSON: [
        'Chloroplast structure and function',
        'Light and dark reactions',
        'Gas exchange through stomata'
      ],
      extractedAt: new Date().toISOString(),
      owner: 'mock-user-sub',
    }
  ]);
  
  // Seed a mock unit for linking
  seedMockUnit({
    id: MOCK_UNIT_ID,
    name: 'Biology Unit 3: Photosynthesis',
    description: 'Study of how plants convert light energy into chemical energy',
    data: JSON.stringify({
      root: {
        children: [
          {
            type: 'heading',
            children: [{ type: 'text', text: 'Photosynthesis Study Guide' }],
            tag: 'h1'
          }
        ]
      }
    }),
    published: true,
    owner: 'mock-user-sub',
  });
};

export const VocabularyReview = {
  loaders: [seedMockData],
  render: () => {
    const [importCount, setImportCount] = React.useState(0);
    
    return (
      <Paper sx={{ p: 2, maxWidth: 800, mx: 'auto', maxHeight: '90vh', overflow: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Vocabulary Review from Document
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Review AI-extracted vocabulary from the uploaded document. You can edit definitions,
          select multiple items, and import them to your dictionary.
        </Typography>
        
        {importCount > 0 && (
          <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
            ✓ {importCount} words imported to dictionary
          </Typography>
        )}
        
        <SuggestedVocabulary
          documentId={MOCK_DOCUMENT_ID}
          unitId={MOCK_UNIT_ID}
          onImport={(count) => {
            setImportCount(prev => prev + count);
            console.log(`Imported ${count} vocabulary items`);
          }}
        />
      </Paper>
    );
  },
};

export const QuestionsReview = {
  loaders: [seedMockData],
  render: () => {
    const [importCount, setImportCount] = React.useState(0);
    
    return (
      <Paper sx={{ p: 2, maxWidth: 800, mx: 'auto', maxHeight: '90vh', overflow: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Questions Review from Document
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Review AI-generated comprehension questions from the uploaded document. 
          Select and import them to your question bank.
        </Typography>
        
        {importCount > 0 && (
          <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
            ✓ {importCount} questions imported to question bank
          </Typography>
        )}
        
        <SuggestedQuestions
          documentId={MOCK_DOCUMENT_ID}
          unitId={MOCK_UNIT_ID}
          onImport={(count) => {
            setImportCount(prev => prev + count);
            console.log(`Imported ${count} questions`);
          }}
        />
      </Paper>
    );
  },
};

export const CombinedReview = {
  loaders: [seedMockData],
  render: () => {
    const [vocabImportCount, setVocabImportCount] = React.useState(0);
    const [questionsImportCount, setQuestionsImportCount] = React.useState(0);
    
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Document Content Review
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Review and import AI-extracted content from: <strong>japanese-lesson-photosynthesis.pdf</strong>
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 3, maxHeight: '80vh' }}>
          <Paper sx={{ p: 2, maxHeight: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              📚 Vocabulary ({mockVocabularyJSON.length} items)
            </Typography>
            {vocabImportCount > 0 && (
              <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                ✓ {vocabImportCount} words imported
              </Typography>
            )}
            <SuggestedVocabulary
              documentId={MOCK_DOCUMENT_ID}
              unitId={MOCK_UNIT_ID}
              onImport={(count) => {
                setVocabImportCount(prev => prev + count);
                console.log(`Imported ${count} vocabulary items`);
              }}
            />
          </Paper>
          
          <Paper sx={{ p: 2, maxHeight: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              ❓ Questions ({mockQuestionsJSON.length} items)
            </Typography>
            {questionsImportCount > 0 && (
              <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                ✓ {questionsImportCount} questions imported
              </Typography>
            )}
            <SuggestedQuestions
              documentId={MOCK_DOCUMENT_ID}
              unitId={MOCK_UNIT_ID}
              onImport={(count) => {
                setQuestionsImportCount(prev => prev + count);
                console.log(`Imported ${count} questions`);
              }}
            />
          </Paper>
        </Box>
      </Box>
    );
  },
};

export const EmptyState = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, p: 2, maxHeight: '80vh' }}>
      <Paper sx={{ p: 2, maxHeight: '100%', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Vocabulary (No Data)
        </Typography>
        <SuggestedVocabulary
          documentId="non-existent-document"
          onImport={() => {}}
        />
      </Paper>
      
      <Paper sx={{ p: 2, maxHeight: '100%', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Questions (No Data)
        </Typography>
        <SuggestedQuestions
          documentId="non-existent-document"
          onImport={() => {}}
        />
      </Paper>
    </Box>
  ),
};

export const LoadingState = {
  loaders: [
    async () => {
      // Seed document but not parsed content to show loading state
      const { seedMockDocuments } = await import('../../../../.storybook/__mocks__/aws-amplify-datastore');
      seedMockDocuments([
        {
          id: 'loading-doc',
          filename: 'processing-document.pdf',
          status: 'processing',
          owner: 'mock-user-sub',
        }
      ]);
    }
  ],
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, p: 2, maxHeight: '80vh' }}>
      <Paper sx={{ p: 2, maxHeight: '100%', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Vocabulary (Loading)
        </Typography>
        <SuggestedVocabulary
          documentId="loading-doc"
          onImport={() => {}}
        />
      </Paper>
      
      <Paper sx={{ p: 2, maxHeight: '100%', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Questions (Loading)
        </Typography>
        <SuggestedQuestions
          documentId="loading-doc"
          onImport={() => {}}
        />
      </Paper>
    </Box>
  ),
};
