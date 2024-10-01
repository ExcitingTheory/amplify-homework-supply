import * as React from 'react';
import { useEffect } from 'react';
import DictionaryContext from '../../context/dictionaryContext';
import UnitContext from '../../context/unitContext';
import {
  Grid, List,
  ListItem,
  ListItemText
} from '@mui/material';
import { LinearProgressWithLabel, AnswerDropLearn } from '.';
import { shuffle } from './utils';
import { DragBox } from './DragBox';
import { Word } from '../../models';

import { DataStore } from 'aws-amplify/datastore';

export const Learn = ({
  tabIndex, setTabIndex, nodeKey, wordIDs,
}) => {

  const [answers, setAnswers] = React.useState([]);
  const [length, setLength] = React.useState();
  const [vocabulary, setVocabulary] = React.useState([]);
  let [assignment, setAssignment] = React.useState([]);

  const isFirstRender = React.useRef(true);


  useEffect(() => {
    const processVocabulary = async () => {

      const _vocabularyTasks = await Promise.allSettled(wordIDs.map(async (id) => {
        return await DataStore.query(Word, id)
      }))

      const _vocabulary = _vocabularyTasks.map((task) => {
        return task.value
      })
      console.log('Learn._vocabulary', _vocabulary)
      setVocabulary(_vocabulary)
      setAssignment([..._vocabulary])
      setAnswers([..._vocabulary])
      setLength(_vocabulary.length)

    }
    processVocabulary()
  }, [wordIDs])

  let filterLearn = []
  let completedLearn = 0
  let startPositionLearn = 0
  let setTab = 0

  const { wordMapId: dictionary } = React.useContext(DictionaryContext);
  const { grade, saveGrade } = React.useContext(UnitContext);
  const inProgress = grade?.data?.[nodeKey] || {};

  if (inProgress != {}) {
    setTab = inProgress?.tabIndex || 0
    filterLearn = inProgress?.learn?.verifiedAnswers || []
    completedLearn = (inProgress?.learn?.percentComplete || 0) * 100
    startPositionLearn = filterLearn.length
  }

  let vocabList = []
  let vocabListLearn = []
  let assignmentLearn = [...filterLearn]


  if (answers.length > 0) {
    answers.forEach((word) => {
      const answer = word?.phrase
      if (answer) {
        vocabList.push(<DragBox answer={answer} wordID={word.id} key={word.id} />)
        if (filterLearn.indexOf(word.id) === -1) {
          vocabListLearn.push(<DragBox answer={answer} wordID={word.id} key={word.id} />)
          assignmentLearn.push(word)
        }
      }
    });

    if (isFirstRender.current) {
      isFirstRender.current = false;
      vocabList = shuffle(vocabList)
      vocabListLearn = shuffle(vocabListLearn)
      assignment = shuffle(assignment)
      assignmentLearn = shuffle(assignmentLearn)
    }
  }

  const easyAssignment = assignmentLearn;
  const verifiedAnswers = filterLearn
  const correctAnswer = assignmentLearn[startPositionLearn]
  const percentComplete = completedLearn
  const easyVocab = vocabListLearn

  const easyAssignmentLength = easyAssignment.length;
  const currentQuestion = startPositionLearn;

  
  const loadAttemptedAnswers = inProgress?.learn?.attemptedAnswers || {};
  const attemptsCount = inProgress?.learn?.attemptsCount || 0;
  const dropAnswerVisibility = verifiedAnswers;

  let _correctAnswer = '';

  if (typeof correctAnswer === 'string') {
    _correctAnswer = dictionary[correctAnswer];
  } else {
    _correctAnswer = correctAnswer;
  }

  const correctId = _correctAnswer?.id;

  async function progressAssignment(wordID) {
    const newIndex = currentQuestion + 1;
    let newTab = tabIndex;
    let allTabsComplete = false;
    let thisExerciseComplete = false;
    let _verified = [...new Set([...verifiedAnswers])];

    // Add to attempted answers
    _verified.push(wordID);
    // console.log('(correctId, wordID)', correctId, wordID)
    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

    if (typeof _attemptedAnswers[correctId] === 'undefined') {
      _attemptedAnswers[correctId] = [];
    }

    _attemptedAnswers[correctId].push(wordID);
    const attempts = attemptsCount + 1;
    // setAttemptedAnswers(_attemptedAnswers)
    // setAttemptsCount(attempts)
    // console.log("newIndex, easyAssignmentLength", newIndex, easyAssignmentLength)
    if (_verified.length === easyAssignmentLength) {
      thisExerciseComplete = true;
      // check for top level complete, all assignments are completed
      const completedEasy = inProgress.easy?.complete;
      const completedHard = inProgress.hard?.complete;
      if (completedEasy && completedHard) {
        allTabsComplete = true;
      }

      newTab++;
    }

    let savedGradeCopy = JSON.parse(JSON.stringify(grade?.data || {}));

    if (!savedGradeCopy[nodeKey]) {
      savedGradeCopy[nodeKey] = {
        'learn': {}
      };
    }

    // console.log('Learn _verified.length / length,', _verified.length, length)
    // console.log('Learn newIndex / length', newIndex, length)
    savedGradeCopy[nodeKey]['learn'] = {
      verifiedAnswers: _verified,
      attemptedAnswers: _attemptedAnswers,
      attemptsCount: attempts,
      accuracy: _verified.length / attempts,
      percentComplete: newIndex / assignment.length,
      complete: thisExerciseComplete,
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
    const attempts = attemptsCount + 1;

    let savedGradeCopy = JSON.parse(JSON.stringify(grade?.data || {}));

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
      percentComplete: currentQuestion / assignment.length,
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


  const maxHeight = '15rem';

  return (

    <Grid container>
      <Grid item xs={12}>
        <LinearProgressWithLabel value={percentComplete} />
      </Grid>
      <Grid item xs={8}>

        <List
          style={{
            maxHeight: maxHeight || 'fit-content',
            overflowX: 'auto',
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

            // console.log('SimpleList _correctWord', _correctWord)
            let answerSection = '';
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

            answerSection = <AnswerDropLearn
              key={id}
              id={_correctWord?.id}
              pronunciation={pronunciation}
              definition={definition}
              correctAnswer={{ ..._correctWord, progressAssignment, sendFail, sendPass }} />;
            if (dropAnswerVisibility.includes(_correctWord?.id)) {
              answerSection = <ListItem key={_correctWord?.id} style={{ margin: '0.25rem 0', padding: '0.5rem', }}>
                <ListItemText key={id} primary={`${phrase} (${pronunciation})`}
                  secondary={definition} />
              </ListItem>;

            }

            return answerSection;

          })}

        </List>
      </Grid>
      <Grid item xs={4} style={{
        marginBottom: '1rem',
        paddingBottom: '1rem',
        maxHeight: '15rem',
        overflowX: 'auto'
      }}>
        {easyVocab}
      </Grid>
    </Grid>
  );
};
