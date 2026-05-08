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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useTranslations } from 'next-intl';

import UnitContext from '../../../context/unitContext'

export default function QuestionBlockRo(props) {
  const t = useTranslations('workbook');
  const { nodeKey, data } = props
  const { grade, saveGrade } = React.useContext(UnitContext)
  console.log('QuestionBlockRo.grade', grade)
  const gradeData = React.useMemo(() => {
    if (!grade?.data) return {};
    if (typeof grade.data === 'string') {
      try { return JSON.parse(grade.data); } catch { return {}; }
    }
    return grade.data;
  }, [grade?.data]);
  const inProgress = gradeData[nodeKey] || {}

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

  console.log('QuestionBlock.nodeKey', nodeKey, 'type:', typeof nodeKey)
  console.log('QuestionBlock.questionContent', questionContent)
  console.log('QuestionBlock.grade.data keys:', gradeData ? Object.keys(gradeData) : 'no data')
  console.log('QuestionBlock.grade.data[nodeKey]:', gradeData[nodeKey])
  console.log('QuestionBlockRo.inProgress', inProgress)

  const accuracy = inProgress?.accuracy || 0
  const complete = inProgress?.complete || false
  const percentComplete = inProgress?.percentComplete || 0
  const attemptedAnswers = inProgress?.attemptedAnswers || []
  const correctAnswers = inProgress?.correctAnswers || []
  
  // Calculate if quiz should be locked
  const correctArrLen = Object.entries(correct).length || 0
  const attemptedCount = Object.keys(attemptedAnswers).length
  const isLocked = complete || attemptedCount >= correctArrLen

  const gradeAnswer = async (e, thisKey, thisAnswer) => {
    // e.preventDefault();
    // e.stopPropagation();
    
    // Don't allow changes if already locked
    if (isLocked) {
      e.preventDefault();
      return;
    }
    
    const { correct: isCorrect } = thisAnswer
    const isChecked = e.target.checked;

    const correctArrLen = Object.entries(correct).length || 0

    console.log('meow: ?thisAnswer', thisAnswer)

    const savedGrade = gradeData
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

    // Lock when number of attempts equals number of correct answers
    if (attemptedArr.length >= correctArrLen) {
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
        // Use != null to handle sparse arrays that become [null,null,...] after JSON round-trip
        const wasAttempted = attemptedAnswers[key] != null;
        const isCorrectAnswer = data.correct === true;
        const checked = wasAttempted;
        // Only highlight the answer the user actually selected
        const showCorrectFeedback = isLocked && wasAttempted && isCorrectAnswer;
        const showWrongFeedback = isLocked && wasAttempted && !isCorrectAnswer;
        
        return (<FormControlLabel 
          key={key}
          data-tour="quiz-answers"
          control={
            <Checkbox 
              checked={checked} 
              disabled={isLocked} 
              onChange={async (e) => { gradeAnswer(e, key, data) }}
              sx={isLocked && wasAttempted ? {
                '&.Mui-disabled': {
                  color: showCorrectFeedback ? 'success.main' : 'warning.main',
                },
              } : undefined}
            />
          } 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {data.answer}
              {showCorrectFeedback && <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />}
              {showWrongFeedback && <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />}
            </Box>
          }
          sx={isLocked && wasAttempted ? {
            color: showCorrectFeedback ? 'success.main' : 'warning.main',
          } : undefined}
        />)
      });
    }

    return (
      <div className={className}
        data-tour="quiz-block"
        // Don't use contentEditable={false} as it blocks child interactions
        suppressContentEditableWarning={true}
        style={{ userSelect: 'none' }}
      >
        <Card elevation={2} sx={{ flexGrow: 1, marginBottom: '1rem' }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1 }}>
            </Box>
            <Box>
              {t('quizComponent.gradeDisplay', { score: accuracy })}
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
