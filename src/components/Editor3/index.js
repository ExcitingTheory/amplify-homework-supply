import * as React from 'react';
import { useContext, useState, useCallback, useRef, useEffect } from 'react';

import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VerticalTabsRo from './components/VerticalTabsRo';
import VerticalTabs from './components/VerticalTabs';

import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $getRoot, $getSelection, HISTORIC_TAG, HISTORY_PUSH_TAG, HISTORY_MERGE_TAG } from 'lexical';
import { DATASTORE_UPDATE_TAG, INITIAL_LOAD_TAG } from './constants/updateTags';


import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';

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

import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import YouTubePlugin, {
  YouTubeNode,
} from './plugins/YouTubePlugin';

import WordBlockPlugin, {
  WordBlockNode,
} from './plugins/WordBlockPlugin';

import MeaningAssociationPlugin, { MeaningAssociationNode } from './plugins/MeaningAssociationPlugin';

import QuizPlugin, { QuizNode } from './plugins/QuizPlugin';

import LinkPlugin from './plugins/LinkPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';

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
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper.js';
import LanguageEditorTheme from './components/LanguageEditorTheme';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin.js';

import AnswerPlugin from './plugins/AnswerPlugin.js';
import { AnswerNode } from './plugins/AnswerPlugin.js';
import CustomAnswerPlugin, { CustomAnswerNode } from './plugins/CustomAnswerPlugin.js';
import { DataStore } from 'aws-amplify/datastore';
import { Unit } from '../../models';


export const EditorNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HorizontalRuleNode,
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
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      onChange(editorState, tags);
    });
  }, [editor, onChange]);
  return null;
}

const drawerWidth = 350;

const openedMixin = (theme) => ({
  width: drawerWidth,
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

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function Editor() {
  const editorRef = useRef(null); // Holds the Lexical editor instance
  // Removed local editorStateRef - using the one from context
  // Removed previousStateRef - version comparison in DataPlugin prevents loops
  const { unit } = useContext(UnitContext);
  const theme = useTheme();
  const [openTab, setOpenTab] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const [isEditable, setIsEditable] = React.useState(true);
  const drawerRef = React.useRef(null);
  const [actualDrawerWidth, setActualDrawerWidth] = React.useState(drawerWidth);

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
      console.log('[Editor onChange] Skipping save for tag:', Array.from(tags));
      return;
    }
    
    console.log('[Editor onChange] Saving editor state');
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

  return (
    <DndWrapper>
      <AutocompleteProvider>
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
              border: 1px dashed #ccc;
            }


            
        `}</style>
            {/* MINIMAL PLUGIN SET FOR DEBUGGING */}
            <AutoFocusPlugin />
            <CheckListPlugin />
            <ClearEditorPlugin />
            <CodeHighlightPlugin />
            <CodeActionMenuPlugin />
            <HashtagPlugin />
            <HistoryPlugin />
            <HorizontalRulePlugin />
            <ListPlugin />
            <TabIndentationPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <TablePlugin />
            <AutoLinkPlugin />
            <YouTubePlugin />
            <AutoEmbedPlugin />
            <WordBlockPlugin />
            <LinkPlugin />
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
            <EditorRefPlugin editorRef={editorRef} />
            {!floatingAnchorElem ? null : (
              <>
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isSidebarOpen={openTab}
                />

                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
              </>
            )}




            <Box sx={{
              display: 'flex',
              overflow: 'hidden',
            }}>
              <ToolBarPlugin
                setOpen={setOpenTab}
                open={openTab}
                setTabValue={setTabValue}
              />
              <Drawer
                ref={drawerRef}
                sx={{
                  height: '100%',
                  '& .MuiDrawer-paper': {
                    position: 'relative',
                    resize: openTab ? 'horizontal' : 'none',
                    overflow: openTab ? 'auto' : 'hidden',
                    minWidth: openTab ? '300px' : '2.5rem',
                    maxWidth: openTab ? '600px' : '2.5rem',
                  }
                }}
                variant="permanent" open={openTab}>
                <DrawerHeader
                  style={{
                    height: '11rem',
                    // backgroundColor: '#fafafa',
                  }}
                >
                  <IconButton onClick={handleDrawerClose}>
                    {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                  </IconButton>
                </DrawerHeader>
                <VerticalTabs
                  setOpen={setOpenTab}
                  value={tabValue}
                  setValue={setTabValue}
                />
              </Drawer>
              <Box component="main" sx={{ 
                flexGrow: 1, 
                padding: 0,
                width: openTab ? `calc(100% - ${actualDrawerWidth}px)` : 'calc(100% - 2.5rem)',
                transition: 'width 0.3s ease',
              }}>
                <DrawerHeader
                  style={{
                    height: '11rem',
                  }}
                />

                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      className="editor"
                      ref={onRef}
                      aria-placeholder="Enter some text..."
                      style={{
                        height: 'calc(100vh - 11rem)',
                        maxWidth: '100%',
                        overflowY: 'auto',
                        overflowX: 'auto',
                      }}
                    />
                  }
                  placeholder={<div>Enter some text...</div>}
                  ErrorBoundary={LexicalErrorBoundary}
                />

                <MyOnChangePlugin onChange={onChange} />

              </Box>
            </Box>

          </LexicalComposer>
      </AutocompleteProvider>
    </DndWrapper>
  );
}


export function Workbook() {
  const theme = useTheme();
  const [openTab, setOpenTab] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const drawerRef = React.useRef(null);
  const [actualDrawerWidth, setActualDrawerWidth] = React.useState(drawerWidth);

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
            <CodeHighlightPlugin />
            <CodeActionMenuPlugin />
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
            <UnitCompletedPlugin />

            <Box sx={{
              display: 'flex',
              overflow: 'hidden',
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
                sx={{
                  height: '100%',

                }}
                variant="permanent" open={openTab}>
                <DrawerHeader
                  style={{
                    minHeight: '11rem',
                    // backgroundColor: '#fafafa',
                  }}
                >
                  {/* <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton> */}
                </DrawerHeader>

                {
                  // Replace with read only tabs
                }
                <VerticalTabsRo
                  setOpen={setOpenTab}
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
              }}>
                <DrawerHeader
                  style={{
                    minHeight: '11rem',
                  }}
                />

                <RichTextPlugin
                  contentEditable={
                    <div className="editor"
                      style={{
                        margin: '0',
                        padding: '0',
                        height: 'calc(100vh - 11rem)',
                        overflowY: 'auto',
                      }}
                    >
                      <ContentEditable
                        style={{
                          width: '100%',
                          maxWidth: '100%',
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
        </AutocompleteProvider>
      </DndWrapper>
    );
}

