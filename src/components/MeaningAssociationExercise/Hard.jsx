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

  const isFirstRender = React.useRef(true);

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

  const { grade, saveGrade } = React.useContext(UnitContext)
  const inProgress = grade?.data?.[nodeKey] || {}

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
        if (filterHard.indexOf(word.id) === -1) {
          assignmentHard.push(word)
        }
        vocabListHard.push(<DragBox answer={answer} wordID={word.id} key={word.id} />)
      }
    });

    // console.log('MeaningAssociationExercise.vocabList', vocabList)
    // console.log('MeaningAssociationExercise.vocabListHard', vocabListHard)

    if (isFirstRender.current) {
      isFirstRender.current = false;
      vocabList = shuffle(vocabList)
      vocabListHard = shuffle(vocabListHard)
      assignment = shuffle(assignment)
      assignmentHard = shuffle(assignmentHard)
    }
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


  async function progressAssignment(wordID) {
    const newIndex = currentQuestion + 1;
    let newTab = tabIndex;
    let allTabsComplete = false;
    let thisExerciseComplete = false;
    let _verified = [...new Set([...verifiedAnswers])];

    // Add to attempted answers
    _verified.push(wordID);

    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));
    console.log('_attemptedAnswers', _attemptedAnswers)

    

    if (typeof _attemptedAnswers[correctId] === 'undefined') {
      _attemptedAnswers[correctId] = [];
    }

    console.log('_attemptedAnswers', _attemptedAnswers)

    _attemptedAnswers[correctId].push(wordID);


    // for each array in attempted answers sum the lengths
    let attemptedAnswersLength = 0;
    Object.entries(_attemptedAnswers).forEach(([key, value]) => {
      attemptedAnswersLength += value.length;
    });
    
    const attempts = attemptedAnswersLength;

    console.log('newIndex, hardAssignmentLength, _attemptedAnswers', newIndex, hardAssignmentLength, _attemptedAnswers)

    if (_verified.length === hardAssignmentLength) {
      // Last question
      thisExerciseComplete = true;
      const completedEasy = inProgress.easy?.complete;
      const completedLearn = inProgress.learn?.complete;
      if (completedEasy && completedLearn) {
        allTabsComplete = true;
      }

      // Don't auto-advance, show completion screen instead
      // newTab = 0;
    }

    let savedGradeCopy = JSON.parse(JSON.stringify(grade?.data || {}));

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
      percentComplete: newIndex / assignment.length,
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
    setCompletedHard((newIndex / assignment.length) * 100);

    await saveGrade(savedGradeCopy);

    // Show completion screen if exercise is complete
    if (thisExerciseComplete) {
      setShowCompletion(true);
    }
  }

  async function sendFail(phrase) {

    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));
    console.log('sendFail._attemptedAnswers', _attemptedAnswers)

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
    let newTab = tabIndex;

    let savedGradeCopy = JSON.parse(JSON.stringify(grade?.data || {}));

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
    <Box sx={{ position: 'relative', minHeight: '500px' }}>
      {showCompletion && (
        <CompletionScreen
          levelName="Hard Mode"
          accuracy={verifiedAnswers.length / (inProgress?.hard?.attemptsCount || 1)}
          attempts={inProgress?.hard?.attemptsCount || 0}
          onContinue={handleContinueFromCompletion}
          nextLevelName="Learn Mode"
          isLastLevel={allComplete}
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
          {hardVocabList}
        </Box>
      </Grid>
      </Grid>
    </Grid>
    </Box>
  );
};
