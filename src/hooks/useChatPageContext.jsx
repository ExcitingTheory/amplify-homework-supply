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

import { useEffect, useContext, useRef } from "react";
import ChatContext from "../context/chatContext";

/**
 * Register page context with global ChatContext
 *
 * @param {object} context - Page-specific context to register
 * @param {object} [options] - Registration options
 * @param {boolean} [options.enabled=true] - Whether this page may register chat context
 * @param {object} [context.unit] - Current unit (from UnitContext)
 * @param {Array} [context.files] - Available files (from FilesContext)
 * @param {Array} [context.dictionary] - Vocabulary words (from DictionaryContext)
 * @param {Array} [context.questions] - Questions (from DictionaryContext)
 * @param {Array} [context.sections] - Sections (from SectionContext)
 * @param {object} [context.editorRef] - Lexical editor ref (for block insertion)
 * @param {Function} [context.vectorStoreSearch] - Vector store search function
 */
export function useChatPageContext(context = {}, options = {}) {
  const { setPageContext } = useContext(ChatContext);
  const enabled = options?.enabled !== false;

  const {
    unit = null,
    files = [],
    dictionary = [],
    questions = [],
    sections = [],
    editorRef = null,
    vectorStoreSearch = null,
  } = context;

  // Register on identity/size changes only: callers commonly pass fresh array
  // references every render, so depending on them directly would loop.
  const latestContextRef = useRef(null);
  useEffect(() => {
    latestContextRef.current = {
      unit,
      files,
      dictionary,
      questions,
      sections,
      editorRef,
    };
  });

  const unitId = unit?.id;
  const filesCount = files?.length;
  const dictionaryCount = dictionary?.length;
  const questionsCount = questions?.length;
  const sectionsCount = sections?.length;
  const editorInstance = editorRef?.current;

  useEffect(() => {
    if (!enabled) {
      setPageContext({
        unit: null,
        files: [],
        dictionary: [],
        questions: [],
        sections: [],
        editorRef: null,
        vectorStoreSearch: null,
      });
      return;
    }

    const latest = latestContextRef.current;

    console.log("[useChatPageContext] Registering page context:", {
      hasUnit: !!latest.unit,
      filesCount: latest.files?.length || 0,
      dictionaryCount: latest.dictionary?.length || 0,
      questionsCount: latest.questions?.length || 0,
      sectionsCount: latest.sections?.length || 0,
      hasEditorRef: !!latest.editorRef,
      hasVectorStoreSearch: !!vectorStoreSearch,
    });

    setPageContext({
      unit: latest.unit,
      files: latest.files,
      dictionary: latest.dictionary,
      questions: latest.questions,
      sections: latest.sections,
      editorRef: latest.editorRef,
      vectorStoreSearch,
    });

    // Cleanup: reset to empty context when component unmounts
    return () => {
      console.log("[useChatPageContext] Cleaning up page context");
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
    unitId,
    filesCount,
    dictionaryCount,
    questionsCount,
    sectionsCount,
    editorInstance,
    vectorStoreSearch,
    enabled,
    setPageContext,
  ]);
}

export default useChatPageContext;
