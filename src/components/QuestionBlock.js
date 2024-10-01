'use strict';

/**
 * @fileoverview QuestionBlock.js - A React component for displaying a
 * question block.
 * 
 * This component is used by the Editor2 component to display a question block.
 */
import React, { useState } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import Stack from '@mui/material/Stack';
import { GutterContext } from './gutterContext';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};


function DraggableAnswer({
  data,
  index,
  onQuestionChange,
  onCorrectChange,
  onQuestionDelete
}) {

  return (
    <Draggable draggableId={`id-${index}`} index={index}>
      {provided => (
        <Stack
          border="thin solid #E8E8E8"
          padding="0.5rem"
          margin="0.5rem"
          direction="row"
          spacing={2}
          maxWidth="40rem"

          alignItems="center"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <DragIndicatorIcon />
          <TextField
            label={`Answer ${index + 1}`}
            value={data.answer}
            onChange={(event) => { onQuestionChange(event, index) }}
            fullWidth
            inputRef={(input) => {
              if (input != null && !input?.value) {
                input.focus();
              }
            }}
          />
          <FormControlLabel
            value={data.correct}
            control={<Switch color="primary" checked={data.correct} />}
            label={data.correct ? "Correct" : "Incorrect"}
            onChange={(event) => { onCorrectChange(event, index) }}
            labelPlacement="bottom"
          />
          <IconButton
            aria-label="delete"
            onClick={() => { onQuestionDelete(index) }}
          >
            <ClearIcon />
          </IconButton>

        </Stack>

      )}
    </Draggable>
  );
}

function SortableAnswers({
  answers,
  onQuestionChange,
  onCorrectChange,
  onQuestionDelete,
  onQuestionReorder
}) {

  function onDragEnd(result) {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const newAnswers = reorder(
      answers,
      result.source.index,
      result.destination.index
    );

    onQuestionReorder(newAnswers)

  }

  function list() {
    return answers.map((answer, index) => (
      <DraggableAnswer
        data={answer}
        index={index}
        key={index}
        onQuestionChange={onQuestionChange}
        onCorrectChange={onCorrectChange}
        onQuestionDelete={onQuestionDelete}
      />
    ))
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="list">
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {list()}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}


export default class QuestionBlock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editMode: false,
      isLocked: false,
      grades: [],
      grade: 0.0,
      attemptedAnswers: {}
    };

    this.ref = React.createRef();

    this._onClick = () => {
      if (this.state.editMode) {
        return;
      }

      this.setState({
        editMode: true,
        questionValue: this._getValue(),
      }, () => {
        this._startEdit();
      });
    };

    this._onValueChange = evt => {
      // console.log(evt)
      let value = evt.target.value;
      let invalid = false;
      this.setState({
        invalidQuestion: invalid,
        questionValue: value,
      });
    };

    this._onCorrectChange = (evt, id) => {
      let checked = evt.target.checked
      let tmp = JSON.parse(JSON.stringify(this.state.questionValue));
      tmp[id].correct = checked
      // console.log(tmp)
      this.setState({
        questionValue: tmp,
      });
    };


    this._onQuestionChange = (evt, id) => {
      let value = evt.target.value;
      let tmp = JSON.parse(JSON.stringify(this.state.questionValue));
      tmp[id].answer = value

      this.setState({
        questionValue: tmp,
      });
    };

    this._gradeAnswer = (e, thisKey, thisAnswer, questionContent) => {
      e.preventDefault();
      e.stopPropagation();
      const { correct: isCorrect } = thisAnswer
      const isChecked = e.target.checked;

      let verifiedAnswers = this.state.verifiedAnswers
      let attemptedAnswers = this.state.attemptedAnswers
      let isLocked = this.state.isLocked
      let grade = this.state.grade
      let correct = {}
      let grades = this.state.grades

      if (!verifiedAnswers) {
        verifiedAnswers = {}
      }
      if (!attemptedAnswers) {
        attemptedAnswers = {}
      }

      questionContent.forEach((question, questionKey) => {
        if (question.correct === true) {
          correct[questionKey] = question
        }
      })

      attemptedAnswers[thisKey] = thisAnswer
      // console.log('attemptedAnswers', attemptedAnswers)
      // console.log('verifiedAnswers', verifiedAnswers)

      if (isCorrect === true && isChecked === true) {
        verifiedAnswers[thisKey] = thisAnswer
      } else if (isCorrect === true && isChecked === false) {
        delete verifiedAnswers[thisKey]
        delete attemptedAnswers[thisKey]
      } else if (isCorrect === false && isChecked === false) {
        delete attemptedAnswers[thisKey]
      }



      // console.log('verifiedAnswers', verifiedAnswers)

      const correctArr = Object.entries(correct)
      const verifiedArr = Object.entries(verifiedAnswers)
      const attemptedArr = Object.entries(attemptedAnswers)

      grade = Math.floor((verifiedArr.length / correctArr.length) * 100)

      if (attemptedArr.length === correctArr.length) {
        isLocked = true
        // this.setState({isLocked}) 
        // await delay(3000)
      }

      if (verifiedArr.length === correctArr.length) {
        isLocked = true

        // console.log("Grade this thing")
        // console.log("reset everything")

        // verifiedAnswers = {}
        // attemptedAnswers = {}
        // isLocked = false
        // grade = 0.0
      }


      this.setState({
        attemptedAnswers: attemptedAnswers,
        verifiedAnswers: verifiedAnswers,
        isLocked: isLocked,
        correct: correct,
        grade: grade,
        grades: grades
        // checked: checked
      });

    }

    this._onQuestionReorder = answers => {
      this.setState({
        questionValue: answers,
      });
    };

    this._onQuestionDelete = id => {
      let tmp = JSON.parse(JSON.stringify(this.state.questionValue));
      tmp.splice(id, 1);

      // var invalid = false;
      this.setState({
        questionValue: tmp,
      });
    };


    this._onAddQuestion = (evt) => {
      console.log(evt)
      evt.preventDefault();
      evt.stopPropagation();
      console.log(this.state.questionValue)
      console.log('add question')
      let tmp = JSON.parse(JSON.stringify(this.state.questionValue));

      const nextId = (tmp.length + 1)
      tmp.push({
        id: `id-${nextId}`,
        answer: "",
        correct: false
      })

      // var invalid = false;
      this.setState({
        // invalidQuestion: invalid,
        questionValue: tmp,
      });
    };

    this._save = () => {
      var entityKey = this.props.block.getEntityAt(0);
      var newContentState = this.props.contentState.mergeEntityData(
        entityKey,
        { content: this.state.questionValue },
      );
      this.setState({
        invalidQuestion: false,
        editMode: false,
        questionValue: null,
      }, this._finishEdit.bind(this, newContentState));
    };
    this._reset = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // console.log('reset')
      this.setState({
        attemptedAnswers: {},
        verifiedAnswers: {},
        isLocked: false,
        grade: 0.0
      })
    };
    this._remove = () => {
      // console.log('remove')
      // console.log(this.props.block.getKey())
      this.props.blockProps.onRemove(this.props.block.getKey());
    };
    this._startEdit = () => {
      this.props.blockProps.onStartEdit(this.props.block.getKey());
    };
    this._finishEdit = (newContentState) => {
      this.props.blockProps.onFinishEdit(
        this.props.block.getKey(),
        newContentState,
      );
    };
  }


  static contextType = GutterContext;

  _getValue() {
    try {
      return this.props.contentState
        .getEntity(this.props.block.getEntityAt(0))
        .getData()['content'];
    } catch (error) {
      // console.log(error)
    }
    return []

  }

  render() {
    const { gutterRefs } = this.context;
    const blockKey = this.props.block.getKey()

    console.log('blockKey', blockKey)
    console.log('gutterRefs', gutterRefs)
    // const gutterRef = gutterRefs[blockKey]


    var questionContent = null;
    if (this.state.editMode) {
      if (this.state.invalidQuestion) {
        questionContent = '';
      } else {
        questionContent = this.state.questionValue;
      }
    } else {
      questionContent = this._getValue();
    }

    var className = 'Editor-question';
    if (this.state.editMode) {
      className += ' Editor-activeQuestion';
    }

    var editPanel = null;
    if (this.state.editMode) {
      var buttonClass = 'Editor-saveButton';
      if (this.state.invalidQuestion) {
        buttonClass += ' Editor-invalidButton';
      }

    }

    const checkboxes = questionContent.map((data, key) => {
      // console.log('const checkboxes = questionContent.map.data, key', data, key)
      let attemptedAnswers = this.state.attemptedAnswers[key]
      if (!attemptedAnswers) {
        attemptedAnswers = {}
      }
      let checked = false
      if (this.state.attemptedAnswers[key]) {
        checked = true
      }
      return (<FormControlLabel key={key} control={<Checkbox checked={checked} disabled={this.state.isLocked} onClick={(e) => { this._gradeAnswer(e, key, data, questionContent) }} />} label={data.answer} />)
    });

    return (

      <div className={className}
        contentEditable={false} // <== !!!
        readOnly // <== !!!>
      >
        <style global jsx>{`
        figure[data-block=true] {
          margin: 0;

    }`}</style>
        {!this.state.editMode &&
          <div ref={this.ref}>
            <Card elevation={2} sx={{marginBottom: '1rem' }}>
              <Toolbar>
                <Button
                  size='small'
                  // variant='contained'
                  onClick={this._onClick}
                >
                  Edit
                </Button>

              <Button
                size='small'
                onClick={this._reset}
              >
                Reset
              </Button>

              <Box>
                Grade: {this.state.grade}
              </Box>
              </Toolbar>
            </Card>



            <FormGroup>
              {
                checkboxes
              }
            </FormGroup>
          </div>
        }

        {this.state.editMode &&
          <>
            <Card elevation={3} sx={{ flexGrow: 1, marginBottom: '1rem' }}>
              <Toolbar>

                <Button
                  // className={buttonClass}
                  size='small'
                  // variant='outlined'
                  disabled={this.state.invalidQuestion}
                  onClick={this._save}>
                  {this.state.invalidQuestion ? 'Invalid' : 'Done'}
                </Button>
                <Box sx={{ flexGrow: 1 }}>
              </Box>
                <Button 
                  size='small'
                  onClick={this._remove}
                >
                  Remove
                </Button>
              </Toolbar>
            </Card>

            <SortableAnswers
              answers={this.state.questionValue}
              onQuestionChange={this._onQuestionChange}
              onCorrectChange={this._onCorrectChange}
              onQuestionDelete={this._onQuestionDelete}
              onQuestionReorder={this._onQuestionReorder}
            />

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              border="thin solid #E8E8E8"
              padding="0.5rem"
              margin="0.5rem"
              maxWidth="40rem"
            >
              <DragIndicatorIcon />
              <TextField
                // disabled
                placeholder="Add Answer"
                onClick={this._onAddQuestion}
                fullWidth
              />
            </Stack>
          </>
        }
      </div>
    );
  }
}
