/**
 * @fileoverview Storybook stories for VocabularyReview2 component
 * 
 * Interactive stories demonstrating vocabulary review functionality with:
 * - Mock parsed content from PDF analysis
 * - Virtual scrolling with large vocabularies
 * - Search/filter interactions
 * - Import workflow demonstrations
 * - Lexical inline editing
 * 
 * @module components/VocabularyReview2.stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';
import { within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VocabularyReview2 from './VocabularyReview2';
import { Box, Paper } from '@mui/material';
import { DemoBanner } from '../../.storybook/components/DemoBanner';

// Shared loader function for all stories
const createVocabularyLoader = (documentId: string, vocabulary: any[]) => {
    return async () => {
        const { mockDocuments, mockParsedContent, seedMockDocuments, seedMockParsedContent } = await import('../../.storybook/__mocks__/aws-amplify-data.js');
        
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
        
        // Seed parsed content with vocabulary
        seedMockParsedContent([{
            id: `parsed-${documentId}`,
            documentID: documentId,
            vocabularyJSON: JSON.stringify(vocabulary),
            summariesJSON: JSON.stringify([]),
            objectivesJSON: JSON.stringify([]),
            status: 'completed',
        }]);
        
        return {};
    };
};

const meta: Meta<typeof VocabularyReview2> = {
    title: '📁 Managing Content/Vocabulary Review',
    component: VocabularyReview2,
    parameters: {
        layout: 'padded',
        initializeMockData: false,
        docs: {
            description: {
                component: `
# VocabularyReview2 Component

Enhanced vocabulary review panel for PDF analysis with modern UX improvements.

## ✨ Key Features

### Lexical-Powered Editing
- **Unified Undo/Redo**: Cmd+Z/Cmd+Shift+Z works across all fields
- **Always-On Editing**: Click any field to start editing immediately
- **Auto-Save**: Changes save automatically after 1 second of inactivity
- **Search Highlighting**: Search terms automatically highlighted in real-time

### Virtual Scrolling
- **Performance**: Handles thousands of vocabulary items smoothly
- **TanStack Virtual**: Only renders visible items for optimal performance
- **Dynamic Heights**: Automatically adjusts to expanded/collapsed states

### Polished UI
- **Better Cards**: Alternating row colors, hover states, smooth transitions
- **Status Badges**: Clear indicators for existing words, page numbers
- **Expand/Collapse**: Obvious affordances with icons and smooth animations
- **Import States**: Clear visual feedback for import status

### Smart Features
- **Duplicate Detection**: Automatically detects words already in dictionary
- **Bulk Selection**: Select/deselect all with one click
- **Progress Tracking**: Real-time import progress with detailed feedback
- **Summaries**: Collapsible section for document summaries and learning objectives

## Use Cases
1. Review AI-extracted vocabulary from uploaded PDFs
2. Edit vocabulary definitions and context inline
3. Select specific words to import into unit dictionary
4. Search and filter large vocabulary lists
5. Track import status and duplicates

## Workflow
1. Upload PDF document for analysis
2. AI extracts vocabulary with definitions and context
3. Review extracted words in this panel
4. Edit any fields inline (auto-saves)
5. Select words to import
6. Import to unit dictionary

## Improvements from V1
- ✅ Lexical editors with unified undo/redo
- ✅ Virtual scrolling for performance
- ✅ Search term highlighting
- ✅ Auto-save with debouncing
- ✅ Better card design with badges
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
                    PDF analysis and vocabulary extraction powered by OpenAI. Data is mocked for demonstration.
                </DemoBanner>
                <Story />
            </Box>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof VocabularyReview2>;

// Mock data helpers - for future use with loaders
/*
const createMockVocabulary = (count: number, options: any = {}) => {
    const words = [
        { word: '光合成', phonetic: 'こうごうせい', definition: 'Photosynthesis - the process by which plants convert light energy into chemical energy', context: '植物は光合成によってエネルギーを作ります。', page: 1 },
        { word: '葉緑体', phonetic: 'ようりょくたい', definition: 'Chloroplast - organelle in plant cells where photosynthesis occurs', context: '葉緑体は光合成の場所です。', page: 1 },
        { word: '二酸化炭素', phonetic: 'にさんかたんそ', definition: 'Carbon dioxide - gas used by plants in photosynthesis', context: '植物は二酸化炭素を吸収します。', page: 2 },
        { word: '酸素', phonetic: 'さんそ', definition: 'Oxygen - gas released by plants during photosynthesis', context: '光合成で酸素が作られます。', page: 2 },
        { word: 'グルコース', phonetic: 'ぐるこーす', definition: 'Glucose - simple sugar produced by photosynthesis', context: 'グルコースは植物の栄養源です。', page: 3 },
        { word: '太陽光', phonetic: 'たいようこう', definition: 'Sunlight - light energy from the sun used in photosynthesis', context: '太陽光は光合成に必要です。', page: 3 },
        { word: '水分', phonetic: 'すいぶん', definition: 'Water - essential component for photosynthesis', context: '植物は根から水分を吸収します。', page: 4 },
        { word: '細胞', phonetic: 'さいぼう', definition: 'Cell - basic unit of life in organisms', context: '植物の細胞には葉緑体があります。', page: 4 },
        { word: '栄養素', phonetic: 'えいようそ', definition: 'Nutrient - substance providing nourishment', context: '光合成で作られた栄養素は植物全体に運ばれます。', page: 5 },
        { word: '生態系', phonetic: 'せいたいけい', definition: 'Ecosystem - biological community of interacting organisms', context: '植物は生態系の基礎です。', page: 5 },
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        const template = words[i % words.length];
        result.push({
            ...template,
            word: count > words.length ? `${template.word}_${Math.floor(i / words.length) + 1}` : template.word,
            ...options,
        });
    }
    return result;
};

const createMockParsedContent = (vocabItems: any[]) => ({
    id: 'mock-parsed-content-1',
    documentID: 'mock-doc-1',
    vocabularyJSON: JSON.stringify(vocabItems),
    summariesJSON: JSON.stringify([
        {
            title: 'Overview of Photosynthesis',
            content: 'Photosynthesis is the process by which plants use sunlight to convert carbon dioxide and water into glucose and oxygen.',
        },
        {
            title: 'Importance in Ecosystems',
            content: 'Photosynthesis is fundamental to life on Earth, providing oxygen and serving as the base of most food chains.',
        },
    ]),
    objectivesJSON: JSON.stringify([
        { objective: 'Understand the basic process of photosynthesis' },
        { objective: 'Identify the key components required for photosynthesis' },
        { objective: 'Explain the role of chloroplasts in plant cells' },
        { objective: 'Describe the products of photosynthesis' },
    ]),
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
});

const createMockDocument = () => ({
    id: 'mock-doc-1',
    filename: 'japanese-lesson-photosynthesis.pdf',
    pageCount: 5,
    mimeType: 'application/pdf',
    size: 1234567,
});
*/

/**
 * Default state with 10 vocabulary items ready for review
 */
export const Default: Story = {
    args: {
        documentId: 'mock-doc-1',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createVocabularyLoader('mock-doc-1', [
        { word: '光合成', phonetic: 'こうごうせい', definition: 'Photosynthesis - the process by which plants convert light energy into chemical energy', context: '植物は光合成によってエネルギーを作ります。', page: 1 },
        { word: '葉緑体', phonetic: 'ようりょくたい', definition: 'Chloroplast - organelle in plant cells where photosynthesis occurs', context: '葉緑体は光合成の場所です。', page: 1 },
        { word: '二酸化炭素', phonetic: 'にさんかたんそ', definition: 'Carbon dioxide - gas used by plants in photosynthesis', context: '植物は二酸化炭素を吸収します。', page: 2 },
        { word: '酸素', phonetic: 'さんそ', definition: 'Oxygen - gas released by plants during photosynthesis', context: '光合成で酸素が作られます。', page: 2 },
        { word: 'グルコース', phonetic: 'ぐるこーす', definition: 'Glucose - simple sugar produced by photosynthesis', context: 'グルコースは植物の栄養源です。', page: 3 },
        { word: '太陽光', phonetic: 'たいようこう', definition: 'Sunlight - light energy from the sun used in photosynthesis', context: '太陽光は光合成に必要です。', page: 3 },
        { word: '水分', phonetic: 'すいぶん', definition: 'Water - essential component for photosynthesis', context: '植物は根から水分を吸収します。', page: 4 },
        { word: '細胞', phonetic: 'さいぼう', definition: 'Cell - basic unit of life in organisms', context: '植物の細胞には葉緑体があります。', page: 4 },
        { word: '栄養素', phonetic: 'えいようそ', definition: 'Nutrient - substance providing nourishment', context: '光合成で作られた栄養素は植物全体に運ばれます。', page: 5 },
        { word: '生態系', phonetic: 'せいたいけい', definition: 'Ecosystem - biological community of interacting organisms', context: '植物は生態系の基礎です。', page: 5 },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <VocabularyReview2 {...args} />
        </Box>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        
        // Wait for vocabulary items to load
        await waitFor(() => {
            expect(canvas.getByText('光合成')).toBeInTheDocument();
        }, { timeout: 5000 });
        
        // Verify multiple vocabulary items are visible
        expect(canvas.getByText('葉緑体')).toBeInTheDocument();
        expect(canvas.getByText('酸素')).toBeInTheDocument();
        
        // Select first vocabulary item checkbox
        const checkboxes = canvas.getAllByRole('checkbox');
        if (checkboxes.length > 1) { // First is "select all"
            await userEvent.click(checkboxes[1]);
        }
    },
    parameters: {
        docs: {
            description: {
                story: 'Default view with extracted vocabulary ready for review. Click any row to expand and edit inline. Changes auto-save after 1 second.',
            },
        },
    },
};

/**
 * With search term highlighting specific words
 */
export const WithSearchHighlight: Story = {
    args: {
        documentId: 'mock-doc-1',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '光合成',
    },
    loaders: [createVocabularyLoader('mock-doc-1', [
        { word: '光合成', phonetic: 'こうごうせい', definition: 'Photosynthesis - the process by which plants convert light energy into chemical energy', context: '植物は光合成によってエネルギーを作ります。', page: 1 },
        { word: '葉緑体', phonetic: 'ようりょくたい', definition: 'Chloroplast - organelle in plant cells where photosynthesis occurs', context: '葉緑体は光合成の場所です。', page: 1 },
        { word: '二酸化炭素', phonetic: 'にさんかたんそ', definition: 'Carbon dioxide - gas used by plants in photosynthesis', context: '植物は二酸化炭素を吸収します。', page: 2 },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <VocabularyReview2 {...args} />
        </Box>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        
        // Wait for vocabulary with search filtering
        await waitFor(() => {
            expect(canvas.getByText('光合成')).toBeInTheDocument();
        }, { timeout: 5000 });
        
        // Verify search highlights are visible (mark elements)
        const highlighted = canvas.getAllByText('光合成');
        expect(highlighted.length).toBeGreaterThan(0);
        
        // Verify filtered results (should show items containing search term)
        expect(canvas.getByText('葉緑体')).toBeInTheDocument();
    },
    parameters: {
        docs: {
            description: {
                story: 'Search term "光合成" is highlighted in yellow across all fields. Only matching items are shown.',
            },
        },
    },
};

/**
 * Large list with 100 items to demonstrate virtual scrolling
 */
export const LargeList: Story = {
    args: {
        documentId: 'mock-doc-large',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createVocabularyLoader('mock-doc-large', Array.from({ length: 100 }, (_, i) => ({
        word: `用語${i + 1}`,
        phonetic: `ようご${i + 1}`,
        definition: `Definition for term ${i + 1} - A comprehensive explanation of the vocabulary term.`,
        context: `用語${i + 1}は文脈の中で使われます。`,
        page: Math.floor(i / 10) + 1,
    })))],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
                <strong>Performance Test:</strong> This list contains 100 vocabulary items. 
                Virtual scrolling ensures smooth performance by only rendering visible items.
                Scroll to see smooth performance even with large datasets.
            </Paper>
            <VocabularyReview2 {...args} />
        </Box>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        
        // Wait for first items to load
        await waitFor(() => {
            expect(canvas.getByText('用語1')).toBeInTheDocument();
        }, { timeout: 5000 });
        
        // Verify virtual scrolling renders items
        expect(canvas.getByText(/用語2/)).toBeInTheDocument();
        
        // Verify select all checkbox is present
        const checkboxes = canvas.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
    },
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates virtual scrolling with 100 items. Only visible items are rendered for optimal performance.',
            },
        },
    },
};

/**
 * Shows vocabulary that has already been imported
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
        const { mockDocuments, mockParsedContent, seedMockDocuments, seedMockParsedContent } = await import('../../.storybook/__mocks__/aws-amplify-data.js');
        
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
            vocabularyJSON: JSON.stringify([
                { word: '光合成', phonetic: 'こうごうせい', definition: 'Photosynthesis', page: 1 },
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
            <VocabularyReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Shows the interface when vocabulary has already been imported. Import button and checkboxes are hidden.',
            },
        },
    },
};

/**
 * Minimal vocabulary items without optional fields
 */
export const MinimalData: Story = {
    args: {
        documentId: 'mock-doc-minimal',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createVocabularyLoader('mock-doc-minimal', [
        { word: '植物', definition: 'Plant' },
        { word: 'エネルギー', definition: 'Energy' },
        { word: '光', definition: 'Light' },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <VocabularyReview2 {...args} />
        </Box>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        
        // Wait for minimal vocabulary items
        await waitFor(() => {
            expect(canvas.getByText('植物')).toBeInTheDocument();
        }, { timeout: 5000 });
        
        // Verify all items render without optional fields
        expect(canvas.getByText('Plant')).toBeInTheDocument();
        expect(canvas.getByText('エネルギー')).toBeInTheDocument();
        expect(canvas.getByText('光')).toBeInTheDocument();
        
        // Click first row to expand inline editor
        const firstRow = canvas.getByText('植物').closest('[role="button"]');
        if (firstRow) {
            await userEvent.click(firstRow);
            
            // Wait for expanded content (definition field)
            await waitFor(() => {
                expect(canvas.getByText('Plant')).toBeVisible();
            }, { timeout: 3000 });
        }
    },
    parameters: {
        docs: {
            description: {
                story: 'Vocabulary items with only required fields (word and definition). Optional context and phonetic fields are omitted.',
            },
        },
    },
};

/**
 * Empty state when no vocabulary is extracted
 */
export const NoVocabulary: Story = {
    args: {
        documentId: 'mock-doc-empty',
        unitId: 'mock-unit-1',
        owner: 'user-123',
        identityId: 'us-east-1:identity-123',
        searchTerm: '',
    },
    loaders: [createVocabularyLoader('mock-doc-empty', [])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <VocabularyReview2 {...args} />
        </Box>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Empty state shown when the PDF contains no extractable vocabulary.',
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
            <VocabularyReview2 {...args} />
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
    loaders: [createVocabularyLoader('mock-doc-1', [
        { word: '光合成', phonetic: 'こうごうせい', definition: 'Photosynthesis', context: '植物は光合成をします。', page: 1 },
        { word: '葉緑体', phonetic: 'ようりょくたい', definition: 'Chloroplast', context: '葉緑体は植物にあります。', page: 1 },
    ])],
    render: (args) => (
        <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <VocabularyReview2 {...args} />
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
