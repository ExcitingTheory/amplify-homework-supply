/**
 * Seed Data for Storybook Stories
 * 
 * This file provides helpers to seed mock data for various components.
 * Import and use these in story loaders or decorators.
 */

import { seedMockUnit, seedMockGrade, seedMockFiles, seedMockSettings } from './aws-amplify-data';

/**
 * Mock vocabulary data for testing
 */
export const mockVocabularyJSON = [
    {
        word: '勉強',
        definition: 'study; studying',
        context: 'I study Japanese every day.',
        page: 1
    },
    {
        word: '学校',
        definition: 'school',
        context: 'I go to school by train.',
        page: 1
    },
    {
        word: '本',
        definition: 'book',
        context: 'This is an interesting book.',
        page: 2
    },
    {
        word: '先生',
        definition: 'teacher',
        context: 'My teacher is very kind.',
        page: 2
    },
    {
        word: '学生',
        definition: 'student',
        context: 'There are many students in the classroom.',
        page: 3
    },
];

export const mockSummariesJSON = [
    {
        title: 'Education Vocabulary',
        content: 'This chapter introduces common vocabulary related to education and school life.',
        page_range: '1-3'
    }
];

export const mockObjectivesJSON = [
    {
        objective: 'Students will be able to identify and use basic education-related vocabulary in Japanese.',
        bloom_level: 'Remember'
    },
    {
        objective: 'Students will be able to construct simple sentences about their school life.',
        bloom_level: 'Apply'
    }
];

/**
 * Seed helpers that can be imported into mock DataStore
 */
export const seedVocabularyReviewData = {
    /**
     * Seeds data for vocabulary review with unapproved ParsedContent
     */
    async withUnapprovedVocabulary({ documentId, unitId, owner, identityId }) {
        const docId = documentId || `doc-${Date.now()}`;
        const unitIdVal = unitId || `unit-${Date.now()}`;
        const ownerVal = owner || 'test-user';
        const identityIdVal = identityId || 'us-east-1:123';

        // Import directly into DataStore mock storage
        const { mockDocuments, mockParsedContent } = await import('./aws-amplify-data');
        
        // Create document
        const document = {
            id: docId,
            filename: 'japanese_textbook_chapter1.pdf',
            s3Key: `protected/${identityIdVal}/japanese_textbook_chapter1.pdf`,
            status: 'completed',
            owner: ownerVal,
            identityId: identityIdVal,
            pageCount: 5,
            fileSize: 1024000,
            mimeType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
        };
        mockDocuments[docId] = document;

        // Create parsed content
        const parsedContentId = `parsed-${Date.now()}`;
        const parsedContent = {
            id: parsedContentId,
            documentID: docId,
            owner: ownerVal,
            identityId: identityIdVal,
            vocabularyJSON: JSON.stringify(mockVocabularyJSON),
            summariesJSON: JSON.stringify(mockSummariesJSON),
            objectivesJSON: JSON.stringify(mockObjectivesJSON),
            responseId: 'chatcmpl-123456',
            modelUsed: 'gpt-4',
            tokensUsed: 1500,
            approved: false,
            importedAt: null,
        };
        mockParsedContent[parsedContentId] = parsedContent;

        console.log('[SeedData] Created document and unapproved ParsedContent');
        
        return {
            documentId: docId,
            unitId: unitIdVal,
            owner: ownerVal,
            identityId: identityIdVal,
        };
    },

    /**
     * Seeds data with already imported vocabulary
     */
    async withImportedVocabulary({ documentId, unitId, owner, identityId }) {
        const docId = documentId || `doc-${Date.now()}`;
        const unitIdVal = unitId || `unit-${Date.now()}`;
        const ownerVal = owner || 'test-user';
        const identityIdVal = identityId || 'us-east-1:123';

        const { mockDocuments, mockParsedContent } = await import('./aws-amplify-data');
        
        // Create document
        const document = {
            id: docId,
            filename: 'japanese_textbook_chapter1.pdf',
            s3Key: `protected/${identityIdVal}/japanese_textbook_chapter1.pdf`,
            status: 'completed',
            owner: ownerVal,
            identityId: identityIdVal,
            pageCount: 5,
            fileSize: 1024000,
            mimeType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
        };
        mockDocuments[docId] = document;

        // Create parsed content marked as imported
        const parsedContentId = `parsed-${Date.now()}`;
        const parsedContent = {
            id: parsedContentId,
            documentID: docId,
            owner: ownerVal,
            identityId: identityIdVal,
            vocabularyJSON: JSON.stringify(mockVocabularyJSON),
            summariesJSON: JSON.stringify(mockSummariesJSON),
            objectivesJSON: JSON.stringify(mockObjectivesJSON),
            responseId: 'chatcmpl-123456',
            modelUsed: 'gpt-4',
            tokensUsed: 1500,
            approved: true,
            importedAt: new Date().toISOString(),
        };
        mockParsedContent[parsedContentId] = parsedContent;

        console.log('[SeedData] Created document and imported ParsedContent');
        
        return {
            documentId: docId,
            unitId: unitIdVal,
            owner: ownerVal,
            identityId: identityIdVal,
        };
    },

    /**
     * Seeds data with existing words in dictionary
     */
    async withExistingWords({ documentId, unitId, owner, identityId }) {
        const result = await seedVocabularyReviewData.withUnapprovedVocabulary({
            documentId,
            unitId,
            owner,
            identityId
        });

        const { mockWords } = await import('./aws-amplify-data');
        
        // Add some existing words to dictionary
        mockWords['word-1'] = {
            id: 'word-1',
            phrase: '勉強',
            definition: 'study (existing definition)',
            pronunciation: 'べんきょう',
            owner: result.owner,
            identityId: result.identityId,
        };
        
        mockWords['word-2'] = {
            id: 'word-2',
            phrase: '学校',
            definition: 'school (existing definition)',
            pronunciation: 'がっこう',
            owner: result.owner,
            identityId: result.identityId,
        };

        console.log('[SeedData] Created existing words in dictionary');
        
        return result;
    },

    /**
     * Seeds data with no vocabulary (empty document)
     */
    async withNoVocabulary({ documentId, unitId, owner, identityId }) {
        const docId = documentId || `doc-${Date.now()}`;
        const unitIdVal = unitId || `unit-${Date.now()}`;
        const ownerVal = owner || 'test-user';
        const identityIdVal = identityId || 'us-east-1:123';

        const { mockDocuments } = await import('./aws-amplify-data');
        
        // Create document without ParsedContent
        const document = {
            id: docId,
            filename: 'empty_document.pdf',
            s3Key: `protected/${identityIdVal}/empty_document.pdf`,
            status: 'completed',
            owner: ownerVal,
            identityId: identityIdVal,
            pageCount: 1,
            fileSize: 10240,
            mimeType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
        };
        mockDocuments[docId] = document;

        console.log('[SeedData] Created empty document');
        
        return {
            documentId: docId,
            unitId: unitIdVal,
            owner: ownerVal,
            identityId: identityIdVal,
        };
    },
};
