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
      // boxShadow={3}
      boxShadow='0 0 3px rgba(0,0,0,0.1)'
      onTouchStart={onTouchMove}
      style={{
        fontSize: '1.2rem',
        margin: '.3rem',
        padding: '.6rem',
        display: 'inline-block',
        cursor: 'pointer',
        opacity: opacity,
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        border: `thin dotted #CCC`,
        touchAction: 'none'
      }}>
      {answer}
    </Box>
  );
};
