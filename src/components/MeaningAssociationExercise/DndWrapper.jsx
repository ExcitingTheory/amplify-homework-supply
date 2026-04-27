import * as React from 'react';
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

export const DndWrapper = ({ children }) => {

  if (typeof window === 'undefined') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
        {children}
      </div>
    );
  }
  return (
    <DndProvider options={HTML5toTouch}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </DndProvider>
  );
};
