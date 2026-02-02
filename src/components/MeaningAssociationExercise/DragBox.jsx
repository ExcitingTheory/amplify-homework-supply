import * as React from 'react';
import { useDrag } from 'react-dnd';
import { Box } from '@mui/material';

const onTouchMove = () => {
  window.navigator.vibrate(5);
}

export const DragBox = ({ answer, wordID }) => {

  const [{ isDragging }, drag] = useDrag({
    type: 'box',
    item: { answer },
    end: async (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        if (item.answer === dropResult.correctAnswer.phrase) {
          console.log('dropResult.wordID', wordID);
          dropResult.correctAnswer.sendPass();
          await dropResult.correctAnswer.progressAssignment(wordID);
        } else {
          await dropResult.correctAnswer.sendFail(wordID);
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
        display: 'inline-block',
        cursor: 'move',
        opacity: opacity,
        borderRadius: '8px',
        whiteSpace: 'nowrap',
        border: '2px solid #90caf9',
        backgroundColor: '#fff',
        color: '#1976d2',
        fontWeight: 500,
        touchAction: 'none',
        transition: 'all 0.2s ease',
      }}>
      {answer}
    </Box>
  );
};
