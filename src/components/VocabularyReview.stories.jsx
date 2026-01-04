import React from 'react';
import { Box } from '@mui/material';
import VocabularyReview from './VocabularyReview';
import { seedVocabularyReviewData } from '../../.storybook/__mocks__/seedData';
import { DemoBanner } from '../../.storybook/components/DemoBanner';

export default {
    title: 'Components/VocabularyReview',
    component: VocabularyReview,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
Review and import vocabulary extracted from PDF documents.

## Features
- **Document Analysis**: Displays vocabulary extracted by AI from uploaded PDFs
- **Review Interface**: Table view of vocabulary with phrase, definition, and context
- **Bulk Import**: Import selected vocabulary words into the unit dictionary
- **Duplicate Detection**: Highlights words that already exist in the dictionary
- **Status Tracking**: Shows import status and completion state

## Workflow
1. Upload a PDF document
2. AI analyzes and extracts vocabulary
3. Review extracted words in table format
4. Select words to import
5. Import to unit dictionary

All document analysis and vocabulary extraction is powered by OpenAI GPT-4.
                `.trim(),
            },
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <Box>
                <DemoBanner>
                    Document analysis and vocabulary extraction APIs are mocked with sample data.
                </DemoBanner>
                <Story />
            </Box>
        ),
    ],
};

/**
 * Default story - shows vocabulary ready for review and import
 */
export const Default = {
    loaders: [
        async () => {
            const data = await seedVocabularyReviewData.withUnapprovedVocabulary({});
            return { args: data };
        },
    ],
    render: (args, { loaded: { args: loadedArgs } }) => (
        <VocabularyReview
            {...loadedArgs}
            onImportComplete={(result) => {
                console.log('Import complete:', result);
            }}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Default state with extracted vocabulary ready for review and import into the dictionary.',
            },
        },
    },
};

/**
 * Shows vocabulary that has already been imported
 */
export const AlreadyImported = {
    loaders: [
        async () => {
            const data = await seedVocabularyReviewData.withImportedVocabulary({});
            return { args: data };
        },
    ],
    render: (args, { loaded: { args: loadedArgs } }) => (
        <VocabularyReview
            {...loadedArgs}
            onImportComplete={(result) => {
                console.log('Import complete:', result);
            }}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Shows the interface when vocabulary has already been imported from the document.',
            },
        },
    },
};

/**
 * Shows component when some vocabulary words already exist in the dictionary
 */
export const WithExistingWords = {
    loaders: [
        async () => {
            const data = await seedVocabularyReviewData.withExistingWords({});
            return { args: data };
        },
    ],
    render: (args, { loaded: { args: loadedArgs } }) => (
        <VocabularyReview
            {...loadedArgs}
            onImportComplete={(result) => {
                console.log('Import complete:', result);
            }}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Demonstrates duplicate detection when some extracted vocabulary already exists in the dictionary.',
            },
        },
    },
};

/**
 * Shows component when document has no vocabulary extracted
 */
export const NoVocabulary = {
    loaders: [
        async () => {
            const data = await seedVocabularyReviewData.withNoVocabulary({});
            return { args: data };
        },
    ],
    render: (args, { loaded: { args: loadedArgs } }) => (
        <VocabularyReview
            {...loadedArgs}
            onImportComplete={(result) => {
                console.log('Import complete:', result);
            }}
        />
    ),
    parameters: {
        docs: {
            description: {
                story: 'Empty state when the PDF document contains no extractable vocabulary.',
            },
        },
    },
};
