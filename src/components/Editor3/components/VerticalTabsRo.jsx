import * as React from 'react';
import { useTranslation } from 'next-i18next';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ChatSidebar from '../../ChatSidebar';
import ChatIcon from '@mui/icons-material/Chat';
import ConfigIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import TocIcon from '@mui/icons-material/Toc';

import GradeHistory from './GradeHistory';
import WorkbookSettings from './WorkbookSettings';
import TableOfContents from './TableOfContents';

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
      }}
      {...other}
    >
      {value === index && (
        <div style={{ height: '100%' }}>
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

export default function VerticalTabsRo({
  setOpen,
  open,
  value,
  setValue,
  setDrawerWidth,
}) {
  const { t } = useTranslation('workbook');
  const [isResizing, setIsResizing] = React.useState(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);
  const wasClosedRef = React.useRef(false);

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
    
    // Calculate the change in X position
    const deltaX = e.clientX - startXRef.current;
    // Moving mouse right should increase drawer width
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
        borderRight: '1px solid #e0e0e0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '5px',
          cursor: 'ew-resize',
          backgroundColor: isResizing ? '#1976d2' : 'transparent',
          zIndex: 100,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
        onMouseLeave={(e) => !isResizing && (e.currentTarget.style.backgroundColor = 'transparent')}
      />
      <Tabs
        orientation="vertical"
        variant="standard"
        value={value}
        aria-label="Vertical tabs example"
        sx={{
          overflow: 'hidden',
          minWidth: '2.5rem',
          maxWidth: '2.5rem',
          '& .MuiTab-root': {
            minWidth: '2.5rem',
            maxWidth: '2.5rem',
            padding: '8px 4px',
            margin: 0,
          },
          '& .MuiTabs-scroller': {
            borderRight: '1px solid #e0e0e0',
            margin: 0,
            overflow: 'hidden !important',
          },
          '& .MuiTabs-flexContainer': {
            overflow: 'hidden',
          }
        }}
      >

        <Tab
          onClick={() => handleTabClick(0)}
          label={<TocIcon />} {...a11yProps(t('verticalTabsRo.tableOfContents'))} />
        <Tab
          onClick={() => handleTabClick(1)}
          label={<HistoryIcon />} {...a11yProps(t('verticalTabsRo.previousAttempts'))} />
        <Tab
          onClick={() => handleTabClick(2)}
          label={<ChatIcon />} {...a11yProps(t('verticalTabsRo.aiAssistant'))} />
        <Tab
          onClick={() => handleTabClick(3)}
          label={<ConfigIcon />} {...a11yProps(t('verticalTabsRo.settings'))} />
        {/* <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<ChatIcon />} {...a11yProps('AI Assistant')} />
        <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<ConfigIcon />} {...a11yProps('Configuration')} /> */}
        {/* <Tab label="Item Five" {...a11yProps(4)} />
        <Tab label="Item Six" {...a11yProps(5)} />
        <Tab label="Item Seven" {...a11yProps(6)} /> */}
      </Tabs>
      <TabPanel value={value} index={0} overflowY='auto'>
        <TableOfContents />
      </TabPanel>
      <TabPanel value={value} index={1} overflowY='auto'>
        <GradeHistory />
      </TabPanel>
      <TabPanel value={value} index={2} overflowY='hidden'>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <ChatSidebar />
        </Box>
      </TabPanel>
      <TabPanel value={value} index={3} overflowY='auto'>
        <WorkbookSettings />
      </TabPanel>
      {/* <TabPanel value={value} index={3} overflowY='hidden'>
        <ChatSidebar />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <ConfigurationManager />
      </TabPanel> */}
      {/*<TabPanel value={value} index={4}>
        Item Five
      </TabPanel>
      <TabPanel value={value} index={5}>
        Item Six
      </TabPanel>
      <TabPanel value={value} index={6}>
        Item Seven
      </TabPanel> */}
    </Box>
  );
}
