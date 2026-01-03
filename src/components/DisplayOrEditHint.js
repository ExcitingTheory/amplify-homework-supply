'use strict';
import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { DataStore } from 'aws-amplify/datastore';
import { Question } from '../models';

export function DisplayOrEditHint({ hint, question }) {
  const [editing, setEditing] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 0.5,
            cursor: expanded ? 'text' : 'pointer',
            mt: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          onClick={handleToggleExpand}
        >
          <LightbulbOutlinedIcon 
            sx={{ 
              fontSize: '1.1rem', 
              color: hint ? 'warning.main' : 'text.disabled',
              mt: 0.25,
              flexShrink: 0,
            }} 
          />
          <Typography
            sx={{
              flex: 1,
              whiteSpace: expanded ? 'pre-wrap' : 'normal',
              color: hint ? 'text.secondary' : 'text.disabled',
              fontStyle: 'italic',
              fontSize: '0.8125rem',
              overflow: expanded ? 'visible' : 'hidden',
              textOverflow: expanded ? 'clip' : 'ellipsis',
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: expanded ? 'unset' : 2,
              WebkitBoxOrient: expanded ? 'initial' : 'vertical',
            }}
          >
            {hint || 'No hint (click to add)'}
          </Typography>
        </Box>}

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
