import * as React from 'react';
import {
  Box,
  Tab,
  Tabs,
  Card,
} from '@mui/material';
import ChatSidebar from './ChatSidebar';
import { DictionaryEditor } from './DictionaryEditor';
import { QuestionEditor } from './QuestionEditor';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function SidebarTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Card
    elevation={5}
    // boxShadow={3}
    style={{
      padding: '1rem',
      borderRadius: '3px',
      minWidth: '15rem',
      position: 'sticky',
      top: '8rem',
      // marginTop: '8rem',
    }}
  >
      <Box sx={{
        borderBottom: 1,
        borderColor: 'divider',
        padding: '0rem',
      }}>
        <Tabs
            value={value}
            onChange={handleChange} 
            keepMounted={true}
            aria-label="basic tabs example"
            // orientation='vertical' TODO add vertical tabs
        >
          <Tab label="Dictionary" {...a11yProps(0)} />
          <Tab label="Questions" {...a11yProps(1)} />
          <Tab label="Assistant" {...a11yProps(1)} />
          <Tab label="Files" {...a11yProps(2)} />
          <Tab label="Help" {...a11yProps(3)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
      <DictionaryEditor
        insertWordBlock={insertWordBlock}
      />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <QuestionEditor />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <ChatSidebar />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        File Manager
      </CustomTabPanel>
      <CustomTabPanel value={value} index={4}>
        Help goes here
      </CustomTabPanel>

      </Card>
  );
}