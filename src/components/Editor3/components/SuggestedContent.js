/**
 * SuggestedContent - Wrappers for VocabularyReview2 and QuestionsReview2
 * 
 * These components are used in FileManager2 to display suggested vocabulary
 * and questions from parsed PDF content.
 */

import React from 'react';
import VocabularyReview2 from '../../VocabularyReview2';
import QuestionsReview2 from '../../QuestionsReview2';

/**
 * SuggestedVocabulary - Wrapper for VocabularyReview2
 * 
 * @param {Object} props
 * @param {string} props.documentId - Document ID
 * @param {string} props.fileId - File ID (optional)
 * @param {string} props.unitId - Unit ID
 * @param {boolean} props.enableInlineEditing - Enable inline editing (always true for Review2)
 * @param {Function} props.onImport - Callback when import is complete
 */
export const SuggestedVocabulary = ({ 
    documentId, 
    fileId, 
    unitId, 
    enableInlineEditing = true,
    onImport 
}) => {
    const handleImportComplete = (result) => {
        if (onImport && result.imported) {
            onImport(result.imported);
        }
    };

    return (
        <VocabularyReview2
            documentId={documentId}
            unitId={unitId}
            owner="current-user" // This will be overridden by the component's internal auth check
            identityId="current-identity" // This will be overridden by the component's internal auth check
            onImportComplete={handleImportComplete}
            searchTerm=""
        />
    );
};

/**
 * SuggestedQuestions - Wrapper for QuestionsReview2
 * 
 * @param {Object} props
 * @param {string} props.documentId - Document ID
 * @param {string} props.fileId - File ID (optional)
 * @param {string} props.unitId - Unit ID
 * @param {boolean} props.enableInlineEditing - Enable inline editing (always true for Review2)
 * @param {Function} props.onImport - Callback when import is complete
 */
export const SuggestedQuestions = ({ 
    documentId, 
    fileId, 
    unitId, 
    enableInlineEditing = true,
    onImport 
}) => {
    const handleImportComplete = (result) => {
        if (onImport && result.imported) {
            onImport(result.imported);
        }
    };

    return (
        <QuestionsReview2
            documentId={documentId}
            unitId={unitId}
            owner="current-user" // This will be overridden by the component's internal auth check
            identityId="current-identity" // This will be overridden by the component's internal auth check
            onImportComplete={handleImportComplete}
            searchTerm=""
        />
    );
};
