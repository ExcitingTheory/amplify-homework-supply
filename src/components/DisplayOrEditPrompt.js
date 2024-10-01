'use strict';
import React from 'react';
import Typography from '@mui/material/Typography';
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import { DataStore } from 'aws-amplify/datastore';
import { Question } from '../models';

export function DisplayOrEditPrompt({ prompt, question }) {
  const [editing, setEditing] = React.useState(false);
  const [newPrompt, setNewPrompt] = React.useState(prompt);

  React.useEffect(() => {
    setNewPrompt(prompt);
  }, [prompt]);


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
    setNewPrompt(e.target.value);
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
          {prompt}
        </Typography>}

      {editing &&
        <TextareaAutosize
          minRows={2}
          value={newPrompt}
          onChange={handleChange}
          onClick={doNothing}
          placeholder='No Prompt'

          ref={(input) => {
            if (input != null) {
              input.focus();
            }
          }}
          onBlur={async (event) => {
            event.preventDefault();
            setEditing(false);
            // await updateQuestion(newPhrase, newPronunciation)
            // setNewPrompt(newPrompt)
            await DataStore.save(
              Question.copyOf(question, (updated) => {
                updated.prompt = newPrompt;
              }));

          }}
          style={{
            width: '100%',
            questionWrap: 'break-question',
          }} />}


    </>
  );
}
