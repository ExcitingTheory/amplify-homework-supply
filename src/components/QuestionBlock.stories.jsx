import React from 'react';
import { expect } from 'vitest';
import { within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionBlock from './QuestionBlock';

export default {
  title: '🧩 Components/Question Block',
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
  args: {
    block: createMockBlock(multipleChoiceQuestion),
    contentState: createMockContentState(multipleChoiceQuestion),
    blockProps: mockBlockProps,
    nodeKey: 'mock-node-key',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify all answer options are rendered
    await waitFor(() => {
      expect(canvas.getByText('Paris')).toBeInTheDocument();
      expect(canvas.getByText('London')).toBeInTheDocument();
      expect(canvas.getByText('Berlin')).toBeInTheDocument();
      expect(canvas.getByText('Madrid')).toBeInTheDocument();
    }, { timeout: 3000 });
  },
};

export const TrueFalse = {
  args: {
    block: createMockBlock(trueFalseQuestion),
    contentState: createMockContentState(trueFalseQuestion),
    blockProps: mockBlockProps,
    nodeKey: 'mock-node-key',
  },
};

export const ManyAnswers = {
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
