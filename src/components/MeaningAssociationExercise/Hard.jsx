import * as React from 'react';
import { useState, useEffect } from 'react';
import UnitContext from '../../context/unitContext';
import DictionaryContext from '../../context/dictionaryContext';
import { shuffle } from './utils';
import { DragBox } from './DragBox'


import { Grid, Box, IconButton, Button, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { LinearProgressWithLabel, AnswerDrop, ResultCard } from '.';

export const Hard = ({
  nodeKey, tabIndex, setTabIndex, wordIDs,
}) => {
  let [assignment, setAssignment] = React.useState([]);
  const [answers, setAnswers] = React.useState([]);
  const [length, setLength] = React.useState();
  const [vocabulary, setVocabulary] = React.useState([]);
  
  const [filterHard, setFilterHard] = React.useState([]);
  const [completedHard, setCompletedHard] = React.useState(0);
  const [startPositionHard, setStartPositionHard] = React.useState(0);
  const [verifiedAnswers, setVerifiedAnswers] = React.useState([]);
  const [showCompletion, setShowCompletion] = React.useState(false);
  const hasAutoShownCompletion = React.useRef(false);

  // Seed combines nodeKey with a per-mount random value so order
  // differs each visit but stays stable within the session
  const mountSeed = React.useRef(Math.floor(Math.random() * 2147483647));
  const shuffleSeed = React.useMemo(() => {
    let hash = mountSeed.current;
    const str = String(nodeKey) + '-hard';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [nodeKey]);

  const { wordMapId: dictionary } = React.useContext(DictionaryContext)

  useEffect(() => {
    // Use dictionary context instead of DataStore for Storybook compatibility
    const _vocabulary = wordIDs.map(id => dictionary[id]).filter(Boolean);
    console.log('Hard._vocabulary', _vocabulary)
    setVocabulary(_vocabulary)
    setAssignment([..._vocabulary])
    setAnswers([..._vocabulary])
    setLength(_vocabulary.length)
  }, [wordIDs, dictionary]);

  const { grade, saveGrade } = React.useContext(UnitContext);
  
  // Parse grade.data if it's a string
  const gradeData = React.useMemo(() => {
    if (!grade?.data) return {};
    if (typeof grade.data === 'string') {
      try {
        return JSON.parse(grade.data);
      } catch (e) {
        console.error('Failed to parse grade.data:', e);
        return {};
      }
    }
    return grade.data;
  }, [grade?.data]);
  
  const inProgress = gradeData[nodeKey] || {};

  // Show completion screen once when exercise completes — don't re-show after dismiss
  React.useEffect(() => {
    const isComplete = inProgress?.hard?.complete;
    if (isComplete && !hasAutoShownCompletion.current) {
      hasAutoShownCompletion.current = true;
      setShowCompletion(true);
    }
  }, [inProgress?.hard?.complete]);

  // Update progress state when grade data changes
  useEffect(() => {
    if (inProgress && Object.keys(inProgress).length > 0) {
      const verified = inProgress?.hard?.verifiedAnswers || [];
      const percentComplete = (inProgress?.hard?.percentComplete || 0) * 100;
      
      setFilterHard(verified);
      setVerifiedAnswers(verified);
      setCompletedHard(percentComplete);
      setStartPositionHard(verified.length);
    }
  }, [inProgress]);

  // Stable shuffled orders — computed once when answers load, never reshuffled mid-exercise
  const shuffledWords = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed);
  }, [answers, shuffleSeed]);

  const shuffledDragOrder = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed + 1);
  }, [answers, shuffleSeed]);

  const shuffledDropOrder = React.useMemo(() => {
    if (answers.length === 0) return [];
    return shuffle([...answers], shuffleSeed + 2);
  }, [answers, shuffleSeed]);

  // Hard mode shows ALL drag chips (matched ones stay visible), drop target changes
  const hardVocabList = shuffledDragOrder
    .filter(word => word?.phrase)
    .map(word => <DragBox answer={word.phrase} wordID={word.id} key={word.id} />);

  // Find the first unmatched word in the stable shuffled order
  const correctAnswer = shuffledWords.find(word => !filterHard.includes(word?.id));
  const currentQuestion = startPositionHard;
  const percentComplete = completedHard;
  const totalWords = shuffledWords.length;

  const loadAttemptedAnswers = inProgress?.hard?.attemptedAnswers || {};
  // const correctPhrase = correctAnswer?.phrase
  // If the type of correctAnswer is a string, then it is an Id and we need to look up the word
  let _correctAnswer = '';

  // console.log('Hard.correctAnswer', correctAnswer)
  // console.log('Hard.dictionary', dictionary)
  if (typeof correctAnswer === 'string') {
    _correctAnswer = dictionary[correctAnswer];
  } else {
    _correctAnswer = correctAnswer;
  }

  // console.log('Hard.correctAnswer', _correctAnswer)
  const correctId = _correctAnswer?.id;
  const correctWord = _correctAnswer;

  console.log('Hard.loadAttemptedAnswers', loadAttemptedAnswers)

  // const [attemptedAnswers, setAttemptedAnswers] = useState(loadAttemptedAnswers);


  async function progressAssignment(draggedWordID, targetWordID) {
    // Verify the match is correct
    if (draggedWordID !== targetWordID) {
      console.error('Mismatch in Hard progressAssignment:', draggedWordID, targetWordID);
      return;
    }

    let newTab = tabIndex;
    let allTabsComplete = false;
    let thisExerciseComplete = false;
    let _verified = [...new Set([...verifiedAnswers])];

    // Add to verified answers
    _verified.push(targetWordID);

    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));
    console.log('_attemptedAnswers', _attemptedAnswers)

    if (typeof _attemptedAnswers[targetWordID] === 'undefined') {
      _attemptedAnswers[targetWordID] = [];
    }

    console.log('_attemptedAnswers', _attemptedAnswers)

    _attemptedAnswers[targetWordID].push(draggedWordID);


    // for each array in attempted answers sum the lengths
    let attemptedAnswersLength = 0;
    Object.entries(_attemptedAnswers).forEach(([key, value]) => {
      attemptedAnswersLength += value.length;
    });
    
    const attempts = attemptedAnswersLength;

    console.log('Hard progress:', {
      verified: _verified.length, 
      total: totalWords,
      attempts,
      attemptedAnswers: _attemptedAnswers
    });

    // Check completion against the full word count
    if (_verified.length === totalWords) {
      thisExerciseComplete = true;
      const completedEasy = inProgress.easy?.complete;
      const completedLearn = inProgress.learn?.complete;
      if (completedEasy && completedLearn) {
        allTabsComplete = true;
      }

      // Don't auto-advance, show completion screen instead
      // newTab = 0;
    }

    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'hard': {}
      };
    }

    savedGradeCopy[nodeKey]['hard'] = {
      verifiedAnswers: _verified,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: _verified.length / attempts,
      percentComplete: _verified.length / totalWords,
      complete: thisExerciseComplete
    };

    if (allTabsComplete) {
      savedGradeCopy[nodeKey].complete = true;
    }

    savedGradeCopy[nodeKey].tabIndex = newTab; //Go back to beginning? TODO Follow up with a success page

    // Update local state immediately before saving to prevent reset
    setFilterHard(_verified);
    setVerifiedAnswers(_verified);
    setStartPositionHard(_verified.length);
    setCompletedHard((_verified.length / totalWords) * 100);

    await saveGrade(savedGradeCopy);

    // Show completion screen if exercise is complete
    if (thisExerciseComplete) {
      setShowCompletion(true);
    }
  }

  async function sendFail(draggedWordID, targetWordID) {

    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));
    console.log('sendFail._attemptedAnswers', _attemptedAnswers)

    if (typeof _attemptedAnswers[targetWordID] === 'undefined') {
      _attemptedAnswers[targetWordID] = [];
    }

    _attemptedAnswers[targetWordID].push(draggedWordID);

    // for each array in attempted answers sum the lengths
    let attemptedAnswersLength = 0;
    Object.entries(_attemptedAnswers).forEach(([key, value]) => {
      attemptedAnswersLength += value.length;
    });
    
    const attempts = attemptedAnswersLength;
    let newTab = tabIndex;

    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'hard': {}
      };
    }

    savedGradeCopy[nodeKey]['hard'] = {
      ...savedGradeCopy[nodeKey]['hard'],
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: verifiedAnswers.length / attempts,
      percentComplete: currentQuestion / totalWords,
      complete: false
    };

    savedGradeCopy[nodeKey].tabIndex = newTab;

    await saveGrade(savedGradeCopy);



  }

  function sendPass() {
    // // console.log('sendPass')
  }

  const handleContinueFromCompletion = () => {
    setShowCompletion(false);
    setTabIndex(0); // Go back to Learn mode or could show final completion
  };

  const handleDismissCompletion = () => {
    setShowCompletion(false);
  };

  // Check if all exercises are complete
  const allComplete = inProgress?.easy?.complete && inProgress?.learn?.complete;

  // Calculate min height: hard shows ALL cards (matched stay visible), ~56px per row of ~2 cards
  const cardRows = Math.ceil(hardVocabList.length / 2);
  const dropZoneMinHeight = Math.max(300, cardRows * 56);

  // Build result cards for completed state
  const resultCards = shuffledDragOrder
    .filter(word => word?.phrase)
    .map(word => {
      const attempts = loadAttemptedAnswers[word?.id] || [];
      const passed = attempts.length > 0 && attempts[0] === word?.id;
      return <ResultCard key={word?.id} phrase={word?.phrase} passed={passed} audioPaths={word?.audio} />;
    });

  const accuracyPercent = Math.round(
    (verifiedAnswers.length / (inProgress?.hard?.attemptsCount || 1)) * 100
  );

  return (
    <Box sx={{ 
      position: 'relative', 
      flex: '1 1 auto',
      minHeight: `${dropZoneMinHeight}px`,
      overflow: 'auto',
      width: '100%',
      maxWidth: '100vw',
    }}>
      {showCompletion ? (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', gap: 1, overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0, width: '100%' }}>
          <LinearProgressWithLabel value={100} />
        </Box>
        <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Hard Mode Complete — {accuracyPercent}% accuracy
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={handleDismissCompletion}>Back</Button>
            {allComplete ? (
              <Button variant="contained" color="success" size="small" onClick={handleContinueFromCompletion}>Finish Exercise</Button>
            ) : (
              <Button variant="contained" size="small" onClick={handleContinueFromCompletion}>Continue to Learn Mode</Button>
            )}
          </Box>
        </Box>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          flex: '1 1 auto',
          minHeight: 0,
          width: '100%',
          maxWidth: '100%',
          gap: 1,
          overflow: 'hidden',
        }}>
          {/* Blank drop zone */}
          <Box sx={{
            minWidth: 0,
            flex: { xs: '0 0 auto', sm: '1 1 0' },
            minHeight: { xs: `${dropZoneMinHeight}px`, sm: `${dropZoneMinHeight}px` },
            maxWidth: { xs: '100%', sm: '66.666667%' },
          }}>
            <Box sx={{
              height: '100%',
              minHeight: `${dropZoneMinHeight}px`,
              display: 'flex',
              borderRadius: '8px',
              border: '1px dashed var(--mui-palette-divider)',
              backgroundColor: 'var(--mui-palette-action-disabledBackground)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Typography variant="body2" color="textSecondary">Complete</Typography>
            </Box>
          </Box>
          {/* Result cards with check/X */}
          <Box sx={{
            minWidth: 0,
            flex: { xs: '1 1 auto', sm: '0 0 auto' },
            maxWidth: { xs: '100%', sm: '33.333333%' },
          }}>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              flexDirection: 'row',
              gap: 0,
              height: { xs: 'auto', sm: '100%' },
              minHeight: { xs: 'auto', sm: `${dropZoneMinHeight}px` },
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: 0.5,
              alignContent: 'flex-start',
              justifyContent: 'flex-start',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}>
              {resultCards}
            </Box>
          </Box>
        </Box>
      </Box>
      ) : (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', maxWidth: '100%', gap: 1, overflow: 'hidden' }}>
        <Box sx={{ flexShrink: 0, width: '100%' }}>
          <LinearProgressWithLabel value={percentComplete} />
        </Box>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          flex: '1 1 auto',
          minHeight: 0,
          width: '100%',
          maxWidth: '100%',
          gap: 1,
          overflow: 'hidden',
        }}>
          {/* Drop target */}
          <Box sx={{
            minWidth: 0,
            flex: { xs: '0 0 auto', sm: '1 1 0' },
            minHeight: { xs: `${dropZoneMinHeight}px`, sm: `${dropZoneMinHeight}px` },
            maxWidth: { xs: '100%', sm: '66.666667%' },
          }}>
            <Box sx={{
              height: '100%',
              minHeight: `${dropZoneMinHeight}px`,
              display: 'flex',
            }}>
              <AnswerDrop
                correctAnswer={{ ...correctWord, progressAssignment, sendFail, sendPass }} />
            </Box>
          </Box>
          {/* Drag cards */}
          <Box sx={{
            minWidth: 0,
            flex: { xs: '1 1 auto', sm: '0 0 auto' },
            maxWidth: { xs: '100%', sm: '33.333333%' },
          }}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                flexDirection: 'row',
                gap: 0,
                height: { xs: 'auto', sm: '100%' },
                minHeight: { xs: 'auto', sm: `${dropZoneMinHeight}px` },
                maxHeight: { xs: 'none', sm: '100%' },
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: 0.5,
                alignContent: 'flex-start',
                justifyContent: { xs: 'flex-start', sm: 'flex-start' },
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              {hardVocabList}
            </Box>
          </Box>
        </Box>
      </Box>
    )}
    </Box>
  );
};
