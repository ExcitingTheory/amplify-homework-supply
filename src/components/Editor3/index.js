import * as React from 'react';
import { useContext, useState, useCallback } from 'react';

import { styled, useTheme } from '@mui/material/styles';
// import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VerticalTabsRo from './components/VerticalTabsRo';
import VerticalTabs from './components/VerticalTabs';

import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $getRoot, $getSelection } from 'lexical';


import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';

import { LexicalComposer } from '@lexical/react/LexicalComposer';


import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
// import {CharacterLimitPlugin} from '@lexical/react/LexicalCharacterLimitPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import LexicalClickableLinkPlugin from '@lexical/react/LexicalClickableLinkPlugin';
// import {CollaborationPlugin} from '@lexical/react/LexicalCollaborationPlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
// import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
// import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
// import useLexicalEditable from '@lexical/react/useLexicalEditable';
import {
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table'

// import {
//   Grid,
// } from '@mui/material';

import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
// import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import ToolBarPlugin from './plugins/ToolBarPlugin';


import UnitContext from '../../context/unitContext';
// import SidebarTabs from '../SidebarTabs';

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
import ToolBarRoPlugin from './plugins/ToolBarRoPlugin';

import PlaylistPlugin, {
  PlaylistNode,
} from './plugins/PlaylistPlugin';

import { LayoutPlugin } from './plugins/LayoutPlugin';
import { LayoutContainerNode } from './components/LayoutContainerNode';
import { LayoutItemNode } from './components/LayoutItemNode';

import UnitCompletedPlugin from './plugins/UnitCompletedPlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper.js';

import { TableNode as NewTableNode } from './components/TableNode';
import { TablePlugin } from './plugins/TablePlugin';

import TableCellNodes from './components/TableCellNodes';
import { TableContext } from './plugins/TablePlugin';

import LanguageEditorTheme from './components/LanguageEditorTheme';
import TableCellResizerPlugin from './plugins/TableCellResizerPlugin';

// import AutoSave from './components/AutoSave';

import AnswerPlugin from './plugins/AnswerPlugin.js';
import { AnswerNode } from './plugins/AnswerPlugin.js';
import CustomAnswerPlugin, { CustomAnswerNode } from './plugins/CustomAnswerPlugin.js';


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
  // Custom Nodes
  YouTubeNode,
  WordBlockNode,
  MeaningAssociationNode,
  AutocompleteNode,
  ImageNode,
  QuizNode,
  PlaylistNode,
  LayoutContainerNode,
  LayoutItemNode,
  NewTableNode,
  AnswerNode,
  CustomAnswerNode,
];

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
// function onChange(editorState) {
//   // console.log('onChange', JSON.stringify(editorState));
//   editorState.read(() => {
//     // Read the contents of the EditorState here.
//     const root = $getRoot();
//     const selection = $getSelection();

//     console.log(root, selection);
//   });
// }

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error) {
  console.error(error);
}


// export const _theme = {
//   ltr: 'ltr',
//   rtl: 'rtl',
//   paragraph: 'editor-paragraph',
//   quote: 'editor-quote',
//   heading: {
//     h1: 'editor-heading-h1',
//     h2: 'editor-heading-h2',
//     h3: 'editor-heading-h3',
//     h4: 'editor-heading-h4',
//     h5: 'editor-heading-h5',
//     h6: 'editor-heading-h6',
//   },
//   list: {
//     nested: {
//       listitem: 'editor-nested-listitem',
//     },
//     ol: 'editor-list-ol',
//     ul: 'editor-list-ul',
//     listitem: 'editor-listItem',
//     listitemChecked: 'editor-listItemChecked',
//     listitemUnchecked: 'editor-listItemUnchecked',
//   },
//   hashtag: 'editor-hashtag',
//   image: 'editor-image',
//   link: 'editor-link',
//   text: {
//     bold: 'editor-textBold',
//     code: 'editor-textCode',
//     italic: 'editor-textItalic',
//     strikethrough: 'editor-textStrikethrough',
//     subscript: 'editor-textSubscript',
//     superscript: 'editor-textSuperscript',
//     underline: 'editor-textUnderline',
//     underlineStrikethrough: 'editor-textUnderlineStrikethrough',
//   },
//   code: 'editor-code',
//   codeHighlight: {
//     atrule: 'editor-tokenAttr',
//     attr: 'editor-tokenAttr',
//     boolean: 'editor-tokenProperty',
//     builtin: 'editor-tokenSelector',
//     cdata: 'editor-tokenComment',
//     char: 'editor-tokenSelector',
//     class: 'editor-tokenFunction',
//     'class-name': 'editor-tokenFunction',
//     comment: 'editor-tokenComment',
//     constant: 'editor-tokenProperty',
//     deleted: 'editor-tokenProperty',
//     doctype: 'editor-tokenComment',
//     entity: 'editor-tokenOperator',
//     function: 'editor-tokenFunction',
//     important: 'editor-tokenVariable',
//     inserted: 'editor-tokenSelector',
//     keyword: 'editor-tokenAttr',
//     namespace: 'editor-tokenVariable',
//     number: 'editor-tokenProperty',
//     operator: 'editor-tokenOperator',
//     prolog: 'editor-tokenComment',
//     property: 'editor-tokenProperty',
//     punctuation: 'editor-tokenPunctuation',
//     regex: 'editor-tokenVariable',
//     selector: 'editor-tokenSelector',
//     string: 'editor-tokenSelector',
//     symbol: 'editor-tokenProperty',
//     tag: 'editor-tokenProperty',
//     url: 'editor-tokenOperator',
//     variable: 'editor-tokenVariable',
//   },
// };


const DEBOUNCE_SAVE_DELAY_MS = 2000 // 2 seconds

function debounce(func, timeout = DEBOUNCE_SAVE_DELAY_MS) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}


const drawerWidth = 400;

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
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
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
  const theme = useTheme();
  const [openTab, setOpenTab] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const [isEditable, setIsEditable] = React.useState(true);
  const { unit } = useContext(UnitContext);

  const handleDrawerOpen = () => {
    setOpenTab(true);
  };

  const handleDrawerClose = () => {
    setOpenTab(false);
  };

  const {
    saveEditorContent,
    editorStateRef,
    editorSelectionRef,
  } = useContext(UnitContext);
  const [floatingAnchorElem, setFloatingAnchorElem] = useState(null);
  // const isEditable = useLexicalEditable();
  // const _drawerWidth = 400;
  // const drawerWidthPx = `${_drawerWidth}px}`;

  // console.log('LanguageEditor.unit', unit);





  const initialConfig = {
    namespace: 'LanguageEditor',
    theme: LanguageEditorTheme,
    onError,
    // editorState: unit?.data,
    // nodes: [...EditorNodes],
    editorState: null,
    nodes: [
      ...EditorNodes,
      // Don't forget to register your custom node separately!
      // CustomListNode,
      // {
      //     replace: ListNode,
      //     with: (node) => {
      //         return new CustomListNode();
      //     }
      // },
      // CustomListItemNode,
      // {
      //     replace: ListItemNode,
      //     with: (node) => {
      //         return new CustomListItemNode();
      //     }
      // }
    ]
  };

  const onChange = async (editorState) => {
      editorStateRef.current = editorState
      // debouncedSave() // TODO - fix this
    };

  const debouncedSave = debounce(async () => {
        await saveEditorContent()
        console.log("Save editor content")
        // setIsWorking(false)
    }, DEBOUNCE_SAVE_DELAY_MS);

  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };


  const cellEditorConfig = {
    namespace: 'LanguageEditor',
    nodes: [...TableCellNodes],
    onError: (error) => {
      console.log('cellEditorConfig error', error);
      throw error;
    },
    theme: LanguageEditorTheme,
  };

  return (
    <DndWrapper>
      <AutocompleteProvider>
        <TableContext>
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
            {/* <ToolBarPlugin /> */}
            <AutoFocusPlugin />
            <CheckListPlugin />
            <ClearEditorPlugin />
            <HashtagPlugin />
            <HistoryPlugin />
            <HorizontalRulePlugin />
            <ListPlugin />
            <TabIndentationPlugin />
            <TableCellResizerPlugin />
            <TablePlugin cellEditorConfig={cellEditorConfig}>
              <AutoFocusPlugin />
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="TableNode__contentEditable" />
                }
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <ImagesPlugin captionsEnabled={false} />
              <LinkPlugin />
            </TablePlugin>
            <AutoLinkPlugin />
            <YouTubePlugin />
            <AutoEmbedPlugin />
            <WordBlockPlugin />
            <LinkPlugin />
            <QuizPlugin />
            <DataPlugin />
            <MeaningAssociationPlugin />
            <PlaylistPlugin />
            <AutocompletePlugin />
            <DragDropPastePlugin />
            <ImagesPlugin />
            <LayoutPlugin />
            <AnswerPlugin />
            <CustomAnswerPlugin />
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
                sx={{
                  height: 'calc(100vh - 9.5rem)',

                }}
                variant="permanent" open={openTab}>
                <DrawerHeader
                  style={{
                    minHeight: '9.5rem',
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
              <Box component="main" sx={{ flexGrow: 1, padding: 0 }}>
                <DrawerHeader
                  style={{
                    minHeight: '9.5rem',
                  }}
                />

                <RichTextPlugin
                  contentEditable={
                    <div className="editor" ref={onRef}
                      style={{
                        margin: '0',
                        padding: '0',
                        // marginTop: '3.3rem',
                      }}
                    >
                      <ContentEditable
                        style={{
                          minHeight: 'calc(100vh - 9.5rem)',
                          maxWidth: openTab ? `calc(100vw - ${drawerWidth}px)` : `calc(100vw - 4rem)`,
                        }}
                      />
                    </div>
                  }
                  placeholder=""
                  ErrorBoundary={LexicalErrorBoundary}
                />


                {/* <OnChangePlugin onChange={onChange} /> */}
                <OnChangePlugin ignoreSelectionChange onChange={onChange} />


              </Box>
            </Box>

          </LexicalComposer>
        </TableContext>
      </AutocompleteProvider>
    </DndWrapper>
  );
}


export function Workbook() {
  const theme = useTheme();
  const [openTab, setOpenTab] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);

  const handleDrawerOpen = () => {
    setOpenTab(true);
  };

  const handleDrawerClose = () => {
    setOpenTab(false);
  };

  const cellEditorConfig = {
    namespace: 'LanguageEditor',
    nodes: [...TableCellNodes],
    onError: (error) => {
      console.log('cellEditorConfig error', error);
      throw error;
    },
    editable: false,
    theme: LanguageEditorTheme,
  };

  const initialConfig = {
    namespace: 'LanguageEditor',
    theme: LanguageEditorTheme,
    onError,
    editable: false,
    // editorState: unit?.data,
    // nodes: [...EditorNodes],
    editorState: null,
    nodes: [
      ...EditorNodes,
      // Don't forget to register your custom node separately!
      // CustomListNode,
      // {
      //     replace: ListNode,
      //     with: (node) => {
      //         return new CustomListNode();
      //     }
      // },
      // CustomListItemNode,
      // {
      //     replace: ListItemNode,
      //     with: (node) => {
      //         return new CustomListItemNode();
      //     }
      // }
    ]
  };



  return (
    <DndWrapper>
      <TableContext>
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
            <HashtagPlugin />
            <HorizontalRulePlugin />
            <ListPlugin />
            <TabIndentationPlugin />
            <TablePlugin cellEditorConfig={cellEditorConfig}>
              <RichTextPlugin
                contentEditable={false}
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <ImagesPlugin captionsEnabled={false} />
              <LinkPlugin />
            </TablePlugin>
            <LexicalClickableLinkPlugin />
            <YouTubePlugin />
            <WordBlockPlugin />
            <QuizPlugin />
            <DataPlugin />
            <MeaningAssociationPlugin />
            <PlaylistPlugin />
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
                sx={{
                  height: 'calc(100vh - 9.5rem)',

                }}
                variant="permanent" open={openTab}>
                <DrawerHeader
                  style={{
                    minHeight: '9.5rem',
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
              <Box component="main" sx={{ flexGrow: 1, padding: 0 }}>
                <DrawerHeader
                  style={{
                    minHeight: '9.5rem',
                  }}
                />

                <RichTextPlugin
                  contentEditable={
                    <div className="editor"
                      style={{
                        margin: '0',
                        padding: '0',
                        // marginTop: '3.3rem',
                      }}
                    >
                      <ContentEditable
                        style={{
                          minHeight: 'calc(100vh - 9.5rem)',
                          maxWidth: openTab ? `calc(100vw - ${drawerWidth}px)` : `calc(100vw - 4rem)`,
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
      </TableContext>
    </DndWrapper>
  );
}

