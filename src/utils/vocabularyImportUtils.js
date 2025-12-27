/**
 * @fileoverview Utilities for importing vocabulary from ParsedContent to Word dictionary
 * Handles duplicate detection, Word creation, and Unit linking
 */

import { DataStore } from 'aws-amplify/datastore';
import { Word, UnitWord, ParsedContent } from '../models';

/**
 * Check if a word already exists in the dictionary
 * @param {string} phrase - The word/phrase to check
 * @param {string} owner - Owner of the word
 * @returns {Promise<Word|null>} Existing word or null
 */
export async function findExistingWord(phrase, owner) {
    const normalizedPhrase = phrase.trim().toLowerCase();
    
    const existingWords = await DataStore.query(Word, (w) => 
        w.phrase.eq(phrase)
    );
    
    // Filter by owner or find closest match
    const exactMatch = existingWords.find(w => 
        w.phrase.trim().toLowerCase() === normalizedPhrase
    );
    
    return exactMatch || null;
}

/**
 * Create a new Word in the dictionary
 * @param {Object} vocabularyItem - Vocabulary item from ParsedContent.vocabularyJSON
 * @param {string} owner - Owner of the word
 * @param {string} identityId - Identity ID for auth
 * @returns {Promise<Word>} Created word
 */
export async function createWord(vocabularyItem, owner, identityId) {
    const { word, definition, context, page } = vocabularyItem;
    
    const newWord = await DataStore.save(
        new Word({
            phrase: word,
            definition: definition,
            owner: owner,
            identityId: identityId,
            // Store context and page in a structured way if needed
            // Could add these fields to the Word model if desired
        })
    );
    
    return newWord;
}

/**
 * Link a Word to a Unit via UnitWord junction table
 * @param {string} wordId - ID of the Word
 * @param {string} unitId - ID of the Unit
 * @param {string} owner - Owner of the relationship
 * @returns {Promise<UnitWord>} Created UnitWord relationship
 */
export async function linkWordToUnit(wordId, unitId, owner) {
    // Check if relationship already exists
    const existing = await DataStore.query(UnitWord, (uw) =>
        uw.and(uw => [
            uw.wordId.eq(wordId),
            uw.unitId.eq(unitId)
        ])
    );
    
    if (existing.length > 0) {
        console.log(`Word ${wordId} already linked to Unit ${unitId}`);
        return existing[0];
    }
    
    const unitWord = await DataStore.save(
        new UnitWord({
            wordId: wordId,
            unitId: unitId,
            owner: owner,
        })
    );
    
    return unitWord;
}

/**
 * Import vocabulary items from ParsedContent to Word dictionary
 * @param {string} parsedContentId - ID of the ParsedContent record
 * @param {string} unitId - ID of the Unit to link words to
 * @param {string[]} selectedIndices - Array of vocabulary item indices to import (or null for all)
 * @param {string} owner - Owner of the words
 * @param {string} identityId - Identity ID for auth
 * @param {Function} onProgress - Optional callback for progress updates (current, total, message)
 * @returns {Promise<Object>} Import results
 */
export async function importVocabularyToUnit(
    parsedContentId,
    unitId,
    selectedIndices = null,
    owner,
    identityId,
    onProgress = null
) {
    try {
        // Fetch the ParsedContent record
        const parsedContent = await DataStore.query(ParsedContent, parsedContentId);
        
        if (!parsedContent) {
            throw new Error(`ParsedContent not found: ${parsedContentId}`);
        }
        
        // Parse the vocabularyJSON
        const vocabularyItems = parsedContent.vocabularyJSON 
            ? JSON.parse(parsedContent.vocabularyJSON) 
            : [];
        
        if (vocabularyItems.length === 0) {
            return {
                success: true,
                imported: 0,
                skipped: 0,
                errors: 0,
                message: 'No vocabulary items to import',
            };
        }
        
        // Filter items if specific indices are selected
        const itemsToImport = selectedIndices 
            ? vocabularyItems.filter((_, index) => selectedIndices.includes(index))
            : vocabularyItems;
        
        const results = {
            success: true,
            imported: 0,
            skipped: 0,
            errors: 0,
            errorDetails: [],
            importedWords: [],
        };
        
        const total = itemsToImport.length;
        
        // Process each vocabulary item
        for (let i = 0; i < itemsToImport.length; i++) {
            const item = itemsToImport[i];
            
            if (onProgress) {
                onProgress(i + 1, total, `Processing: ${item.word}`);
            }
            
            try {
                // Check for existing word
                const existingWord = await findExistingWord(item.word, owner);
                
                let wordToLink;
                
                if (existingWord) {
                    // Word already exists, just link to unit
                    wordToLink = existingWord;
                    console.log(`Word already exists: ${item.word}`);
                    results.skipped++;
                } else {
                    // Create new word
                    wordToLink = await createWord(item, owner, identityId);
                    console.log(`Created new word: ${item.word}`);
                    results.imported++;
                }
                
                // Link word to unit
                if (unitId) {
                    await linkWordToUnit(wordToLink.id, unitId, owner);
                }
                
                results.importedWords.push({
                    wordId: wordToLink.id,
                    phrase: wordToLink.phrase,
                    isNew: !existingWord,
                });
                
            } catch (error) {
                console.error(`Error importing word "${item.word}":`, error);
                results.errors++;
                results.errorDetails.push({
                    word: item.word,
                    error: error.message,
                });
            }
        }
        
        // Update ParsedContent to mark as imported
        if (results.imported > 0 || results.skipped > 0) {
            await DataStore.save(
                ParsedContent.copyOf(parsedContent, updated => {
                    updated.approved = true;
                    updated.importedAt = new Date().toISOString();
                })
            );
        }
        
        if (onProgress) {
            onProgress(
                total,
                total,
                `Import complete: ${results.imported} new, ${results.skipped} existing, ${results.errors} errors`
            );
        }
        
        return results;
        
    } catch (error) {
        console.error('Error in importVocabularyToUnit:', error);
        return {
            success: false,
            imported: 0,
            skipped: 0,
            errors: 1,
            errorDetails: [{ error: error.message }],
            message: `Import failed: ${error.message}`,
        };
    }
}

/**
 * Get vocabulary import status for a ParsedContent record
 * @param {string} parsedContentId - ID of the ParsedContent record
 * @returns {Promise<Object>} Status information
 */
export async function getVocabularyImportStatus(parsedContentId) {
    try {
        const parsedContent = await DataStore.query(ParsedContent, parsedContentId);
        
        if (!parsedContent) {
            return {
                found: false,
                imported: false,
                itemCount: 0,
            };
        }
        
        const vocabularyItems = parsedContent.vocabularyJSON 
            ? JSON.parse(parsedContent.vocabularyJSON) 
            : [];
        
        return {
            found: true,
            imported: !!parsedContent.importedAt,
            approved: !!parsedContent.approved,
            importedAt: parsedContent.importedAt,
            itemCount: vocabularyItems.length,
            vocabularyItems: vocabularyItems,
        };
        
    } catch (error) {
        console.error('Error getting import status:', error);
        return {
            found: false,
            error: error.message,
        };
    }
}

/**
 * Update a vocabulary item before import (edit word/definition)
 * @param {string} parsedContentId - ID of the ParsedContent record
 * @param {number} itemIndex - Index of the vocabulary item to update
 * @param {Object} updates - Fields to update {word, definition, context, page}
 * @returns {Promise<boolean>} Success status
 */
export async function updateVocabularyItem(parsedContentId, itemIndex, updates) {
    try {
        const parsedContent = await DataStore.query(ParsedContent, parsedContentId);
        
        if (!parsedContent) {
            throw new Error(`ParsedContent not found: ${parsedContentId}`);
        }
        
        const vocabularyItems = parsedContent.vocabularyJSON 
            ? JSON.parse(parsedContent.vocabularyJSON) 
            : [];
        
        if (itemIndex < 0 || itemIndex >= vocabularyItems.length) {
            throw new Error(`Invalid item index: ${itemIndex}`);
        }
        
        // Update the item
        vocabularyItems[itemIndex] = {
            ...vocabularyItems[itemIndex],
            ...updates,
        };
        
        // Save updated ParsedContent
        await DataStore.save(
            ParsedContent.copyOf(parsedContent, updated => {
                updated.vocabularyJSON = JSON.stringify(vocabularyItems);
            })
        );
        
        return true;
        
    } catch (error) {
        console.error('Error updating vocabulary item:', error);
        return false;
    }
}
