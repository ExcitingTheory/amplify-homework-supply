import * as React from 'react';
import { useState, useEffect } from 'react';
import UnitContext from '../../context/unitContext';
import { Grid } from '@mui/material';
import { LinearProgressWithLabel, AnswerDrop } from '.';

import DictionaryContext from '../../context/dictionaryContext';
import { shuffle } from './utils';
import {DragBox} from './DragBox'

import { Word } from '../../models';
import { DataStore } from 'aws-amplify/datastore';



export const Easy = ({
  tabIndex, setTabIndex, nodeKey, wordIDs,
}) => {

  let [assignment, setAssignment] = React.useState([]);
  const [answers, setAnswers] = React.useState([]);
 
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    const processVocabulary = async () => {

      const _vocabularyTasks = await Promise.allSettled(wordIDs.map(async (id) => {
        return await DataStore.query(Word, id)
      }))

      const _vocabulary = _vocabularyTasks.map((task) => {
        return task.value
      })
      console.log('MeaningAssociationExercise._vocabulary', _vocabulary)
      setAssignment([..._vocabulary])
      setAnswers([..._vocabulary])

    }
    processVocabulary()
  }, [wordIDs])

  const { dictionary } = React.useContext(DictionaryContext)
  const { grade, saveGrade } = React.useContext(UnitContext);

  const inProgress = grade?.data?.[nodeKey] || {};

  let filterEasy = []
  let verifiedAnswers = []
  let completedEasy = 0

  let startPositionEasy = 0

  let setTab = 0

  if (inProgress != {}) {
    setTab = inProgress?.tabIndex || 0
    // console.log('inProgress?.tabIndex || 0', inProgress?.tabIndex)
    filterEasy = inProgress?.easy?.verifiedAnswers || []
    verifiedAnswers = inProgress?.easy?.verifiedAnswers || []
    completedEasy = (inProgress?.easy?.percentComplete || 0) * 100
    startPositionEasy = filterEasy.length
  }

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
    let _verified = [...verifiedAnswers];

    // const newPercent = Math.floor((currentQuestion / easyAssignmentLength) * 100);
    // setPercentComplete(newPercent);


    // Add to attempted answers
    _verified.push(wordID);

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

    if (newIndex === easyAssignmentLength) {
      // // console.log('newIndex === length')
      thisExerciseComplete = true;

      const completedHard = inProgress.hard?.complete;
      const completedLearn = inProgress.learn?.complete;
      if (completedHard && completedLearn) {
        allTabsComplete = true;
      }

      newTab++;
    
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

    await saveGrade(savedGradeCopy);

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


  return (

    <Grid container>
      <Grid item xs={12}>
        <LinearProgressWithLabel value={percentComplete} />
      </Grid>
      <Grid item xs={6}>
        <AnswerDrop
          correctAnswer={{ ...correctWord, progressAssignment, sendFail, sendPass }} />
      </Grid>
      <Grid item xs={6} style={{
        marginBottom: '1rem',
        paddingBottom: '1rem',
        height: 'fit-content',
        overflowY: 'auto'
      }}>
        {easyVocab}
      </Grid>
    </Grid>
  );
};
