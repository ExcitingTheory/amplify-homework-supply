'use strict';

/**
 * @fileoverview QuestionBlockRo1.js - A React component for displaying a read-only
 * version of the QuestionBlock component.
 */
import * as React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import UnitContext from '../../../context/unitContext'

export default function QuestionBlockRo(props) {
  const { nodeKey, data } = props
  const { grade, saveGrade } = React.useContext(UnitContext)
  let isLocked = false
  console.log('QuestionBlockRo.grade', grade)
  const inProgress = grade?.data?.[nodeKey] || {}

  const content = data || []
  // let questionContent = shuffle([...content]);
  let questionContent = [...content];


  const indexContent = {}
  const correct = {}

  content.forEach(
    (q, qk) => {
      console.log('......!q', q)
      indexContent[q.answer] = q
      if (q.correct === true) {
        correct[qk] = q
      }
    });

  console.log('QuestionBlock.nodeKey', nodeKey)
  console.log('QuestionBlock.questionContent', questionContent)
  console.log('QuestionBlockRo.inProgress', inProgress)

  const accuracy = inProgress?.accuracy || 0
  const complete = inProgress?.complete || 0
  const percentComplete = inProgress?.percentComplete || 0
  const attemptedAnswers = inProgress?.attemptedAnswers || []
  const correctAnswers = inProgress?.correctAnswers || []

  const gradeAnswer = async (e, thisKey, thisAnswer) => {
    // e.preventDefault();
    // e.stopPropagation();
    const { correct: isCorrect } = thisAnswer
    const isChecked = e.target.checked;

    const correctArrLen = Object.entries(correct).length || 0

    console.log('meow: ?thisAnswer', thisAnswer)

    const savedGrade = grade?.data
    const complete = savedGrade?.complete || false
    // let { saveGrade } = this.props;
    let thisExerciseDone = false

    attemptedAnswers[thisKey] = thisAnswer?.answer

    if (isCorrect === true && isChecked === true) {
      correctAnswers[thisKey] = thisAnswer?.answer
    } else if (isCorrect === true && isChecked === false) {
      delete correctAnswers[thisKey]
      delete attemptedAnswers[thisKey]
    } else if (isCorrect === false && isChecked === false) {
      delete attemptedAnswers[thisKey]
    }

    const verifiedArr = Object.entries(correctAnswers)
    const attemptedArr = Object.entries(attemptedAnswers)

    let _grade = Math.floor((verifiedArr.length / correctArrLen) * 100)

    console.log('attemptedArr.length === correctArrLen', attemptedArr.length, correctArrLen)
    console.log('verifiedArr.length === correctArrLen', verifiedArr.length, correctArrLen)

    if (attemptedArr.length >= correctArrLen || 
      verifiedArr.length >= correctArrLen || complete) {
      isLocked = true
      thisExerciseDone = true
    }

    console.log('thisExerciseDone', thisExerciseDone)

    let savedGradeCopy = Object.assign({}, savedGrade);

    savedGradeCopy[nodeKey] = {
      accuracy: _grade,
      attemptedAnswers,
      complete: thisExerciseDone,
      correctAnswers,
      percentComplete:  Math.floor((attemptedArr.length / correctArrLen) * 100)
    }

    console.log('savedGradeCopy', savedGradeCopy)
    await saveGrade(savedGradeCopy)

  }

  var className = 'Editor-question';

    let checkboxes
    if (questionContent) {
      checkboxes = questionContent.map((data, key) => {
        let _attemptedAnswers = attemptedAnswers[key]
        if (!_attemptedAnswers) {
          _attemptedAnswers = {}
        }
        let checked = false
        if (_attemptedAnswers[key]) {
          checked = true
        }
        return (<FormControlLabel key={key} control={<Checkbox checked={checked} disabled={isLocked} onClick={async (e) => { gradeAnswer(e, key, data) }} />} label={data.answer} />)
      });
    }

    return (
      <div className={className}
        contentEditable={false} // <== !!!
        readOnly // <== !!!>
      >
        <Card elevation={2} sx={{ flexGrow: 1, marginBottom: '1rem' }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1 }}>
            </Box>
            <Box>
              Grade: {accuracy}
            </Box>
          </Toolbar>
        </Card>



        <FormGroup>
          {
            checkboxes
          }
        </FormGroup>
      </div>
    );

  // return (<QuestionBlockRo1
  //   inProgressContent={indexContent}
  //   questionContent={questionContent}
  //   accuracy={accuracy}
  //   complete={complete}
  //   correct={correct}
  //   percentComplete={percentComplete}
  //   attemptedAnswers={attemptedAnswers}
  //   correctAnswers={correctAnswers}
  //   nodeKey={nodeKey}
  //   grade={grade}
  //   saveGrade={saveGrade}
  // />)
}
