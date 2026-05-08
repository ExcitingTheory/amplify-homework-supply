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
import { useTranslations } from 'next-intl';

import {
  Box,
  Tabs,
  Tab,
  AppBar,
  LinearProgress,
  Typography,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { Easy } from './Easy';
import { Hard } from './Hard';
import { Learn } from './Learn';
import { DndWrapper } from './DndWrapper';
import UnitContext from '../../context/unitContext';
import getCachedUrl from '../../utils/getCachedUrl';


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

/** Lightweight play button that signs an S3 audio path and plays it */
export const PlayAudioButton = ({ audioPaths, size = 'small' }) => {
  const audioRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);

  const handlePlay = React.useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!audioPaths || audioPaths.length === 0) return;

    // Pick a random audio path from the array
    const path = audioPaths[Math.floor(Math.random() * audioPaths.length)];
    if (!path) return;

    try {
      const url = await getCachedUrl(path);
      if (!url) return;

      // Stop any existing playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      setPlaying(true);
      audio.addEventListener('ended', () => setPlaying(false));
      audio.addEventListener('error', () => setPlaying(false));
      await audio.play();
    } catch (err) {
      console.error('PlayAudioButton error:', err);
      setPlaying(false);
    }
  }, [audioPaths]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!audioPaths || audioPaths.length === 0) return null;

  return (
    <IconButton
      size={size}
      onClick={handlePlay}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      aria-label={t('common.playAudio', { ns: 'common' })}
      sx={{
        color: playing ? 'primary.main' : 'text.secondary',
        flexShrink: 0,
        p: 0.5,
      }}
    >
      <VolumeUpIcon fontSize={size} />
    </IconButton>
  );
};

/** Static card shown in completed state for Easy/Hard — shows the word with a check or X */
export const ResultCard = ({ phrase, passed, audioPaths }) => {
  return (
    <Box
      data-testid="result-card"
      data-passed={passed}
      sx={{
        fontSize: '1.2rem',
        margin: '.3rem',
        padding: '.8rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderRadius: '8px',
        border: passed
          ? '2px solid var(--mui-palette-success-main, #4caf50)'
          : '2px solid var(--mui-palette-error-main, #f44336)',
        backgroundColor: passed
          ? 'var(--mui-palette-success-light, #e8f5e9)'
          : 'var(--mui-palette-error-light, #ffebee)',
        color: passed
          ? 'var(--mui-palette-success-dark, #2e7d32)'
          : 'var(--mui-palette-error-dark, #c62828)',
        fontWeight: 500,
        width: '140px',
        minWidth: '140px',
        maxWidth: '140px',
        boxSizing: 'border-box',
        flexShrink: 0,
        justifyContent: 'center',
        textAlign: 'center',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      }}
    >
      {passed ? (
        <CheckCircleIcon sx={{ fontSize: '1rem', flexShrink: 0 }} />
      ) : (
        <CancelIcon sx={{ fontSize: '1rem', flexShrink: 0 }} />
      )}
      {phrase}
      <PlayAudioButton audioPaths={audioPaths} />
    </Box>
  );
};

/** Static drop target shown in Learn completed state — shows matched word with pass/fail icon */
export const ResultDropLearn = ({ pronunciation, definition, matchedWord, passed, audioPaths, definitionAudioPaths }) => {
  const borderColor = passed
    ? 'var(--mui-palette-success-main, #4caf50)'
    : 'var(--mui-palette-error-main, #f44336)';
  const backgroundColor = passed
    ? 'var(--mui-palette-success-light, #e8f5e9)'
    : 'var(--mui-palette-error-light, #ffebee)';

  return (
    <ListItem
      data-testid="result-drop-learn"
      data-passed={passed}
      sx={{
        margin: '0.25rem 0',
        padding: '0.75rem',
        border: `1px solid ${borderColor}`,
        backgroundColor: backgroundColor,
        borderRadius: '8px',
        boxSizing: 'border-box',
        width: '100%',
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
        {passed ? (
          <CheckCircleIcon sx={{ fontSize: '1.2rem', color: 'var(--mui-palette-success-main, #4caf50)', mt: '2px', flexShrink: 0 }} />
        ) : (
          <CancelIcon sx={{ fontSize: '1.2rem', color: 'var(--mui-palette-error-main, #f44336)', mt: '2px', flexShrink: 0 }} />
        )}
        <ListItemText
          primary={
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, marginBottom: '0.25rem' }}>
                <Typography component="span" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {matchedWord?.phrase}
                </Typography>
                <PlayAudioButton audioPaths={audioPaths} />
              </Box>
              <Typography component="span" style={{ display: 'block', fontStyle: 'italic', color: 'var(--mui-palette-text-disabled)', marginBottom: '0.25rem' }}>
                {pronunciation}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography component="span" variant="body2" color="textSecondary">{definition}</Typography>
              <PlayAudioButton audioPaths={definitionAudioPaths} />
            </Box>
          }
        />
      </Box>
    </ListItem>
  );
};

export const AnswerDropLearn = ({ correctAnswer, pronunciation, definition, id, phrase, matchedWord, isMatched, audioPaths, definitionAudioPaths }) => {
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'box',
    drop: () => ({ correctAnswer: correctAnswer, targetWordID: id }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  const isActive = canDrop && isOver
  let borderColor = 'var(--mui-palette-text-disabled)'
  let backgroundColor = 'var(--mui-palette-action-disabledBackground)'
  
  if (isMatched) {
    borderColor = 'var(--mui-palette-divider)'
    backgroundColor = 'var(--mui-palette-action-selected)'
  } else if (isActive) {
    borderColor = 'var(--mui-palette-primary-main)'
    backgroundColor = 'var(--mui-palette-action-focus)'
  } else if (canDrop) {
    borderColor = 'var(--mui-palette-text-primary)'
  }

  return (
    <ListItem 
      ref={drop} 
      key={id}
      data-testid="drop-target-learn"
      data-word-id={id}
      data-is-matched={isMatched}
      sx={{ 
        margin: '0.25rem 0', 
        padding: '0.75rem', 
        border: `1px solid ${borderColor}`,
        backgroundColor: backgroundColor,
        borderRadius: '8px',
        boxSizing: 'border-box',
        width: { xs: '220px', sm: '100%' },
        minWidth: { xs: '220px', sm: 'auto' },
        maxWidth: { xs: '220px', sm: '100%' },
        flexShrink: 0,
      }}
    >
      {isMatched && matchedWord ? (
        // Show complete information when matched
        <ListItemText 
          primary={
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, marginBottom: '0.25rem' }}>
                <Typography component="span" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {matchedWord.phrase}
                </Typography>
                <PlayAudioButton audioPaths={audioPaths} />
              </Box>
              <Typography component="span" style={{ display: 'block', fontStyle: 'italic', color: 'var(--mui-palette-text-disabled)', marginBottom: '0.25rem' }}>
                {pronunciation}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography component="span" variant="body2" color="textSecondary">{definition}</Typography>
              <PlayAudioButton audioPaths={definitionAudioPaths} />
            </Box>
          }
        />
      ) : (
        // Show only pronunciation/definition when not matched
        <ListItemText 
          primary={pronunciation}
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography component="span" variant="body2" color="textSecondary">{definition}</Typography>
              <PlayAudioButton audioPaths={definitionAudioPaths} />
            </Box>
          }
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
  let borderColor = 'var(--mui-palette-text-disabled)'
  let backgroundColor = 'var(--mui-palette-action-disabledBackground)'
  if (isActive) {
    borderColor = 'var(--mui-palette-primary-main)'
    backgroundColor = 'var(--mui-palette-action-focus)'
  } else if (canDrop) {
    borderColor = 'var(--mui-palette-text-primary)'
  }
  return (
    <>
      <Box
        ref={drop}
        borderRadius={3}
        border={1}
        data-testid="drop-target"
        data-word-id={correctAnswer?.id}
        style={{
          borderStyle: 'dashed',
          width: '100%',
          maxWidth: '100%',
          minWidth: '0',
          height: '100%',
          maxHeight: '100%',
          overflow: 'hidden',
          alignContent: 'center',
          justifyContent: 'center',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          backgroundColor: backgroundColor,
        }}
      >

        <div
          style={{
            width: '100%',
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            gap: '0.5rem',
          }}
        
        >
        {correctAnswer?.definition}
        <PlayAudioButton audioPaths={correctAnswer?.definitionAudio || correctAnswer?.audio} />
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
      style={{
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        boxSizing: 'border-box',
        flex: value === index ? '1 1 auto' : undefined,
        minHeight: 0,
        display: value === index ? 'flex' : 'none',
        flexDirection: 'column',
      }}
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

  const t = useTranslations('common');
  const { grade } = React.useContext(UnitContext);
  const gradeData = React.useMemo(() => {
    if (!grade?.data) return {};
    if (typeof grade.data === 'string') {
      try { return JSON.parse(grade.data); } catch { return {}; }
    }
    return grade.data;
  }, [grade?.data]);
  const inProgress = gradeData[nodeKey] || {};
  
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
    <Box sx={{ width: '100%', maxWidth: '100vw', overflow: 'hidden', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
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
          aria-label={t('common.filter', { ns: 'common' })}
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
                  {learnComplete && <CheckCircleIcon style={{ fontSize: '1rem', color: 'var(--mui-palette-success-main, #4caf50)' }} />}
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
                  {easyComplete && <CheckCircleIcon style={{ fontSize: '1rem', color: 'var(--mui-palette-success-main, #4caf50)' }} />}
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
                  {hardComplete && <CheckCircleIcon style={{ fontSize: '1rem', color: 'var(--mui-palette-success-main, #4caf50)' }} />}
                </Box>
              } 
              {...a11yProps(enabledModes.indexOf('hard'))} 
            />
          )}
        </Tabs>
      </AppBar>
      <DndWrapper>
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
      </DndWrapper>
    </Box>
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
      maxWidth: '100vw',
      minHeight: '400px',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
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
