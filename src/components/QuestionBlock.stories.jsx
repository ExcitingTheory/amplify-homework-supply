import React from 'react';
import QuestionBlock from './QuestionBlock';
import UnitContext from '../context/unitContext';

export default {
  title: 'Components/QuestionBlock',
  component: QuestionBlock,
  parameters: {
    layout: 'padded',
  },
};

// Mock Draft.js objects
const createMockBlock = (content) => ({
  getKey: () => 'mock-block-key',
  getEntityAt: () => 'mock-entity-key',
  getData: () => ({ content }),
});

const createMockContentState = (content) => ({
  getEntity: (entityKey) => ({
    getData: () => ({ content }),
  }),
  mergeEntityData: (entityKey, data) => createMockContentState(data.content),
});

const mockBlockProps = {
  onStartEdit: (key) => console.log('Start edit:', key),
  onFinishEdit: (key, newContentState) => console.log('Finish edit:', key),
  onRemove: (key) => console.log('Remove:', key),
};

// Mock context provider
const MockUnitContext = ({ children }) => {
  const mockContext = {
    gutterRefs: {},
    grade: {
      data: {},
    },
    saveGrade: (data) => console.log('Save grade:', data),
  };

  return (
    <UnitContext.Provider value={mockContext}>
      {children}
    </UnitContext.Provider>
  );
};

const multipleChoiceQuestion = [
  { id: 'id-1', answer: 'Paris', correct: true },
  { id: 'id-2', answer: 'London', correct: false },
  { id: 'id-3', answer: 'Berlin', correct: false },
  { id: 'id-4', answer: 'Madrid', correct: false },
];

const trueFalseQuestion = [
  { id: 'id-1', answer: 'True', correct: true },
  { id: 'id-2', answer: 'False', correct: false },
];

export const MultipleChoice = {
  decorators: [
    (Story) => (
      <MockUnitContext>
        <Story />
      </MockUnitContext>
    ),
  ],
  args: {
    block: createMockBlock(multipleChoiceQuestion),
    contentState: createMockContentState(multipleChoiceQuestion),
    blockProps: mockBlockProps,
    nodeKey: 'mock-node-key',
  },
};

export const TrueFalse = {
  decorators: [
    (Story) => (
      <MockUnitContext>
        <Story />
      </MockUnitContext>
    ),
  ],
  args: {
    block: createMockBlock(trueFalseQuestion),
    contentState: createMockContentState(trueFalseQuestion),
    blockProps: mockBlockProps,
    nodeKey: 'mock-node-key',
  },
};

export const ManyAnswers = {
  decorators: [
    (Story) => (
      <MockUnitContext>
        <Story />
      </MockUnitContext>
    ),
  ],
  args: {
    block: createMockBlock([
      { id: 'id-1', answer: 'Answer 1', correct: false },
      { id: 'id-2', answer: 'Answer 2', correct: true },
      { id: 'id-3', answer: 'Answer 3', correct: false },
      { id: 'id-4', answer: 'Answer 4', correct: false },
      { id: 'id-5', answer: 'Answer 5', correct: false },
      { id: 'id-6', answer: 'Answer 6', correct: false },
    ]),
    contentState: createMockContentState([
      { id: 'id-1', answer: 'Answer 1', correct: false },
      { id: 'id-2', answer: 'Answer 2', correct: true },
      { id: 'id-3', answer: 'Answer 3', correct: false },
      { id: 'id-4', answer: 'Answer 4', correct: false },
      { id: 'id-5', answer: 'Answer 5', correct: false },
      { id: 'id-6', answer: 'Answer 6', correct: false },
    ]),
    blockProps: mockBlockProps,
    nodeKey: 'mock-node-key',
  },
};
