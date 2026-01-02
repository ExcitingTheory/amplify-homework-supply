import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { DictionaryEditor } from '../../DictionaryEditor';
import { QuestionEditor } from '../../QuestionEditor';

import ChatSidebar from '../../ChatSidebar';
import TableOfContents from './TableOfContents';


import DictionaryIcon from '@mui/icons-material/LibraryBooks';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import ConfigIcon from '@mui/icons-material/Settings';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import TocIcon from '@mui/icons-material/Toc';

import FileManager from './FileManager';
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
      }}
      {...other}
    >
      {value === index && (
        <>
          {children}
        </>
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

export default function VerticalTabs({
  setOpen,
  value,
  setValue,
}) {

  const handleChange = (event, newValue) => {
    setOpen(true);
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        flexGrow: 1, 
        bgcolor: 'background.paper', 
        display: 'flex',
        flexDirection: 'row',
        borderRight: '1px solid #e0e0e0',
      }}
    >
      <Tabs
        orientation="vertical"
        variant="standard"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        sx={{
          overflowY: 'hidden',
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
          }
        }}
      >

        <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<EditCalendarIcon />} {...a11yProps('Assignments')} />
        <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<TocIcon />} {...a11yProps('Table of Contents')} />
        <Tab 
          onClick={() => {
            setOpen(true);
          }}
          label={<DictionaryIcon />} {...a11yProps('Dictionary')} />
        <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<QuestionMarkOutlined />} {...a11yProps('Questions')} />
        <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<FolderIcon />} {...a11yProps('Files')} />
        <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<ChatIcon />} {...a11yProps('AI Assistant')} />
        <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<ConfigIcon />} {...a11yProps('Configuration')} />
        {/* <Tab label="Item Five" {...a11yProps(4)} />
        <Tab label="Item Six" {...a11yProps(5)} />
        <Tab label="Item Seven" {...a11yProps(6)} /> */}
      </Tabs>
      <TabPanel value={value} index={0}>
        <AssignmentConfiguration />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <TableOfContents />
      </TabPanel>
      <TabPanel value={value} index={2} overflowY='hidden' >
        <DictionaryEditor />
      </TabPanel>
      <TabPanel value={value} index={3} overflowY='hidden'>
        <QuestionEditor />
      </TabPanel>  
      <TabPanel value={value} index={4} overflowY='hidden'>
        <FileManager />
      </TabPanel>
      <TabPanel value={value} index={5} overflowY='hidden'>
        <ChatSidebar />
      </TabPanel>
      <TabPanel value={value} index={6}>
        <ConfigurationManager />
      </TabPanel>
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
