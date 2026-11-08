/**
 * @fileoverview Utilities for importing vocabulary from ParsedContent to Word dictionary
 * Handles duplicate detection, Word creation, and Unit linking
 */

import { getAmplifyClient } from './amplifyClient';
import { assertParsedContentImportAllowed } from './parsedContentModeration';
import { VOCABULARY_FIELDS, pickEntries, toEntryList } from './parsedContentLists';
import { loadMergedParsedContent, patchMergedListEntries, updateMergedListEntry } from './parsedContentChunks';
import { indexLinksByItem, linkItemToDocument, listDocumentLinks } from './documentLinks';
import {
    findExistingByField,
    IMPORT_CONCURRENCY,
    listUnitLinkIds,
    mapWithConcurrency,
    matchKey,
    singleFlight,
} from './importBatch';
// Type import removed - not needed in runtime JS

/**
 * How many entries are imported at once. Imports are almost entirely network
 * latency, so a few in flight is far faster than one at a time, while staying
 * low enough not to be throttled.
 */
export { IMPORT_CONCURRENCY };

/**
 * Check if a word already exists in the dictionary
 *
 * Shares the batch lookup so a single check matches a word exactly as a whole
 * import would.
 * @param {string} phrase - The word/phrase to check
 * @param {string} owner - Owner of the word
 * @returns {Promise<Word|null>} Existing word or null
 */
export async function findExistingWord(phrase, owner) {
    const client = getAmplifyClient();
    const found = await findExistingByField(client.models.Word, 'phrase', [phrase]);
    return found.get(matchKey(phrase)) ?? null;
}

/**
 * Create a new Word in the dictionary
 * @param {Object} vocabularyItem - Vocabulary item from ParsedContent.vocabularyJSON
 * @param {string} owner - Owner of the word
 * @param {string} identityId - Identity ID for auth
 * @returns {Promise<Word>} Created word
 */
export async function createWord(vocabularyItem, owner, identityId) {
    const client = getAmplifyClient();
    const { word, definition, context, page } = vocabularyItem;
    
    const { data: newWord } = await client.models.Word.create({
        phrase: word,
        definition: definition,
        owner: owner,
        identityId: identityId,
        // Store context and page in a structured way if needed
        // Could add these fields to the Word model if desired
    });
    
    return newWord;
}

/**
 * Link a Word to a Unit via UnitWord junction table
 * @param {string} wordId - ID of the Word
 * @param {string} unitId - ID of the Unit
 * @param {string} owner - Owner of the relationship
 * @param {Map<string, Object>} [existing] - Links already loaded for the unit, by word id
 * @returns {Promise<UnitWord>} Created UnitWord relationship
 */
export async function linkWordToUnit(wordId, unitId, owner, existing = undefined) {
    const client = getAmplifyClient();
    // The unit's links are loaded once by a batch import, so only look them up
    // here when this is a standalone call.
    if (existing) {
        const known = existing.get(wordId);
        if (known) return known;
    } else {
        const { data: found } = await client.models.UnitWord.list({
            filter: {
                and: [
                    { wordID: { eq: wordId } },
                    { unitID: { eq: unitId } }
                ]
            }
        });
        if (found && found.length > 0) {
            console.log(`Word ${wordId} already linked to Unit ${unitId}`);
            return found[0];
        }
    }

    const { data: unitWord } = await client.models.UnitWord.create({
        wordID: wordId,
        unitID: unitId,
        owner: owner,
    });
    return unitWord;
}

/**
 * Link a Word to a Document via DocumentWord junction table, once.
 * The page and source snippet are read from the document's ParsedContent, not stored.
 * @param {string} wordId - ID of the Word
 * @param {string} documentId - ID of the Document
 * @param {string} owner - Owner of the relationship
 * @param {Map<string, Object>} [existing] - Links already loaded for the document, by word id
 * @returns {Promise<Object|null>} The DocumentWord link or null
 */
export async function linkWordToDocument(wordId, documentId, owner, existing = undefined) {
    return linkItemToDocument(getAmplifyClient(), 'word', {
        itemId: wordId,
        documentId,
        owner,
        existing,
    });
}

/**
 * Import vocabulary items from ParsedContent to Word dictionary
 * @param {string} parsedContentId - ID of the ParsedContent record
 * @param {string} unitId - ID of the Unit to link words to
 * @param {number[]} selectedIndices - Array of vocabulary item indices to import (or null for all)
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
        const client = getAmplifyClient();
        // The setup below is several round trips, so it is reported too: the
        // progress bar is on screen from the click rather than appearing only
        // once the first word is reached.
        const report = (current, total, message) => onProgress?.(current, total, message);
        report(0, 0, 'Loading the document…');
        // Fetch the ParsedContent record; a long document is stored as several
        // chunks, merged into one record here
        const parsedContent = await loadMergedParsedContent(client, { id: parsedContentId });
        
        if (!parsedContent) {
            throw new Error(`ParsedContent not found: ${parsedContentId}`);
        }
        await assertParsedContentImportAllowed(client, parsedContent);
        
        // Parse the vocabularyJSON
        const vocabularyItems = toEntryList(parsedContent.vocabularyJSON);
        
        if (vocabularyItems.length === 0) {
            return {
                success: true,
                imported: 0,
                skipped: 0,
                errors: 0,
                message: 'No vocabulary items to import',
            };
        }
        
        // Filter items if specific indices are selected, remembering where each sits in the merged list
        const indexedItems = vocabularyItems
            .map((item, index) => ({ item, index }))
            .filter(({ index }) => !selectedIndices || selectedIndices.includes(index));
        const itemsToImport = indexedItems.map(({ item }) => item);
        // The Word each entry became, written back onto the entry afterwards
        const entryReferences = new Map();
        
        const results = {
            success: true,
            imported: 0,
            skipped: 0,
            errors: 0,
            errorDetails: [],
            importedWords: [],
        };
        
        const total = itemsToImport.length;

        // Everything the loop needs to look up, fetched once. Each of these
        // replaces one filtered scan per word.
        report(0, total, 'Checking the dictionary…');
        const documentId = parsedContent.documentID || null;
        const resolvedItems = itemsToImport.map(resolveVocabularyEntry);
        const [existingWords, unitLinks, documentLinks] = await Promise.all([
            findExistingByField(client.models.Word, 'phrase', resolvedItems.map((item) => item.word)),
            unitId
                ? listUnitLinkIds(client.models.UnitWord, 'unitID', unitId, 'wordID')
                : Promise.resolve(new Map()),
            documentId
                ? listDocumentLinks(client, documentId, 'word').then((links) =>
                      indexLinksByItem('word', links))
                : Promise.resolve(undefined),
        ]);

        // Words created during this run, so a repeated entry reuses the first
        // one instead of racing another create against it.
        const createOnce = singleFlight();
        const linkOnce = singleFlight();
        // Claimed synchronously, before any await, so exactly one entry per
        // word is counted as created however the workers interleave.
        const claimed = new Set();
        let completed = 0;

        await mapWithConcurrency(resolvedItems, IMPORT_CONCURRENCY, async (item, i) => {
            try {
                const key = matchKey(item.word);
                const existingWord = existingWords.get(key) ?? null;

                let wordToLink;
                let created = false;
                if (existingWord) {
                    wordToLink = existingWord;
                } else {
                    created = !claimed.has(key);
                    claimed.add(key);
                    // Whichever entry claims the word creates it; the rest wait
                    // on that same create and count as duplicates.
                    wordToLink = await createOnce(key, () => createWord(item, owner, identityId));
                }
                if (created) results.imported++;
                else results.skipped++;

                // Several entries can resolve to one word, so its links are
                // made once rather than once per entry.
                await linkOnce(wordToLink.id, async () => {
                    if (unitId && !unitLinks.has(wordToLink.id)) {
                        unitLinks.set(
                            wordToLink.id,
                            await linkWordToUnit(wordToLink.id, unitId, owner, unitLinks),
                        );
                    }
                    if (documentId) {
                        await linkWordToDocument(wordToLink.id, documentId, owner, documentLinks);
                    }
                    return wordToLink.id;
                });

                entryReferences.set(indexedItems[i].index, { wordID: wordToLink.id });

                results.importedWords.push({
                    wordId: wordToLink.id,
                    phrase: wordToLink.phrase,
                    isNew: created,
                });
            } catch (error) {
                console.error(`Error importing word "${item.word}":`, error);
                results.errors++;
                results.errorDetails.push({
                    word: item.word,
                    error: error.message,
                });
            } finally {
                report(++completed, total, `Processing: ${item.word}`);
            }
        });
        
        report(total, total, 'Saving the dictionary…');
        // Mark ParsedContent as imported
        if (parsedContent) {
            await client.models.ParsedContent.update({
                id: parsedContent.id,
                importedAt: new Date().toISOString(),
                _version: parsedContent._version,
            });
        }

        // Record on each entry the Word it became, so its document link can find
        // its page and source and the review screen can show it as imported
        if (entryReferences.size > 0) {
            try {
                await patchMergedListEntries(
                    client,
                    parsedContent,
                    'vocabularyJSON',
                    entryReferences,
                    (entries) => pickEntries(entries, VOCABULARY_FIELDS),
                );
            } catch (error) {
                console.error('Could not record imported words on their entries:', error);
                results.warning = `Imported, but could not mark the entries as imported: ${error.message}`;
            }
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
        const client = getAmplifyClient();
        const parsedContent = await loadMergedParsedContent(client, { id: parsedContentId });
        
        if (!parsedContent) {
            return {
                found: false,
                imported: false,
                itemCount: 0,
            };
        }
        
        const vocabularyItems = toEntryList(parsedContent.vocabularyJSON);
        
        return {
            found: true,
            imported: !!parsedContent.importedAt,
            // ParsedContent has no approved field; an import implies approval.
            approved: !!parsedContent.importedAt,
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
/**
 * The text to show and import for an entry: a reviewer's correction when there
 * is one, otherwise what the analysis extracted.
 */
export function resolveVocabularyEntry(item) {
    const edited = item?.edited || {};
    return {
        ...item,
        word: edited.word ?? item?.word,
        definition: edited.definition ?? item?.definition,
        context: edited.context ?? item?.context,
    };
}

/**
 * Records a reviewer's correction. Corrections are stored under `edited` so the
 * extracted definition, its source passage and the entry's other occurrences
 * stay as the analysis produced them.
 */
export async function updateVocabularyItem(parsedContentId, itemIndex, updates) {
    try {
        const client = getAmplifyClient();
        const parsedContent = await loadMergedParsedContent(client, { id: parsedContentId });
        
        if (!parsedContent) {
            throw new Error(`ParsedContent not found: ${parsedContentId}`);
        }
        
        const EDITABLE = ['word', 'definition', 'context'];
        const current = toEntryList(parsedContent.vocabularyJSON)[itemIndex] || {};
        const edits = Object.fromEntries(
            Object.entries(updates).filter(([field]) => EDITABLE.includes(field)),
        );
        const entryUpdates = Object.fromEntries(
            Object.entries(updates).filter(([field]) => !EDITABLE.includes(field)),
        );
        if (Object.keys(edits).length > 0) {
            entryUpdates.edited = { ...(current.edited || {}), ...edits };
        }

        // Writes only the chunk that holds the vocabulary item
        await updateMergedListEntry(
            client,
            parsedContent,
            'vocabularyJSON',
            itemIndex,
            entryUpdates,
            (entries) => pickEntries(entries, VOCABULARY_FIELDS),
        );
        
        return true;
        
    } catch (error) {
        console.error('Error updating vocabulary item:', error);
        return false;
    }
}
