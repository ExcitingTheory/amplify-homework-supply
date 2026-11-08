/**
 * Editor Component - Main collaborative editor for creating units
 */

import * as React from "react";
import { useContext, useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

import type { EditorState, LexicalEditor, EditorThemeClasses } from "lexical";
import { DATASTORE_UPDATE_TAG, INITIAL_LOAD_TAG } from "./constants/updateTags";

import TabsVerticalLeft from "./components/TabsVerticalLeft";
import TabsVerticalRight from "./components/TabsVerticalRight";
import EditorWorkspace from "./components/EditorWorkspace";
import { TabProvider } from "../../context/tabContext";
import { useTabState } from "../../hooks/useTabState";
import { AudioPlayerProvider } from "./context/AudioPlayerContext";
import { AutocompleteProvider } from "./context/SharedAutocompleteContext";
import { SuggestionProvider } from "./context/SuggestionContext";
import { DndWrapper } from "../MeaningAssociationExercise/DndWrapper";
import LanguageEditorTheme from "./config/LanguageEditorTheme";
import Placeholder from "./components/Placeholder";

import UnitContext from "../../context/unitContext";
import FilesContext from "../../context/fileContext";
import DictionaryContext from "../../context/dictionaryContext";
import SectionContext from "../../context/sectionContext";
import VectorStoreContext from "../../context/vectorStoreContext";

import ToolBarPlugin from "./plugins/ToolBarPlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";
import CodeActionMenuPlugin from "./plugins/CodeActionMenuPlugin";
import FloatingLinkEditorPlugin from "./plugins/FloatingLinkEditorPlugin";
import LinkPlugin from "./plugins/LinkPlugin";
import AutoLinkPlugin from "./plugins/AutoLinkPlugin";
import YouTubePlugin from "./plugins/YouTubePlugin";
import WordBlockPlugin from "./plugins/WordBlockPlugin";
import MeaningAssociationPlugin from "./plugins/MeaningAssociationPlugin";
import QuizPlugin from "./plugins/QuizPlugin";
import AutocompletePlugin from "./plugins/AutocompletePlugin";
import DragDropPastePlugin from "./plugins/DragDropPastePlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import PlaylistPlugin from "./plugins/PlaylistPlugin";
import PdfViewerPlugin from "./plugins/PdfViewerPlugin";
import { LayoutPlugin } from "./plugins/LayoutPlugin";
import AnswerPlugin from "./plugins/AnswerPlugin";
import CustomAnswerPlugin from "./plugins/CustomAnswerPlugin";
import CustomAIPlugin from "./plugins/CustomAIPlugin";
import ArmorEditorPlugin from "./plugins/ArmorEditorPlugin";
import ConversationPlaylistPlugin from "./plugins/ConversationPlaylistPlugin";
import CallResponsePlugin from "./plugins/CallResponsePlugin";
import BlockSuggestionPlugin from "./plugins/BlockSuggestionPlugin";
import BlockNavigationPlugin from "./plugins/BlockNavigationPlugin";
import AIContentCompletionPlugin from "./plugins/AIContentCompletionPlugin";
import DraggableBlockPlugin from "./plugins/DraggableBlockPlugin";
import TableHoverActionsPlugin from "./plugins/TableHoverActionsPlugin";
import TableActionMenuPlugin from "./plugins/TableActionMenuPlugin";
import YjsCollaborationPlugin from "./plugins/CollaborationPlugin";
import { useChatPageContext } from "../../hooks/useChatPageContext";

import { useYjsUnit } from "../../hooks/useYjsUnit";
import {
  EditorNodes,
  ALL_TRANSFORMERS,
  onError,
  DEBOUNCE_SAVE_DELAY_MS,
  sanitizeEditorStateJSON,
} from "./editorConfig";
import { EditorCanvas, LessonContentEditable } from "./styledComponents";
import { useAppShell } from "../AppShellContext";
import ComponentErrorBoundary from "../ComponentErrorBoundary";
import { EditorToastProvider } from "./context/EditorToastContext";

/**
 * Plugin to expose editor instance to UnitContext
 */
function EditorRefPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const { editorRef } = useContext(UnitContext);

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  return null;
}

/**
 * Main Editor component with collaborative editing support
 */
function EditorContent(): React.ReactElement {
  const t = useTranslations("common");
  const tAuthoring = useTranslations("editor.authoring");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { unit, session, editorRef, files, dictionary, questionBank } =
    useContext(UnitContext);
  const { sections } = useContext(SectionContext);
  const vectorStoreContext = useContext(VectorStoreContext);
  const {
    appBarHeight = 48,
    setDrawerOpen,
    drawerOpen,
  } = useAppShell() as {
    appBarHeight?: number;
    setDrawerOpen?: (open: boolean) => void;
    drawerOpen?: boolean;
  };

  // Auto-collapse the AppShell nav sidebar to give the editor full width
  const savedDrawerOpen = useRef(drawerOpen);
  useEffect(() => {
    if (!setDrawerOpen) return;
    savedDrawerOpen.current = drawerOpen;
    setDrawerOpen(false);
    return () => setDrawerOpen(savedDrawerOpen.current ?? false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register page context with global chat
  useChatPageContext({
    unit,
    files: (files ? Object.values(files) : []) as any[],
    dictionary: (dictionary ? Object.values(dictionary) : []) as any[],
    questions: (questionBank ? Object.values(questionBank) : []) as any[],
    sections,
    editorRef,
    vectorStoreSearch: vectorStoreContext?.search,
  });

  // Yjs collaboration setup
  const { provider } = useYjsUnit({
    unitId: unit?.id,
    enableWebSocket: true,
    enablePersistence: true,
  });

  // Container ref for remote user cursors
  const cursorsContainerRef = useRef<HTMLDivElement>(null);

  // Generate user color from username (simple hash)
  const getUserColor = (username: string | undefined): string => {
    if (!username) return "#3b82f6";
    const colors = [
      "#3b82f6",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#14b8a6",
      "#f97316",
      "#06b6d4",
      "#84cc16",
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Use tab state hook instead of local state
  const tabState: any = useTabState({
    defaultLeftTab: 4, // files
    defaultRightTab: 5, // chat (index 5 in TabsVerticalRight)
    defaultLeftWidth: 640,
    defaultRightWidth: 350,
    syncToURL: true,
    syncToLocalStorage: false, // Disabled to avoid stale data issues
  });

  const {
    leftTab: tabValueLeft,
    leftOpen: openTabVerticalLeft,
    leftWidth: currentDrawerWidthLeft,
    rightTab: tabValueRight,
    rightOpen: openTabVerticalRight,
    rightWidth: currentDrawerWidthRight,
    setLeftTab: setTabValueLeft,
    setLeftOpen: setOpenTabVerticalLeft,
    setLeftWidth: setCurrentDrawerWidthLeft,
    setRightTab: setTabValueRight,
    setRightOpen: setOpenTabVerticalRight,
    setRightWidth: setCurrentDrawerWidthRight,
  } = tabState;

  // Focus management state
  const [focusItem, setFocusItem] = React.useState<{
    type: string;
    id: string;
  } | null>(null);

  // Item refs for scrolling to items
  const itemRefsMap = React.useRef<
    Record<string, Record<string, React.RefObject<HTMLElement>>>
  >({});

  const registerItemRef = React.useCallback(
    (type: string, id: string, ref: React.RefObject<HTMLElement>) => {
      if (!itemRefsMap.current[type]) {
        itemRefsMap.current[type] = {};
      }
      itemRefsMap.current[type][id] = ref;
    },
    [],
  );

  const unregisterItemRef = React.useCallback((type: string, id: string) => {
    if (itemRefsMap.current[type]) {
      delete itemRefsMap.current[type][id];
    }
  }, []);

  const scrollToItem = React.useCallback(
    (type: string, id: string): boolean => {
      const ref = itemRefsMap.current[type]?.[id];
      if (ref?.current) {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
      return false;
    },
    [],
  );

  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = React.useState<number>(0);
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false);

  // Track scroll position for header compression using callback ref
  // to handle remounts when LexicalComposer key changes
  const scrollListenerRef = React.useRef<(() => void) | null>(null);
  const contentRef = React.useCallback((node: HTMLDivElement | null) => {
    // Clean up previous listener
    if (scrollListenerRef.current) {
      scrollListenerRef.current();
      scrollListenerRef.current = null;
    }

    if (node) {
      const handleScroll = (event: Event): void => {
        const target = event.target as HTMLElement;
        const scrollTop = target.scrollTop;
        // Hysteresis: collapse at 50px, expand back only below 10px to prevent oscillation
        setIsScrolled((prev) => {
          if (!prev && scrollTop > 50) return true;
          if (prev && scrollTop < 10) return false;
          return prev;
        });
      };
      node.addEventListener("scroll", handleScroll);
      scrollListenerRef.current = () =>
        node.removeEventListener("scroll", handleScroll);
    }
  }, []);


  // Measure toolbar height dynamically
  React.useEffect(() => {
    const measureToolbarHeight = (): void => {
      if (toolbarRef.current) {
        const height = toolbarRef.current.getBoundingClientRect().height;
        setToolbarHeight(height);
      }
    };

    measureToolbarHeight();
    window.addEventListener("resize", measureToolbarHeight);

    return () => {
      window.removeEventListener("resize", measureToolbarHeight);
    };
  }, []);

  const { saveEditorContent, editorStateRef } = useContext(UnitContext);
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement | null): void => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const initialConfig: any = React.useMemo(
    () => ({
      namespace: "LanguageEditor",
      nodes: [...EditorNodes],
      theme: LanguageEditorTheme as EditorThemeClasses,
      onError,
      // Set initial editor state from unit.data so CollaborationPlugin
      // can bootstrap the Y.Doc with content via shouldBootstrap=true
      editorState: sanitizeEditorStateJSON(unit?.data) || null,
    }),
    // Re-create only when unit changes; later unit.data edits must not reset the editor (LexicalComposer reads this once on mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit?.id],
  );

  // Create debounced save function with stable reference
  const debouncedSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const debouncedSave = useCallback(() => {
    if (debouncedSaveTimer.current) {
      clearTimeout(debouncedSaveTimer.current);
    }
    debouncedSaveTimer.current = setTimeout(() => {
      saveEditorContent();
    }, DEBOUNCE_SAVE_DELAY_MS);
  }, [saveEditorContent]);

  const onChange = useCallback(
    async (
      editorState: EditorState,
      editor: LexicalEditor,
      tags: Set<string>,
    ) => {
      // History-tagged edits and undo/redo still change persisted content.
      if (
        tags &&
        (tags.has(DATASTORE_UPDATE_TAG) ||
          tags.has(INITIAL_LOAD_TAG))
      ) {
        console.log(
          "[Editor onChange] Skipping save due to tags:",
          Array.from(tags),
        );
        return;
      }

      // New units have no saved state; only the loaded unit gates the first save.
      if (!unit?.id) {
        console.log(
          "[Editor onChange] Skipping save - no unit loaded yet",
        );
        return;
      }

      // Get the current state as JSON string for comparison
      let newStateJSON: string;
      try {
        newStateJSON = JSON.stringify(editorState.toJSON());
      } catch (err) {
        // Lexical can throw during toJSON() if nodes are null mid-update
        console.warn("[Editor onChange] Skipping save - toJSON() failed:", err);
        return;
      }
      const currentStateJSON = JSON.stringify(editorStateRef.current);

      // Skip if the state hasn't actually changed
      if (newStateJSON === currentStateJSON) {
        console.log("[Editor onChange] Skipping save - no changes detected");
        return;
      }

      console.log("[Editor onChange] State changed, saving");

      // Update local state immediately (not debounced)
      editorStateRef.current = editorState.toJSON();

      // Debounce the save to DataStore
      debouncedSave();
    },
    [debouncedSave, editorStateRef, unit?.id],
  );

  // Consume ?focusType=&focusId= from the global search bar: open the matching
  // side panel and scroll to/highlight the item, then strip the params so
  // remounts or back-navigation don't re-trigger it.
  const consumedFocusParamsRef = useRef<string | null>(null);
  useEffect(() => {
    const focusType = searchParams.get("focusType");
    const focusId = searchParams.get("focusId");
    if (!focusType || !focusId) return;

    const paramsKey = `${focusType}:${focusId}`;
    if (consumedFocusParamsRef.current === paramsKey) return;
    consumedFocusParamsRef.current = paramsKey;

    const LEFT_TAB_BY_FOCUS_TYPE: Record<string, number> = {
      word: 2,
      question: 3,
      file: 4,
    };
    const tabIndex = LEFT_TAB_BY_FOCUS_TYPE[focusType];
    if (tabIndex != null) {
      setTabValueLeft(tabIndex);
      setOpenTabVerticalLeft(true);
    }
    setFocusItem({ type: focusType, id: focusId });

    const timer = setTimeout(() => {
      scrollToItem(focusType, focusId);
    }, 300);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("focusType");
    params.delete("focusId");
    const newQuery = params.toString();
    router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);

    return () => clearTimeout(timer);
  }, [
    searchParams,
    pathname,
    router,
    setTabValueLeft,
    setOpenTabVerticalLeft,
    setFocusItem,
    scrollToItem,
  ]);

  // Memoize the tab provider value to prevent unnecessary re-renders
  const tabProviderValue: any = React.useMemo(
    () => ({
      ...tabState,
      focusItem,
      setFocusItem,
      itemRefs: itemRefsMap,
      registerItemRef,
      unregisterItemRef,
      scrollToItem,
    }),
    [tabState, focusItem, registerItemRef, unregisterItemRef, scrollToItem],
  );

  return (
    <TabProvider value={tabProviderValue}>
      <SuggestionProvider useAI active={openTabVerticalRight && tabValueRight === 7}>
        <DndWrapper>
          <AutocompleteProvider>
            <AudioPlayerProvider>
              <LexicalComposer
                key={unit?.id || "no-unit"}
                initialConfig={initialConfig}
              >
                {/* @ts-ignore - Next.js styled-jsx */}
                <style jsx global>{`
                  .layout-container {
                    display: grid;
                  }

                  .layout-container > div {
                    margin: 0.25rem;
                    padding: 0.25rem;
                    border: 1px dashed var(--let-layout-border, #ccc);
                  }

                  .editor:focus {
                    outline: none;
                  }
                `}</style>
                <AutoFocusPlugin />
                <CheckListPlugin />
                <ClearEditorPlugin />
                <HashtagPlugin />
                <HistoryPlugin />
                <CodeHighlightPlugin />
                <HorizontalRulePlugin />
                <ListPlugin />
                <TabIndentationPlugin />
                <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
                <TablePlugin />
                <CodeActionMenuPlugin />
                <WordBlockPlugin />
                <QuizPlugin />
                <MeaningAssociationPlugin />
                <PlaylistPlugin />
                <ConversationPlaylistPlugin />
                <CallResponsePlugin />
                <PdfViewerPlugin />
                <AutocompletePlugin />
                <DragDropPastePlugin />
                <ImagesPlugin captionsEnabled={false} />
                <LayoutPlugin />
                <AnswerPlugin />
                <CustomAnswerPlugin />
                <CustomAIPlugin />
                <ArmorEditorPlugin />
                <BlockSuggestionPlugin useAI={true} />
                <BlockNavigationPlugin />
                <AIContentCompletionPlugin />
                <LinkPlugin />
                <AutoLinkPlugin />
                <YouTubePlugin />
                <EditorRefPlugin />
                {unit?.id && provider && (
                  <YjsCollaborationPlugin
                    provider={provider}
                    username={session?.username || t("editor.anonymousUser")}
                    color={getUserColor(session?.username)}
                    cursorsContainerRef={cursorsContainerRef}
                  />
                )}
                {!floatingAnchorElem ? null : (
                  <>
                    <FloatingLinkEditorPlugin
                      anchorElem={floatingAnchorElem}
                      isLeftDrawerOpen={openTabVerticalLeft}
                      isRightDrawerOpen={openTabVerticalRight}
                      {...({ appBarHeight: toolbarHeight } as any)}
                    />

                    <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                    <TableActionMenuPlugin anchorElem={floatingAnchorElem} />
                    <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
                  </>
                )}

                <EditorWorkspace
                  appBarHeight={appBarHeight}
                  toolbar={<ToolBarPlugin
                    ref={toolbarRef}
                    {...({
                      setOpen: setOpenTabVerticalLeft,
                      open: openTabVerticalLeft,
                      setTabValue: setTabValueLeft,
                      isScrolled,
                    } as any)}
                  />}
                  left={{
                    width: currentDrawerWidthLeft,
                    open: openTabVerticalLeft,
                    onClose: () => setOpenTabVerticalLeft(false),
                    label: tAuthoring(`tabsVerticalLeft.tabs.${[
                      "assignments", "tableOfContents", "dictionary", "questions",
                      "files", "campaign", "configuration",
                    ][tabValueLeft]}`),
                    content: <TabsVerticalLeft
                      setOpen={setOpenTabVerticalLeft}
                      open={openTabVerticalLeft}
                      setDrawerWidth={setCurrentDrawerWidthLeft}
                      value={tabValueLeft}
                      setValue={setTabValueLeft}
                    />,
                  }}
                  right={{
                    width: currentDrawerWidthRight,
                    open: openTabVerticalRight,
                    onClose: () => setOpenTabVerticalRight(false),
                    label: tAuthoring(`tabsVerticalRight.${({
                      5: "aiAssistantTab",
                      7: "aiSuggestionsTab",
                      8: "gradesTab",
                      9: "cohortChatTab",
                    } as Record<number, string>)[tabValueRight]}`),
                    content: <TabsVerticalRight
                      setOpen={setOpenTabVerticalRight}
                      open={openTabVerticalRight}
                      setDrawerWidth={setCurrentDrawerWidthRight}
                      value={tabValueRight}
                      setValue={setTabValueRight}
                    />,
                  }}
                >
                    <div
                      ref={contentRef}
                      style={{
                        flex: "1 1 0",
                        minHeight: 0,
                        overflow: "auto",
                        position: "relative",
                        WebkitOverflowScrolling: "touch",
                        "--editor-scroll-padding": "clamp(0.5rem, 2vw, 1.5rem)",
                        padding: "var(--editor-scroll-padding)",
                      } as React.CSSProperties}
                    >
                      <EditorCanvas
                        ref={onRef}
                        className="editor-container"
                      >
                        <div
                          ref={cursorsContainerRef}
                          className="collaboration-cursors-container"
                          style={{ position: "relative" }}
                        >
                          <RichTextPlugin
                            contentEditable={
                              <LessonContentEditable
                                className="editor"
                                data-tour="editor"
                                data-lesson-content
                                data-lexical-editor={true}
                                aria-label={t("actions.edit")}
                              />
                            }
                            placeholder={
                              <Placeholder className="editor-placeholder">
                                Start typing or use the toolbar above to add
                                content...
                              </Placeholder>
                            }
                            ErrorBoundary={LexicalErrorBoundary}
                          />
                          <OnChangePlugin
                            onChange={onChange}
                            ignoreSelectionChange
                            ignoreHistoryMergeTagChange={false}
                          />
                        </div>
                      </EditorCanvas>
                    </div>
                </EditorWorkspace>
              </LexicalComposer>
            </AudioPlayerProvider>
          </AutocompleteProvider>
        </DndWrapper>
      </SuggestionProvider>
    </TabProvider>
  );
}

export default function Editor(): React.ReactElement {
  return (
    <EditorToastProvider>
      <ComponentErrorBoundary name="Editor">
        <EditorContent />
      </ComponentErrorBoundary>
    </EditorToastProvider>
  );
}

// Re-export Workbook for convenience
export { Workbook } from "./Workbook";
export { NarrativeReader } from "./NarrativeReader";
export type { NarrativeReaderProps } from "./NarrativeReader";
export { WorkbookSSRSkeleton } from "./WorkbookSSRSkeleton";
export { EditorNodes, ALL_TRANSFORMERS } from "./editorConfig";
