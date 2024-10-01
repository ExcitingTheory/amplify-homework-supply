import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { DictionaryEditor } from '../../DictionaryEditor';
import ChatSidebar from '../../ChatSidebar';


import ChatIcon from '@mui/icons-material/Chat';
import ConfigIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';

import FileManager from './FileManager';
import ConfigurationManager from './ConfigurationManager';
import AssignmentConfiguration from './AssignmentConfiguration';

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

export default function VerticalTabsRo({
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
          label={<HistoryIcon />} {...a11yProps('Previous Attempts')} />
        <Tab 
          onClick={() => {
            setOpen(true);
          }}
          label={<ChatIcon />} {...a11yProps('AI Assistant')} />
        {/* <Tab
          onClick={() => {
            setOpen(true);
          }}
          label={<ConfigIcon />} {...a11yProps('Configuration')} /> */}
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
        {/* <Assignments /> */}

      </TabPanel>
      <TabPanel value={value} index={1} overflowY='hidden' >
      <ChatSidebar />
      </TabPanel>
      {/* <TabPanel value={value} index={2} overflowY='auto'>
        <ConfigurationManager />
      </TabPanel> */}
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
