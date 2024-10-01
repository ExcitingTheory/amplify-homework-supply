'use strict';
import React from 'react';
import Typography from '@mui/material/Typography';
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import { DataStore } from 'aws-amplify/datastore';
import { Word } from '../models';

export function DisplayOrEditDefinition({ definition, word }) {
  const [editing, setEditing] = React.useState(false);
  const [newDefinition, setNewDefinition] = React.useState(definition);

  React.useEffect(() => {
    setNewDefinition(definition);
  }, [definition]);


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
    setNewDefinition(e.target.value);
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
          {definition}
        </Typography>}

      {editing &&
        <TextareaAutosize
          minRows={2}
          value={newDefinition}
          onChange={handleChange}
          onClick={doNothing}
          placeholder='No Definition'

          ref={(input) => {
            if (input != null) {
              input.focus();
            }
          }}
          onBlur={async (event) => {
            event.preventDefault();
            setEditing(false);
            // await updateWord(newPhrase, newPronunciation)
            // setNewDefinition(newDefinition)
            await DataStore.save(
              Word.copyOf(word, (updated) => {
                updated.definition = newDefinition;
              }));

          }}
          style={{
            width: '100%',
            wordWrap: 'break-word',
          }} />}


    </>
  );
}
