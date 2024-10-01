'use strict';

/**
 * @fileoverview QuestionBlockRo1.js - A React component for displaying a read-only
 * version of the QuestionBlock component.
 */
import React from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import UnitContext from '../../../context/unitContext';

class QuestionBlockRo1 extends React.Component {

  static contextType = UnitContext

  constructor(props) {
    super(props);
    this.state = {
      // isLocked: props.isLocked,
      grade: props.accuracy,
      attemptedAnswers: props.attemptedAnswers,
      correctAnswers: props.correctAnswers
    };

    this._gradeAnswer = async (e, thisKey, thisAnswer) => {
      // e.preventDefault();
      // e.stopPropagation();
      const { correct: isCorrect } = thisAnswer
      const isChecked = e.target.checked;

      const correctArrLen = Object.entries(this.props.correct).length || 0

      console.log('meow: ?thisAnswer', thisAnswer)

      const savedGrade = this.context?.grade?.data || {}
      const complete = savedGrade?.complete || false
      let { saveGrade } = this.context;
      let thisExerciseDone = false

      let {
        correctAnswers,
        attemptedAnswers,
        isLocked,
        grade
      } = this.state


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

      grade = Math.floor((verifiedArr.length / correctArrLen) * 100)

      console.log('attemptedArr.length === correctArrLen', attemptedArr.length, correctArrLen)
      console.log('verifiedArr.length === correctArrLen', verifiedArr.length, correctArrLen)

      if (attemptedArr.length >= correctArrLen || 
        verifiedArr.length >= correctArrLen || complete) {
        isLocked = true
        thisExerciseDone = true
      }

      let savedGradeCopy = Object.assign({}, savedGrade);

      savedGradeCopy[this.props.nodeKey] = {
        accuracy: grade,
        attemptedAnswers,
        complete: thisExerciseDone,
        correctAnswers,
        percentComplete:  Math.floor((attemptedArr.length / correctArrLen) * 100)
      }

      console.log('savedGradeCopy', savedGradeCopy)
      await saveGrade(savedGradeCopy)

      this.setState({
        attemptedAnswers,
        correctAnswers,
        isLocked,
        grade,
        checked: isChecked
      });

      // if (thisExerciseDone) {
      //   setTimeout(() => {
      //   this.setState({
      //     grade: 0.0,
      //     previousGrade: grade
      //   });
      // }, 1000)
      // }

    }

  }

  static getDerivedStateFromProps(nextProps, prevState) {
    let newProps = {}

    if (prevState.attemptedAnswers !== nextProps.attemptedAnswers) {
      newProps['attemptedAnswers'] = nextProps.attemptedAnswers
    }
    if (prevState.correctAnswers !== nextProps.correctAnswers) {
      newProps['correctAnswers'] = nextProps.correctAnswers
    }
    if (prevState.attemptedAnswers !== nextProps.attemptedAnswers && prevState.correctAnswers !== nextProps.correctAnswers) {
      const verifiedArr = Object.entries(nextProps.correctAnswers)
      const attemptedArr = Object.entries(nextProps.attemptedAnswers)
      const correctArrLen = Object.entries(nextProps.correct).length || 0
      newProps['isLocked'] = (attemptedArr.length >= correctArrLen || verifiedArr.length >= correctArrLen)
    }
    if (prevState.percentComplete !== nextProps.percentComplete) {
      newProps['percentComplete'] = nextProps.percentComplete
    }
    if (prevState.accuracy !== nextProps.accuracy) {
      newProps['accuracy'] = nextProps.accuracy
    }

    if (JSON.stringify(newProps) === '{}')
      return null
    else
      return newProps
  }


  render() {

    var className = 'Editor-question';

    let checkboxes
    if (this.props.questionContent) {
      checkboxes = this.props.questionContent.map((data, key) => {
        let attemptedAnswers = this.state.attemptedAnswers[key]
        if (!attemptedAnswers) {
          attemptedAnswers = {}
        }
        let checked = false
        if (this.state.attemptedAnswers[key]) {
          checked = true
        }
        return (<FormControlLabel key={key} control={<Checkbox checked={checked} disabled={this.state.isLocked} onClick={async (e) => { this._gradeAnswer(e, key, data) }} />} label={data.answer} />)
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
              Grade: {this.state.grade || 0}
            </Box>
            {/* <Box
              style={{
                marginLeft: '1rem'
              }}
            >
              Previous: {this.state.previousGrade || 0}
            </Box> */}
          </Toolbar>
        </Card>



        <FormGroup>
          {
            checkboxes
          }
        </FormGroup>
      </div>
    );
  }
}


export default function QuestionBlockRo(props) {
  const { nodeKey, data } = props
  const { grade } = React.useContext(UnitContext)
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

  // Do grade handling here and pass in so the Assignment block is fully controlled
  // and we don't have to keep updating it internally with data implementation

  return (<QuestionBlockRo1
    inProgressContent={indexContent}
    questionContent={questionContent}
    accuracy={accuracy}
    complete={complete}
    correct={correct}
    percentComplete={percentComplete}
    attemptedAnswers={attemptedAnswers}
    correctAnswers={correctAnswers}
    nodeKey={nodeKey}
  />)
}