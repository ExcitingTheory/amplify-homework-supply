'use strict';
import React from 'react';
import Typography from '@mui/material/Typography';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { DataStore } from 'aws-amplify/datastore';
import { Question } from '../models';

export function DisplayOrEditAnswer({ answer, question }) {
  const [editing, setEditing] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [newAnswer, setNewAnswer] = React.useState(answer);

  React.useEffect(() => {
    setNewAnswer(answer);
  }, [answer]);


  const doNothing = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
  };

  const handleChange = (e) => {
    setNewAnswer(e.target.value);
  };

  const handleToggleExpand = (e) => {
    if (expanded) {
      // When expanded, single click to edit
      handleEdit(e);
      return;
    }
    // When collapsed, single click to expand, double-click to edit
    if (e.detail === 2) { // double-click to edit
      handleEdit(e);
    } else { // single click to expand
      e.preventDefault();
      e.stopPropagation();
      setExpanded(!expanded);
    }
  };

  return (
    <>
      {!editing &&
        <Typography
          component="div"
          sx={{
            width: '100%',
            whiteSpace: expanded ? 'pre-wrap' : 'normal',
            overflow: expanded ? 'visible' : 'hidden',
            textOverflow: expanded ? 'clip' : 'ellipsis',
            display: expanded ? 'block' : '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 3,
            WebkitBoxOrient: expanded ? 'initial' : 'vertical',
            cursor: expanded ? 'text' : 'pointer',
            fontSize: '0.875rem',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          onClick={handleToggleExpand}
        >
          {answer}
        </Typography>}

      {editing &&
        <TextareaAutosize
          minRows={2}
          value={newAnswer}
          onChange={handleChange}
          onClick={doNothing}
          placeholder='No Answer'

          ref={(input) => {
            if (input != null) {
              input.focus();
            }
          }}
          onBlur={async (event) => {
            event.preventDefault();
            setEditing(false);
            // await updateQuestion(newPhrase, newPronunciation)
            // setNewAnswer(newAnswer)
            await DataStore.save(
              Question.copyOf(question, (updated) => {
                updated.answer = newAnswer;
              }));

          }}
          style={{
            width: '100%',
            questionWrap: 'break-question',
          }} />}


    </>
  );
}
