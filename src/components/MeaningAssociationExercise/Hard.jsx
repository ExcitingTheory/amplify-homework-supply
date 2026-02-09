import * as React from 'react';
import { useState, useEffect } from 'react';
import UnitContext from '../../context/unitContext';
import DictionaryContext from '../../context/dictionaryContext';
import { shuffle } from './utils';
import { DragBox } from './DragBox'
import { CompletionScreen } from './CompletionScreen';


import { Grid, Box } from '@mui/material';
import { LinearProgressWithLabel, AnswerDrop } from '.';

import { Word } from '../../models';

import { format } from 'util';

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

  // Generate consistent seed from nodeKey for deterministic shuffling
  // Include mode name to ensure different ordering between modes
  const shuffleSeed = React.useMemo(() => {
    if (!nodeKey) return 0;
    let hash = 0;
    const str = String(nodeKey) + '-hard';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [nodeKey]);

  // Reset completion screen when tab changes
  React.useEffect(() => {
    setShowCompletion(false);
  }, [tabIndex]);

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

  // Show/hide completion screen based on completion status and tab index
  React.useEffect(() => {
    const isComplete = inProgress?.hard?.complete;
    if (isComplete) {
      setShowCompletion(true);
    } else {
      setShowCompletion(false);
    }
  }, [tabIndex, inProgress?.hard?.complete]);

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

  let vocabList = []
  let vocabListHard = []
  let assignmentHard = [...filterHard]

  if (answers.length > 0) {
    answers.forEach((word) => {
      const answer = word?.phrase
      // console.log('MeaningAssociationExercise.word.id', word.id)
      if (answer) {
        vocabList.push(<DragBox answer={answer} wordID={word.id} key={word.id} />)
        if (!filterHard.includes(word.id)) {
          assignmentHard.push(word)
        }
        vocabListHard.push(<DragBox answer={answer} wordID={word.id} key={word.id} />)
      }
    });

    // console.log('MeaningAssociationExercise.vocabList', vocabList)
    // console.log('MeaningAssociationExercise.vocabListHard', vocabListHard)

    // Always shuffle using seeded random for consistent ordering
    vocabList = shuffle(vocabList, shuffleSeed)
    vocabListHard = shuffle(vocabListHard, shuffleSeed + 1)
    assignment = shuffle(assignment, shuffleSeed + 2)
    assignmentHard = shuffle(assignmentHard, shuffleSeed + 3)
  }


  const correctAnswer = assignment[startPositionHard]
  const currentQuestion = startPositionHard
  const hardAssignment = assignmentHard
  const hardVocabList = vocabListHard
  const percentComplete = completedHard
  // const dropAnswerClass = ''
  const attemptsCount = 0

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

  const hardAssignmentLength = hardAssignment.length;


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
      total: assignment.length,
      remaining: hardAssignmentLength,
      attempts,
      attemptedAnswers: _attemptedAnswers
    });

    // Check completion against the full assignment length, not filtered length
    if (_verified.length === assignment.length) {
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
      percentComplete: _verified.length / assignment.length,
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
    setCompletedHard((_verified.length / assignment.length) * 100);

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
      verifiedAnswers,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: verifiedAnswers.length / attempts,
      percentComplete: currentQuestion / assignment.length,
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

  // Check if all exercises are complete
  const allComplete = inProgress?.easy?.complete && inProgress?.learn?.complete;

  return (
    <Box sx={{ 
      position: 'relative', 
      height: 'calc(100vh - var(--app-bar-height, 11rem))',
      maxHeight: 'calc(100vh - var(--app-bar-height, 11rem))',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw',
    }}>
      {showCompletion && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}>
          <CompletionScreen
            levelName="Hard Mode"
            accuracy={verifiedAnswers.length / (inProgress?.hard?.attemptsCount || 1)}
            attempts={inProgress?.hard?.attemptsCount || 0}
            onContinue={handleContinueFromCompletion}
            nextLevelName="Learn Mode"
            isLastLevel={allComplete}
            disableAutoAdvance={true}
          />
        </Box>
      )}

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
          {hardVocabList}
        </Box>
      </Grid>
      </Grid>
    </Grid>
    </Box>
  );
};
