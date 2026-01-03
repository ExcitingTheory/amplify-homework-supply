'use strict';
import React from 'react';
import Typography from '@mui/material/Typography';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { DataStore } from 'aws-amplify/datastore';
import { Question } from '../models';

export function DisplayOrEditPrompt({ prompt, question, isExpanded: parentExpanded, inHeader }) {
  const [editing, setEditing] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [newPrompt, setNewPrompt] = React.useState(prompt);

  // Use parent's expanded state if in header, otherwise use own state
  const shouldExpand = inHeader ? parentExpanded : expanded;

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

  const handleToggleExpand = (e) => {
    if (inHeader) {
      // In header mode: single click to edit when expanded, parent handles collapse when not expanded
      if (shouldExpand) {
        handleEdit(e);
      }
      return;
    }
    if (e.detail === 2) { // double-click to edit
      handleEdit(e);
    } else { // single click to expand/collapse
      e.preventDefault();
      e.stopPropagation();
      setExpanded(!expanded);
    }
  };

  return (
    <>
      {!editing &&
        <Typography
          sx={{
            width: '100%',
            whiteSpace: shouldExpand ? 'pre-wrap' : 'normal',
            overflow: shouldExpand ? 'visible' : 'hidden',
            textOverflow: shouldExpand ? 'clip' : 'ellipsis',
            display: shouldExpand ? 'block' : '-webkit-box',
            WebkitLineClamp: shouldExpand ? 'unset' : (inHeader ? 2 : 3),
            WebkitBoxOrient: shouldExpand ? 'initial' : 'vertical',
            cursor: (inHeader && shouldExpand) ? 'text' : (inHeader ? 'inherit' : 'pointer'),
            fontWeight: inHeader ? 400 : 500,
            fontSize: inHeader ? '0.875rem' : undefined,
            color: inHeader ? 'text.primary' : undefined,
            '&:hover': (inHeader && shouldExpand) ? {
              backgroundColor: 'action.hover',
            } : (inHeader ? {} : {
              backgroundColor: 'action.hover',
            }),
          }}
          onClick={handleToggleExpand}
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
