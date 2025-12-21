import React from 'react';
import { Easy } from './Easy';
import { Hard } from './Hard';
import { Learn } from './Learn';
import { DndWrapper } from './DndWrapper';

export default {
  title: 'Exercises/MeaningAssociation',
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <DndWrapper>
        <Story />
      </DndWrapper>
    ),
  ],
};

const sampleWords = [
  { id: '1', phrase: 'Hello', definition: 'A greeting' },
  { id: '2', phrase: 'Goodbye', definition: 'A farewell' },
  { id: '3', phrase: 'Thank you', definition: 'Expression of gratitude' },
  { id: '4', phrase: 'Please', definition: 'Polite request' },
];

const sampleTargets = {
  target1: { id: 'target1', phrase: 'Hello', definition: 'A greeting' },
  target2: { id: 'target2', phrase: 'Goodbye', definition: 'A farewell' },
};

// Easy Exercise Stories
export const EasyExercise = {
  render: () => {
    const [complete, setComplete] = React.useState(false);
    return (
      <Easy
        words={sampleWords}
        blockKey="easy-1"
        complete={complete}
        setComplete={setComplete}
        onSave={(data) => console.log('Saved:', data)}
      />
    );
  },
};

export const EasyExerciseCompleted = {
  render: () => {
    return (
      <Easy
        words={sampleWords}
        blockKey="easy-2"
        complete={true}
        setComplete={() => {}}
        onSave={(data) => console.log('Saved:', data)}
      />
    );
  },
};

// Hard Exercise Stories
export const HardExercise = {
  render: () => {
    const [complete, setComplete] = React.useState(false);
    return (
      <Hard
        words={sampleWords}
        blockKey="hard-1"
        complete={complete}
        setComplete={setComplete}
        onSave={(data) => console.log('Saved:', data)}
      />
    );
  },
};

export const HardExerciseCompleted = {
  render: () => {
    return (
      <Hard
        words={sampleWords}
        blockKey="hard-2"
        complete={true}
        setComplete={() => {}}
        onSave={(data) => console.log('Saved:', data)}
      />
    );
  },
};

// Learn Exercise Stories
export const LearnExercise = {
  render: () => {
    const [complete, setComplete] = React.useState(false);
    return (
      <Learn
        words={sampleWords}
        blockKey="learn-1"
        complete={complete}
        setComplete={setComplete}
        onSave={(data) => console.log('Saved:', data)}
      />
    );
  },
};

export const LearnExerciseCompleted = {
  render: () => {
    return (
      <Learn
        words={sampleWords}
        blockKey="learn-2"
        complete={true}
        setComplete={() => {}}
        onSave={(data) => console.log('Saved:', data)}
      />
    );
  },
};
