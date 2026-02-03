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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Easy } from './Easy';
import { Hard } from './Hard';
import { Learn } from './Learn';
import UnitContext from '../../context/unitContext';


export function LinearProgressWithLabel(props) {
  return (
    <Box display="flex" alignItems="center">
      <Box flex={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box width='fit-content' marginLeft={1}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

export const AnswerDropLearn = ({ correctAnswer, pronunciation, definition, id, phrase, matchedWord, isMatched }) => {
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'box',
    drop: () => ({ correctAnswer: correctAnswer, targetWordID: id }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  const isActive = canDrop && isOver
  let borderColor = '#CCC' //theme.palette.text.hint
  let backgroundColor = 'transparent'
  
  if (isMatched) {
    borderColor = '#e0e0e0'
    backgroundColor = '#f5f5f5'
  } else if (isActive) {
    borderColor = '#333' //theme.palette.text.secondary
  } else if (canDrop) {
    borderColor = '#000' //theme.palette.text.primary
  }

  return (
    <ListItem 
      ref={drop} 
      key={id} 
      style={{ 
        margin: '0.25rem 0', 
        padding: '0.75rem', 
        border: `2px ${isMatched ? 'solid' : 'dotted'} ${borderColor}`,
        backgroundColor: backgroundColor,
        borderRadius: isMatched ? '8px' : '0',
      }}
    >
      {isMatched && matchedWord ? (
        // Show complete information when matched
        <ListItemText 
          primary={
            <Box>
              <Typography component="span" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                {matchedWord.phrase}
              </Typography>
              <Typography component="span" style={{ display: 'block', fontStyle: 'italic', color: '#888', marginBottom: '0.25rem' }}>
                {pronunciation}
              </Typography>
            </Box>
          }
          secondary={definition}
        />
      ) : (
        // Show only pronunciation/definition when not matched
        <ListItemText 
          primary={pronunciation}
          secondary={definition}
        />
      )}
    </ListItem>
  )
}

export const AnswerDrop = ({ correctAnswer }) => {

  // console.log('AnswerDrop correctAnswer', correctAnswer)

  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'box',
    drop: () => ({ correctAnswer: correctAnswer, targetWordID: correctAnswer.id }),
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
  enabledModes = ['learn', 'easy', 'hard'],
}) => {

  const { grade } = React.useContext(UnitContext);
  const inProgress = grade?.data?.[nodeKey] || {};
  
  // Load saved tab index or default to 0
  const savedTabIndex = inProgress?.tabIndex || 0;
  const [tabIndex, setTabIndex] = React.useState(savedTabIndex);

  // Update tab index when grade data changes (e.g., from another component)
  React.useEffect(() => {
    if (inProgress?.tabIndex !== undefined && inProgress.tabIndex !== tabIndex) {
      setTabIndex(inProgress.tabIndex);
    }
  }, [inProgress?.tabIndex]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Check completion status for each mode
  const learnComplete = inProgress?.learn?.complete || false;
  const easyComplete = inProgress?.easy?.complete || false;
  const hardComplete = inProgress?.hard?.complete || false;

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
          {enabledModes.includes('learn') && (
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Learn
                  {learnComplete && <CheckCircleIcon style={{ fontSize: '1rem', color: '#4caf50' }} />}
                </Box>
              } 
              {...a11yProps(enabledModes.indexOf('learn'))} 
            />
          )}
          {enabledModes.includes('easy') && (
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Easy
                  {easyComplete && <CheckCircleIcon style={{ fontSize: '1rem', color: '#4caf50' }} />}
                </Box>
              } 
              {...a11yProps(enabledModes.indexOf('easy'))} 
            />
          )}
          {enabledModes.includes('hard') && (
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Hard
                  {hardComplete && <CheckCircleIcon style={{ fontSize: '1rem', color: '#4caf50' }} />}
                </Box>
              } 
              {...a11yProps(enabledModes.indexOf('hard'))} 
            />
          )}
        </Tabs>
      </AppBar>
      {/* <DndWrapper> */}
        {enabledModes.includes('learn') && (
          <TabPanel value={tabIndex} index={enabledModes.indexOf('learn')}>
              <Learn
                nodeKey={nodeKey}
                setTabIndex={setTabIndex}
                tabIndex={tabIndex}
                wordIDs={wordIDs}
              />
          </TabPanel>
        )}
        {enabledModes.includes('easy') && (
          <TabPanel value={tabIndex} index={enabledModes.indexOf('easy')}>
              <Easy
                nodeKey={nodeKey}
                setTabIndex={setTabIndex}
                tabIndex={tabIndex}
                wordIDs={wordIDs}
              />
          </TabPanel>
        )}
        {enabledModes.includes('hard') && (
          <TabPanel value={tabIndex} index={enabledModes.indexOf('hard')}>
              <Hard
                nodeKey={nodeKey}
                setTabIndex={setTabIndex}
                tabIndex={tabIndex}
                wordIDs={wordIDs}
              />
          </TabPanel>
        )}
      {/* </DndWrapper> */}
    </>
  )
}

const MeaningAssociationExercise = ({
  nodeKey,
  wordIDs,
  enabledModes = ['learn', 'easy', 'hard'],
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
        enabledModes={enabledModes}
      />
    </div>
  )
}

export default MeaningAssociationExercise
