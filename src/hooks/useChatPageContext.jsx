/**
 * useChatPageContext - Register page-specific context with ChatContext
 * 
 * This hook allows pages to register their available context (unit, files, sections, etc.)
 * with the global ChatContext, making that context available to the chat sidebar.
 * 
 * @example
 * // In Unit Editor page
 * function UnitEditorPage() {
 *   const { unit, files, dictionary, questions } = useContext(UnitContext);
 *   const { sections } = useContext(SectionContext);
 *   const { vectorStoreSearch } = useContext(VectorStoreContext);
 *   const editorRef = useRef(null);
 *   
 *   useChatPageContext({
 *     unit,
 *     files,
 *     dictionary,
 *     questions,
 *     sections,
 *     editorRef,
 *     vectorStoreSearch,
 *   });
 *   
 *   return <...>
 * }
 * 
 * @see docs/GLOBAL_CHAT_INTEGRATION_PLAN.md
 */

import { useEffect, useContext } from 'react';
import ChatContext from '../context/chatContext';

/**
 * Register page context with global ChatContext
 * 
 * @param {object} context - Page-specific context to register
 * @param {object} [context.unit] - Current unit (from UnitContext)
 * @param {Array} [context.files] - Available files (from FilesContext)
 * @param {Array} [context.dictionary] - Vocabulary words (from DictionaryContext)
 * @param {Array} [context.questions] - Questions (from DictionaryContext)
 * @param {Array} [context.sections] - Sections (from SectionContext)
 * @param {object} [context.editorRef] - Lexical editor ref (for block insertion)
 * @param {Function} [context.vectorStoreSearch] - Vector store search function
 */
export function useChatPageContext(context = {}) {
    const { setPageContext } = useContext(ChatContext);
    
    const {
        unit = null,
        files = [],
        dictionary = [],
        questions = [],
        sections = [],
        editorRef = null,
        vectorStoreSearch = null,
    } = context;
    
    useEffect(() => {
        console.log('[useChatPageContext] Registering page context:', {
            hasUnit: !!unit,
            filesCount: files?.length || 0,
            dictionaryCount: dictionary?.length || 0,
            questionsCount: questions?.length || 0,
            sectionsCount: sections?.length || 0,
            hasEditorRef: !!editorRef,
            hasVectorStoreSearch: !!vectorStoreSearch,
        });
        
        setPageContext({
            unit,
            files,
            dictionary,
            questions,
            sections,
            editorRef,
            vectorStoreSearch,
        });
        
        // Cleanup: reset to empty context when component unmounts
        return () => {
            console.log('[useChatPageContext] Cleaning up page context');
            setPageContext({
                unit: null,
                files: [],
                dictionary: [],
                questions: [],
                sections: [],
                editorRef: null,
                vectorStoreSearch: null,
            });
        };
    }, [
        // Dependencies - update when any context changes
        unit?.id,
        files?.length,
        dictionary?.length,
        questions?.length,
        sections?.length,
        editorRef?.current,
        vectorStoreSearch,
        setPageContext,
    ]);
}

export default useChatPageContext;
