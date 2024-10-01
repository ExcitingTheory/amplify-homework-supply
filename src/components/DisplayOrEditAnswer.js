'use strict';
import React from 'react';
import Typography from '@mui/material/Typography';
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import { DataStore } from 'aws-amplify/datastore';
import { Question } from '../models';

export function DisplayOrEditAnswer({ answer, question }) {
  const [editing, setEditing] = React.useState(false);
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

  return (
    <>
      {!editing &&
        <Typography
          sx={{
            width: '100%',
            whiteSpace: 'pre-wrap',
          }}
          onClick={handleEdit}
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
