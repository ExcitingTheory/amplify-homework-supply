'use strict';
import React from 'react';
import Typography from '@mui/material/Typography';
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import { DataStore } from 'aws-amplify/datastore';
import { Question } from '../models';

export function DisplayOrEditHint({ hint, question }) {
  const [editing, setEditing] = React.useState(false);
  const [newHint, setNewHint] = React.useState(hint);

  React.useEffect(() => {
    setNewHint(hint);
  }, [hint]);


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
    setNewHint(e.target.value);
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
          {hint}
        </Typography>}

      {editing &&
        <TextareaAutosize
          minRows={2}
          value={newHint}
          onChange={handleChange}
          onClick={doNothing}
          placeholder='No Hint'

          ref={(input) => {
            if (input != null) {
              input.focus();
            }
          }}
          onBlur={async (event) => {
            event.preventDefault();
            setEditing(false);
            // await updateQuestion(newPhrase, newPronunciation)
            // setNewHint(newHint)
            await DataStore.save(
              Question.copyOf(question, (updated) => {
                updated.hint = newHint;
              }));

          }}
          style={{
            width: '100%',
            questionWrap: 'break-question',
          }} />}


    </>
  );
}
