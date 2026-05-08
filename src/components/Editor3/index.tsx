/**
 * Editor Component - Main collaborative editor for creating units
 */

import * as React from 'react';
import { useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

import type { EditorState, LexicalEditor, EditorThemeClasses } from 'lexical';
import { HISTORIC_TAG, HISTORY_PUSH_TAG, HISTORY_MERGE_TAG } from 'lexical';
import { DATASTORE_UPDATE_TAG, INITIAL_LOAD_TAG } from './constants/updateTags';

import TabsVerticalLeft from './components/TabsVerticalLeft';
import TabsVerticalRight from './components/TabsVerticalRight';
import { TabProvider } from '../../context/tabContext';
import { useTabState } from '../../hooks/useTabState';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AutocompleteProvider } from './context/SharedAutocompleteContext';
import { SuggestionProvider } from './context/SuggestionContext';
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper';
import LanguageEditorTheme from './config/LanguageEditorTheme';
import Placeholder from './components/Placeholder';

import UnitContext from '../../context/unitContext';
import FilesContext from '../../context/fileContext';
import DictionaryContext from '../../context/dictionaryContext';
import SectionContext from '../../context/sectionContext';
import VectorStoreContext from '../../context/vectorStoreContext';


import ToolBarPlugin from './plugins/ToolBarPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import WordBlockPlugin from './plugins/WordBlockPlugin';
import MeaningAssociationPlugin from './plugins/MeaningAssociationPlugin';
import QuizPlugin from './plugins/QuizPlugin';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import DragDropPastePlugin from './plugins/DragDropPastePlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import PlaylistPlugin from './plugins/PlaylistPlugin';
import PdfViewerPlugin from './plugins/PdfViewerPlugin';
import { LayoutPlugin } from './plugins/LayoutPlugin';
import AnswerPlugin from './plugins/AnswerPlugin';
import CustomAnswerPlugin from './plugins/CustomAnswerPlugin';
import ArmorEditorPlugin from './plugins/ArmorEditorPlugin';
import BlockSuggestionPlugin from './plugins/BlockSuggestionPlugin';
import AIContentCompletionPlugin from './plugins/AIContentCompletionPlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import TableHoverActionsPlugin from './plugins/TableHoverActionsPlugin';
import TableActionMenuPlugin from './plugins/TableActionMenuPlugin';
import YjsCollaborationPlugin from './plugins/CollaborationPlugin';
import { useChatPageContext } from '../../hooks/useChatPageContext';

import { useYjsUnit } from '../../hooks/useYjsUnit';
import { EditorNodes, ALL_TRANSFORMERS, onError, DRAWER_WIDTH, DEBOUNCE_SAVE_DELAY_MS, sanitizeEditorStateJSON } from './editorConfig';
import { Drawer, DrawerHeader } from './styledComponents';

/**
 * Custom OnChange Plugin following Lexical best practices
 * https://lexical.dev/docs/getting-started/react#saving-lexical-state
 */
interface MyOnChangePluginProps {
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void;
}

function MyOnChangePlugin({ onChange }: MyOnChangePluginProps): null {
  const [editor] = useLexicalComposerContext();
  const throttledOnChange = useRef<((editorState: EditorState, tags: Set<string>) => void) | null>(null);

  // Create a throttled version of onChange to prevent excessive calls
  useEffect(() => {
    let lastCall = 0;
    const THROTTLE_MS = 100; // Limit to max 10 calls per second

    throttledOnChange.current = (editorState: EditorState, tags: Set<string>) => {
      const now = Date.now();
      if (now - lastCall >= THROTTLE_MS) {
        lastCall = now;
        onChange(editorState, editor, tags);
      }
    };
  }, [editor, onChange]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      if (throttledOnChange.current) {
        throttledOnChange.current(editorState, tags);
      }
    });
  }, [editor]);

  return null;
}

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
export default function Editor(): JSX.Element {
  const t = useTranslations('common');
  const { unit, session, editorRef, files, dictionary, questionBank } = useContext(UnitContext);
  const { sections } = useContext(SectionContext);
  const vectorStoreContext = useContext(VectorStoreContext);
  const direction = typeof document !== 'undefined' ? (document.documentElement.dir || 'ltr') : 'ltr';

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
    if (!username) return '#3b82f6';
    const colors = [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
      '#f97316',
      '#06b6d4',
      '#84cc16',
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
    defaultLeftWidth: 350,
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
  const [focusItem, setFocusItem] = React.useState<{ type: string; id: string } | null>(null);

  // Item refs for scrolling to items
  const itemRefsMap = React.useRef<Record<string, Record<string, React.RefObject<HTMLElement>>>>({});

  const registerItemRef = React.useCallback((type: string, id: string, ref: React.RefObject<HTMLElement>) => {
    if (!itemRefsMap.current[type]) {
      itemRefsMap.current[type] = {};
    }
    itemRefsMap.current[type][id] = ref;
  }, []);

  const unregisterItemRef = React.useCallback((type: string, id: string) => {
    if (itemRefsMap.current[type]) {
      delete itemRefsMap.current[type][id];
    }
  }, []);

  const scrollToItem = React.useCallback((type: string, id: string): boolean => {
    const ref = itemRefsMap.current[type]?.[id];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    return false;
  }, []);

  const [actualDrawerWidthLeft, setActualDrawerWidthLeft] = React.useState<number>(DRAWER_WIDTH);
  const [actualDrawerWidthRight, setActualDrawerWidthRight] = React.useState<number>(DRAWER_WIDTH);

  const drawerRefLeft = React.useRef<HTMLDivElement>(null);
  const drawerRefRight = React.useRef<HTMLDivElement>(null);
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
      node.addEventListener('scroll', handleScroll);
      scrollListenerRef.current = () => node.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleDrawerLeftClose = (): void => {
    setOpenTabVerticalLeft(false);
  };

  const handleDrawerRightClose = (): void => {
    setOpenTabVerticalRight(false);
  };

  // Measure left drawer content width
  React.useEffect(() => {
    if (openTabVerticalLeft && drawerRefLeft.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            setActualDrawerWidthLeft(width);
          }
        }
      });

      resizeObserver.observe(drawerRefLeft.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [openTabVerticalLeft]);

  // Measure right drawer content width
  React.useEffect(() => {
    if (openTabVerticalRight && drawerRefRight.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            setActualDrawerWidthRight(width);
          }
        }
      });

      resizeObserver.observe(drawerRefRight.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [openTabVerticalRight]);

  // Measure toolbar height dynamically
  React.useEffect(() => {
    const measureToolbarHeight = (): void => {
      if (toolbarRef.current) {
        const height = toolbarRef.current.getBoundingClientRect().height;
        setToolbarHeight(height);
      }
    };

    measureToolbarHeight();
    window.addEventListener('resize', measureToolbarHeight);

    return () => {
      window.removeEventListener('resize', measureToolbarHeight);
    };
  }, []);

  const { saveEditorContent, editorStateRef } = useContext(UnitContext);
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement | null): void => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const initialConfig: any = React.useMemo(() => ({
    namespace: 'LanguageEditor',
    nodes: [...EditorNodes],
    theme: LanguageEditorTheme as EditorThemeClasses,
    onError,
    // Set initial editor state from unit.data so CollaborationPlugin
    // can bootstrap the Y.Doc with content via shouldBootstrap=true
    editorState: sanitizeEditorStateJSON(unit?.data) || null,
  }), [unit?.id]); // Re-create only when unit changes (LexicalComposer reads this once on mount)

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
    async (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => {
      // Skip saves for history operations (undo/redo) and initial load
      // Note: DATASTORE_UPDATE_TAG deprecated with Yjs integration (CollaborationPlugin handles sync)
      if (
        tags &&
        (tags.has(DATASTORE_UPDATE_TAG) ||
          tags.has(HISTORY_MERGE_TAG) ||
          tags.has(INITIAL_LOAD_TAG) ||
          tags.has(HISTORIC_TAG) ||
          tags.has(HISTORY_PUSH_TAG))
      ) {
        console.log('[Editor onChange] Skipping save due to tags:', Array.from(tags));
        return;
      }

      // Skip if we haven't loaded initial state yet (editorStateRef not set)
      if (!editorStateRef.current) {
        console.log('[Editor onChange] Skipping save - no initial state loaded yet');
        return;
      }

      // Get the current state as JSON string for comparison
      let newStateJSON: string;
      try {
        newStateJSON = JSON.stringify(editorState.toJSON());
      } catch (err) {
        // Lexical can throw during toJSON() if nodes are null mid-update
        console.warn('[Editor onChange] Skipping save - toJSON() failed:', err);
        return;
      }
      const currentStateJSON = JSON.stringify(editorStateRef.current);

      // Skip if the state hasn't actually changed
      if (newStateJSON === currentStateJSON) {
        console.log('[Editor onChange] Skipping save - no changes detected');
        return;
      }

      console.log('[Editor onChange] State changed, saving');

      // Update local state immediately (not debounced)
      editorStateRef.current = editorState.toJSON();

      // Debounce the save to DataStore
      debouncedSave();
    },
    [debouncedSave, editorStateRef]
  );

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
    [tabState, focusItem, registerItemRef, unregisterItemRef, scrollToItem]
  );

  return (
    <TabProvider value={tabProviderValue}>
      <SuggestionProvider>
        <DndWrapper>
          <AutocompleteProvider>
            <AudioPlayerProvider>
              <LexicalComposer key={unit?.id || 'no-unit'} initialConfig={initialConfig}>
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
                    box-shadow: inset 0 2px 4px var(--mui-palette-action-focus, rgba(0, 0, 0, 0.1));
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
                <PdfViewerPlugin />
                <AutocompletePlugin />
                <DragDropPastePlugin />
                <ImagesPlugin captionsEnabled={false} />
                <LayoutPlugin />
                <AnswerPlugin />
                <CustomAnswerPlugin />
                <ArmorEditorPlugin />
                <BlockSuggestionPlugin useAI={true} />
                <AIContentCompletionPlugin />
                <LinkPlugin />
                <AutoLinkPlugin />
                <YouTubePlugin />
                <EditorRefPlugin />
                {unit?.id && provider && (
                  <YjsCollaborationPlugin
                    provider={provider}
                    username={session?.username || 'Anonymous'}
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

                <Box
                  sx={{
                    display: 'flex',
                    overflow: 'hidden',
                  }}
                >
                  <ToolBarPlugin
                    ref={toolbarRef}
                    {...{ setOpen: setOpenTabVerticalLeft, open: openTabVerticalLeft, setTabValue: setTabValueLeft, isScrolled } as any}
                  />
                  {/* Left Drawer */}
                  <Drawer
                    ref={drawerRefLeft}
                    drawerwidth={currentDrawerWidthLeft}
                    anchor="left"
                    sx={{
                      height: '100%',
                      flexShrink: 0,
                      position: 'relative',
                    }}
                    variant="permanent"
                    open={openTabVerticalLeft}
                  >
                    <DrawerHeader
                      style={{
                        minHeight: 'var(--app-bar-height, 11rem)',
                        flexShrink: 0,
                        transition: 'min-height 0.3s ease',
                      }}
                    >
                      <IconButton onClick={handleDrawerLeftClose}>
                        {direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                      </IconButton>
                    </DrawerHeader>
                    <TabsVerticalLeft
                      setOpen={setOpenTabVerticalLeft}
                      open={openTabVerticalLeft}
                      setDrawerWidth={setCurrentDrawerWidthLeft}
                      value={tabValueLeft}
                      setValue={setTabValueLeft}
                    />
                  </Drawer>

                  {/* Main Content */}
                  <Box
                    component="main"
                    sx={{
                      flexGrow: 1,
                      padding: 0,
                      width: `calc(100% - ${openTabVerticalLeft ? actualDrawerWidthLeft : 40}px - ${
                        openTabVerticalRight ? actualDrawerWidthRight : 40
                      }px)`,
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100vh',
                      boxShadow: 'none',
                    }}
                  >
                    <DrawerHeader
                      style={{
                        minHeight: 'var(--app-bar-height, 11rem)',
                        flexShrink: 0,
                        transition: 'min-height 0.3s ease',
                      }}
                    />
                    <div
                      ref={contentRef}
                      style={{
                        flexGrow: 1,
                        overflow: 'auto',
                        position: 'relative',
                        WebkitOverflowScrolling: 'touch',
                      }}
                    >
                      <div
                        ref={onRef}
                        className="editor-container"
                        style={{
                          position: 'relative',
                          minHeight: 'calc(100vh - var(--app-bar-height, 11rem))',
                          paddingLeft: '1.5rem',
                        }}
                      >
                        <div
                          ref={cursorsContainerRef}
                          className="collaboration-cursors-container"
                          style={{ position: 'relative' }}
                        >
                        <RichTextPlugin
                          contentEditable={
                            <ContentEditable
                              className="editor"
                              data-tour="editor"
                              data-lexical-editor="true"
                              aria-label={t('actions.edit', { ns: 'common' })}
                              style={{
                                maxWidth: '100%',
                                outline: 'none',
                                minHeight: 'calc(100vh - var(--app-bar-height, 11rem))',
                                padding: '1rem 2rem 1rem 0.5rem',
                              }}
                            />
                          }
                          placeholder={
                            <Placeholder className="editor-placeholder">
                              Start typing or use the toolbar above to add content...
                            </Placeholder>
                          }
                          ErrorBoundary={LexicalErrorBoundary}
                        />
                        <MyOnChangePlugin onChange={onChange} />
                        </div>
                      </div>
                    </div>
                  </Box>

                  {/* Right Drawer */}
                  <Drawer
                    ref={drawerRefRight}
                    drawerwidth={currentDrawerWidthRight}
                    anchor="right"
                    sx={{
                      height: '100%',
                      flexShrink: 0,
                      position: 'relative',
                    }}
                    variant="permanent"
                    open={openTabVerticalRight}
                  >
                    <DrawerHeader
                      style={{
                        minHeight: 'var(--app-bar-height, 11rem)',
                        flexShrink: 0,
                        justifyContent: 'flex-start',
                        transition: 'min-height 0.3s ease',
                      }}
                    >
                      <IconButton onClick={handleDrawerRightClose}>
                        {direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                      </IconButton>
                    </DrawerHeader>
                    <TabsVerticalRight
                      setOpen={setOpenTabVerticalRight}
                      open={openTabVerticalRight}
                      setDrawerWidth={setCurrentDrawerWidthRight}
                      value={tabValueRight}
                      setValue={setTabValueRight}
                    />
                  </Drawer>
                </Box>
              </LexicalComposer>
            </AudioPlayerProvider>
          </AutocompleteProvider>
        </DndWrapper>
      </SuggestionProvider>
    </TabProvider>
  );
}

// Re-export Workbook for convenience
export { Workbook } from './Workbook';
export { NarrativeReader } from './NarrativeReader';
export type { NarrativeReaderProps } from './NarrativeReader';
export { EditorNodes, ALL_TRANSFORMERS } from './editorConfig';
