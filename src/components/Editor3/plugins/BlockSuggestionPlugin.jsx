/**
 * Shares next-block suggestions with the open sidebar. Preview content and
 * accepted content use the same reference snapshot and Markdown as autocomplete.
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { $isHeadingNode, $createHeadingNode } from "@lexical/rich-text";
import { $isListNode } from "@lexical/list";
import { useCallback, useContext, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { $createQuizNode, $isQuizNode } from "./QuizPlugin";
import { $createAnswerNode, $isAnswerNode } from "./AnswerPlugin";
import { $createCustomAnswerNode, $isCustomAnswerNode } from "./CustomAnswerPlugin";
import UnitContext from "../../../context/unitContext";
import SectionContext from "../../../context/sectionContext";
import { useSuggestions } from "../context/SuggestionContext";
import { $replaceWithMarkdown } from "../utils/insertMarkdown";
import {
  buildSuggestionReferenceCatalog,
  placeMeaningAfterWordBlocks,
  resolveSuggestionReferences,
} from "./suggestionReferences";

function categorizeNode(node) {
  if (!node) return null;
  if ($isHeadingNode(node)) return "heading";
  if ($isQuizNode(node)) return "quiz";
  if ($isAnswerNode(node) || $isCustomAnswerNode(node)) return "practice";
  if ($isListNode(node)) return "example";
  if (node.getType() === "paragraph") {
    const text = node.getTextContent();
    if (text.length < 100) return "example";
    if (["summary", "conclusion", "in summary", "to recap", "in conclusion"]
      .some((keyword) => text.toLowerCase().includes(keyword))) return "summary";
    return "explanation";
  }
  return null;
}

const PATTERNS = {
  heading: [["paragraph", "addExplanation"]],
  explanation: [["answer", "addVocabularyPractice"], ["custom-answer", "addCustomPractice"], ["quiz", "addQuiz"]],
  example: [["answer", "addVocabularyPractice"], ["custom-answer", "addCustomPractice"], ["quiz", "addQuiz"]],
  practice: [["quiz", "addQuiz"], ["paragraph", "addSummary"], ["heading", "newSection"]],
  quiz: [["paragraph", "addSummary"], ["heading", "newSection"]],
  summary: [["heading", "newSection"]],
  default: [["heading", "addHeading"], ["paragraph", "addExplanation"]],
};

export default function BlockSuggestionPlugin({ useAI = false }) {
  const [editor] = useLexicalComposerContext();
  const t = useTranslations("editor.ai");
  const {
    active, setSuggestions, setIsLoadingAI, registerInsertCallback, setError,
  } = useSuggestions();
  const { unit, dictionary, questionBank, files } = useContext(UnitContext);
  const { sections, assignments } = useContext(SectionContext);
  const targetKey = useRef(null);
  const abortController = useRef(null);
  const timer = useRef(null);
  const lastSignature = useRef(null);

  const cancelRequest = useCallback(() => {
    clearTimeout(timer.current);
    abortController.current?.abort();
    abortController.current = null;
    setIsLoadingAI(false);
  }, [setIsLoadingAI]);

  const requestSuggestions = useCallback(async () => {
    if (!active || !useAI) return;
    cancelRequest();
    const controller = new AbortController();
    abortController.current = controller;
    setIsLoadingAI(true);
    setError(null);
    setSuggestions([]);
    try {
      const lastBlocks = editor.getEditorState().read(() => {
        const nodes = $getRoot().getChildren();
        const targetIndex = nodes.findIndex((node) => node.getKey() === targetKey.current);
        return nodes.slice(Math.max(0, targetIndex - 11), targetIndex + 1).map((node) => ({
          type: node.getType(),
          content: node.getTextContent().slice(0, 200),
        }));
      });
      const catalog = buildSuggestionReferenceCatalog(
        dictionary, questionBank, files,
        lastBlocks.map((block) => block.content).join(" "),
      );
      const sectionIds = new Set((assignments || [])
        .filter((assignment) => assignment.unitID === unit?.id)
        .map((assignment) => assignment.sectionID));
      const section = (sections || []).find((item) =>
        sectionIds.has(item.id) && item.courseOutline,
      );
      const outline = typeof section?.courseOutline === "string"
        ? JSON.parse(section.courseOutline) : section?.courseOutline;
      const courseOutline = Array.isArray(outline) ? outline.map((entry) => ({
        number: entry.number,
        name: entry.name,
        summary: entry.summary,
        isCurrent: entry.unitId === unit?.id,
      })) : undefined;
      const response = await fetch("/api/content-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: "Suggest the next complete lesson block based on the recent lesson content.",
          context: {
            mode: "block-suggestion",
            unit: unit ? { name: unit.name, description: unit.description } : null,
            lastBlocks,
            courseOutline,
            resources: catalog.resources,
          },
        }),
      });
      if (!response.ok) throw new Error(`Block suggestion failed: ${response.status}`);
      if (!response.body) throw new Error("Block suggestion response has no body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let markdown = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) return;
        markdown += decoder.decode(value, { stream: true });
      }
      markdown = placeMeaningAfterWordBlocks((markdown + decoder.decode()).trim());
      if (controller.signal.aborted) return;
      if (!markdown) throw new Error("No block suggestion returned");
      resolveSuggestionReferences(markdown, catalog.idByReference, catalog.fileById, catalog.questionById);
      setSuggestions([{
        type: "markdown",
        label: t("blockSuggestionMenu.suggestionsTitle"),
        markdown,
        referenceContext: catalog,
        targetKey: targetKey.current,
      }]);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("[BlockSuggestionPlugin] Suggestion failed:", error);
        setError(t("blockSuggestionMenu.error"));
      }
    } finally {
      if (abortController.current === controller) {
        abortController.current = null;
        setIsLoadingAI(false);
      }
    }
  }, [
    active, useAI, cancelRequest, editor, dictionary, questionBank, files,
    assignments, sections, unit, setIsLoadingAI, setError, setSuggestions, t,
  ]);

  useEffect(() => {
    if (!active) {
      cancelRequest();
      setSuggestions([]);
      setError(null);
      return;
    }
    lastSignature.current = null;
    const update = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        const node = $isRangeSelection(selection)
          ? selection.anchor.getNode() : null;
        const block = node
          ? node.getTopLevelElement() : $getNodeByKey(targetKey.current);
        const target = block || $getRoot().getLastChild();
        if (!target) return;
        targetKey.current = target.getKey();
        // JSON preserves custom-block changes even when text content is unchanged.
        const signature = JSON.stringify([targetKey.current, editor.getEditorState().toJSON()]);
        if (lastSignature.current === signature) return;
        lastSignature.current = signature;
        cancelRequest();
        setError(null);
        setSuggestions([]);
        if (useAI) {
          timer.current = setTimeout(requestSuggestions, 1000);
        } else {
          let previous = target;
          while (previous?.getType() === "paragraph" && !previous.getTextContent().trim()) {
            previous = previous.getPreviousSibling();
          }
          const patterns = PATTERNS[categorizeNode(previous)] || PATTERNS.default;
          setSuggestions(patterns.map(([type, label]) => ({
            type, label: t(`blockSuggestionPlugin.${label}`), targetKey: targetKey.current,
          })));
        }
      });
    };
    update();
    const unregister = editor.registerUpdateListener(({ tags }) => {
      if (!tags.has("skip-collab") && !tags.has("block-suggestion-accept")) update();
    });
    return () => {
      unregister();
      cancelRequest();
    };
  }, [active, editor, useAI, requestSuggestions, cancelRequest, setSuggestions, setError, t]);

  const insertSuggestion = useCallback((suggestion) => {
    if (!active) return;
    cancelRequest();
    editor.update(() => {
      try {
        const target = $getNodeByKey(suggestion.targetKey);
        if (!target?.isAttached()) throw new Error("Suggestion insertion block no longer exists");
        const context = suggestion.referenceContext;
        const markdown = suggestion.markdown
          ? resolveSuggestionReferences(
            suggestion.markdown, context.idByReference, context.fileById, context.questionById,
          ) : null;
        let host = target;
        if (target.getType() !== "paragraph" || target.getTextContent().trim()) {
          host = $createParagraphNode();
          target.insertAfter(host);
        }
        host.selectEnd();
        if (markdown) {
          const marker = $createTextNode("");
          host.append(marker);
          $replaceWithMarkdown(marker, markdown, "", context);
        } else {
          switch (suggestion.type) {
            case "heading":
              host.replace($createHeadingNode("h2")).selectEnd();
              break;
            case "quiz":
              host.replace($createQuizNode([]));
              break;
            case "answer":
              host.replace($createAnswerNode([], "translation", ["text"], ["phrase"]));
              break;
            case "custom-answer":
              host.replace($createCustomAnswerNode([]));
              break;
            default:
              host.selectEnd();
          }
        }
        setSuggestions([]);
        setError(null);
      } catch (error) {
        console.error("[BlockSuggestionPlugin] Cannot accept suggestion:", error);
        setError(t("blockSuggestionMenu.error"));
      }
    }, { tag: "block-suggestion-accept" });
  }, [active, cancelRequest, editor, setSuggestions, setError, t]);

  useEffect(() => {
    registerInsertCallback(insertSuggestion, requestSuggestions);
    return () => registerInsertCallback(null, null);
  }, [registerInsertCallback, insertSuggestion, requestSuggestions]);

  return null;
}
