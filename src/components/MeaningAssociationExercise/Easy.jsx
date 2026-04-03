import * as React from 'react';
import { useState, useEffect } from 'react';
import UnitContext from '../../context/unitContext';
import { Grid, Box } from '@mui/material';
import { LinearProgressWithLabel, AnswerDrop } from '.';
import { CompletionScreen } from './CompletionScreen';

import DictionaryContext from '../../context/dictionaryContext';
import { shuffle } from './utils';
import {DragBox} from './DragBox'

import { Word } from '../../models';




export const Easy = ({
  tabIndex, setTabIndex, nodeKey, wordIDs,
}) => {

  let [assignment, setAssignment] = React.useState([]);
  const [answers, setAnswers] = React.useState([]);
  
  const [filterEasy, setFilterEasy] = React.useState([]);
  const [verifiedAnswers, setVerifiedAnswers] = React.useState([]);
  const [completedEasy, setCompletedEasy] = React.useState(0);
  const [startPositionEasy, setStartPositionEasy] = React.useState(0);
  const [showCompletion, setShowCompletion] = React.useState(false);
  const hasAutoShownCompletion = React.useRef(false);

  // Seed combines nodeKey with a per-mount random value so order
  // differs each visit but stays stable within the session
  const mountSeed = React.useRef(Math.floor(Math.random() * 2147483647));
  const shuffleSeed = React.useMemo(() => {
    let hash = mountSeed.current;
    const str = String(nodeKey) + '-easy';
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
    console.log('MeaningAssociationExercise._vocabulary', _vocabulary)
    setAssignment([..._vocabulary])
    setAnswers([..._vocabulary])
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
    const isComplete = inProgress?.easy?.complete;
    if (isComplete && !hasAutoShownCompletion.current) {
      hasAutoShownCompletion.current = true;
      setShowCompletion(true);
    }
  }, [inProgress?.easy?.complete]);
  
  console.log('Easy.nodeKey', nodeKey, 'type:', typeof nodeKey);
  console.log('Easy.grade:', grade);
  console.log('Easy.grade.data:', grade?.data);
  console.log('Easy.grade.data === grade?', grade?.data === grade);
  console.log('Easy.grade.data keys:', grade?.data ? Object.keys(grade.data) : 'no data');
  console.log('Easy.grade.data[nodeKey]:', grade?.data?.[nodeKey]);
  console.log('Easy.inProgress', inProgress);

  // Update progress state when grade data changes
  useEffect(() => {
    if (inProgress && Object.keys(inProgress).length > 0) {
      const verified = inProgress?.easy?.verifiedAnswers || [];
      const percentComplete = (inProgress?.easy?.percentComplete || 0) * 100;
      
      setFilterEasy(verified);
      setVerifiedAnswers(verified);
      setCompletedEasy(percentComplete);
      setStartPositionEasy(verified.length);
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

  // Filter out matched cards from stable order — no reshuffling
  const easyVocab = shuffledDragOrder
    .filter(word => !filterEasy.includes(word?.id))
    .map(word => <DragBox answer={word.phrase} wordID={word.id} key={word.id} />);

  // Find the first unmatched word in the stable shuffled order
  const correctAnswer = shuffledWords.find(word => !filterEasy.includes(word?.id));
  const currentQuestion = startPositionEasy;
  const percentComplete = completedEasy;
  const loadAttemptedAnswers = inProgress?.easy?.attemptedAnswers || {};


  let _correctAnswer = '';

  // console.log('Easy.correctAnswer', correctAnswer)
  if (typeof correctAnswer === 'string') {
    _correctAnswer = dictionary[correctAnswer];
  } else {
    _correctAnswer = correctAnswer;
  }

  // console.log('Easy._correctAnswer', _correctAnswer)
  const correctId = _correctAnswer?.id;
  const correctWord = _correctAnswer;
  // const attemptsCount = inProgress?.easy?.attemptsCount || 0; 

  // const [attemptedAnswers, setAttemptedAnswers] = useState(loadAttemptedAnswers);

  const totalWords = shuffledWords.length;


  async function progressAssignment(draggedWordID, targetWordID) {
    // Verify the match is correct
    if (draggedWordID !== targetWordID) {
      console.error('Mismatch in Easy progressAssignment:', draggedWordID, targetWordID);
      return;
    }

    let newTab = tabIndex;
    let allTabsComplete = false;
    let thisExerciseComplete = false;
    let _verified = [...new Set([...verifiedAnswers, targetWordID])];

    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

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

    // setAttemptedAnswers(_attemptedAnswers);
    // setAttemptsCount(attempts);

    // Check completion against the full word count, not filtered length
    if (_verified.length === totalWords) {
      // // console.log('newIndex === length')
      thisExerciseComplete = true;

      const completedHard = inProgress.hard?.complete;
      const completedLearn = inProgress.learn?.complete;
      if (completedHard && completedLearn) {
        allTabsComplete = true;
      }

      // Don't auto-advance, show completion screen instead
      // newTab++;
    
    } 

    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'easy': {}
      };
    }

    // console.log('easy _verified.length / length,', _verified.length, totalWords)
    savedGradeCopy[nodeKey]['easy'] = {
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

    savedGradeCopy[nodeKey].tabIndex = newTab;

    // Update local state immediately before saving to prevent reset
    setFilterEasy(_verified);
    setVerifiedAnswers(_verified);
    setStartPositionEasy(_verified.length);
    setCompletedEasy((_verified.length / totalWords) * 100);

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

    // for each array in attempted answers sum the lengths
    let attemptedAnswersLength = 0;
    Object.entries(_attemptedAnswers).forEach(([key, value]) => {
      attemptedAnswersLength += value.length;
    });
    
    const attempts = attemptedAnswersLength;

    // setAttemptsCount(attempts);


    let savedGradeCopy = JSON.parse(JSON.stringify(gradeData));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'easy': {}
      };
    }

    // console.log('easy verifiedAnswers.length / length,', verifiedAnswers.length, totalWords)
    // console.log('easy currentQuestion+1 / length', currentQuestion + 1, totalWords)
    savedGradeCopy[nodeKey]['easy'] = {
      verifiedAnswers,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: verifiedAnswers.length / attempts,
      percentComplete: currentQuestion / totalWords,
      complete: false
    };

    savedGradeCopy[nodeKey].tabIndex = 1;

    await saveGrade(savedGradeCopy);



  }

  function sendPass() {
    console.log('sendPass');
  }

  const handleContinueFromCompletion = () => {
    setShowCompletion(false);
    setTabIndex(2); // Move to Hard mode
  };

  const handleDismissCompletion = () => {
    setShowCompletion(false);
  };

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
            levelName="Easy Mode"
            accuracy={verifiedAnswers.length / (inProgress?.easy?.attemptsCount || 1)}
            attempts={inProgress?.easy?.attemptsCount || 0}
            onContinue={handleContinueFromCompletion}
            onDismiss={handleDismissCompletion}
            nextLevelName="Hard Mode"
            isLastLevel={false}
          />
      ) : (
      <Grid container direction="column" spacing={1} sx={{ overflow: 'hidden', height: '100%', width: '100%', maxWidth: '100%' }}>
      <Grid item xs={12} sx={{ flexShrink: 0, width: '100%' }}>
        <LinearProgressWithLabel value={percentComplete} />
      </Grid>
      <Grid item xs={12} container direction={{ xs: 'column', sm: 'row' }} spacing={1} wrap="nowrap" sx={{ overflow: 'hidden', flex: '1 1 auto', minHeight: 0, width: '100%', maxWidth: '100%' }}>
      <Grid item xs={12} sm={8} md={8} lg={8} sx={{ minWidth: 0, height: { xs: 'auto', sm: '100%' }, flexShrink: 0 }}>
        <Box
          sx={{
            height: { xs: '200px', sm: '100%' },
            maxHeight: { xs: '200px', sm: '100%' },
            overflowY: 'hidden',
            overflowX: 'auto',
            display: 'flex',
          }}
        >
          <AnswerDrop
            correctAnswer={{ ...correctWord, progressAssignment, sendFail, sendPass }} />
        </Box>
      </Grid>
      <Grid item xs={12} sm={4} md={4} lg={4} sx={{ minWidth: 0, flex: { xs: '1 1 auto', sm: '0 0 auto' }, height: { xs: 'auto', sm: '100%' }, maxWidth: { xs: '100%', sm: '33.333333%' } }}>
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
            alignContent: 'flex-start',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {easyVocab}
        </Box>
      </Grid>
      </Grid>
    </Grid>
    )}
    </Box>
  );
};
