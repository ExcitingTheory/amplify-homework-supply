import * as React from 'react';
import { useContext, useState, useCallback, useRef, useEffect } from 'react';

import './components/LanguageEditorTheme.css';
import './theme.css';

import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VerticalTabsRo from './components/VerticalTabsRo';
import TabsVerticalLeft from './components/TabsVerticalLeft';
import TabsVerticalRight from './components/TabsVerticalRight';
import { TabProvider } from '../../context/tabContext';
import { useTabState } from '../../hooks/useTabState';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';

import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $getRoot, $getSelection, HISTORIC_TAG, HISTORY_PUSH_TAG, HISTORY_MERGE_TAG } from 'lexical';
import { DATASTORE_UPDATE_TAG, INITIAL_LOAD_TAG } from './constants/updateTags';


import { HashtagNode } from '@lexical/hashtag';

import { LexicalComposer } from '@lexical/react/LexicalComposer';


import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { ClickableLinkPlugin as LexicalClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import {
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';

import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import ToolBarPlugin from './plugins/ToolBarPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';

import UnitContext from '../../context/unitContext';

import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import { YouTubeNode } from './plugins/YouTubePlugin';

import WordBlockPlugin, {
  WordBlockNode,
} from './plugins/WordBlockPlugin';

import MeaningAssociationPlugin, { MeaningAssociationNode } from './plugins/MeaningAssociationPlugin';

import QuizPlugin, { QuizNode } from './plugins/QuizPlugin';

import {
  Box,
} from '@mui/material';

import AutocompletePlugin from './plugins/AutocompletePlugin';
import { AutocompleteProvider } from './context/SharedAutocompleteContext';
import { AutocompleteNode } from './components/AutocompleteNode';

import DragDropPastePlugin from './plugins/DragDropPastePlugin';
import { ImageNode } from './components/ImageNode';

import ImagesPlugin from './plugins/ImagesPlugin';

import DataPlugin from './plugins/DataPlugin';
import StoryProgressPlugin from './plugins/StoryProgressPlugin';
import ToolBarRoPlugin from './plugins/ToolBarRoPlugin';

import PlaylistPlugin, {
  PlaylistNode,
} from './plugins/PlaylistPlugin';

import PdfViewerPlugin from './plugins/PdfViewerPlugin';
import { PdfViewerNode } from './components/PdfViewerNode';

import { LayoutPlugin } from './plugins/LayoutPlugin';
import { LayoutContainerNode } from './components/LayoutContainerNode';
import { LayoutItemNode } from './components/LayoutItemNode';

import UnitCompletedPlugin from './plugins/UnitCompletedPlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper.jsx';
import LanguageEditorTheme from './components/LanguageEditorTheme';
// import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin.js';

import AnswerPlugin from './plugins/AnswerPlugin.js';
import { AnswerNode } from './plugins/AnswerPlugin.js';
import CustomAnswerPlugin, { CustomAnswerNode } from './plugins/CustomAnswerPlugin.jsx';
import BlockSuggestionPlugin from './plugins/BlockSuggestionPlugin.js';
import { SuggestionProvider } from './context/SuggestionContext';
import AIContentCompletionPlugin from './plugins/AIContentCompletionPlugin.js';

// FileMetadata node imports
import { FileMetadataNode } from './nodes/FileMetadataNode';


export const EditorNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  HashtagNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HorizontalRuleNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  YouTubeNode,
  WordBlockNode,
  MeaningAssociationNode,
  AutocompleteNode,
  ImageNode,
  QuizNode,
  PlaylistNode,
  PdfViewerNode,
  LayoutContainerNode,
  LayoutItemNode,
  AnswerNode,
  CustomAnswerNode,
  FileMetadataNode,
];

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error) {
  console.error(error);
  throw error;
}

const DEBOUNCE_SAVE_DELAY_MS = 2000; // 2 seconds

function debounce(func, timeout = DEBOUNCE_SAVE_DELAY_MS) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// Custom OnChange Plugin following Lexical best practices
// https://lexical.dev/docs/getting-started/react#saving-lexical-state
function MyOnChangePlugin({ onChange }) {
  const [editor] = useLexicalComposerContext();
  const throttledOnChange = useRef(null);

  // Create a throttled version of onChange to prevent excessive calls
  useEffect(() => {
    let lastCall = 0;
    const THROTTLE_MS = 100; // Limit to max 10 calls per second

    throttledOnChange.current = (editorState, tags) => {
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

// Plugin to expose editor instance to UnitContext
function EditorRefPlugin() {
  const [editor] = useLexicalComposerContext();
  const { editorRef } = useContext(UnitContext);

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  return null;
}

const drawerWidth = 350;

const openedMixin = (theme, width = drawerWidth) => ({
  width: width,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: '2.5rem', // Match vertical tabs width exactly
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerwidth' })(
  ({ theme, open, drawerwidth }) => ({
    width: open ? drawerwidth : '2.5rem',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme, drawerwidth),
      '& .MuiDrawer-paper': openedMixin(theme, drawerwidth),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function Editor() {
  // const editorRef = useRef(null); // Holds the Lexical editor instance
  // Removed local editorStateRef - using the one from context
  // Removed previousStateRef - version comparison in DataPlugin prevents loops
  const { unit } = useContext(UnitContext);
  const theme = useTheme();
  
  // Use tab state hook instead of local state
  const tabState = useTabState({
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
  const [focusItem, setFocusItem] = React.useState(null);
  
  // Item refs for scrolling to items
  const itemRefsMap = React.useRef({});
  
  const registerItemRef = React.useCallback((type, id, ref) => {
    if (!itemRefsMap.current[type]) {
      itemRefsMap.current[type] = {};
    }
    itemRefsMap.current[type][id] = ref;
  }, []);
  
  const unregisterItemRef = React.useCallback((type, id) => {
    if (itemRefsMap.current[type]) {
      delete itemRefsMap.current[type][id];
    }
  }, []);
  
  const scrollToItem = React.useCallback((type, id) => {
    const ref = itemRefsMap.current[type]?.[id];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    return false;
  }, []);

  const [actualDrawerWidthLeft, setActualDrawerWidthLeft] = React.useState(drawerWidth);
  const [actualDrawerWidthRight, setActualDrawerWidthRight] = React.useState(drawerWidth);
  
  const [isEditable, setIsEditable] = React.useState(true);
  const drawerRefLeft = React.useRef(null);
  const drawerRefRight = React.useRef(null);
  const toolbarRef = React.useRef(null);
  const [toolbarHeight, setToolbarHeight] = React.useState(0);

  const handleDrawerLeftClose = () => {
    setOpenTabVerticalLeft(false);
  };

  const handleDrawerRightClose = () => {
    setOpenTabVerticalRight(false);
  };

  // Measure left drawer content width
  React.useEffect(() => {
    if (openTabVerticalLeft && drawerRefLeft.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
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
        for (let entry of entries) {
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
    const measureToolbarHeight = () => {
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

  const {
    versionRef,
    saveEditorContent,
    editorStateRef,
  } = useContext(UnitContext);
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);

  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  const initialConfig = {
    namespace: 'LanguageEditor',
    nodes: [...EditorNodes],
    theme: LanguageEditorTheme,
    onError,
  };

  // Create debounced save function with stable reference
  const debouncedSaveTimer = useRef(null);
  const debouncedSave = useCallback(() => {
    if (debouncedSaveTimer.current) {
      clearTimeout(debouncedSaveTimer.current);
    }
    debouncedSaveTimer.current = setTimeout(() => {
      saveEditorContent();
    }, DEBOUNCE_SAVE_DELAY_MS);
  }, [saveEditorContent]);

  const onChange = useCallback(async (editorState, editor, tags) => {
    // Skip saves for DataPlugin updates and history operations (undo/redo)
    if (tags && (tags.has(DATASTORE_UPDATE_TAG) || tags.has(HISTORY_MERGE_TAG) || tags.has(INITIAL_LOAD_TAG) ||
      tags.has(HISTORIC_TAG) || tags.has(HISTORY_PUSH_TAG))) {
      console.log('[Editor onChange] Skipping save due to tags:', Array.from(tags));
      return;
    }

    // Skip if we haven't loaded initial state yet (editorStateRef not set)
    if (!editorStateRef.current) {
      console.log('[Editor onChange] Skipping save - no initial state loaded yet');
      return;
    }

    // Get the current state as JSON string for comparison
    const newStateJSON = JSON.stringify(editorState.toJSON());
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
  }, [debouncedSave, editorStateRef]);

  // const cellEditorConfig = {
  //   namespace: 'LanguageEditor',
  //   nodes: [...TableCellNodes],
  //   onError: (error) => {
  //     console.log('cellEditorConfig error', error);
  //     throw error;
  //   },
  //   theme: LanguageEditorTheme,
  // };

  // Memoize the tab provider value to prevent unnecessary re-renders
  const tabProviderValue = React.useMemo(() => ({
    ...tabState,
    focusItem,
    setFocusItem,
    itemRefs: itemRefsMap,
    registerItemRef,
    unregisterItemRef,
    scrollToItem,
  }), [tabState, focusItem, registerItemRef, unregisterItemRef, scrollToItem]);

  return (
    <TabProvider value={tabProviderValue}>
      <SuggestionProvider>
        <DndWrapper>
          <AutocompleteProvider>
            <AudioPlayerProvider>
              <LexicalComposer initialConfig={initialConfig}>
            <style jsx global>{`
            .layout-container {
              display: grid;
            }

            .layout-container > div {
              margin: 0.25rem;
              padding: 0.25rem;
              border: 1px dashed #ccc;
            }

            .editor:focus {
              outline: none;
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
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
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <TablePlugin />
          <CodeActionMenuPlugin />
          <WordBlockPlugin />
          <QuizPlugin />
          <DataPlugin />
          <MeaningAssociationPlugin />
          <PlaylistPlugin />
          <PdfViewerPlugin />
          <AutocompletePlugin />
          <DragDropPastePlugin />
          <ImagesPlugin />
          <LayoutPlugin />
          <AnswerPlugin />
          <CustomAnswerPlugin />
          <BlockSuggestionPlugin useAI={true} />
          <AIContentCompletionPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
          <YouTubePlugin />
          <EditorRefPlugin />
          {!floatingAnchorElem ? null : (
            <>
              <FloatingLinkEditorPlugin
                anchorElem={floatingAnchorElem}
                isLeftDrawerOpen={openTabVerticalLeft}
                isRightDrawerOpen={openTabVerticalRight}
                appBarHeight={toolbarHeight}
              />

              <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
            </>
          )}




          <Box sx={{
            display: 'flex',
            overflow: 'hidden',
          }}>
            <ToolBarPlugin
              ref={toolbarRef}
              setOpen={setOpenTabVerticalLeft}
              open={openTabVerticalLeft}
              setTabValue={setTabValueLeft}
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
                  height: 'var(--app-bar-height, 11rem)',
                }}
              >
                <IconButton onClick={handleDrawerLeftClose}>
                  {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
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
            <Box component="main" sx={{
              flexGrow: 1,
              padding: 0,
              width: `calc(100% - ${openTabVerticalLeft ? actualDrawerWidthLeft : 40}px - ${openTabVerticalRight ? actualDrawerWidthRight : 40}px)`,
              transition: 'width 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              boxShadow: 'none',
            }}>
              <DrawerHeader
                style={{
                  height: 'var(--app-bar-height, 11rem)',
                  flexShrink: 0,
                }}
              />
              <div
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
                    minHeight: '100%',
                    paddingLeft: '2.5rem',
                  }}
                >
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      className="editor"
                      aria-label="Main editor content"
                      aria-placeholder="Enter some text..."
                      style={{
                        maxWidth: '100%',
                        outline: 'none',
                      }}
                    />
                  }
                  placeholder={<div>Enter some text...</div>}
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <MyOnChangePlugin onChange={onChange} />
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
                  height: 'var(--app-bar-height, 11rem)',
                  justifyContent: 'flex-start',
                }}
              >
                <IconButton onClick={handleDrawerRightClose}>
                  {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
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


export function Workbook() {
  const theme = useTheme();
  const [openTab, setOpenTab] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const drawerRef = React.useRef(null);
  const [actualDrawerWidth, setActualDrawerWidth] = React.useState(drawerWidth);
  const [currentDrawerWidth, setCurrentDrawerWidth] = React.useState(drawerWidth);

  const handleDrawerOpen = () => {
    setOpenTab(true);
  };

  const handleDrawerClose = () => {
    setOpenTab(false);
  };

  // Measure drawer content width
  React.useEffect(() => {
    if (openTab && drawerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0) {
            setActualDrawerWidth(width);
          }
        }
      });

      resizeObserver.observe(drawerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [openTab]);

  // Memoize config to prevent recreation on every render
  const initialConfig = React.useMemo(() => ({
    namespace: 'LanguageEditor',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    // editorState: unit?.data,
    // nodes: [...EditorNodes],
    editorState: null,
    nodes: [
      ...EditorNodes,
    ]
  }), []); // Empty deps since values don't change



  return (
    <DndWrapper>
      <AutocompleteProvider>
        <AudioPlayerProvider>
        <LexicalComposer
          initialConfig={initialConfig}
        >
          <style jsx global>{`
          .layout-container {
            display: grid;
          }

          .layout-container > div {
            margin: 0.25rem;
            padding: 0.25rem;
          }
        `}</style>
          <AutoFocusPlugin />
          <CheckListPlugin />
          <HashtagPlugin />
          <HorizontalRulePlugin />
          <ListPlugin />
          <TabIndentationPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <TablePlugin />
          <LexicalClickableLinkPlugin />
          <YouTubePlugin />
          <WordBlockPlugin />
          <QuizPlugin />
          <DataPlugin />
          <StoryProgressPlugin />
          <MeaningAssociationPlugin />
          <PlaylistPlugin />
          <PdfViewerPlugin />
          <ImagesPlugin />
          <QuizPlugin />
          <AnswerPlugin />
          <CustomAnswerPlugin />
          <UnitCompletedPlugin />

          <Box sx={{
            display: 'flex',
            overflow: 'hidden',
            height: 'calc(100vh - var(--app-bar-height, 11rem))',
          }}>

            {
              // Replace with read only toolbar
            }
            <ToolBarRoPlugin
              setOpen={setOpenTab}
              open={openTab}
              setTabValue={setTabValue}
            />
            <Drawer
              ref={drawerRef}
              drawerwidth={currentDrawerWidth}
              sx={{
                height: '100%',
                flexShrink: 0,
                position: 'relative',
              }}
              variant="permanent" open={openTab}>
              <DrawerHeader
                style={{
                  minHeight: '11rem',
                  // backgroundColor: '#fafafa',
                }}
              >

              </DrawerHeader>

              {
                // Replace with read only tabs
              }
              <VerticalTabsRo
                setOpen={setOpenTab}
                open={openTab}
                setDrawerWidth={setCurrentDrawerWidth}
                value={tabValue}
                setValue={setTabValue}
              />
            </Drawer>
            <Box component="main" sx={{
              flexGrow: 1,
              flexShrink: 1,
              minWidth: 0,
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
              transition: (theme) => theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              marginLeft: 0,
            }}>
              <DrawerHeader
                style={{
                  minHeight: '11rem',
                }}
              />

              <RichTextPlugin
                contentEditable={
                  <div className="editor"
                    key={`editor-${actualDrawerWidth}-${openTab}`}
                    style={{
                      margin: '0',
                      padding: '0',
                      paddingLeft: '2.5rem', // Space for draggable handles
                      height: 'calc(100vh - 11rem)',
                      overflowY: 'auto',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <ContentEditable
                      aria-label="Workbook content"
                      style={{
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                }
                placeholder=""
                ErrorBoundary={LexicalErrorBoundary}
              />

            </Box>
          </Box>

        </LexicalComposer>
        </AudioPlayerProvider>
      </AutocompleteProvider>
    </DndWrapper>
  );
}

