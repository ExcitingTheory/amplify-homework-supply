'use strict';
import React from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import { DataStore } from 'aws-amplify/datastore';
import { Word } from '../models';

export function DisplayOrEditPhraseAndPronunciation({ phrase, pronunciation, updateWord, word }) {
  const [editingPhrase, setEditingPhrase] = React.useState(false);
  const [editingPronunciation, setEditingPronunciation] = React.useState(false);
  const [newPhrase, setNewPhrase] = React.useState(word?.phrase);
  const [newPronunciation, setNewPronunciation] = React.useState(word?.pronunciation);

  React.useEffect(() => {
    setNewPhrase(word?.phrase);
    setNewPronunciation(word?.pronunciation);
  }, [word]);
  
  const doNothing = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEditPhrase = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPhrase(true);
  };

  const handleEditPronunciation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPronunciation(true);
  };

  // const handleSave = () => {
  //   setEditing(false);
  //   updateWord(newPhrase, newPronunciation);
  // };

  // const handleCancel = () => {
  //   setEditing(false);
  //   setNewPhrase(phrase);
  //   setNewPronunciation(pronunciation);
  // };

  const handlePhraseChange = (e) => {
    setNewPhrase(e.target.value);
  };

  const handlePronunciationChange = (e) => {
    setNewPronunciation(e.target.value);
  };

  console.log('DisplayOrEditPhraseAndPronunciation word:', word);
  return (
    <>

      {!editingPronunciation &&
        <Typography
          onClick={handleEditPronunciation}
          variant="h6"
          component="div"
        >
          {pronunciation}
        </Typography>}


      {editingPronunciation &&

        <TextField
          size='small'
          variant='standard'
          fullWidth
          value={newPronunciation}
          onClick={doNothing}
          onChange={handlePronunciationChange}
          placeholder='No Pronunciation'
          inputRef={(input) => {
            if (input != null) {
              input.focus();
            }
          }}
          onBlur={async (event) => {
            // event.preventDefault()
            setEditingPronunciation(false);
            // await updateWord(newPhrase, newPronunciation)
            setNewPronunciation(pronunciation);
            await DataStore.save(
              Word.copyOf(word, updated => {
                updated.pronunciation = newPronunciation;
              }));
          }} />}



      {!editingPhrase &&
        <Typography
          onClick={handleEditPhrase}
          variant="h6"
          component="div"
        >
          {phrase}
        </Typography>}



      {editingPhrase &&
        <TextField
          size='small'
          variant='standard'
          fullWidth
          value={newPhrase}
          onClick={doNothing}
          onChange={handlePhraseChange}
          placeholder='No Phrase'
          inputRef={(input) => {
            if (input != null) {
              input.focus();
            }
          }}
          onBlur={async (event) => {
            // event.preventDefault()
            setEditingPhrase(false);
            // await updateWord(newPhrase, newPronunciation)
            setNewPhrase(newPhrase);
            await DataStore.save(
              Word.copyOf(word, updated => {
                updated.phrase = newPhrase;
              }));
          }} />}
    </>
  );
}
