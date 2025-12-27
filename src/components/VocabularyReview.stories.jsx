import React from 'react';
import VocabularyReview from './VocabularyReview';
import { seedVocabularyReviewData } from '../../.storybook/__mocks__/seedData';

export default {
    title: 'Components/VocabularyReview',
    component: VocabularyReview,
    parameters: {
        layout: 'padded',
    },
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
};

