import * as React from 'react';
import { useState, useEffect } from 'react';
import UnitContext from '../../context/unitContext';
import DictionaryContext from '../../context/dictionaryContext';
import { shuffle } from './utils';
import { DragBox } from './DragBox'


import { Grid } from '@mui/material';
import { LinearProgressWithLabel, AnswerDrop } from '.';

import { Word } from '../../models';
import { DataStore } from 'aws-amplify/datastore';
import { format } from 'util';

export const Hard = ({
  nodeKey, tabIndex, setTabIndex, wordIDs,
}) => {
  let [assignment, setAssignment] = React.useState([]);
  const [answers, setAnswers] = React.useState([]);
  const [length, setLength] = React.useState();
  const [vocabulary, setVocabulary] = React.useState([]);

  const isFirstRender = React.useRef(true);

  // function resetAssignment() {
  //   setAssignment([...vocabulary])
  //   setAnswers([...vocabulary])
  //   setLength(vocabulary.length)
  // }


  useEffect(() => {
    const processVocabulary = async () => {

      const _vocabularyTasks = await Promise.allSettled(wordIDs.map(async (id) => {
        return await DataStore.query(Word, id)
      }))

      const _vocabulary = _vocabularyTasks.map((task) => {
        return task.value
      })
      // console.log('MeaningAssociationExercise._vocabulary', _vocabulary)
      setVocabulary(_vocabulary)
      setAssignment([..._vocabulary])
      setAnswers([..._vocabulary])
      setLength(_vocabulary.length)

    }
    processVocabulary()
  }, [wordIDs])


  const { wordMapId: dictionary } = React.useContext(DictionaryContext)
  const { grade, saveGrade } = React.useContext(UnitContext)
  const inProgress = grade?.data?.[nodeKey] || {}

  let filterHard = []
  let completedHard = 0
  let startPositionHard = 0
  let setTab = 0

  if (inProgress != {}) {
    setTab = inProgress?.tabIndex || 0
    filterHard = inProgress?.hard?.verifiedAnswers || []
    completedHard = (inProgress?.hard?.percentComplete || 0) * 100
    startPositionHard = filterHard.length
  }

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
  const verifiedAnswers = filterHard

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

      newTab = 0;
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

    await saveGrade(savedGradeCopy);

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
        {hardVocabList}
      </Grid>
    </Grid>
  );
};
