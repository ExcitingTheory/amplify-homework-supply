/**
 * @module MeaningAssociationExercise
 * @category Components
 * @description MeaningAssociationExercise component
 * 
 * MeaningAssociationExercise component for the app.
 * 
 * This component is a game where the user has to match the words with their
 * meanings. The user can listen to the words by clicking on the play button.
 * 
 * 
 */

import * as React from 'react'
import { useDrop } from 'react-dnd'

import {
  Box,
  Tabs,
  Tab,
  AppBar,
  LinearProgress,
  Typography,
  ListItem,
  ListItemText
} from '@mui/material';
import { Easy } from './Easy';
import { Hard } from './Hard';
import { Learn } from './Learn';


export function LinearProgressWithLabel(props) {
  return (
    <>
      <Box display="flex" alignItems="center" margin={1}>
        <Box width="80%">
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box width='fit-content' marginLeft={1}>
          <Typography variant="body2" color="textSecondary">{`${Math.round(
            props.value,
          )}%`}</Typography>
        </Box>
      </Box>
    </>
  );
}

export const AnswerDropLearn = ({ correctAnswer, pronunciation, definition, id }) => {
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'box',
    drop: () => ({ correctAnswer: correctAnswer }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  const isActive = canDrop && isOver
  let borderColor = '#CCC' //theme.palette.text.hint
  if (isActive) {
    borderColor = '#333' //theme.palette.text.secondary
  } else if (canDrop) {
    borderColor = '#000' //theme.palette.text.primary
  }
  return (
    <ListItem ref={drop} key={id} style={{ margin: '0.25rem 0', padding: '0.5rem', border: `thin dotted ${borderColor}` }}>
      <ListItemText primary={pronunciation}
        secondary={definition}
      />
    </ListItem>
  )
}

export const AnswerDrop = ({ correctAnswer }) => {

  // console.log('AnswerDrop correctAnswer', correctAnswer)

  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'box',
    drop: () => ({ correctAnswer: correctAnswer }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  const isActive = canDrop && isOver
  let borderColor = '#CCC' //theme.palette.text.hint
  if (isActive) {
    borderColor = '#333' //theme.palette.text.secondary
  } else if (canDrop) {
    borderColor = '#000' //theme.palette.text.primary
  }
  return (
    <>
      <Box
        ref={drop}
        borderRadius={3}
        border={1}
        style={{
          borderStyle: 'dashed',
          // minHeight: '5rem',
          height: '15rem',
          overflow: 'auto',
          alignContent: 'center',
          justifyContent: 'center',
          display: 'flex',
          flexDirection: 'column',

          paddingTop: '8vh',
          margin: '0 1rem 0 0',
          padding: '1rem',
          borderRadius: '3px',
          border: `thin dotted ${borderColor}`
        }}
      >

        <div
          style={{
            width: 'fit-content',
            alignItems: 'center',
            alignSelf: 'center',
            display: 'flex',
            flexDirection: 'column',

          }}
        
        >
        {correctAnswer?.definition}
        </div>
      </Box>
      {/* <Paper
        style={{
          margin: '1rem',
          padding: '1rem'
        }}>
        {correctAnswer?.definition}
      </Paper> */}
    </>
  )
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      {...other}
    >
      {children}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `scrollable-auto-tab-${index}`,
    'aria-controls': `scrollable-auto-tabpanel-${index}`,
  };
}

const MeaningAssociationTabs = ({
  nodeKey,
  wordIDs,
}) => {

  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // React.useEffect(() => {
  //   setTabIndex(initialTab)
  // }, [initialTab])

  return (
    <>
      <AppBar

        elevation={2}
        style={{
          borderRadius: '3px',
        }}
        position="static" color="inherit" margin={1}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable tabs of different difficulties"
          style={{
            margin: 0,
            padding: 0,
          }}
        >
          <Tab label="Learn" {...a11yProps(0)} />
          <Tab label="Easy" {...a11yProps(1)} />
          <Tab label="Hard" {...a11yProps(2)} />
        </Tabs>
      </AppBar>
      {/* <DndWrapper> */}
        <TabPanel value={tabIndex} index={0}>
            <Learn
              nodeKey={nodeKey}
              setTabIndex={setTabIndex}
              tabIndex={tabIndex}
              wordIDs={wordIDs}
            />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
            <Easy
              nodeKey={nodeKey}
              setTabIndex={setTabIndex}
              tabIndex={tabIndex}
              wordIDs={wordIDs}
            />
        </TabPanel>
        <TabPanel value={tabIndex} index={2}>
            <Hard
              nodeKey={nodeKey}
              setTabIndex={setTabIndex}
              tabIndex={tabIndex}
              wordIDs={wordIDs}
            />
        </TabPanel>
      {/* </DndWrapper> */}
    </>
  )
}

const MeaningAssociationExercise = ({
  nodeKey,
  wordIDs,
}) => {

  return (
    <div style={{
      flexGrow: 1,
      width: '100%',
      margin: 0,
      padding: 0,
    }}>
      <MeaningAssociationTabs
        nodeKey={nodeKey}
        wordIDs={wordIDs}
      />
    </div>
  )
}

export default MeaningAssociationExercise
