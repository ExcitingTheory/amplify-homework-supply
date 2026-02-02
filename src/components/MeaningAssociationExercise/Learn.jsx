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

  // Reset completion screen when tab changes
  React.useEffect(() => {
    setShowCompletion(false);
  }, [tabIndex]);

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
  const inProgress = grade?.data?.[nodeKey] || {};

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

    // Don't shuffle - keep vocabulary in original order
    // if (isFirstRender.current) {
    //   isFirstRender.current = false;
    //   vocabList = shuffle(vocabList)
    //   vocabListLearn = shuffle(vocabListLearn)
    //   assignment = shuffle(assignment)
    //   assignmentLearn = shuffle(assignmentLearn)
    // }
  }

  const easyAssignment = assignmentLearn;
  const verifiedAnswers = filterLearn;
  const correctAnswer = assignmentLearn[startPositionLearn];
  const percentComplete = completedLearn;
  const easyVocab = vocabListLearn;

  const easyAssignmentLength = easyAssignment.length;
  const currentQuestion = startPositionLearn;

  
  const loadAttemptedAnswers = inProgress?.learn?.attemptedAnswers || {};
  const attemptsCount = inProgress?.learn?.attemptsCount || 0;

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
    
    // Use the current state values
    // Track which answer was dropped on which target
    let _droppedPairs = { ...droppedPairs };
    _droppedPairs[correctId] = wordID; // Store the dropped wordID for this target

    // Add correctly matched wordID to verified list
    const _verified = [...new Set([...verifiedAnswers, correctId])];

    // Add to attempted answers
    let _attemptedAnswers = JSON.parse(JSON.stringify(loadAttemptedAnswers));

    if (typeof _attemptedAnswers[correctId] === 'undefined') {
      _attemptedAnswers[correctId] = [];
    }

    _attemptedAnswers[correctId].push(wordID);
    const attempts = attemptsCount + 1;
    
    if (_verified.length === easyAssignmentLength) {
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
      percentComplete: newIndex / assignment.length,
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
    setCompletedLearn((newIndex / assignment.length) * 100);
    setDroppedPairs(_droppedPairs);

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
  const handleContinueFromCompletion = () => {
    setShowCompletion(false);
    setTabIndex(1); // Move to Easy mode
  };

  const maxHeight = '15rem';

  return (
    <Box sx={{ position: 'relative', minHeight: '400px' }}>
      {showCompletion && (
        <CompletionScreen
          levelName="Learn Mode"
          accuracy={dropAnswerVisibility.length / (inProgress?.learn?.attemptsCount || 1)}
          attempts={inProgress?.learn?.attemptsCount || 0}
          onContinue={handleContinueFromCompletion}
          nextLevelName="Easy Mode"
          isLastLevel={false}
        />
      )}

      <Grid container direction="column" spacing={0}>
      <Grid item>
        <LinearProgressWithLabel value={percentComplete} />
      </Grid>
      <Grid item container direction="row" spacing={2} wrap="nowrap">
      <Grid item xs={8} sm={8} md={8} lg={8}>
        <List>
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
      </Grid>
      <Grid item xs={4} sm={4} md={4} lg={4}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
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
