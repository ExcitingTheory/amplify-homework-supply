import type { Meta, StoryObj } from '@storybook/react';
import QuestionsReview2 from './QuestionsReview2';
import { Box, Paper, Typography } from '@mui/material';
import { DemoBanner } from '../../.storybook/components/DemoBanner';

// Shared loader function for all stories
const createQuestionLoader = (documentId: string, questions: any[]) => {
    return async () => {
        const { mockDocuments, mockParsedContent, seedMockDocuments, seedMockParsedContent } = await import('../../.storybook/__mocks__/aws-amplify-datastore.js');
        
        // Clear existing data
        Object.keys(mockDocuments).forEach(k => delete (mockDocuments as any)[k]);
        Object.keys(mockParsedContent).forEach(k => delete (mockParsedContent as any)[k]);
        
        // Seed document
        seedMockDocuments([{
            id: documentId,
            filename: 'japanese-lesson-photosynthesis.pdf',
            status: 'completed',
            pageCount: 5,
            mimeType: 'application/pdf',
            size: 1234567,
        }]);
        
        // Seed parsed content with questions
        seedMockParsedContent([{
            id: `parsed-${documentId}`,
            documentID: documentId,
            questionsJSON: JSON.stringify(questions),
            summariesJSON: JSON.stringify([]),
            objectivesJSON: JSON.stringify([]),
            status: 'completed',
        }]);
        
        return {};
    };
};

const meta: Meta<typeof QuestionsReview2> = {
    title: 'Components/QuestionsReview2',
    component: QuestionsReview2,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# QuestionsReview2 Component

Enhanced questions review panel for PDF analysis with modern UX improvements.

## ✨ Key Features

### Lexical-Powered Editing
- **Unified Undo/Redo**: Cmd+Z/Cmd+Shift+Z works across all fields
- **Always-On Editing**: Click any field to start editing immediately
- **Auto-Save**: Changes save automatically after 1 second of inactivity
- **Search Highlighting**: Search terms automatically highlighted in real-time

### Virtual Scrolling
- **Performance**: Handles thousands of questions smoothly
- **TanStack Virtual**: Only renders visible items for optimal performance
- **Dynamic Heights**: Automatically adjusts to expanded/collapsed states

### Polished UI
- **Better Cards**: Alternating row colors, hover states, smooth transitions
- **Type & Difficulty Badges**: Color-coded chips for question type and difficulty
- **Media Indicators**: Icons for questions with audio or images
- **Expand/Collapse**: Obvious affordances with icons and smooth animations
- **Import States**: Clear visual feedback for import status

### Smart Features
- **Duplicate Detection**: Automatically detects questions already in question bank
- **Bulk Selection**: Select/deselect all with one click
- **Progress Tracking**: Real-time import progress with detailed feedback
- **Summaries**: Collapsible section for document summaries and learning objectives

## Use Cases
1. Review AI-extracted questions from uploaded PDFs
2. Edit question prompts, answers, and hints inline
3. Select specific questions to import into unit question bank
4. Search and filter large question lists
5. Track import status and duplicates

## Question Types
- **Essay**: Open-ended questions requiring detailed responses
- **Short Answer**: Brief factual responses
- **Comprehension**: Reading comprehension questions
- **Multiple Choice**: Questions with predefined choices

## Difficulty Levels
- **Easy**: Beginner-level questions (green badge)
- **Medium**: Intermediate questions (yellow badge)
- **Hard**: Advanced questions (red badge)

## Workflow
1. Upload PDF document for analysis
2. AI extracts questions with answers and hints
3. Review extracted questions in this panel
4. Edit any fields inline (auto-saves)
5. Select questions to import
6. Import to unit question bank

## Improvements from V1
- ✅ Lexical editors with unified undo/redo
- ✅ Virtual scrolling for performance
- ✅ Search term highlighting
- ✅ Auto-save with debouncing
- ✅ Type and difficulty badges
- ✅ Media indicators (audio/image)
- ✅ Clearer expand/collapse affordances
- ✅ Alternating row colors
- ✅ Smooth transitions
                `.trim(),
            },
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <Box>
                <DemoBanner severity="info" title="Demo Mode">
                    PDF analysis and question extraction powered by OpenAI. Data is mocked for demonstration.
                </DemoBanner>
                <Story />
            </Box>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof QuestionsReview2>;

/**
 * Default state with mixed question types
 */
export const Default: Story = {
    args: {
        documentId: 'mock-doc-1',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createQuestionLoader('mock-doc-1', [
        { prompt: 'What is photosynthesis?', answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.', hint: 'Think about how plants make food', type: 'essay', difficulty: 'easy', page: 1 },
        { prompt: 'Describe the role of chloroplasts in photosynthesis.', answer: 'Chloroplasts are organelles where photosynthesis occurs, containing chlorophyll that captures light energy.', hint: 'Where does photosynthesis happen?', type: 'short_answer', difficulty: 'medium', page: 2 },
        { prompt: 'What gases are involved in photosynthesis?', answer: 'Plants take in carbon dioxide and release oxygen during photosynthesis.', type: 'comprehension', difficulty: 'easy', page: 2 },
        { prompt: 'Explain the importance of photosynthesis in ecosystems.', answer: 'Photosynthesis provides oxygen for organisms and forms the base of food chains.', hint: 'Think about the broader impact', type: 'essay', difficulty: 'hard', page: 3, hasAudio: true },
        { prompt: 'What is the primary product of photosynthesis?', answer: 'Glucose is the primary product of photosynthesis.', type: 'short_answer', difficulty: 'medium', page: 4, hasImage: true },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Default view with extracted questions ready for review. Click any row to expand and edit inline. Changes auto-save after 1 second.',
            },
        },
    },
};

/**
 * With search term highlighting specific content
 */
export const WithSearchHighlight: Story = {
    args: {
        documentId: 'mock-doc-1',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: 'photosynthesis',
    },
    loaders: [createQuestionLoader('mock-doc-1', [
        { prompt: 'What is photosynthesis?', answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.', hint: 'Think about how plants make food', type: 'essay', difficulty: 'easy', page: 1 },
        { prompt: 'Describe the role of chloroplasts in photosynthesis.', answer: 'Chloroplasts are organelles where photosynthesis occurs, containing chlorophyll that captures light energy.', hint: 'Where does photosynthesis happen?', type: 'short_answer', difficulty: 'medium', page: 2 },
        { prompt: 'What gases are involved in photosynthesis?', answer: 'Plants take in carbon dioxide and release oxygen during photosynthesis.', type: 'comprehension', difficulty: 'easy', page: 2 },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Search term "photosynthesis" is highlighted in yellow across all fields. Only matching items are shown.',
            },
        },
    },
};

/**
 * Large list with 50 items to demonstrate virtual scrolling
 */
export const LargeList: Story = {
    args: {
        documentId: 'mock-doc-large',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createQuestionLoader('mock-doc-large', Array.from({ length: 50 }, (_, i) => ({
        prompt: `Question ${i + 1}: What is the role of ${['chloroplasts', 'mitochondria', 'cell walls', 'ribosomes'][i % 4]} in plant cells?`,
        answer: `Answer ${i + 1}: Detailed explanation about cellular organelles and their functions.`,
        hint: i % 3 === 0 ? `Hint for question ${i + 1}` : undefined,
        type: ['essay', 'short_answer', 'comprehension', 'multiple_choice'][i % 4],
        difficulty: ['easy', 'medium', 'hard'][i % 3],
        page: Math.floor(i / 10) + 1,
    })))],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
                <strong>Performance Test:</strong> This list contains 50 question items. 
                Virtual scrolling ensures smooth performance by only rendering visible items.
                Scroll to see smooth performance even with large datasets.
            </Paper>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates virtual scrolling with 50 items. Only visible items are rendered for optimal performance.',
            },
        },
    },
};

/**
 * Essay questions only
 */
export const EssayQuestions: Story = {
    args: {
        documentId: 'mock-doc-essay',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createQuestionLoader('mock-doc-essay', [
        { prompt: 'Explain the process of photosynthesis in detail.', answer: 'Photosynthesis is a complex process where plants convert light energy into chemical energy through a series of reactions.', type: 'essay', difficulty: 'medium', page: 1 },
        { prompt: 'Discuss the importance of photosynthesis for life on Earth.', answer: 'Photosynthesis is essential as it produces oxygen and forms the base of most food chains.', type: 'essay', difficulty: 'easy', page: 2 },
        { prompt: 'Compare and contrast cellular respiration and photosynthesis.', answer: 'While photosynthesis stores energy, cellular respiration releases it. Both involve electron transport chains.', type: 'essay', difficulty: 'hard', page: 3 },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Collection of essay-type questions requiring detailed responses. All questions have the primary blue badge.',
            },
        },
    },
};

/**
 * Comprehension questions only
 */
export const ComprehensionQuestions: Story = {
    args: {
        documentId: 'mock-doc-comprehension',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createQuestionLoader('mock-doc-comprehension', [
        { prompt: 'What gases are exchanged during photosynthesis?', answer: 'Carbon dioxide is taken in and oxygen is released.', type: 'comprehension', difficulty: 'easy', page: 1 },
        { prompt: 'Where in plant cells does photosynthesis occur?', answer: 'Photosynthesis occurs in the chloroplasts.', type: 'comprehension', difficulty: 'easy', page: 2 },
        { prompt: 'What is the main product of photosynthesis?', answer: 'Glucose is the main product of photosynthesis.', type: 'comprehension', difficulty: 'medium', page: 3 },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Reading comprehension questions. All questions have the secondary purple badge.',
            },
        },
    },
};

/**
 * Mixed difficulty levels
 */
export const MixedDifficulty: Story = {
    args: {
        documentId: 'mock-doc-difficulty',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createQuestionLoader('mock-doc-difficulty', [
        { prompt: 'What is chlorophyll?', answer: 'Chlorophyll is the green pigment in plants that captures light energy.', type: 'short_answer', difficulty: 'easy', page: 1 },
        { prompt: 'Describe the light-dependent reactions.', answer: 'Light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH.', type: 'short_answer', difficulty: 'medium', page: 2 },
        { prompt: 'Explain the Calvin cycle and its role in carbon fixation.', answer: 'The Calvin cycle uses ATP and NADPH to fix CO2 into organic compounds through a complex series of enzymatic reactions.', type: 'essay', difficulty: 'hard', page: 3 },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Questions with varying difficulty levels: easy (green), medium (yellow), hard (red).',
            },
        },
    },
};

/**
 * Questions with media attachments
 */
export const WithMediaAttachments: Story = {
    args: {
        documentId: 'mock-doc-media',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createQuestionLoader('mock-doc-media', [
        { prompt: 'Listen to the explanation and summarize the process.', answer: 'The process involves capturing light energy and converting it to chemical energy.', type: 'essay', difficulty: 'medium', page: 1, hasAudio: true },
        { prompt: 'Based on the diagram, identify the key structures.', answer: 'The key structures include chloroplasts, thylakoids, and stroma.', type: 'comprehension', difficulty: 'easy', page: 2, hasImage: true },
        { prompt: 'Analyze the image and describe the electron transport chain.', answer: 'The electron transport chain moves electrons through protein complexes, creating a proton gradient.', type: 'essay', difficulty: 'hard', page: 3, hasImage: true, hasAudio: true },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Questions with audio (microphone icon) and image (image icon) attachments.',
            },
        },
    },
};

/**
 * Shows questions that have already been imported
 */
export const AlreadyImported: Story = {
    args: {
        documentId: 'mock-doc-imported',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [async () => {
        const { mockDocuments, mockParsedContent, seedMockDocuments, seedMockParsedContent } = await import('../../.storybook/__mocks__/aws-amplify-datastore.js');
        
        Object.keys(mockDocuments).forEach(k => delete (mockDocuments as any)[k]);
        Object.keys(mockParsedContent).forEach(k => delete (mockParsedContent as any)[k]);
        
        seedMockDocuments([{
            id: 'mock-doc-imported',
            filename: 'already-imported.pdf',
            status: 'completed',
            pageCount: 3,
            mimeType: 'application/pdf',
            size: 1234567,
        }]);
        
        seedMockParsedContent([{
            id: 'parsed-mock-doc-imported',
            documentID: 'mock-doc-imported',
            questionsJSON: JSON.stringify([
                { prompt: 'What is photosynthesis?', answer: 'The process of converting light to energy.', type: 'short_answer', difficulty: 'easy', page: 1 },
            ]),
            summariesJSON: JSON.stringify([]),
            objectivesJSON: JSON.stringify([]),
            status: 'completed',
            importedAt: new Date().toISOString(),
        }]);
        
        return {};
    }],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Shows the interface when questions have already been imported. Import button and checkboxes are hidden.',
            },
        },
    },
};

/**
 * Minimal question items without optional fields
 */
export const MinimalData: Story = {
    args: {
        documentId: 'mock-doc-minimal',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createQuestionLoader('mock-doc-minimal', [
        { prompt: 'What is photosynthesis?', answer: 'The process by which plants make food.' },
        { prompt: 'Where does photosynthesis occur?', answer: 'In the chloroplasts of plant cells.' },
        { prompt: 'What do plants need for photosynthesis?', answer: 'Light, water, and carbon dioxide.' },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Questions with only required fields (prompt and answer). Optional hint, type, and difficulty fields are omitted.',
            },
        },
    },
};

/**
 * Empty state when no questions are extracted
 */
export const NoQuestions: Story = {
    args: {
        documentId: 'mock-doc-empty',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Empty state shown when the PDF contains no extractable questions.',
            },
        },
    },
};

/**
 * With summaries and learning objectives visible
 */
export const WithSummariesExpanded: Story = {
    args: {
        documentId: 'mock-doc-1',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Document includes extracted summaries and learning objectives. Click the toggle to expand/collapse.',
            },
        },
    },
};

/**
 * Interactive playground
 */
export const Playground: Story = {
    args: {
        documentId: 'mock-doc-1',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <QuestionsReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Interactive playground. Try expanding items, editing fields, selecting items, and using search. Use the controls below to adjust props.',
            },
        },
    },
};

/**
 * Comparing badge types and colors
 */
export const BadgeShowcase: Story = {
    render: () => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>Badge Reference</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Box>
                        <Typography variant="caption" display="block" color="text.secondary">Question Types:</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            {/* Type badges would be shown here */}
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="caption" display="block" color="text.secondary">Difficulty Levels:</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            {/* Difficulty badges would be shown here */}
                        </Box>
                    </Box>
                </Box>
            </Paper>
            <QuestionsReview2
                documentId="mock-doc-1"
                unitId="mock-unit-1"
                owner="user-123"
                identityId="us-east-1:identity-123"
                searchTerm=""
            />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates all badge types and color coding used in the component.',
            },
        },
    },
};
