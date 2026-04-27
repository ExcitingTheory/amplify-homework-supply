import * as React from 'react';
import { useDrag } from 'react-dnd';
import { Box, Typography } from '@mui/material';

const onTouchMove = () => {
  window.navigator.vibrate(5);
}

export const DragBox = ({ answer, wordID }) => {

  const [{ isDragging }, drag] = useDrag({
    type: 'box',
    item: { answer, wordID },
    end: async (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        // Compare by word ID instead of phrase
        if (item.wordID === dropResult.targetWordID) {
          console.log('Correct match! Dragged:', item.wordID, 'Target:', dropResult.targetWordID);
          dropResult.correctAnswer.sendPass();
          await dropResult.correctAnswer.progressAssignment(item.wordID, dropResult.targetWordID);
        } else {
          console.log('Incorrect match! Dragged:', item.wordID, 'Target:', dropResult.targetWordID);
          await dropResult.correctAnswer.sendFail(item.wordID, dropResult.targetWordID);
        }
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const opacity = isDragging ? 0.4 : 1;
  
  return (
    <Box
      className='strokeorder'
      component='div'
      ref={drag}
      variant="outlined"
      boxShadow='0 2px 4px var(--mui-palette-action-disabledBackground)'
      onTouchStart={onTouchMove}
      data-testid="drag-box"
      data-word-id={wordID}
      data-answer={answer}
      style={{
        fontSize: '1.2rem',
        margin: '.3rem',
        padding: '.8rem',
        display: 'inline-flex',
        cursor: 'move',
        opacity: opacity,
        borderRadius: '8px',
        border: '2px dotted var(--mui-palette-primary-light)',
        backgroundColor: 'var(--mui-palette-background-default)',
        color: 'var(--mui-palette-primary-main)',
        fontWeight: 500,
        touchAction: 'none',
        transition: 'all 0.2s ease',
        width: '140px',
        minWidth: '140px',
        maxWidth: '140px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        flexShrink: 0,
        justifyContent: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',
      }}>
      {answer}
    </Box>
  );
};
