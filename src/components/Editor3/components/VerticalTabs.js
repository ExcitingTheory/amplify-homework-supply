import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { DictionaryEditor } from '../../DictionaryEditor';
import { QuestionEditor } from '../../QuestionEditor';

import ChatSidebar from '../../ChatSidebar';


import DictionaryIcon from '@mui/icons-material/LibraryBooks';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import ConfigIcon from '@mui/icons-material/Settings';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';

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
        height: 'calc(100vh - 9.5rem)',
        overflowY,
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
        flexGrow: 1, bgcolor: 'background.paper', display: 'flex'  }}
    >
      <Tabs
        orientation="vertical"
        // variant="scrollable"
        variant="standard"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        sx={{
          // position: 'sticky',
          borderRight: 1,
          borderColor: 'divider',
          overflowY: 'hidden',
          minWidth: '4rem',
          // position: 'fixed',
        }}

        // TabIndicatorProps={{
        //   sx: {          
        //      left: 0,
        //      marginLeft: '1px',
        //   }
        // }}
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
      <TabPanel value={value} index={0} overflowY='auto'>
        <AssignmentConfiguration />
      </TabPanel>
      <TabPanel value={value} index={1} overflowY='auto' >
        <DictionaryEditor />
      </TabPanel>
      <TabPanel value={value} index={2} overflowY='auto'>
        <QuestionEditor />
      </TabPanel>  
      <TabPanel value={value} index={3}>
        <FileManager />
      </TabPanel>
      <TabPanel value={value} index={4} overflowY='hidden'>
        <ChatSidebar />
      </TabPanel>
      <TabPanel value={value} index={5}>
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
