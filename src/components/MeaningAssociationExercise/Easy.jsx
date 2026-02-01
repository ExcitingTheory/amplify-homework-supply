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
 
  const isFirstRender = React.useRef(true);

  // Reset completion screen when tab changes
  React.useEffect(() => {
    setShowCompletion(false);
  }, [tabIndex]);

  const { wordMapId: dictionary } = React.useContext(DictionaryContext)

  useEffect(() => {
    // Use dictionary context instead of DataStore for Storybook compatibility
    const _vocabulary = wordIDs.map(id => dictionary[id]).filter(Boolean);
    console.log('MeaningAssociationExercise._vocabulary', _vocabulary)
    setAssignment([..._vocabulary])
    setAnswers([..._vocabulary])
  }, [wordIDs, dictionary]);
  
  const { grade, saveGrade } = React.useContext(UnitContext);

  const inProgress = grade?.data?.[nodeKey] || {};
  
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

  let vocabList = []
  let vocabListEasy = []
  let assignmentEasy = [...filterEasy]

  if (answers.length > 0) {
    answers.forEach((word) => {
      console.log('Easy.word', word)
      const answer = word?.phrase
      console.log('Easy.word.id', word?.id)
      if (answer) {
        vocabList.push(<DragBox answer={answer} wordID={word.id} key={word.id} />)
        if (filterEasy.indexOf(word.id) === -1) {
          vocabListEasy.push(<DragBox answer={answer} wordID={word.id} key={word.id} />)
          assignmentEasy.push(word)
        }

      }
    });

  console.log('Easy.vocabList', vocabList)
  console.log('Easy.vocabListEasy', vocabListEasy)

    if (isFirstRender.current) {
      isFirstRender.current = false;
      vocabList = shuffle(vocabList)
      vocabListEasy = shuffle(vocabListEasy)
      assignment = shuffle(assignment)
      assignmentEasy = shuffle(assignmentEasy)
    }
  }

  const correctAnswer = assignment[startPositionEasy]
  const currentQuestion = startPositionEasy
  const easyAssignment = assignmentEasy
  const easyVocab = vocabListEasy
  const percentComplete = completedEasy
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

  const easyAssignmentLength = easyAssignment.length;


  async function progressAssignment(wordID) {
    const newIndex = currentQuestion + 1;
    let newTab = tabIndex;
    let allTabsComplete = false;
    let thisExerciseComplete = false;
    let _verified = [...new Set([...verifiedAnswers, wordID])];

    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

    if (typeof _attemptedAnswers[correctId] === 'undefined') {
      _attemptedAnswers[correctId] = [];
    }

    _attemptedAnswers[correctId].push(wordID);

    // for each array in attempted answers sum the lengths
    let attemptedAnswersLength = 0;
    Object.entries(_attemptedAnswers).forEach(([key, value]) => {
      attemptedAnswersLength += value.length;
    });
    
    const attempts = attemptedAnswersLength;

    // setAttemptedAnswers(_attemptedAnswers);
    // setAttemptsCount(attempts);

    // Check completion against the full assignment length, not filtered length
    if (newIndex === assignment.length) {
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

    let savedGradeCopy = JSON.parse(JSON.stringify(grade?.data || {}));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'easy': {}
      };
    }

    // console.log('easy _verified.length / length,', _verified.length, assignment.length)
    // console.log('easy newIndex / length', newIndex, assignment.length)
    savedGradeCopy[nodeKey]['easy'] = {
      verifiedAnswers: _verified,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: _verified.length / attempts,
      percentComplete: newIndex / assignment.length,
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
    setCompletedEasy((newIndex / assignment.length) * 100);

    await saveGrade(savedGradeCopy);

    // Show completion screen if exercise is complete
    if (thisExerciseComplete) {
      setShowCompletion(true);
    }
  }

  async function sendFail(phrase) {

    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

    if (typeof _attemptedAnswers[correctId] === 'undefined') {
      _attemptedAnswers[correctId] = [];
    }


    _attemptedAnswers[correctId].push(phrase);

    // for each array in attempted answers sum the lengths
    let attemptedAnswersLength = 0;
    Object.entries(_attemptedAnswers).forEach(([key, value]) => {
      attemptedAnswersLength += value.length;
    });
    
    const attempts = attemptedAnswersLength;

    // setAttemptsCount(attempts);


    let savedGradeCopy = JSON.parse(JSON.stringify(grade?.data || {}));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'easy': {}
      };
    }

    // console.log('easy verifiedAnswers.length / length,', verifiedAnswers.length, assignment.length)
    // console.log('easy currentQuestion+1 / length', currentQuestion + 1, assignment.length)
    savedGradeCopy[nodeKey]['easy'] = {
      verifiedAnswers,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: verifiedAnswers.length / attempts,
      percentComplete: currentQuestion / assignment.length,
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

  return (
    <Box sx={{ position: 'relative', minHeight: '500px' }}>
      {showCompletion && (
        <CompletionScreen
          levelName="Easy Mode"
          accuracy={verifiedAnswers.length / (inProgress?.easy?.attemptsCount || 1)}
          attempts={inProgress?.easy?.attemptsCount || 0}
          onContinue={handleContinueFromCompletion}
          nextLevelName="Hard Mode"
          isLastLevel={false}
        />
      )}

      <Grid container direction="column" spacing={1}>
      <Grid item xs={12}>
        <LinearProgressWithLabel value={percentComplete} />
      </Grid>
      <Grid item xs={12} container direction="row" spacing={2} wrap="nowrap">
      <Grid item xs={8} sm={8} md={8} lg={8}>
        <AnswerDrop
          correctAnswer={{ ...correctWord, progressAssignment, sendFail, sendPass }} />
      </Grid>
      <Grid item xs={4} sm={4} md={4} lg={4}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            maxHeight: '400px',
            overflowY: 'auto',
            padding: 1,
          }}
        >
          {easyVocab}
        </Box>
      </Grid>
      </Grid>
    </Grid>
    </Box>
  );
};
