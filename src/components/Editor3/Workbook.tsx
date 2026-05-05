/**
 * Workbook Component - Read-only view of editor content for students
 */

import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { Box } from '@mui/material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClickableLinkPlugin as LexicalClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

import VerticalTabsRo from './components/VerticalTabsRo';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AutocompleteProvider } from './context/SharedAutocompleteContext';
import { DndWrapper } from '../MeaningAssociationExercise/DndWrapper';
import LanguageEditorTheme from './config/LanguageEditorTheme';

import StoryProgressPlugin from './plugins/StoryProgressPlugin';
// @ts-ignore - JSX file without proper module exports
import WorkbookStatePlugin from './plugins/WorkbookStatePlugin';
import ToolBarRoPlugin from './plugins/ToolBarRoPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import WordBlockPlugin from './plugins/WordBlockPlugin';
import QuizPlugin from './plugins/QuizPlugin';
import MeaningAssociationPlugin from './plugins/MeaningAssociationPlugin';
import PlaylistPlugin from './plugins/PlaylistPlugin';
import PdfViewerPlugin from './plugins/PdfViewerPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import AnswerPlugin from './plugins/AnswerPlugin';
import CustomAnswerPlugin from './plugins/CustomAnswerPlugin';
import UnitCompletedPlugin from './plugins/UnitCompletedPlugin';

import { EditorNodes, ALL_TRANSFORMERS, onError, DRAWER_WIDTH } from './editorConfig';
import { Drawer, DrawerHeader } from './styledComponents';
import { TutorPresenceBanner, WorkbookProgress, TutorCursorOverlay, WorkbookPresenceBar, AIFeedbackSnackbar } from '../Workbook';
import UnitContext from '../../context/unitContext';

/**
 * Workbook component - read-only editor view for students
 * Displays unit content with grading and progress tracking
 */
export function Workbook(): JSX.Element {
  const { t } = useTranslation('common');
  const [openTab, setOpenTab] = React.useState<boolean>(false);
  const [tabValue, setTabValue] = React.useState<number>(0);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const [actualDrawerWidth, setActualDrawerWidth] = React.useState<number>(DRAWER_WIDTH);
  const [currentDrawerWidth, setCurrentDrawerWidth] = React.useState<number>(DRAWER_WIDTH);
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleDrawerOpen = (): void => {
    setOpenTab(true);
  };

  const handleDrawerClose = (): void => {
    setOpenTab(false);
  };

  // Measure drawer content width
  React.useEffect(() => {
    if (openTab && drawerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
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

  // Track scroll position for header compression
  React.useEffect(() => {
    const handleScroll = (event: Event): void => {
      const target = event.target as HTMLElement;
      const scrollTop = target.scrollTop;
      setIsScrolled(scrollTop > 50);
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => {
        contentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Memoize config to prevent recreation on every render
  const initialConfig:any = React.useMemo(
    () => ({
      namespace: 'LanguageEditor',
      theme: LanguageEditorTheme,
      onError,
      editable: false,
      editorState: null,
      nodes: [...EditorNodes],
    }),
    []
  );

  return (
    <DndWrapper>
      <AutocompleteProvider>
        <AudioPlayerProvider>
          <LexicalComposer initialConfig={initialConfig}>
            {/* @ts-ignore - Next.js styled-jsx */}
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
            <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS} />
            <TablePlugin />
            <LexicalClickableLinkPlugin />
            <YouTubePlugin />
            <WordBlockPlugin />
            <QuizPlugin />
            <WorkbookStatePlugin />
            <StoryProgressPlugin />
            <MeaningAssociationPlugin />
            <PlaylistPlugin />
            <PdfViewerPlugin />
            <ImagesPlugin captionsEnabled={false} />
            <AnswerPlugin />
            <CustomAnswerPlugin />
            <UnitCompletedPlugin />

            <Box
              sx={{
                display: 'flex',
                overflow: 'hidden',
                height: '100vh',
              }}
            >
              <ToolBarRoPlugin
                setOpen={setOpenTab}
                open={openTab}
                setTabValue={setTabValue}
                isScrolled={isScrolled}
              />
              <Drawer
                ref={drawerRef}
                drawerwidth={currentDrawerWidth}
                sx={{
                  height: '100%',
                  flexShrink: 0,
                  position: 'relative',
                }}
                variant="permanent"
                open={openTab}
              >
                <DrawerHeader
                  style={{
                    minHeight: 'var(--app-bar-height, 11rem)',
                  }}
                />

                <VerticalTabsRo
                  setOpen={setOpenTab}
                  open={openTab}
                  setDrawerWidth={setCurrentDrawerWidth}
                  value={tabValue}
                  setValue={setTabValue}
                />
              </Drawer>
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  flexShrink: 1,
                  minWidth: 0,
                  margin: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                  transition: (theme) =>
                    theme.transitions.create('margin', {
                      easing: theme.transitions.easing.sharp,
                      duration: theme.transitions.duration.leavingScreen,
                    }),
                  marginLeft: 0,
                }}
              >
                <RichTextPlugin
                  contentEditable={
                    <div
                      className="editor"
                      ref={contentRef}
                      data-tour="workbook"
                      key={`editor-${actualDrawerWidth}-${openTab}`}
                      style={{
                        margin: '0',
                        padding: '0',
                        paddingTop: 'var(--app-bar-height, 11rem)',
                        paddingLeft: '1.5rem',
                        height: '100vh',
                        overflowY: 'auto',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <Box sx={{ px: 1, pt: 1 }}>
                        <WorkbookPresenceBar />
                        <TutorPresenceBanner />
                        <WorkbookProgress variant="compact" />
                      </Box>
                      <TutorCursorOverlay />
                      <ContentEditable
                        data-lexical-editor="true"
                        aria-label={t('navigation.workbook', { ns: 'common' })}
                        style={{
                          width: '100%',
                          maxWidth: '100%',
                          boxSizing: 'border-box',
                          minHeight: '100vh',
                          padding: '1rem 2rem 1rem 0.5rem',
                        }}
                      />
                    </div>
                  }
                  placeholder={null}
                  ErrorBoundary={LexicalErrorBoundary}
                />
              </Box>
            </Box>
          </LexicalComposer>
          <WorkbookAIFeedback />
        </AudioPlayerProvider>
      </AutocompleteProvider>
    </DndWrapper>
  );
}

/** Renders AIFeedbackSnackbar using UnitContext workbook provider */
function WorkbookAIFeedback() {
  const { workbook, workbookEnabled, session } = React.useContext(UnitContext);
  if (!workbookEnabled || !workbook?.provider) return null;
  return (
    <AIFeedbackSnackbar
      provider={workbook.provider}
      currentUsername={session?.username || ''}
    />
  );
}
