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
      boxShadow='0 2px 4px rgba(0,0,0,0.1)'
      onTouchStart={onTouchMove}
      style={{
        fontSize: '1.2rem',
        margin: '.3rem',
        padding: '.8rem',
        display: 'inline-flex',
        cursor: 'move',
        opacity: opacity,
        borderRadius: '8px',
        border: '2px solid #90caf9',
        backgroundColor: '#fff',
        color: '#1976d2',
        fontWeight: 500,
        touchAction: 'none',
        transition: 'all 0.2s ease',
        maxWidth: 'calc(100% - 0.6rem)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        flexShrink: 0,
      }}>
      {answer}
    </Box>
  );
};
