import React from 'react';
import SortableAnswers from './SortableAnswers';

export default {
  title: 'Components/SortableAnswers',
  component: SortableAnswers,
  parameters: {
    layout: 'padded',
  },
};

const mockAnswers = [
  { answer: 'Paris', correct: true },
  { answer: 'London', correct: false },
  { answer: 'Berlin', correct: false },
  { answer: 'Madrid', correct: false },
];

export const Default = {
  args: {
    answers: mockAnswers,
    onQuestionChange: (event, index) => {
      console.log('Question changed:', index, event.target.value);
    },
    onCorrectChange: (event, index) => {
      console.log('Correct changed:', index, event.target.checked);
    },
    onQuestionDelete: (index) => {
      console.log('Question deleted:', index);
    },
    onQuestionReorder: (newAnswers) => {
      console.log('Questions reordered:', newAnswers);
    },
  },
};

export const SingleAnswer = {
  args: {
    answers: [{ answer: 'Single answer', correct: true }],
    onQuestionChange: (event, index) => {
      console.log('Question changed:', index, event.target.value);
    },
    onCorrectChange: (event, index) => {
      console.log('Correct changed:', index, event.target.checked);
    },
    onQuestionDelete: (index) => {
      console.log('Question deleted:', index);
    },
    onQuestionReorder: (newAnswers) => {
      console.log('Questions reordered:', newAnswers);
    },
  },
};

export const ManyAnswers = {
  args: {
    answers: [
      { answer: 'Answer 1', correct: false },
      { answer: 'Answer 2', correct: true },
      { answer: 'Answer 3', correct: false },
      { answer: 'Answer 4', correct: false },
      { answer: 'Answer 5', correct: false },
      { answer: 'Answer 6', correct: false },
    ],
    onQuestionChange: (event, index) => {
      console.log('Question changed:', index, event.target.value);
    },
    onCorrectChange: (event, index) => {
      console.log('Correct changed:', index, event.target.checked);
    },
    onQuestionDelete: (index) => {
      console.log('Question deleted:', index);
    },
    onQuestionReorder: (newAnswers) => {
      console.log('Questions reordered:', newAnswers);
    },
  },
};
