import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import FileManager2 from './FileManager2';
import { DictionaryEditor2 } from '../../DictionaryEditor2';
import { QuestionEditor2 } from '../../QuestionEditor2';
import { AudioPlayerProvider } from '../context/AudioPlayerContext';
import { useSuggestions } from '../context/SuggestionContext';

import ChatSidebar from '../../ChatSidebar';
import TableOfContents from './TableOfContents';
import BlockSuggestionMenu from './BlockSuggestionMenu';


import DictionaryIcon from '@mui/icons-material/LibraryBooks';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import ConfigIcon from '@mui/icons-material/Settings';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import TocIcon from '@mui/icons-material/Toc';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GradeIcon from '@mui/icons-material/Assessment';
import ForumIcon from '@mui/icons-material/Forum';

import FileManager from './FileManager2';
import ConfigurationManager from './ConfigurationManager';
import AssignmentConfiguration from './AssignmentConfiguration';
import { QuestionMarkOutlined } from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, overflowY, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      style={{
        width: '100%',
        minWidth: 0,
        height: 'calc(100vh - var(--app-bar-height, 11rem))',
        overflow: overflowY === 'hidden' ? 'hidden' : 'auto',
        direction: 'rtl', // Flips scrollbar to left
      }}
      {...other}
    >
      {value === index && (
        <div style={{ direction: 'ltr', height: '100%' }}> {/* Flip content back to normal */}
          {children}
        </div>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
    'aria-label': index
  };
}

export default function TabsVerticalRight({
  setOpen,
  open,
  value,
  setValue,
  setDrawerWidth,
}) {
  const [isResizing, setIsResizing] = React.useState(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);
  const wasClosedRef = React.useRef(false);
  
  // Get suggestion state from context
  const { suggestions, isLoadingAI, useAI, insertSuggestion, requestMoreSuggestions } = useSuggestions();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  // Handler for when a suggestion is clicked
  const handleSuggestionClick = React.useCallback((index) => {
    setSelectedIndex(index);
    const suggestion = suggestions[index];
    if (suggestion && insertSuggestion) {
      insertSuggestion(suggestion);
    }
  }, [suggestions, insertSuggestion]);

  const handleTabClick = (newValue) => {
    if (value === newValue && open) {
      // Clicking the already-active tab closes the drawer
      setOpen(false);
    } else {
      // Clicking a different tab opens drawer and switches to it
      setOpen(true);
      setValue(newValue);
    }
  };



  const handleMouseDown = (e) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    wasClosedRef.current = !open;
    
    if (!open) {
      // Opening from closed state
      setOpen(true);
      startWidthRef.current = 350; // Default width
    } else {
      // Store the current width from the parent's drawer ref
      const drawerElement = e.currentTarget.closest('.MuiDrawer-root');
      if (drawerElement) {
        startWidthRef.current = drawerElement.offsetWidth;
      }
    }
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = React.useCallback((e) => {
    if (!isResizing) return;
    
    // Calculate the change in X position (reversed for right drawer)
    const deltaX = startXRef.current - e.clientX;
    // Moving mouse left should increase drawer width
    const newWidth = startWidthRef.current + deltaX;
    
    if (newWidth < 250) {
      // Close the drawer if dragged below minimum
      setOpen(false);
      setIsResizing(false);
    } else if (newWidth <= 800 && setDrawerWidth) {
      setDrawerWidth(newWidth);
    }
  }, [isResizing, setDrawerWidth, setOpen]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove]);

  return (
    <Box
      sx={{
        flexGrow: 1, 
        bgcolor: 'background.paper', 
        display: 'flex',
        flexDirection: 'row',
        borderLeft: '1px solid #e0e0e0',
        position: 'relative',
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '5px',
          cursor: 'ew-resize',
          backgroundColor: isResizing ? '#1976d2' : 'transparent',
          zIndex: 1000,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
        onMouseLeave={(e) => !isResizing && (e.currentTarget.style.backgroundColor = 'transparent')}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0, order: 1 }}>
        <TabPanel value={value} index={5} overflowY='hidden'>
          <ChatSidebar />
        </TabPanel> 
        <TabPanel value={value} index={7}>
          <Box sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 2,
            m: 2,
            mb: 3
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'white',
              fontWeight: 600
            }}>
              <AutoAwesomeIcon sx={{ fontSize: 28 }} />
              AI Block Suggestions
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', lineHeight: 1.6 }}>
              AI-powered content block suggestions will appear here based on your current lesson content.
            </Typography>
          </Box>
          <Box sx={{ px: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ 
              display: 'block',
              mb: 2,
              fontStyle: 'italic'
            }}>
              Coming soon: Interactive suggestions panel with reasoning and priority indicators.
            </Typography>
            {/** Add unit suggestions list here in the future */}
            {/**  Add block suggestions list here */}
              <BlockSuggestionMenu
                suggestions={suggestions}
                selectedIndex={selectedIndex}
                onSelect={handleSuggestionClick}
                isLoadingAI={isLoadingAI}
                useAI={useAI}
                onRequestMore={requestMoreSuggestions}
              />
            {/*  Each suggestion shows preview of what it will look like in the editor as semi-transparent when the mouse hovers, clicking the suggestion will add. Important node when suggesting custom blocks we need ot add to the prompt the parameters too, for instance if something takes a list of questionIds or wordIds these need to be suggested as well */}
          </Box>
        </TabPanel>
        <TabPanel value={value} index={8}>
          <Box sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: 2,
            m: 2,
            mb: 3
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'white',
              fontWeight: 600
            }}>
              <GradeIcon sx={{ fontSize: 28 }} />
              Unit Grades
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', lineHeight: 1.6 }}>
              View grades and progress for this unit.
            </Typography>
          </Box>
          <Box sx={{ px: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              📊 Instructors:
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, pl: 2 }}>
              View all student grades and submissions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              ✍️ Learners:
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 2 }}>
              View your own grades and feedback
            </Typography>
          </Box>
        </TabPanel>
        <TabPanel value={value} index={9}>
          <Box sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            borderRadius: 2,
            m: 2,
            mb: 3
          }}>
            <Typography variant="h6" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#1a1a1a',
              fontWeight: 600
            }}>
              <ForumIcon sx={{ fontSize: 28, color: '#2196f3' }} />
              Cohort Chat
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.75)', lineHeight: 1.6 }}>
              Collaborate with your classmates and instructor.
            </Typography>
          </Box>
          <Box sx={{ px: 2 }}>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, borderLeft: '3px solid #2196f3' }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                💬 Tag <Box component="span" sx={{ px: 0.5, py: 0.25, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 0.5, fontFamily: 'monospace' }}>@kai</Box>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 3 }}>
                Get AI assistance in the discussion
              </Typography>
            </Box>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, borderLeft: '3px solid #ff9800' }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                🏷️ Use <Box component="span" sx={{ px: 0.5, py: 0.25, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 0.5, fontFamily: 'monospace' }}>#topics</Box>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 3 }}>
                Organize conversations by theme
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic', textAlign: 'center', mt: 2 }}>
              Share insights, ask questions, and learn together
            </Typography>
          </Box>
        </TabPanel>
      </Box>
      <Tabs
        orientation="vertical"
        variant="standard"
        value={value}
        aria-label="Vertical tabs example"
        sx={{
          overflowY: 'hidden',
          minWidth: '2.5rem',
          maxWidth: '2.5rem',
          order: 2,
          borderLeft: '1px solid #e0e0e0',
          '& .MuiTab-root': {
            minWidth: '2.5rem',
            maxWidth: '2.5rem',
            padding: '8px 4px',
            margin: 0,
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
          '& .MuiTabs-scroller': {
            margin: 0,
          },
          '& .MuiTabs-indicator': {
            left: 0,
            right: 'auto',
          }
        }}
      >

        
        <Tab
          value={5}
          onClick={() => handleTabClick(5)}
          label={<ChatIcon />} {...a11yProps('AI Assistant')} />
        <Tab
          value={7}
          onClick={() => handleTabClick(7)}
          label={<AutoAwesomeIcon />} {...a11yProps('AI Suggestions')} />
        <Tab
          value={8}
          onClick={() => handleTabClick(8)}
          label={<GradeIcon />} {...a11yProps('Grades')} />
        <Tab
          value={9}
          onClick={() => handleTabClick(9)}
          label={<ForumIcon />} {...a11yProps('Cohort Chat')} />
      </Tabs>
    </Box>
  );
}
