import * as React from 'react';
import { useEffect } from 'react';
import DictionaryContext from '../../context/dictionaryContext';
import UnitContext from '../../context/unitContext';
import {
  Grid, List,
  ListItem,
  Box,
  Typography
} from '@mui/material';
import { LinearProgressWithLabel, AnswerDropLearn } from '.';
import { CompletionScreen } from './CompletionScreen';
import { DragBox } from './DragBox';
import { shuffle } from './utils';



export const Learn = ({
  tabIndex, setTabIndex, nodeKey, wordIDs,
}) => {

  const [answers, setAnswers] = React.useState([]);
  const [length, setLength] = React.useState();
  const [vocabulary, setVocabulary] = React.useState([]);
  let [assignment, setAssignment] = React.useState([]);
  
  const [filterLearn, setFilterLearn] = React.useState([]);
  const [completedLearn, setCompletedLearn] = React.useState(0);
  const [startPositionLearn, setStartPositionLearn] = React.useState(0);
  const [dropAnswerVisibility, setDropAnswerVisibility] = React.useState([]);
  const [droppedPairs, setDroppedPairs] = React.useState({}); // Track which answer was dropped on which target
  const [showCompletion, setShowCompletion] = React.useState(false);
  const hasAutoShownCompletion = React.useRef(false);

  // Seed combines nodeKey with a per-mount random value so order
  // differs each visit but stays stable within the session
  const mountSeed = React.useRef(Math.floor(Math.random() * 2147483647));
  const shuffleSeed = React.useMemo(() => {
    let hash = mountSeed.current;
    const str = String(nodeKey) + '-learn';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [nodeKey]);

  const { wordMapId: dictionary } = React.useContext(DictionaryContext);

  useEffect(() => {
    // Use dictionary context instead of DataStore for Storybook compatibility
    const _vocabulary = wordIDs.map(id => dictionary[id]).filter(Boolean);
    console.log('Learn._vocabulary', _vocabulary)
    setVocabulary(_vocabulary)
    setAssignment([..._vocabulary])
    setAnswers([..._vocabulary])
    setLength(_vocabulary.length)
  }, [wordIDs, dictionary]);
  
  const { grade, saveGrade } = React.useContext(UnitContext);
  const gradeData = React.useMemo(() => {
    if (!grade?.data) return {};
    if (typeof grade.data === 'string') {
      try { return JSON.parse(grade.data); } catch { return {}; }
    }
    return grade.data;
  }, [grade?.data]);
  const inProgress = gradeData[nodeKey] || {};

  // Show completion screen once when exercise completes — don't re-show after dismiss
  React.useEffect(() => {
    const isComplete = inProgress?.learn?.complete;
    if (isComplete && !hasAutoShownCompletion.current) {
      hasAutoShownCompletion.current = true;
      setShowCompletion(true);
    }
  }, [inProgress?.learn?.complete]);

  // Update progress state when grade data changes
  useEffect(() => {
    if (inProgress && Object.keys(inProgress).length > 0) {
      const verified = inProgress?.learn?.verifiedAnswers || [];
      const percentComplete = (inProgress?.learn?.percentComplete || 0) * 100;
      const pairs = inProgress?.learn?.droppedPairs || {};
      
      setFilterLearn(verified);
      setCompletedLearn(percentComplete);
      setStartPositionLearn(verified.length);
      setDropAnswerVisibility(verified);
      setDroppedPairs(pairs);
    }
  }, [inProgress]);

  // Stable shuffled orders — computed once when answers load, never reshuffled mid-exercise
  const stableAssignment = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed + 2);
  }, [answers, shuffleSeed]);

  const shuffledDragOrder = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed + 1);
  }, [answers, shuffleSeed]);

  // Filter out matched cards from stable drag order — no reshuffling
  const easyVocab = shuffledDragOrder
    .filter(word => !filterLearn.includes(word?.id))
    .map(word => <DragBox answer={word.phrase} wordID={word.id} key={word.id} />);

  const easyAssignment = stableAssignment;
  const verifiedAnswers = filterLearn;
  const percentComplete = completedLearn;

  const totalWords = stableAssignment.length;
  const currentQuestion = startPositionLearn;

  
  const loadAttemptedAnswers = inProgress?.learn?.attemptedAnswers || {};
  const attemptsCount = inProgress?.learn?.attemptsCount || 0;

  async function progressAssignment(draggedWordID, targetWordID) {
    // Verify the match is correct
    if (draggedWordID !== targetWordID) {
      console.error('Mismatch in progressAssignment:', draggedWordID, targetWordID);
      return;
    }
    
    const newIndex = verifiedAnswers.length + 1;
    let newTab = tabIndex;
    let allTabsComplete = false;
    let thisExerciseComplete = false;
    
    // Use the current state values
    // Track which answer was dropped on which target
    let _droppedPairs = { ...droppedPairs };
    _droppedPairs[targetWordID] = draggedWordID; // Store the dropped wordID for this target

    // Add correctly matched wordID to verified list
    const _verified = [...new Set([...verifiedAnswers, targetWordID])];

    // Add to attempted answers
    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

    if (typeof _attemptedAnswers[targetWordID] === 'undefined') {
      _attemptedAnswers[targetWordID] = [];
    }

    _attemptedAnswers[targetWordID].push(draggedWordID);
    const attempts = attemptsCount + 1;
    
    if (_verified.length === totalWords) {
      thisExerciseComplete = true;
      // check for top level complete, all assignments are completed
      const completedEasy = inProgress.easy?.complete;
      const completedHard = inProgress.hard?.complete;
      if (completedEasy && completedHard) {
        allTabsComplete = true;
      }

      // Don't auto-advance, show completion screen instead
      // newTab++;
    }

    // Handle grade.data - it might be a string or object
    let gradeData = grade?.data || {};
    if (typeof gradeData === 'string') {
      try {
        gradeData = JSON.parse(gradeData);
      } catch (e) {
        gradeData = {};
      }
    }
    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'learn': {}
      };
    }

    savedGradeCopy[nodeKey]['learn'] = {
      verifiedAnswers: _verified,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: _verified.length / attempts,
      percentComplete: newIndex / totalWords,
      complete: thisExerciseComplete,
      droppedPairs: _droppedPairs,
    };

    if (allTabsComplete) {
      savedGradeCopy[nodeKey].complete = true;
    }

    savedGradeCopy[nodeKey].tabIndex = newTab;

    // Update local state immediately before saving to prevent reset
    setFilterLearn(_verified);
    setStartPositionLearn(_verified.length);
    setCompletedLearn((newIndex / totalWords) * 100);
    setDroppedPairs(_droppedPairs);

    await saveGrade(savedGradeCopy);

    // Show completion screen if exercise is complete
    if (thisExerciseComplete) {
      setShowCompletion(true);
    }
  }

  async function sendFail(draggedWordID, targetWordID) {
    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

    if (typeof _attemptedAnswers[targetWordID] === 'undefined') {
      _attemptedAnswers[targetWordID] = [];
    }


    _attemptedAnswers[targetWordID].push(draggedWordID);
    const attempts = attemptsCount + 1;

    // Handle grade.data - it might be a string or object
    let gradeData = grade?.data || {};
    if (typeof gradeData === 'string') {
      try {
        gradeData = JSON.parse(gradeData);
      } catch (e) {
        gradeData = {};
      }
    }
    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'learn': {}
      };
    }

    savedGradeCopy[nodeKey]['learn'] = {
      verifiedAnswers,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: verifiedAnswers.length / attempts,
      percentComplete: currentQuestion / totalWords,
      complete: false,
      tabIndex
    };

    savedGradeCopy[nodeKey].tabIndex = 0;

    console.log('Learn savedGradeCopy', savedGradeCopy)
    await saveGrade(savedGradeCopy);

  }


  function sendPass() {
    // // // console.log('sendPass')
  }
  const handleContinueFromCompletion = () => {
    setShowCompletion(false);
    setTabIndex(1); // Move to Easy mode
  };

  const handleDismissCompletion = () => {
    setShowCompletion(false);
  };

  const maxHeight = '15rem';

  return (
    <Box sx={{ 
      position: 'relative', 
      height: 'calc(100vh - var(--app-bar-height, 11rem))',
      maxHeight: 'calc(100vh - var(--app-bar-height, 11rem))',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw',
    }}>
      {showCompletion ? (
        <CompletionScreen
          levelName="Learn Mode"
          accuracy={dropAnswerVisibility.length / (inProgress?.learn?.attemptsCount || 1)}
          attempts={inProgress?.learn?.attemptsCount || 0}
          onContinue={handleContinueFromCompletion}
          onDismiss={handleDismissCompletion}
          nextLevelName="Easy Mode"
          isLastLevel={false}
        />
      ) : (
      <Grid container direction="column" spacing={1} sx={{ overflow: 'hidden', height: '100%', width: '100%', maxWidth: '100%' }}>
      <Grid item xs={12} sx={{ flexShrink: 0, width: '100%' }}>
        <LinearProgressWithLabel value={percentComplete} />
      </Grid>
      <Grid item xs={12} container direction={{ xs: 'column', sm: 'row' }} spacing={1} wrap="nowrap" sx={{ overflow: 'hidden', flex: '1 1 auto', minHeight: 0, width: '100%', maxWidth: '100%' }}>
      <Grid item xs={12} sm={4} md={4} lg={4} sx={{ minWidth: 0, flex: { xs: '1 1 auto', sm: '0 0 auto' }, height: { xs: 'auto', sm: '100%' }, maxWidth: { xs: '100%', sm: '33.333333%' }, order: { xs: 2, sm: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0,
            height: { xs: 'auto', sm: '100%' },
            maxHeight: { xs: 'none', sm: '100%' },
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: 0.5,
            width: '100%',
            maxWidth: '100%',
            alignContent: 'flex-start',
            boxSizing: 'border-box',
          }}
        >
          {easyVocab}
        </Box>
      </Grid>
      <Grid item xs={12} sm={8} md={8} lg={8} sx={{ minWidth: 0, height: { xs: '120px', sm: '100%' }, maxHeight: { xs: '120px', sm: '100%' }, flexShrink: 0, maxWidth: { xs: '100%', sm: '66.666667%' }, order: { xs: 1, sm: 1 } }}>
        <Box
          sx={{
            height: '100%',
            maxHeight: '100%',
            overflowY: { xs: 'hidden', sm: 'auto' },
            overflowX: { xs: 'auto', sm: 'hidden' },
            display: { xs: 'flex', sm: 'block' },
            flexDirection: { xs: 'row', sm: 'column' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <List
            sx={{
              display: { xs: 'flex', sm: 'block' },
              flexDirection: { xs: 'row', sm: 'column' },
              padding: 0,
              gap: { xs: 1, sm: 0 },
              width: { xs: 'max-content', sm: 'auto' },
            }}
          >
          {easyAssignment.map((listItem, id) => {
            // console.log('SimpleList listItem', listItem)
            let _correctWord = '';
            if (typeof listItem === 'string') {
              // console.log('SimpleList typeof _correctWord', _correctWord)
              _correctWord = dictionary[listItem];
            } else {
              _correctWord = listItem;
            }

            const phrase = _correctWord?.phrase;
            const definition = _correctWord?.definition;
            const pronunciation = _correctWord?.pronunciation;
            let audioFile = null;

            //if there are more than one audio files, use a random one
            if (_correctWord?.audio?.length > 1) {
              const randomIndex = Math.floor(Math.random() * _correctWord?.audio?.length);
              audioFile = _correctWord.audio[randomIndex];
            } else if (_correctWord?.audio?.length === 1) {
              audioFile = _correctWord?.audio[0];
            }

            // Check if this word has been matched
            const matchedWordId = droppedPairs[_correctWord?.id];
            const matchedWord = matchedWordId ? dictionary[matchedWordId] : null;

            return <AnswerDropLearn 
              key={_correctWord?.id}
              id={_correctWord?.id}
              correctAnswer={{ ..._correctWord, progressAssignment, sendFail, sendPass }}
              pronunciation={pronunciation}
              definition={definition}
              phrase={phrase}
              matchedWord={matchedWord}
              isMatched={!!matchedWordId}
            />;

          })}

        </List>
        </Box>
      </Grid>
      </Grid>
    </Grid>
    )}
    </Box>
  );
};
