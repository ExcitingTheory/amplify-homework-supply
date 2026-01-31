import * as React from 'react';
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

export const DndWrapper = ({ children }) => {

  if (typeof window === 'undefined') {
    return (
      <>
        {children}
      </>
    );
  }
  return (
    <DndProvider options={HTML5toTouch}>
      {children}
    </DndProvider>
  );
};
